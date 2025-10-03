from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
import uuid
import math


# Keep UserAddress for backward compatibility but mark as deprecated
class UserAddress(models.Model):
    """User saved addresses for delivery - DEPRECATED: Use apps.users.address_models.Address instead"""
    
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='addresses')
    label = models.CharField(max_length=100, help_text='Address label (e.g., Home, Work)')
    address_line1 = models.CharField(max_length=200)
    address_line2 = models.CharField(max_length=200, blank=True, null=True)
    city = models.CharField(max_length=100)
    pincode = models.CharField(max_length=20)
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    is_default = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.user.username} - {self.label}"
    
    class Meta:
        db_table = 'user_addresses'
        unique_together = ['user', 'label']


class Order(models.Model):
    """Complete Order Management System"""
    
    ORDER_STATUS_CHOICES = [
        ('cart', 'Cart'),
        ('pending', 'Pending Payment'),
        ('confirmed', 'Confirmed'),
        ('preparing', 'Preparing'),
        ('ready', 'Ready for Pickup'),
        ('out_for_delivery', 'Out for Delivery'),
        ('delivered', 'Delivered'),
        ('cancelled', 'Cancelled'),
        ('refunded', 'Refunded'),
    ]
    
    PAYMENT_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('paid', 'Paid'),
        ('failed', 'Failed'),
        ('refunded', 'Refunded'),
        ('partial_refund', 'Partial Refund'),
    ]
    
    PAYMENT_METHOD_CHOICES = [
        ('cash', 'Cash on Delivery'),
        # ('card', 'Credit/Debit Card'),
        # ('online', 'Online Payment'),
        # ('wallet', 'Digital Wallet'),
    ]
    
    # Order Identification
    order_number = models.CharField(max_length=50, unique=True, db_index=True)
    
    # User Relations
    customer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='orders')
    chef = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='chef_orders')
    delivery_partner = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='delivery_orders'
    )
    
    # Order Status
    status = models.CharField(max_length=20, choices=ORDER_STATUS_CHOICES, default='cart', db_index=True)
    payment_status = models.CharField(max_length=20, choices=PAYMENT_STATUS_CHOICES, default='pending')
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES, null=True, blank=True)
    
    # Financial Information
    subtotal = models.DecimalField(max_digits=10, decimal_places=2, default=0.00, validators=[MinValueValidator(0)])
    tax_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    delivery_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00, validators=[MinValueValidator(0)])
    
    # Delivery Information
    delivery_address = models.TextField(default='No address provided')  # Keep for backward compatibility
    delivery_address_ref = models.ForeignKey(UserAddress, on_delete=models.SET_NULL, null=True, blank=True, related_name='orders')  # Deprecated
    
    # New address system - reference to apps.users.address_models.Address
    delivery_address_new = models.ForeignKey(
        'users.Address', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='delivery_orders',
        help_text='New address system reference'
    )
    
    delivery_instructions = models.TextField(blank=True)
    delivery_latitude = models.DecimalField(max_digits=10, decimal_places=8, null=True, blank=True)
    delivery_longitude = models.DecimalField(max_digits=11, decimal_places=8, null=True, blank=True)
    distance_km = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True, help_text='Distance from kitchen to delivery address in km')
    promo_code = models.CharField(max_length=50, null=True, blank=True)
    
    # Kitchen location reference
    kitchen_location = models.ForeignKey(
        'users.Address',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='kitchen_orders',
        help_text='Kitchen location for this order'
    )
    
    # Timing
    estimated_delivery_time = models.DateTimeField(null=True, blank=True)
    actual_delivery_time = models.DateTimeField(null=True, blank=True)
    preparation_time = models.PositiveIntegerField(help_text='Expected preparation time in minutes', null=True, blank=True)
    
    # Order Notes
    customer_notes = models.TextField(blank=True, help_text='Special instructions from customer')
    chef_notes = models.TextField(blank=True, help_text='Notes from chef')
    admin_notes = models.TextField(blank=True, help_text='Internal admin notes')
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)
    confirmed_at = models.DateTimeField(null=True, blank=True)
    cancelled_at = models.DateTimeField(null=True, blank=True)
    
    def save(self, *args, **kwargs):
        if not self.order_number:
            self.order_number = self.generate_order_number()
        super().save(*args, **kwargs)
    
    def generate_order_number(self):
        """Generate unique order number"""
        return f"ORD-{uuid.uuid4().hex[:8].upper()}"
    
    @property
    def total_items(self):
        return sum(item.quantity for item in self.items.all())
    
    @property
    def is_paid(self):
        return self.payment_status == 'paid'
    
    @property
    def can_be_cancelled(self):
        return self.status in ['cart', 'pending', 'confirmed']
    
    def calculate_delivery_fee(self, distance_km):
        """Calculate delivery fee based on distance"""
        if distance_km <= 5.0:
            return 50.00
        else:
            extra_km = math.ceil(distance_km - 5.0)
            return 50.00 + (extra_km * 15.00)
    
    def calculate_tax(self, subtotal):
        """Calculate 10% tax on subtotal"""
        return round(subtotal * 0.10, 2)
    
    # New address system helper methods
    def get_delivery_address(self):
        """Get delivery address - prioritize new address system"""
        if self.delivery_address_new:
            return self.delivery_address_new
        elif self.delivery_address_ref:
            return self.delivery_address_ref
        return None
    
    def get_delivery_coordinates(self):
        """Get delivery coordinates from address"""
        address = self.get_delivery_address()
        if address and hasattr(address, 'latitude') and hasattr(address, 'longitude'):
            return address.latitude, address.longitude
        return self.delivery_latitude, self.delivery_longitude
    
    def get_kitchen_coordinates(self):
        """Get kitchen coordinates"""
        if self.kitchen_location:
            return self.kitchen_location.latitude, self.kitchen_location.longitude
        # Fallback to chef's default kitchen
        if hasattr(self.chef, 'chef_profile'):
            kitchen = self.chef.chef_profile.get_kitchen_location()
            if kitchen and kitchen.address:
                return kitchen.address.latitude, kitchen.address.longitude
        return None, None
    
    def calculate_distance(self):
        """Calculate distance between kitchen and delivery location"""
        kitchen_lat, kitchen_lng = self.get_kitchen_coordinates()
        delivery_lat, delivery_lng = self.get_delivery_coordinates()
        
        if all([kitchen_lat, kitchen_lng, delivery_lat, delivery_lng]):
            # Simple haversine formula for distance calculation
            from math import radians, cos, sin, asin, sqrt
            
            # Convert to radians
            lat1, lng1, lat2, lng2 = map(radians, [float(kitchen_lat), float(kitchen_lng), 
                                                   float(delivery_lat), float(delivery_lng)])
            
            # Haversine formula
            dlat = lat2 - lat1
            dlng = lng2 - lng1
            a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlng/2)**2
            distance_km = 2 * asin(sqrt(a)) * 6371  # Earth radius in km
            
            return round(distance_km, 2)
        return None
    
    def set_delivery_address(self, address):
        """Set delivery address using new address system"""
        if hasattr(address, 'address_type'):  # New Address model
            self.delivery_address_new = address
            if address.latitude and address.longitude:
                self.delivery_latitude = address.latitude
                self.delivery_longitude = address.longitude
            # Update text address for backward compatibility
            self.delivery_address = address.full_address
        else:  # Old UserAddress model
            self.delivery_address_ref = address
            if address.latitude and address.longitude:
                self.delivery_latitude = address.latitude
                self.delivery_longitude = address.longitude
    
    def __str__(self):
        return f"Order {self.order_number} - {self.customer.username}"
    
    class Meta:
        db_table = 'orders'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['customer', 'status']),
            models.Index(fields=['chef', 'status']),
            models.Index(fields=['order_number']),
            models.Index(fields=['created_at']),
        ]


class OrderItem(models.Model):
    """Items in an order - updated to use FoodPrice as per SQL schema"""
    
    order_item_id = models.AutoField(primary_key=True)
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    price = models.ForeignKey('food.FoodPrice', on_delete=models.CASCADE, related_name='order_items')
    quantity = models.IntegerField(validators=[MinValueValidator(1)])
    
    # Keep existing fields for enhanced functionality
    unit_price = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)], null=True, blank=True)
    total_price = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)], null=True, blank=True)
    special_instructions = models.TextField(blank=True, help_text='Special cooking instructions')
    
    # Snapshot of food details at time of order
    food_name = models.CharField(max_length=200, help_text='Food name at time of order', blank=True)
    food_description = models.TextField(help_text='Food description at time of order', blank=True)
    
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
        db_table = 'OrderItem'
        unique_together = ['order', 'price']


class OrderStatusHistory(models.Model):
    """Track order status changes"""
    
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='status_history')
    status = models.CharField(max_length=20, choices=Order.ORDER_STATUS_CHOICES)
    changed_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Order {self.order.order_number} - {self.get_status_display()}"
    
    class Meta:
        db_table = 'order_status_history'
        ordering = ['-created_at']


class CartItem(models.Model):
    """Shopping cart for customers - updated to use FoodPrice"""
    
    customer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='cart_items')
    price = models.ForeignKey('food.FoodPrice', on_delete=models.CASCADE, related_name='cart_items')
    quantity = models.PositiveIntegerField(validators=[MinValueValidator(1)])
    special_instructions = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    @property
    def total_price(self):
        return self.quantity * self.price.price if self.price else 0
    
    def __str__(self):
        food_name = self.price.food.name if self.price else 'Unknown Food'
        size = self.price.size if self.price else 'Unknown Size'
        return f"{self.customer.username} - {self.quantity}x {food_name} ({size})"
    
    class Meta:
        db_table = 'cart_items'
        unique_together = ['customer', 'price']


class Delivery(models.Model):
    """Delivery tracking model based on SQL schema"""
    STATUS_CHOICES = [
        ('Pending', 'Pending'),
        ('On the way', 'On the way'),
        ('Delivered', 'Delivered'),
    ]
    
    delivery_id = models.AutoField(primary_key=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Pending')
    delivery_time = models.DateTimeField(null=True, blank=True)
    address = models.TextField()
    order = models.OneToOneField(Order, on_delete=models.CASCADE)
    agent = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='deliveries'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Delivery {self.delivery_id} - {self.status}"
    
    class Meta:
        db_table = 'Delivery'
        ordering = ['-created_at']


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
        related_name='delivery_reviews'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Delivery Review by {self.customer.name} - {self.rating}/5"
    
    class Meta:
        db_table = 'DeliveryReview'
        ordering = ['-created_at']


class BulkOrder(models.Model):
    """Bulk Order model based on existing database table"""
    bulk_order_id = models.AutoField(primary_key=True)
    status = models.CharField(max_length=20)
    total_quantity = models.PositiveIntegerField()
    description = models.TextField(blank=True, null=True)
    deadline = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField()
    updated_at = models.DateTimeField()
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.DO_NOTHING,
        related_name='created_bulk_orders'
    )
    order = models.OneToOneField(
        Order,
        on_delete=models.DO_NOTHING,
        related_name='bulk_order'
    )
    
    def __str__(self):
        return f"Bulk Order #{self.bulk_order_id} - {self.status}"
    
    class Meta:
        managed = True  # Allow Django to manage this table
        db_table = 'bulk_orders'
        ordering = ['-created_at']


class BulkOrderAssignment(models.Model):
    """Bulk Order Assignment model based on existing database table"""
    id = models.BigAutoField(primary_key=True)
    bulk_order = models.ForeignKey(
        BulkOrder,
        on_delete=models.DO_NOTHING,
        related_name='assignments'
    )
    chef = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.DO_NOTHING,
        related_name='bulk_order_assignments'
    )
    
    def __str__(self):
        return f"Assignment: Chef {self.chef.username} -> Bulk Order #{self.bulk_order.bulk_order_id}"
    
    class Meta:
        managed = True
        db_table = 'bulk_order_assignments'
        unique_together = (('bulk_order', 'chef'),)