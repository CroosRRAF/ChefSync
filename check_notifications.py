#!/usr/bin/env python
import os
import sys

import django

# Add the backend directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

# Configure Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.admin_management.models import AdminNotification
from apps.admin_management.serializers import AdminNotificationSerializer


def check_notifications():
    try:
        count = AdminNotification.objects.count()
        print(f"AdminNotification count: {count}")

        if count > 0:
            notification = AdminNotification.objects.first()
            print(f"First notification: ID={notification.id}, Title={notification.title}")

            # Try to serialize it
            try:
                serializer = AdminNotificationSerializer(notification)
                data = serializer.data
                print(f"Serialization successful: {data}")
            except Exception as e:
                print(f"Serialization error: {e}")
                import traceback
                traceback.print_exc()

    except Exception as e:
        print(f"Error checking notifications: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    check_notifications()if __name__ == "__main__":
    check_notifications()
