from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from django.utils import timezone
from django.http import JsonResponse
from django.db.models import Sum, Avg, Count, Q
from .models import Order, OrderItem, OrderStatusHistory, CartItem
from .serializers import CartItemSerializer
from apps.food.models import FoodReview
from apps.payments.models import Payment
from rest_framework import serializers
from django.contrib.auth import get_user_model

User = get_user_model()

# Temporary simple serializer to fix the 500 error
class SimpleOrderSerializer(serializers.ModelSerializer):
    """Simple order serializer that works"""
    customer_name = serializers.SerializerMethodField()
    chef_name = serializers.SerializerMethodField() 
    time_since_order = serializers.SerializerMethodField()
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    total_items = serializers.SerializerMethodField()
    
    class Meta:
        model = Order
        fields = [
            'id', 'order_number', 'status', 'status_display',
            'total_amount', 'delivery_fee', 'created_at', 'updated_at',
            'customer_name', 'chef_name', 'time_since_order', 'total_items',
            'delivery_address', 'customer_notes', 'chef_notes'
        ]
    
    def get_customer_name(self, obj):
        if obj.customer:
            return obj.customer.name or f"{obj.customer.first_name} {obj.customer.last_name}".strip() or obj.customer.username
        return "Unknown Customer"
    
    def get_chef_name(self, obj):
        if obj.chef:
            return obj.chef.name or f"{obj.chef.first_name} {obj.chef.last_name}".strip() or obj.chef.username
        return "Unknown Chef"
    
    def get_time_since_order(self, obj):
        from django.utils import timezone
        diff = timezone.now() - obj.created_at
        minutes = int(diff.total_seconds() / 60)
        if minutes < 60:
            return f"{minutes} minutes ago"
        elif minutes < 1440:
            hours = int(minutes / 60)
            return f"{hours} hours ago"
        else:
            days = int(minutes / 1440)
            return f"{days} days ago"
    
    def get_total_items(self, obj):
        return obj.items.aggregate(total=Sum('quantity'))['total'] or 0

class OrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.all()
    serializer_class = SimpleOrderSerializer  # Use our working simple serializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter orders based on user role"""
        user = self.request.user
        queryset = super().get_queryset().order_by('-created_at')
        
        # Handle anonymous users (return empty queryset for security)
        if not user.is_authenticated:
            return queryset.none()
        
        # For chefs, only show their own orders
        if (hasattr(user, 'chef_profile') or 
            user.groups.filter(name='Chefs').exists() or 
            (hasattr(user, 'role') and user.role == 'cook')):
            return queryset.filter(chef=user)
        # For delivery partners, show available and assigned orders
        elif (hasattr(user, 'delivery_profile') or 
              user.groups.filter(name='Delivery').exists() or 
              (hasattr(user, 'role') and user.role == 'delivery_agent')):
            return queryset.filter(
                Q(delivery_partner=user) | Q(status='ready', delivery_partner__isnull=True)
            )
        # For admins, show all orders
        elif user.is_staff or user.is_superuser or (hasattr(user, 'role') and user.role == 'admin'):
            return queryset
        # For customers, show their own orders
        else:
            return queryset.filter(customer=user)

    @action(detail=False, methods=['get'])
    def available(self, request):
        available_orders = Order.objects.filter(
            status='ready',
            delivery_partner__isnull=True
        ).order_by('-created_at')
        serializer = self.get_serializer(available_orders, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def accept(self, request, pk=None):
        order = self.get_object()
        if order.delivery_partner is not None:
            return Response({"error": "Order already taken"}, status=status.HTTP_400_BAD_REQUEST)

        # Get delivery agent's current location for distance checking
        agent_lat = request.data.get('agent_latitude')
        agent_lng = request.data.get('agent_longitude')
        
        if agent_lat is None or agent_lng is None:
            return Response({
                "error": "Location required", 
                "message": "Please enable location access to accept orders"
            }, status=status.HTTP_400_BAD_REQUEST)

        # Get chef location (pickup location) - we'll need to get this from chef's profile
        # For now, let's assume the chef location is passed or we get a default
        chef_lat = request.data.get('chef_latitude')
        chef_lng = request.data.get('chef_longitude')
        
        # If chef location is provided, calculate distance
        if chef_lat is not None and chef_lng is not None:
            from math import radians, sin, cos, sqrt, atan2
            
            # Calculate distance using Haversine formula
            def calculate_distance(lat1, lon1, lat2, lon2):
                R = 6371  # Earth's radius in kilometers
                
                lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
                dlat = lat2 - lat1
                dlon = lon2 - lon1
                
                a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
                c = 2 * atan2(sqrt(a), sqrt(1-a))
                distance = R * c
                
                return distance
            
            distance_km = calculate_distance(float(agent_lat), float(agent_lng), float(chef_lat), float(chef_lng))
            
            # Check if distance is greater than 10km
            if distance_km > 10:
                return Response({
                    "warning": "Distance exceeds 10km",
                    "distance": round(distance_km, 2),
                    "message": f"Pickup location is {round(distance_km, 2)}km away. This is beyond the recommended 10km range.",
                    "allow_accept": True  # Still allow acceptance but with warning
                }, status=status.HTTP_200_OK)

        order.delivery_partner = request.user
        order.status = 'out_for_delivery'
        order.save()

        # Add status history
        OrderStatusHistory.objects.create(
            order=order,
            status='out_for_delivery',
            changed_by=request.user,
            notes='Order accepted by delivery agent'
        )

        return Response({
            "success": "Order accepted successfully",
            "order_id": order.id,
            "status": "out_for_delivery"
        })
    
    @action(detail=True, methods=['post'])
    def chef_accept(self, request, pk=None):
        """Chef accepts a pending order"""
        order = self.get_object()
        
        # Check if user is the chef for this order
        if order.chef != request.user:
            return Response({"error": "You are not authorized to accept this order"}, status=status.HTTP_403_FORBIDDEN)
        
        if order.status != 'pending':
            return Response({"error": "Order cannot be accepted in current status"}, status=status.HTTP_400_BAD_REQUEST)
        
        # Update order status to confirmed
        order.status = 'confirmed'
        order.chef_notes = request.data.get('notes', 'Order accepted by chef')
        order.save()
        
        # Add status history
        OrderStatusHistory.objects.create(
            order=order,
            status='confirmed',
            changed_by=request.user,
            notes=order.chef_notes
        )
        
        return Response({"success": "Order accepted successfully", "status": "confirmed"})
    
    @action(detail=True, methods=['post'])
    def chef_reject(self, request, pk=None):
        """Chef rejects a pending order with reason"""
        order = self.get_object()
        
        # Check if user is the chef for this order
        if order.chef != request.user:
            return Response({"error": "You are not authorized to reject this order"}, status=status.HTTP_403_FORBIDDEN)
        
        if order.status != 'pending':
            return Response({"error": "Order cannot be rejected in current status"}, status=status.HTTP_400_BAD_REQUEST)
        
        rejection_reason = request.data.get('reason', '')
        if not rejection_reason:
            return Response({"error": "Rejection reason is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        # Update order status to cancelled
        order.status = 'cancelled'
        order.chef_notes = f"Order rejected: {rejection_reason}"
        order.save()
        
        # Add status history
        OrderStatusHistory.objects.create(
            order=order,
            status='cancelled',
            changed_by=request.user,
            notes=order.chef_notes
        )
        
        return Response({"success": "Order rejected successfully", "status": "cancelled"})


    @action(detail=True, methods=['patch'])
    def status(self, request, pk=None):
        order = self.get_object()
        new_status = request.data.get('status')
        
        # Define valid status transitions for delivery agents
        valid_delivery_statuses = ['picked_up', 'in_transit', 'delivered']
        
        if new_status not in valid_delivery_statuses:
            return Response({"error": "Invalid status"}, status=status.HTTP_400_BAD_REQUEST)

        # Check if user is authorized to update this order
        if order.delivery_partner != request.user:
            return Response({"error": "You are not authorized to update this order"}, status=status.HTTP_403_FORBIDDEN)

        # Validate status transitions
        current_status = order.status
        if new_status == 'picked_up' and current_status not in ['out_for_delivery', 'ready']:
            return Response({"error": "Invalid status transition"}, status=status.HTTP_400_BAD_REQUEST)
        elif new_status == 'in_transit' and current_status not in ['picked_up', 'out_for_delivery']:
            return Response({"error": "Invalid status transition"}, status=status.HTTP_400_BAD_REQUEST)
        elif new_status == 'delivered' and current_status not in ['in_transit']:
            return Response({"error": "Invalid status transition"}, status=status.HTTP_400_BAD_REQUEST)

        # Get additional data
        notes = request.data.get('notes', f'Status changed to {new_status}')
        location = request.data.get('location', {})

        order.status = new_status
        if new_status == 'delivered':
            order.actual_delivery_time = timezone.now()
        order.save()

        OrderStatusHistory.objects.create(
            order=order,
            status=new_status,
            changed_by=request.user,
            notes=notes
        )

        return Response({
            "success": f"Order status updated to {new_status}",
            "order_id": order.id,
            "status": new_status
        })
    
    @action(detail=True, methods=['patch'])
    def chef_update_status(self, request, pk=None):
        """Chef updates order status through the kitchen workflow"""
        order = self.get_object()
        
        # Check if user is the chef for this order
        if order.chef != request.user:
            return Response({"error": "You are not authorized to update this order"}, status=status.HTTP_403_FORBIDDEN)
        
        new_status = request.data.get('status')
        chef_notes = request.data.get('notes', '')
        
        # Define valid status transitions for chef workflow
        valid_transitions = {
            'confirmed': 'preparing',
            'preparing': 'ready',
            'ready': 'out_for_delivery'
        }
        
        if order.status not in valid_transitions:
            return Response({"error": "Order status cannot be updated from current state"}, status=status.HTTP_400_BAD_REQUEST)
        
        expected_status = valid_transitions.get(order.status)
        if new_status != expected_status:
            return Response({"error": f"Invalid status transition. Expected: {expected_status}"}, status=status.HTTP_400_BAD_REQUEST)
        
        # Update order
        order.status = new_status
        if chef_notes:
            order.chef_notes = chef_notes
        order.save()
        
        # Add status history
        OrderStatusHistory.objects.create(
            order=order,
            status=new_status,
            changed_by=request.user,
            notes=chef_notes or f'Status updated to {new_status}'
        )
        
        return Response({"success": f"Order status updated to {new_status}", "status": new_status})


    @action(detail=False, methods=['get'])
    def history(self, request):
        completed_orders = Order.objects.filter(
            delivery_partner=request.user,
            status='delivered'
        ).order_by('-updated_at')
        serializer = self.get_serializer(completed_orders, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def dashboard_summary(self, request):
        today = timezone.now().date()
        
        # Get delivery partner's orders
        delivery_orders = Order.objects.filter(delivery_partner=request.user)
        
        active_deliveries = delivery_orders.exclude(status__in=['delivered', 'cancelled']).count()
        completed_today = delivery_orders.filter(
            status='delivered',
            updated_at__date=today
        ).count()
        todays_earnings = delivery_orders.filter(
            status='delivered',
            updated_at__date=today
        ).aggregate(total=Sum('delivery_fee'))['total'] or 0

        # Calculate average delivery time
        completed_orders = delivery_orders.filter(
            status='delivered'
        ).exclude(actual_delivery_time__isnull=True)
        
        avg_time_minutes = 0
        if completed_orders.exists():
            total_seconds = sum([
                (order.actual_delivery_time - order.created_at).total_seconds() 
                for order in completed_orders 
                if order.actual_delivery_time
            ])
            avg_time_minutes = total_seconds / 60 / completed_orders.count()

        return Response({
            "active_deliveries": active_deliveries,
            "completed_today": completed_today,
            "todays_earnings": float(todays_earnings),
            "avg_delivery_time_min": round(avg_time_minutes, 1)
        })


# Temporarily disabled other ViewSets to fix 500 error
# Will be re-enabled once serializers are fixed

# class OrderItemViewSet(viewsets.ModelViewSet):
#     queryset = OrderItem.objects.all()
#     serializer_class = OrderItemSerializer
#     permission_classes = [IsAuthenticated]


# class OrderStatusHistoryViewSet(viewsets.ModelViewSet):
#     queryset = OrderStatusHistory.objects.all()
#     serializer_class = OrderStatusHistorySerializer
#     permission_classes = [IsAuthenticated]


class CartItemViewSet(viewsets.ModelViewSet):
    queryset = CartItem.objects.all()
    serializer_class = CartItemSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter cart items to only show the current user's items"""
        return CartItem.objects.filter(customer=self.request.user)
    
    @action(detail=False, methods=['post'])
    def add_to_cart(self, request):
        """Add an item to the cart or update quantity if it already exists"""
        try:
            price_id = request.data.get('price_id')
            quantity = request.data.get('quantity', 1)
            special_instructions = request.data.get('special_instructions', '')
            
            if not price_id:
                return Response(
                    {'error': 'price_id is required'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Check if item already exists in cart
            cart_item, created = CartItem.objects.get_or_create(
                customer=request.user,
                price_id=price_id,  # Django will automatically map this to the FoodPrice primary key
                defaults={
                    'quantity': quantity,
                    'special_instructions': special_instructions
                }
            )
            
            if not created:
                # Item exists, update quantity
                cart_item.quantity += quantity
                cart_item.save()
            
            serializer = self.get_serializer(cart_item)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def cart_summary(self, request):
        """Get cart summary with total price and items"""
        try:
            cart_items = self.get_queryset()
            total_price = sum(item.total_price for item in cart_items)
            total_items = sum(item.quantity for item in cart_items)
            
            serializer = self.get_serializer(cart_items, many=True)
            
            return Response({
                'total_value': total_price,  # Changed from total_price to total_value
                'total_items': total_items,
                'cart_items': serializer.data
            })
        except Exception as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['delete'])
    def clear_cart(self, request):
        """Clear all items from the cart"""
        try:
            deleted_count = self.get_queryset().delete()[0]
            return Response({
                'message': f'Removed {deleted_count} items from cart'
            })
        except Exception as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


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

    @action(detail=True, methods=['post'])
    def mark_picked_up(self, request, pk=None):
        """Delivery agent marks order as picked up from chef"""
        order = self.get_object()
        
        # Check if user is the assigned delivery partner
        if order.delivery_partner != request.user:
            return Response({"error": "You are not authorized to update this order"}, status=status.HTTP_403_FORBIDDEN)
        
        # Check if order is in correct status
        if order.status not in ['out_for_delivery', 'ready']:
            return Response({"error": "Order cannot be marked as picked up in current status"}, status=status.HTTP_400_BAD_REQUEST)
        
        # Get pickup location and notes
        pickup_location = request.data.get('pickup_location', {})
        notes = request.data.get('notes', 'Order picked up from chef')
        
        # Update order status
        order.status = 'in_transit'
        order.save()
        
        # Add status history
        OrderStatusHistory.objects.create(
            order=order,
            status='in_transit',
            changed_by=request.user,
            notes=notes
        )
        
        return Response({
            "success": "Order marked as picked up successfully",
            "order_id": order.id,
            "status": "in_transit"
        })
    
    @action(detail=True, methods=['get'])
    def chef_location(self, request, pk=None):
        """Get chef location details for navigation"""
        order = self.get_object()
        
        # Check if user is the assigned delivery partner
        if order.delivery_partner != request.user:
            return Response({"error": "You are not authorized to access this information"}, status=status.HTTP_403_FORBIDDEN)
        
        chef = order.chef
        if not chef:
            return Response({"error": "No chef assigned to this order"}, status=status.HTTP_404_NOT_FOUND)
        
        # Try to get chef's location from various sources
        chef_location = {}
        
        # First, try to get from user's address
        if chef.address:
            chef_location['address'] = chef.address
        
        # Try to get from chef profile if exists
        if hasattr(chef, 'chef_profile'):
            profile = chef.chef_profile
            if hasattr(profile, 'service_location') and profile.service_location:
                chef_location['service_location'] = profile.service_location
        
        # Get basic chef info
        chef_info = {
            'id': chef.id,
            'name': chef.name or f"{chef.first_name} {chef.last_name}".strip() or chef.username,
            'phone': chef.phone_no,
            'email': chef.email,
            'location': chef_location
        }
        
        return Response({
            'chef': chef_info,
            'order_id': order.id,
            'pickup_address': chef_location.get('address') or chef_location.get('service_location', 'Address not available')
        })