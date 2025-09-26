from rest_framework import serializers
from .models import Cuisine, FoodCategory, Food, FoodReview, FoodPrice, Offer
from utils.cloudinary_utils import get_optimized_url, upload_image_to_cloudinary
import base64
import uuid


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


class FoodPriceSerializer(serializers.ModelSerializer):
    food_name = serializers.CharField(source='food.name', read_only=True)
    cook_name = serializers.CharField(source='cook.name', read_only=True)
    cook_rating = serializers.SerializerMethodField()
    image_data_url = serializers.SerializerMethodField()
    cook = serializers.SerializerMethodField()
    
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
    
    def get_cook(self, obj):
        """Return cook information in the expected format"""
        profile_image_url = None
        if obj.cook.profile_image:
            # Convert binary image to base64 data URL
            import base64
            try:
                encoded_image = base64.b64encode(obj.cook.profile_image).decode('utf-8')
                profile_image_url = f"data:image/jpeg;base64,{encoded_image}"
            except Exception:
                profile_image_url = None
        
        return {
            'id': obj.cook.pk,  # Use pk instead of id
            'name': obj.cook.name,
            'rating': getattr(obj.cook, 'rating', 4.5),
            'is_active': getattr(obj.cook, 'is_active', True),
            'profile_image': profile_image_url
        }
    
    def get_image_data_url(self, obj):
        """Return optimized Cloudinary URL"""
        if obj.image_url:
            return get_optimized_url(str(obj.image_url))
        return None


class FoodSerializer(serializers.ModelSerializer):
    primary_image = serializers.SerializerMethodField()
    thumbnail_url = serializers.SerializerMethodField()
    category_name = serializers.CharField(source='food_category.name', read_only=True)
    cuisine_name = serializers.CharField(source='food_category.cuisine.name', read_only=True)
    available_cooks_count = serializers.SerializerMethodField()
    chef_name = serializers.CharField(source="chef.username", read_only=True)
    chef_rating = serializers.DecimalField(source="chef.chef_profile.rating_average", max_digits=3, decimal_places=2, read_only=True)
    prices = FoodPriceSerializer(many=True, read_only=True)
    image_url = serializers.SerializerMethodField()
    optimized_image_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Food
        fields = [
            'food_id', 'name', 'description', 'category', 'food_category', 'category_name', 'cuisine_name',
            'is_available', 'is_featured', 'preparation_time', 'calories_per_serving', 'ingredients',
            'allergens', 'nutritional_info', 'is_vegetarian', 'is_vegan', 'is_gluten_free', 'spice_level',
            'rating_average', 'total_reviews', 'total_orders', 'primary_image', 'available_cooks_count',
            'image_url', 'thumbnail_url', 'optimized_image_url', 'image',
            'status', 'chef', 'chef_name', 'chef_rating', 'prices', 'created_at', 'updated_at'
        ]
        read_only_fields = ['food_id', 'chef', 'chef_name', 'chef_rating', 'prices', 'created_at', 'updated_at']
    
    def get_primary_image(self, obj):
        """Return the primary image URL from the Food model"""
        return obj.optimized_image_url
    
    def get_image_url(self, obj):
        """Get primary image URL for compatibility"""
        return obj.image_url
    
    def get_optimized_image_url(self, obj):
        """Get optimized Cloudinary URL"""
        return obj.optimized_image_url
    
    def get_thumbnail_url(self, obj):
        """Get thumbnail URL"""
        return obj.thumbnail_url
    
    def get_available_cooks_count(self, obj):
        """Get count of cooks who have prices for this food"""
        return obj.prices.values('cook').distinct().count()

    def create(self, validated_data):
        # Handle image upload if provided
        image_data = validated_data.get('image')
        if image_data:
            validated_data['image'] = self._handle_image_upload(image_data, validated_data.get('name', 'food'))
        
        # Set status to pending and assign current user as chef
        validated_data['status'] = 'Pending'
        validated_data['chef'] = self.context['request'].user
        return super().create(validated_data)

    def update(self, instance, validated_data):
        # Handle image upload if provided
        image_data = validated_data.get('image')
        if image_data:
            validated_data['image'] = self._handle_image_upload(image_data, instance.name)
        
        return super().update(instance, validated_data)

    def _handle_image_upload(self, image_data, food_name):
        """
        Handle image upload to Cloudinary
        Supports: file upload, base64 string, or existing URL
        """
        # If it's already a Cloudinary URL, return as is
        if isinstance(image_data, str) and ('cloudinary.com' in image_data or image_data.startswith('http')):
            return image_data
            
        # If it's a file upload or base64 data
        try:
            # Generate a unique folder and public_id based on food name
            import re
            clean_name = re.sub(r'[^a-zA-Z0-9_-]', '_', food_name.lower())
            folder = 'chefsync/foods'
            
            # Upload to Cloudinary
            result = upload_image_to_cloudinary(
                image_data=image_data,
                folder=folder,
                public_id=f"food_{clean_name}_{uuid.uuid4().hex[:8]}",
                tags=['food', 'chefsync']
            )
            
            if result and result.get('secure_url'):
                return result['secure_url']
            else:
                # If upload fails, return the original data
                return image_data
                
        except Exception as e:
            print(f"Error uploading food image: {e}")
            # Return original data if upload fails
            return image_data


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
    # Custom image field that accepts files
    image = serializers.FileField(required=False, allow_null=True, write_only=True)
    
    class Meta:
        model = Food
        fields = [
            'name', 'description', 'category', 'image', 'ingredients', 
            'is_vegetarian', 'is_vegan', 'spice_level', 'is_available',
            'price', 'size', 'preparation_time'
        ]
    
    def validate_image(self, value):
        """Validate and process image upload"""
        if value:
            print(f"DEBUG: Image file received in validate_image: {value.name}, size: {value.size}")
            # Use the same image upload handler
            return self._handle_image_upload(value, "new_food")
        return None

    def _handle_image_upload(self, image_data, food_name):
        """
        Handle image upload to Cloudinary
        Supports: file upload, base64 string, or existing URL
        """
        # If it's already a Cloudinary URL, return as is
        if isinstance(image_data, str) and ('cloudinary.com' in image_data or image_data.startswith('http')):
            return image_data
            
        # If it's a file upload or base64 data
        try:
            # Generate a unique folder and public_id based on food name
            import re
            clean_name = re.sub(r'[^a-zA-Z0-9_-]', '_', food_name.lower())
            folder = 'chefsync/foods'
            
            # Upload to Cloudinary
            result = upload_image_to_cloudinary(
                image_data=image_data,
                folder=folder,
                public_id=f"food_{clean_name}_{uuid.uuid4().hex[:8]}",
                tags=['food', 'chefsync']
            )
            
            if result and result.get('secure_url'):
                return result['secure_url']
            else:
                # If upload fails, return None
                return None
                
        except Exception as e:
            print(f"Error uploading food image: {e}")
            # Return None if upload fails
            return None
    
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
        print(f"DEBUG: Image in validated_data: {validated_data.get('image')}")
        
        # Extract price data
        price = validated_data.pop('price')
        size = validated_data.pop('size', 'Medium')
        prep_time = validated_data.pop('preparation_time', 15)
        
        # Handle image - it should be a Cloudinary URL now from validate_image
        image_url = validated_data.pop('image', None)
        
        # Set status to pending and assign chef
        validated_data['status'] = 'Pending'
        validated_data['chef'] = self.context['request'].user
        
        # Set the image URL if we have one
        if image_url:
            validated_data['image'] = image_url
        
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