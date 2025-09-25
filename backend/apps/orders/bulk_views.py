from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q, Count, Sum
from django.utils import timezone
from datetime import datetime, timedelta
from .models import Order, OrderItem, OrderStatusHistory
from .serializers import (
    OrderDetailSerializer, OrderListSerializer, BulkOrderActionSerializer
)
from apps.users.models import ChefProfile


class BulkOrderManagementViewSet(viewsets.ReadOnlyModelViewSet):
    """Advanced bulk order management for multiple chefs"""
    serializer_class = OrderListSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Get orders that can be managed in bulk"""
        return Order.objects.select_related('customer', 'chef').prefetch_related('items')
    
    @action(detail=False, methods=['get'])
    def unassigned_orders(self, request):
        """Get orders without assigned chefs"""
        orders = self.get_queryset().filter(
            chef__isnull=True,
            status__in=['pending', 'confirmed']
        ).order_by('created_at')
        
        serializer = self.get_serializer(orders, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def chef_workload(self, request):
        """Get workload distribution across chefs"""
        active_statuses = ['confirmed', 'preparing', 'ready']
        
        # Get chef workloads
        chef_workloads = []
        chef_profiles = ChefProfile.objects.select_related('user').filter(
            user__is_active=True
        )
        
        for chef_profile in chef_profiles:
            chef_user = chef_profile.user
            active_orders = Order.objects.filter(
                chef=chef_user,
                status__in=active_statuses
            ).count()
            
            # Calculate average preparation time (mock data for now)
            avg_prep_time = 25.0
            
            # Calculate estimated availability
            estimated_busy_minutes = active_orders * avg_prep_time
            availability_status = 'available'
            if estimated_busy_minutes > 120:  # More than 2 hours of work
                availability_status = 'busy'
            elif estimated_busy_minutes > 60:  # More than 1 hour of work
                availability_status = 'moderate'
            
            chef_workloads.append({
                'chef_id': chef_profile.id,
                'chef_name': chef_user.get_full_name(),
                'chef_email': chef_user.email,
                'active_orders': active_orders,
                'estimated_busy_minutes': estimated_busy_minutes,
                'availability_status': availability_status,
                'specialties': chef_profile.specialties or []
            })
        
        # Sort by availability (available chefs first)
        chef_workloads.sort(key=lambda x: (
            0 if x['availability_status'] == 'available' else
            1 if x['availability_status'] == 'moderate' else 2,
            x['active_orders']
        ))
        
        return Response({
            'chef_workloads': chef_workloads,
            'total_chefs': len(chef_workloads),
            'available_chefs': len([c for c in chef_workloads if c['availability_status'] == 'available']),
            'busy_chefs': len([c for c in chef_workloads if c['availability_status'] == 'busy'])
        })
    
    @action(detail=False, methods=['post'])
    def auto_assign_orders(self, request):
        """Automatically assign unassigned orders to available chefs"""
        order_ids = request.data.get('order_ids', [])
        assignment_strategy = request.data.get('strategy', 'round_robin')  # 'round_robin', 'least_busy', 'specialty_match'
        
        if not order_ids:
            return Response(
                {'error': 'order_ids is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        orders = Order.objects.filter(id__in=order_ids, chef__isnull=True)
        if not orders.exists():
            return Response(
                {'error': 'No unassigned orders found with the provided IDs'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Get available chef profiles
        chef_profiles = ChefProfile.objects.select_related('user').filter(
            user__is_active=True
        )
        
        if not chef_profiles.exists():
            return Response(
                {'error': 'No active chefs available'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        assignments = []
        chef_index = 0
        
        for order in orders:
            assigned_chef = None
            
            if assignment_strategy == 'round_robin':
                # Simple round-robin assignment
                chef_profile = chef_profiles[chef_index % len(chef_profiles)]
                assigned_chef = chef_profile.user
                chef_index += 1
            
            elif assignment_strategy == 'least_busy':
                # Assign to chef with least active orders
                active_statuses = ['confirmed', 'preparing', 'ready']
                chef_workloads = []
                
                for chef_profile in chef_profiles:
                    active_orders = Order.objects.filter(
                        chef=chef_profile.user,
                        status__in=active_statuses
                    ).count()
                    chef_workloads.append((chef_profile.user, active_orders))
                
                # Sort by workload and assign to least busy
                chef_workloads.sort(key=lambda x: x[1])
                assigned_chef = chef_workloads[0][0]
            
            elif assignment_strategy == 'specialty_match':
                # Try to match chef specialties with order items (simplified)
                # For now, use round-robin as fallback
                chef_profile = chef_profiles[chef_index % len(chef_profiles)]
                assigned_chef = chef_profile.user
                chef_index += 1
            
            if assigned_chef:
                order.chef = assigned_chef
                order.save()
                
                # Create status history
                OrderStatusHistory.objects.create(
                    order=order,
                    status=order.status,
                    changed_by=request.user,
                    notes=f'Auto-assigned to chef: {assigned_chef.get_full_name()} using {assignment_strategy} strategy'
                )
                
                assignments.append({
                    'order_id': order.id,
                    'order_number': order.order_number,
                    'chef_name': assigned_chef.get_full_name(),
                    'chef_email': assigned_chef.email
                })
        
        return Response({
            'message': f'{len(assignments)} orders assigned successfully',
            'assignments': assignments,
            'strategy_used': assignment_strategy
        })
    
    @action(detail=False, methods=['post'])
    def reassign_orders(self, request):
        """Reassign orders from one chef to another"""
        order_ids = request.data.get('order_ids', [])
        from_chef_id = request.data.get('from_chef_id')
        to_chef_id = request.data.get('to_chef_id')
        reason = request.data.get('reason', '')
        
        if not all([order_ids, from_chef_id, to_chef_id]):
            return Response(
                {'error': 'order_ids, from_chef_id, and to_chef_id are required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            from_chef_profile = ChefProfile.objects.get(id=from_chef_id)
            to_chef_profile = ChefProfile.objects.get(id=to_chef_id)
            from_chef = from_chef_profile.user
            to_chef = to_chef_profile.user
        except ChefProfile.DoesNotExist:
            return Response(
                {'error': 'One or both chef profiles not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        orders = Order.objects.filter(
            id__in=order_ids,
            chef=from_chef,
            status__in=['confirmed', 'preparing']  # Only allow reassignment for these statuses
        )
        
        if not orders.exists():
            return Response(
                {'error': 'No eligible orders found for reassignment'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        reassigned_orders = []
        for order in orders:
            order.chef = to_chef
            order.save()
            
            # Create status history
            OrderStatusHistory.objects.create(
                order=order,
                status=order.status,
                changed_by=request.user,
                notes=f'Reassigned from {from_chef.get_full_name()} to {to_chef.get_full_name()}. Reason: {reason}'
            )
            
            reassigned_orders.append({
                'order_id': order.id,
                'order_number': order.order_number
            })
        
        return Response({
            'message': f'{len(reassigned_orders)} orders reassigned successfully',
            'reassigned_orders': reassigned_orders,
            'from_chef': from_chef.get_full_name(),
            'to_chef': to_chef.get_full_name()
        })
    
    @action(detail=False, methods=['post'])
    def batch_status_update(self, request):
        """Update status for multiple orders with conflict resolution"""
        order_ids = request.data.get('order_ids', [])
        new_status = request.data.get('new_status')
        notes = request.data.get('notes', '')
        force_update = request.data.get('force_update', False)
        
        if not order_ids or not new_status:
            return Response(
                {'error': 'order_ids and new_status are required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if new_status not in dict(Order.ORDER_STATUS_CHOICES):
            return Response(
                {'error': 'Invalid status'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        orders = Order.objects.filter(id__in=order_ids)
        
        # Check for conflicts (orders that can't be updated to the new status)
        conflicts = []
        valid_orders = []
        
        # Define valid status transitions
        valid_transitions = {
            'pending': ['confirmed', 'cancelled'],
            'confirmed': ['preparing', 'cancelled'],
            'preparing': ['ready', 'cancelled'],
            'ready': ['out_for_delivery', 'cancelled'],
            'out_for_delivery': ['delivered', 'cancelled'],
            'delivered': [],  # Terminal state
            'cancelled': [],  # Terminal state
            'refunded': []    # Terminal state
        }
        
        for order in orders:
            if not force_update and new_status not in valid_transitions.get(order.status, []):
                conflicts.append({
                    'order_id': order.id,
                    'order_number': order.order_number,
                    'current_status': order.status,
                    'requested_status': new_status,
                    'reason': f'Invalid transition from {order.status} to {new_status}'
                })
            else:
                valid_orders.append(order)
        
        if conflicts and not force_update:
            return Response({
                'conflicts': conflicts,
                'message': f'{len(conflicts)} orders have conflicts. Use force_update=true to override.',
                'valid_orders_count': len(valid_orders)
            }, status=status.HTTP_409_CONFLICT)
        
        # Update valid orders (or all orders if force_update=True)
        orders_to_update = orders if force_update else valid_orders
        updated_orders = []
        
        for order in orders_to_update:
            old_status = order.status
            order.status = new_status
            order.save()
            
            # Create status history
            OrderStatusHistory.objects.create(
                order=order,
                status=new_status,
                changed_by=request.user,
                notes=f'Batch update from {old_status} to {new_status}. {notes}'.strip()
            )
            
            updated_orders.append({
                'order_id': order.id,
                'order_number': order.order_number,
                'old_status': old_status,
                'new_status': new_status
            })
        
        return Response({
            'message': f'{len(updated_orders)} orders updated successfully',
            'updated_orders': updated_orders,
            'conflicts_resolved': len(conflicts) if force_update else 0
        })
    
    @action(detail=False, methods=['get'])
    def bulk_operations_summary(self, request):
        """Get summary of bulk operations performed"""
        today = timezone.now().date()
        
        # Get recent bulk operations from status history
        recent_bulk_operations = OrderStatusHistory.objects.filter(
            created_at__date=today,
            notes__icontains='batch'
        ).values('changed_by__username', 'status').annotate(
            count=Count('id')
        ).order_by('-count')
        
        # Get auto-assignments
        auto_assignments = OrderStatusHistory.objects.filter(
            created_at__date=today,
            notes__icontains='auto-assigned'
        ).count()
        
        # Get reassignments
        reassignments = OrderStatusHistory.objects.filter(
            created_at__date=today,
            notes__icontains='reassigned'
        ).count()
        
        return Response({
            'today_bulk_operations': list(recent_bulk_operations),
            'auto_assignments_today': auto_assignments,
            'reassignments_today': reassignments,
            'total_operations_today': len(recent_bulk_operations) + auto_assignments + reassignments
        })