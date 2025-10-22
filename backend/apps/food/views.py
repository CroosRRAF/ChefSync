from rest_framework import viewsets, status, filters, serializers
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.decorators import action, api_view
from rest_framework.response import Response
from django.db.models import Q
from django.utils import timezone
from .models import Cuisine, FoodCategory, Food, FoodReview, FoodPrice, Offer, FoodImage, BulkMenu, BulkMenuItem
from .serializers import (
    CuisineSerializer, FoodCategorySerializer, FoodSerializer, 
    ChefFoodCreateSerializer, ChefFoodPriceSerializer, FoodPriceSerializer, 
    FoodReviewSerializer, OfferSerializer, FoodImageSerializer,
    BulkMenuSerializer, BulkMenuItemSerializer, BulkMenuCreateSerializer,
    BulkMenuCostCalculationSerializer
)

@api_view(['GET'])
def food_list(request):
    """Simple food list endpoint"""
    foods = Food.objects.filter(status='Approved')[:10]
    serializer = FoodSerializer(foods, many=True, context={'request': request})
    return Response(serializer.data)


@api_view(['GET'])
def food_search(request):
    """Global food search endpoint - /api/food/search/?q=<query>"""
    query = request.GET.get('q', '').strip()
    if not query or len(query) < 2:
        return Response([])
    
    # Search approved foods only for general search
    foods = Food.objects.filter(
        Q(name__icontains=query) | Q(description__icontains=query),
        status='Approved'
    ).distinct()[:10]
    
    results = []
    for food in foods:
        # Get image URL using serializer method for consistency
        serializer = FoodSerializer(food)
        image_url = serializer.get_image_url(food)
        
        results.append({
            'id': food.food_id,
            'name': food.name,
            'description': food.description,
            'category': food.category,
            'image_url': image_url
        })
    
    return Response(results)


@api_view(['POST'])
def upload_image(request):
    """Image upload endpoint for Cloudinary"""
    from utils.cloudinary_utils import upload_image_to_cloudinary
    
    if 'image' not in request.FILES:
        return Response({'error': 'No image provided'}, status=status.HTTP_400_BAD_REQUEST)
    
    image_file = request.FILES['image']
    try:
        result = upload_image_to_cloudinary(image_file)
        return Response({
            'url': result['secure_url'],
            'public_id': result['public_id']
        })
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class CuisineViewSet(viewsets.ModelViewSet):
    queryset = Cuisine.objects.all()
    serializer_class = CuisineSerializer
    permission_classes = []  # Allow access to all users for viewing cuisines


class FoodCategoryViewSet(viewsets.ModelViewSet):
    queryset = FoodCategory.objects.all()
    serializer_class = FoodCategorySerializer
    permission_classes = []  # Allow access to all users for viewing categories


class ChefFoodViewSet(viewsets.ModelViewSet):
    """Chef can manage own menu - /api/food/chef/foods/"""
    serializer_class = FoodSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Food.objects.filter(chef=self.request.user).prefetch_related('prices')
    
    def get_serializer_class(self):
        if self.action == 'create':
            return ChefFoodCreateSerializer
        return FoodSerializer

    def create(self, request, *args, **kwargs):
        """Create new food item with initial price"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        food = serializer.save()
        
        # Return the created food with all details
        response_serializer = FoodSerializer(food, context={'request': request})
        return Response({
            'message': 'New food submitted. Pending admin approval.',
            'food': response_serializer.data
        }, status=status.HTTP_201_CREATED)
    
    def update(self, request, *args, **kwargs):
        """Update food item (chefs can only update availability)"""
        food = self.get_object()
        
        # Only allow availability updates for chefs
        allowed_fields = {'is_available'}
        update_data = {k: v for k, v in request.data.items() if k in allowed_fields}
        
        if update_data:
            for attr, value in update_data.items():
                setattr(food, attr, value)
            food.save()
        
        return Response({
            'message': 'Food updated successfully.',
            'food': FoodSerializer(food, context={'request': request}).data
        })
    
    def perform_destroy(self, instance):
        """Only allow chef to delete their own foods"""
        if instance.chef != self.request.user:
            raise PermissionError("You can only delete your own foods")
        instance.delete()

    @action(detail=False, methods=['get'])
    def search(self, request):
        """Search foods for autocomplete - /api/food/chef/foods/search/?q=<query>"""
        query = request.query_params.get('q', '').strip()
        if not query or len(query) < 2:
            return Response([])
        
        # Search all foods for autocomplete (approved ones)
        foods = Food.objects.filter(
            Q(name__icontains=query) | Q(description__icontains=query),
            status='Approved'
        ).distinct()[:10]
        
        results = []
        for food in foods:
            # Get image URL using serializer method for consistency
            serializer = FoodSerializer(food)
            image_url = serializer.get_image_url(food)
            
            results.append({
                'id': food.food_id,
                'name': food.name,
                'description': food.description,
                'category': food.category,
                'image_url': image_url
            })
        
        return Response(results)


class ChefFoodPriceViewSet(viewsets.ModelViewSet):
    """Chef can manage prices for foods - /api/food/chef/prices/"""
    serializer_class = ChefFoodPriceSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return FoodPrice.objects.filter(cook=self.request.user)
    
    def create(self, request, *args, **kwargs):
        """Create new price for existing food"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        price = serializer.save()
        
        return Response({
            'message': 'Price added successfully.',
            'price': FoodPriceSerializer(price).data
        }, status=status.HTTP_201_CREATED)


class FoodReviewViewSet(viewsets.ModelViewSet):
    queryset = FoodReview.objects.all()
    serializer_class = FoodReviewSerializer
    permission_classes = [IsAuthenticated]


class OfferViewSet(viewsets.ModelViewSet):
    queryset = Offer.objects.all()
    serializer_class = OfferSerializer
    permission_classes = [IsAuthenticated]
    
    def update(self, request, *args, **kwargs):
        """Restrict chef updates to price, size, preparation_time, and availability only"""
        food = self.get_object()
        
        # Only allow specific fields to be updated by chefs
        allowed_fields = {'is_available'}
        update_data = {k: v for k, v in request.data.items() if k in allowed_fields}
        
        # Handle price updates through FoodPrice model
        if any(field in request.data for field in ['price', 'size', 'preparation_time']):
            food_price = FoodPrice.objects.filter(food=food, cook=request.user).first()
            if food_price:
                price_update_data = {}
                if 'price' in request.data:
                    price_update_data['price'] = request.data['price']
                if 'size' in request.data:
                    price_update_data['size'] = request.data['size']
                if 'preparation_time' in request.data:
                    price_update_data['preparation_time'] = request.data['preparation_time']
                
                price_serializer = FoodPriceSerializer(food_price, data=price_update_data, partial=True)
                price_serializer.is_valid(raise_exception=True)
                price_serializer.save()
        
        # Update allowed food fields
        if update_data:
            for attr, value in update_data.items():
                setattr(food, attr, value)
            food.save()
        
        return Response({
            'message': 'Food updated successfully.',
            'food': FoodSerializer(food, context={'request': request}).data
        })
    
    @action(detail=True, methods=['patch'])
    def toggle_availability(self, request, pk=None):
        """Toggle food availability"""
        food = self.get_object()
        food.is_available = not food.is_available
        food.save()
        
        return Response({
            'message': f'Food {"enabled" if food.is_available else "disabled"} successfully',
            'is_available': food.is_available
        })
    
    @action(detail=False, methods=['get'])
    def search(self, request):
        """Search foods for autocomplete - /api/food/chef/foods/search/?q=<query>"""
        query = request.query_params.get('q', '').strip()
        if not query:
            return Response([])
        
        # Search all foods (not just chef's own) for autocomplete
        foods = Food.objects.filter(
            Q(name__icontains=query) | Q(description__icontains=query)
        ).distinct()[:10]
        
        results = []
        for food in foods:
            results.append({
                'id': food.id,
                'name': food.name,
                'description': food.description,
                'image_url': food.image.url if food.image else None,
                'exists': True
            })
        
        return Response(results)

    def get_queryset(self):
        queryset = Food.objects.filter(chef=self.request.user).prefetch_related('prices')
        
        # Search functionality
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) | 
                Q(description__icontains=search) |
                Q(category__name__icontains=search)
            )
        
        # Filter by category
        category = self.request.query_params.get('category', None)
        if category:
            queryset = queryset.filter(category_id=category)
        
        # Filter by availability
        available = self.request.query_params.get('available', None)
        if available is not None:
            is_available = available.lower() in ['true', '1']
            queryset = queryset.filter(is_available=is_available)
        
        return queryset.order_by('-created_at')


class CustomerFoodViewSet(viewsets.ReadOnlyModelViewSet):
    """Customers can view approved foods - /api/customer/foods/"""
    serializer_class = FoodSerializer
    permission_classes = []  # Allow access to all users including guests
    pagination_class = None  # Disable pagination to show all foods
    
    def get_queryset(self):
        queryset = Food.objects.filter(
            status='Approved', 
            is_available=True
        ).prefetch_related('prices').select_related('chef', 'food_category')
        
        # Search functionality
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) | 
                Q(description__icontains=search) |
                Q(food_category__name__icontains=search) |
                Q(chef__first_name__icontains=search) |
                Q(chef__last_name__icontains=search)
            )
        
        # Filter by category
        category = self.request.query_params.get('category', None)
        if category:
            queryset = queryset.filter(food_category_id=category)
        
        # Filter by cuisine
        cuisine = self.request.query_params.get('cuisine', None)
        if cuisine:
            queryset = queryset.filter(food_category__cuisine_id=cuisine)
        
        # Filter by chef
        chef = self.request.query_params.get('chef', None)
        if chef:
            queryset = queryset.filter(chef_id=chef)
        
        # Price range filtering
        min_price = self.request.query_params.get('min_price', None)
        max_price = self.request.query_params.get('max_price', None)
        if min_price or max_price:
            price_filter = Q()
            if min_price:
                price_filter &= Q(prices__price__gte=min_price)
            if max_price:
                price_filter &= Q(prices__price__lte=max_price)
            queryset = queryset.filter(price_filter).distinct()
        
        return queryset.order_by('-created_at')

    @action(detail=True, methods=['get'], url_path='prices')
    def get_prices(self, request, pk=None):
        """Get prices for a specific food"""
        food = self.get_object()
        lat = request.query_params.get('lat')
        lng = request.query_params.get('lng')
        
        # Get prices for this food
        prices = food.prices.all()
        
        # If location is provided, calculate distance and delivery time
        if lat and lng:
            # Here you could add distance calculation logic
            # For now, just return the prices as is
            pass
            
        serializer = FoodPriceSerializer(prices, many=True)
        return Response(serializer.data)


class FoodPriceViewSet(viewsets.ModelViewSet):
    serializer_class = FoodPriceSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return FoodPrice.objects.filter(food__chef=self.request.user)


class FoodReviewViewSet(viewsets.ModelViewSet):
    serializer_class = FoodReviewSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return FoodReview.objects.all()

    def perform_create(self, serializer):
        serializer.save(reviewer=self.request.user)


class OfferViewSet(viewsets.ModelViewSet):
    queryset = Offer.objects.all()
    serializer_class = OfferSerializer
    permission_classes = [IsAuthenticated]


class FoodImageViewSet(viewsets.ModelViewSet):
    queryset = FoodImage.objects.all()
    serializer_class = FoodImageSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        # Filter by food if provided
        food_id = self.request.query_params.get('food_id')
        if food_id:
            return FoodImage.objects.filter(food_id=food_id)
        return FoodImage.objects.all()
# ================================
# ADMIN FOOD APPROVAL SYSTEM
# ================================

class AdminFoodApprovalViewSet(viewsets.ReadOnlyModelViewSet):
    """Admin endpoints for food approval workflow"""
    
    serializer_class = FoodSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Only admin users can access pending foods"""
        if not self.request.user.is_staff:
            return Food.objects.none()
        
        # Filter by status if provided
        status_filter = self.request.query_params.get('status', 'Pending')
        return Food.objects.filter(status=status_filter).order_by('-created_at')
    
    @action(detail=False, methods=['get'])
    def pending(self, request):
        """Get all foods pending approval"""
        if not request.user.is_staff:
            return Response(
                {'error': 'Admin access required'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        pending_foods = Food.objects.filter(status='Pending').order_by('-created_at')
        serializer = self.get_serializer(pending_foods, many=True)
        
        return Response({
            'count': pending_foods.count(),
            'foods': serializer.data
        })
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approve a pending food item"""
        if not request.user.is_staff:
            return Response(
                {'error': 'Admin access required'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        food = self.get_object()
        
        if food.status != 'Pending':
            return Response(
                {'error': 'Only pending foods can be approved'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Approve the food
        food.status = 'Approved'
        food.admin = request.user
        food.is_available = True  # Make available when approved
        food.save()
        
        # Send notification to chef
        self._notify_chef(food, 'approved', request.data.get('comments', ''))
        
        return Response({
            'message': f'Food "{food.name}" has been approved successfully',
            'food': FoodSerializer(food, context={'request': request}).data
        }, status=status.HTTP_200_OK)
    
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Reject a pending food item"""
        if not request.user.is_staff:
            return Response(
                {'error': 'Admin access required'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        food = self.get_object()
        
        if food.status != 'Pending':
            return Response(
                {'error': 'Only pending foods can be rejected'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        rejection_reason = request.data.get('reason', 'No reason provided')
        
        # Reject the food
        food.status = 'Rejected'
        food.admin = request.user
        food.is_available = False
        food.save()
        
        # Send notification to chef
        self._notify_chef(food, 'rejected', rejection_reason)
        
        return Response({
            'message': f'Food "{food.name}" has been rejected',
            'reason': rejection_reason
        }, status=status.HTTP_200_OK)
    
    def _notify_chef(self, food, action, comments):
        """Send notification to chef about approval decision"""
        from apps.communications.models import Notification
        
        if not food.chef:
            return
        
        if action == 'approved':
            subject = f"Food Approved: {food.name}"
            message = f"Great news! Your food item '{food.name}' has been approved and is now visible to customers."
        else:
            subject = f"Food Rejected: {food.name}"
            message = f"Your food item '{food.name}' has been rejected. Reason: {comments}"
        
        if comments and action == 'approved':
            message += f" Admin comments: {comments}"
        
        Notification.objects.create(
            user=food.chef,
            subject=subject,
            message=message,
            status='Unread'
        )


@api_view(['GET'])
def chef_food_status(request):
    """Get approval status of chef's submitted foods"""
    if not request.user:
        return Response(
            {'error': 'Authentication required'}, 
            status=status.HTTP_401_UNAUTHORIZED
        )
    
    chef_foods = Food.objects.filter(chef=request.user)
    
    from django.db.models import Count
    status_counts = chef_foods.values('status').annotate(count=Count('status'))
    
    recent_foods = chef_foods.order_by('-created_at')[:5]
    
    return Response({
        'status_summary': {item['status']: item['count'] for item in status_counts},
        'recent_submissions': FoodSerializer(recent_foods, many=True, context={'request': request}).data,
        'total_foods': chef_foods.count()
    })


class BulkMenuViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing bulk menus
    Provides CRUD operations for chefs to manage their bulk menus
    """
    serializer_class = BulkMenuSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['menu_name', 'description']
    ordering_fields = ['created_at', 'meal_type', 'base_price_per_person']
    ordering = ['-created_at']
    
    def get_queryset(self):
        """Filter bulk menus based on user role"""
        user = self.request.user
        
        # Admins can see all menus
        if user.is_staff:
            queryset = BulkMenu.objects.all()
        else:
            # Chefs can only see their own menus
            queryset = BulkMenu.objects.filter(chef=user)
        
        # Filter by meal type if provided
        meal_type = self.request.query_params.get('meal_type')
        if meal_type:
            queryset = queryset.filter(meal_type=meal_type)
        
        # Filter by approval status if provided
        approval_status = self.request.query_params.get('approval_status')
        if approval_status:
            queryset = queryset.filter(approval_status=approval_status)
        
        # Filter by availability status if provided
        availability_status = self.request.query_params.get('availability_status')
        if availability_status:
            is_available = availability_status.lower() == 'true'
            queryset = queryset.filter(availability_status=is_available)
        
        return queryset.select_related('chef', 'approved_by').prefetch_related('items')
    
    def get_serializer_class(self):
        """Return appropriate serializer based on action"""
        if self.action == 'create':
            return BulkMenuCreateSerializer
        return BulkMenuSerializer
    
    def perform_create(self, serializer):
        """Set chef to current user when creating"""
        serializer.save(chef=self.request.user)
    

    
    def update(self, request, *args, **kwargs):
        """Custom update to reset approval status when menu is modified"""
        instance = self.get_object()
        
        # Only allow chef to update their own menus (unless admin)
        if not request.user.is_staff and instance.chef != request.user:
            return Response(
                {'error': 'You can only update your own menus'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Reset approval status if menu content is modified
        significant_fields = ['menu_name', 'description', 'base_price_per_person', 'min_persons', 'max_persons']
        if any(field in request.data for field in significant_fields):
            if instance.approval_status == 'approved':
                instance.approval_status = 'pending'
                instance.approved_by = None
                instance.approved_at = None
                instance.save()
        
        return super().update(request, *args, **kwargs)
    
    @action(detail=True, methods=['put', 'patch'])
    def update_with_items(self, request, pk=None):
        """Update bulk menu with its items"""
        instance = self.get_object()
        
        # Only allow chef to update their own menus (unless admin)
        if not request.user.is_staff and instance.chef != request.user:
            return Response(
                {'error': 'You can only update your own menus'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Use BulkMenuCreateSerializer for updates that include items
        serializer = BulkMenuCreateSerializer(
            instance, 
            data=request.data, 
            partial=request.method == 'PATCH',
            context={'request': request}
        )
        
        if serializer.is_valid():
            # Reset approval status if content is modified
            significant_fields = ['menu_name', 'description', 'base_price_per_person', 'min_persons', 'max_persons', 'items']
            if any(field in request.data for field in significant_fields):
                if instance.approval_status == 'approved':
                    instance.approval_status = 'pending'
                    instance.approved_by = None
                    instance.approved_at = None
                    instance.save()
            
            # If items are provided, update them
            if 'items' in request.data:
                # Delete existing items
                instance.items.all().delete()
                
                # Create new items from the provided data
                items_data = serializer.validated_data.pop('items', [])
                updated_instance = serializer.save()
                
                for item_data in items_data:
                    BulkMenuItem.objects.create(bulk_menu=updated_instance, **item_data)
            else:
                updated_instance = serializer.save()
            
            # Return updated data with the read serializer
            response_serializer = BulkMenuSerializer(updated_instance, context={'request': request})
            return Response(response_serializer.data)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def approve(self, request, pk=None):
        """Approve a bulk menu (admin only)"""
        bulk_menu = self.get_object()
        
        if bulk_menu.approval_status == 'approved':
            return Response({'message': 'Menu is already approved'})
        
        bulk_menu.approval_status = 'approved'
        bulk_menu.approved_by = request.user
        bulk_menu.approved_at = timezone.now()
        bulk_menu.save()
        
        serializer = self.get_serializer(bulk_menu)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def reject(self, request, pk=None):
        """Reject a bulk menu (admin only)"""
        bulk_menu = self.get_object()
        rejection_reason = request.data.get('rejection_reason', '')
        
        if bulk_menu.approval_status == 'rejected':
            return Response({'message': 'Menu is already rejected'})
        
        bulk_menu.approval_status = 'rejected'
        bulk_menu.rejection_reason = rejection_reason
        bulk_menu.approved_by = None
        bulk_menu.approved_at = None
        bulk_menu.save()
        
        serializer = self.get_serializer(bulk_menu)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def toggle_availability(self, request, pk=None):
        """Toggle menu availability status"""
        bulk_menu = self.get_object()
        
        # Only allow chef to toggle their own menus (unless admin)
        if not request.user.is_staff and bulk_menu.chef != request.user:
            return Response(
                {'error': 'You can only modify your own menus'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        bulk_menu.availability_status = not bulk_menu.availability_status
        bulk_menu.save()
        
        serializer = self.get_serializer(bulk_menu)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def calculate_cost(self, request, pk=None):
        """Calculate total cost for bulk menu"""
        bulk_menu = self.get_object()
        
        # Validate request data
        serializer = BulkMenuCostCalculationSerializer(data={
            'bulk_menu_id': bulk_menu.id,
            **request.data
        })
        
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        validated_data = serializer.validated_data
        num_persons = validated_data['num_persons']
        optional_items = validated_data.get('optional_items', [])
        
        # Calculate base cost
        base_cost = bulk_menu.base_price_per_person * num_persons
        
        # Calculate optional items cost
        optional_cost = 0
        if optional_items:
            optional_items_qs = bulk_menu.items.filter(
                id__in=optional_items, 
                is_optional=True
            )
            optional_cost = sum(item.extra_cost for item in optional_items_qs) * num_persons
        
        total_cost = base_cost + optional_cost
        
        return Response({
            'bulk_menu_id': bulk_menu.id,
            'menu_name': bulk_menu.menu_name,
            'num_persons': num_persons,
            'base_price_per_person': bulk_menu.base_price_per_person,
            'base_cost': base_cost,
            'optional_cost': optional_cost,
            'total_cost': total_cost,
            'cost_breakdown': {
                'base_cost': base_cost,
                'optional_items_cost': optional_cost,
                'total_cost': total_cost
            }
        })
    
    @action(detail=False, methods=['get'])
    def meal_types(self, request):
        """Get available meal types"""
        from .models import BulkMealType
        return Response([
            {'value': choice[0], 'label': choice[1]} 
            for choice in BulkMealType.choices
        ])
    
    @action(detail=False, methods=['get'])
    def chef_dashboard_stats(self, request):
        """Get chef dashboard statistics for bulk menus"""
        if not request.user.is_authenticated:
            return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)
        
        chef_menus = BulkMenu.objects.filter(chef=request.user)
        
        from django.db.models import Count
        stats = {
            'total_menus': chef_menus.count(),
            'approved_menus': chef_menus.filter(approval_status='approved').count(),
            'pending_menus': chef_menus.filter(approval_status='pending').count(),
            'rejected_menus': chef_menus.filter(approval_status='rejected').count(),
            'available_menus': chef_menus.filter(availability_status=True, approval_status='approved').count(),
        }
        
        # Meal type breakdown
        meal_type_stats = chef_menus.values('meal_type').annotate(count=Count('meal_type'))
        stats['meal_type_breakdown'] = {item['meal_type']: item['count'] for item in meal_type_stats}
        
        # Recent menus
        recent_menus = chef_menus.order_by('-created_at')[:5]
        stats['recent_menus'] = BulkMenuSerializer(recent_menus, many=True, context={'request': request}).data
        
        return Response(stats)


class BulkMenuItemViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing bulk menu items
    """
    serializer_class = BulkMenuItemSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter items based on bulk menu access"""
        user = self.request.user
        
        if user.is_staff:
            # Admins can see all items
            return BulkMenuItem.objects.all()
        else:
            # Chefs can only see items from their own menus
            return BulkMenuItem.objects.filter(bulk_menu__chef=user)
    
    def perform_create(self, serializer):
        """Validate bulk menu ownership before creating item"""
        bulk_menu = serializer.validated_data['bulk_menu']
        
        # Ensure chef can only add items to their own menus
        if not self.request.user.is_staff and bulk_menu.chef != self.request.user:
            raise serializers.ValidationError("You can only add items to your own menus")
        
        # Reset approval status if adding items to approved menu
        if bulk_menu.approval_status == 'approved':
            bulk_menu.approval_status = 'pending'
            bulk_menu.approved_by = None
            bulk_menu.approved_at = None
            bulk_menu.save()
        
        serializer.save()
    
    def perform_update(self, serializer):
        """Reset approval status when items are modified"""
        instance = serializer.instance
        bulk_menu = instance.bulk_menu
        
        # Ensure chef can only modify their own menu items
        if not self.request.user.is_staff and bulk_menu.chef != self.request.user:
            raise serializers.ValidationError("You can only modify items in your own menus")
        
        # Reset approval status if modifying items in approved menu
        if bulk_menu.approval_status == 'approved':
            bulk_menu.approval_status = 'pending'
            bulk_menu.approved_by = None
            bulk_menu.approved_at = None
            bulk_menu.save()
        
        serializer.save()
    
    def perform_destroy(self, instance):
        """Reset approval status when items are deleted"""
        bulk_menu = instance.bulk_menu
        
        # Ensure chef can only delete their own menu items
        if not self.request.user.is_staff and bulk_menu.chef != self.request.user:
            raise serializers.ValidationError("You can only delete items from your own menus")
        
        # Reset approval status if deleting items from approved menu
        if bulk_menu.approval_status == 'approved':
            bulk_menu.approval_status = 'pending'
            bulk_menu.approved_by = None
            bulk_menu.approved_at = None
            bulk_menu.save()
