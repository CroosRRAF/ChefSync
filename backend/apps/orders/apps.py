from django.apps import AppConfig
import logging

logger = logging.getLogger(__name__)


class OrdersConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.orders'
    
    def ready(self):
        """
        Initialize app when Django is ready.
        Starts background scheduler for auto-cancelling unconfirmed orders.
        """
        # Import signals
        import apps.orders.signals
        
        # Start background scheduler
        import sys
        
        # Don't start scheduler during migrations or collectstatic
        if 'makemigrations' in sys.argv or 'migrate' in sys.argv or 'collectstatic' in sys.argv:
            return
        
        # Don't start multiple instances in auto-reload scenarios (runserver)
        if 'runserver' in sys.argv:
            # Check if this is the reloader process
            import os
            if os.environ.get('RUN_MAIN') != 'true':
                return
        
        try:
            from apps.orders.scheduler import start_scheduler
            start_scheduler()
            logger.info('✅ Order auto-cancel scheduler initialized')
        except Exception as e:
            logger.error(f'❌ Failed to start order scheduler: {str(e)}')
