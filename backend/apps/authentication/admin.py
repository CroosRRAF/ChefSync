from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, Customer, Cook, DeliveryAgent


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    """
    Custom admin configuration for User model
    """
    list_display = ('user_id', 'name', 'email', 'phone_no', 'role', 'address', 'created_at', 'is_active', 'is_staff')
    list_filter = ('role', 'is_staff', 'is_active', 'created_at', 'groups')
    search_fields = ('name', 'email', 'phone_no', 'address')
    ordering = ('-created_at',)
    
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal info', {'fields': ('name', 'phone_no', 'address', 'role', 'profile_image')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Important dates', {'fields': ('last_login', 'created_at')}),
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'name', 'role', 'address', 'password1', 'password2'),
        }),
    )
    
    readonly_fields = ('user_id', 'created_at')
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related()


@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    """
    Admin configuration for Customer model
    """
    list_display = ('user_id', 'user_name', 'user_email', 'user_phone')
    search_fields = ('user__name', 'user__email', 'user__phone_no')
    ordering = ('user_id',)
    
    def user_name(self, obj):
        return obj.user.name
    user_name.short_description = 'Name'
    
    def user_email(self, obj):
        return obj.user.email
    user_email.short_description = 'Email'
    
    def user_phone(self, obj):
        return obj.user.phone_no
    user_phone.short_description = 'Phone'


@admin.register(Cook)
class CookAdmin(admin.ModelAdmin):
    """
    Admin configuration for Cook model
    """
    list_display = ('user_id', 'user_name', 'specialty', 'kitchen_location', 'experience_years', 'rating_avg', 'availability_hours')
    list_filter = ('specialty', 'experience_years', 'rating_avg')
    search_fields = ('user__name', 'specialty', 'kitchen_location')
    ordering = ('user_id',)
    
    fieldsets = (
        ('User Info', {'fields': ('user',)}),
        ('Cook Details', {'fields': ('specialty', 'kitchen_location', 'experience_years', 'rating_avg', 'availability_hours')}),
    )
    
    def user_name(self, obj):
        return obj.user.name
    user_name.short_description = 'Name'


@admin.register(DeliveryAgent)
class DeliveryAgentAdmin(admin.ModelAdmin):
    """
    Admin configuration for DeliveryAgent model
    """
    list_display = ('user_id', 'user_name', 'vehicle_type', 'vehicle_number', 'current_location', 'is_available')
    list_filter = ('vehicle_type', 'is_available')
    search_fields = ('user__name', 'vehicle_number', 'current_location')
    ordering = ('user_id',)
    
    fieldsets = (
        ('User Info', {'fields': ('user',)}),
        ('Delivery Details', {'fields': ('vehicle_type', 'vehicle_number', 'current_location', 'is_available')}),
    )
    
    def user_name(self, obj):
        return obj.user.name
    user_name.short_description = 'Name'
