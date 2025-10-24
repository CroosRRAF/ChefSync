from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q, Count, Sum
from django.utils import timezone
from datetime import datetime, timedelta
from .models import Order, OrderItem, OrderStatusHistory, BulkOrder, BulkOrderAssignment, CollaborationRequest
from .serializers import (
    OrderDetailSerializer, OrderListSerializer, BulkOrderActionSerializer,
    BulkOrderListSerializer, BulkOrderDetailSerializer, CollaborationRequestSerializer
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
        """Get bulk orders for the authenticated cook - either as primary chef or collaborator"""
        user = self.request.user
        
        # Base queryset with optimized queries
        queryset = BulkOrder.objects.select_related('created_by', 'order').prefetch_related(
            'assignments__chef', 'order__items'
        )
        
        # Filter by authenticated cook - show bulk orders where user is either:
        # 1. The primary chef (chef field)
        # 2. A collaborating chef (through BulkOrderAssignment)
        # Note: we intentionally do NOT expose unassigned pending orders to all cooks.
        if user.is_authenticated:
            # Check if user has cook/chef role
            if hasattr(user, 'role') and user.role in ['cook', 'Cook']:
                # Filter: user is the primary chef OR user is in assignments
                queryset = queryset.filter(
                    Q(chef=user) |  # Orders assigned to this chef
                    Q(assignments__chef=user)  # Orders where this chef is a collaborator
                ).distinct()
            # For admins or staff, show all bulk orders
            elif user.is_staff or user.is_superuser:
                pass  # Keep all bulk orders for admins
            else:
                # For other users (customers), return empty queryset
                # Customers should use customer-bulk-orders endpoint instead
                queryset = queryset.none()
        
        # Filter by status
        status_filter = self.request.query_params.get('status')
        if status_filter and status_filter != 'all':
            queryset = queryset.filter(status=status_filter)
        
        # Search functionality
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(notes__icontains=search) |
                Q(customer_notes__icontains=search) |
                Q(menu_name__icontains=search) |
                Q(created_by__name__icontains=search) |
                Q(created_by__username__icontains=search)
            )
        
        # Date range filtering
        event_date_from = self.request.query_params.get('event_date_from')
        event_date_to = self.request.query_params.get('event_date_to')
        if event_date_from:
            queryset = queryset.filter(event_date__gte=event_date_from)
        if event_date_to:
            queryset = queryset.filter(event_date__lte=event_date_to)
        
        return queryset.order_by('-created_at')
    
    @action(detail=True, methods=['post'])
    def accept(self, request, pk=None):
        """Accept a bulk order and assign the accepting chef"""
        bulk_order = self.get_object()
        notes = request.data.get('notes', '')
        
        if bulk_order.status != 'pending':
            return Response(
                {'error': 'Only pending bulk orders can be accepted'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Assign the chef who is accepting the order
        bulk_order.chef = request.user
        bulk_order.status = 'confirmed'
        bulk_order.confirmed_at = timezone.now()
        
        # Add chef notes if provided
        if notes:
            bulk_order.chef_notes = notes
        
        bulk_order.save()
        
        import logging
        logger = logging.getLogger(__name__)
        logger.info(f"✅ Bulk order {bulk_order.bulk_order_id} accepted by chef {request.user.username}")
        
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
        """Get bulk order statistics for the authenticated cook"""
        try:
            user = request.user
            
            # Base queryset filtered by cook
            base_queryset = BulkOrder.objects.all()
            
            # Filter by authenticated cook if not admin
            if user.is_authenticated and not (user.is_staff or user.is_superuser):
                if hasattr(user, 'role') and user.role in ['cook', 'Cook']:
                    # Filter: user is the primary chef OR user is in assignments
                    # Do not include unassigned pending orders here so cooks only see their own orders
                    base_queryset = base_queryset.filter(
                        Q(chef=user) |  # Orders assigned to this chef
                        Q(assignments__chef=user)  # Orders where this chef is a collaborator
                    ).distinct()
                else:
                    # Non-cook users get empty stats
                    base_queryset = BulkOrder.objects.none()
            
            # Status counts
            pending_count = base_queryset.filter(status='pending').count()
            confirmed_count = base_queryset.filter(status='confirmed').count()
            collaborating_count = base_queryset.filter(status='collaborating').count()
            preparing_count = base_queryset.filter(status='preparing').count()
            completed_count = base_queryset.filter(status='completed').count()
            ready_for_delivery_count = base_queryset.filter(status='ready_for_delivery').count()
            cancelled_count = base_queryset.filter(status='cancelled').count()
            
            # Revenue calculations from related orders (only completed orders)
            total_revenue = base_queryset.filter(
                status='completed'
            ).aggregate(
                total=Sum('order__total_amount')
            )['total'] or 0
            
            stats = {
                'pending': pending_count,
                'confirmed': confirmed_count,
                'accepted': confirmed_count,  # Frontend uses 'accepted' for confirmed status
                'collaborating': collaborating_count,
                'preparing': preparing_count,
                'completed': completed_count,
                'ready_for_delivery': ready_for_delivery_count,
                'cancelled': cancelled_count,
                'total_revenue': str(total_revenue),
                'total_orders': pending_count + confirmed_count + collaborating_count + preparing_count + completed_count + ready_for_delivery_count,
            }
            
        except Exception as e:
            # Return empty stats on error
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Error calculating bulk order stats: {str(e)}")
            
            stats = {
                'pending': 0,
                'confirmed': 0,
                'accepted': 0,
                'collaborating': 0,
                'preparing': 0,
                'completed': 0,
                'cancelled': 0,
                'total_revenue': '0.00',
                'total_orders': 0,
            }
        
        return Response(stats)
    
    @action(detail=True, methods=['post'])
    def collaborate(self, request, pk=None):
        """Request collaboration on a bulk order"""
        try:
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
                chef = User.objects.get(user_id=chef_id, is_active=True, role__in=['cook', 'Cook'])
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

            # Create a CollaborationRequest record (pending)
            collab = CollaborationRequest.objects.create(
                bulk_order=bulk_order,
                from_user=request.user,
                to_user=chef,
                message=message,
                work_distribution=work_distribution,
                status='pending'
            )

            # Respond with the serialized collaboration request
            return Response({
                'message': f'Collaboration request sent to {chef.name or chef.username}',
                'collaboration_request': CollaborationRequestSerializer(collab).data
            }, status=status.HTTP_201_CREATED)
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.exception(f"Error creating collaboration request for bulk order {pk}: {str(e)}")
            # Return the exception message in the JSON error for the frontend to display.
            # Keep generic prefix but include the underlying message to aid the user.
            return Response(
                {'error': f'Failed to create collaboration request: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
    
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
            user_id=request.user.user_id
        ).values(
            'user_id', 'name', 'username', 'email'
        )
        
        # Format chef data
        chef_list = []
        for chef in active_chefs:
            # Get current workload (number of active bulk orders)
            active_assignments = BulkOrderAssignment.objects.filter(
                chef_id=chef['user_id'],
                bulk_order__status__in=['pending', 'confirmed', 'collaborating', 'preparing']
            ).count()
            
            chef_list.append({
                'id': chef['user_id'],
                'name': chef['name'] or chef['username'],
                'username': chef['username'],
                'email': chef['email'],
                'active_assignments': active_assignments,
                'availability_status': 'available' if active_assignments < 3 else 'busy'
            })
        
        # Sort by availability and workload
        chef_list.sort(key=lambda x: (x['availability_status'] == 'busy', x['active_assignments']))
        
        return Response(chef_list)
    
    @action(detail=True, methods=['post'], url_path='assign_delivery')
    def assign_delivery(self, request, pk=None):
        """Assign a delivery agent to a bulk order"""
        try:
            bulk_order = self.get_object()
            
            # Check if bulk order is eligible for delivery assignment
            if bulk_order.order_type != 'delivery':
                return Response(
                    {'error': 'This bulk order is not for delivery'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            if bulk_order.delivery_partner:
                return Response(
                    {'error': 'Delivery agent already assigned to this bulk order'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            if bulk_order.status not in ['confirmed', 'preparing', 'ready_for_delivery']:
                return Response(
                    {'error': 'Bulk order is not ready for delivery assignment'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Assign current user as delivery partner
            bulk_order.delivery_partner = request.user
            bulk_order.save()
            
            # Optional: Log the assignment
            import logging
            logger = logging.getLogger(__name__)
            logger.info(f"Delivery agent {request.user.username} assigned to bulk order {bulk_order.bulk_order_id}")
            
            # Return the updated bulk order
            serializer = self.get_serializer(bulk_order)
            return Response(serializer.data)
            
        except BulkOrder.DoesNotExist:
            return Response(
                {'error': 'Bulk order not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Error assigning delivery agent to bulk order {pk}: {str(e)}")
            return Response(
                {'error': 'Failed to assign delivery agent'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['patch'], url_path='update_status')
    def update_status(self, request, pk=None):
        """Update the status of a bulk order (kitchen workflow)"""
        try:
            bulk_order = self.get_object()
            new_status = request.data.get('status')
            if not new_status:
                return Response({'error': 'status is required'}, status=status.HTTP_400_BAD_REQUEST)

            # Validate allowed statuses
            allowed = {choice[0] for choice in BulkOrder.STATUS_CHOICES}
            if new_status not in allowed:
                return Response({'error': f'Invalid status: {new_status}'}, status=status.HTTP_400_BAD_REQUEST)

            # Basic transition checks: once an order is completed or marked ready for delivery
            # we don't allow arbitrary status changes from the chef UI.
            if bulk_order.status in ['completed', 'ready_for_delivery'] and new_status != bulk_order.status:
                return Response({'error': 'Cannot change status of a completed or ready-for-delivery order'}, status=status.HTTP_400_BAD_REQUEST)

            bulk_order.status = new_status
            bulk_order.save()

            return Response(BulkOrderDetailSerializer(bulk_order).data)
        except BulkOrder.DoesNotExist:
            return Response({'error': 'Bulk order not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.exception(f"Error updating bulk order status {pk}: {str(e)}")
            return Response({'error': f'Failed to update bulk order status: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class CollaborationRequestViewSet(viewsets.ModelViewSet):
    """Viewset to manage collaboration requests between chefs"""
    queryset = CollaborationRequest.objects.all()
    permission_classes = [IsAuthenticated]
    serializer_class = CollaborationRequestSerializer

    def get_queryset(self):
        user = self.request.user
        # Allow chefs to see requests sent to them (incoming) and requests they sent (outgoing)
        incoming = self.request.query_params.get('incoming')
        outgoing = self.request.query_params.get('outgoing')

        qs = CollaborationRequest.objects.select_related('bulk_order', 'from_user', 'to_user')
        if incoming and incoming.lower() in ['1', 'true', 'yes']:
            return qs.filter(to_user=user).order_by('-created_at')
        if outgoing and outgoing.lower() in ['1', 'true', 'yes']:
            return qs.filter(from_user=user).order_by('-created_at')
        # Default: return requests where user is to_user or from_user
        return qs.filter(Q(to_user=user) | Q(from_user=user)).order_by('-created_at')

    @action(detail=True, methods=['post'])
    def accept(self, request, pk=None):
        """Accept a collaboration request (create assignment)"""
        try:
            collab = self.get_object()
            user = request.user
            if collab.to_user != user:
                return Response({'error': 'Only the invited chef can accept this request'}, status=status.HTTP_403_FORBIDDEN)

            # If already accepted/rejected
            if collab.status != 'pending':
                return Response({'error': 'This request has already been responded to'}, status=status.HTTP_400_BAD_REQUEST)

            # Defensive checks: ensure the related bulk order still exists
            if not collab.bulk_order:
                return Response({'error': 'Related bulk order no longer exists'}, status=status.HTTP_400_BAD_REQUEST)

            # Use an atomic transaction to avoid partial state on errors
            from django.db import transaction
            with transaction.atomic():
                # If already assigned, mark request accepted and return
                if BulkOrderAssignment.objects.filter(bulk_order=collab.bulk_order, chef=collab.to_user).exists():
                    collab.status = 'accepted'
                    collab.responded_at = timezone.now()
                    collab.response_reason = request.data.get('response_reason', '')
                    collab.save()
                    return Response({'message': 'Chef already assigned', 'collaboration_request': CollaborationRequestSerializer(collab).data})

                # Create assignment
                assignment = BulkOrderAssignment.objects.create(
                    bulk_order=collab.bulk_order,
                    chef=collab.to_user
                )

                # Update request state
                collab.status = 'accepted'
                collab.responded_at = timezone.now()
                collab.response_reason = request.data.get('response_reason', '')
                collab.save()

            # Update bulk order status
            if collab.bulk_order.status == 'pending':
                collab.bulk_order.status = 'collaborating'
                collab.bulk_order.save()

            return Response({'message': 'Collaboration accepted', 'collaboration_request': CollaborationRequestSerializer(collab).data})
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.exception(f"Error accepting collaboration request {pk}: {str(e)}")
            # Include underlying exception message to help frontend debugging (kept generic prefix)
            return Response({'error': f'Failed to accept request: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Reject a collaboration request and provide a reason"""
        try:
            collab = self.get_object()
            user = request.user
            if collab.to_user != user:
                return Response({'error': 'Only the invited chef can reject this request'}, status=status.HTTP_403_FORBIDDEN)

            if collab.status != 'pending':
                return Response({'error': 'This request has already been responded to'}, status=status.HTTP_400_BAD_REQUEST)

            reason = request.data.get('reason', '')
            collab.status = 'rejected'
            collab.response_reason = reason
            collab.responded_at = timezone.now()
            collab.save()

            return Response({'message': 'Collaboration request rejected', 'collaboration_request': CollaborationRequestSerializer(collab).data})
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Error rejecting collaboration request {pk}: {str(e)}")
            return Response({'error': 'Failed to reject request'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)