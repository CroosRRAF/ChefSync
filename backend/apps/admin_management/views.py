from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from django.db.models import Count, Sum, Avg, Q, F
from django.utils import timezone
from django.contrib.auth import get_user_model
from datetime import timedelta, datetime
try:
    import psutil
except ImportError:
    psutil = None
import os
from .models import (
    AdminActivityLog, AdminNotification, SystemHealthMetric,
    AdminDashboardWidget, AdminQuickAction, AdminSystemSettings,
    AdminBackupLog
)
from .serializers import (
    AdminActivityLogSerializer, AdminNotificationSerializer,
    SystemHealthMetricSerializer, AdminDashboardWidgetSerializer,
    AdminQuickActionSerializer, AdminSystemSettingsSerializer,
    AdminBackupLogSerializer, DashboardStatsSerializer,
    SystemHealthSerializer, AdminUserSummarySerializer,
    AdminOrderSummarySerializer
)

User = get_user_model()


class AdminDashboardViewSet(viewsets.ViewSet):
    """Admin dashboard analytics and statistics"""
    permission_classes = [IsAuthenticated, IsAdminUser]
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get comprehensive dashboard statistics"""
        try:
            # Calculate date ranges
            now = timezone.now()
            today = now.date()
            week_ago = now - timedelta(days=7)
            month_ago = now - timedelta(days=30)
            
            # Import models from other apps
            from apps.orders.models import Order
            from apps.food.models import Food
            
            # User statistics
            total_users = User.objects.count()
            active_users = User.objects.filter(is_active=True).count()
            new_users_today = User.objects.filter(date_joined__date=today).count()
            new_users_this_week = User.objects.filter(date_joined__gte=week_ago).count()
            new_users_this_month = User.objects.filter(date_joined__gte=month_ago).count()
            
            # Calculate user growth
            previous_week_users = User.objects.filter(
                date_joined__gte=week_ago - timedelta(days=7),
                date_joined__lt=week_ago
            ).count()
            user_growth = ((new_users_this_week - previous_week_users) / max(previous_week_users, 1)) * 100
            
            # Chef statistics
            total_chefs = User.objects.filter(role='cook').count()
            active_chefs = User.objects.filter(role='cook', is_active=True).count()
            pending_chef_approvals = User.objects.filter(
                role='cook', 
                is_active=False
            ).count()
            
            # Order statistics
            total_orders = Order.objects.count()
            orders_today = Order.objects.filter(created_at__date=today).count()
            orders_this_week = Order.objects.filter(created_at__gte=week_ago).count()
            orders_this_month = Order.objects.filter(created_at__gte=month_ago).count()
            
            # Calculate order growth
            previous_week_orders = Order.objects.filter(
                created_at__gte=week_ago - timedelta(days=7),
                created_at__lt=week_ago
            ).count()
            order_growth = ((orders_this_week - previous_week_orders) / max(previous_week_orders, 1)) * 100
            
            # Revenue statistics
            total_revenue = Order.objects.filter(
                payment_status='paid'
            ).aggregate(total=Sum('total_amount'))['total'] or 0
            
            revenue_today = Order.objects.filter(
                payment_status='paid',
                created_at__date=today
            ).aggregate(total=Sum('total_amount'))['total'] or 0
            
            revenue_this_week = Order.objects.filter(
                payment_status='paid',
                created_at__gte=week_ago
            ).aggregate(total=Sum('total_amount'))['total'] or 0
            
            revenue_this_month = Order.objects.filter(
                payment_status='paid',
                created_at__gte=month_ago
            ).aggregate(total=Sum('total_amount'))['total'] or 0
            
            # Calculate revenue growth
            previous_week_revenue = Order.objects.filter(
                payment_status='paid',
                created_at__gte=week_ago - timedelta(days=7),
                created_at__lt=week_ago
            ).aggregate(total=Sum('total_amount'))['total'] or 0
            revenue_growth = ((revenue_this_week - previous_week_revenue) / max(previous_week_revenue, 1)) * 100
            
            # Food statistics
            total_foods = Food.objects.count()
            active_foods = Food.objects.filter(is_available=True).count()
            pending_food_approvals = Food.objects.filter(
                status='Pending'
            ).count()
            
            # System statistics
            system_health_score = self._calculate_system_health()
            active_sessions = self._get_active_sessions()
            unread_notifications = AdminNotification.objects.filter(
                is_read=False, is_active=True
            ).count()
            pending_backups = AdminBackupLog.objects.filter(
                status='pending'
            ).count()
            
            stats_data = {
                'total_users': total_users,
                'active_users': active_users,
                'new_users_today': new_users_today,
                'new_users_this_week': new_users_this_week,
                'new_users_this_month': new_users_this_month,
                'user_growth': round(user_growth, 2),
                
                'total_chefs': total_chefs,
                'active_chefs': active_chefs,
                'pending_chef_approvals': pending_chef_approvals,
                'chef_growth': 0,  # Calculate based on chef registrations
                
                'total_orders': total_orders,
                'orders_today': orders_today,
                'orders_this_week': orders_this_week,
                'orders_this_month': orders_this_month,
                'order_growth': round(order_growth, 2),
                
                'total_revenue': float(total_revenue),
                'revenue_today': float(revenue_today),
                'revenue_this_week': float(revenue_this_week),
                'revenue_this_month': float(revenue_this_month),
                'revenue_growth': round(revenue_growth, 2),
                
                'total_foods': total_foods,
                'active_foods': active_foods,
                'pending_food_approvals': pending_food_approvals,
                
                'system_health_score': system_health_score,
                'active_sessions': active_sessions,
                'unread_notifications': unread_notifications,
                'pending_backups': pending_backups,
            }
            
            serializer = DashboardStatsSerializer(stats_data)
            return Response(serializer.data)
            
        except Exception as e:
            return Response(
                {'error': f'Failed to fetch dashboard stats: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['get'])
    def recent_activities(self, request):
        """Get recent admin activities"""
        try:
            limit = int(request.query_params.get('limit', 10))
            activities = AdminActivityLog.objects.select_related('admin').order_by('-timestamp')[:limit]
            serializer = AdminActivityLogSerializer(activities, many=True)
            return Response(serializer.data)
        except Exception as e:
            return Response(
                {'error': f'Failed to fetch recent activities: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['get'])
    def recent_orders(self, request):
        """Get recent orders for admin dashboard"""
        try:
            limit = int(request.query_params.get('limit', 10))
            from apps.orders.models import Order
            recent_orders = Order.objects.select_related('customer', 'chef').order_by('-created_at')[:limit]
            serializer = AdminOrderSummarySerializer(recent_orders, many=True)
            return Response(serializer.data)
        except Exception as e:
            return Response(
                {'error': f'Failed to fetch recent orders: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['get'])
    def system_health(self, request):
        """Get detailed system health information"""
        try:
            health_data = {
                'overall_health': 'Good',
                'health_score': self._calculate_system_health(),
                'cpu_usage': psutil.cpu_percent(interval=1) if psutil else 0,
                'memory_usage': psutil.virtual_memory().percent if psutil else 0,
                'disk_usage': psutil.disk_usage('/').percent if psutil else 0,
                'database_connections': 0,  # Would need database-specific monitoring
                'response_time': 0,  # Would need monitoring setup
                'error_rate': 0,  # Would need error tracking
                'uptime': 'Unknown',  # Would need system monitoring
                'last_backup': None,
                'alerts': []
            }

            # Calculate overall health status
            avg_usage = (health_data['cpu_usage'] + health_data['memory_usage'] + health_data['disk_usage']) / 3
            if avg_usage > 80:
                health_data['overall_health'] = 'Critical'
                health_data['alerts'].append('High resource usage detected')
            elif avg_usage > 60:
                health_data['overall_health'] = 'Warning'
                health_data['alerts'].append('Elevated resource usage')
            else:
                health_data['overall_health'] = 'Good'

            serializer = SystemHealthSerializer(health_data)
            return Response(serializer.data)

        except Exception as e:
            return Response(
                {'error': f'Failed to fetch system health: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def _calculate_system_health(self):
        """Calculate overall system health score"""
        try:
            if psutil is None:
                return 85.0  # Default healthy score if psutil not available
            
            cpu_usage = psutil.cpu_percent(interval=1)
            memory = psutil.virtual_memory()
            disk = psutil.disk_usage('/')
            
            # Simple health calculation
            health_score = 100 - (cpu_usage + memory.percent + disk.percent) / 3
            return max(0, min(100, health_score))
        except:
            return 85.0  # Default healthy score
    
    def _get_active_sessions(self):
        """Get number of active user sessions"""
        try:
            # This is a simplified implementation
            # In production, you'd track active sessions properly
            return User.objects.filter(
                last_login__gte=timezone.now() - timedelta(hours=1)
            ).count()
        except:
            return 0


class AdminUserManagementViewSet(viewsets.ViewSet):
    """Complete user management for admins"""
    permission_classes = [IsAuthenticated, IsAdminUser]
    
    @action(detail=False, methods=['get'])
    def pending_approvals(self, request):
        """Get users pending approval (cooks and delivery agents)"""
        try:
            role = request.query_params.get('role')
            if not role:
                return Response(
                    {'error': 'Role parameter is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Validate role
            valid_roles = ['cook', 'delivery_agent']
            if role not in valid_roles:
                return Response(
                    {'error': f'Invalid role. Must be one of: {valid_roles}'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Get pending users based on role
            if role == 'cook':
                pending_users = User.objects.filter(
                    role='cook',
                    approval_status='pending'
                ).order_by('date_joined')
            elif role == 'delivery_agent':
                pending_users = User.objects.filter(
                    role='delivery_agent',
                    approval_status='pending'
                ).order_by('date_joined')

            users_data = []
            for user in pending_users:
                # Get user documents
                documents = []
                try:
                    for doc in user.documents.all():
                        documents.append({
                            'id': doc.id,
                            'file_name': doc.file_name,
                            'document_type': doc.document_type.name if doc.document_type else 'Unknown',
                            'uploaded_at': doc.uploaded_at,
                            'file_url': doc.file.url if doc.file else None
                        })
                except Exception as e:
                    print(f"Error getting documents for user {user.user_id}: {e}")

                users_data.append({
                    'id': user.user_id,
                    'name': user.name or f"{user.first_name} {user.last_name}".strip(),
                    'email': user.email,
                    'role': user.role,
                    'phone_no': user.phone_no,
                    'address': user.address,
                    'created_at': user.date_joined,
                    'approval_status': user.approval_status,
                    'documents': documents
                })

            return Response({
                'users': users_data,
                'count': len(users_data)
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response(
                {'error': f'Failed to fetch pending approvals: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'])
    def approve_user(self, request, pk=None):
        """Approve or reject a user"""
        try:
            user = User.objects.get(user_id=pk, role__in=['cook', 'delivery_agent'])
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        
        action = request.data.get('action')
        notes = request.data.get('notes', '')
        
        if action not in ['approve', 'reject']:
            return Response(
                {'error': 'Action must be either "approve" or "reject"'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if action == 'approve':
            user.approval_status = 'approved'
            user.approval_notes = notes
            user.approved_by = request.user
            user.approved_at = timezone.now()
            user.is_active = True  # Activate the user
            user.save()
            
            # Make all user documents visible to admin after approval
            user.documents.update(is_visible_to_admin=True)
            
            # Send approval email
            from apps.authentication.services.email_service import EmailService
            EmailService.send_approval_email(user, 'approved', notes)
            
            # Log activity
            AdminActivityLog.objects.create(
                admin=request.user,
                action='approve',
                resource_type='user',
                resource_id=str(user.user_id),
                description=f'Approved {user.role} user {user.email}',
                ip_address=request.META.get('REMOTE_ADDR'),
                user_agent=request.META.get('HTTP_USER_AGENT'),
            )
            
            return Response({
                'message': 'User approved successfully',
                'user': {
                    'id': user.user_id,
                    'name': user.name,
                    'email': user.email,
                    'role': user.role,
                    'approval_status': user.approval_status
                }
            }, status=status.HTTP_200_OK)
        
        elif action == 'reject':
            user.approval_status = 'rejected'
            user.approval_notes = notes
            user.approved_by = request.user
            user.approved_at = timezone.now()
            user.save()
            
            # Send rejection email
            from apps.authentication.services.email_service import EmailService
            EmailService.send_approval_email(user, 'rejected', notes)
            
            # Log activity
            AdminActivityLog.objects.create(
                admin=request.user,
                action='reject',
                resource_type='user',
                resource_id=str(user.user_id),
                description=f'Rejected {user.role} user {user.email}',
                ip_address=request.META.get('REMOTE_ADDR'),
                user_agent=request.META.get('HTTP_USER_AGENT'),
            )
            
            return Response({
                'message': 'User rejected successfully',
                'user': {
                    'id': user.user_id,
                    'name': user.name,
                    'email': user.email,
                    'role': user.role,
                    'approval_status': user.approval_status
                }
            }, status=status.HTTP_200_OK)
    
    @action(detail=False, methods=['get'])
    def list_users(self, request):
        """Get paginated list of users with filters"""
        try:
            # Get query parameters with validation
            try:
                page = int(request.query_params.get('page', 1))
                limit = int(request.query_params.get('limit', 25))
                if page < 1 or limit < 1 or limit > 100:
                    return Response(
                        {'error': 'Invalid pagination parameters'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            except (ValueError, TypeError):
                return Response(
                    {'error': 'Invalid page or limit parameter'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            search = request.query_params.get('search', '').strip()
            role = request.query_params.get('role', '').strip()
            status_param = request.query_params.get('status', '').strip()
            sort_by = request.query_params.get('sort_by', 'date_joined').strip()
            sort_order = request.query_params.get('sort_order', 'desc').strip()
            
            # Validate sort_by field
            allowed_sort_fields = ['date_joined', 'name', 'email', 'last_login']
            if sort_by not in allowed_sort_fields:
                sort_by = 'date_joined'
            
            # Validate sort_order
            if sort_order not in ['asc', 'desc']:
                sort_order = 'desc'
            
            # Build query
            queryset = User.objects.all()
            
            # Apply filters
            if search:
                queryset = queryset.filter(
                    Q(email__icontains=search) |
                    Q(name__icontains=search)
                )
            
            if role:
                queryset = queryset.filter(role=role)
            
            if status_param == 'active':
                queryset = queryset.filter(is_active=True)
            elif status_param == 'inactive':
                queryset = queryset.filter(is_active=False)
            
            # Apply sorting
            if sort_order == 'desc':
                sort_by = f'-{sort_by}'
            queryset = queryset.order_by(sort_by)
            
            # Get total count before pagination
            total_count = queryset.count()
            
            # Pagination
            start = (page - 1) * limit
            end = start + limit
            users = queryset[start:end]
            
            # Get user summaries with error handling
            user_data = []
            for user in users:
                try:
                    # Get user statistics with error handling
                    from apps.orders.models import Order
                    
                    # Count orders safely
                    try:
                        total_orders = Order.objects.filter(customer=user).count()
                    except Exception as e:
                        print(f"Error counting orders for user {user.user_id}: {e}")
                        total_orders = 0
                    
                    # Calculate total spent safely
                    try:
                        total_spent_result = Order.objects.filter(
                            customer=user, payment_status='paid'
                        ).aggregate(total=Sum('total_amount'))
                        total_spent = total_spent_result['total'] or 0
                    except Exception as e:
                        print(f"Error calculating total spent for user {user.user_id}: {e}")
                        total_spent = 0
                    
                    user_data.append({
                        'id': user.user_id,
                        'email': user.email,
                        'name': user.name or '',
                        'role': user.role,
                        'is_active': user.is_active,
                        'last_login': user.last_login,
                        'date_joined': user.date_joined,
                        'total_orders': total_orders,
                        'total_spent': float(total_spent) if total_spent else 0.0,
                    })
                    
                except Exception as e:
                    print(f"Error processing user {user.user_id}: {e}")
                    # Add user with default values if processing fails
                    user_data.append({
                        'id': user.user_id,
                        'email': user.email,
                        'name': user.name or '',
                        'role': user.role,
                        'is_active': user.is_active,
                        'last_login': user.last_login,
                        'date_joined': user.date_joined,
                        'total_orders': 0,
                        'total_spent': 0.0,
                    })
            
            # Calculate pagination info
            total_pages = (total_count + limit - 1) // limit
            
            return Response({
                'users': user_data,
                'pagination': {
                    'page': page,
                    'limit': limit,
                    'total': total_count,
                    'pages': total_pages,
                }
            })
            
        except Exception as e:
            # Enhanced error logging
            import traceback
            print(f"Error in list_users: {str(e)}")
            print(f"Traceback: {traceback.format_exc()}")
            print(f"Request data: {request.query_params}")
            
            return Response(
                {'error': f'Failed to fetch users: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'])
    def bulk_activate(self, request):
        """Bulk activate users"""
        try:
            user_ids = request.data.get('user_ids', [])
            if not user_ids:
                return Response(
                    {'error': 'user_ids list is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Update users
            updated_count = User.objects.filter(
                user_id__in=user_ids,
                is_active=False
            ).update(is_active=True)
            
            # Log activity
            AdminActivityLog.objects.create(
                admin=request.user,
                action='bulk_update',
                resource_type='users',
                resource_id=','.join(map(str, user_ids)),
                description=f'Bulk activated {updated_count} users',
                ip_address=request.META.get('REMOTE_ADDR'),
                user_agent=request.META.get('HTTP_USER_AGENT'),
            )
            
            return Response({
                'message': f'Successfully activated {updated_count} users',
                'updated_count': updated_count
            })
            
        except Exception as e:
            return Response(
                {'error': f'Failed to bulk activate users: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'])
    def bulk_deactivate(self, request):
        """Bulk deactivate users"""
        try:
            user_ids = request.data.get('user_ids', [])
            if not user_ids:
                return Response(
                    {'error': 'user_ids list is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Don't allow deactivating admin users
            admin_users = User.objects.filter(
                user_id__in=user_ids,
                role='admin',
                is_active=True
            ).values_list('user_id', flat=True)
            
            if admin_users:
                return Response(
                    {'error': 'Cannot deactivate admin users'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Update users
            updated_count = User.objects.filter(
                user_id__in=user_ids,
                is_active=True
            ).exclude(role='admin').update(is_active=False)
            
            # Log activity
            AdminActivityLog.objects.create(
                admin=request.user,
                action='bulk_update',
                resource_type='users',
                resource_id=','.join(map(str, user_ids)),
                description=f'Bulk deactivated {updated_count} users',
                ip_address=request.META.get('REMOTE_ADDR'),
                user_agent=request.META.get('HTTP_USER_AGENT'),
            )
            
            return Response({
                'message': f'Successfully deactivated {updated_count} users',
                'updated_count': updated_count
            })
            
        except Exception as e:
            return Response(
                {'error': f'Failed to bulk deactivate users: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'])
    def bulk_delete(self, request):
        """Bulk delete users (soft delete by deactivating)"""
        try:
            user_ids = request.data.get('user_ids', [])
            if not user_ids:
                return Response(
                    {'error': 'user_ids list is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Don't allow deleting admin users
            admin_users = User.objects.filter(
                user_id__in=user_ids,
                role='admin'
            ).values_list('user_id', flat=True)
            
            if admin_users:
                return Response(
                    {'error': 'Cannot delete admin users'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Soft delete by deactivating
            updated_count = User.objects.filter(
                user_id__in=user_ids
            ).exclude(role='admin').update(is_active=False)
            
            # Log activity
            AdminActivityLog.objects.create(
                admin=request.user,
                action='bulk_delete',
                resource_type='users',
                resource_id=','.join(map(str, user_ids)),
                description=f'Bulk deleted {updated_count} users',
                ip_address=request.META.get('REMOTE_ADDR'),
                user_agent=request.META.get('HTTP_USER_AGENT'),
            )
            
            return Response({
                'message': f'Successfully deleted {updated_count} users',
                'updated_count': updated_count
            })
            
        except Exception as e:
            return Response(
                {'error': f'Failed to bulk delete users: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['get'])
    def details(self, request, pk=None):
        """Get detailed user information"""
        try:
            user = User.objects.get(pk=pk)
            
            # Get user statistics
            from apps.orders.models import Order
            total_orders = Order.objects.filter(customer=user).count()
            total_spent = Order.objects.filter(
                customer=user, payment_status='paid'
            ).aggregate(total=Sum('total_amount'))['total'] or 0
            
            # Get recent orders
            recent_orders = Order.objects.filter(customer=user).order_by('-created_at')[:5]
            recent_orders_data = []
            for order in recent_orders:
                recent_orders_data.append({
                    'id': order.id,
                    'order_number': order.order_number,
                    'status': order.status,
                    'total_amount': float(order.total_amount),
                    'created_at': order.created_at,
                })
            
            # Get user activity logs
            activity_logs = AdminActivityLog.objects.filter(
                admin=user
            ).order_by('-timestamp')[:10]
            
            activity_data = []
            for log in activity_logs:
                activity_data.append({
                    'id': log.id,
                    'action': log.action,
                    'resource_type': log.resource_type,
                    'description': log.description,
                    'timestamp': log.timestamp,
                })
            
            user_data = {
                'id': user.user_id,
                'email': user.email,
                'name': user.name,
                'phone_no': user.phone_no,
                'address': user.address,
                'role': user.role,
                'is_active': user.is_active,
                'email_verified': user.email_verified,
                'last_login': user.last_login,
                'date_joined': user.date_joined,
                'failed_login_attempts': user.failed_login_attempts,
                'account_locked': user.account_locked,
                'statistics': {
                    'total_orders': total_orders,
                    'total_spent': float(total_spent),
                },
                'recent_orders': recent_orders_data,
                'activity_logs': activity_data,
            }
            
            return Response(user_data)
            
        except User.DoesNotExist:
            return Response(
                {'error': 'User not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': f'Failed to fetch user details: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['patch'])
    def update_user(self, request, pk=None):
        """Update user information"""
        try:
            user = User.objects.get(pk=pk)
            
            # Get update data
            update_data = {}
            allowed_fields = ['name', 'phone_no', 'address', 'role', 'is_active']
            
            for field in allowed_fields:
                if field in request.data:
                    update_data[field] = request.data[field]
            
            # Validate role changes
            if 'role' in update_data:
                valid_roles = [choice[0] for choice in User.ROLE_CHOICES]
                if update_data['role'] not in valid_roles:
                    return Response(
                        {'error': f'Invalid role. Valid options: {valid_roles}'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                # Don't allow changing admin roles unless current user is admin
                if update_data['role'] == 'admin' and request.user.role != 'admin':
                    return Response(
                        {'error': 'Only admins can assign admin role'},
                        status=status.HTTP_403_FORBIDDEN
                    )
            
            # Update user
            old_values = {}
            for field in update_data:
                old_values[field] = getattr(user, field)
                setattr(user, field, update_data[field])
            
            user.save()
            
            # Log activity
            changes = []
            for field in update_data:
                if old_values[field] != update_data[field]:
                    changes.append(f'{field}: {old_values[field]} -> {update_data[field]}')
            
            AdminActivityLog.objects.create(
                admin=request.user,
                action='update',
                resource_type='user',
                resource_id=str(user.user_id),
                description=f'Updated user {user.email}: {", ".join(changes)}',
                ip_address=request.META.get('REMOTE_ADDR'),
                user_agent=request.META.get('HTTP_USER_AGENT'),
            )
            
            return Response({
                'message': 'User updated successfully',
                'user': {
                    'id': user.user_id,
                    'email': user.email,
                    'name': user.name,
                    'role': user.role,
                    'is_active': user.is_active,
                }
            })
            
        except User.DoesNotExist:
            return Response(
                {'error': 'User not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': f'Failed to update user: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def export_users(self, request):
        """Export users data as CSV"""
        try:
            import csv
            from django.http import HttpResponse
            from io import StringIO
            
            # Get query parameters
            role = request.query_params.get('role', '')
            status = request.query_params.get('status', '')
            
            # Build queryset
            queryset = User.objects.all()
            
            if role:
                queryset = queryset.filter(role=role)
            
            if status == 'active':
                queryset = queryset.filter(is_active=True)
            elif status == 'inactive':
                queryset = queryset.filter(is_active=False)
            
            # Create CSV response
            response = HttpResponse(content_type='text/csv')
            response['Content-Disposition'] = 'attachment; filename="users_export.csv"'
            
            writer = csv.writer(response)
            
            # Write header
            writer.writerow([
                'ID', 'Email', 'Name', 'Phone', 'Role', 'Active', 
                'Email Verified', 'Date Joined', 'Last Login'
            ])
            
            # Write data
            for user in queryset:
                writer.writerow([
                    user.user_id,
                    user.email,
                    user.name,
                    user.phone_no or '',
                    user.role,
                    'Yes' if user.is_active else 'No',
                    'Yes' if user.email_verified else 'No',
                    user.date_joined.strftime('%Y-%m-%d %H:%M:%S') if user.date_joined else '',
                    user.last_login.strftime('%Y-%m-%d %H:%M:%S') if user.last_login else '',
                ])
            
            # Log activity
            AdminActivityLog.objects.create(
                admin=request.user,
                action='export',
                resource_type='users',
                resource_id='export',
                description=f'Exported {queryset.count()} users to CSV',
                ip_address=request.META.get('REMOTE_ADDR'),
                user_agent=request.META.get('HTTP_USER_AGENT'),
            )
            
            return response
            
        except Exception as e:
            return Response(
                {'error': f'Failed to export users: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class AdminOrderManagementViewSet(viewsets.ViewSet):
    """Order oversight and management"""
    permission_classes = [IsAuthenticated, IsAdminUser]
    
    @action(detail=False, methods=['get'])
    def list_orders(self, request):
        """Get paginated list of orders with filters"""
        try:
            from apps.orders.models import Order
            
            # Get query parameters
            page = int(request.query_params.get('page', 1))
            limit = int(request.query_params.get('limit', 25))
            search = request.query_params.get('search', '')
            status = request.query_params.get('status', '')
            payment_status = request.query_params.get('payment_status', '')
            sort_by = request.query_params.get('sort_by', 'created_at')
            sort_order = request.query_params.get('sort_order', 'desc')
            
            # Build query
            queryset = Order.objects.select_related('customer').all()
            
            if search:
                queryset = queryset.filter(
                    Q(order_number__icontains=search) |
                    Q(customer__email__icontains=search) |
                    Q(customer__name__icontains=search)
                )
            
            if status:
                queryset = queryset.filter(status=status)
            
            if payment_status:
                queryset = queryset.filter(payment_status=payment_status)
            
            # Apply sorting
            if sort_order == 'desc':
                sort_by = f'-{sort_by}'
            queryset = queryset.order_by(sort_by)
            
            # Pagination
            start = (page - 1) * limit
            end = start + limit
            orders = queryset[start:end]
            
            # Get order summaries
            order_data = []
            for order in orders:
                order_data.append({
                    'id': order.id,
                    'order_number': order.order_number,
                    'customer_name': order.customer.name if order.customer else 'Unknown',
                    'customer_email': order.customer.email if order.customer else '',
                    'status': order.status,
                    'total_amount': float(order.total_amount),
                    'created_at': order.created_at,
                    'updated_at': order.updated_at,
                    'payment_status': order.payment_status,
                    'items_count': order.items.count(),
                })
            
            # Get total count for pagination
            total_count = queryset.count()
            
            return Response({
                'orders': order_data,
                'pagination': {
                    'page': page,
                    'limit': limit,
                    'total': total_count,
                    'pages': (total_count + limit - 1) // limit,
                }
            })
            
        except Exception as e:
            return Response(
                {'error': f'Failed to fetch orders: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['patch'])
    def update_status(self, request, pk=None):
        """Update order status"""
        try:
            from apps.orders.models import Order
            order = Order.objects.get(pk=pk)
            
            new_status = request.data.get('status')
            if not new_status:
                return Response(
                    {'error': 'Status is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Validate status
            valid_statuses = [choice[0] for choice in Order.ORDER_STATUS_CHOICES]
            if new_status not in valid_statuses:
                return Response(
                    {'error': f'Invalid status. Valid options: {valid_statuses}'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            old_status = order.status
            order.status = new_status
            order.updated_at = timezone.now()
            order.save()
            
            # Log the status change
            AdminActivityLog.objects.create(
                admin=request.user,
                action='update',
                resource_type='order',
                resource_id=str(order.id),
                description=f'Updated order {order.order_number} status from {old_status} to {new_status}',
                ip_address=request.META.get('REMOTE_ADDR'),
                user_agent=request.META.get('HTTP_USER_AGENT'),
            )
            
            return Response({
                'message': f'Order status updated to {new_status}',
                'order': {
                    'id': order.id,
                    'order_number': order.order_number,
                    'status': order.status,
                    'updated_at': order.updated_at,
                }
            })
            
        except Order.DoesNotExist:
            return Response(
                {'error': 'Order not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': f'Failed to update order status: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['get'])
    def details(self, request, pk=None):
        """Get detailed order information"""
        try:
            from apps.orders.models import Order
            order = Order.objects.select_related('customer', 'chef', 'delivery_partner').get(pk=pk)
            
            # Get order items
            items = []
            for item in order.items.select_related('food').all():
                items.append({
                    'id': item.id,
                    'food_name': item.food_name,
                    'quantity': item.quantity,
                    'unit_price': float(item.unit_price),
                    'total_price': float(item.total_price),
                    'special_instructions': item.special_instructions,
                })
            
            order_data = {
                'id': order.id,
                'order_number': order.order_number,
                'customer': {
                    'id': order.customer.id,
                    'name': order.customer.name,
                    'email': order.customer.email,
                    'phone': order.customer.phone_no,
                } if order.customer else None,
                'chef': {
                    'id': order.chef.id,
                    'name': order.chef.name,
                    'email': order.chef.email,
                } if order.chef else None,
                'delivery_partner': {
                    'id': order.delivery_partner.id,
                    'name': order.delivery_partner.name,
                    'email': order.delivery_partner.email,
                } if order.delivery_partner else None,
                'status': order.status,
                'payment_status': order.payment_status,
                'payment_method': order.payment_method,
                'subtotal': float(order.subtotal),
                'tax_amount': float(order.tax_amount),
                'delivery_fee': float(order.delivery_fee),
                'discount_amount': float(order.discount_amount),
                'total_amount': float(order.total_amount),
                'delivery_address': order.delivery_address,
                'delivery_instructions': order.delivery_instructions,
                'estimated_delivery_time': order.estimated_delivery_time,
                'actual_delivery_time': order.actual_delivery_time,
                'customer_notes': order.customer_notes,
                'chef_notes': order.chef_notes,
                'admin_notes': order.admin_notes,
                'items': items,
                'created_at': order.created_at,
                'updated_at': order.updated_at,
            }
            
            return Response(order_data)
            
        except Order.DoesNotExist:
            return Response(
                {'error': 'Order not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': f'Failed to fetch order details: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['patch'])
    def assign_chef(self, request, pk=None):
        """Assign order to a chef"""
        try:
            from apps.orders.models import Order
            order = Order.objects.get(pk=pk)
            
            chef_id = request.data.get('chef_id')
            if not chef_id:
                return Response(
                    {'error': 'chef_id is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Verify chef exists and has correct role
            chef = User.objects.get(pk=chef_id, role='cook', is_active=True)
            
            # Update order
            old_chef = order.chef
            order.chef = chef
            order.save()
            
            # Log activity
            AdminActivityLog.objects.create(
                admin=request.user,
                action='assign',
                resource_type='order',
                resource_id=str(order.id),
                description=f'Assigned order {order.order_number} to chef {chef.name}',
                ip_address=request.META.get('REMOTE_ADDR'),
                user_agent=request.META.get('HTTP_USER_AGENT'),
            )
            
            return Response({
                'message': f'Order assigned to chef {chef.name}',
                'order': {
                    'id': order.id,
                    'order_number': order.order_number,
                    'chef': {
                        'id': chef.id,
                        'name': chef.name,
                        'email': chef.email,
                    }
                }
            })
            
        except User.DoesNotExist:
            return Response(
                {'error': 'Chef not found or not active'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Order.DoesNotExist:
            return Response(
                {'error': 'Order not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': f'Failed to assign chef: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['patch'])
    def assign_delivery_partner(self, request, pk=None):
        """Assign order to a delivery partner"""
        try:
            from apps.orders.models import Order
            order = Order.objects.get(pk=pk)
            
            partner_id = request.data.get('partner_id')
            if not partner_id:
                return Response(
                    {'error': 'partner_id is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Verify delivery partner exists and has correct role
            partner = User.objects.get(pk=partner_id, role='delivery_agent', is_active=True)
            
            # Update order
            old_partner = order.delivery_partner
            order.delivery_partner = partner
            order.save()
            
            # Log activity
            AdminActivityLog.objects.create(
                admin=request.user,
                action='assign',
                resource_type='order',
                resource_id=str(order.id),
                description=f'Assigned order {order.order_number} to delivery partner {partner.name}',
                ip_address=request.META.get('REMOTE_ADDR'),
                user_agent=request.META.get('HTTP_USER_AGENT'),
            )
            
            return Response({
                'message': f'Order assigned to delivery partner {partner.name}',
                'order': {
                    'id': order.id,
                    'order_number': order.order_number,
                    'delivery_partner': {
                        'id': partner.id,
                        'name': partner.name,
                        'email': partner.email,
                    }
                }
            })
            
        except User.DoesNotExist:
            return Response(
                {'error': 'Delivery partner not found or not active'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Order.DoesNotExist:
            return Response(
                {'error': 'Order not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': f'Failed to assign delivery partner: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def available_chefs(self, request):
        """Get list of available chefs for order assignment"""
        try:
            chefs = User.objects.filter(
                role='cook',
                is_active=True
            ).values('id', 'name', 'email')
            
            return Response({
                'chefs': list(chefs)
            })
            
        except Exception as e:
            return Response(
                {'error': f'Failed to fetch available chefs: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def available_delivery_partners(self, request):
        """Get list of available delivery partners for order assignment"""
        try:
            partners = User.objects.filter(
                role='delivery_agent',
                is_active=True
            ).values('id', 'name', 'email')
            
            return Response({
                'partners': list(partners)
            })
            
        except Exception as e:
            return Response(
                {'error': f'Failed to fetch available delivery partners: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class AdminNotificationViewSet(viewsets.ModelViewSet):
    """Admin notifications management"""
    queryset = AdminNotification.objects.all()
    serializer_class = AdminNotificationSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    
    def get_queryset(self):
        """Filter notifications based on query parameters"""
        queryset = self.queryset
        
        # Filter by read status
        is_read = self.request.query_params.get('is_read')
        if is_read is not None:
            queryset = queryset.filter(is_read=is_read.lower() == 'true')
        
        # Filter by notification type
        notification_type = self.request.query_params.get('type')
        if notification_type:
            queryset = queryset.filter(notification_type=notification_type)
        
        # Filter by priority
        priority = self.request.query_params.get('priority')
        if priority:
            queryset = queryset.filter(priority=priority)
        
        # Filter by active status
        is_active = self.request.query_params.get('is_active')
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        
        return queryset.order_by('-created_at')
    
    @action(detail=True, methods=['patch'])
    def mark_read(self, request, pk=None):
        """Mark notification as read"""
        notification = self.get_object()
        notification.is_read = True
        notification.read_at = timezone.now()
        notification.save()
        
        serializer = self.get_serializer(notification)
        return Response(serializer.data)
    
    @action(detail=False, methods=['patch'])
    def mark_all_read(self, request):
        """Mark all notifications as read"""
        updated_count = AdminNotification.objects.filter(
            is_read=False, is_active=True
        ).update(
            is_read=True,
            read_at=timezone.now()
        )
        
        return Response({
            'message': f'Marked {updated_count} notifications as read'
        })
    
    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        """Get count of unread notifications"""
        count = AdminNotification.objects.filter(
            is_read=False, is_active=True
        ).count()
        
        return Response({'unread_count': count})


class AdminSystemSettingsViewSet(viewsets.ModelViewSet):
    """System settings management"""
    queryset = AdminSystemSettings.objects.all()
    serializer_class = AdminSystemSettingsSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    lookup_field = 'key'
    
    def get_queryset(self):
        """Filter settings based on query parameters"""
        queryset = self.queryset
        
        # Filter by category
        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(category=category)
        
        # Filter by public settings
        is_public = self.request.query_params.get('is_public')
        if is_public is not None:
            queryset = queryset.filter(is_public=is_public.lower() == 'true')
        
        return queryset.order_by('category', 'key')
    
    def perform_update(self, serializer):
        """Track who updated the setting"""
        serializer.save(updated_by=self.request.user)
        
        # Log activity
        AdminActivityLog.objects.create(
            admin=self.request.user,
            action='update',
            resource_type='settings',
            resource_id=serializer.instance.key,
            description=f'Updated setting {serializer.instance.key}',
            ip_address=self.request.META.get('REMOTE_ADDR'),
            user_agent=self.request.META.get('HTTP_USER_AGENT'),
        )


class AdminActivityLogViewSet(viewsets.ReadOnlyModelViewSet):
    """Admin activity logs (read-only)"""
    queryset = AdminActivityLog.objects.all()
    serializer_class = AdminActivityLogSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    
    def get_queryset(self):
        """Filter activity logs based on query parameters"""
        queryset = self.queryset.select_related('admin')
        
        # Filter by admin
        admin_id = self.request.query_params.get('admin')
        if admin_id:
            queryset = queryset.filter(admin_id=admin_id)
        
        # Filter by action
        action = self.request.query_params.get('action')
        if action:
            queryset = queryset.filter(action=action)
        
        # Filter by resource type
        resource_type = self.request.query_params.get('resource_type')
        if resource_type:
            queryset = queryset.filter(resource_type=resource_type)
        
        # Filter by date range
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        
        if start_date:
            queryset = queryset.filter(timestamp__date__gte=start_date)
        if end_date:
            queryset = queryset.filter(timestamp__date__lte=end_date)
        
        return queryset.order_by('-timestamp')