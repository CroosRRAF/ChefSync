from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
from .cloudinary_fields import CloudinaryImageField   

class Cuisine(models.Model):
    """Cuisine categories (e.g., Italian, Chinese, Indian)"""
    
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    image = CloudinaryImageField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    sort_order = models.PositiveIntegerField(default=0)
    
    def __str__(self):
        return self.name
    
    class Meta:
        db_table = 'cuisines'
        ordering = ['sort_order', 'name']


class FoodCategory(models.Model):
    """Food categories within cuisines (e.g., Appetizers, Main Course)"""
    
    name = models.CharField(max_length=100)
    cuisine = models.ForeignKey(Cuisine, on_delete=models.CASCADE, related_name='categories')
    description = models.TextField(blank=True)
    image = CloudinaryImageField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    sort_order = models.PositiveIntegerField(default=0)
    
    def __str__(self):
        return f"{self.cuisine.name} - {self.name}"
    
    class Meta:
        db_table = 'food_categories'
        ordering = ['sort_order', 'name']
        unique_together = ['cuisine', 'name']


class Food(models.Model):
    """Food items offered by chefs - Admin controlled as per SQL schema"""
    
    STATUS_CHOICES = [
        ('Pending', 'Pending'),
        ('Approved', 'Approved'),
        ('Rejected', 'Rejected'),
    ]
    
    food_id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=100, null=False)
    category = models.CharField(max_length=50, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    image = CloudinaryImageField(
        blank=True, 
        null=True, 
        help_text='Primary food image - uploaded to Cloudinary'
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Pending')
    admin = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='approved_foods',
        null=True,
        blank=True,
        limit_choices_to={'is_staff': True}
    )
    
    # Keep existing fields for backward compatibility
    chef = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='foods', null=True, blank=True)
    food_category = models.ForeignKey(FoodCategory, on_delete=models.CASCADE, related_name='foods', null=True, blank=True)
    is_available = models.BooleanField(default=True)
    is_featured = models.BooleanField(default=False)
    preparation_time = models.PositiveIntegerField(help_text='Preparation time in minutes', null=True, blank=True)
    calories_per_serving = models.PositiveIntegerField(blank=True, null=True)
    ingredients = models.JSONField(default=list, blank=True)
    allergens = models.JSONField(default=list, blank=True)
    nutritional_info = models.JSONField(default=dict, blank=True)
    is_vegetarian = models.BooleanField(default=False)
    is_vegan = models.BooleanField(default=False)
    is_gluten_free = models.BooleanField(default=False)
    spice_level = models.CharField(max_length=20, choices=[
        ('mild', 'Mild'),
        ('medium', 'Medium'),
        ('hot', 'Hot'),
        ('very_hot', 'Very Hot'),
    ], blank=True, null=True)
    rating_average = models.DecimalField(max_digits=3, decimal_places=2, default=0.00)
    total_reviews = models.PositiveIntegerField(default=0)
    total_orders = models.PositiveIntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return self.name
    
    @property
    def is_approved(self):
        return self.status == 'Approved'
    
    @property
    def image_url(self):
        """Get the primary image URL from CloudinaryImageField"""
        if self.image:
            return str(self.image)
        return None
    
    @property
    def primary_image(self):
        """Alias for image_url for compatibility"""
        return self.image_url
    
    @property
    def optimized_image_url(self):
        """Get optimized image URL with fallback handling for both Cloudinary and external URLs"""
        if self.image:
            from utils.cloudinary_utils import get_reliable_image_url
            return get_reliable_image_url(str(self.image), width=400, height=300)
        return None
    
    @property
    def thumbnail_url(self):
        """Get thumbnail URL with fallback handling"""
        if self.image:
            from utils.cloudinary_utils import get_reliable_image_url
            return get_reliable_image_url(str(self.image), width=200, height=200)
        return None
    
    class Meta:
        db_table = 'Food'
        ordering = ['-created_at']


class FoodPrice(models.Model):
    """Food pricing with size variations as per SQL schema"""
    
    SIZE_CHOICES = [
        ('Small', 'Small'),
        ('Medium', 'Medium'),
        ('Large', 'Large'),
    ]
    
    price_id = models.AutoField(primary_key=True)
    size = models.CharField(max_length=10, choices=SIZE_CHOICES)
    price = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0.01)])
    preparation_time = models.PositiveIntegerField(help_text='Preparation time in minutes for this size', default=15)
    image_url = models.CharField(max_length=255, blank=True, null=True)
    food = models.ForeignKey(Food, on_delete=models.CASCADE, related_name='prices')
    cook = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='food_prices'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.food.name} - {self.size} (${self.price})"
    
    class Meta:
        db_table = 'FoodPrice'
        ordering = ['food', 'size']
        unique_together = ['food', 'size', 'cook']


class Offer(models.Model):
    """Offers/discounts for food prices based on SQL schema"""
    offer_id = models.AutoField(primary_key=True)
    description = models.TextField()
    discount = models.DecimalField(max_digits=5, decimal_places=2)
    valid_until = models.DateField()
    price = models.ForeignKey(FoodPrice, on_delete=models.CASCADE, related_name='offers')
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Offer for {self.price.food.name}: {self.discount}% off"
    
    class Meta:
        db_table = 'Offer'
        ordering = ['-created_at']


class FoodReview(models.Model):
    """Customer reviews for food prices as per SQL schema"""
    
    review_id = models.AutoField(primary_key=True)
    rating = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    comment = models.TextField(blank=True, null=True)
    price = models.ForeignKey(FoodPrice, on_delete=models.CASCADE, related_name='reviews')
    customer = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='food_reviews'
    )
    
    # Keep existing fields for enhanced functionality
    order = models.ForeignKey('orders.Order', on_delete=models.CASCADE, related_name='food_reviews', null=True, blank=True)
    taste_rating = models.PositiveIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        blank=True, null=True
    )
    presentation_rating = models.PositiveIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        blank=True, null=True
    )
    value_rating = models.PositiveIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        blank=True, null=True
    )
    is_verified_purchase = models.BooleanField(default=True)
    helpful_votes = models.PositiveIntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Review by {self.customer.username} for {self.price.food.name}"
    
    class Meta:
        db_table = 'FoodReview'
        ordering = ['-created_at']
        unique_together = ['customer', 'price', 'order']


class BulkMealType(models.TextChoices):
    """Meal type choices for bulk menus"""
    BREAKFAST = 'breakfast', 'Breakfast'
    LUNCH = 'lunch', 'Lunch'
    DINNER = 'dinner', 'Dinner'
    SNACKS = 'snacks', 'Snacks'


class BulkMenu(models.Model):
    """Bulk menu management for chefs"""
    
    APPROVAL_STATUS_CHOICES = [
        ('pending', 'Pending Approval'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]
    
    chef = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='bulk_menus',
        limit_choices_to={'role': 'cook'}
    )
    meal_type = models.CharField(max_length=20, choices=BulkMealType.choices)
    menu_name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    base_price_per_person = models.DecimalField(
        max_digits=8, 
        decimal_places=2,
        validators=[MinValueValidator(0.01)],
        help_text="Base price per person in rupees"
    )
    availability_status = models.BooleanField(default=True)
    approval_status = models.CharField(
        max_length=20, 
        choices=APPROVAL_STATUS_CHOICES, 
        default='pending'
    )
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='approved_bulk_menus',
        limit_choices_to={'is_staff': True}
    )
    approved_at = models.DateTimeField(null=True, blank=True)
    rejection_reason = models.TextField(blank=True, null=True)
    
    # Additional metadata
    min_persons = models.PositiveIntegerField(
        default=10,
        help_text="Minimum number of persons for this bulk menu"
    )
    max_persons = models.PositiveIntegerField(
        default=100,
        help_text="Maximum number of persons for this bulk menu"
    )
    advance_notice_hours = models.PositiveIntegerField(
        default=24,
        help_text="Hours of advance notice required for ordering"
    )
    
    # Image fields
    image = CloudinaryImageField(
        blank=True, 
        null=True,
        help_text="Main image for the bulk menu"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.chef.username} - {self.menu_name} ({self.get_meal_type_display()})"
    
    @property
    def is_approved(self):
        return self.approval_status == 'approved'
    
    @property
    def is_available(self):
        return self.availability_status and self.is_approved
    
    def calculate_total_cost(self, num_persons):
        """Calculate total cost for given number of persons including optional items"""
        from decimal import Decimal
        
        if not self.items.exists():
            return self.base_price_per_person * Decimal(str(num_persons))
        
        optional_cost = sum(item.extra_cost for item in self.items.filter(is_optional=True))
        return (self.base_price_per_person + optional_cost) * Decimal(str(num_persons))
    
    def get_menu_items_summary(self):
        """Get a summary of menu items"""
        items = self.items.all()
        mandatory_items = [item.item_name for item in items if not item.is_optional]
        optional_items = [f"{item.item_name} (+₹{item.extra_cost})" for item in items if item.is_optional]
        
        return {
            'mandatory_items': mandatory_items,
            'optional_items': optional_items,
            'total_items': items.count()
        }
    
    def get_image_url(self):
        """Get optimized Cloudinary URL for the main image"""
        if self.image:
            from utils.cloudinary_utils import get_optimized_url
            return get_optimized_url(str(self.image))
        return None
    
    def get_thumbnail_url(self):
        """Get thumbnail version of the main image"""
        if self.image:
            from utils.cloudinary_utils import get_optimized_url
            return get_optimized_url(str(self.image), width=300, height=200)
        return None
    
    class Meta:
        db_table = 'bulk_menus'
        ordering = ['-created_at']
        unique_together = ['chef', 'meal_type', 'menu_name']
        indexes = [
            models.Index(fields=['meal_type', 'approval_status']),
            models.Index(fields=['chef', 'availability_status']),
        ]


class BulkMenuItem(models.Model):
    """Individual items within a bulk menu"""
    
    bulk_menu = models.ForeignKey(
        BulkMenu, 
        on_delete=models.CASCADE, 
        related_name='items'
    )
    item_name = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    is_optional = models.BooleanField(
        default=False,
        help_text="Whether this item is optional (customers can choose to add)"
    )
    extra_cost = models.DecimalField(
        max_digits=8, 
        decimal_places=2, 
        default=0.00,
        validators=[MinValueValidator(0)],
        help_text="Additional cost if this item is selected (for optional items)"
    )
    sort_order = models.PositiveIntegerField(default=0)
    
    # Nutritional and dietary information
    is_vegetarian = models.BooleanField(default=False)
    spice_level = models.CharField(
        max_length=20, 
        choices=[
            ('mild', 'Mild'),
            ('medium', 'Medium'),
            ('hot', 'Hot'),
            ('very_hot', 'Very Hot'),
        ], 
        blank=True, 
        null=True
    )
    allergens = models.JSONField(default=list, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        optional_text = " (Optional)" if self.is_optional else ""
        cost_text = f" +₹{self.extra_cost}" if self.extra_cost > 0 else ""
        return f"{self.item_name}{optional_text}{cost_text}"
    
    def clean(self):
        """Validate bulk menu item"""
        from django.core.exceptions import ValidationError
        
        # If item is not optional, extra_cost should be 0
        if not self.is_optional and self.extra_cost > 0:
            raise ValidationError(
                "Mandatory items should not have extra cost. Set is_optional=True for items with extra cost."
            )
    
    def save(self, *args, **kwargs):
        """Custom save to run validation"""
        self.full_clean()
        super().save(*args, **kwargs)
    
    class Meta:
        db_table = 'bulk_menu_items'
        ordering = ['sort_order', 'item_name']
        unique_together = ['bulk_menu', 'item_name']


