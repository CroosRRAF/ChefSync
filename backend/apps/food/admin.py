from django.contrib import admin
from django.utils.html import format_html
from django.utils import timezone
from .models import Cuisine, FoodCategory, Food, FoodImage, FoodPrice, Offer, FoodReview, BulkMenu, BulkMenuItem


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


class BulkMenuItemInline(admin.TabularInline):
    """Inline admin for bulk menu items"""
    model = BulkMenuItem
    extra = 1
    fields = ['item_name', 'description', 'is_optional', 'extra_cost', 'sort_order', 'is_vegetarian', 'is_vegan', 'spice_level']
    ordering = ['sort_order', 'item_name']


@admin.register(BulkMenu)
class BulkMenuAdmin(admin.ModelAdmin):
    """Admin interface for bulk menu management"""
    
    list_display = [
        'menu_name', 'chef', 'meal_type', 'base_price_per_person', 
        'approval_status_badge', 'availability_status', 'items_count', 'created_at'
    ]
    list_filter = [
        'meal_type', 'approval_status', 'availability_status', 'created_at',
        'chef', 'approved_by'
    ]
    search_fields = [
        'menu_name', 'chef__username', 'chef__name', 'description'
    ]
    readonly_fields = [
        'id', 'chef', 'created_at', 'updated_at', 'approved_at'
    ]
    list_editable = ['availability_status']
    inlines = [BulkMenuItemInline]
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('chef', 'meal_type', 'menu_name', 'description')
        }),
        ('Pricing & Capacity', {
            'fields': ('base_price_per_person', 'min_persons', 'max_persons', 'advance_notice_hours')
        }),
        ('Status & Approval', {
            'fields': ('availability_status', 'approval_status', 'approved_by', 'approved_at', 'rejection_reason')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )
    
    def get_queryset(self, request):
        """Optimize queryset with related objects"""
        qs = super().get_queryset(request)
        return qs.select_related('chef', 'approved_by').prefetch_related('items')
    
    def approval_status_badge(self, obj):
        """Display approval status with colored badge"""
        colors = {
            'pending': '#ffc107',
            'approved': '#28a745',
            'rejected': '#dc3545'
        }
        color = colors.get(obj.approval_status, '#6c757d')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 8px; '
            'border-radius: 3px; font-size: 11px; font-weight: bold;">{}</span>',
            color,
            obj.get_approval_status_display()
        )
    approval_status_badge.short_description = 'Approval Status'
    
    def items_count(self, obj):
        """Display number of items in the menu"""
        return obj.items.count()
    items_count.short_description = 'Items'
    
    def get_list_display(self, request):
        """Customize list display based on user permissions"""
        list_display = list(self.list_display)
        if not request.user.is_superuser:
            # Remove chef column for non-superusers to save space
            if 'chef' in list_display:
                list_display.remove('chef')
        return list_display
    
    # Custom actions for bulk approval/rejection
    actions = ['approve_menus', 'reject_menus', 'toggle_availability']
    
    def approve_menus(self, request, queryset):
        """Approve selected bulk menus"""
        queryset = queryset.filter(approval_status__in=['pending', 'rejected'])
        updated = queryset.update(
            approval_status='approved',
            approved_by=request.user,
            approved_at=timezone.now(),
            rejection_reason=''
        )
        self.message_user(request, f'{updated} bulk menu(s) approved successfully.')
    approve_menus.short_description = "Approve selected bulk menus"
    
    def reject_menus(self, request, queryset):
        """Reject selected bulk menus"""
        queryset = queryset.filter(approval_status__in=['pending', 'approved'])
        updated = queryset.update(
            approval_status='rejected',
            approved_by=None,
            approved_at=None
        )
        self.message_user(request, f'{updated} bulk menu(s) rejected.')
    reject_menus.short_description = "Reject selected bulk menus"
    
    def toggle_availability(self, request, queryset):
        """Toggle availability status for selected menus"""
        for menu in queryset:
            menu.availability_status = not menu.availability_status
            menu.save()
        self.message_user(request, f'Availability status toggled for {queryset.count()} menu(s).')
    toggle_availability.short_description = "Toggle availability status"


@admin.register(BulkMenuItem)
class BulkMenuItemAdmin(admin.ModelAdmin):
    """Admin interface for bulk menu items"""
    
    list_display = [
        'item_name', 'bulk_menu', 'meal_type', 'is_optional', 'extra_cost',
        'is_vegetarian', 'is_vegan', 'spice_level', 'sort_order'
    ]
    list_filter = [
        'bulk_menu__meal_type', 'is_optional', 'is_vegetarian', 'is_vegan', 
        'is_gluten_free', 'spice_level', 'bulk_menu__chef'
    ]
    search_fields = [
        'item_name', 'description', 'bulk_menu__menu_name', 
        'bulk_menu__chef__username'
    ]
    list_editable = ['is_optional', 'extra_cost', 'sort_order']
    ordering = ['bulk_menu', 'sort_order', 'item_name']
    
    def meal_type(self, obj):
        """Display meal type of the parent menu"""
        return obj.bulk_menu.get_meal_type_display()
    meal_type.short_description = 'Meal Type'
    
    def get_queryset(self, request):
        """Optimize queryset with related objects"""
        qs = super().get_queryset(request)
        return qs.select_related('bulk_menu', 'bulk_menu__chef')
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('bulk_menu', 'item_name', 'description', 'sort_order')
        }),
        ('Pricing', {
            'fields': ('is_optional', 'extra_cost')
        }),
        ('Dietary Information', {
            'fields': ('is_vegetarian', 'is_vegan', 'is_gluten_free', 'spice_level', 'allergens'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )
    search_fields = ['price__food__name', 'customer__name']
