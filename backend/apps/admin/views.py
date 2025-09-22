from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from django.db.models import Count, Sum, Avg, Q, F
from django.utils import timezone
from django.contrib.auth import get_user_model
from datetime import timedelta, datetime
import psutil
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
    
    def _calculate_system_health(self):
        """Calculate overall system health score"""
        try:
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