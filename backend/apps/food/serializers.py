from rest_framework import serializers
from .models import Cuisine, FoodCategory, Food, FoodReview, FoodPrice, Offer, FoodImage


class CuisineSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cuisine
        fields = ['id', 'name', 'description', 'image', 'is_active', 'sort_order']


class FoodCategorySerializer(serializers.ModelSerializer):
    cuisine_name = serializers.CharField(source='cuisine.name', read_only=True)
    
    class Meta:
        model = FoodCategory
        fields = ['id', 'name', 'cuisine', 'cuisine_name', 'description', 'image', 'is_active', 'sort_order']


class FoodImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = FoodImage
        fields = ['id', 'image', 'thumbnail', 'caption', 'is_primary', 'sort_order']


class FoodSerializer(serializers.ModelSerializer):
    images = FoodImageSerializer(many=True, read_only=True)
    primary_image = serializers.SerializerMethodField()
    category_name = serializers.CharField(source='food_category.name', read_only=True)
    cuisine_name = serializers.CharField(source='food_category.cuisine.name', read_only=True)
    available_cooks_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Food
        fields = [
            'food_id', 'name', 'description', 'category', 'food_category', 'category_name', 'cuisine_name',
            'is_available', 'is_featured', 'preparation_time', 'calories_per_serving', 'ingredients',
            'allergens', 'nutritional_info', 'is_vegetarian', 'is_vegan', 'is_gluten_free', 'spice_level',
            'rating_average', 'total_reviews', 'total_orders', 'images', 'primary_image', 'available_cooks_count',
            'created_at', 'updated_at'
        ]
    
    def get_primary_image(self, obj):
        # Temporarily return None to avoid 500 errors
        return None
    
    def get_available_cooks_count(self, obj):
        return obj.prices.filter(cook__is_active=True).count()


class FoodReviewSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    
    class Meta:
        model = FoodReview
        fields = [
            'review_id', 'rating', 'comment', 'customer', 'customer_name', 'taste_rating',
            'presentation_rating', 'value_rating', 'is_verified_purchase', 'helpful_votes',
            'created_at', 'updated_at'
        ]


class FoodPriceSerializer(serializers.ModelSerializer):
    food_name = serializers.CharField(source='food.name', read_only=True)
    cook_name = serializers.CharField(source='cook.name', read_only=True)
    cook_rating = serializers.SerializerMethodField()
    
    class Meta:
        model = FoodPrice
        fields = [
            'price_id', 'size', 'price', 'image_url', 'food', 'food_name', 'cook', 'cook_name',
            'cook_rating', 'created_at', 'updated_at'
        ]
    
    def get_cook_rating(self, obj):
        # You might want to calculate this from reviews
        return getattr(obj.cook, 'rating', 4.5)


class OfferSerializer(serializers.ModelSerializer):
    food_name = serializers.CharField(source='price.food.name', read_only=True)
    cook_name = serializers.CharField(source='price.cook.name', read_only=True)
    
    class Meta:
        model = Offer
        fields = [
            'offer_id', 'description', 'discount', 'valid_until', 'price', 'food_name',
            'cook_name', 'created_at'
        ]
