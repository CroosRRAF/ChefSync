"""
Django management command to clear admin-related frontend mock data only
"""

import os
from pathlib import Path
from django.core.management.base import BaseCommand
from django.conf import settings


class Command(BaseCommand):
    help = 'Clear admin-related frontend mock data only'

    def add_arguments(self, parser):
        parser.add_argument(
            '--confirm',
            action='store_true',
            help='Confirm deletion of admin-related frontend mock data',
        )

    def handle(self, *args, **options):
        if not options['confirm']:
            self.stdout.write(
                self.style.WARNING(
                    'WARNING: This will remove admin-related frontend mock data only!\n'
                    'This includes:\n'
                    '  - Mock admin users in userService.ts\n'
                    '  - Mock dashboard stats in analyticsService.ts\n'
                    '  - Mock server references in communicationService.ts\n'
                    'Non-admin mock data (Menu, Schedule, Map) will be preserved.\n'
                    'Use --confirm to proceed with cleanup.'
                )
            )
            return

        self.stdout.write(
            self.style.SUCCESS('Starting admin-related frontend mock data cleanup...')
        )

        frontend_dir = Path(settings.BASE_DIR).parent / 'frontend'
        if not frontend_dir.exists():
            self.stdout.write(
                self.style.ERROR(f'Frontend directory not found: {frontend_dir}')
            )
            return

        try:
            # Track what was modified
            modified_files = []

            # Clean admin-related service files only
            self._clean_user_service_admin_data(frontend_dir, modified_files)
            self._clean_analytics_service(frontend_dir, modified_files)
            self._clean_communication_service(frontend_dir, modified_files)

            # Summary
            self.stdout.write(
                self.style.SUCCESS(
                    f'\nAdmin-related frontend mock data cleanup completed!\n'
                    f'Files modified: {len(modified_files)}'
                )
            )

            if modified_files:
                self.stdout.write(self.style.SUCCESS('Modified files:'))
                for file in modified_files:
                    self.stdout.write(f'  - {file}')

        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Error during admin-related frontend mock data cleanup: {str(e)}')
            )
            raise

    def _clean_user_service_admin_data(self, frontend_dir, modified_files):
        """Remove admin-related mock data from userService.ts while preserving non-admin users"""
        user_service_file = frontend_dir / 'src' / 'services' / 'userService.ts'

        if not user_service_file.exists():
            return

        try:
            with open(user_service_file, 'r', encoding='utf-8') as f:
                content = f.read()

            # Find and modify the mock users array to remove admin users only
            start_marker = '    const mockUsers: User[] = ['
            end_marker = '    ];'

            start_idx = content.find(start_marker)
            if start_idx != -1:
                end_idx = content.find(end_marker, start_idx)
                if end_idx != -1:
                    end_idx += len(end_marker)

                    # Extract the mock users section
                    mock_section = content[start_idx:end_idx]

                    # Remove admin users (user_type: 'admin') while keeping others
                    lines = mock_section.split('\n')
                    filtered_lines = []
                    skip_user = False

                    for line in lines:
                        if 'user_type: \'admin\'' in line:
                            skip_user = True
                        elif skip_user and line.strip() == '},':
                            skip_user = False
                            continue  # Skip the closing brace of admin user
                        elif skip_user:
                            continue  # Skip lines belonging to admin user
                        else:
                            filtered_lines.append(line)

                    # Reconstruct the mock users section
                    new_mock_section = '\n'.join(filtered_lines)
                    content = content[:start_idx] + new_mock_section + content[end_idx:]

            # Write back the cleaned content
            with open(user_service_file, 'w', encoding='utf-8') as f:
                f.write(content)

            modified_files.append('src/services/userService.ts')
            self.stdout.write('✅ Cleaned userService.ts - removed admin users from mock data')

        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Error cleaning userService.ts: {str(e)}')
            )

    def _clean_analytics_service(self, frontend_dir, modified_files):
        """Remove mock data from analyticsService.ts"""
        analytics_service_file = frontend_dir / 'src' / 'services' / 'analyticsService.ts'

        if not analytics_service_file.exists():
            return

        try:
            with open(analytics_service_file, 'r', encoding='utf-8') as f:
                content = f.read()

            # Remove the getMockDashboardStats method
            start_marker = '  private getMockDashboardStats(): DashboardStats {'
            end_marker = '  }'

            start_idx = content.find(start_marker)
            if start_idx != -1:
                end_idx = content.find(end_marker, start_idx + len(start_marker))
                if end_idx != -1:
                    end_idx += len(end_marker)
                    content = content[:start_idx] + content[end_idx:]

            # Remove the fallback to mock data
            mock_fallback_pattern = '      // Return mock data for development if admin service fails\n      return this.getMockDashboardStats();'
            if mock_fallback_pattern in content:
                error_message = '      throw new Error(`Failed to fetch dashboard stats: ${error.message}`);'
                content = content.replace(mock_fallback_pattern, error_message)

            # Fix the missing baseUrl property
            if 'this.baseUrl' in content:
                # Add baseUrl property to the class
                class_start = content.find('class AnalyticsService {')
                if class_start != -1:
                    insert_point = class_start + len('class AnalyticsService {')
                    baseurl_property = '\n  private baseUrl = "/api/admin";'
                    content = content[:insert_point] + baseurl_property + content[insert_point:]

            # Write back the cleaned content
            with open(analytics_service_file, 'w', encoding='utf-8') as f:
                f.write(content)

            modified_files.append('src/services/analyticsService.ts')
            self.stdout.write('✅ Cleaned analyticsService.ts - removed mock dashboard data and fixed baseUrl')

        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Error cleaning analyticsService.ts: {str(e)}')
            )

    def _clean_communication_service(self, frontend_dir, modified_files):
        """Remove mock server references from communicationService.ts"""
        comm_service_file = frontend_dir / 'src' / 'services' / 'communicationService.ts'

        if not comm_service_file.exists():
            return

        try:
            with open(comm_service_file, 'r', encoding='utf-8') as f:
                content = f.read()

            # Remove mock server URL constant
            mock_url_pattern = "const MOCK_SERVER_URL = 'http://localhost:3001/api';"
            if mock_url_pattern in content:
                content = content.replace(mock_url_pattern, '')

            # Remove mock server failover logic
            mock_fallback_start = '    // If the main server is down (network error or 404), try the mock server'
            mock_fallback_end = '      } catch (mockError) {'

            start_idx = content.find(mock_fallback_start)
            if start_idx != -1:
                end_idx = content.find(mock_fallback_end, start_idx)
                if end_idx != -1:
                    end_idx += len(mock_fallback_end)
                    # Find the closing brace of the catch block
                    brace_count = 0
                    for i in range(end_idx, len(content)):
                        if content[i] == '{':
                            brace_count += 1
                        elif content[i] == '}':
                            brace_count -= 1
                            if brace_count == -1:
                                end_idx = i + 1
                                break
                    content = content[:start_idx] + content[end_idx:]

            # Write back the cleaned content
            with open(comm_service_file, 'w', encoding='utf-8') as f:
                f.write(content)

            modified_files.append('src/services/communicationService.ts')
            self.stdout.write('✅ Cleaned communicationService.ts - removed mock server references')

        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Error cleaning communicationService.ts: {str(e)}')
            )