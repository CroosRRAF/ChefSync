from django.contrib import admin
from .models import (
    Communication,
    CommunicationResponse,
    CommunicationAttachment,
    CommunicationTemplate,
    CommunicationCategory,
    CommunicationTag,
    CommunicationCategoryRelation,
    CommunicationTagRelation
)

@admin.register(Communication)
class CommunicationAdmin(admin.ModelAdmin):
    list_display = ('reference_number', 'subject', 'user', 'communication_type', 'status', 'priority', 'created_at')
    list_filter = ('communication_type', 'status', 'priority', 'is_read', 'is_archived')
    search_fields = ('reference_number', 'subject', 'user__email', 'user__name')
    date_hierarchy = 'created_at'
    readonly_fields = ('reference_number', 'created_at', 'updated_at', 'read_at', 'resolved_at')

@admin.register(CommunicationResponse)
class CommunicationResponseAdmin(admin.ModelAdmin):
    list_display = ('communication', 'responder', 'is_internal', 'created_at')
    list_filter = ('is_internal', 'created_at')
    search_fields = ('communication__reference_number', 'responder__email', 'message')
    date_hierarchy = 'created_at'

@admin.register(CommunicationAttachment)
class CommunicationAttachmentAdmin(admin.ModelAdmin):
    list_display = ('filename', 'communication', 'file_type', 'file_size', 'uploaded_by', 'created_at')
    list_filter = ('file_type', 'created_at')
    search_fields = ('filename', 'communication__reference_number', 'uploaded_by__email')
    date_hierarchy = 'created_at'

@admin.register(CommunicationTemplate)
class CommunicationTemplateAdmin(admin.ModelAdmin):
    list_display = ('name', 'template_type', 'is_active', 'created_by', 'updated_at')
    list_filter = ('template_type', 'is_active')
    search_fields = ('name', 'subject', 'content')
    readonly_fields = ('created_at', 'updated_at')

@admin.register(CommunicationCategory)
class CommunicationCategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'parent', 'is_active', 'created_at')
    list_filter = ('is_active', 'parent')
    search_fields = ('name', 'description')
    readonly_fields = ('created_at', 'updated_at')

@admin.register(CommunicationTag)
class CommunicationTagAdmin(admin.ModelAdmin):
    list_display = ('name', 'color', 'created_by', 'created_at')
    search_fields = ('name', 'description')
    readonly_fields = ('created_at',)

@admin.register(CommunicationCategoryRelation)
class CommunicationCategoryRelationAdmin(admin.ModelAdmin):
    list_display = ('communication', 'category', 'added_by', 'added_at')
    list_filter = ('category', 'added_at')
    search_fields = ('communication__reference_number', 'category__name', 'added_by__email')
    date_hierarchy = 'added_at'

@admin.register(CommunicationTagRelation)
class CommunicationTagRelationAdmin(admin.ModelAdmin):
    list_display = ('communication', 'tag', 'added_by', 'added_at')
    list_filter = ('tag', 'added_at')
    search_fields = ('communication__reference_number', 'tag__name', 'added_by__email')
    date_hierarchy = 'added_at'