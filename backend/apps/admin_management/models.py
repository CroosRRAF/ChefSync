from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.core.validators import MinValueValidator, MaxValueValidator

User = get_user_model()


class AdminActivityLog(models.Model):
    """Track admin activities for audit purposes"""
    ACTION_CHOICES = [
        ('create', 'Create'),
        ('update', 'Update'),
        ('delete', 'Delete'),
        ('view', 'View'),
        ('export', 'Export'),
        ('import', 'Import'),
        ('approve', 'Approve'),
        ('reject', 'Reject'),
        ('suspend', 'Suspend'),
        ('activate', 'Activate'),
        ('login', 'Login'),
        ('logout', 'Logout'),
    ]
    
    RESOURCE_CHOICES = [
        ('user', 'User'),
        ('order', 'Order'),
        ('food', 'Food'),
        ('payment', 'Payment'),
        ('system', 'System'),
        ('settings', 'Settings'),
        ('report', 'Report'),
    ]
    
    admin = models.ForeignKey(User, on_delete=models.CASCADE, related_name='admin_management_activities')
    action = models.CharField(max_length=20, choices=ACTION_CHOICES)
    resource_type = models.CharField(max_length=20, choices=RESOURCE_CHOICES)
    resource_id = models.CharField(max_length=100, blank=True, null=True)
    description = models.TextField()
    ip_address = models.GenericIPAddressField(blank=True, null=True)
    user_agent = models.TextField(blank=True, null=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    metadata = models.JSONField(default=dict, blank=True)
    
    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['admin', 'timestamp']),
            models.Index(fields=['action', 'resource_type']),
            models.Index(fields=['timestamp']),
        ]
    
    def __str__(self):
        return f"{self.admin.email} - {self.action} {self.resource_type}"


class AdminNotification(models.Model):
    """Admin-specific notifications"""
    NOTIFICATION_TYPES = [
        ('system_alert', 'System Alert'),
        ('user_activity', 'User Activity'),
        ('order_update', 'Order Update'),
        ('payment_issue', 'Payment Issue'),
        ('security_event', 'Security Event'),
        ('maintenance', 'Maintenance'),
        ('backup', 'Backup'),
        ('performance', 'Performance'),
    ]
    
    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('critical', 'Critical'),
    ]
    
    title = models.CharField(max_length=200)
    message = models.TextField()
    notification_type = models.CharField(max_length=20, choices=NOTIFICATION_TYPES)
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='medium')
    is_read = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    read_at = models.DateTimeField(blank=True, null=True)
    expires_at = models.DateTimeField(blank=True, null=True)
    metadata = models.JSONField(default=dict, blank=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['is_read', 'is_active']),
            models.Index(fields=['notification_type', 'priority']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return f"{self.title} - {self.priority}"


class SystemHealthMetric(models.Model):
    """System health and performance metrics"""
    METRIC_TYPES = [
        ('cpu_usage', 'CPU Usage'),
        ('memory_usage', 'Memory Usage'),
        ('disk_usage', 'Disk Usage'),
        ('database_connections', 'Database Connections'),
        ('response_time', 'Response Time'),
        ('error_rate', 'Error Rate'),
        ('active_users', 'Active Users'),
        ('api_calls', 'API Calls'),
    ]
    
    metric_type = models.CharField(max_length=30, choices=METRIC_TYPES)
    value = models.FloatField(validators=[MinValueValidator(0), MaxValueValidator(100)])
    unit = models.CharField(max_length=20, default='%')
    timestamp = models.DateTimeField(auto_now_add=True)
    metadata = models.JSONField(default=dict, blank=True)
    
    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['metric_type', 'timestamp']),
            models.Index(fields=['timestamp']),
        ]
    
    def __str__(self):
        return f"{self.metric_type}: {self.value}{self.unit}"


class AdminDashboardWidget(models.Model):
    """Configurable dashboard widgets for admins"""
    WIDGET_TYPES = [
        ('stats_card', 'Statistics Card'),
        ('chart', 'Chart'),
        ('table', 'Table'),
        ('list', 'List'),
        ('gauge', 'Gauge'),
        ('map', 'Map'),
    ]
    
    CHART_TYPES = [
        ('line', 'Line Chart'),
        ('bar', 'Bar Chart'),
        ('pie', 'Pie Chart'),
        ('doughnut', 'Doughnut Chart'),
        ('area', 'Area Chart'),
    ]
    
    name = models.CharField(max_length=100)
    widget_type = models.CharField(max_length=20, choices=WIDGET_TYPES)
    chart_type = models.CharField(max_length=20, choices=CHART_TYPES, blank=True, null=True)
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    data_source = models.CharField(max_length=100)  # API endpoint or data source
    position_x = models.IntegerField(default=0)
    position_y = models.IntegerField(default=0)
    width = models.IntegerField(default=4)
    height = models.IntegerField(default=3)
    is_active = models.BooleanField(default=True)
    refresh_interval = models.IntegerField(default=300)  # seconds
    config = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['position_y', 'position_x']
    
    def __str__(self):
        return f"{self.name} - {self.widget_type}"


class AdminQuickAction(models.Model):
    """Quick action buttons for admin dashboard"""
    ACTION_TYPES = [
        ('create_user', 'Create User'),
        ('approve_chef', 'Approve Chef'),
        ('view_orders', 'View Orders'),
        ('export_data', 'Export Data'),
        ('system_backup', 'System Backup'),
        ('maintenance_mode', 'Maintenance Mode'),
        ('clear_cache', 'Clear Cache'),
        ('send_notification', 'Send Notification'),
    ]
    
    name = models.CharField(max_length=100)
    action_type = models.CharField(max_length=30, choices=ACTION_TYPES)
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    icon = models.CharField(max_length=50, default='bx-cog')
    color = models.CharField(max_length=20, default='blue')
    is_active = models.BooleanField(default=True)
    requires_confirmation = models.BooleanField(default=False)
    confirmation_message = models.TextField(blank=True)
    position = models.IntegerField(default=0)
    config = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['position']
    
    def __str__(self):
        return f"{self.name} - {self.action_type}"


class AdminSystemSettings(models.Model):
    """System-wide settings managed by admins"""
    SETTING_CATEGORIES = [
        ('general', 'General'),
        ('security', 'Security'),
        ('performance', 'Performance'),
        ('notifications', 'Notifications'),
        ('backup', 'Backup'),
        ('maintenance', 'Maintenance'),
        ('api', 'API'),
        ('ui', 'User Interface'),
    ]
    
    SETTING_TYPES = [
        ('string', 'String'),
        ('integer', 'Integer'),
        ('boolean', 'Boolean'),
        ('float', 'Float'),
        ('json', 'JSON'),
        ('email', 'Email'),
        ('url', 'URL'),
    ]
    
    key = models.CharField(max_length=100, unique=True)
    value = models.TextField()
    setting_type = models.CharField(max_length=20, choices=SETTING_TYPES, default='string')
    category = models.CharField(max_length=20, choices=SETTING_CATEGORIES, default='general')
    description = models.TextField(blank=True)
    is_public = models.BooleanField(default=False)  # Can be accessed by non-admin users
    is_encrypted = models.BooleanField(default=False)
    default_value = models.TextField(blank=True)
    validation_rules = models.JSONField(default=dict, blank=True)
    updated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='admin_management_system_settings')
    updated_at = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['category', 'key']
        indexes = [
            models.Index(fields=['category', 'is_public']),
            models.Index(fields=['key']),
        ]
    
    def __str__(self):
        return f"{self.key} = {self.value}"
    
    def get_typed_value(self):
        """Return the value converted to its proper type"""
        if self.setting_type == 'boolean':
            return self.value.lower() in ('true', '1', 'yes', 'on')
        elif self.setting_type == 'integer':
            try:
                return int(self.value)
            except ValueError:
                return 0
        elif self.setting_type == 'float':
            try:
                return float(self.value)
            except ValueError:
                return 0.0
        elif self.setting_type == 'json':
            try:
                import json
                return json.loads(self.value)
            except (ValueError, TypeError):
                return {}
        else:
            return self.value


class AdminBackupLog(models.Model):
    """Track backup operations"""
    BACKUP_TYPES = [
        ('database', 'Database'),
        ('files', 'Files'),
        ('full', 'Full System'),
        ('incremental', 'Incremental'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('running', 'Running'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('cancelled', 'Cancelled'),
    ]
    
    backup_type = models.CharField(max_length=20, choices=BACKUP_TYPES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    file_path = models.CharField(max_length=500, blank=True)
    file_size = models.BigIntegerField(blank=True, null=True)
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(blank=True, null=True)
    duration = models.DurationField(blank=True, null=True)
    error_message = models.TextField(blank=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='admin_management_backup_logs')
    metadata = models.JSONField(default=dict, blank=True)
    
    class Meta:
        ordering = ['-started_at']
        indexes = [
            models.Index(fields=['status', 'backup_type']),
            models.Index(fields=['started_at']),
        ]
    
    def __str__(self):
        return f"{self.backup_type} backup - {self.status}"