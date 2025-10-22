from rest_framework import serializers
from .models import Cuisine, FoodCategory, Food, FoodReview, FoodPrice, Offer, FoodImage, BulkMenu, BulkMenuItem
from utils.cloudinary_utils import get_optimized_url
import json


class JSONListField(serializers.ListField):
    """Custom field to handle JSON string input from FormData"""
    
    def to_internal_value(self, data):
        # Handle FormData case where JSON string is wrapped in a list
        if isinstance(data, list) and len(data) == 1 and isinstance(data[0], str):
            json_string = data[0]
            try:
                # Parse JSON string from FormData
                parsed_data = json.loads(json_string)
                # Now parse each item with the child serializer
                return super().to_internal_value(parsed_data)
            except (json.JSONDecodeError, ValueError) as e:
                raise serializers.ValidationError(f"Invalid JSON format: {str(e)}")
        
        # If data is a string, try to parse it as JSON first
        elif isinstance(data, str):
            try:
                # Parse JSON string from FormData
                parsed_data = json.loads(data)
                # Now parse each item with the child serializer
                return super().to_internal_value(parsed_data)
            except (json.JSONDecodeError, ValueError) as e:
                raise serializers.ValidationError(f"Invalid JSON format: {str(e)}")
        
        # If data is already a proper list, process normally
        return super().to_internal_value(data)


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
            # Upload to Cloudinary
            try:
                from utils.cloudinary_utils import upload_image_to_cloudinary
                result = upload_image_to_cloudinary(value, folder='foods')
                if result and 'secure_url' in result:
                    print(f"DEBUG: Image uploaded to Cloudinary: {result['secure_url']}")
                    return result['secure_url']
                else:
                    print("ERROR: Cloudinary upload failed - no secure_url in result")
                    return None
            except Exception as e:
                print(f"ERROR: Cloudinary upload failed: {e}")
                return None
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


class BulkMenuItemSerializer(serializers.ModelSerializer):
    """Serializer for bulk menu items"""
    
    class Meta:
        model = BulkMenuItem
        fields = [
            'id', 'bulk_menu', 'item_name', 'description', 'is_optional', 'extra_cost',
            'sort_order', 'is_vegetarian', 'is_vegan', 'is_gluten_free', 'spice_level',
            'allergens', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
        extra_kwargs = {
            'bulk_menu': {'required': False}  # Allow bulk_menu to be optional for nested creation
        }
    
    def validate_extra_cost(self, value):
        """Validate that extra cost is non-negative"""
        if value < 0:
            raise serializers.ValidationError("Extra cost cannot be negative")
        return value
    
    def validate(self, data):
        """Custom validation for bulk menu items"""
        # If item is not optional, extra_cost should be 0
        if not data.get('is_optional', False) and data.get('extra_cost', 0) > 0:
            raise serializers.ValidationError(
                "Mandatory items should not have extra cost. Set is_optional=True for items with extra cost."
            )
        return data


class BulkMenuSerializer(serializers.ModelSerializer):
    """Serializer for bulk menus"""
    
    items = BulkMenuItemSerializer(many=True, read_only=True)
    chef_name = serializers.CharField(source='chef.username', read_only=True)
    chef_full_name = serializers.CharField(source='chef.name', read_only=True)
    meal_type_display = serializers.CharField(source='get_meal_type_display', read_only=True)
    approval_status_display = serializers.CharField(source='get_approval_status_display', read_only=True)
    approved_by_name = serializers.CharField(source='approved_by.username', read_only=True)
    items_count = serializers.SerializerMethodField()
    menu_items_summary = serializers.SerializerMethodField()
    image_url = serializers.SerializerMethodField()
    thumbnail_url = serializers.SerializerMethodField()
    
    class Meta:
        model = BulkMenu
        fields = [
            'id', 'chef', 'chef_name', 'chef_full_name', 'meal_type', 'meal_type_display',
            'menu_name', 'description', 'base_price_per_person', 'availability_status',
            'approval_status', 'approval_status_display', 'approved_by', 'approved_by_name',
            'approved_at', 'rejection_reason', 'min_persons', 'max_persons',
            'advance_notice_hours', 'image', 'image_url', 'thumbnail_url', 'items', 
            'items_count', 'menu_items_summary', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'approved_by', 'approved_at', 'items', 'created_at', 'updated_at'
        ]
    
    def get_items_count(self, obj):
        """Get total number of items in this menu"""
        return obj.items.count()
    
    def get_menu_items_summary(self, obj):
        """Get summary of menu items"""
        return obj.get_menu_items_summary()
    
    def get_image_url(self, obj):
        """Get optimized Cloudinary URL for the main image"""
        return obj.get_image_url()
    
    def get_thumbnail_url(self, obj):
        """Get thumbnail version of the main image"""
        return obj.get_thumbnail_url()
    
    def validate_base_price_per_person(self, value):
        """Validate that base price is positive"""
        if value <= 0:
            raise serializers.ValidationError("Base price per person must be greater than 0")
        return value
    
    def validate_min_persons(self, value):
        """Validate minimum persons"""
        if value < 1:
            raise serializers.ValidationError("Minimum persons must be at least 1")
        return value
    
    def validate_max_persons(self, value):
        """Validate maximum persons"""
        if value < 1:
            raise serializers.ValidationError("Maximum persons must be at least 1")
        return value
    
    def validate(self, data):
        """Custom validation for bulk menus"""
        min_persons = data.get('min_persons')
        max_persons = data.get('max_persons')
        
        if min_persons and max_persons and min_persons > max_persons:
            raise serializers.ValidationError(
                "Minimum persons cannot be greater than maximum persons"
            )
        
        # Check for duplicate menu name per chef per meal type
        if self.instance is None:  # Creating new menu
            chef = data.get('chef') or self.context['request'].user
            meal_type = data.get('meal_type')
            menu_name = data.get('menu_name')
            
            if BulkMenu.objects.filter(
                chef=chef, 
                meal_type=meal_type, 
                menu_name=menu_name
            ).exists():
                raise serializers.ValidationError(
                    f"A menu with name '{menu_name}' already exists for {meal_type}"
                )
        
        return data
    
    def create(self, validated_data):
        """Create bulk menu with chef from request user"""
        validated_data['chef'] = self.context['request'].user
        return super().create(validated_data)


class BulkMenuItemCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating bulk menu items (without bulk_menu field)"""
    
    class Meta:
        model = BulkMenuItem
        fields = [
            'item_name', 'description', 'is_optional', 'extra_cost',
            'sort_order', 'is_vegetarian', 'is_vegan', 'is_gluten_free', 'spice_level',
            'allergens'
        ]
    
    def validate_extra_cost(self, value):
        """Validate that extra cost is non-negative"""
        if value < 0:
            raise serializers.ValidationError("Extra cost cannot be negative")
        return value


class BulkMenuCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating bulk menus with items"""
    
    items = JSONListField(
        child=BulkMenuItemCreateSerializer(), 
        required=False, 
        allow_empty=True,
        write_only=True
    )
    image = serializers.FileField(required=False, allow_null=True, write_only=True)
    
    class Meta:
        model = BulkMenu
        fields = [
            'meal_type', 'menu_name', 'description', 'base_price_per_person',
            'availability_status', 'min_persons', 'max_persons', 'advance_notice_hours',
            'image', 'items'
        ]
    
    def to_internal_value(self, data):
        """Handle FormData conversion issues"""
        # Create a mutable copy of the data
        if hasattr(data, '_mutable'):
            data._mutable = True
        
        # Convert string boolean values to actual booleans
        if 'availability_status' in data:
            val = data['availability_status']
            if isinstance(val, str):
                data['availability_status'] = val.lower() in ('true', '1', 'yes', 'on')
        
        return super().to_internal_value(data)
    
    def validate_image(self, value):
        """Validate and process image upload"""
        if value:
            print(f"DEBUG: Bulk menu image file received: {value.name}, size: {value.size}")
            # Upload to Cloudinary
            try:
                from utils.cloudinary_utils import upload_image_to_cloudinary
                result = upload_image_to_cloudinary(value, folder='bulk_menus')
                if result and 'secure_url' in result:
                    print(f"DEBUG: Bulk menu image uploaded to Cloudinary: {result['secure_url']}")
                    return result['secure_url']
                else:
                    print("ERROR: Cloudinary upload failed - no secure_url in result")
                    return None
            except Exception as e:
                print(f"ERROR: Cloudinary upload failed: {e}")
                return None
        return None
    
    def validate(self, data):
        """Custom validation"""
        # Validate using parent class logic with proper context
        min_persons = data.get('min_persons')
        max_persons = data.get('max_persons')
        
        if min_persons and max_persons and min_persons > max_persons:
            raise serializers.ValidationError(
                "Minimum persons cannot be greater than maximum persons"
            )
        
        # Check for duplicate menu name per chef per meal type
        chef = self.context['request'].user
        meal_type = data.get('meal_type')
        menu_name = data.get('menu_name')
        
        if BulkMenu.objects.filter(
            chef=chef, 
            meal_type=meal_type, 
            menu_name=menu_name
        ).exists():
            raise serializers.ValidationError({
                "menu_name": [f"A menu with name '{menu_name}' already exists for {meal_type}"]
            })
        
        # Additional validation for items
        items_data = data.get('items', [])
        if len(items_data) == 0:
            raise serializers.ValidationError({"items": ["Menu must have at least one item"]})
        
        # Check for duplicate item names
        item_names = [item['item_name'] for item in items_data]
        if len(item_names) != len(set(item_names)):
            raise serializers.ValidationError({"items": ["Menu items must have unique names"]})
        
        # Validate individual items
        for i, item_data in enumerate(items_data):
            # If item is not optional, extra_cost should be 0
            if not item_data.get('is_optional', False) and item_data.get('extra_cost', 0) > 0:
                raise serializers.ValidationError({
                    "items": [f"Item '{item_data.get('item_name', f'item {i+1}')}': Mandatory items should not have extra cost. Set is_optional=True for items with extra cost."]
                })
        
        return data
    
    def create(self, validated_data):
        """Create bulk menu with items"""
        items_data = validated_data.pop('items', [])
        
        # Handle image upload - it should be a Cloudinary URL now from validate_image
        image_url = validated_data.pop('image', None)
        if image_url:
            validated_data['image'] = image_url
        
        validated_data['chef'] = self.context['request'].user
        
        # Create bulk menu
        bulk_menu = BulkMenu.objects.create(**validated_data)
        
        # Create menu items
        for item_data in items_data:
            BulkMenuItem.objects.create(bulk_menu=bulk_menu, **item_data)
        
        return bulk_menu


class BulkMenuCostCalculationSerializer(serializers.Serializer):
    """Serializer for calculating bulk menu costs"""
    
    bulk_menu_id = serializers.IntegerField()
    num_persons = serializers.IntegerField(min_value=1)
    optional_items = serializers.ListField(
        child=serializers.IntegerField(),
        required=False,
        allow_empty=True,
        help_text="List of optional item IDs to include"
    )
    
    def validate_num_persons(self, value):
        """Validate number of persons"""
        if value < 1:
            raise serializers.ValidationError("Number of persons must be at least 1")
        return value
    
    def validate(self, data):
        """Validate bulk menu exists and person count is within limits"""
        bulk_menu_id = data['bulk_menu_id']
        num_persons = data['num_persons']
        
        try:
            bulk_menu = BulkMenu.objects.get(id=bulk_menu_id)
        except BulkMenu.DoesNotExist:
            raise serializers.ValidationError("Bulk menu not found")
        
        if num_persons < bulk_menu.min_persons:
            raise serializers.ValidationError(
                f"Minimum {bulk_menu.min_persons} persons required for this menu"
            )
        
        if num_persons > bulk_menu.max_persons:
            raise serializers.ValidationError(
                f"Maximum {bulk_menu.max_persons} persons allowed for this menu"
            )
        
        # Validate optional items belong to this menu
        optional_items = data.get('optional_items', [])
        if optional_items:
            valid_optional_items = bulk_menu.items.filter(
                id__in=optional_items, 
                is_optional=True
            ).values_list('id', flat=True)
            
            invalid_items = set(optional_items) - set(valid_optional_items)
            if invalid_items:
                raise serializers.ValidationError(
                    f"Invalid optional item IDs: {list(invalid_items)}"
                )
        
        data['bulk_menu'] = bulk_menu
        return data