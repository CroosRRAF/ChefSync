from rest_framework import serializers
from .models import Cuisine, FoodCategory, Food, FoodReview, FoodPrice, Offer, FoodImage
from utils.cloudinary_utils import get_optimized_url


class CuisineSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()
    thumbnail_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Cuisine
        fields = ['id', 'name', 'description', 'image', 'image_url', 'thumbnail_url', 'is_active', 'sort_order']
    
    def get_image_url(self, obj):
        """Return optimized Cloudinary URL"""
        if obj.image:
            return get_optimized_url(str(obj.image))
        return None
    
    def get_thumbnail_url(self, obj):
        """Get thumbnail version of the image"""
        if obj.image:
            return get_optimized_url(str(obj.image), width=200, height=200)
        return None


class FoodCategorySerializer(serializers.ModelSerializer):
    cuisine_name = serializers.CharField(source='cuisine.name', read_only=True)
    image_url = serializers.SerializerMethodField()
    thumbnail_url = serializers.SerializerMethodField()
    
    class Meta:
        model = FoodCategory
        fields = ['id', 'name', 'cuisine', 'cuisine_name', 'description', 'image', 'image_url', 'thumbnail_url', 'is_active', 'sort_order']
    
    def get_image_url(self, obj):
        """Return optimized Cloudinary URL"""
        if obj.image:
            return get_optimized_url(str(obj.image))
        return None
    
    def get_thumbnail_url(self, obj):
        """Get thumbnail version of the image"""
        if obj.image:
            return get_optimized_url(str(obj.image), width=200, height=200)
        return None


class FoodImageSerializer(serializers.ModelSerializer):
    optimized_url = serializers.ReadOnlyField()
    thumbnail = serializers.ReadOnlyField()
    
    class Meta:
        model = FoodImage
        fields = [
            'id', 'image_url', 'thumbnail_url', 'cloudinary_public_id', 'caption', 
            'is_primary', 'sort_order', 'alt_text', 'optimized_url', 'thumbnail',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']
    
    def create(self, validated_data):
        """Create new FoodImage with Cloudinary URL"""
        return super().create(validated_data)
    
    def update(self, instance, validated_data):
        """Update FoodImage"""
        return super().update(instance, validated_data)


class FoodPriceSerializer(serializers.ModelSerializer):
    food_name = serializers.CharField(source='food.name', read_only=True)
    cook_name = serializers.CharField(source='cook.name', read_only=True)
    cook_rating = serializers.SerializerMethodField()
    image_data_url = serializers.SerializerMethodField()
    
    class Meta:
        model = FoodPrice
        fields = [
            'price_id', 'size', 'price', 'preparation_time', 'image_url', 'image_data_url', 'food', 'food_name', 'cook', 'cook_name',
            'cook_rating', 'created_at', 'updated_at'
        ]
        read_only_fields = ['price_id', 'created_at', 'updated_at']
    
    def get_cook_rating(self, obj):
        # You might want to calculate this from reviews
        return getattr(obj.cook, 'rating', 4.5)
    
    def get_image_data_url(self, obj):
        """Return optimized Cloudinary URL"""
        if obj.image_url:
            return get_optimized_url(str(obj.image_url))
        return None


class FoodSerializer(serializers.ModelSerializer):
    images = FoodImageSerializer(many=True, read_only=True)
    primary_image = serializers.SerializerMethodField()
    thumbnail_url = serializers.SerializerMethodField()
    category_name = serializers.CharField(source='food_category.name', read_only=True)
    cuisine_name = serializers.CharField(source='food_category.cuisine.name', read_only=True)
    available_cooks_count = serializers.SerializerMethodField()
    chef_name = serializers.CharField(source="chef.username", read_only=True)
    chef_rating = serializers.DecimalField(source="chef.chef_profile.rating_average", max_digits=3, decimal_places=2, read_only=True)
    prices = FoodPriceSerializer(many=True, read_only=True)
    image_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Food
        fields = [
            'food_id', 'name', 'description', 'category', 'food_category', 'category_name', 'cuisine_name',
            'is_available', 'is_featured', 'preparation_time', 'calories_per_serving', 'ingredients',
            'allergens', 'nutritional_info', 'is_vegetarian', 'is_vegan', 'is_gluten_free', 'spice_level',
            'rating_average', 'total_reviews', 'total_orders', 'images', 'primary_image', 'available_cooks_count',
            'image_url', 'thumbnail_url', 'status', 'chef', 'chef_name', 'chef_rating', 'prices', 'created_at', 'updated_at'
        ]
        read_only_fields = ['food_id', 'chef', 'chef_name', 'chef_rating', 'prices', 'created_at', 'updated_at']
    
    def get_primary_image(self, obj):
        """Return the primary image URL"""
        primary_img = obj.images.filter(is_primary=True).first()
        if primary_img:
            return primary_img.optimized_url
        # Fallback to first image
        first_img = obj.images.first()
        if first_img:
            return first_img.optimized_url
        return None
    
    def get_image_url(self, obj):
        """Get primary image URL for compatibility"""
        primary_image = self.get_primary_image(obj)
        if primary_image:
            return primary_image
        # Fallback to old image field if exists
        if hasattr(obj, 'image') and obj.image:
            return obj.image.url if hasattr(obj.image, 'url') else str(obj.image)
        return None
    
    def get_thumbnail_url(self, obj):
        """Get thumbnail version of the primary image"""
        primary_img = obj.images.filter(is_primary=True).first()
        if primary_img:
            return primary_img.thumbnail
        # Fallback to first image thumbnail
        first_img = obj.images.first()
        if first_img:
            return first_img.thumbnail
        return None
    
    def get_available_cooks_count(self, obj):
        """Get count of cooks who have prices for this food"""
        return obj.prices.values('cook').distinct().count()

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
    
    def validate(self, data):
        """Check for duplicate price entries"""
        user = self.context['request'].user
        food = data.get('food')
        size = data.get('size')
        
        # Check if a price already exists for this combination
        existing_price = FoodPrice.objects.filter(
            food=food,
            size=size,
            cook=user
        ).first()
        
        if existing_price:
            raise serializers.ValidationError({
                'non_field_errors': [f'You already have a {size} price for this food item. Please update the existing price instead.']
            })
        
        return data
        
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
    
    def validate(self, data):
        """Add debug logging for all validation data"""
        print(f"DEBUG: Full validation data received: {data}")
        print(f"DEBUG: Data types: {[(k, type(v)) for k, v in data.items()]}")
        
        # Ensure ingredients is properly processed
        if 'ingredients' in data:
            ingredients = data['ingredients']
            print(f"DEBUG: Raw ingredients: {ingredients} (type: {type(ingredients)})")
            
            # Force proper conversion to list for JSONField
            if isinstance(ingredients, str):
                ingredients = ingredients.strip()
                if ingredients:
                    try:
                        import json
                        # Try parsing as JSON first
                        parsed = json.loads(ingredients)
                        if isinstance(parsed, list):
                            data['ingredients'] = [str(item).strip() for item in parsed if str(item).strip()]
                        else:
                            data['ingredients'] = [str(parsed).strip()] if str(parsed).strip() else []
                    except (json.JSONDecodeError, ValueError):
                        # Fall back to comma-separated parsing
                        data['ingredients'] = [item.strip() for item in ingredients.split(',') if item.strip()]
                else:
                    data['ingredients'] = []
            elif not isinstance(ingredients, list):
                data['ingredients'] = []
            
            print(f"DEBUG: Final processed ingredients: {data['ingredients']} (type: {type(data['ingredients'])})")
        
        return data
    
    def create(self, validated_data):
        # Debug logging to see what ingredients we received
        print(f"DEBUG: Creating food with validated_data ingredients: {validated_data.get('ingredients')}")
        print(f"DEBUG: Ingredients type: {type(validated_data.get('ingredients'))}")
        
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
    customer_name = serializers.CharField(source='customer.username', read_only=True)
    
    class Meta:
        model = FoodReview
        fields = [
            'review_id', 'rating', 'comment', 'customer', 'customer_name', 'taste_rating',
            'presentation_rating', 'value_rating', 'is_verified_purchase', 'helpful_votes',
            'created_at', 'updated_at'
        ]


class OfferSerializer(serializers.ModelSerializer):
    class Meta:
        model = Offer
        fields = '__all__'