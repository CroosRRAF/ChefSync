from rest_framework import viewsets, status, filters
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q, Avg, Count
from .models import Cuisine, FoodCategory, Food, FoodReview, FoodPrice, Offer, FoodImage
from .serializers import CuisineSerializer, FoodCategorySerializer, FoodSerializer, FoodReviewSerializer, FoodPriceSerializer, OfferSerializer
import math


class CuisineViewSet(viewsets.ModelViewSet):
    queryset = Cuisine.objects.filter(is_active=True)
    serializer_class = CuisineSerializer
    permission_classes = [AllowAny]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description']
    ordering_fields = ['sort_order', 'name']
    ordering = ['sort_order', 'name']


class FoodCategoryViewSet(viewsets.ModelViewSet):
    queryset = FoodCategory.objects.filter(is_active=True)
    serializer_class = FoodCategorySerializer
    permission_classes = [AllowAny]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description']
    ordering_fields = ['sort_order', 'name']
    ordering = ['sort_order', 'name']


class FoodViewSet(viewsets.ModelViewSet):
    queryset = Food.objects.filter(status='Approved', is_available=True)
    serializer_class = FoodSerializer
    permission_classes = [AllowAny]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description', 'ingredients']
    ordering_fields = ['name', 'rating_average', 'total_orders', 'created_at']
    ordering = ['-rating_average', '-total_orders']

    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Apply filters
        search = self.request.query_params.get('q', None)
        category = self.request.query_params.get('category', None)
        cuisine = self.request.query_params.get('cuisine', None)
        min_price = self.request.query_params.get('min_price', None)
        max_price = self.request.query_params.get('max_price', None)
        is_vegetarian = self.request.query_params.get('veg', None)
        lat = self.request.query_params.get('lat', None)
        lng = self.request.query_params.get('lng', None)
        delivery = self.request.query_params.get('delivery', None)
        sort_by = self.request.query_params.get('sort_by', 'popularity')
        
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) | 
                Q(description__icontains=search) |
                Q(ingredients__icontains=search)
            )
        
        if category:
            queryset = queryset.filter(food_category__name__icontains=category)
        
        if cuisine:
            queryset = queryset.filter(food_category__cuisine__name__icontains=cuisine)
        
        if is_vegetarian == 'true':
            queryset = queryset.filter(is_vegetarian=True)
        elif is_vegetarian == 'false':
            queryset = queryset.filter(is_vegetarian=False)
        
        if min_price:
            queryset = queryset.filter(prices__price__gte=float(min_price)).distinct()
        
        if max_price:
            queryset = queryset.filter(prices__price__lte=float(max_price)).distinct()
        
        # Apply sorting
        if sort_by == 'rating':
            queryset = queryset.order_by('-rating_average')
        elif sort_by == 'price_low':
            queryset = queryset.order_by('prices__price')
        elif sort_by == 'price_high':
            queryset = queryset.order_by('-prices__price')
        elif sort_by == 'newest':
            queryset = queryset.order_by('-created_at')
        elif sort_by == 'popularity':
            queryset = queryset.order_by('-total_orders', '-rating_average')
        
        return queryset

    @action(detail=True, methods=['get'])
    def prices(self, request, pk=None):
        """Get all prices for a specific food item with cook information"""
        food = self.get_object()
        prices = FoodPrice.objects.filter(food=food).select_related('cook')
        
        # Get user location if provided
        lat = request.query_params.get('lat')
        lng = request.query_params.get('lng')
        
        price_data = []
        for price in prices:
            price_info = {
                'price_id': price.price_id,
                'size': price.size,
                'price': float(price.price),
                'image_url': price.image_url,
                'cook': {
                    'id': price.cook.pk,
                    'name': price.cook.name,
                    'rating': getattr(price.cook, 'rating', 4.5),  # Default rating
                    'is_active': price.cook.is_active,
                },
                'created_at': price.created_at,
            }
            
            # Calculate distance if coordinates provided
            if lat and lng:
                # Simple distance calculation (you might want to use proper geolocation)
                cook_lat = getattr(price.cook, 'latitude', None)
                cook_lng = getattr(price.cook, 'longitude', None)
                if cook_lat and cook_lng:
                    distance = self.calculate_distance(float(lat), float(lng), cook_lat, cook_lng)
                    price_info['distance'] = round(distance, 2)
                    price_info['estimated_delivery_time'] = max(15, int(distance * 2))  # Rough estimate
            
            price_data.append(price_info)
        
        # Sort by distance if coordinates provided, otherwise by price
        if lat and lng:
            price_data.sort(key=lambda x: x.get('distance', float('inf')))
        else:
            price_data.sort(key=lambda x: x['price'])
        
        return Response({
            'food': FoodSerializer(food).data,
            'prices': price_data
        })
    
    def calculate_distance(self, lat1, lng1, lat2, lng2):
        """Calculate distance between two points in kilometers"""
        R = 6371  # Earth's radius in kilometers
        
        dlat = math.radians(lat2 - lat1)
        dlng = math.radians(lng2 - lng1)
        
        a = (math.sin(dlat/2) * math.sin(dlat/2) + 
             math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * 
             math.sin(dlng/2) * math.sin(dlng/2))
        
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
        return R * c


class FoodReviewViewSet(viewsets.ModelViewSet):
    queryset = FoodReview.objects.all()
    serializer_class = FoodReviewSerializer
    permission_classes = [IsAuthenticated]


class FoodPriceViewSet(viewsets.ModelViewSet):
    queryset = FoodPrice.objects.all()
    serializer_class = FoodPriceSerializer
    permission_classes = [IsAuthenticated]


class OfferViewSet(viewsets.ModelViewSet):
    queryset = Offer.objects.all()
    serializer_class = OfferSerializer
    permission_classes = [IsAuthenticated]