
from django.db.models import Sum, Count, Avg
from django.http import JsonResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .models import Order, Delivery, DeliveryReview
from apps.food.models import FoodReview, FoodPrice
from .serializers import DeliveryReviewSerializer, FoodReviewSerializer

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def customer_dashboard_stats(request):
    """
    Provides statistics for the logged-in customer's dashboard.
    """
    customer = request.user

    # Filter orders for the current customer
    customer_orders = Order.objects.filter(customer=customer)

    # Calculate stats
    total_orders = customer_orders.count()
    completed_orders = customer_orders.filter(status='delivered').count()
    pending_orders = total_orders - completed_orders
    total_spent = customer_orders.filter(status='delivered').aggregate(total=Sum('total_amount'))['total'] or 0
    average_order_value = customer_orders.filter(status='delivered').aggregate(avg=Avg('total_amount'))['avg'] or 0

    # Get recent orders
    recent_orders_data = customer_orders.order_by('-created_at')[:5]
    recent_orders = [
        {
            "id": order.id,
            "order_number": order.order_number,
            "total_amount": order.total_amount,
            "status": order.status,
            "created_at": order.created_at,
        }
        for order in recent_orders_data
    ]
    
    # Note: favorite_cuisines is not implemented as it requires more complex logic
    # involving related OrderItems and FoodItems. Returning an empty list for now.
    favorite_cuisines = []

    stats = {
        'total_orders': total_orders,
        'completed_orders': completed_orders,
        'pending_orders': pending_orders,
        'total_spent': total_spent,
        'average_order_value': average_order_value,
        'recent_orders': recent_orders,
        'favorite_cuisines': favorite_cuisines,
    }

    return JsonResponse(stats)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def submit_food_review(request):
    """
    Submit a review for food/cook from a delivered order.
    Requires: order_id, cook_id, rating, comment, taste_rating, presentation_rating, value_rating
    """
    customer = request.user
    
    # Validate required fields
    order_id = request.data.get('order_id')
    cook_id = request.data.get('cook_id')
    rating = request.data.get('rating')
    comment = request.data.get('comment', '')
    taste_rating = request.data.get('taste_rating')
    presentation_rating = request.data.get('presentation_rating')
    value_rating = request.data.get('value_rating')
    
    if not all([order_id, cook_id, rating]):
        return Response(
            {'error': 'order_id, cook_id, and rating are required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Validate order exists and belongs to customer
    try:
        order = Order.objects.get(id=order_id, customer=customer)
    except Order.DoesNotExist:
        return Response(
            {'error': 'Order not found or does not belong to you'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Check if order is delivered
    if order.status != 'delivered':
        return Response(
            {'error': 'You can only review delivered orders'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Verify cook_id matches the chef of the order
    if order.chef.user_id != int(cook_id):
        return Response(
            {'error': 'Cook ID does not match the order chef'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Get first food price from the order items (for price field requirement)
    order_items = order.items.all()
    if not order_items.exists():
        return Response(
            {'error': 'No items found in order'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    first_item = order_items.first()
    food_price = first_item.price
    
    # Check if review already exists
    existing_review = FoodReview.objects.filter(
        customer=customer,
        order=order,
        price=food_price
    ).first()
    
    if existing_review:
        return Response(
            {'error': 'You have already reviewed this order'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Create the review
    food_review = FoodReview.objects.create(
        customer=customer,
        order=order,
        price=food_price,
        rating=rating,
        comment=comment,
        taste_rating=taste_rating,
        presentation_rating=presentation_rating,
        value_rating=value_rating,
        is_verified_purchase=True
    )
    
    serializer = FoodReviewSerializer(food_review)
    return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def submit_delivery_review(request):
    """
    Submit a review for delivery agent from a delivered order.
    Requires: order_id, delivery_agent_id, rating, comment
    """
    customer = request.user
    
    # Validate required fields
    order_id = request.data.get('order_id')
    delivery_agent_id = request.data.get('delivery_agent_id')
    rating = request.data.get('rating')
    comment = request.data.get('comment', '')
    
    if not all([order_id, delivery_agent_id, rating]):
        return Response(
            {'error': 'order_id, delivery_agent_id, and rating are required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Validate order exists and belongs to customer
    try:
        order = Order.objects.get(id=order_id, customer=customer)
    except Order.DoesNotExist:
        return Response(
            {'error': 'Order not found or does not belong to you'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Check if order is delivered
    if order.status != 'delivered':
        return Response(
            {'error': 'You can only review delivered orders'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Verify delivery_agent_id matches the delivery partner of the order
    if not order.delivery_partner or order.delivery_partner.user_id != int(delivery_agent_id):
        return Response(
            {'error': 'Delivery agent ID does not match the order or no delivery agent assigned'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Get or create delivery record
    delivery, created = Delivery.objects.get_or_create(
        order=order,
        defaults={
            'agent': order.delivery_partner,
            'address': order.delivery_address,
            'status': 'Delivered'
        }
    )
    
    # Check if review already exists
    existing_review = DeliveryReview.objects.filter(
        customer=customer,
        delivery=delivery
    ).first()
    
    if existing_review:
        return Response(
            {'error': 'You have already reviewed this delivery'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Create the review
    delivery_review = DeliveryReview.objects.create(
        customer=customer,
        delivery=delivery,
        rating=rating,
        comment=comment
    )
    
    serializer = DeliveryReviewSerializer(delivery_review)
    return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_order_review_status(request, order_id):
    """
    Check if customer has already submitted reviews for an order.
    Returns: {has_food_review: bool, has_delivery_review: bool, can_review: bool}
    """
    customer = request.user
    
    try:
        order = Order.objects.get(id=order_id, customer=customer)
    except Order.DoesNotExist:
        return Response(
            {'error': 'Order not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    can_review = order.status == 'delivered'
    
    # Check food review
    has_food_review = False
    if order.items.exists():
        first_item = order.items.first()
        has_food_review = FoodReview.objects.filter(
            customer=customer,
            order=order,
            price=first_item.price
        ).exists()
    
    # Check delivery review
    has_delivery_review = False
    try:
        delivery = Delivery.objects.get(order=order)
        has_delivery_review = DeliveryReview.objects.filter(
            customer=customer,
            delivery=delivery
        ).exists()
    except Delivery.DoesNotExist:
        pass
    
    return Response({
        'can_review': can_review,
        'has_food_review': has_food_review,
        'has_delivery_review': has_delivery_review,
        'order_status': order.status,
        'chef_id': order.chef.user_id if order.chef else None,
        'chef_name': order.chef.name if order.chef else None,
        'delivery_agent_id': order.delivery_partner.user_id if order.delivery_partner else None,
        'delivery_agent_name': order.delivery_partner.name if order.delivery_partner else None,
    })
