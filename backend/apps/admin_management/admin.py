from django.contrib import admin
from .models import (
    AdminActivityLog, AdminNotification, SystemHealthMetric,
    AdminDashboardWidget, AdminQuickAction, AdminSystemSettings,
    AdminBackupLog
)


@admin.register(AdminActivityLog)
class AdminActivityLogAdmin(admin.ModelAdmin):
    list_display = ['admin', 'action', 'resource_type', 'resource_id', 'timestamp']
    list_filter = ['action', 'resource_type', 'timestamp']
    search_fields = ['admin__email', 'description', 'resource_id']
    readonly_fields = ['timestamp', 'ip_address', 'user_agent']
    date_hierarchy = 'timestamp'
    ordering = ['-timestamp']


@admin.register(AdminNotification)
class AdminNotificationAdmin(admin.ModelAdmin):
    list_display = ['title', 'notification_type', 'priority', 'is_read', 'is_active', 'created_at']
    list_filter = ['notification_type', 'priority', 'is_read', 'is_active', 'created_at']
    search_fields = ['title', 'message']
    readonly_fields = ['created_at', 'read_at']
    date_hierarchy = 'created_at'
    ordering = ['-created_at']


@admin.register(SystemHealthMetric)
class SystemHealthMetricAdmin(admin.ModelAdmin):
    list_display = ['metric_type', 'value', 'unit', 'timestamp']
    list_filter = ['metric_type', 'timestamp']
    readonly_fields = ['timestamp']
    date_hierarchy = 'timestamp'
    ordering = ['-timestamp']


@admin.register(AdminDashboardWidget)
class AdminDashboardWidgetAdmin(admin.ModelAdmin):
    list_display = ['name', 'widget_type', 'title', 'is_active', 'position_x', 'position_y']
    list_filter = ['widget_type', 'is_active']
    search_fields = ['name', 'title', 'description']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(AdminQuickAction)
class AdminQuickActionAdmin(admin.ModelAdmin):
    list_display = ['name', 'action_type', 'title', 'is_active', 'position']
    list_filter = ['action_type', 'is_active']
    search_fields = ['name', 'title', 'description']
    readonly_fields = ['created_at']


@admin.register(AdminSystemSettings)
class AdminSystemSettingsAdmin(admin.ModelAdmin):
    list_display = ['key', 'value', 'setting_type', 'category', 'is_public', 'updated_at']
    list_filter = ['setting_type', 'category', 'is_public', 'is_encrypted']
    search_fields = ['key', 'description']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(AdminBackupLog)
class AdminBackupLogAdmin(admin.ModelAdmin):
    list_display = ['backup_type', 'status', 'file_size', 'started_at', 'completed_at', 'created_by']
    list_filter = ['backup_type', 'status', 'started_at']
    search_fields = ['file_path', 'error_message']
    readonly_fields = ['started_at', 'duration']
    date_hierarchy = 'started_at'
    ordering = ['-started_at']