from rest_framework import serializers
from .models import Order, OrderItem, OrderStatusHistory, CartItem


class OrderSerializer(serializers.ModelSerializer):
    class Meta:
        model = Order
        fields = '__all__'


class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = '__all__'


class OrderStatusHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderStatusHistory
        fields = '__all__'


class CartItemSerializer(serializers.ModelSerializer):
    food_name = serializers.CharField(source='price.food.name', read_only=True)
    cook_name = serializers.CharField(source='price.cook.name', read_only=True)
    size = serializers.CharField(source='price.size', read_only=True)
    unit_price = serializers.DecimalField(source='price.price', max_digits=10, decimal_places=2, read_only=True)
    total_price = serializers.SerializerMethodField()
    food_image = serializers.SerializerMethodField()
    
    class Meta:
        model = CartItem
        fields = [
            'id', 'price', 'quantity', 'special_instructions', 'food_name', 'cook_name',
            'size', 'unit_price', 'total_price', 'food_image', 'created_at', 'updated_at'
        ]
    
    def get_total_price(self, obj):
        return float(obj.total_price)
    
    def get_food_image(self, obj):
        if obj.price and obj.price.image_url:
            return obj.price.image_url
        # Fallback to food's primary image
        if obj.price and obj.price.food:
            primary_img = obj.price.food.images.filter(is_primary=True).first()
            if primary_img and primary_img.image:
                return primary_img.image.url
        return None
