from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.db import models
from django.utils.safestring import mark_safe
from .models import User, Customer, Cook, DeliveryAgent
from django.apps import apps

# Get models from Django's app registry to avoid import issues
DocumentType = apps.get_model('authentication', 'DocumentType')
UserDocument = apps.get_model('authentication', 'UserDocument')


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


@admin.register(DocumentType)
class DocumentTypeAdmin(admin.ModelAdmin):
    """
    Admin configuration for DocumentType model
    """
    list_display = ('name', 'category', 'is_required', 'max_file_size_mb', 'allowed_file_types')
    list_filter = ('category', 'is_required')
    search_fields = ('name', 'category', 'description')
    ordering = ('category', 'name')
    
    fieldsets = (
        ('Document Type Info', {'fields': ('name', 'category', 'description')}),
        ('Requirements', {'fields': ('is_required', 'allowed_file_types', 'max_file_size_mb')}),
    )


@admin.register(UserDocument)
class UserDocumentAdmin(admin.ModelAdmin):
    """
    Admin configuration for UserDocument model
    """
    list_display = ('id', 'user_name', 'user_email', 'document_type', 'file_name', 'file_download_link', 'status', 'is_visible_to_admin', 'uploaded_at')
    list_filter = ('status', 'is_visible_to_admin', 'document_type__category', 'uploaded_at')
    search_fields = ('user__name', 'user__email', 'file_name', 'document_type__name')
    ordering = ('-uploaded_at',)
    readonly_fields = ('id', 'file_download_link', 'file_name', 'file_size', 'file_type', 'uploaded_at', 'updated_at', 'cloudinary_public_id')
    
    fieldsets = (
        ('Document Info', {'fields': ('user', 'document_type', 'file_download_link', 'file_name', 'file_size', 'file_type')}),
        ('Status & Visibility', {'fields': ('status', 'is_visible_to_admin', 'admin_notes')}),
        ('Review Info', {'fields': ('reviewed_by', 'reviewed_at')}),
        ('Technical Info', {'fields': ('cloudinary_public_id', 'uploaded_at', 'updated_at')}),
    )
    
    def user_name(self, obj):
        return obj.user.name
    user_name.short_description = 'User Name'
    
    def user_email(self, obj):
        return obj.user.email
    user_email.short_description = 'User Email'
    
    def file_download_link(self, obj):
        """Create a clickable download link for the document"""
        if obj.file:
            return mark_safe(f'<a href="{obj.file}" target="_blank" style="color: #007cba; text-decoration: none;">📄 Download {obj.file_name}</a>')
        return "No file"
    file_download_link.short_description = 'Download'
    
    def get_queryset(self, request):
        """Filter documents based on visibility and user permissions"""
        queryset = super().get_queryset(request).select_related('user', 'document_type', 'reviewed_by')
        
        # If user is not superuser, show documents based on user approval status
        if not request.user.is_superuser:
            # Show all documents for pending users (so admin can review them)
            # Show only visible documents for approved/rejected users
            queryset = queryset.filter(
                models.Q(user__approval_status='pending') | 
                models.Q(is_visible_to_admin=True)
            )
        
        return queryset
    
    def has_change_permission(self, request, obj=None):
        """Allow changes to documents for pending users or visible documents"""
        if obj and not request.user.is_superuser:
            # Allow changes for pending users or visible documents
            if not (obj.user.approval_status == 'pending' or obj.is_visible_to_admin):
                return False
        return super().has_change_permission(request, obj)
    
    def has_delete_permission(self, request, obj=None):
        """Allow deletion of documents for pending users or visible documents"""
        if obj and not request.user.is_superuser:
            # Allow deletion for pending users or visible documents
            if not (obj.user.approval_status == 'pending' or obj.is_visible_to_admin):
                return False
        return super().has_delete_permission(request, obj)