from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
import uuid


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
        ('card', 'Credit/Debit Card'),
        ('online', 'Online Payment'),
        ('wallet', 'Digital Wallet'),
    ]
    
    ORDER_TYPE_CHOICES = [
        ('regular', 'Regular Order'),
        ('bulk', 'Bulk Order'),
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
    
    # Order Type and Multi-Chef Assignment
    order_type = models.CharField(max_length=10, choices=ORDER_TYPE_CHOICES, default='regular', db_index=True)
    assigned_chefs = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        through='OrderChefAssignment',
        related_name='assigned_orders',
        blank=True,
        help_text='Multiple chefs can be assigned to bulk orders'
    )    # Order Status
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
    delivery_address = models.TextField(default='No address provided')
    delivery_instructions = models.TextField(blank=True)
    delivery_latitude = models.DecimalField(max_digits=10, decimal_places=8, null=True, blank=True)
    delivery_longitude = models.DecimalField(max_digits=11, decimal_places=8, null=True, blank=True)
    
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
        
        # Auto-determine order type based on quantity if not already set
        if self.pk:  # Only for existing orders with items
            self.auto_assign_order_type()
            
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
    
    @property
    def is_bulk_order(self):
        """Check if order qualifies as bulk (>5 total items)"""
        return self.total_items > 5
    
    @property
    def needs_chef_assignment(self):
        """Check if bulk order needs chef assignment"""
        return self.order_type == 'bulk' and self.status == 'confirmed'
    
    def auto_assign_order_type(self):
        """Automatically determine and set order type based on quantity"""
        if self.total_items > 5:
            self.order_type = 'bulk'
        else:
            self.order_type = 'regular'
        
    def assign_chefs_for_bulk_order(self, chef_list):
        """Assign multiple chefs to a bulk order"""
        if self.order_type != 'bulk':
            return False
            
        items_per_chef = max(1, self.total_items // len(chef_list))
        
        for chef in chef_list:
            assignment, created = OrderChefAssignment.objects.get_or_create(
                order=self,
                chef=chef,
                defaults={'assigned_items_count': items_per_chef}
            )
        return True
    
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


class OrderChefAssignment(models.Model):
    """Through model for multi-chef assignment to bulk orders"""
    
    ASSIGNMENT_STATUS_CHOICES = [
        ('assigned', 'Assigned'),
        ('accepted', 'Accepted'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('declined', 'Declined'),
    ]
    
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='chef_assignments')
    chef = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='order_assignments')
    status = models.CharField(max_length=15, choices=ASSIGNMENT_STATUS_CHOICES, default='assigned')
    assigned_items_count = models.PositiveIntegerField(default=0, help_text='Number of items assigned to this chef')
    notes = models.TextField(blank=True, help_text='Assignment specific notes')
    
    assigned_at = models.DateTimeField(auto_now_add=True)
    accepted_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    def __str__(self):
        return f"Order {self.order.order_number} - Chef {self.chef.username} ({self.status})"
    
    class Meta:
        db_table = 'order_chef_assignments'
        unique_together = ['order', 'chef']
        ordering = ['-assigned_at']