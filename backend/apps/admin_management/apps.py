from django.apps import AppConfig


class AdminManagementConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.admin_management'
    verbose_name = 'Admin Management'
    
    def ready(self):
        """Import signal handlers when the app is ready"""
        try:
            import apps.admin_management.signals
        except ImportError:
            pass