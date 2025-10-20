from rest_framework import serializers
from .models import CartItem, UserAddress


class UserAddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserAddress
        fields = [
            'id', 'label', 'address_line1', 'address_line2', 'city', 'pincode',
            'latitude', 'longitude', 'is_default', 'created_at', 'updated_at'
        ]


class CartItemSerializer(serializers.ModelSerializer):
    # Provide a flattened representation for the frontend
    food_name = serializers.SerializerMethodField()
    food_description = serializers.SerializerMethodField()
    unit_price = serializers.SerializerMethodField()
    food_image = serializers.SerializerMethodField()
    size = serializers.SerializerMethodField()
    chef_id = serializers.SerializerMethodField()
    chef_name = serializers.SerializerMethodField()
    kitchen_address = serializers.SerializerMethodField()
    kitchen_location = serializers.SerializerMethodField()
    price_id = serializers.SerializerMethodField()
    food_id = serializers.SerializerMethodField()

    class Meta:
        model = CartItem
        fields = [
            'id', 'quantity', 'special_instructions', 'created_at', 'updated_at',
            'food_name', 'food_description', 'unit_price', 'total_price', 'food_image',
            'size', 'chef_id', 'chef_name', 'kitchen_address', 'kitchen_location',
            'price_id', 'food_id'
        ]

    def get_food_name(self, obj):
        try:
            return obj.price.food.name
        except Exception:
            return ''

    def get_food_description(self, obj):
        try:
            return obj.price.food.description or ''
        except Exception:
            return ''

    def get_unit_price(self, obj):
        try:
            return float(obj.price.price)
        except Exception:
            return 0.0

    def get_food_image(self, obj):
        try:
            # Try to get image from FoodPrice first, then from Food
            if obj.price.image_url:
                return obj.price.image_url
            elif obj.price.food.image_url:
                return obj.price.food.image_url
            elif obj.price.food.primary_image:
                return obj.price.food.primary_image
            return None
        except Exception:
            return None

    def get_size(self, obj):
        try:
            return obj.price.size
        except Exception:
            return ''

    def get_chef_id(self, obj):
        try:
            return obj.price.cook.user_id
        except Exception:
            return 0

    def get_chef_name(self, obj):
        try:
            return obj.price.cook.name
        except Exception:
            return ''

    def get_kitchen_address(self, obj):
        try:
            # Try to get kitchen address from cook's addresses
            from apps.users.models import Address
            kitchen_address = Address.objects.filter(
                user=obj.price.cook,
                address_type='kitchen',
                is_active=True
            ).first()
            return kitchen_address.full_address if kitchen_address else ''
        except Exception:
            return ''

    def get_kitchen_location(self, obj):
        try:
            # Try to get kitchen location from cook's addresses
            from apps.users.models import Address
            kitchen_address = Address.objects.filter(
                user=obj.price.cook,
                address_type='kitchen',
                is_active=True
            ).first()
            if kitchen_address and kitchen_address.latitude and kitchen_address.longitude:
                return {
                    'lat': float(kitchen_address.latitude),
                    'lng': float(kitchen_address.longitude)
                }
            return {'lat': 0.0, 'lng': 0.0}
        except Exception:
            return {'lat': 0.0, 'lng': 0.0}

    def get_price_id(self, obj):
        try:
            return obj.price.price_id
        except Exception:
            return 0

    def get_food_id(self, obj):
        try:
            return obj.price.food.food_id
        except Exception:
            return 0


# --- Placeholder serializers for bulk management and order representations ---
from .models import Order, BulkOrder


class OrderListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Order
        fields = ['id', 'order_number', 'status', 'total_amount', 'created_at']


class OrderDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = Order
        fields = ['id', 'order_number', 'status', 'total_amount', 'delivery_fee', 'created_at', 'items']


class BulkOrderListSerializer(serializers.ModelSerializer):
    class Meta:
        model = BulkOrder
        fields = ['bulk_order_id', 'status', 'total_quantity', 'deadline', 'created_at']


class BulkOrderDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = BulkOrder
        fields = ['bulk_order_id', 'status', 'total_quantity', 'description', 'deadline', 'created_at']


class BulkOrderActionSerializer(serializers.Serializer):
    action = serializers.CharField()
    notes = serializers.CharField(required=False, allow_blank=True)
