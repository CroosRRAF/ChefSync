"""
Django management command to clear admin-related mock data
while preserving core application data.
"""

from django.core.management.base import BaseCommand
from django.db import transaction

from apps.admin_management.models import (
    AdminActivityLog, AdminNotification, SystemHealthMetric,
    AdminDashboardWidget, AdminQuickAction, AdminSystemSettings, AdminBackupLog
)


class Command(BaseCommand):
    help = 'Clear admin-related mock data while preserving core application data'

    def add_arguments(self, parser):
        parser.add_argument(
            '--confirm',
            action='store_true',
            help='Confirm deletion of admin mock data',
        )

    def handle(self, *args, **options):
        if not options['confirm']:
            self.stdout.write(
                self.style.WARNING(
                    'WARNING: This will delete all admin-related mock data!\n'
                    'This includes activity logs, notifications, system metrics, '
                    'dashboard widgets, quick actions, system settings, and backup logs.\n'
                    'Use --confirm to proceed with deletion.'
                )
            )
            return

        self.stdout.write(
            self.style.SUCCESS('Starting admin mock data cleanup...')
        )

        try:
            with transaction.atomic():
                # Count records before deletion for reporting
                activity_logs_count = AdminActivityLog.objects.count()
                notifications_count = AdminNotification.objects.count()
                metrics_count = SystemHealthMetric.objects.count()
                widgets_count = AdminDashboardWidget.objects.count()
                actions_count = AdminQuickAction.objects.count()
                settings_count = AdminSystemSettings.objects.count()
                backups_count = AdminBackupLog.objects.count()

                # Clear admin-related data in dependency order
                self.stdout.write('Clearing admin backup logs...')
                AdminBackupLog.objects.all().delete()

                self.stdout.write('Clearing admin system settings...')
                AdminSystemSettings.objects.all().delete()

                self.stdout.write('Clearing admin quick actions...')
                AdminQuickAction.objects.all().delete()

                self.stdout.write('Clearing admin dashboard widgets...')
                AdminDashboardWidget.objects.all().delete()

                self.stdout.write('Clearing system health metrics...')
                SystemHealthMetric.objects.all().delete()

                self.stdout.write('Clearing admin notifications...')
                AdminNotification.objects.all().delete()

                self.stdout.write('Clearing admin activity logs...')
                AdminActivityLog.objects.all().delete()

                # Report deletion summary
                self.stdout.write(
                    self.style.SUCCESS(
                        f'Successfully cleared admin mock data:\n'
                        f'  - Activity Logs: {activity_logs_count}\n'
                        f'  - Notifications: {notifications_count}\n'
                        f'  - Health Metrics: {metrics_count}\n'
                        f'  - Dashboard Widgets: {widgets_count}\n'
                        f'  - Quick Actions: {actions_count}\n'
                        f'  - System Settings: {settings_count}\n'
                        f'  - Backup Logs: {backups_count}\n'
                        f'Total admin mock records removed: {activity_logs_count + notifications_count + metrics_count + widgets_count + actions_count + settings_count + backups_count}'
                    )
                )

        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Error during admin mock data cleanup: {str(e)}')
            )
            raise