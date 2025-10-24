from django.contrib import admin
from .models import Cuisine, FoodCategory, Food, FoodPrice, Offer, FoodReview, BulkMenu, BulkMenuItem


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


class BulkMenuItemInline(admin.TabularInline):
    """Inline admin for bulk menu items"""
    model = BulkMenuItem
    extra = 1
    fields = ['item_name', 'description', 'is_optional', 'extra_cost', 'sort_order', 'is_vegetarian', 'spice_level']
    ordering = ['sort_order', 'item_name']


@admin.register(BulkMenu)
class BulkMenuAdmin(admin.ModelAdmin):
    list_display = ['menu_name', 'chef', 'meal_type', 'base_price_per_person', 'approval_status', 'availability_status', 'min_persons', 'max_persons', 'created_at']
    list_filter = ['approval_status', 'availability_status', 'meal_type', 'created_at']
    search_fields = ['menu_name', 'chef__username', 'description']
    readonly_fields = ['created_at', 'updated_at', 'approved_at']
    list_editable = ['approval_status', 'availability_status']
    inlines = [BulkMenuItemInline]
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('chef', 'menu_name', 'meal_type', 'description', 'image')
        }),
        ('Pricing & Capacity', {
            'fields': ('base_price_per_person', 'min_persons', 'max_persons', 'advance_notice_hours')
        }),
        ('Status & Availability', {
            'fields': ('approval_status', 'availability_status', 'approved_by', 'approved_at')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        # Show pending items first for admin attention
        return qs.order_by('-created_at')
    
    actions = ['approve_menus', 'reject_menus', 'make_available', 'make_unavailable']
    
    def approve_menus(self, request, queryset):
        from django.utils import timezone
        updated = queryset.update(
            approval_status='approved',
            approved_by=request.user,
            approved_at=timezone.now()
        )
        self.message_user(request, f'{updated} bulk menu(s) approved successfully.')
    approve_menus.short_description = "Approve selected bulk menus"
    
    def reject_menus(self, request, queryset):
        from django.utils import timezone
        updated = queryset.update(
            approval_status='rejected',
            approved_by=request.user,
            approved_at=timezone.now()
        )
        self.message_user(request, f'{updated} bulk menu(s) rejected.')
    reject_menus.short_description = "Reject selected bulk menus"
    
    def make_available(self, request, queryset):
        updated = queryset.update(availability_status=True)
        self.message_user(request, f'{updated} bulk menu(s) marked as available.')
    make_available.short_description = "Mark as available"
    
    def make_unavailable(self, request, queryset):
        updated = queryset.update(availability_status=False)
        self.message_user(request, f'{updated} bulk menu(s) marked as unavailable.')
    make_unavailable.short_description = "Mark as unavailable"


@admin.register(BulkMenuItem)
class BulkMenuItemAdmin(admin.ModelAdmin):
    list_display = ['item_name', 'bulk_menu', 'is_optional', 'extra_cost', 'sort_order', 'is_vegetarian', 'spice_level']
    list_filter = ['is_optional', 'is_vegetarian', 'spice_level']
    search_fields = ['item_name', 'bulk_menu__menu_name', 'description']
    list_editable = ['is_optional', 'extra_cost', 'sort_order']
    ordering = ['bulk_menu', 'sort_order', 'item_name']
