import base64
import uuid

from rest_framework import serializers
from utils.cloudinary_utils import get_optimized_url, upload_image_to_cloudinary

from .models import BulkMenu, BulkMenuItem, Cuisine, Food, FoodCategory, FoodPrice, FoodReview, Offer


class CuisineSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()
    thumbnail_url = serializers.SerializerMethodField()

    class Meta:
        model = Cuisine
        fields = [
            "id",
            "name",
            "description",
            "image",
            "image_url",
            "thumbnail_url",
            "is_active",
            "sort_order",
        ]

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
    cuisine_name = serializers.CharField(source="cuisine.name", read_only=True)
    image_url = serializers.SerializerMethodField()
    thumbnail_url = serializers.SerializerMethodField()

    class Meta:
        model = FoodCategory
        fields = [
            "id",
            "name",
            "cuisine",
            "cuisine_name",
            "description",
            "image",
            "image_url",
            "thumbnail_url",
            "is_active",
            "sort_order",
        ]

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
    food_name = serializers.CharField(source="food.name", read_only=True)
    cook_name = serializers.CharField(source="cook.name", read_only=True)
    cook_rating = serializers.SerializerMethodField()
    image_data_url = serializers.SerializerMethodField()
    cook = serializers.SerializerMethodField()

    class Meta:
        model = FoodPrice
        fields = [
            "price_id",
            "size",
            "price",
            "preparation_time",
            "image_url",
            "image_data_url",
            "food",
            "food_name",
            "cook",
            "cook_name",
            "cook_rating",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["price_id", "created_at", "updated_at"]

    def get_cook_rating(self, obj):
        # You might want to calculate this from reviews
        return getattr(obj.cook, "rating", 4.5)

    def get_cook(self, obj):
        """Return cook information in the expected format"""
        profile_image_url = None
        if obj.cook.profile_image:
            # Convert binary image to base64 data URL
            import base64

            try:
                encoded_image = base64.b64encode(obj.cook.profile_image).decode("utf-8")
                profile_image_url = f"data:image/jpeg;base64,{encoded_image}"
            except Exception:
                profile_image_url = None
        
        # Get cook's kitchen location
        kitchen_location = None
        try:
            from apps.users.models import Address
            import logging
            logger = logging.getLogger(__name__)
            
            kitchen_address = Address.objects.filter(
                user=obj.cook,
                address_type='kitchen',
                is_active=True
            ).first()
            
            if not kitchen_address:
                logger.warning(f"No kitchen address found for cook {obj.cook.user_id}")
            elif not kitchen_address.latitude or not kitchen_address.longitude:
                logger.warning(f"Kitchen address found but missing coordinates for cook {obj.cook.user_id}")
            else:
                # Get kitchen name from KitchenLocation object
                kitchen_name = 'Kitchen'
                if hasattr(kitchen_address, 'kitchen_details') and kitchen_address.kitchen_details:
                    kitchen_name = kitchen_address.kitchen_details.kitchen_name
                
                kitchen_location = {
                    'latitude': float(kitchen_address.latitude),
                    'longitude': float(kitchen_address.longitude),
                    'address': kitchen_address.full_address,
                    'kitchen_name': kitchen_name
                }
                logger.info(f"Kitchen location found for cook {obj.cook.user_id}: {kitchen_location}")
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Error getting kitchen location for cook {obj.cook.user_id}: {str(e)}")
            kitchen_location = None
        
        return {
            "id": obj.cook.pk,  # Use pk instead of id
            "name": obj.cook.name,
            "rating": getattr(obj.cook, "rating", 4.5),
            "is_active": getattr(obj.cook, "is_active", True),
            "profile_image": profile_image_url,
            "kitchen_location": kitchen_location
        }

    def get_image_data_url(self, obj):
        """Return optimized Cloudinary URL"""
        if obj.image_url:
            return get_optimized_url(str(obj.image_url))
        return None


class FoodSerializer(serializers.ModelSerializer):
    primary_image = serializers.SerializerMethodField()
    thumbnail_url = serializers.SerializerMethodField()
    category_name = serializers.CharField(source="food_category.name", read_only=True)
    cuisine_name = serializers.CharField(
        source="food_category.cuisine.name", read_only=True
    )
    available_cooks_count = serializers.SerializerMethodField()
    chef_name = serializers.CharField(source="chef.username", read_only=True)
    chef_rating = serializers.DecimalField(
        source="chef.chef_profile.rating_average",
        max_digits=3,
        decimal_places=2,
        read_only=True,
    )
    prices = serializers.SerializerMethodField()
    image_url = serializers.SerializerMethodField()
    optimized_image_url = serializers.SerializerMethodField()
    
    # New fields for delivery features
    min_price = serializers.SerializerMethodField()
    max_price = serializers.SerializerMethodField()
    delivery_fee = serializers.SerializerMethodField()
    distance_km = serializers.SerializerMethodField()
    estimated_delivery_time = serializers.SerializerMethodField()
    kitchen_location = serializers.SerializerMethodField()
    
    class Meta:
        model = Food
        fields = [
            'food_id', 'name', 'description', 'category', 'food_category', 'category_name', 'cuisine_name',
            'is_available', 'is_featured', 'preparation_time', 'calories_per_serving', 'ingredients',
            'allergens', 'nutritional_info', 'is_vegetarian', 'is_vegan', 'is_gluten_free', 'spice_level',
            'rating_average', 'total_reviews', 'total_orders', 'primary_image', 'available_cooks_count',
            'image_url', 'thumbnail_url', 'optimized_image_url', 'image',
            'status', 'chef', 'chef_name', 'chef_rating', 'prices', 'created_at', 'updated_at',
            # New delivery fields
            'min_price', 'max_price', 'delivery_fee', 'distance_km', 'estimated_delivery_time', 'kitchen_location'
        ]
        read_only_fields = [
            "food_id",
            "chef",
            "chef_name",
            "chef_rating",
            "prices",
            "created_at",
            "updated_at",
        ]

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
    
    def get_min_price(self, obj):
        """Get minimum price across all sizes"""
        prices = obj.prices.all()
        if prices:
            return float(min(price.price for price in prices))
        return None
    
    def get_max_price(self, obj):
        """Get maximum price across all sizes"""
        prices = obj.prices.all()
        if prices:
            return float(max(price.price for price in prices))
        return None
    
    def get_delivery_fee(self, obj):
        """Calculate delivery fee if user location is provided"""
        user_location = self.context.get('user_location')
        if not user_location:
            return None
            
        try:
            from apps.users.models import Address
            from .utils import calculate_delivery_fee
            
            # Get chef's kitchen location
            kitchen_address = Address.objects.filter(
                user=obj.chef,
                address_type='kitchen',
                is_active=True
            ).first()
            
            if not kitchen_address or not kitchen_address.latitude or not kitchen_address.longitude:
                return None
            
            fee_data = calculate_delivery_fee(
                user_location['latitude'],
                user_location['longitude'],
                float(kitchen_address.latitude),
                float(kitchen_address.longitude)
            )
            
            return fee_data['total_delivery_fee']
            
        except Exception:
            return None
    
    def get_distance_km(self, obj):
        """Calculate distance from user to kitchen"""
        user_location = self.context.get('user_location')
        if not user_location:
            return None
            
        try:
            from apps.users.models import Address
            from .utils import calculate_distance
            
            kitchen_address = Address.objects.filter(
                user=obj.chef,
                address_type='kitchen',
                is_active=True
            ).first()
            
            if not kitchen_address or not kitchen_address.latitude or not kitchen_address.longitude:
                return None
            
            distance = calculate_distance(
                user_location['latitude'],
                user_location['longitude'],
                float(kitchen_address.latitude),
                float(kitchen_address.longitude)
            )
            
            return round(distance, 2)
            
        except Exception:
            return None
    
    def get_estimated_delivery_time(self, obj):
        """Calculate estimated delivery time"""
        distance = self.get_distance_km(obj)
        if distance is None:
            return None
            
        try:
            from .utils import estimate_delivery_time
            return estimate_delivery_time(distance, obj.preparation_time or 30)
        except Exception:
            return None
    
    def get_prices(self, obj):
        """Get prices for this food"""
        request = self.context.get('request')
        
        # Check if this is from the chef's own menu management (ChefFoodViewSet)
        # We can determine this by checking if 'chef_view' flag is in context
        is_chef_view = self.context.get('chef_view', False)
        
        if is_chef_view and request and request.user and request.user.is_authenticated:
            # For chef food viewset, only show prices created by the current user
            prices = obj.prices.filter(cook=request.user)
            return FoodPriceSerializer(prices, many=True).data
        
        # For customer menu and other cases, return all prices from all cooks
        return FoodPriceSerializer(obj.prices.all(), many=True).data
    
    def get_kitchen_location(self, obj):
        """Get chef's kitchen location details"""
        try:
            from apps.users.models import Address
            
            kitchen_address = Address.objects.filter(
                user=obj.chef,
                address_type='kitchen',
                is_active=True
            ).first()
            
            if not kitchen_address:
                return None
            
            return {
                'latitude': float(kitchen_address.latitude) if kitchen_address.latitude else None,
                'longitude': float(kitchen_address.longitude) if kitchen_address.longitude else None,
                'address': kitchen_address.full_address,
                'kitchen_name': getattr(kitchen_address, 'kitchen_details', {}).get('kitchen_name', 'Kitchen') if hasattr(kitchen_address, 'kitchen_details') else 'Kitchen'
            }
            
        except Exception:
            return None

    def create(self, validated_data):
        # Handle image upload if provided
        image_data = validated_data.get("image")
        if image_data:
            validated_data["image"] = self._handle_image_upload(
                image_data, validated_data.get("name", "food")
            )

        # Set status to pending and assign current user as chef
        validated_data["status"] = "Pending"
        validated_data["chef"] = self.context["request"].user
        return super().create(validated_data)

    def update(self, instance, validated_data):
        # Handle image upload if provided
        image_data = validated_data.get("image")
        if image_data:
            validated_data["image"] = self._handle_image_upload(
                image_data, instance.name
            )

        return super().update(instance, validated_data)

    def _handle_image_upload(self, image_data, food_name):
        """
        Handle image upload to Cloudinary
        Supports: file upload, base64 string, or existing URL
        """
        # If it's already a Cloudinary URL, return as is
        if isinstance(image_data, str) and (
            "cloudinary.com" in image_data or image_data.startswith("http")
        ):
            return image_data

        # If it's a file upload or base64 data
        try:
            # Generate a unique folder and public_id based on food name
            import re

            clean_name = re.sub(r"[^a-zA-Z0-9_-]", "_", food_name.lower())
            folder = "chefsync/foods"

            # Upload to Cloudinary
            result = upload_image_to_cloudinary(
                image_data=image_data,
                folder=folder,
                public_id=f"food_{clean_name}_{uuid.uuid4().hex[:8]}",
                tags=["food", "chefsync"],
            )

            if result and result.get("secure_url"):
                return result["secure_url"]
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
        fields = ["price", "size", "preparation_time", "food"]

    def validate(self, data):
        """Check for duplicate price entries"""
        user = self.context["request"].user
        food = data.get("food")
        size = data.get("size")

        # Check if a price already exists for this combination
        existing_price = FoodPrice.objects.filter(
            food=food, size=size, cook=user
        ).first()

        if existing_price:
            raise serializers.ValidationError(
                {
                    "non_field_errors": [
                        f"You already have a {size} price for this food item. Please update the existing price instead."
                    ]
                }
            )

        return data

    def create(self, validated_data):
        validated_data["cook"] = self.context["request"].user
        return super().create(validated_data)


class ChefFoodCreateSerializer(serializers.ModelSerializer):
    """Serializer for chefs to create new food items"""

    # Price fields for the initial price entry
    price = serializers.DecimalField(max_digits=10, decimal_places=2, write_only=True)
    size = serializers.CharField(max_length=10, write_only=True, default="Medium")
    preparation_time = serializers.IntegerField(write_only=True, default=15)
    # Custom image field that accepts files
    image = serializers.FileField(required=False, allow_null=True, write_only=True)

    class Meta:
        model = Food
        fields = [
            "name",
            "description",
            "category",
            "image",
            "ingredients",
            "is_vegetarian",
            "is_vegan",
            "spice_level",
            "is_available",
            "price",
            "size",
            "preparation_time",
        ]

    def validate_image(self, value):
        """Validate and process image upload"""
        if value:
            print(
                f"DEBUG: Image file received in validate_image: {value.name}, size: {value.size}"
            )
            # Use the same image upload handler
            return self._handle_image_upload(value, "new_food")
        return None

    def _handle_image_upload(self, image_data, food_name):
        """
        Handle image upload to Cloudinary
        Supports: file upload, base64 string, or existing URL
        """
        # If it's already a Cloudinary URL, return as is
        if isinstance(image_data, str) and (
            "cloudinary.com" in image_data or image_data.startswith("http")
        ):
            return image_data

        # If it's a file upload or base64 data
        try:
            # Generate a unique folder and public_id based on food name
            import re

            clean_name = re.sub(r"[^a-zA-Z0-9_-]", "_", food_name.lower())
            folder = "chefsync/foods"

            # Upload to Cloudinary
            result = upload_image_to_cloudinary(
                image_data=image_data,
                folder=folder,
                public_id=f"food_{clean_name}_{uuid.uuid4().hex[:8]}",
                tags=["food", "chefsync"],
            )

            if result and result.get("secure_url"):
                return result["secure_url"]
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
        if "ingredients" in data:
            ingredients = data["ingredients"]
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
                            data["ingredients"] = [
                                str(item).strip()
                                for item in parsed
                                if str(item).strip()
                            ]
                        else:
                            data["ingredients"] = (
                                [str(parsed).strip()] if str(parsed).strip() else []
                            )
                    except (json.JSONDecodeError, ValueError):
                        # Fall back to comma-separated parsing
                        data["ingredients"] = [
                            item.strip()
                            for item in ingredients.split(",")
                            if item.strip()
                        ]
                else:
                    data["ingredients"] = []
            elif not isinstance(ingredients, list):
                data["ingredients"] = []

            print(
                f"DEBUG: Final processed ingredients: {data['ingredients']} (type: {type(data['ingredients'])})"
            )

        return data

    def create(self, validated_data):
        # Debug logging to see what ingredients we received
        print(
            f"DEBUG: Creating food with validated_data ingredients: {validated_data.get('ingredients')}"
        )
        print(f"DEBUG: Ingredients type: {type(validated_data.get('ingredients'))}")
        print(f"DEBUG: Image in validated_data: {validated_data.get('image')}")

        # Extract price data
        price = validated_data.pop("price")
        size = validated_data.pop("size", "Medium")
        prep_time = validated_data.pop("preparation_time", 15)

        # Handle image - it should be a Cloudinary URL now from validate_image
        image_url = validated_data.pop("image", None)

        # Set status to pending and assign chef
        validated_data["status"] = "Pending"
        validated_data["chef"] = self.context["request"].user

        # Set the image URL if we have one
        if image_url:
            validated_data["image"] = image_url

        # Ensure ingredients is properly formatted
        if "ingredients" not in validated_data:
            validated_data["ingredients"] = []

        # Create food item
        food = super().create(validated_data)

        # Create initial price entry
        FoodPrice.objects.create(
            food=food,
            size=size,
            price=price,
            preparation_time=prep_time,
            cook=self.context["request"].user,
        )

        return food


class FoodReviewSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source="customer.username", read_only=True)

    class Meta:
        model = FoodReview
        fields = [
            "review_id",
            "rating",
            "comment",
            "customer",
            "customer_name",
            "taste_rating",
            "presentation_rating",
            "value_rating",
            "is_verified_purchase",
            "helpful_votes",
            "created_at",
            "updated_at",
        ]


class OfferSerializer(serializers.ModelSerializer):
    food_name = serializers.CharField(source="price.food.name", read_only=True)
    cook_name = serializers.CharField(source="price.cook.name", read_only=True)
    size = serializers.CharField(source="price.size", read_only=True)
    original_price = serializers.DecimalField(
        source="price.price", max_digits=10, decimal_places=2, read_only=True
    )
    discounted_price = serializers.SerializerMethodField()
    is_active = serializers.SerializerMethodField()

    class Meta:
        model = Offer
        fields = [
            "offer_id",
            "description",
            "discount",
            "valid_until",
            "price",
            "original_price",
            "discounted_price",
            "food_name",
            "cook_name",
            "size",
            "is_active",
            "created_at",
        ]
        read_only_fields = ["offer_id", "created_at"]

    def get_discounted_price(self, obj):
        """Calculate the discounted price"""
        original_price = float(obj.price.price)
        discount_percent = float(obj.discount)
        discount_amount = original_price * (discount_percent / 100)
        return round(original_price - discount_amount, 2)

    def get_is_active(self, obj):
        """Check if the offer is still active"""
        from django.utils import timezone

        return obj.valid_until >= timezone.now().date()


class BulkMenuSerializer(serializers.ModelSerializer):
    """Serializer for BulkMenu model"""
    chef_name = serializers.CharField(source="chef.username", read_only=True)
    approved_by_name = serializers.CharField(source="approved_by.username", read_only=True)
    meal_type_display = serializers.CharField(source="get_meal_type_display", read_only=True)
    delivery_fee = serializers.SerializerMethodField()

    class Meta:
        model = BulkMenu
        fields = [
            "id",
            "chef",
            "chef_name",
            "meal_type",
            "meal_type_display",
            "menu_name",
            "description",
            "base_price_per_person",
            "availability_status",
            "approval_status",
            "approved_by",
            "approved_by_name",
            "approved_at",
            "rejection_reason",
            "min_persons",
            "max_persons",
            "advance_notice_hours",
            "delivery_fee",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["chef", "approved_by", "approved_at", "created_at", "updated_at"]

    def get_delivery_fee(self, obj):
        """Calculate delivery fee based on service area and group size
        
        Returns base delivery fee (actual fee calculated based on distance during order)
        """
        # Base delivery fee - actual fee calculated when order is placed based on distance
        # Within 5 km: LKR 300, After 5 km: LKR 100 per km
        base_fee = 300  # Base delivery fee in rupees
        return base_fee


class BulkMenuItemSerializer(serializers.ModelSerializer):
    """Serializer for BulkMenuItem model"""
    
    class Meta:
        model = BulkMenuItem
        fields = [
            "id",
            "bulk_menu",
            "item_name",
            "description",
            "is_optional",
            "extra_cost",
            "sort_order",
            "is_vegetarian",
            "spice_level",
            "allergens",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at"]


class BulkMenuWithItemsSerializer(serializers.ModelSerializer):
    """Serializer for BulkMenu with nested items"""
    items = BulkMenuItemSerializer(many=True, read_only=True)
    chef_name = serializers.CharField(source="chef.username", read_only=True)
    approved_by_name = serializers.CharField(source="approved_by.username", read_only=True, allow_null=True)
    meal_type_display = serializers.CharField(source="get_meal_type_display", read_only=True)
    # Override image field to accept file uploads
    image = serializers.ImageField(required=False, allow_null=True)
    image_url = serializers.SerializerMethodField()
    thumbnail_url = serializers.SerializerMethodField()
    items_count = serializers.SerializerMethodField()
    menu_items_summary = serializers.SerializerMethodField()
    
    class Meta:
        model = BulkMenu
        fields = [
            "id",
            "chef",
            "chef_name",
            "meal_type",
            "meal_type_display",
            "menu_name",
            "description",
            "base_price_per_person",
            "availability_status",
            "approval_status",
            "approved_by",
            "approved_by_name",
            "approved_at",
            "rejection_reason",
            "min_persons",
            "max_persons",
            "advance_notice_hours",
            "image",
            "image_url",
            "thumbnail_url",
            "items",
            "items_count",
            "menu_items_summary",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["chef", "approved_by", "approved_at", "created_at", "updated_at"]
    
    def validate_image(self, value):
        """Validate and prepare image for upload"""
        if value is None:
            return None
        
        # If it's already a string (URL), return it
        if isinstance(value, str):
            return value
        
        # If it's a file object, it will be handled in create/update
        # Just validate file size here (max 10MB)
        if hasattr(value, 'size') and value.size > 10 * 1024 * 1024:
            raise serializers.ValidationError("Image file size must be less than 10MB")
        
        return value
    
    def get_image_url(self, obj):
        """Get optimized image URL"""
        try:
            if obj.image:
                return get_optimized_url(str(obj.image))
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Error getting image URL: {e}")
            if obj.image:
                return str(obj.image)
        return None
    
    def get_thumbnail_url(self, obj):
        """Get thumbnail URL"""
        try:
            if obj.image:
                return get_optimized_url(str(obj.image), width=300, height=200)
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Error getting thumbnail URL: {e}")
            if obj.image:
                return str(obj.image)
        return None
    
    def get_items_count(self, obj):
        """Get count of all items in this menu"""
        return obj.items.count()
    
    def get_menu_items_summary(self, obj):
        """Get summary of menu items"""
        try:
            return obj.get_menu_items_summary()
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Error getting menu items summary: {e}")
            return {
                'mandatory_items': [],
                'optional_items': [],
                'total_items': 0
            }
    
    def create(self, validated_data):
        """Create bulk menu with items from request data"""
        import logging
        import json
        logger = logging.getLogger(__name__)
        
        # Get items data from request context (passed separately)
        request = self.context.get('request')
        items_data = []
        
        # Handle different data formats (FormData vs JSON)
        if request:
            # Try to get items from request data
            if hasattr(request, 'data'):
                items_raw = request.data.get('items', '[]')
                
                # Handle if items is a string (from FormData)
                if isinstance(items_raw, str):
                    try:
                        items_data = json.loads(items_raw)
                    except json.JSONDecodeError:
                        logger.error(f"Failed to parse items JSON: {items_raw}")
                        items_data = []
                # Handle if items is already a list
                elif isinstance(items_raw, list):
                    items_data = items_raw
                
                logger.info(f"Creating bulk menu with {len(items_data)} items")
        
        # Handle image upload
        image_data = validated_data.get('image')
        if image_data and not isinstance(image_data, str):
            try:
                # If it's a file object, read it and upload to Cloudinary
                if hasattr(image_data, 'read'):
                    # It's a file object
                    file_content = image_data.read()
                    
                    # Upload to Cloudinary
                    folder = "chefsync/bulk_menus"
                    result = upload_image_to_cloudinary(
                        image_data=file_content,
                        folder=folder,
                        public_id=f"bulk_menu_{uuid.uuid4().hex[:8]}",
                        tags=["bulk_menu", "chefsync"],
                    )
                    if result and result.get("secure_url"):
                        validated_data["image"] = result["secure_url"]
                        logger.info(f"Uploaded bulk menu image to Cloudinary: {result['secure_url']}")
                    else:
                        # If upload fails, remove image from validated_data
                        validated_data.pop('image', None)
                        logger.warning("Failed to upload image to Cloudinary, creating menu without image")
                else:
                    # Unknown format, remove from validated_data
                    validated_data.pop('image', None)
                    logger.warning("Unknown image format, creating menu without image")
            except Exception as e:
                logger.error(f"Error uploading bulk menu image: {e}")
                # Remove image from validated_data on error
                validated_data.pop('image', None)
        elif isinstance(image_data, str):
            # If it's already a URL string, keep it as is
            logger.info(f"Using existing image URL: {image_data}")
        
        # Create the bulk menu
        bulk_menu = super().create(validated_data)
        logger.info(f"Created bulk menu: {bulk_menu.id} - {bulk_menu.menu_name}")
        
        # Create menu items
        if items_data:
            for item_data in items_data:
                try:
                    # Remove any id field (shouldn't be there for new items)
                    item_data.pop('id', None)
                    item_data.pop('bulk_menu', None)
                    
                    # Create the item
                    BulkMenuItem.objects.create(
                        bulk_menu=bulk_menu,
                        **item_data
                    )
                    logger.info(f"Created item: {item_data.get('item_name')}")
                except Exception as e:
                    logger.error(f"Error creating menu item: {e} - Data: {item_data}")
        
        return bulk_menu
    
    def update(self, instance, validated_data):
        """Update bulk menu with items from request data"""
        import logging
        import json
        logger = logging.getLogger(__name__)
        
        # Get items data from request context
        request = self.context.get('request')
        items_data = []
        
        if request and hasattr(request, 'data'):
            items_raw = request.data.get('items', '[]')
            
            # Handle if items is a string (from FormData)
            if isinstance(items_raw, str):
                try:
                    items_data = json.loads(items_raw)
                except json.JSONDecodeError:
                    logger.error(f"Failed to parse items JSON: {items_raw}")
                    items_data = []
            # Handle if items is already a list
            elif isinstance(items_raw, list):
                items_data = items_raw
        
        # Handle image upload (same logic as create)
        image_data = validated_data.get('image')
        if image_data and not isinstance(image_data, str):
            try:
                # If it's a file object, read it and upload to Cloudinary
                if hasattr(image_data, 'read'):
                    file_content = image_data.read()
                    
                    # Upload to Cloudinary
                    folder = "chefsync/bulk_menus"
                    result = upload_image_to_cloudinary(
                        image_data=file_content,
                        folder=folder,
                        public_id=f"bulk_menu_{uuid.uuid4().hex[:8]}",
                        tags=["bulk_menu", "chefsync"],
                    )
                    if result and result.get("secure_url"):
                        validated_data["image"] = result["secure_url"]
                        logger.info(f"Uploaded updated bulk menu image to Cloudinary: {result['secure_url']}")
                    else:
                        validated_data.pop('image', None)
                        logger.warning("Failed to upload image to Cloudinary")
                else:
                    validated_data.pop('image', None)
                    logger.warning("Unknown image format")
            except Exception as e:
                logger.error(f"Error uploading bulk menu image: {e}")
                validated_data.pop('image', None)
        
        # Update the bulk menu
        bulk_menu = super().update(instance, validated_data)
        
        # Update menu items if provided
        if items_data:
            # Get existing item IDs
            existing_item_ids = [item.get('id') for item in items_data if item.get('id')]
            
            # Delete items not in the update
            bulk_menu.items.exclude(id__in=existing_item_ids).delete()
            
            # Update or create items
            for item_data in items_data:
                item_id = item_data.get('id')
                if item_id:
                    # Update existing item
                    try:
                        item = BulkMenuItem.objects.get(id=item_id, bulk_menu=bulk_menu)
                        for field, value in item_data.items():
                            if field not in ['id', 'bulk_menu']:
                                setattr(item, field, value)
                        item.save()
                        logger.info(f"Updated item: {item.item_name}")
                    except BulkMenuItem.DoesNotExist:
                        logger.warning(f"Item {item_id} not found for menu {bulk_menu.id}")
                else:
                    # Create new item
                    item_data.pop('id', None)
                    item_data.pop('bulk_menu', None)
                    BulkMenuItem.objects.create(bulk_menu=bulk_menu, **item_data)
                    logger.info(f"Created new item: {item_data.get('item_name')}")
        
        return bulk_menu
