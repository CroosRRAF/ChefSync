import math
import uuid
from decimal import Decimal

from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models


# Keep UserAddress for backward compatibility but mark as deprecated
class UserAddress(models.Model):
    """User saved addresses for delivery"""

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='addresses')
    label = models.CharField(max_length=100, help_text='Address label (e.g., Home, Work)')
    address_line1 = models.CharField(max_length=200)
    address_line2 = models.CharField(max_length=200, blank=True, null=True)
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100, blank=True, null=True)
    pincode = models.CharField(max_length=20)
    latitude = models.DecimalField(
        max_digits=9, decimal_places=6, null=True, blank=True
    )
    longitude = models.DecimalField(
        max_digits=9, decimal_places=6, null=True, blank=True
    )
    is_default = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username} - {self.label}"

    class Meta:
        db_table = "user_addresses"
        unique_together = ["user", "label"]


class Order(models.Model):
    """Complete Order Management System"""

    ORDER_STATUS_CHOICES = [
        ("cart", "Cart"),
        ("pending", "Pending Payment"),
        ("confirmed", "Confirmed"),
        ("preparing", "Preparing"),
        ("ready", "Ready for Pickup"),
        ("out_for_delivery", "Out for Delivery"),
        ("delivered", "Delivered"),
        ("cancelled", "Cancelled"),
        ("refunded", "Refunded"),
    ]

    PAYMENT_STATUS_CHOICES = [
        ("pending", "Pending"),
        ("paid", "Paid"),
        ("failed", "Failed"),
        ("refunded", "Refunded"),
        ("partial_refund", "Partial Refund"),
    ]

    PAYMENT_METHOD_CHOICES = [
        ("cash", "Cash on Delivery"),
        # ('card', 'Credit/Debit Card'),
        # ('online', 'Online Payment'),
        # ('wallet', 'Digital Wallet'),
    ]

    ORDER_TYPE_CHOICES = [
        ("delivery", "Delivery"),
        ("pickup", "Pickup"),
    ]

    # Order Identification
    order_number = models.CharField(max_length=50, unique=True, db_index=True)
    order_type = models.CharField(
        max_length=20, 
        choices=ORDER_TYPE_CHOICES, 
        default="delivery",
        help_text="Whether this is a delivery or pickup order"
    )

    # User Relations
    customer = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="orders"
    )
    chef = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="chef_orders"
    )
    delivery_partner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="delivery_orders",
    )

    # Order Status
    status = models.CharField(
        max_length=20, choices=ORDER_STATUS_CHOICES, default="cart", db_index=True
    )
    payment_status = models.CharField(
        max_length=20, choices=PAYMENT_STATUS_CHOICES, default="pending"
    )
    payment_method = models.CharField(
        max_length=20, choices=PAYMENT_METHOD_CHOICES, null=True, blank=True
    )

    # Financial Information
    subtotal = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal("0.00"),
        validators=[MinValueValidator(0)],
    )
    tax_amount = models.DecimalField(
        max_digits=10, decimal_places=2, default=Decimal("0.00")
    )
    delivery_fee = models.DecimalField(
        max_digits=10, decimal_places=2, default=Decimal("0.00")
    )
    discount_amount = models.DecimalField(
        max_digits=10, decimal_places=2, default=Decimal("0.00")
    )
    total_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal("0.00"),
        validators=[MinValueValidator(0)],
    )

    # Delivery Information
    delivery_address = models.TextField(default="No address provided")  # Keep for backward compatibility
    delivery_address_ref = models.ForeignKey(
        UserAddress,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="orders",
    )  # Deprecated

    # New address system - reference to apps.users.address_models.Address
    delivery_address_new_id = models.BigIntegerField(
        null=True,
        blank=True,
        help_text='New address system reference'
    )

    delivery_instructions = models.TextField(blank=True)
    delivery_latitude = models.DecimalField(
        max_digits=10, decimal_places=8, null=True, blank=True
    )
    delivery_longitude = models.DecimalField(
        max_digits=11, decimal_places=8, null=True, blank=True
    )
    distance_km = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Distance from kitchen to delivery address in km",
    )
    promo_code = models.CharField(max_length=50, null=True, blank=True)


    # Kitchen location reference
    kitchen_location_id = models.BigIntegerField(
        null=True,
        blank=True,
        help_text='Kitchen location for this order'
    )

    # Timing
    estimated_delivery_time = models.DateTimeField(null=True, blank=True)
    actual_delivery_time = models.DateTimeField(null=True, blank=True)
    preparation_time = models.PositiveIntegerField(
        help_text="Expected preparation time in minutes", null=True, blank=True
    )

    # Order Notes
    customer_notes = models.TextField(
        blank=True, help_text="Special instructions from customer"
    )
    chef_notes = models.TextField(blank=True, help_text="Notes from chef")
    admin_notes = models.TextField(blank=True, help_text="Internal admin notes")

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)
    confirmed_at = models.DateTimeField(null=True, blank=True)
    cancelled_at = models.DateTimeField(null=True, blank=True)
    
    # Status tracking - JSON field to store timestamps for each stage
    status_timestamps = models.JSONField(
        default=dict,
        blank=True,
        help_text="Timestamps for each order status transition"
    )

    def save(self, *args, **kwargs):
        from django.utils import timezone
        
        if not self.order_number:
            self.order_number = self.generate_order_number()
        
        # Track status changes with timestamps
        if self.pk:  # Only for existing orders
            old_order = Order.objects.filter(pk=self.pk).first()
            if old_order and old_order.status != self.status:
                # Status changed, record timestamp
                if not self.status_timestamps:
                    self.status_timestamps = {}
                self.status_timestamps[self.status] = timezone.now().isoformat()
        else:
            # New order, initialize with current status
            if not self.status_timestamps:
                self.status_timestamps = {}
            self.status_timestamps[self.status] = timezone.now().isoformat()
        
        super().save(*args, **kwargs)

    def generate_order_number(self):
        """Generate unique order number"""
        return f"ORD-{uuid.uuid4().hex[:8].upper()}"

    @property
    def total_items(self):
        return sum(item.quantity for item in self.items.all())

    @property
    def is_paid(self):
        return self.payment_status == "paid"

    @property
    def can_be_cancelled(self):
        """Check if order can be cancelled based on status and time"""
        from django.utils import timezone
        from datetime import timedelta
        
        # Only allow cancellation for these statuses
        if self.status not in ["pending", "confirmed"]:
            return False
        
        # Check 10-minute window
        time_since_order = timezone.now() - self.created_at
        return time_since_order <= timedelta(minutes=10)
    
    @property
    def cancellation_time_remaining(self):
        """Get remaining time for cancellation in seconds"""
        from django.utils import timezone
        from datetime import timedelta
        
        if not self.can_be_cancelled:
            return 0
        
        time_since_order = timezone.now() - self.created_at
        time_remaining = timedelta(minutes=10) - time_since_order
        return max(0, int(time_remaining.total_seconds()))

    def calculate_delivery_fee(self, distance_km):
        """Calculate delivery fee based on distance
        
        Fee Structure:
        - First 5 km: LKR 300
        - After 5 km: LKR 100 per km
        """
        if distance_km <= 5.0:
            return Decimal("300.00")
        else:
            extra_km = math.ceil(distance_km - 5.0)
            return Decimal("300.00") + Decimal(str(extra_km)) * Decimal("100.00")

    def calculate_tax(self, subtotal):
        """Calculate 10% tax on subtotal"""
        return round(subtotal * 0.10, 2)

    def __str__(self):
        return f"Order {self.order_number} - {self.customer.username}"

    class Meta:
        db_table = "orders"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["customer", "status"]),
            models.Index(fields=["chef", "status"]),
            models.Index(fields=["order_number"]),
            models.Index(fields=["created_at"]),
        ]


class OrderItem(models.Model):
    """Items in an order - updated to use FoodPrice as per SQL schema"""

    order_item_id = models.AutoField(primary_key=True)
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="items")
    price = models.ForeignKey(
        "food.FoodPrice", on_delete=models.CASCADE, related_name="order_items"
    )
    quantity = models.IntegerField(validators=[MinValueValidator(1)])

    # Keep existing fields for enhanced functionality
    unit_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)],
        null=True,
        blank=True,
    )
    total_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)],
        null=True,
        blank=True,
    )
    special_instructions = models.TextField(
        blank=True, help_text="Special cooking instructions"
    )

    # Snapshot of food details at time of order
    food_name = models.CharField(
        max_length=200, help_text="Food name at time of order", blank=True
    )
    food_description = models.TextField(
        help_text="Food description at time of order", blank=True
    )

    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        # Calculate prices based on FoodPrice
        if self.price:
            self.unit_price = self.price.price
            self.total_price = self.quantity * self.unit_price
            # Store food snapshot
            self.food_name = self.price.food.name
            if self.price.food.description:
                self.food_description = self.price.food.description
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.quantity}x {self.food_name} ({self.price.size if self.price else 'N/A'}) - Order {self.order.order_number}"

    class Meta:
        db_table = "order_items"
        unique_together = ["order", "price"]


class OrderStatusHistory(models.Model):
    """Track order status changes"""

    order = models.ForeignKey(
        Order, on_delete=models.CASCADE, related_name="status_history"
    )
    status = models.CharField(max_length=20, choices=Order.ORDER_STATUS_CHOICES)
    changed_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Order {self.order.order_number} - {self.get_status_display()}"

    class Meta:
        db_table = "order_status_history"
        ordering = ["-created_at"]


class CartItem(models.Model):
    """Shopping cart for customers - updated to use FoodPrice"""

    customer = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="cart_items"
    )
    price = models.ForeignKey(
        "food.FoodPrice", on_delete=models.CASCADE, related_name="cart_items"
    )
    quantity = models.PositiveIntegerField(validators=[MinValueValidator(1)])
    special_instructions = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    @property
    def total_price(self):
        return self.quantity * self.price.price if self.price else 0

    def __str__(self):
        food_name = self.price.food.name if self.price else "Unknown Food"
        size = self.price.size if self.price else "Unknown Size"
        return f"{self.customer.username} - {self.quantity}x {food_name} ({size})"

    class Meta:
        db_table = "cart_items"
        unique_together = ["customer", "price"]


class Delivery(models.Model):
    """Delivery tracking model based on SQL schema"""

    STATUS_CHOICES = [
        ("Pending", "Pending"),
        ("On the way", "On the way"),
        ("Delivered", "Delivered"),
    ]

    delivery_id = models.AutoField(primary_key=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="Pending")
    delivery_time = models.DateTimeField(null=True, blank=True)
    address = models.TextField()
    order = models.OneToOneField(Order, on_delete=models.CASCADE)
    agent = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="deliveries",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Delivery {self.delivery_id} - {self.status}"

    class Meta:
        db_table = "Delivery"
        ordering = ["-created_at"]


class DeliveryReview(models.Model):
    """Delivery review model based on SQL schema"""

    review_id = models.AutoField(primary_key=True)
    rating = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    comment = models.TextField(blank=True, null=True)
    delivery = models.ForeignKey(Delivery, on_delete=models.CASCADE)
    customer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="delivery_reviews",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Delivery Review by {self.customer.name} - {self.rating}/5"

    class Meta:
        db_table = "DeliveryReview"
        ordering = ["-created_at"]


class BulkOrder(models.Model):
    """Bulk order model for large-scale catering and events - Separate from regular orders"""

    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("confirmed", "Confirmed"),
        ("collaborating", "Collaborating"),
        ("preparing", "Preparing"),
        ("completed", "Completed"),
        ("cancelled", "Cancelled"),
    ]

    PAYMENT_STATUS_CHOICES = [
        ("pending", "Pending"),
        ("paid", "Paid"),
        ("failed", "Failed"),
        ("refunded", "Refunded"),
    ]

    ORDER_TYPE_CHOICES = [
        ("delivery", "Delivery"),
        ("pickup", "Pickup"),
    ]

    # Primary Fields
    bulk_order_id = models.AutoField(primary_key=True)
    # Make the order reference optional: bulk orders live primarily in the BulkOrder table.
    # Keep a nullable link for backward compatibility when an underlying Order exists.
    order = models.ForeignKey(
        Order,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="bulk_orders",
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="created_bulk_orders",
        help_text="User who created this bulk order (usually same as customer)"
    )
    chef = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="bulk_orders_as_chef",
        help_text="Chef assigned to this bulk order"
    )
    delivery_partner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="bulk_delivery_orders",
        help_text="Delivery agent assigned to this bulk order"
    )
    
    # Status Fields
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    payment_status = models.CharField(
        max_length=20, 
        choices=PAYMENT_STATUS_CHOICES, 
        default="pending"
    )
    
    # Financial Information
    subtotal = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal("0.00")
    )
    delivery_fee = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal("0.00")
    )
    total_amount = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        default=Decimal("0.00")
    )
    
    # Delivery/Pickup Information
    order_type = models.CharField(
        max_length=20,
        choices=ORDER_TYPE_CHOICES,
        default="delivery",
        help_text="Whether this is a delivery or pickup order"
    )
    delivery_address = models.TextField(blank=True, null=True)
    delivery_latitude = models.DecimalField(
        max_digits=10, 
        decimal_places=8, 
        null=True, 
        blank=True
    )
    delivery_longitude = models.DecimalField(
        max_digits=11, 
        decimal_places=8, 
        null=True, 
        blank=True
    )
    distance_km = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Distance from kitchen to delivery address in km"
    )
    
    # Event Details
    event_date = models.DateField(null=True, blank=True, help_text="Date of the event")
    event_time = models.TimeField(null=True, blank=True, help_text="Time of the event")
    num_persons = models.PositiveIntegerField(default=0, help_text="Number of persons for the event")
    menu_name = models.CharField(max_length=255, blank=True, null=True, help_text="Name of the bulk menu")
    
    # Notes
    notes = models.TextField(blank=True, null=True, help_text="Internal notes about the bulk order")
    customer_notes = models.TextField(blank=True, null=True, help_text="Special instructions from customer")
    chef_notes = models.TextField(blank=True, null=True, help_text="Notes from chef")
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)
    confirmed_at = models.DateTimeField(null=True, blank=True)
    estimated_delivery_time = models.DateTimeField(null=True, blank=True)
    actual_delivery_time = models.DateTimeField(null=True, blank=True)

    def save(self, *args, **kwargs):
        if not self.order_number:
            self.order_number = self.generate_order_number()
        super().save(*args, **kwargs)

    def generate_order_number(self):
        """Generate unique bulk order number"""
        import uuid
        return f"BULK-{uuid.uuid4().hex[:8].upper()}"

    def __str__(self):
        return f"Bulk Order {self.order_number} - {self.status}"

    class Meta:
        db_table = "BulkOrder"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["customer", "status"]),
            models.Index(fields=["chef", "status"]),
        ]


class BulkOrderAssignment(models.Model):
    """Assignment of chefs to bulk orders"""

    assignment_id = models.AutoField(primary_key=True)
    bulk_order = models.ForeignKey(
        BulkOrder, on_delete=models.CASCADE, related_name="assignments"
    )
    chef = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="bulk_order_assignments",
    )
    assigned_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"Assignment {self.assignment_id} - {self.chef.name} to Bulk Order {self.bulk_order.bulk_order_id}"

    class Meta:
        db_table = "BulkOrderAssignment"
        ordering = ["-assigned_at"]


# ==========================================
# DELIVERY TRACKING MODELS
# ==========================================


class LocationUpdate(models.Model):
    """Real-time location tracking for delivery agents"""

    delivery_agent = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="location_updates",
    )
    order = models.ForeignKey(
        Order,
        on_delete=models.CASCADE,
        related_name="location_updates",
        null=True,
        blank=True,
    )
    latitude = models.DecimalField(max_digits=9, decimal_places=6)
    longitude = models.DecimalField(max_digits=9, decimal_places=6)
    address = models.TextField(blank=True, null=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.delivery_agent.username} - {self.timestamp}"

    class Meta:
        db_table = "location_updates"
        ordering = ["-timestamp"]


class DeliveryIssue(models.Model):
    """Track delivery issues and problems"""

    ISSUE_TYPE_CHOICES = [
        ("customer_unavailable", "Customer Unavailable"),
        ("wrong_address", "Wrong Address"),
        ("traffic_delay", "Traffic Delay"),
        ("vehicle_problem", "Vehicle Problem"),
        ("order_damaged", "Order Damaged"),
        ("payment_issue", "Payment Issue"),
        ("other", "Other"),
    ]

    STATUS_CHOICES = [
        ("reported", "Reported"),
        ("acknowledged", "Acknowledged"),
        ("in_progress", "In Progress"),
        ("resolved", "Resolved"),
        ("escalated", "Escalated"),
    ]

    issue_id = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    order = models.ForeignKey(
        Order, on_delete=models.CASCADE, related_name="delivery_issues"
    )
    delivery_agent = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="reported_issues",
    )
    issue_type = models.CharField(max_length=50, choices=ISSUE_TYPE_CHOICES)
    description = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="reported")
    created_at = models.DateTimeField(auto_now_add=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
    resolution_notes = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"Issue {self.issue_id} - Order {self.order.order_id}"

    class Meta:
        db_table = "delivery_issues"
        ordering = ["-created_at"]


class DeliveryChat(models.Model):
    """Chat messages between delivery agent and customer"""

    MESSAGE_TYPE_CHOICES = [
        ("text", "Text"),
        ("location", "Location"),
        ("image", "Image"),
    ]

    message_id = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    order = models.ForeignKey(
        Order, on_delete=models.CASCADE, related_name="chat_messages"
    )
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="sent_delivery_messages",
    )
    receiver = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="received_delivery_messages",
    )
    message = models.TextField()
    message_type = models.CharField(
        max_length=20, choices=MESSAGE_TYPE_CHOICES, default="text"
    )
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Message {self.message_id} - Order {self.order.order_id}"

    class Meta:
        db_table = "delivery_chats"
        ordering = ["created_at"]


class DeliveryLog(models.Model):
    """Complete delivery performance logs"""

    STATUS_CHOICES = [
        ("in_progress", "In Progress"),
        ("completed", "Completed"),
        ("failed", "Failed"),
        ("cancelled", "Cancelled"),
    ]

    log_id = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    order = models.OneToOneField(
        Order, on_delete=models.CASCADE, related_name="delivery_log"
    )
    delivery_agent = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="delivery_logs"
    )
    start_time = models.DateTimeField()
    end_time = models.DateTimeField(null=True, blank=True)
    pickup_time = models.DateTimeField(null=True, blank=True)
    distance_km = models.DecimalField(
        max_digits=6, decimal_places=2, help_text="Actual distance traveled in km"
    )
    total_time_minutes = models.IntegerField(
        null=True, blank=True, help_text="Total delivery time in minutes"
    )
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default="in_progress"
    )
    notes = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"Log {self.log_id} - Order {self.order.order_id}"

    def save(self, *args, **kwargs):
        # Auto-calculate total time if end_time is set
        if self.end_time and self.start_time:
            delta = self.end_time - self.start_time
            self.total_time_minutes = int(delta.total_seconds() / 60)
        super().save(*args, **kwargs)

    class Meta:
        db_table = "delivery_logs"
        ordering = ["-start_time"]
