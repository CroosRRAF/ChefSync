from rest_framework import serializers
from django.db.models import Sum, Count
from .models import Order, OrderItem, OrderStatusHistory, CartItem
from apps.food.models import Food, FoodPrice
from django.contrib.auth import get_user_model
from apps.users.models import ChefProfile

User = get_user_model()


class FoodPriceSerializer(serializers.ModelSerializer):
    """Nested serializer for food price information"""
    food_name = serializers.CharField(source='food.name', read_only=True)
    food_description = serializers.CharField(source='food.description', read_only=True)
    food_category = serializers.CharField(source='food.category', read_only=True)
    food_image = serializers.CharField(source='food.image', read_only=True)
    
    class Meta:
        model = FoodPrice
        fields = ['id', 'price', 'size', 'food_name', 'food_description', 'food_category', 'food_image']


class CustomerSerializer(serializers.ModelSerializer):
    """Nested serializer for customer information"""
    full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'full_name', 'phone']
        
    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip() or obj.username


class ChefProfileSerializer(serializers.ModelSerializer):
    """Nested serializer for chef information"""
    chef_name = serializers.CharField(source='user.get_full_name', read_only=True)
    chef_email = serializers.CharField(source='user.email', read_only=True)
    
    class Meta:
        model = ChefProfile
        fields = ['id', 'chef_name', 'chef_email', 'specialties', 'bio', 'profile_image']


class OrderItemDetailSerializer(serializers.ModelSerializer):
    """Enhanced OrderItem serializer with nested food details"""
    price_details = FoodPriceSerializer(source='price', read_only=True)
    item_total = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    
    class Meta:
        model = OrderItem
        fields = ['id', 'quantity', 'special_instructions', 'price_details', 'item_total']
        
    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['item_total'] = instance.total_price
        return data


class OrderStatusHistorySerializer(serializers.ModelSerializer):
    """Enhanced status history with user details"""
    changed_by_name = serializers.CharField(source='changed_by.get_full_name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = OrderStatusHistory
        fields = ['id', 'status', 'status_display', 'changed_by', 'changed_by_name', 'notes', 'created_at']


class OrderListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for order lists and dashboard"""
    customer_name = serializers.CharField(source='customer.get_full_name', read_only=True)
    chef_name = serializers.CharField(source='chef.get_full_name', read_only=True)
    total_items = serializers.SerializerMethodField()
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    time_since_order = serializers.SerializerMethodField()
    
    class Meta:
        model = Order
        fields = [
            'id', 'order_number', 'status', 'status_display', 'total_amount', 
            'customer_name', 'chef_name', 'total_items', 'created_at', 
            'time_since_order', 'delivery_address', 'order_type'
        ]
    
    def get_total_items(self, obj):
        return obj.items.aggregate(total=Sum('quantity'))['total'] or 0
    
    def get_time_since_order(self, obj):
        from django.utils import timezone
        diff = timezone.now() - obj.created_at
        hours = diff.total_seconds() / 3600
        if hours < 1:
            return f"{int(diff.total_seconds() / 60)}m ago"
        elif hours < 24:
            return f"{int(hours)}h ago"
        else:
            return f"{int(hours / 24)}d ago"


class OrderDetailSerializer(serializers.ModelSerializer):
    """Comprehensive serializer for order details"""
    customer = CustomerSerializer(read_only=True)
    chef = ChefProfileSerializer(read_only=True)
    items = OrderItemDetailSerializer(many=True, read_only=True)
    status_history = OrderStatusHistorySerializer(many=True, read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    # Computed fields
    total_items = serializers.SerializerMethodField()
    estimated_prep_time = serializers.SerializerMethodField()
    can_edit = serializers.SerializerMethodField()
    time_in_current_status = serializers.SerializerMethodField()
    
    class Meta:
        model = Order
        fields = [
            'id', 'order_number', 'status', 'status_display', 'order_type',
            'total_amount', 'delivery_fee', 'tax_amount', 'discount_amount',
            'delivery_address', 'special_instructions', 'payment_method',
            'payment_status', 'estimated_delivery_time', 'actual_delivery_time',
            'created_at', 'updated_at', 'customer', 'chef', 'items',
            'status_history', 'total_items', 'estimated_prep_time',
            'can_edit', 'time_in_current_status'
        ]
    
    def get_total_items(self, obj):
        return obj.items.aggregate(total=Sum('quantity'))['total'] or 0
    
    def get_estimated_prep_time(self, obj):
        # Calculate based on number of items and complexity
        total_items = self.get_total_items(obj)
        base_time = 15  # 15 minutes base
        return base_time + (total_items * 5)  # 5 minutes per item
    
    def get_can_edit(self, obj):
        # Orders can be edited if they're in cart, pending, or confirmed status
        return obj.status in ['cart', 'pending', 'confirmed']
    
    def get_time_in_current_status(self, obj):
        from django.utils import timezone
        # Get the latest status change or order creation time
        latest_status = obj.status_history.first()
        if latest_status:
            status_time = latest_status.created_at
        else:
            status_time = obj.created_at
        
        diff = timezone.now() - status_time
        minutes = int(diff.total_seconds() / 60)
        if minutes < 60:
            return f"{minutes}m"
        else:
            hours = int(minutes / 60)
            return f"{hours}h {minutes % 60}m"


class CartItemSerializer(serializers.ModelSerializer):
    """Enhanced cart item serializer"""
    price_details = FoodPriceSerializer(source='price', read_only=True)
    item_total = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    
    class Meta:
        model = CartItem
        fields = ['id', 'quantity', 'special_instructions', 'price_details', 'item_total', 'created_at', 'updated_at']
        
    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['item_total'] = instance.total_price
        return data


class OrderStatsSerializer(serializers.Serializer):
    """Serializer for dashboard statistics"""
    total_orders = serializers.IntegerField()
    pending_orders = serializers.IntegerField()
    preparing_orders = serializers.IntegerField()
    ready_orders = serializers.IntegerField()
    completed_orders = serializers.IntegerField()
    today_revenue = serializers.DecimalField(max_digits=10, decimal_places=2)
    average_prep_time = serializers.FloatField()
    total_customers = serializers.IntegerField()


class BulkOrderActionSerializer(serializers.Serializer):
    """Serializer for bulk order operations"""
    order_ids = serializers.ListField(child=serializers.IntegerField())
    action = serializers.ChoiceField(choices=[
        ('assign_chef', 'Assign Chef'),
        ('update_status', 'Update Status'),
        ('delete', 'Delete Orders'),
        ('export', 'Export Orders')
    ])
    chef_id = serializers.IntegerField(required=False)
    new_status = serializers.CharField(required=False)
    notes = serializers.CharField(required=False, allow_blank=True)


# Legacy serializers for backward compatibility
class OrderSerializer(OrderDetailSerializer):
    """Legacy serializer - use OrderDetailSerializer instead"""
    pass


class OrderItemSerializer(OrderItemDetailSerializer):
    """Legacy serializer - use OrderItemDetailSerializer instead"""
    pass
