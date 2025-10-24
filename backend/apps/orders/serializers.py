from rest_framework import serializers
from django.db.models import Sum, Count
from .models import Order, OrderItem, OrderStatusHistory, CartItem, BulkOrder, BulkOrderAssignment, UserAddress
from apps.food.models import Food, FoodPrice
from apps.users.models import ChefProfile
from django.contrib.auth import get_user_model

User = get_user_model()


class UserAddressSerializer(serializers.ModelSerializer):
    """Serializer for user saved addresses"""

    class Meta:
        model = UserAddress
        fields = [
            "id",
            "label",
            "address_line1",
            "address_line2",
            "city",
            "state",
            "pincode",
            "latitude",
            "longitude",
            "is_default",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class FoodPriceSerializer(serializers.ModelSerializer):
    """Nested serializer for food price information"""

    food_name = serializers.CharField(source="food.name", read_only=True)
    food_description = serializers.CharField(source="food.description", read_only=True)
    food_category = serializers.CharField(source="food.category", read_only=True)
    food_image = serializers.CharField(source="food.image", read_only=True)

    class Meta:
        model = FoodPrice
        fields = [
            "price_id",
            "price",
            "size",
            "food_name",
            "food_description",
            "food_category",
            "food_image",
        ]


class CustomerSerializer(serializers.ModelSerializer):
    """Nested serializer for customer information"""

    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "user_id",
            "username",
            "email",
            "first_name",
            "last_name",
            "full_name",
            "phone_no",
            "name",
        ]

    def get_full_name(self, obj):
        if obj.name:
            return obj.name
        return f"{obj.first_name} {obj.last_name}".strip() or obj.username


class ChefSerializer(serializers.ModelSerializer):
    """Serializer for chef user information with kitchen location"""

    full_name = serializers.SerializerMethodField()
    kitchen_location = serializers.SerializerMethodField()
    specialty = serializers.SerializerMethodField()
    availability_hours = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "user_id",
            "username",
            "email",
            "first_name",
            "last_name",
            "full_name",
            "phone_no",
            "name",
            "kitchen_location",
            "specialty",
            "availability_hours",
        ]

    def get_full_name(self, obj):
        if obj.name:
            return obj.name
        return f"{obj.first_name} {obj.last_name}".strip() or obj.username

    def get_kitchen_location(self, obj):
        """Get kitchen location from Cook profile for pickup by delivery partners"""
        try:
            from apps.authentication.models import Cook

            cook_profile = Cook.objects.get(user=obj)
            return cook_profile.kitchen_location
        except Cook.DoesNotExist:
            return None

    def get_specialty(self, obj):
        """Get specialty from Cook profile"""
        try:
            from apps.authentication.models import Cook

            cook_profile = Cook.objects.get(user=obj)
            return cook_profile.specialty
        except Cook.DoesNotExist:
            return None

    def get_availability_hours(self, obj):
        """Get availability hours from Cook profile"""
        try:
            from apps.authentication.models import Cook

            cook_profile = Cook.objects.get(user=obj)
            return cook_profile.availability_hours
        except Cook.DoesNotExist:
            return None


class ChefProfileSerializer(serializers.ModelSerializer):
    """Nested serializer for chef information"""

    chef_name = serializers.CharField(source="user.get_full_name", read_only=True)
    chef_email = serializers.CharField(source="user.email", read_only=True)

    class Meta:
        model = ChefProfile
        fields = [
            "id",
            "chef_name",
            "chef_email",
            "specialties",
            "bio",
            "profile_image",
        ]


class OrderItemDetailSerializer(serializers.ModelSerializer):
    """Enhanced OrderItem serializer with nested food details"""

    price_details = FoodPriceSerializer(source="price", read_only=True)
    item_total = serializers.DecimalField(
        max_digits=10, decimal_places=2, read_only=True
    )

    class Meta:
        model = OrderItem
        fields = [
            "order_item_id",
            "quantity",
            "special_instructions",
            "price_details",
            "item_total",
        ]

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data["item_total"] = instance.total_price
        return data


class OrderStatusHistorySerializer(serializers.ModelSerializer):
    """Enhanced status history with user details"""

    changed_by_name = serializers.CharField(
        source="changed_by.get_full_name", read_only=True
    )
    status_display = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = OrderStatusHistory
        fields = [
            "id",
            "status",
            "status_display",
            "changed_by",
            "changed_by_name",
            "notes",
            "created_at",
        ]


class OrderListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for order lists and dashboard"""

    customer_name = serializers.CharField(
        source="customer.get_full_name", read_only=True
    )
    chef_name = serializers.CharField(source="chef.get_full_name", read_only=True)
    total_items = serializers.SerializerMethodField()
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    time_since_order = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = [
            "id",
            "order_number",
            "status",
            "status_display",
            "total_amount",
            "customer_name",
            "chef_name",
            "total_items",
            "created_at",
            "time_since_order",
            "delivery_address",
        ]

    def get_total_items(self, obj):
        return obj.items.aggregate(total=Sum("quantity"))["total"] or 0

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
    chef = ChefSerializer(read_only=True)
    items = OrderItemDetailSerializer(many=True, read_only=True)
    status_history = OrderStatusHistorySerializer(many=True, read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)

    # Fields expected by frontend
    customer_name = serializers.SerializerMethodField()
    chef_name = serializers.SerializerMethodField()
    time_since_order = serializers.SerializerMethodField()
    pickup_location = serializers.SerializerMethodField()  # For delivery partners

    # Computed fields
    total_items = serializers.SerializerMethodField()
    estimated_prep_time = serializers.SerializerMethodField()
    can_edit = serializers.SerializerMethodField()
    time_in_current_status = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = [
            "id",
            "order_number",
            "status",
            "status_display",
            "total_amount",
            "delivery_fee",
            "tax_amount",
            "discount_amount",
            "delivery_address",
            "delivery_instructions",
            "customer_notes",
            "payment_method",
            "payment_status",
            "estimated_delivery_time",
            "actual_delivery_time",
            "created_at",
            "updated_at",
            "customer",
            "chef",
            "items",
            "status_history",
            "total_items",
            "estimated_prep_time",
            "can_edit",
            "time_in_current_status",
            "customer_name",
            "chef_name",
            "time_since_order",
            "customer_notes",
            "chef_notes",
            "pickup_location",
        ]

    def get_customer_name(self, obj):
        if obj.customer:
            return (
                obj.customer.name
                or f"{obj.customer.first_name} {obj.customer.last_name}".strip()
                or obj.customer.username
            )
        return "Unknown Customer"

    def get_chef_name(self, obj):
        if obj.chef:
            return (
                obj.chef.name
                or f"{obj.chef.first_name} {obj.chef.last_name}".strip()
                or obj.chef.username
            )
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
        return obj.items.aggregate(total=Sum("quantity"))["total"] or 0

    def get_estimated_prep_time(self, obj):
        # Calculate based on number of items and complexity
        total_items = self.get_total_items(obj)
        base_time = 15  # 15 minutes base
        return base_time + (total_items * 5)  # 5 minutes per item

    def get_can_edit(self, obj):
        # Orders can be edited if they're in cart, pending, or confirmed status
        return obj.status in ["cart", "pending", "confirmed"]

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

    def get_pickup_location(self, obj):
        """Get chef's kitchen location for delivery partner pickup"""
        if obj.chef:
            try:
                from apps.authentication.models import Cook

                cook_profile = Cook.objects.get(user=obj.chef)
                return cook_profile.kitchen_location
            except Cook.DoesNotExist:
                return None
        return None


class CartItemSerializer(serializers.ModelSerializer):
    """Enhanced cart item serializer with all required fields for frontend"""

    # Food and price information
    food_name = serializers.CharField(source="price.food.name", read_only=True)
    food_description = serializers.CharField(source="price.food.description", read_only=True)
    food_id = serializers.IntegerField(source="price.food.food_id", read_only=True)
    price_id = serializers.IntegerField(source="price.price_id", read_only=True)
    size = serializers.CharField(source="price.size", read_only=True)
    unit_price = serializers.DecimalField(
        source="price.price", max_digits=10, decimal_places=2, read_only=True
    )
    total_price = serializers.SerializerMethodField()
    food_image = serializers.SerializerMethodField()
    
    # Chef/Cook information
    chef_id = serializers.IntegerField(source="price.cook.user_id", read_only=True)
    chef_name = serializers.SerializerMethodField()
    cook_name = serializers.SerializerMethodField()
    kitchen_address = serializers.SerializerMethodField()
    kitchen_location = serializers.SerializerMethodField()

    class Meta:
        model = CartItem
        fields = [
            'id', 'quantity', 'special_instructions', 'created_at', 'updated_at',
            'food_name', 'food_description', 'food_id', 'price_id', 'size', 
            'unit_price', 'total_price', 'food_image',
            'chef_id', 'chef_name', 'cook_name', 'kitchen_address', 'kitchen_location'
        ]

    def get_chef_name(self, obj):
        """Get chef's display name"""
        try:
            cook = obj.price.cook
            if cook and cook.name:
                return cook.name
            elif cook:
                return f"{cook.first_name} {cook.last_name}".strip() or cook.username
            return "Unknown Chef"
        except Exception:
            return "Unknown Chef"
    
    def get_cook_name(self, obj):
        """Alias for chef_name for backward compatibility"""
        return self.get_chef_name(obj)

    def get_food_image(self, obj):
        """Get optimized food image URL"""
        try:
            if obj.price and obj.price.food and obj.price.food.image:
                # Try to get optimized URL if available
                if hasattr(obj.price.food, 'get_optimized_image_url'):
                    return obj.price.food.get_optimized_image_url()
                return str(obj.price.food.image)
            return None
        except Exception:
            return None

    def get_kitchen_address(self, obj):
        """Get chef's kitchen address"""
        try:
            from apps.users.models import Address
            
            cook = obj.price.cook
            if not cook:
                return "Address not available"
            
            # Get kitchen address from Address model (users app)
            kitchen_address = Address.objects.filter(
                user=cook,
                address_type='kitchen',
                is_default=True,
                is_active=True
            ).first()
            
            # If no default kitchen, get any active kitchen address
            if not kitchen_address:
                kitchen_address = Address.objects.filter(
                    user=cook,
                    address_type='kitchen',
                    is_active=True
                ).first()
            
            # If still no kitchen address, get default address
            if not kitchen_address:
                kitchen_address = Address.objects.filter(
                    user=cook,
                    is_default=True,
                    is_active=True
                ).first()
            
            if kitchen_address:
                # Format the address nicely
                address_parts = []
                if kitchen_address.label:
                    address_parts.append(kitchen_address.label)
                if hasattr(kitchen_address, 'street_address') and kitchen_address.street_address:
                    address_parts.append(kitchen_address.street_address)
                if hasattr(kitchen_address, 'city') and kitchen_address.city:
                    address_parts.append(kitchen_address.city)
                
                return ", ".join(address_parts) if address_parts else "Kitchen Location"
            
            return "Address not available"
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Error getting kitchen address for cook {obj.price.cook.user_id}: {str(e)}")
            return "Address not available"

    def get_kitchen_location(self, obj):
        """Get chef's kitchen location coordinates"""
        try:
            from apps.users.models import Address
            
            cook = obj.price.cook
            if not cook:
                return None
            
            # Get kitchen address from Address model (users app)
            kitchen_address = Address.objects.filter(
                user=cook,
                address_type='kitchen',
                is_default=True,
                is_active=True
            ).first()
            
            # If no default kitchen, get any active kitchen address
            if not kitchen_address:
                kitchen_address = Address.objects.filter(
                    user=cook,
                    address_type='kitchen',
                    is_active=True
                ).first()
            
            # If still no kitchen address, get default address
            if not kitchen_address:
                kitchen_address = Address.objects.filter(
                    user=cook,
                    is_default=True,
                    is_active=True
                ).first()
            
            if kitchen_address and kitchen_address.latitude and kitchen_address.longitude:
                return {
                    'lat': float(kitchen_address.latitude),
                    'lng': float(kitchen_address.longitude)
                }
            
            return None
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Error getting kitchen location for cook {obj.price.cook.user_id}: {str(e)}")
            return None

    def get_total_price(self, obj):
        """Calculate total price for this cart item"""
        return float(obj.total_price)


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
    action = serializers.ChoiceField(
        choices=[
            ("assign_chef", "Assign Chef"),
            ("update_status", "Update Status"),
            ("delete", "Delete Orders"),
            ("export", "Export Orders"),
        ]
    )
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
    chef_username = serializers.CharField(source="chef.username", read_only=True)
    chef_email = serializers.CharField(source="chef.email", read_only=True)

    class Meta:
        model = BulkOrderAssignment
        fields = ["id", "chef", "chef_name", "chef_username", "chef_email"]

    def get_chef_name(self, obj):
        return (
            obj.chef.name
            if obj.chef and obj.chef.name
            else obj.chef.username if obj.chef else "Unknown Chef"
        )


class BulkOrderListSerializer(serializers.ModelSerializer):
    """Serializer for bulk order list view - matches frontend BulkOrder interface"""

    # Map bulk order fields to frontend expected fields
    id = serializers.IntegerField(source="bulk_order_id", read_only=True)
    order_number = serializers.SerializerMethodField()
    customer_name = serializers.SerializerMethodField()
    event_type = serializers.SerializerMethodField()
    total_amount = serializers.SerializerMethodField()
    event_date = serializers.DateTimeField(source="deadline", read_only=True)

    # Menu items as expected by frontend
    items = serializers.SerializerMethodField()

    # Collaborators from assignments
    collaborators = serializers.SerializerMethodField()

    class Meta:
        model = BulkOrder
        fields = [
            "id",
            "order_number",
            "customer_name",
            "event_type",
            "event_date",
            "status",
            "total_amount",
            "total_quantity",
            "description",
            "items",
            "collaborators",
            "created_at",
            "updated_at",
        ]

    def get_customer_name(self, obj):
        return (
            obj.created_by.name
            if obj.created_by and obj.created_by.name
            else obj.created_by.username if obj.created_by else "Unknown User"
        )

    def get_order_number(self, obj):
        return f"BULK-{obj.bulk_order_id:06d}"

    def get_event_type(self, obj):
        # Extract event type from description or default
        if obj.description:
            # Try to extract event type from description
            description_lower = obj.description.lower()
            if "wedding" in description_lower:
                return "wedding"
            elif "corporate" in description_lower:
                return "corporate"
            elif "party" in description_lower:
                return "party"
            elif "birthday" in description_lower:
                return "birthday"
        return "other"

    def get_total_amount(self, obj):
        # Prefer the BulkOrder.total_amount field. Fall back to related order when present.
        try:
            if obj.total_amount is not None:
                return str(obj.total_amount)
        except Exception:
            pass
        if getattr(obj, 'order', None):
            return str(obj.order.total_amount)
        return "0.00"

    def get_items(self, obj):
        # Get items from the related order when available. Otherwise return empty list.
        if getattr(obj, 'order', None):
            order_items = obj.order.items.all()[:3]  # Limit to first 3
            return [
                {
                    "id": item.order_item_id,
                    "food_name": item.food_name or "Unknown Item",
                    "quantity": item.quantity,
                    "special_instructions": item.special_instructions or None,
                }
                for item in order_items
            ]
        return []

    def get_collaborators(self, obj):
        # Get assigned chefs
        assignments = obj.assignments.select_related("chef")
        return [
            {
                'id': assignment.chef.user_id,
                "name": (
                    assignment.chef.name
                    if assignment.chef.name
                    else assignment.chef.username
                ),
                "email": assignment.chef.email,
                "role": "chef",
            }
            for assignment in assignments
        ]


class BulkOrderDetailSerializer(serializers.ModelSerializer):
    """Detailed serializer for bulk order with all related data"""

    id = serializers.IntegerField(source="bulk_order_id", read_only=True)
    order_number = serializers.SerializerMethodField()
    customer = CustomerSerializer(source="created_by", read_only=True)
    event_type = serializers.SerializerMethodField()
    total_amount = serializers.SerializerMethodField()
    event_date = serializers.DateTimeField(source="deadline", read_only=True)
    assignments = BulkOrderAssignmentSerializer(many=True, read_only=True)
    order_details = OrderDetailSerializer(source="order", read_only=True)

    class Meta:
        model = BulkOrder
        fields = [
            "id",
            "order_number",
            "customer",
            "event_type",
            "event_date",
            "status",
            "total_amount",
            "total_quantity",
            "description",
            "assignments",
            "order_details",
            "created_at",
            "updated_at",
        ]

    def get_order_number(self, obj):
        return f"BULK-{obj.bulk_order_id:06d}"

    def get_event_type(self, obj):
        # Extract event type from description or default
        if obj.description:
            description_lower = obj.description.lower()
            if "wedding" in description_lower:
                return "wedding"
            elif "corporate" in description_lower:
                return "corporate"
            elif "party" in description_lower:
                return "party"
            elif "birthday" in description_lower:
                return "birthday"
        return "other"

    def get_total_amount(self, obj):
        # Prefer the BulkOrder.total_amount value; otherwise fall back to related order.
        try:
            if obj.total_amount is not None:
                return str(obj.total_amount)
        except Exception:
            pass
        if getattr(obj, 'order', None):
            return str(obj.order.total_amount)
        return "0.00"


# Duplicate definitions removed - using earlier complete implementations above


# ===== CUSTOMER BULK ORDER SERIALIZERS =====

class CustomerBulkOrderSerializer(serializers.Serializer):
    """Serializer for customers to place bulk orders from bulk menus"""
    
    bulk_menu_id = serializers.IntegerField(required=True)
    num_persons = serializers.IntegerField(required=True, min_value=1)
    event_date = serializers.DateField(required=True)
    event_time = serializers.TimeField(required=True)
    delivery_address = serializers.CharField(required=True, max_length=500)
    special_instructions = serializers.CharField(required=False, allow_blank=True)
    selected_optional_items = serializers.ListField(
        child=serializers.IntegerField(),
        required=False,
        default=list
    )
    total_amount = serializers.DecimalField(
        max_digits=12, 
        decimal_places=2, 
        required=True,
        min_value=0
    )

    def validate_bulk_menu_id(self, value):
        """Validate that the bulk menu exists and is available"""
        from apps.food.models import BulkMenu
        
        try:
            menu = BulkMenu.objects.get(id=value)
            if menu.approval_status != 'approved':
                raise serializers.ValidationError("This bulk menu is not approved")
            if not menu.availability_status:
                raise serializers.ValidationError("This bulk menu is not currently available")
            return value
        except BulkMenu.DoesNotExist:
            raise serializers.ValidationError("Bulk menu not found")

    def validate(self, data):
        """Validate that num_persons is within menu limits and event is in future"""
        from apps.food.models import BulkMenu
        from django.utils import timezone
        from datetime import datetime, timedelta
        
        menu = BulkMenu.objects.get(id=data['bulk_menu_id'])
        
        # Validate number of persons
        if data['num_persons'] < menu.min_persons:
            raise serializers.ValidationError({
                'num_persons': f"Minimum {menu.min_persons} persons required for this menu"
            })
        if data['num_persons'] > menu.max_persons:
            raise serializers.ValidationError({
                'num_persons': f"Maximum {menu.max_persons} persons allowed for this menu"
            })
        
        # Validate event date/time is in future with advance notice
        event_datetime = datetime.combine(data['event_date'], data['event_time'])
        event_datetime = timezone.make_aware(event_datetime)
        
        if event_datetime <= timezone.now():
            raise serializers.ValidationError({
                'event_date': "Event must be in the future"
            })
        
        # Check advance notice requirement
        hours_until_event = (event_datetime - timezone.now()).total_seconds() / 3600
        if hours_until_event < menu.advance_notice_hours:
            raise serializers.ValidationError({
                'event_date': f"This menu requires {menu.advance_notice_hours} hours advance notice"
            })
        
        return data