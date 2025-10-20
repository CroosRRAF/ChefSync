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
    unit_price = serializers.SerializerMethodField()
    food_image = serializers.SerializerMethodField()

    class Meta:
        model = CartItem
        fields = [
            'id', 'quantity', 'special_instructions', 'food_name', 'unit_price', 'total_price', 'food_image', 'created_at', 'updated_at'
        ]

    def get_food_name(self, obj):
        try:
            return obj.price.food.name
        except Exception:
            return ''

    def get_unit_price(self, obj):
        try:
            return float(obj.price.price)
        except Exception:
            return 0.0

    def get_food_image(self, obj):
        try:
            return obj.price.image_url or (obj.price.food.image_url if obj.price and obj.price.food else None)
        except Exception:
            return None


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
