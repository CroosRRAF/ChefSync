from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from django.utils import timezone
from django.http import JsonResponse
from django.db.models import Sum, Avg, Count, Q
from .models import Order, OrderItem, OrderStatusHistory, CartItem
from apps.food.models import FoodReview
from apps.payments.models import Payment
from .serializers import (
    OrderSerializer,
    OrderItemSerializer,
    OrderStatusHistorySerializer,
    CartItemSerializer
)

class OrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.all()
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['get'])
    def available(self, request):
        available_orders = self.queryset.filter(
            status='confirmed',
            delivery_partner=None
        )
        serializer = self.get_serializer(available_orders, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def accept(self, request, pk=None):
        order = self.get_object()
        if order.delivery_partner is not None:
            return Response({"error": "Order already taken"}, status=status.HTTP_400_BAD_REQUEST)

        order.delivery_partner = request.user  # assuming your User model is linked to delivery agents
        order.status = 'out_for_delivery'
        order.save()

        # Optionally add status history
        OrderStatusHistory.objects.create(
            order=order,
            status='out_for_delivery',
            changed_by=request.user,
            notes='Order accepted by delivery agent'
        )

        return Response({"success": "Order accepted"})


    @action(detail=True, methods=['patch'])
    def status(self, request, pk=None):
        order = self.get_object()
        new_status = request.data.get('status')
        if new_status not in ['picked_up', 'in_transit', 'delivered']:
            return Response({"error": "Invalid status"}, status=status.HTTP_400_BAD_REQUEST)

        order.status = new_status
        if new_status == 'delivered':
            order.actual_delivery_time = timezone.now()
        order.save()

        OrderStatusHistory.objects.create(
            order=order,
            status=new_status,
            changed_by=request.user,
            notes=f'Status changed to {new_status}'
        )

        return Response({"success": f"Order status updated to {new_status}"})


    @action(detail=False, methods=['get'])
    def history(self, request):
        completed_orders = Order.objects.filter(
            delivery_partner=request.user,
            status='delivered'
        )
        serializer = self.get_serializer(completed_orders, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def dashboard_summary(self, request):
        today = timezone.now().date()
        active_deliveries = Order.objects.filter(
            delivery_partner=request.user
        ).exclude(status='delivered').count()
        completed_today = Order.objects.filter(
            delivery_partner=request.user,
            status='delivered',
            updated_at__date=today
        ).count()
        todays_earnings = Order.objects.filter(
    delivery_partner=request.user,
    status='delivered',
    updated_at__date=today
).aggregate(total=Sum('delivery_fee'))['total'] or 0

        avg_time = Order.objects.filter(
            delivery_partner=request.user,
            status='delivered'
        ).exclude(actual_delivery_time__isnull=True)
        avg_time_minutes = 0
        if avg_time.exists():
            total_seconds = sum([(o.actual_delivery_time - o.created_at).total_seconds() for o in avg_time])
            avg_time_minutes = total_seconds / 60 / avg_time.count()

        return Response({
            "active_deliveries": active_deliveries,
            "completed_today": completed_today,
            "todays_earnings": float(todays_earnings),
            "avg_delivery_time_min": round(avg_time_minutes, 1)
        })


class OrderItemViewSet(viewsets.ModelViewSet):
    queryset = OrderItem.objects.all()
    serializer_class = OrderItemSerializer
    permission_classes = [IsAuthenticated]


class OrderStatusHistoryViewSet(viewsets.ModelViewSet):
    queryset = OrderStatusHistory.objects.all()
    serializer_class = OrderStatusHistorySerializer
    permission_classes = [IsAuthenticated]


class CartItemViewSet(viewsets.ModelViewSet):
    queryset = CartItem.objects.all()
    serializer_class = CartItemSerializer
    permission_classes = [IsAuthenticated]


# Chef Dashboard API Views
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def chef_dashboard_stats(request):
    """
    API endpoint that returns counts of completed orders, active orders, bulk orders, and reviews from the database
    Used to replace hardcoded stats in the React TypeScript Home component
    """
    try:
        # Get the current chef (assuming the requesting user is a chef)
        chef = request.user
        today = timezone.now().date()
        current_month = timezone.now().month
        current_year = timezone.now().year
        
        # Count different order types for this chef
        chef_orders = Order.objects.filter(chef=chef)
        
        # Calculate main stats
        stats = {
            "orders_completed": chef_orders.filter(status__in=['delivered']).count(),
            "orders_active": chef_orders.filter(
                status__in=['confirmed', 'preparing', 'ready', 'out_for_delivery']
            ).count(),
            "bulk_orders": chef_orders.filter(
                # Assuming bulk orders have multiple items or a specific field
                # You can adjust this logic based on your bulk order definition
                items__quantity__gte=5
            ).distinct().count(),
            "total_reviews": FoodReview.objects.filter(
                price__cook=chef
            ).count(),
            "average_rating": float(
                FoodReview.objects.filter(
                    price__cook=chef
                ).aggregate(avg=Avg("rating"))["avg"] or 0
            ),
            "today_revenue": float(
                Payment.objects.filter(
                    order__chef=chef,
                    status='completed',
                    created_at__date=today
                ).aggregate(total=Sum("amount"))["total"] or 0
            ),
            "pending_orders": chef_orders.filter(status='pending').count(),
            "monthly_orders": chef_orders.filter(
                created_at__month=current_month,
                created_at__year=current_year
            ).count(),
            "customer_satisfaction": 94,  # Placeholder - can be calculated from reviews later
        }
        
        return JsonResponse(stats)
        
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def chef_recent_reviews(request):
    """
    API endpoint that returns recent customer reviews for the chef
    """
    try:
        chef = request.user
        
        # Get recent reviews for this chef's food items
        reviews = FoodReview.objects.filter(
            price__cook=chef
        ).select_related('customer', 'price', 'order').order_by('-created_at')[:10]
        
        reviews_data = []
        for review in reviews:
            reviews_data.append({
                "customer": review.customer.get_full_name() or review.customer.username,
                "rating": review.rating,
                "comment": review.comment or "No comment provided",
                "dish": review.price.food.name,
                "time": review.created_at.strftime("%H:%M %d/%m/%Y"),
                "order_id": review.order.order_number if review.order else "N/A"
            })
        
        return JsonResponse(reviews_data, safe=False)
        
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def chef_recent_activity(request):
    """
    API endpoint that returns recent activity feed for the chef dashboard
    """
    try:
        chef = request.user
        activities = []
        
        # Get recent orders
        recent_orders = Order.objects.filter(
            chef=chef
        ).order_by('-created_at')[:5]
        
        for order in recent_orders:
            time_ago = timezone.now() - order.created_at
            if time_ago.days > 0:
                time_str = f"{time_ago.days} day{'s' if time_ago.days > 1 else ''} ago"
            elif time_ago.seconds > 3600:
                hours = time_ago.seconds // 3600
                time_str = f"{hours} hour{'s' if hours > 1 else ''} ago"
            else:
                minutes = time_ago.seconds // 60
                time_str = f"{minutes} minute{'s' if minutes > 1 else ''} ago"
            
            activities.append({
                "action": f"New order received from {order.customer.get_full_name() or order.customer.username}",
                "time": time_str,
                "type": "order"
            })
        
        # Get recent reviews
        recent_reviews = FoodReview.objects.filter(
            price__cook=chef
        ).order_by('-created_at')[:3]
        
        for review in recent_reviews:
            time_ago = timezone.now() - review.created_at
            if time_ago.days > 0:
                time_str = f"{time_ago.days} day{'s' if time_ago.days > 1 else ''} ago"
            elif time_ago.seconds > 3600:
                hours = time_ago.seconds // 3600
                time_str = f"{hours} hour{'s' if hours > 1 else ''} ago"
            else:
                minutes = time_ago.seconds // 60
                time_str = f"{minutes} minute{'s' if minutes > 1 else ''} ago"
            
            activities.append({
                "action": f"{review.rating}-star review received for {review.price.food.name}",
                "time": time_str,
                "type": "review"
            })
        
        # Get recent completed orders
        completed_orders = Order.objects.filter(
            chef=chef,
            status='delivered'
        ).order_by('-updated_at')[:3]
        
        for order in completed_orders:
            time_ago = timezone.now() - order.updated_at
            if time_ago.days > 0:
                time_str = f"{time_ago.days} day{'s' if time_ago.days > 1 else ''} ago"
            elif time_ago.seconds > 3600:
                hours = time_ago.seconds // 3600
                time_str = f"{hours} hour{'s' if hours > 1 else ''} ago"
            else:
                minutes = time_ago.seconds // 60
                time_str = f"{minutes} minute{'s' if minutes > 1 else ''} ago"
            
            activities.append({
                "action": f"Order #{order.order_number} marked as completed",
                "time": time_str,
                "type": "success"
            })
        
        # Sort activities by most recent first
        # Since we can't easily sort by actual datetime, we'll return them in order
        return JsonResponse(activities[:8], safe=False)
        
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)