from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q, Count, Sum
from django.utils import timezone
from datetime import datetime, timedelta
from .models import Order, OrderItem, OrderStatusHistory, BulkOrder, BulkOrderAssignment
from .serializers import (
    OrderDetailSerializer, OrderListSerializer, BulkOrderActionSerializer,
    BulkOrderListSerializer, BulkOrderDetailSerializer
)
from apps.users.models import ChefProfile


class BulkOrderManagementViewSet(viewsets.ModelViewSet):
    """Advanced bulk order management for large-scale catering and events"""
    queryset = BulkOrder.objects.all()
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'list':
            return BulkOrderListSerializer
        return BulkOrderDetailSerializer
    
    def get_queryset(self):
        """Get bulk orders with filtering"""
        queryset = BulkOrder.objects.select_related('created_by', 'order').prefetch_related(
            'assignments__chef', 'order__items'
        )
        
        # Filter by status
        status_filter = self.request.query_params.get('status')
        if status_filter and status_filter != 'all':
            queryset = queryset.filter(status=status_filter)
        
        # Search functionality
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(description__icontains=search) |
                Q(created_by__name__icontains=search) |
                Q(created_by__username__icontains=search)
            )
        
        # Date range filtering
        event_date_from = self.request.query_params.get('event_date_from')
        event_date_to = self.request.query_params.get('event_date_to')
        if event_date_from:
            queryset = queryset.filter(deadline__gte=event_date_from)
        if event_date_to:
            queryset = queryset.filter(deadline__lte=event_date_to)
        
        return queryset.order_by('-created_at')
    
    @action(detail=True, methods=['post'])
    def accept(self, request, pk=None):
        """Accept a bulk order"""
        bulk_order = self.get_object()
        notes = request.data.get('notes', '')
        
        if bulk_order.status != 'pending':
            return Response(
                {'error': 'Only pending bulk orders can be accepted'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        bulk_order.status = 'confirmed'
        bulk_order.save()
        
        return Response(BulkOrderDetailSerializer(bulk_order).data)
    
    @action(detail=True, methods=['post'])
    def decline(self, request, pk=None):
        """Decline a bulk order"""
        bulk_order = self.get_object()
        reason = request.data.get('reason', '')
        
        if bulk_order.status not in ['pending']:
            return Response(
                {'error': 'Only pending bulk orders can be declined'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        bulk_order.status = 'cancelled'
        bulk_order.save()
        
        return Response(BulkOrderDetailSerializer(bulk_order).data)
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get bulk order statistics"""
        # Status counts
        stats = {
            'pending': BulkOrder.objects.filter(status='pending').count(),
            'confirmed': BulkOrder.objects.filter(status='confirmed').count(),
            'preparing': BulkOrder.objects.filter(status='preparing').count(),
            'completed': BulkOrder.objects.filter(status='completed').count(),
            'cancelled': BulkOrder.objects.filter(status='cancelled').count(),
        }
        
        # Revenue calculations from related orders
        total_revenue = BulkOrder.objects.filter(
            status__in=['completed', 'delivered']
        ).aggregate(
            total=Sum('order__total_amount')
        )['total'] or 0
        
        stats.update({
            'total_revenue': str(total_revenue),
        })
        
        return Response(stats)
    
    @action(detail=True, methods=['post'])
    def collaborate(self, request, pk=None):
        """Request collaboration on a bulk order"""
        bulk_order = self.get_object()
        chef_id = request.data.get('chef_id')
        message = request.data.get('message', '')
        work_distribution = request.data.get('work_distribution', '')
        
        if not chef_id:
            return Response(
                {'error': 'chef_id is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if chef exists and is active
        from django.contrib.auth import get_user_model
        User = get_user_model()
        try:
            chef = User.objects.get(id=chef_id, is_active=True, role__in=['cook', 'Cook'])
        except User.DoesNotExist:
            return Response(
                {'error': 'Chef not found or inactive'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check if chef is already assigned to this bulk order
        if BulkOrderAssignment.objects.filter(bulk_order=bulk_order, chef=chef).exists():
            return Response(
                {'error': 'Chef is already assigned to this bulk order'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create the assignment
        assignment = BulkOrderAssignment.objects.create(
            bulk_order=bulk_order,
            chef=chef
        )
        
        # Update bulk order status to collaborating
        if bulk_order.status == 'pending':
            bulk_order.status = 'collaborating'
            bulk_order.save()
        
        return Response({
            'message': f'Collaboration request sent to {chef.name or chef.username}',
            'assignment_id': assignment.id,
            'bulk_order': BulkOrderDetailSerializer(bulk_order).data
        })
    
    @action(detail=False, methods=['get'])
    def available_chefs(self, request):
        """Get list of active chefs available for collaboration"""
        from django.contrib.auth import get_user_model
        User = get_user_model()
        
        # Get active chefs (excluding the requesting user)
        active_chefs = User.objects.filter(
            is_active=True,
            role__in=['cook', 'Cook']
        ).exclude(
            id=request.user.id
        ).values(
            'id', 'name', 'username', 'email'
        )
        
        # Format chef data
        chef_list = []
        for chef in active_chefs:
            # Get current workload (number of active bulk orders)
            active_assignments = BulkOrderAssignment.objects.filter(
                chef_id=chef['id'],
                bulk_order__status__in=['pending', 'confirmed', 'collaborating', 'preparing']
            ).count()
            
            chef_list.append({
                'id': chef['id'],
                'name': chef['name'] or chef['username'],
                'username': chef['username'],
                'email': chef['email'],
                'active_assignments': active_assignments,
                'availability_status': 'available' if active_assignments < 3 else 'busy'
            })
        
        # Sort by availability and workload
        chef_list.sort(key=lambda x: (x['availability_status'] == 'busy', x['active_assignments']))
        
        return Response(chef_list)