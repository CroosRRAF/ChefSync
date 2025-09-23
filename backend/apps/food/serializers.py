from rest_framework import serializers
from .models import Cuisine, FoodCategory, Food, FoodReview, FoodPrice, Offer


class CuisineSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cuisine
        fields = '__all__'


class FoodCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = FoodCategory
        fields = '__all__'


class FoodPriceSerializer(serializers.ModelSerializer):
    class Meta:
        model = FoodPrice
        fields = ['price_id', 'size', 'price', 'preparation_time', 'image_url', 'food', 'cook', 'created_at', 'updated_at']
        read_only_fields = ['price_id', 'created_at', 'updated_at']


class FoodSerializer(serializers.ModelSerializer):
    chef_name = serializers.CharField(source="chef.username", read_only=True)
    chef_rating = serializers.DecimalField(source="chef.chef_profile.rating_average", max_digits=3, decimal_places=2, read_only=True)
    prices = FoodPriceSerializer(many=True, read_only=True)
    image_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Food
        fields = [
            "food_id", "name", "description", "category", "image", "image_url",
            "status", "preparation_time", "chef", "chef_name", "chef_rating",
            "prices", "ingredients", "is_vegetarian", "is_vegan", "is_available",
            "spice_level", "rating_average", "total_reviews", "total_orders",
            "created_at", "updated_at"
        ]
        read_only_fields = ['food_id', 'chef', 'chef_name', 'chef_rating', 'prices', 'created_at', 'updated_at']

    def get_image_url(self, obj):
        if obj.image:
            return obj.image.url if hasattr(obj.image, 'url') else str(obj.image)
        return None

    def create(self, validated_data):
        # Set status to pending and assign current user as chef
        validated_data['status'] = 'Pending'
        validated_data['chef'] = self.context['request'].user
        return super().create(validated_data)


class ChefFoodPriceSerializer(serializers.ModelSerializer):
    """Serializer for chefs to create prices for existing foods"""
    class Meta:
        model = FoodPrice
        fields = ['price', 'size', 'preparation_time', 'food']
        
    def create(self, validated_data):
        validated_data['cook'] = self.context['request'].user
        return super().create(validated_data)


class ChefFoodCreateSerializer(serializers.ModelSerializer):
    """Serializer for chefs to create new food items"""
    # Price fields for the initial price entry
    price = serializers.DecimalField(max_digits=10, decimal_places=2, write_only=True)
    size = serializers.CharField(max_length=10, write_only=True, default='Medium')
    preparation_time = serializers.IntegerField(write_only=True, default=15)
    
    class Meta:
        model = Food
        fields = [
            'name', 'description', 'category', 'image', 'ingredients', 
            'is_vegetarian', 'is_vegan', 'spice_level', 'is_available',
            'price', 'size', 'preparation_time'
        ]
    
    def validate_ingredients(self, value):
        """Convert string ingredients to list format"""
        if isinstance(value, str):
            ingredients_list = [ingredient.strip() for ingredient in value.split(',') if ingredient.strip()]
            return ingredients_list
        elif isinstance(value, list):
            return value
        else:
            return []
    
    def create(self, validated_data):
        # Extract price data
        price = validated_data.pop('price')
        size = validated_data.pop('size', 'Medium')
        prep_time = validated_data.pop('preparation_time', 15)
        
        # Set status to pending and assign chef
        validated_data['status'] = 'Pending'
        validated_data['chef'] = self.context['request'].user
        
        # Ensure ingredients is properly formatted
        if 'ingredients' not in validated_data:
            validated_data['ingredients'] = []
        
        # Create food item
        food = super().create(validated_data)
        
        # Create initial price entry
        FoodPrice.objects.create(
            food=food,
            size=size,
            price=price,
            preparation_time=prep_time,
            cook=self.context['request'].user
        )
        
        return food


class FoodReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = FoodReview
        fields = '__all__'


class OfferSerializer(serializers.ModelSerializer):
    class Meta:
        model = Offer
        fields = '__all__'
