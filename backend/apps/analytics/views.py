from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from django.db.models import Count, Sum, Avg
from django.utils import timezone
from datetime import timedelta
from .models import SystemSettings, SystemNotification, SystemAuditLog, SystemMaintenance, Activity, Notification
from .serializers import (
    SystemSettingsSerializer, SystemNotificationSerializer, 
    SystemAuditLogSerializer, SystemMaintenanceSerializer,
    DashboardStatsSerializer
)
from apps.orders.models import Order
from apps.food.models import FoodReview


class DashboardViewSet(viewsets.ViewSet):
    """Dashboard analytics and statistics"""
    permission_classes = [IsAuthenticated, IsAdminUser]
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get dashboard statistics"""
        from django.contrib.auth import get_user_model
        from apps.orders.models import Order
        from apps.food.models import Food
        
        User = get_user_model()
        
        # Calculate date ranges
        now = timezone.now()
        today = now.date()
        week_ago = now - timedelta(days=7)
        month_ago = now - timedelta(days=30)
        
        # User statistics
        total_users = User.objects.count()
        active_users = User.objects.filter(is_active=True).count()
        new_users_this_week = User.objects.filter(date_joined__gte=week_ago).count()
        new_users_this_month = User.objects.filter(date_joined__gte=month_ago).count()
        
        # Chef statistics
        total_chefs = User.objects.filter(role='cook').count()
        active_chefs = User.objects.filter(role='cook', is_active=True).count()
        
        # Order statistics
        total_orders = Order.objects.count()
        orders_today = Order.objects.filter(created_at__date=today).count()
        orders_this_week = Order.objects.filter(created_at__gte=week_ago).count()
        orders_this_month = Order.objects.filter(created_at__gte=month_ago).count()
        
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
        
        # Food statistics
        total_foods = Food.objects.count()
        active_foods = Food.objects.filter(is_available=True).count()
        
        # Calculate growth percentages
        user_growth = ((new_users_this_month - new_users_this_week) / max(new_users_this_week, 1)) * 100
        order_growth = ((orders_this_month - orders_this_week) / max(orders_this_week, 1)) * 100
        revenue_growth = ((revenue_this_month - revenue_this_week) / max(revenue_this_week, 1)) * 100
        
        stats_data = {
            'total_users': total_users,
            'active_users': active_users,
            'new_users_today': new_users_today,
            'new_users_this_week': new_users_this_week,
            'new_users_this_month': new_users_this_month,
            'user_growth': round(user_growth, 2),
            
            'total_chefs': total_chefs,
            'active_chefs': active_chefs,
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
            'pending_approvals': User.objects.filter(
                role__in=['cook', 'delivery_agent'],
                approval_status='pending'
            ).count(),
        }
        
        serializer = DashboardStatsSerializer(stats_data)
        return Response(serializer.data)


class SystemSettingsViewSet(viewsets.ModelViewSet):
    """System settings management"""
    queryset = SystemSettings.objects.all()
    serializer_class = SystemSettingsSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    
    def get_queryset(self):
        setting_type = self.request.query_params.get('type', None)
        if setting_type:
            return self.queryset.filter(setting_type=setting_type)
        return self.queryset


class SystemNotificationViewSet(viewsets.ModelViewSet):
    """System notifications management"""
    queryset = SystemNotification.objects.all()
    serializer_class = SystemNotificationSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    
    def get_queryset(self):
        is_active = self.request.query_params.get('active', None)
        if is_active is not None:
            return self.queryset.filter(is_active=is_active.lower() == 'true')
        return self.queryset


class SystemAuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    """System audit logs (read-only)"""
    queryset = SystemAuditLog.objects.all()
    serializer_class = SystemAuditLogSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    
    def get_queryset(self):
        user_id = self.request.query_params.get('user', None)
        action_type = self.request.query_params.get('action', None)
        resource_type = self.request.query_params.get('resource_type', None)
        
        queryset = self.queryset
        if user_id:
            queryset = queryset.filter(user_id=user_id)
        if action_type:
            queryset = queryset.filter(action=action_type)
        if resource_type:
            queryset = queryset.filter(resource_type=resource_type)
        
        return queryset


class SystemMaintenanceViewSet(viewsets.ModelViewSet):
    """System maintenance management"""
    queryset = SystemMaintenance.objects.all()
    serializer_class = SystemMaintenanceSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    
    def get_queryset(self):
        status_filter = self.request.query_params.get('status', None)
        if status_filter:
            return self.queryset.filter(status=status_filter)
        return self.queryset


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def chef_dashboard(request):
    """Return dashboard stats for logged-in chef"""
    chef = request.user
    if chef.role != "chef":
        return Response({"error": "Not authorized"}, status=403)

    # Active & Completed
    active_orders = Order.objects.filter(chef=chef, status__in=["pending", "in_progress"]).count()
    completed_orders = Order.objects.filter(chef=chef, status="completed").count()

    # Bulk Orders
    bulk_orders = Order.objects.filter(chef=chef, order_type="bulk").count()

    # Recent Reviews
    reviews = FoodReview.objects.filter(order__chef=chef).order_by("-created_at")[:6]
    recent_reviews = [
        {
            "rating": r.rating,
            "comment": r.comment,
            "customer": r.order.customer.username,
            "created_at": r.created_at,
        }
        for r in reviews
    ]

    # Recent Activity
    activities = Activity.objects.filter(chef=chef).order_by("-created_at")[:6]
    recent_activity = [
        {
            "action": a.action,
            "order_id": a.order.id if a.order else None,
            "created_at": a.created_at,
        }
        for a in activities
    ]

    # Notifications
    notifications = Notification.objects.filter(user=chef).order_by("-created_at")[:6]
    notif_data = [
        {
            "title": n.title,
            "type": n.type,
            "message": n.message,
            "is_read": n.is_read,
            "created_at": n.created_at,
        }
        for n in notifications
    ]

    # Busy/Free status
    busy_status = "free"
    if active_orders > 5 or Order.objects.filter(chef=chef, status="pending").count() > 5:
        busy_status = "busy"

    return Response({
        "active_orders": active_orders,
        "completed_orders": completed_orders,
        "bulk_orders": bulk_orders,
        "recent_reviews": recent_reviews,
        "recent_activity": recent_activity,
        "notifications": notif_data,
        "status": busy_status,
    })