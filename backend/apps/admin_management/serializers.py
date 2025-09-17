from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.utils import timezone
from .models import (
    AdminActivityLog, AdminNotification, SystemHealthMetric,
    AdminDashboardWidget, AdminQuickAction, AdminSystemSettings,
    AdminBackupLog
)
from apps.orders.models import Order

User = get_user_model()


class AdminActivityLogSerializer(serializers.ModelSerializer):
    admin_email = serializers.CharField(source='admin.email', read_only=True)
    admin_name = serializers.CharField(source='admin.get_full_name', read_only=True)
    time_ago = serializers.SerializerMethodField()
    
    class Meta:
        model = AdminActivityLog
        fields = [
            'id', 'admin', 'admin_email', 'admin_name', 'action', 'resource_type',
            'resource_id', 'description', 'ip_address', 'user_agent', 'timestamp',
            'time_ago', 'metadata'
        ]
        read_only_fields = ['id', 'timestamp', 'time_ago']
    
    def get_time_ago(self, obj):
        """Calculate time difference from now"""
        now = timezone.now()
        diff = now - obj.timestamp
        
        if diff.days > 0:
            return f"{diff.days} day{'s' if diff.days > 1 else ''} ago"
        elif diff.seconds > 3600:
            hours = diff.seconds // 3600
            return f"{hours} hour{'s' if hours > 1 else ''} ago"
        elif diff.seconds > 60:
            minutes = diff.seconds // 60
            return f"{minutes} minute{'s' if minutes > 1 else ''} ago"
        else:
            return "Just now"


class AdminNotificationSerializer(serializers.ModelSerializer):
    time_ago = serializers.SerializerMethodField()
    is_expired = serializers.SerializerMethodField()
    
    class Meta:
        model = AdminNotification
        fields = [
            'id', 'title', 'message', 'notification_type', 'priority',
            'is_read', 'is_active', 'created_at', 'read_at', 'expires_at',
            'time_ago', 'is_expired', 'metadata'
        ]
        read_only_fields = ['id', 'created_at', 'time_ago', 'is_expired']
    
    def get_time_ago(self, obj):
        """Calculate time difference from now"""
        now = timezone.now()
        diff = now - obj.created_at
        
        if diff.days > 0:
            return f"{diff.days} day{'s' if diff.days > 1 else ''} ago"
        elif diff.seconds > 3600:
            hours = diff.seconds // 3600
            return f"{hours} hour{'s' if hours > 1 else ''} ago"
        elif diff.seconds > 60:
            minutes = diff.seconds // 60
            return f"{minutes} minute{'s' if minutes > 1 else ''} ago"
        else:
            return "Just now"
    
    def get_is_expired(self, obj):
        """Check if notification is expired"""
        if obj.expires_at:
            return timezone.now() > obj.expires_at
        return False


class SystemHealthMetricSerializer(serializers.ModelSerializer):
    class Meta:
        model = SystemHealthMetric
        fields = [
            'id', 'metric_type', 'value', 'unit', 'timestamp', 'metadata'
        ]
        read_only_fields = ['id', 'timestamp']


class AdminDashboardWidgetSerializer(serializers.ModelSerializer):
    class Meta:
        model = AdminDashboardWidget
        fields = [
            'id', 'name', 'widget_type', 'chart_type', 'title', 'description',
            'data_source', 'position_x', 'position_y', 'width', 'height',
            'is_active', 'refresh_interval', 'config', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class AdminQuickActionSerializer(serializers.ModelSerializer):
    class Meta:
        model = AdminQuickAction
        fields = [
            'id', 'name', 'action_type', 'title', 'description', 'icon',
            'color', 'is_active', 'requires_confirmation', 'confirmation_message',
            'position', 'config', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class AdminSystemSettingsSerializer(serializers.ModelSerializer):
    typed_value = serializers.SerializerMethodField()
    
    class Meta:
        model = AdminSystemSettings
        fields = [
            'id', 'key', 'value', 'typed_value', 'setting_type', 'category',
            'description', 'is_public', 'is_encrypted', 'default_value',
            'validation_rules', 'updated_by', 'updated_at', 'created_at'
        ]
        read_only_fields = ['id', 'typed_value', 'updated_at', 'created_at']
    
    def get_typed_value(self, obj):
        """Return the value converted to its proper type"""
        return obj.get_typed_value()
    
    def validate_value(self, value):
        """Validate value based on setting type"""
        setting_type = self.initial_data.get('setting_type', 'string')
        
        if setting_type == 'boolean':
            if value.lower() not in ('true', 'false', '1', '0', 'yes', 'no', 'on', 'off'):
                raise serializers.ValidationError("Boolean value must be true/false, 1/0, yes/no, or on/off")
        elif setting_type == 'integer':
            try:
                int(value)
            except ValueError:
                raise serializers.ValidationError("Value must be a valid integer")
        elif setting_type == 'float':
            try:
                float(value)
            except ValueError:
                raise serializers.ValidationError("Value must be a valid float")
        elif setting_type == 'json':
            try:
                import json
                json.loads(value)
            except (ValueError, TypeError):
                raise serializers.ValidationError("Value must be valid JSON")
        elif setting_type == 'email':
            from django.core.validators import validate_email
            try:
                validate_email(value)
            except:
                raise serializers.ValidationError("Value must be a valid email address")
        
        return value


class AdminBackupLogSerializer(serializers.ModelSerializer):
    duration_display = serializers.SerializerMethodField()
    file_size_display = serializers.SerializerMethodField()
    created_by_email = serializers.CharField(source='created_by.email', read_only=True)
    
    class Meta:
        model = AdminBackupLog
        fields = [
            'id', 'backup_type', 'status', 'file_path', 'file_size',
            'file_size_display', 'started_at', 'completed_at', 'duration',
            'duration_display', 'error_message', 'created_by', 'created_by_email',
            'metadata'
        ]
        read_only_fields = ['id', 'started_at', 'duration_display', 'file_size_display']
    
    def get_duration_display(self, obj):
        """Format duration for display"""
        if obj.duration:
            total_seconds = int(obj.duration.total_seconds())
            hours, remainder = divmod(total_seconds, 3600)
            minutes, seconds = divmod(remainder, 60)
            
            if hours > 0:
                return f"{hours}h {minutes}m {seconds}s"
            elif minutes > 0:
                return f"{minutes}m {seconds}s"
            else:
                return f"{seconds}s"
        return None
    
    def get_file_size_display(self, obj):
        """Format file size for display"""
        if obj.file_size:
            size = obj.file_size
            for unit in ['B', 'KB', 'MB', 'GB', 'TB']:
                if size < 1024.0:
                    return f"{size:.1f} {unit}"
                size /= 1024.0
            return f"{size:.1f} PB"
        return None


# Dashboard Statistics Serializers
class DashboardStatsSerializer(serializers.Serializer):
    """Comprehensive dashboard statistics"""
    # User Statistics
    total_users = serializers.IntegerField()
    active_users = serializers.IntegerField()
    new_users_today = serializers.IntegerField()
    new_users_this_week = serializers.IntegerField()
    new_users_this_month = serializers.IntegerField()
    user_growth = serializers.FloatField()
    
    # Chef Statistics
    total_chefs = serializers.IntegerField()
    active_chefs = serializers.IntegerField()
    pending_chef_approvals = serializers.IntegerField()
    chef_growth = serializers.FloatField()
    
    # Order Statistics
    total_orders = serializers.IntegerField()
    orders_today = serializers.IntegerField()
    orders_this_week = serializers.IntegerField()
    orders_this_month = serializers.IntegerField()
    order_growth = serializers.FloatField()
    
    # Revenue Statistics
    total_revenue = serializers.FloatField()
    revenue_today = serializers.FloatField()
    revenue_this_week = serializers.FloatField()
    revenue_this_month = serializers.FloatField()
    revenue_growth = serializers.FloatField()
    
    # Food Statistics
    total_foods = serializers.IntegerField()
    active_foods = serializers.IntegerField()
    pending_food_approvals = serializers.IntegerField()
    
    # System Statistics
    system_health_score = serializers.FloatField()
    active_sessions = serializers.IntegerField()
    unread_notifications = serializers.IntegerField()
    pending_backups = serializers.IntegerField()


class SystemHealthSerializer(serializers.Serializer):
    """System health overview"""
    overall_health = serializers.CharField()
    health_score = serializers.FloatField()
    cpu_usage = serializers.FloatField()
    memory_usage = serializers.FloatField()
    disk_usage = serializers.FloatField()
    database_connections = serializers.IntegerField()
    response_time = serializers.FloatField()
    error_rate = serializers.FloatField()
    uptime = serializers.CharField()
    last_backup = serializers.DateTimeField()
    alerts = serializers.ListField(child=serializers.DictField())


class AdminUserSummarySerializer(serializers.ModelSerializer):
    """User summary for admin dashboard"""
    total_orders = serializers.SerializerMethodField()
    total_spent = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'email', 'name', 'role', 'is_active', 'last_login',
            'date_joined', 'total_orders', 'total_spent'
        ]
    
    def get_total_orders(self, obj):
        from apps.orders.models import Order
        return Order.objects.filter(customer=obj).count()
    
    def get_total_spent(self, obj):
        from apps.orders.models import Order
        from django.db.models import Sum
        total = Order.objects.filter(
            customer=obj, payment_status='paid'
        ).aggregate(total=Sum('total_amount'))['total'] or 0
        return float(total)


class AdminOrderSummarySerializer(serializers.ModelSerializer):
    """Order summary for admin dashboard"""
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    customer_email = serializers.CharField(source='customer.email', read_only=True)
    items_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Order
        fields = [
            'id', 'order_number', 'customer_name', 'customer_email',
            'status', 'total_amount', 'created_at', 'updated_at',
            'payment_status', 'items_count'
        ]
    
    def get_items_count(self, obj):
        return obj.items.count()
