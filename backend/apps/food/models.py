from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
from apps.users.fields import LongBlobImageField   

class Cuisine(models.Model):
    """Cuisine categories (e.g., Italian, Chinese, Indian)"""
    
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    image = LongBlobImageField(blank=True, null=True)
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
    image = LongBlobImageField(blank=True, null=True)
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
    image = LongBlobImageField(blank=True, null=True, help_text='Food image')
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


class FoodImage(models.Model):
    """Images for food items using Cloudinary URLs"""
    
    food = models.ForeignKey(Food, on_delete=models.CASCADE, related_name='images')
    image_url = models.URLField(max_length=500, blank=True, null=True, help_text="Cloudinary URL for the main image")
    thumbnail_url = models.URLField(max_length=500, blank=True, null=True, help_text="Cloudinary URL for thumbnail")
    cloudinary_public_id = models.CharField(max_length=200, blank=True, help_text="Cloudinary public ID for management")
    caption = models.CharField(max_length=200, blank=True)
    is_primary = models.BooleanField(default=False)
    sort_order = models.PositiveIntegerField(default=0)
    alt_text = models.CharField(max_length=100, blank=True, help_text="Alt text for accessibility")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Image for {self.food.name}"
    
    @property
    def optimized_url(self):
        """Get optimized Cloudinary URL"""
        if self.image_url and 'cloudinary.com' in self.image_url:
            from .cloudinary_utils import get_optimized_url
            return get_optimized_url(self.image_url)
        return self.image_url
    
    @property
    def thumbnail(self):
        """Get thumbnail URL, generate if not exists"""
        if self.thumbnail_url:
            return self.thumbnail_url
        elif self.image_url and 'cloudinary.com' in self.image_url:
            from .cloudinary_utils import get_optimized_url
            return get_optimized_url(self.image_url, width=200, height=200, crop='fill')
        return self.image_url
    
    class Meta:
        db_table = 'food_images'
        ordering = ['sort_order', 'created_at']


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


