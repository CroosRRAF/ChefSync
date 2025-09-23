"""
Django management command to clear frontend mock data and references
"""

import os
import shutil
from pathlib import Path
from django.core.management.base import BaseCommand
from django.conf import settings


class Command(BaseCommand):
    help = 'Clear frontend mock data and references'

    def add_arguments(self, parser):
        parser.add_argument(
            '--confirm',
            action='store_true',
            help='Confirm deletion of frontend mock data',
        )

    def handle(self, *args, **options):
        if not options['confirm']:
            self.stdout.write(
                self.style.WARNING(
                    'WARNING: This will remove all frontend mock data!\n'
                    'This includes:\n'
                    '  - Mock server files (mock-server.sh)\n'
                    '  - Mock data in service files (userService.ts, analyticsService.ts, etc.)\n'
                    '  - Mock data in component files (Menu.tsx, Schedule.tsx, Map.tsx)\n'
                    '  - Mock server references in communicationService.ts\n'
                    'Use --confirm to proceed with cleanup.'
                )
            )
            return

        self.stdout.write(
            self.style.SUCCESS('Starting frontend mock data cleanup...')
        )

        frontend_dir = Path(settings.BASE_DIR) / 'frontend'
        if not frontend_dir.exists():
            self.stdout.write(
                self.style.ERROR(f'Frontend directory not found: {frontend_dir}')
            )
            return

        try:
            # Track what was removed
            removed_files = []
            modified_files = []

            # 1. Remove mock server files
            mock_server_file = frontend_dir / 'mock-server.sh'
            if mock_server_file.exists():
                mock_server_file.unlink()
                removed_files.append('mock-server.sh')
                self.stdout.write(f'✅ Removed mock server file: {mock_server_file}')

            # 2. Remove mock data from service files
            self._clean_user_service(frontend_dir, modified_files)
            self._clean_analytics_service(frontend_dir, modified_files)
            self._clean_communication_service(frontend_dir, modified_files)

            # 3. Remove mock data from component files
            self._clean_menu_component(frontend_dir, modified_files)
            self._clean_schedule_component(frontend_dir, modified_files)
            self._clean_map_component(frontend_dir, modified_files)

            # 4. Remove any mock directories that might exist
            mocks_dir = frontend_dir / 'src' / 'mocks'
            if mocks_dir.exists():
                shutil.rmtree(mocks_dir)
                removed_files.append('src/mocks/')
                self.stdout.write(f'✅ Removed mocks directory: {mocks_dir}')

            # Summary
            self.stdout.write(
                self.style.SUCCESS(
                    f'\nFrontend mock data cleanup completed!\n'
                    f'Files removed: {len(removed_files)}\n'
                    f'Files modified: {len(modified_files)}\n'
                    f'Total items processed: {len(removed_files) + len(modified_files)}'
                )
            )

            if removed_files:
                self.stdout.write(self.style.SUCCESS('Removed files:'))
                for file in removed_files:
                    self.stdout.write(f'  - {file}')

            if modified_files:
                self.stdout.write(self.style.SUCCESS('Modified files:'))
                for file in modified_files:
                    self.stdout.write(f'  - {file}')

        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Error during frontend mock data cleanup: {str(e)}')
            )
            raise

    def _clean_user_service(self, frontend_dir, modified_files):
        """Remove mock data from userService.ts"""
        user_service_file = frontend_dir / 'src' / 'services' / 'userService.ts'

        if not user_service_file.exists():
            return

        try:
            with open(user_service_file, 'r', encoding='utf-8') as f:
                content = f.read()

            # Remove the getMockUsers method and its usage
            # Find the method definition and remove it
            start_marker = '  private getMockUsers(filters: UserFilters): UserResponse {'
            end_marker = '  }'

            start_idx = content.find(start_marker)
            if start_idx != -1:
                # Find the end of the method
                end_idx = content.find(end_marker, start_idx + len(start_marker))
                if end_idx != -1:
                    end_idx += len(end_marker)
                    content = content[:start_idx] + content[end_idx:]

            # Remove the fallback to mock data in getUsers method
            mock_fallback_pattern = '      // Return mock data for development\n      return this.getMockUsers(filters);'
            if mock_fallback_pattern in content:
                # Replace with proper error handling
                error_message = '      throw new Error(`Failed to fetch users: ${error.message}`);'
                content = content.replace(mock_fallback_pattern, error_message)

            # Write back the cleaned content
            with open(user_service_file, 'w', encoding='utf-8') as f:
                f.write(content)

            modified_files.append('src/services/userService.ts')
            self.stdout.write('✅ Cleaned userService.ts - removed mock data')

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
            self.stdout.write('✅ Cleaned analyticsService.ts - removed mock data and fixed baseUrl')

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

    def _clean_menu_component(self, frontend_dir, modified_files):
        """Remove mock data from Menu.tsx"""
        menu_file = frontend_dir / 'src' / 'pages' / 'Menu.tsx'

        if not menu_file.exists():
            return

        try:
            with open(menu_file, 'r', encoding='utf-8') as f:
                content = f.read()

            # Remove mock menu data
            start_marker = '// Mock menu data'
            end_marker = '];'

            start_idx = content.find(start_marker)
            if start_idx != -1:
                end_idx = content.find(end_marker, start_idx)
                if end_idx != -1:
                    end_idx += len(end_marker)
                    content = content[:start_idx] + content[end_idx:]

            # Replace mock data usage with empty array
            mock_usage_pattern = 'const [menuItems, setMenuItems] = useState<MenuItem[]>(mockMenuItems);'
            if mock_usage_pattern in content:
                content = content.replace(mock_usage_pattern, 'const [menuItems, setMenuItems] = useState<MenuItem[]>([]);')

            mock_filtered_pattern = 'const [filteredItems, setFilteredItems] = useState<MenuItem[]>(mockMenuItems);'
            if mock_filtered_pattern in content:
                content = content.replace(mock_filtered_pattern, 'const [filteredItems, setFilteredItems] = useState<MenuItem[]>([]);')

            # Write back the cleaned content
            with open(menu_file, 'w', encoding='utf-8') as f:
                f.write(content)

            modified_files.append('src/pages/Menu.tsx')
            self.stdout.write('✅ Cleaned Menu.tsx - removed mock menu data')

        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Error cleaning Menu.tsx: {str(e)}')
            )

    def _clean_schedule_component(self, frontend_dir, modified_files):
        """Remove mock data from Schedule.tsx"""
        schedule_file = frontend_dir / 'src' / 'pages' / 'delivery' / 'Schedule.tsx'

        if not schedule_file.exists():
            return

        try:
            with open(schedule_file, 'r', encoding='utf-8') as f:
                content = f.read()

            # Remove mock schedule data
            start_marker = '  // Mock schedule data'
            end_marker = '  ];'

            start_idx = content.find(start_marker)
            if start_idx != -1:
                end_idx = content.find(end_marker, start_idx)
                if end_idx != -1:
                    end_idx += len(end_marker)
                    content = content[:start_idx] + content[end_idx:]

            # Write back the cleaned content
            with open(schedule_file, 'w', encoding='utf-8') as f:
                f.write(content)

            modified_files.append('src/pages/delivery/Schedule.tsx')
            self.stdout.write('✅ Cleaned Schedule.tsx - removed mock schedule data')

        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Error cleaning Schedule.tsx: {str(e)}')
            )

    def _clean_map_component(self, frontend_dir, modified_files):
        """Remove mock data from Map.tsx"""
        map_file = frontend_dir / 'src' / 'pages' / 'delivery' / 'Map.tsx'

        if not map_file.exists():
            return

        try:
            with open(map_file, 'r', encoding='utf-8') as f:
                content = f.read()

            # Remove mock deliveries data
            start_marker = '  // Mock map data - in real app this would be an actual map component'
            end_marker = '  ];'

            start_idx = content.find(start_marker)
            if start_idx != -1:
                end_idx = content.find(end_marker, start_idx)
                if end_idx != -1:
                    end_idx += len(end_marker)
                    content = content[:start_idx] + content[end_idx:]

            # Write back the cleaned content
            with open(map_file, 'w', encoding='utf-8') as f:
                f.write(content)

            modified_files.append('src/pages/delivery/Map.tsx')
            self.stdout.write('✅ Cleaned Map.tsx - removed mock map data')

        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Error cleaning Map.tsx: {str(e)}')
            )