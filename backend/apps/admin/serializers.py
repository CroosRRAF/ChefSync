from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.utils import timezone
from .models import (
    AdminActivityLog, AdminNotification, SystemHealthMetric,
    AdminDashboardWidget, AdminQuickAction, AdminSystemSettings,
    AdminBackupLog
)

User = get_user_model()


class AdminActivityLogSerializer(serializers.ModelSerializer):
    """Serializer for admin activity logs"""
    admin_email = serializers.CharField(source='admin.email', read_only=True)
    admin_name = serializers.CharField(source='admin.get_full_name', read_only=True)

    class Meta:
        model = AdminActivityLog
        fields = [
            'id', 'admin', 'admin_email', 'admin_name', 'action', 'resource_type',
            'resource_id', 'description', 'ip_address', 'user_agent', 'timestamp',
            'metadata'
        ]
        read_only_fields = ['id', 'timestamp']


class AdminNotificationSerializer(serializers.ModelSerializer):
    """Serializer for admin notifications"""
    is_expired = serializers.SerializerMethodField()

    class Meta:
        model = AdminNotification
        fields = [
            'id', 'title', 'message', 'notification_type', 'priority',
            'is_read', 'is_active', 'created_at', 'read_at', 'expires_at',
            'metadata', 'is_expired'
        ]
        read_only_fields = ['id', 'created_at']

    def get_is_expired(self, obj):
        """Check if notification has expired"""
        if obj.expires_at:
            return timezone.now() > obj.expires_at
        return False

    def update(self, instance, validated_data):
        """Handle read_at timestamp when marking as read"""
        if validated_data.get('is_read') and not instance.is_read:
            validated_data['read_at'] = timezone.now()
        return super().update(instance, validated_data)


class SystemHealthMetricSerializer(serializers.ModelSerializer):
    """Serializer for system health metrics"""

    class Meta:
        model = SystemHealthMetric
        fields = [
            'id', 'metric_type', 'value', 'unit', 'timestamp', 'metadata'
        ]
        read_only_fields = ['id', 'timestamp']


class AdminDashboardWidgetSerializer(serializers.ModelSerializer):
    """Serializer for dashboard widgets"""

    class Meta:
        model = AdminDashboardWidget
        fields = [
            'id', 'name', 'widget_type', 'chart_type', 'title', 'description',
            'data_source', 'position_x', 'position_y', 'width', 'height',
            'is_active', 'refresh_interval', 'config', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class AdminQuickActionSerializer(serializers.ModelSerializer):
    """Serializer for quick actions"""

    class Meta:
        model = AdminQuickAction
        fields = [
            'id', 'name', 'action_type', 'title', 'description', 'icon',
            'color', 'is_active', 'requires_confirmation', 'confirmation_message',
            'position', 'config', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class AdminSystemSettingsSerializer(serializers.ModelSerializer):
    """Serializer for system settings"""
    updated_by_email = serializers.CharField(source='updated_by.email', read_only=True)
    typed_value = serializers.SerializerMethodField()

    class Meta:
        model = AdminSystemSettings
        fields = [
            'id', 'key', 'value', 'typed_value', 'setting_type', 'category',
            'description', 'is_public', 'is_encrypted', 'default_value',
            'validation_rules', 'updated_by', 'updated_by_email', 'updated_at',
            'created_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'updated_by_email']

    def get_typed_value(self, obj):
        """Return the value converted to its proper type"""
        return obj.get_typed_value()

    def update(self, instance, validated_data):
        """Set the updated_by field to current user"""
        request = self.context.get('request')
        if request and request.user:
            validated_data['updated_by'] = request.user
        return super().update(instance, validated_data)


class AdminBackupLogSerializer(serializers.ModelSerializer):
    """Serializer for backup logs"""
    created_by_email = serializers.CharField(source='created_by.email', read_only=True)
    duration_seconds = serializers.SerializerMethodField()

    class Meta:
        model = AdminBackupLog
        fields = [
            'id', 'backup_type', 'status', 'file_path', 'file_size',
            'started_at', 'completed_at', 'duration', 'duration_seconds',
            'error_message', 'created_by', 'created_by_email', 'metadata'
        ]
        read_only_fields = ['id', 'started_at', 'duration']

    def get_duration_seconds(self, obj):
        """Return duration in seconds"""
        if obj.duration:
            return obj.duration.total_seconds()
        return None


# Dashboard Statistics Serializers

class DashboardStatsSerializer(serializers.Serializer):
    """Serializer for dashboard statistics"""

    # User statistics
    total_users = serializers.IntegerField()
    active_users = serializers.IntegerField()
    new_users_today = serializers.IntegerField()
    new_users_this_week = serializers.IntegerField()
    new_users_this_month = serializers.IntegerField()
    user_growth = serializers.FloatField()

    # Chef statistics
    total_chefs = serializers.IntegerField()
    active_chefs = serializers.IntegerField()
    pending_chef_approvals = serializers.IntegerField()
    chef_growth = serializers.FloatField()

    # Order statistics
    total_orders = serializers.IntegerField()
    orders_today = serializers.IntegerField()
    orders_this_week = serializers.IntegerField()
    orders_this_month = serializers.IntegerField()
    order_growth = serializers.FloatField()

    # Revenue statistics
    total_revenue = serializers.FloatField()
    revenue_today = serializers.FloatField()
    revenue_this_week = serializers.FloatField()
    revenue_this_month = serializers.FloatField()
    revenue_growth = serializers.FloatField()

    # Food statistics
    total_foods = serializers.IntegerField()
    active_foods = serializers.IntegerField()
    pending_food_approvals = serializers.IntegerField()

    # System statistics
    system_health_score = serializers.FloatField()
    active_sessions = serializers.IntegerField()
    unread_notifications = serializers.IntegerField()
    pending_backups = serializers.IntegerField()


class SystemHealthSerializer(serializers.Serializer):
    """Serializer for system health data"""
    cpu_usage = serializers.FloatField()
    memory_usage = serializers.FloatField()
    disk_usage = serializers.FloatField()
    database_connections = serializers.IntegerField()
    response_time = serializers.FloatField()
    error_rate = serializers.FloatField()
    timestamp = serializers.DateTimeField()


class AdminUserSummarySerializer(serializers.Serializer):
    """Serializer for admin user summary"""
    id = serializers.IntegerField()
    email = serializers.EmailField()
    full_name = serializers.CharField()
    role = serializers.CharField()
    is_active = serializers.BooleanField()
    date_joined = serializers.DateTimeField()
    last_login = serializers.DateTimeField()


class AdminOrderSummarySerializer(serializers.Serializer):
    """Serializer for admin order summary"""
    id = serializers.IntegerField()
    order_number = serializers.CharField()
    customer_name = serializers.CharField()
    total_amount = serializers.FloatField()
    status = serializers.CharField()
    payment_status = serializers.CharField()
    created_at = serializers.DateTimeField()
