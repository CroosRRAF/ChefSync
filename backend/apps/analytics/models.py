from django.db import models
from django.conf import settings
from django.utils import timezone


class SystemSettings(models.Model):
    """System-wide configuration settings"""
    
    SETTING_TYPES = [
        ('general', 'General'),
        ('security', 'Security'),
        ('notification', 'Notification'),
        ('payment', 'Payment'),
        ('delivery', 'Delivery'),
        ('food', 'Food'),
        ('user', 'User'),
        ('analytics', 'Analytics'),
    ]
    
    key = models.CharField(max_length=100, unique=True, help_text="Setting identifier")
    value = models.TextField(help_text="Setting value (JSON format for complex data)")
    setting_type = models.CharField(max_length=20, choices=SETTING_TYPES, default='general')
    description = models.TextField(blank=True, help_text="Setting description")
    is_active = models.BooleanField(default=True, help_text="Whether this setting is active")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    
    class Meta:
        ordering = ['setting_type', 'key']
        verbose_name = 'System Setting'
        verbose_name_plural = 'System Settings'
    
    def __str__(self):
        return f"{self.key} ({self.setting_type})"


class UserRole(models.Model):
    """User role definitions and permissions"""
    
    ROLE_TYPES = [
        ('admin', 'Administrator'),
        ('chef', 'Chef'),
        ('delivery', 'Delivery Partner'),
        ('customer', 'Customer'),
        ('support', 'Support Staff'),
        ('analyst', 'Business Analyst'),
    ]
    
    name = models.CharField(max_length=50, unique=True)
    role_type = models.CharField(max_length=20, choices=ROLE_TYPES)
    description = models.TextField(blank=True)
    permissions = models.JSONField(default=dict, help_text="JSON object of permissions")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['name']
        verbose_name = 'User Role'
        verbose_name_plural = 'User Roles'
    
    def __str__(self):
        return self.name


class SystemMaintenance(models.Model):
    """System maintenance and operations log"""
    
    MAINTENANCE_TYPES = [
        ('scheduled', 'Scheduled Maintenance'),
        ('emergency', 'Emergency Maintenance'),
        ('update', 'System Update'),
        ('backup', 'Backup Operation'),
        ('cleanup', 'Data Cleanup'),
        ('monitoring', 'System Monitoring'),
    ]
    
    STATUS_CHOICES = [
        ('scheduled', 'Scheduled'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
        ('failed', 'Failed'),
    ]
    
    title = models.CharField(max_length=200)
    description = models.TextField()
    maintenance_type = models.CharField(max_length=20, choices=MAINTENANCE_TYPES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='scheduled')
    scheduled_start = models.DateTimeField()
    scheduled_end = models.DateTimeField()
    actual_start = models.DateTimeField(null=True, blank=True)
    actual_end = models.DateTimeField(null=True, blank=True)
    affected_services = models.JSONField(default=list, help_text="List of affected services")
    notes = models.TextField(blank=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='maintenance_created')
    executed_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='maintenance_executed')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-scheduled_start']
        verbose_name = 'System Maintenance'
        verbose_name_plural = 'System Maintenance'
    
    def __str__(self):
        return f"{self.title} ({self.get_status_display()})"


class SystemNotification(models.Model):
    """System-wide notifications and announcements"""
    
    NOTIFICATION_TYPES = [
        ('info', 'Information'),
        ('warning', 'Warning'),
        ('error', 'Error'),
        ('maintenance', 'Maintenance'),
        ('update', 'Update'),
        ('announcement', 'Announcement'),
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
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='medium')
    target_users = models.JSONField(default=list, help_text="List of user types to notify")
    is_active = models.BooleanField(default=True)
    start_date = models.DateTimeField(default=timezone.now)
    end_date = models.DateTimeField(null=True, blank=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'System Notification'
        verbose_name_plural = 'System Notifications'
    
    def __str__(self):
        return f"{self.title} ({self.get_priority_display()})"


class SystemAuditLog(models.Model):
    """System audit trail for security and compliance"""
    
    ACTION_TYPES = [
        ('create', 'Create'),
        ('update', 'Update'),
        ('delete', 'Delete'),
        ('login', 'Login'),
        ('logout', 'Logout'),
        ('permission_change', 'Permission Change'),
        ('setting_change', 'Setting Change'),
        ('data_export', 'Data Export'),
        ('system_action', 'System Action'),
    ]
    
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    action = models.CharField(max_length=20, choices=ACTION_TYPES)
    resource_type = models.CharField(max_length=50, help_text="Type of resource affected")
    resource_id = models.CharField(max_length=50, blank=True, help_text="ID of resource affected")
    details = models.JSONField(default=dict, help_text="Additional action details")
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-timestamp']
        verbose_name = 'System Audit Log'
        verbose_name_plural = 'System Audit Logs'
        indexes = [
            models.Index(fields=['user', 'timestamp']),
            models.Index(fields=['action', 'timestamp']),
            models.Index(fields=['resource_type', 'timestamp']),
        ]
    
    def __str__(self):
        return f"{self.user.username if self.user else 'System'} - {self.action} at {self.timestamp}"


class PlatformConfiguration(models.Model):
    """Platform-specific configuration settings"""
    
    CONFIG_TYPES = [
        ('business', 'Business Rules'),
        ('operational', 'Operational Settings'),
        ('technical', 'Technical Configuration'),
        ('integration', 'Integration Settings'),
        ('customization', 'Customization Options'),
    ]
    
    name = models.CharField(max_length=100, unique=True)
    config_type = models.CharField(max_length=20, choices=CONFIG_TYPES)
    value = models.JSONField(help_text="Configuration value in JSON format")
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    version = models.CharField(max_length=20, default='1.0')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    
    class Meta:
        ordering = ['config_type', 'name']
        verbose_name = 'Platform Configuration'
        verbose_name_plural = 'Platform Configurations'
    
    def __str__(self):
        return f"{self.name} ({self.config_type})"