from django.contrib import admin
from .models import Cuisine, FoodCategory, Food, FoodImage, FoodPrice, Offer, FoodReview


@admin.register(Cuisine)
class CuisineAdmin(admin.ModelAdmin):
    list_display = ['name', 'is_active', 'sort_order']
    list_filter = ['is_active']
    search_fields = ['name']


@admin.register(FoodCategory)
class FoodCategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'cuisine', 'is_active', 'sort_order']
    list_filter = ['cuisine', 'is_active']
    search_fields = ['name', 'cuisine__name']


@admin.register(Food)
class FoodAdmin(admin.ModelAdmin):
    list_display = ['name', 'status', 'chef', 'admin', 'is_available', 'created_at']
    list_filter = ['status', 'is_available', 'is_featured', 'created_at']
    search_fields = ['name', 'chef__name', 'admin__name']
    readonly_fields = ['food_id', 'created_at', 'updated_at']


@admin.register(FoodImage)
class FoodImageAdmin(admin.ModelAdmin):
    list_display = ['food', 'is_primary', 'sort_order', 'created_at']
    list_filter = ['is_primary', 'created_at']


@admin.register(FoodPrice)
class FoodPriceAdmin(admin.ModelAdmin):
    list_display = ['food', 'size', 'price', 'cook', 'created_at']
    list_filter = ['size', 'created_at']
    search_fields = ['food__name', 'cook__name']


@admin.register(Offer)
class OfferAdmin(admin.ModelAdmin):
    list_display = ['price', 'discount', 'valid_until', 'created_at']
    list_filter = ['valid_until', 'created_at']
    search_fields = ['price__food__name']


@admin.register(FoodReview)
class FoodReviewAdmin(admin.ModelAdmin):
    list_display = ['price', 'customer', 'rating', 'created_at']
    list_filter = ['rating', 'created_at']
    search_fields = ['price__food__name', 'customer__name']
