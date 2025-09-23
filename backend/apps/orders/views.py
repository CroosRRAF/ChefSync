from rest_framework import viewsets, permissions, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q, Count, Sum, Avg
from django.utils import timezone
from datetime import datetime, timedelta
from apps.orders.models import Order
from apps.orders.serializers import OrderSerializer

# Local imports
from apps.orders.models import Order, OrderItem, OrderStatusHistory, CartItem
from apps.orders.serializers import (
    OrderDetailSerializer, OrderListSerializer, OrderItemDetailSerializer, 
    OrderStatusHistorySerializer, CartItemSerializer, OrderStatsSerializer,
    BulkOrderActionSerializer
)
from apps.users.models import ChefProfile


class OrderViewSet(viewsets.ModelViewSet):
    """Enhanced order management with filtering and search"""
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'list':
            return OrderListSerializer
        return OrderDetailSerializer
    
    def get_queryset(self):
        queryset = Order.objects.select_related('customer', 'chef').prefetch_related('items', 'status_history')
        
        # Filter by status
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # Filter by date range
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')
        if date_from:
            queryset = queryset.filter(created_at__gte=date_from)
        if date_to:
            queryset = queryset.filter(created_at__lte=date_to)
        
        # Filter by chef
        chef_id = self.request.query_params.get('chef_id')
        if chef_id:
            queryset = queryset.filter(chef_id=chef_id)
        
        # Search functionality
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(order_number__icontains=search) |
                Q(customer__username__icontains=search) |
                Q(customer__first_name__icontains=search) |
                Q(customer__last_name__icontains=search) |
                Q(delivery_address__icontains=search) |
                Q(items__price__food__name__icontains=search)
            ).distinct()
        
        return queryset.order_by('-created_at')

    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        """Update order status with history tracking"""
        order = self.get_object()
        new_status = request.data.get('status')
        notes = request.data.get('notes', '')
        
        if new_status not in dict(Order.ORDER_STATUS_CHOICES):
            return Response(
                {'error': 'Invalid status'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create status history entry
        OrderStatusHistory.objects.create(
            order=order,
            status=new_status,
            changed_by=request.user,
            notes=notes
        )
        
        # Update order status
        order.status = new_status
        order.save()
        
        return Response(OrderDetailSerializer(order).data)

    @action(detail=False, methods=['post'])
    def bulk_action(self, request):
        """Handle bulk operations on orders"""
        serializer = BulkOrderActionSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        data = serializer.validated_data
        order_ids = data['order_ids']
        action_type = data['action']
        
        orders = Order.objects.filter(id__in=order_ids)
        
        if action_type == 'assign_chef':
            chef_id = data.get('chef_id')
            if not chef_id:
                return Response(
                    {'error': 'chef_id is required for assign_chef action'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            try:
                chef_profile = ChefProfile.objects.get(id=chef_id)
                chef_user = chef_profile.user
            except ChefProfile.DoesNotExist:
                return Response(
                    {'error': 'Chef not found'}, 
                    status=status.HTTP_404_NOT_FOUND
                )
            
            orders.update(chef=chef_user)
            
            # Create status history for each order
            for order in orders:
                OrderStatusHistory.objects.create(
                    order=order,
                    status=order.status,
                    changed_by=request.user,
                    notes=f"Assigned to chef: {chef_user.get_full_name()}"
                )
            
            return Response({'message': f'{orders.count()} orders assigned to chef'})
        
        elif action_type == 'update_status':
            new_status = data.get('new_status')
            if not new_status:
                return Response(
                    {'error': 'new_status is required for update_status action'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            notes = data.get('notes', '')
            orders.update(status=new_status)
            
            # Create status history for each order
            for order in orders:
                OrderStatusHistory.objects.create(
                    order=order,
                    status=new_status,
                    changed_by=request.user,
                    notes=notes
                )
            
            return Response({'message': f'{orders.count()} orders updated to {new_status}'})
        
        elif action_type == 'delete':
            count = orders.count()
            orders.delete()
            return Response({'message': f'{count} orders deleted'})
        
        elif action_type == 'export':
            # Return order data for export
            serializer = OrderListSerializer(orders, many=True)
            return Response({'orders': serializer.data})
        
        return Response({'error': 'Invalid action'}, status=status.HTTP_400_BAD_REQUEST)


class ChefDashboardViewSet(viewsets.ReadOnlyModelViewSet):
    """Chef-specific dashboard with order management"""
    serializer_class = OrderListSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        # Get chef profile for the current user
        try:
            chef_profile = ChefProfile.objects.get(user=self.request.user)
            return Order.objects.filter(chef=self.request.user).select_related('customer', 'chef').prefetch_related('items')
        except ChefProfile.DoesNotExist:
            return Order.objects.none()
    
    @action(detail=False, methods=['get'])
    def dashboard_stats(self, request):
        """Get comprehensive dashboard statistics"""
        chef_orders = self.get_queryset()
        today = timezone.now().date()
        
        # Basic counts
        total_orders = chef_orders.count()
        pending_orders = chef_orders.filter(status='pending').count()
        preparing_orders = chef_orders.filter(status='preparing').count()
        ready_orders = chef_orders.filter(status='ready').count()
        completed_today = chef_orders.filter(
            status='delivered', 
            updated_at__date=today
        ).count()
        
        # Revenue calculation
        today_revenue = chef_orders.filter(
            status='delivered',
            updated_at__date=today
        ).aggregate(total=Sum('total_amount'))['total'] or 0
        
        # Average preparation time (mock calculation)
        avg_prep_time = 25.5  # This would need actual time tracking
        
        # Customer count
        total_customers = chef_orders.values('customer').distinct().count()
        
        # Status distribution for charts
        status_distribution = chef_orders.values('status').annotate(
            count=Count('id')
        ).order_by('status')
        
        # Recent orders (last 10)
        recent_orders = chef_orders.order_by('-created_at')[:10]
        
        # Monthly revenue trend (last 6 months)
        monthly_revenue = []
        for i in range(6):
            month_start = today.replace(day=1) - timedelta(days=30*i)
            month_end = month_start + timedelta(days=30)
            revenue = chef_orders.filter(
                status='delivered',
                updated_at__date__range=[month_start, month_end]
            ).aggregate(total=Sum('total_amount'))['total'] or 0
            monthly_revenue.append({
                'month': month_start.strftime('%B'),
                'revenue': float(revenue)
            })
        
        stats_data = {
            'total_orders': total_orders,
            'pending_orders': pending_orders,
            'preparing_orders': preparing_orders,
            'ready_orders': ready_orders,
            'completed_orders': completed_today,
            'today_revenue': float(today_revenue),
            'average_prep_time': avg_prep_time,
            'total_customers': total_customers,
            'status_distribution': list(status_distribution),
            'recent_orders': OrderListSerializer(recent_orders, many=True).data,
            'monthly_revenue': monthly_revenue[::-1]  # Reverse to show oldest first
        }
        
        return Response(stats_data)
    
    @action(detail=False, methods=['get'])
    def active_orders(self, request):
        """Get orders that need attention (pending, preparing, ready)"""
        active_statuses = ['pending', 'confirmed', 'preparing', 'ready']
        orders = self.get_queryset().filter(status__in=active_statuses).order_by('created_at')
        
        # Group by status
        grouped_orders = {}
        for status_choice in active_statuses:
            grouped_orders[status_choice] = OrderListSerializer(
                orders.filter(status=status_choice), 
                many=True
            ).data
        
        return Response(grouped_orders)
    
    @action(detail=False, methods=['post'])
    def accept_order(self, request):
        """Accept a pending order"""
        order_id = request.data.get('order_id')
        
        try:
            order = Order.objects.get(id=order_id, status='pending')
            order.status = 'confirmed'
            order.chef = request.user
            order.save()
            
            # Create status history
            OrderStatusHistory.objects.create(
                order=order,
                status='confirmed',
                changed_by=request.user,
                notes='Order accepted by chef'
            )
            
            return Response(OrderDetailSerializer(order).data)
        
        except Order.DoesNotExist:
            return Response(
                {'error': 'Order not found or not pending'}, 
                status=status.HTTP_404_NOT_FOUND
            )


class OrderItemViewSet(viewsets.ModelViewSet):
    queryset = OrderItem.objects.all()
    serializer_class = OrderItemDetailSerializer
    permission_classes = [IsAuthenticated]


class OrderStatusHistoryViewSet(viewsets.ModelViewSet):
    queryset = OrderStatusHistory.objects.all()
    serializer_class = OrderStatusHistorySerializer
    permission_classes = [IsAuthenticated]


class CartItemViewSet(viewsets.ModelViewSet):
    queryset = CartItem.objects.all()
    serializer_class = CartItemSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return CartItem.objects.filter(customer=self.request.user)


# Legacy ChefOrderViewSet for backward compatibility
class ChefOrderViewSet(ChefDashboardViewSet):
    """Legacy viewset - use ChefDashboardViewSet instead"""
    pass

    @action(detail=False, methods=["get"])
    def counts(self, request):
        qs = self.get_queryset()
        return Response({
            "pending": qs.filter(status="pending").count(),
            "in_progress": qs.filter(status="in_progress").count(),
            "completed": qs.filter(status="completed").count(),
        })


class ChefBulkOrderViewSet(viewsets.ReadOnlyModelViewSet):
    """Chef sees only bulk orders"""
    serializer_class = OrderDetailSerializer  # Use OrderDetailSerializer instead
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Order.objects.filter(chef=self.request.user, order_type="bulk")

    @action(detail=False, methods=["get"])
    def counts(self, request):
        qs = self.get_queryset()
        return Response({
            "pending": qs.filter(status="pending").count(),
            "in_progress": qs.filter(status="in_progress").count(),
            "completed": qs.filter(status="completed").count(),
        })