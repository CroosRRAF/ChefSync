from rest_framework import serializers
from django.db.models import Sum, Count
from .models import Order, OrderItem, OrderStatusHistory, CartItem, BulkOrder, BulkOrderAssignment
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
        fields = ['user_id', 'username', 'email', 'first_name', 'last_name', 'full_name', 'phone_no', 'name']
        
    def get_full_name(self, obj):
        if obj.name:
            return obj.name
        return f"{obj.first_name} {obj.last_name}".strip() or obj.username


class ChefSerializer(serializers.ModelSerializer):
    """Serializer for chef user information"""
    full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['user_id', 'username', 'email', 'first_name', 'last_name', 'full_name', 'phone_no', 'name']
        
    def get_full_name(self, obj):
        if obj.name:
            return obj.name
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


class ChefSerializer(serializers.ModelSerializer):
    """Serializer for chef user information"""
    full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'full_name', 'phone_no', 'name']
        
    def get_full_name(self, obj):
        if obj.name:
            return obj.name
        return f"{obj.first_name} {obj.last_name}".strip() or obj.username


class OrderDetailSerializer(serializers.ModelSerializer):
    """Comprehensive serializer for order details"""
    customer = CustomerSerializer(read_only=True)
    chef = ChefSerializer(read_only=True)  # Changed from ChefProfileSerializer to ChefSerializer
    items = OrderItemDetailSerializer(many=True, read_only=True)
    status_history = OrderStatusHistorySerializer(many=True, read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    # Fields expected by frontend
    customer_name = serializers.SerializerMethodField()
    chef_name = serializers.SerializerMethodField()
    time_since_order = serializers.SerializerMethodField()
    
    # Computed fields
    total_items = serializers.SerializerMethodField()
    estimated_prep_time = serializers.SerializerMethodField()
    can_edit = serializers.SerializerMethodField()
    time_in_current_status = serializers.SerializerMethodField()
    
    class Meta:
        model = Order
        fields = [
            'id', 'order_number', 'status', 'status_display','order_type',
            'total_amount', 'delivery_fee', 'tax_amount', 'discount_amount',
            'delivery_address', 'delivery_instructions', 'payment_method',
            'payment_status', 'estimated_delivery_time', 'actual_delivery_time',
            'created_at', 'updated_at', 'customer', 'chef', 'items',
            'status_history', 'total_items', 'estimated_prep_time',
            'can_edit', 'time_in_current_status', 'customer_name', 'chef_name', 
            'time_since_order', 'customer_notes', 'chef_notes'
        ]
    
    def get_customer_name(self, obj):
        if obj.customer:
            return obj.customer.name or f"{obj.customer.first_name} {obj.customer.last_name}".strip() or obj.customer.username
        return "Unknown Customer"
    
    def get_chef_name(self, obj):
        if obj.chef:
            return obj.chef.name or f"{obj.chef.first_name} {obj.chef.last_name}".strip() or obj.chef.username
        return "Unknown Chef"
    
    def get_time_since_order(self, obj):
        from django.utils import timezone
        diff = timezone.now() - obj.created_at
        minutes = int(diff.total_seconds() / 60)
        if minutes < 60:
            return f"{minutes} minutes ago"
        elif minutes < 1440:  # Less than 24 hours
            hours = int(minutes / 60)
            return f"{hours} hours ago"
        else:
            days = int(minutes / 1440)
            return f"{days} days ago"
    
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


# ===== BULK ORDER SERIALIZERS =====

class BulkOrderAssignmentSerializer(serializers.ModelSerializer):
    """Serializer for bulk order assignments"""
    chef_name = serializers.SerializerMethodField()
    chef_username = serializers.CharField(source='chef.username', read_only=True)
    chef_email = serializers.CharField(source='chef.email', read_only=True)
    
    class Meta:
        model = BulkOrderAssignment
        fields = ['id', 'chef', 'chef_name', 'chef_username', 'chef_email']
    
    def get_chef_name(self, obj):
        return obj.chef.name if obj.chef and obj.chef.name else obj.chef.username if obj.chef else 'Unknown Chef'


class BulkOrderListSerializer(serializers.ModelSerializer):
    """Serializer for bulk order list view - matches frontend BulkOrder interface"""
    # Map bulk order fields to frontend expected fields
    id = serializers.IntegerField(source='bulk_order_id', read_only=True)
    order_number = serializers.SerializerMethodField()
    customer_name = serializers.SerializerMethodField()
    event_type = serializers.SerializerMethodField()
    total_amount = serializers.SerializerMethodField()
    event_date = serializers.DateTimeField(source='deadline', read_only=True)
    
    # Menu items as expected by frontend
    items = serializers.SerializerMethodField()
    
    # Collaborators from assignments
    collaborators = serializers.SerializerMethodField()
    
    class Meta:
        model = BulkOrder
        fields = [
            'id', 'order_number', 'customer_name', 'event_type', 'event_date',
            'status', 'total_amount', 'total_quantity', 'description',
            'items', 'collaborators', 'created_at', 'updated_at'
        ]
    
    def get_customer_name(self, obj):
        return obj.created_by.name if obj.created_by and obj.created_by.name else obj.created_by.username if obj.created_by else 'Unknown User'
    
    def get_order_number(self, obj):
        return f"BULK-{obj.bulk_order_id:06d}"
    
    def get_event_type(self, obj):
        # Extract event type from description or default
        if obj.description:
            # Try to extract event type from description
            description_lower = obj.description.lower()
            if 'wedding' in description_lower:
                return 'wedding'
            elif 'corporate' in description_lower:
                return 'corporate'
            elif 'party' in description_lower:
                return 'party'
            elif 'birthday' in description_lower:
                return 'birthday'
        return 'other'
    
    def get_total_amount(self, obj):
        # Calculate from related order or return default
        if obj.order:
            return str(obj.order.total_amount)
        return "0.00"
    
    def get_items(self, obj):
        # Get items from the related order
        if obj.order:
            order_items = obj.order.items.all()[:3]  # Limit to first 3
            return [
                {
                    'id': item.order_item_id,
                    'food_name': item.food_name or 'Unknown Item',
                    'quantity': item.quantity,
                    'special_instructions': item.special_instructions or None
                }
                for item in order_items
            ]
        return []
    
    def get_collaborators(self, obj):
        # Get assigned chefs
        assignments = obj.assignments.select_related('chef')
        return [
            {
                'id': assignment.chef.id,
                'name': assignment.chef.name if assignment.chef.name else assignment.chef.username,
                'email': assignment.chef.email,
                'role': 'chef'
            }
            for assignment in assignments
        ]


class BulkOrderDetailSerializer(serializers.ModelSerializer):
    """Detailed serializer for bulk order with all related data"""
    id = serializers.IntegerField(source='bulk_order_id', read_only=True)
    order_number = serializers.SerializerMethodField()
    customer = CustomerSerializer(source='created_by', read_only=True)
    event_type = serializers.SerializerMethodField()
    total_amount = serializers.SerializerMethodField()
    event_date = serializers.DateTimeField(source='deadline', read_only=True)
    assignments = BulkOrderAssignmentSerializer(many=True, read_only=True)
    order_details = OrderDetailSerializer(source='order', read_only=True)
    
    class Meta:
        model = BulkOrder
        fields = [
            'id', 'order_number', 'customer', 'event_type', 'event_date',
            'status', 'total_amount', 'total_quantity', 'description',
            'assignments', 'order_details', 'created_at', 'updated_at'
        ]
    
    def get_order_number(self, obj):
        return f"BULK-{obj.bulk_order_id:06d}"
    
    def get_event_type(self, obj):
        # Extract event type from description or default
        if obj.description:
            description_lower = obj.description.lower()
            if 'wedding' in description_lower:
                return 'wedding'
            elif 'corporate' in description_lower:
                return 'corporate'
            elif 'party' in description_lower:
                return 'party'
            elif 'birthday' in description_lower:
                return 'birthday'
        return 'other'
    
    def get_total_amount(self, obj):
        if obj.order:
            return str(obj.order.total_amount)
        return "0.00"
