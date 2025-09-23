from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action, api_view
from rest_framework.response import Response
from django.db.models import Q
from .models import Cuisine, FoodCategory, Food, FoodReview, FoodPrice, Offer
from .serializers import (
    CuisineSerializer, FoodCategorySerializer, FoodSerializer, 
    ChefFoodCreateSerializer, ChefFoodPriceSerializer, FoodPriceSerializer, 
    FoodReviewSerializer, OfferSerializer
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
        results.append({
            'id': food.food_id,
            'name': food.name,
            'description': food.description,
            'category': food.category,
            'image_url': food.image.url if food.image else None
        })
    
    return Response(results)


class CuisineViewSet(viewsets.ModelViewSet):
    queryset = Cuisine.objects.all()
    serializer_class = CuisineSerializer
    permission_classes = [IsAuthenticated]


class FoodCategoryViewSet(viewsets.ModelViewSet):
    queryset = FoodCategory.objects.all()
    serializer_class = FoodCategorySerializer
    permission_classes = [IsAuthenticated]


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
            results.append({
                'id': food.food_id,
                'name': food.name,
                'description': food.description,
                'category': food.category,
                'image_url': food.image.url if food.image else None
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


class CustomerFoodViewSet(viewsets.ReadOnlyModelViewSet):
    """Customers can view approved foods only"""
    serializer_class = FoodSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Food.objects.filter(status='Approved').prefetch_related('prices')

    @action(detail=False, methods=['get'])
    def search(self, request):
        """Search approved foods for customers"""
        query = request.query_params.get('q', '').strip()
        if not query:
            return Response([])
        
        foods = Food.objects.filter(
            Q(name__icontains=query) | Q(description__icontains=query) | Q(category__icontains=query),
            status='Approved'
        ).distinct()[:20]
        
        serializer = self.get_serializer(foods, many=True)
        return Response(serializer.data)


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
    
    def get_queryset(self):
        queryset = Food.objects.filter(
            approval_status='approved', 
            is_available=True
        ).prefetch_related('prices').select_related('chef', 'category')
        
        # Search functionality
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) | 
                Q(description__icontains=search) |
                Q(category__name__icontains=search) |
                Q(chef__first_name__icontains=search) |
                Q(chef__last_name__icontains=search)
            )
        
        # Filter by category
        category = self.request.query_params.get('category', None)
        if category:
            queryset = queryset.filter(category_id=category)
        
        # Filter by cuisine
        cuisine = self.request.query_params.get('cuisine', None)
        if cuisine:
            queryset = queryset.filter(category__cuisine_id=cuisine)
        
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
