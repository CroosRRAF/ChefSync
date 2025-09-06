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
    """Food items offered by chefs"""
    
    chef = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='foods')
    name = models.CharField(max_length=200)
    description = models.TextField()
    category = models.ForeignKey(FoodCategory, on_delete=models.CASCADE, related_name='foods')
    price = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0.01)])
    original_price = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    is_available = models.BooleanField(default=True)
    is_featured = models.BooleanField(default=False)
    preparation_time = models.PositiveIntegerField(help_text='Preparation time in minutes')
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
        return f"{self.name} by {self.chef.username}"
    
    @property
    def discount_percentage(self):
        if self.original_price and self.original_price > self.price:
            return round(((self.original_price - self.price) / self.original_price) * 100, 2)
        return 0
    
    class Meta:
        db_table = 'foods'
        ordering = ['-created_at']
        unique_together = ['chef', 'name']


class FoodImage(models.Model):
    """Images for food items"""
    
    food = models.ForeignKey(Food, on_delete=models.CASCADE, related_name='images')
    image = LongBlobImageField()
    thumbnail = LongBlobImageField(blank=True, null=True)
    caption = models.CharField(max_length=200, blank=True)
    is_primary = models.BooleanField(default=False)
    sort_order = models.PositiveIntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Image for {self.food.name}"
    
    class Meta:
        db_table = 'food_images'
        ordering = ['sort_order', 'created_at']


class FoodReview(models.Model):
    """Customer reviews for food items"""
    
    food = models.ForeignKey(Food, on_delete=models.CASCADE, related_name='reviews')
    customer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='food_reviews')
    order = models.ForeignKey('orders.Order', on_delete=models.CASCADE, related_name='food_reviews')
    
    overall_rating = models.PositiveIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        help_text='Overall rating from 1 to 5'
    )
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
    comment = models.TextField(blank=True)
    is_verified_purchase = models.BooleanField(default=True)
    helpful_votes = models.PositiveIntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Review by {self.customer.username} for {self.food.name}"
    
    class Meta:
        db_table = 'food_reviews'
        ordering = ['-created_at']
        unique_together = ['customer', 'food', 'order']