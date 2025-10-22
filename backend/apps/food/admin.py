from django.contrib import admin
from .models import Cuisine, FoodCategory, Food, FoodPrice, Offer, FoodReview


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
    list_filter = ['status', 'is_available', 'is_featured', 'created_at', 'chef']
    search_fields = ['name', 'chef__username', 'admin__username', 'description']
    readonly_fields = ['food_id', 'created_at', 'updated_at']
    list_editable = ['status', 'is_available']
    
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        # Show pending items first for admin attention
        return qs.order_by('-status', '-created_at')
    
    actions = ['approve_foods', 'reject_foods']
    
    def approve_foods(self, request, queryset):
        updated = queryset.update(status='Approved', admin=request.user)
        self.message_user(request, f'{updated} food item(s) approved successfully.')
    approve_foods.short_description = "Approve selected food items"
    
    def reject_foods(self, request, queryset):
        updated = queryset.update(status='Rejected', admin=request.user)
        self.message_user(request, f'{updated} food item(s) rejected.')
    reject_foods.short_description = "Reject selected food items"


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
