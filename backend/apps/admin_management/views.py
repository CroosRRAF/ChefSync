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
            total_chefs = User.objects.filter(role='chef').count()
            active_chefs = User.objects.filter(role='chef', is_active=True).count()
            pending_chef_approvals = User.objects.filter(
                role='chef', 
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
                is_available=False
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
            activities = AdminActivityLog.objects.select_related('user').order_by('-created_at')[:limit]
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
            recent_orders = Order.objects.select_related('customer', 'assigned_cook').order_by('-created_at')[:limit]
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
    def list_users(self, request):
        """Get paginated list of users with filters"""
        try:
            # Get query parameters
            page = int(request.query_params.get('page', 1))
            limit = int(request.query_params.get('limit', 25))
            search = request.query_params.get('search', '')
            role = request.query_params.get('role', '')
            status = request.query_params.get('status', '')
            sort_by = request.query_params.get('sort_by', 'date_joined')
            sort_order = request.query_params.get('sort_order', 'desc')
            
            # Build query
            queryset = User.objects.all()
            
            if search:
                queryset = queryset.filter(
                    Q(email__icontains=search) |
                    Q(first_name__icontains=search) |
                    Q(last_name__icontains=search)
                )
            
            if role:
                queryset = queryset.filter(role=role)
            
            if status == 'active':
                queryset = queryset.filter(is_active=True)
            elif status == 'inactive':
                queryset = queryset.filter(is_active=False)
            
            # Apply sorting
            if sort_order == 'desc':
                sort_by = f'-{sort_by}'
            queryset = queryset.order_by(sort_by)
            
            # Pagination
            start = (page - 1) * limit
            end = start + limit
            users = queryset[start:end]
            
            # Get user summaries
            user_data = []
            for user in users:
                # Get user statistics
                from apps.orders.models import Order
                total_orders = Order.objects.filter(customer=user).count()
                total_spent = Order.objects.filter(
                    customer=user, payment_status='paid'
                ).aggregate(total=Sum('total_amount'))['total'] or 0
                
                user_data.append({
                    'id': user.id,
                    'email': user.email,
                    'name': user.get_full_name(),
                    'role': user.role,
                    'is_active': user.is_active,
                    'last_login': user.last_login,
                    'date_joined': user.date_joined,
                    'total_orders': total_orders,
                    'total_spent': float(total_spent),
                })
            
            # Get total count for pagination
            total_count = queryset.count()
            
            return Response({
                'users': user_data,
                'pagination': {
                    'page': page,
                    'limit': limit,
                    'total': total_count,
                    'pages': (total_count + limit - 1) // limit,
                }
            })
            
        except Exception as e:
            return Response(
                {'error': f'Failed to fetch users: {str(e)}'},
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
                    Q(customer__first_name__icontains=search) |
                    Q(customer__last_name__icontains=search)
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
                    'customer_name': order.customer.get_full_name() if order.customer else 'Unknown',
                    'customer_email': order.customer.email if order.customer else '',
                    'status': order.status,
                    'total_amount': float(order.total_amount),
                    'created_at': order.created_at,
                    'updated_at': order.updated_at,
                    'payment_status': order.payment_status,
                    'items_count': order.items.count() if hasattr(order, 'items') else 0,
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