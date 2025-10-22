"""
Bulk Menu ViewSets for large orders/catering
"""
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
        """Return bulk menus based on user role"""
        user = self.request.user
        
        # Authenticated users - role-based filtering
        if user.is_authenticated:
            # Chefs can see their own bulk menus (including pending)
            if hasattr(user, 'role') and user.role == 'cook':
                return BulkMenu.objects.filter(chef=user).prefetch_related('items')
            
            # Admins can see all
            if hasattr(user, 'is_staff') and user.is_staff:
                return BulkMenu.objects.all().prefetch_related('items')
        
        # Unauthenticated users and customers: only approved and available menus
        return BulkMenu.objects.filter(
            approval_status='approved',
            availability_status=True
        ).prefetch_related('items').select_related('chef')
    
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
        bulk_menu = self.get_object()
        
        # Only chef who created it can update
        if bulk_menu.chef != request.user:
            return Response(
                {'error': 'You can only update your own menus'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Update bulk menu fields
        menu_data = request.data.get('menu', {})
        for field in ['menu_name', 'description', 'base_price_per_person', 'min_persons', 'max_persons', 'advance_notice_hours']:
            if field in menu_data:
                setattr(bulk_menu, field, menu_data[field])
        bulk_menu.save()
        
        # Update items if provided
        items_data = request.data.get('items', [])
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

