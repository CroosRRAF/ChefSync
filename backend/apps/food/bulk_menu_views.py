"""
Bulk Menu ViewSets for large orders/catering
"""
import json
import logging
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly, AllowAny
from rest_framework.response import Response
from rest_framework import serializers as drf_serializers

from .models import BulkMenu, BulkMenuItem
from .serializers import BulkMenuSerializer, BulkMenuItemSerializer, BulkMenuWithItemsSerializer

logger = logging.getLogger(__name__)


class BulkMenuViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing bulk menus (for large orders/catering)
    - Anyone can view approved bulk menus (list, retrieve)
    - Only authenticated cooks can create/update/delete their own menus
    """
    serializer_class = BulkMenuWithItemsSerializer
    
    def get_permissions(self):
        """
        Allow anyone to view (list/retrieve) approved menus
        Require authentication for create/update/delete
        """
        if self.action in ['list', 'retrieve', 'meal_types']:
            # Anyone can view approved bulk menus
            permission_classes = [AllowAny]
        else:
            # Create, update, delete require authentication
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]
    
    def get_queryset(self):
        """Return bulk menus based on user role and query parameters"""
        user = self.request.user
        
        # Authenticated users - role-based filtering
        if user.is_authenticated:
            # Chefs can see their own bulk menus (including pending)
            if hasattr(user, 'role') and user.role == 'cook':
                queryset = BulkMenu.objects.filter(chef=user).prefetch_related('items')
                return queryset
            
            # Admins can see all
            if hasattr(user, 'is_staff') and user.is_staff:
                queryset = BulkMenu.objects.all().prefetch_related('items')
                # Support filtering by chef for admins and customers
                chef_id = self.request.query_params.get('chef')
                chef_profile_id = self.request.query_params.get('chef_profile_id')
                if chef_id:
                    queryset = queryset.filter(chef_id=chef_id)
                elif chef_profile_id:
                    queryset = queryset.filter(chef__chef_profile__id=chef_profile_id)
                return queryset
        
        # Unauthenticated users and customers: only approved and available menus
        queryset = BulkMenu.objects.filter(
            approval_status='approved',
            availability_status=True
        ).prefetch_related('items').select_related('chef')
        
        # Support filtering by chef for customers viewing specific chef's menu
        chef_id = self.request.query_params.get('chef')
        chef_profile_id = self.request.query_params.get('chef_profile_id')
        if chef_id:
            queryset = queryset.filter(chef_id=chef_id)
        elif chef_profile_id:
            queryset = queryset.filter(chef__chef_profile__id=chef_profile_id)
        
        return queryset
    
    def get_serializer_context(self):
        """Add user location to serializer context for delivery fee calculation"""
        context = super().get_serializer_context()
        
        # Get user location from query parameters
        lat = self.request.query_params.get('user_lat')
        lng = self.request.query_params.get('user_lng')
        
        if lat and lng:
            try:
                context['user_location'] = {
                    'latitude': float(lat),
                    'longitude': float(lng)
                }
            except (ValueError, TypeError):
                logger.warning(f"Invalid location parameters: lat={lat}, lng={lng}")
        
        return context
    
    def perform_create(self, serializer):
        """Set the chef to the current user"""
        serializer.save(chef=self.request.user, approval_status='pending')
    
    @action(detail=False, methods=['get'])
    def meal_types(self, request):
        """Get available meal types"""
        meal_types = [
            {'value': 'breakfast', 'label': 'Breakfast'},
            {'value': 'lunch', 'label': 'Lunch'},
            {'value': 'dinner', 'label': 'Dinner'},
            {'value': 'snacks', 'label': 'Snacks'},
        ]
        return Response(meal_types)
    
    @action(detail=False, methods=['get'])
    def chef_dashboard_stats(self, request):
        """Get statistics for chef's bulk menu dashboard"""
        if not (hasattr(request.user, 'role') and request.user.role == 'cook'):
            return Response(
                {'error': 'Only chefs can access this endpoint'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        menus = BulkMenu.objects.filter(chef=request.user)
        stats = {
            'total_menus': menus.count(),
            'pending_menus': menus.filter(approval_status='pending').count(),
            'approved_menus': menus.filter(approval_status='approved').count(),
            'rejected_menus': menus.filter(approval_status='rejected').count(),
            'available_menus': menus.filter(availability_status=True, approval_status='approved').count(),
        }
        return Response(stats)
    
    @action(detail=True, methods=['post'])
    def toggle_availability(self, request, pk=None):
        """Toggle availability status of a bulk menu"""
        bulk_menu = self.get_object()
        
        # Only chef who created it can toggle
        if bulk_menu.chef != request.user:
            return Response(
                {'error': 'You can only toggle your own menus'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        bulk_menu.availability_status = not bulk_menu.availability_status
        bulk_menu.save()
        
        serializer = self.get_serializer(bulk_menu)
        return Response(serializer.data)
    
    @action(detail=True, methods=['put'])
    def update_with_items(self, request, pk=None):
        """Update bulk menu along with its items"""
        try:
            bulk_menu = self.get_object()
            
            # Only chef who created it can update
            if bulk_menu.chef != request.user:
                return Response(
                    {'error': 'You can only update your own menus'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Handle different data formats (JSON vs FormData)
            logger.info(f"Request content type: {request.content_type}")
            logger.info(f"Request data keys: {list(request.data.keys()) if hasattr(request.data, 'keys') else 'No keys'}")
            
            if hasattr(request.data, 'get'):
                # Try to get menu data
                menu_data = request.data.get('menu', {})
                logger.info(f"Raw menu_data type: {type(menu_data)}, value: {menu_data}")
                
                # If menu_data is a string (from FormData), parse it as JSON
                if isinstance(menu_data, str):
                    try:
                        menu_data = json.loads(menu_data)
                        logger.info(f"Parsed menu_data: {menu_data}")
                    except json.JSONDecodeError:
                        logger.error(f"Failed to parse menu JSON: {menu_data}")
                        menu_data = {}
                
                # Get items data
                items_data = request.data.get('items', [])
                logger.info(f"Raw items_data type: {type(items_data)}, length: {len(items_data) if hasattr(items_data, '__len__') else 'No length'}")
                
                # If items_data is a string (from FormData), parse it as JSON
                if isinstance(items_data, str):
                    try:
                        items_data = json.loads(items_data)
                        logger.info(f"Parsed items_data: {len(items_data)} items")
                    except json.JSONDecodeError:
                        logger.error(f"Failed to parse items JSON: {items_data}")
                        items_data = []
            else:
                logger.error("Invalid request data format")
                return Response(
                    {'error': 'Invalid request data format'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Update bulk menu fields
            for field in ['menu_name', 'description', 'base_price_per_person', 'min_persons', 'max_persons', 'advance_notice_hours']:
                if field in menu_data:
                    setattr(bulk_menu, field, menu_data[field])
            bulk_menu.save()
            
            # Update items if provided
            if items_data:
                # Delete existing items not in the update
                existing_item_ids = [item.get('id') for item in items_data if item.get('id')]
                bulk_menu.items.exclude(id__in=existing_item_ids).delete()
                
                # Update or create items
                for item_data in items_data:
                    item_id = item_data.get('id')
                    if item_id:
                        # Update existing item
                        try:
                            item = BulkMenuItem.objects.get(id=item_id, bulk_menu=bulk_menu)
                            for field, value in item_data.items():
                                if field != 'id' and field != 'bulk_menu':
                                    setattr(item, field, value)
                            item.save()
                        except BulkMenuItem.DoesNotExist:
                            pass
                    else:
                        # Create new item
                        BulkMenuItem.objects.create(bulk_menu=bulk_menu, **{k: v for k, v in item_data.items() if k != 'id' and k != 'bulk_menu'})
            
            serializer = self.get_serializer(bulk_menu)
            return Response(serializer.data)
            
        except Exception as e:
            logger.error(f"Error in update_with_items: {str(e)}", exc_info=True)
            return Response(
                {'error': f'Internal server error: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approve a pending bulk menu (Admin only)"""
        if not request.user.is_staff:
            return Response(
                {'error': 'Admin access required'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        bulk_menu = self.get_object()
        
        if bulk_menu.approval_status != 'pending':
            return Response(
                {'error': 'Only pending bulk menus can be approved'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Approve the bulk menu
        from django.utils import timezone
        bulk_menu.approval_status = 'approved'
        bulk_menu.approved_by = request.user
        bulk_menu.approved_at = timezone.now()
        bulk_menu.availability_status = True  # Make available when approved
        bulk_menu.save()
        
        # Send notification to chef
        try:
            from apps.communications.models import Notification
            Notification.objects.create(
                user=bulk_menu.chef,
                subject=f"Bulk Menu Approved: {bulk_menu.menu_name}",
                message=f"Great news! Your bulk menu '{bulk_menu.menu_name}' has been approved and is now visible to customers.",
                status="Unread"
            )
        except Exception as e:
            logger.warning(f"Failed to create notification: {e}")
        
        serializer = self.get_serializer(bulk_menu)
        return Response({
            'message': f'Bulk menu "{bulk_menu.menu_name}" has been approved successfully',
            'bulk_menu': serializer.data
        }, status=status.HTTP_200_OK)
    
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Reject a pending bulk menu (Admin only)"""
        if not request.user.is_staff:
            return Response(
                {'error': 'Admin access required'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        bulk_menu = self.get_object()
        
        if bulk_menu.approval_status != 'pending':
            return Response(
                {'error': 'Only pending bulk menus can be rejected'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        rejection_reason = request.data.get('reason', 'No reason provided')
        
        # Reject the bulk menu
        from django.utils import timezone
        bulk_menu.approval_status = 'rejected'
        bulk_menu.approved_by = request.user
        bulk_menu.approved_at = timezone.now()
        bulk_menu.rejection_reason = rejection_reason
        bulk_menu.availability_status = False
        bulk_menu.save()
        
        # Send notification to chef
        try:
            from apps.communications.models import Notification
            Notification.objects.create(
                user=bulk_menu.chef,
                subject=f"Bulk Menu Rejected: {bulk_menu.menu_name}",
                message=f"Your bulk menu '{bulk_menu.menu_name}' has been rejected. Reason: {rejection_reason}",
                status="Unread"
            )
        except Exception as e:
            logger.warning(f"Failed to create notification: {e}")
        
        serializer = self.get_serializer(bulk_menu)
        return Response({
            'message': f'Bulk menu "{bulk_menu.menu_name}" has been rejected',
            'reason': rejection_reason
        }, status=status.HTTP_200_OK)


class BulkMenuItemViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing individual bulk menu items
    """
    serializer_class = BulkMenuItemSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Return bulk menu items based on filters and permissions"""
        queryset = BulkMenuItem.objects.all()
        
        # Filter by bulk_menu__id if provided
        bulk_menu_id = self.request.query_params.get('bulk_menu__id')
        if bulk_menu_id:
            queryset = queryset.filter(bulk_menu_id=bulk_menu_id)
        
        # Chefs can only see items from their own menus
        if hasattr(self.request.user, 'role') and self.request.user.role == 'cook':
            queryset = queryset.filter(bulk_menu__chef=self.request.user)
        
        return queryset.order_by('sort_order', 'item_name')
    
    def perform_create(self, serializer):
        """Ensure chef owns the bulk menu before adding items"""
        bulk_menu = serializer.validated_data.get('bulk_menu')
        if bulk_menu.chef != self.request.user:
            raise drf_serializers.ValidationError('You can only add items to your own bulk menus')
        serializer.save()

