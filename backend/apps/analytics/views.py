from datetime import timedelta
from typing import Any, Dict, List

from apps.authentication.permissions import IsAdminUser
from apps.food.models import FoodReview
from apps.orders.models import Order
from django.db.models import Avg, Count, Sum
from django.utils import timezone
from rest_framework import viewsets
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import IsAdminUser, IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response

from .models import (
    Activity,
    Notification,
    SystemAuditLog,
    SystemMaintenance,
    SystemNotification,
    SystemSettings,
)
from .serializers import (
    DashboardStatsSerializer,
    SystemAuditLogSerializer,
    SystemMaintenanceSerializer,
    SystemNotificationSerializer,
    SystemSettingsSerializer,
)


class DashboardViewSet(viewsets.ViewSet):
    """Dashboard analytics and statistics"""

    permission_classes = [IsAuthenticated, IsAdminUser]

    @action(detail=False, methods=["get"])
    def stats(self, request: Request) -> Response:
        """Get dashboard statistics"""
        # Accept range parameter but ignore it for now
        range_param = request.query_params.get("range", "30d")

        from apps.food.models import Food
        from apps.orders.models import Order
        from django.contrib.auth import get_user_model

        User = get_user_model()

        # Calculate date ranges
        now = timezone.now()
        today = now.date()
        week_ago = now - timedelta(days=7)
        month_ago = now - timedelta(days=30)

        # User statistics
        total_users = User.objects.count()
        active_users = User.objects.filter(is_active=True).count()
        new_users_today = User.objects.filter(date_joined__date=today).count()
        new_users_today = User.objects.filter(date_joined__date=today).count()
        new_users_this_week = User.objects.filter(date_joined__gte=week_ago).count()
        new_users_this_month = User.objects.filter(date_joined__gte=month_ago).count()

        # Chef statistics
        total_chefs = User.objects.filter(role="cook").count()
        active_chefs = User.objects.filter(role="cook", is_active=True).count()

        # Order statistics
        total_orders = Order.objects.count()
        orders_today = Order.objects.filter(created_at__date=today).count()
        orders_this_week = Order.objects.filter(created_at__gte=week_ago).count()
        orders_this_month = Order.objects.filter(created_at__gte=month_ago).count()

        # Revenue statistics
        total_revenue = (
            Order.objects.filter(payment_status="paid").aggregate(
                total=Sum("total_amount")
            )["total"]
            or 0
        )

        revenue_today = (
            Order.objects.filter(
                payment_status="paid", created_at__date=today
            ).aggregate(total=Sum("total_amount"))["total"]
            or 0
        )

        revenue_this_week = (
            Order.objects.filter(
                payment_status="paid", created_at__gte=week_ago
            ).aggregate(total=Sum("total_amount"))["total"]
            or 0
        )

        revenue_this_month = (
            Order.objects.filter(
                payment_status="paid", created_at__gte=month_ago
            ).aggregate(total=Sum("total_amount"))["total"]
            or 0
        )

        # Food statistics
        total_foods = Food.objects.count()
        active_foods = Food.objects.filter(is_available=True).count()

        # Calculate growth percentages
        user_growth = (
            (new_users_this_month - new_users_this_week) / max(new_users_this_week, 1)
        ) * 100
        order_growth = (
            (orders_this_month - orders_this_week) / max(orders_this_week, 1)
        ) * 100
        revenue_growth = (
            (revenue_this_month - revenue_this_week) / max(revenue_this_week, 1)
        ) * 100

        stats_data = {
            "total_users": total_users,
            "active_users": active_users,
            "new_users_today": new_users_today,
            "new_users_this_week": new_users_this_week,
            "new_users_this_month": new_users_this_month,
            "user_growth": round(user_growth, 2),
            "total_chefs": total_chefs,
            "active_chefs": active_chefs,
            "pending_chef_approvals": User.objects.filter(
                role="cook", approval_status="pending"
            ).count(),
            "chef_growth": 0,  # Calculate based on chef registrations
            "total_orders": total_orders,
            "orders_today": orders_today,
            "orders_this_week": orders_this_week,
            "orders_this_month": orders_this_month,
            "order_growth": round(order_growth, 2),
            "total_revenue": float(total_revenue),
            "revenue_today": float(revenue_today),
            "revenue_this_week": float(revenue_this_week),
            "revenue_this_month": float(revenue_this_month),
            "revenue_growth": round(revenue_growth, 2),
            "total_foods": total_foods,
            "active_foods": active_foods,
            "pending_approvals": User.objects.filter(
                role__in=["cook", "delivery_agent"], approval_status="pending"
            ).count(),
        }

        serializer = DashboardStatsSerializer(stats_data)
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def revenue_trends(self, request: Request) -> Response:
        """Get revenue trends for the last 7 days"""
        from apps.orders.models import Order

        # Get data for the last 7 days
        now = timezone.now()
        data = []

        for i in range(6, -1, -1):  # 7 days ago to today
            date = (now - timedelta(days=i)).date()
            day_name = date.strftime("%a")  # Mon, Tue, etc.

            revenue = (
                Order.objects.filter(
                    payment_status="paid", created_at__date=date
                ).aggregate(total=Sum("total_amount"))["total"]
                or 0
            )

            data.append({"name": day_name, "value": float(revenue)})

        return Response(data)

    @action(detail=False, methods=["get"])
    def user_growth_trends(self, request: Request) -> Response:
        """Get user growth trends for the last 7 days"""
        from django.contrib.auth import get_user_model

        User = get_user_model()

        # Get data for the last 7 days
        now = timezone.now()
        data = []

        for i in range(6, -1, -1):  # 7 days ago to today
            date = (now - timedelta(days=i)).date()
            day_name = date.strftime("%a")  # Mon, Tue, etc.

            user_count = User.objects.filter(date_joined__date=date).count()

            data.append({"name": day_name, "value": user_count})

        return Response(data)


class SystemSettingsViewSet(viewsets.ModelViewSet):
    """System settings management"""

    queryset = SystemSettings.objects.all()
    serializer_class = SystemSettingsSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get_queryset(self) -> Any:
        setting_type = self.request.query_params.get("type", None)
        if setting_type:
            return self.queryset.filter(setting_type=setting_type)
        return self.queryset


class SystemNotificationViewSet(viewsets.ModelViewSet):
    """System notifications management"""

    queryset = SystemNotification.objects.all()
    serializer_class = SystemNotificationSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get_queryset(self) -> Any:
        is_active = self.request.query_params.get("active", None)
        if is_active is not None:
            return self.queryset.filter(is_active=is_active.lower() == "true")
        return self.queryset


class SystemAuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    """System audit logs (read-only)"""

    queryset = SystemAuditLog.objects.all()
    serializer_class = SystemAuditLogSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get_queryset(self) -> Any:
        user_id = self.request.query_params.get("user", None)
        action_type = self.request.query_params.get("action", None)
        resource_type = self.request.query_params.get("resource_type", None)

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

    def get_queryset(self) -> Any:
        status_filter = self.request.query_params.get("status", None)
        if status_filter:
            return self.queryset.filter(status=status_filter)
        return self.queryset


# Additional analytics endpoints for frontend compatibility
@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminUser])
def order_analytics(request):
    """Get order analytics data"""
    try:
        range_param = request.GET.get('range', '30d')
        days = int(range_param.replace('d', ''))
        
        end_date = timezone.now()
        start_date = end_date - timedelta(days=days)
        
        # Get order statistics
        orders = Order.objects.filter(
            created_at__gte=start_date,
            created_at__lte=end_date
        )
        
        total_orders = orders.count()
        total_revenue = orders.aggregate(Sum('total_amount'))['total_amount__sum'] or 0
        
        # Orders by status
        status_stats = orders.values('status').annotate(count=Count('id'))
        
        # Daily breakdown
        daily_stats = orders.extra(
            select={'day': 'DATE(created_at)'}  # MySQL DATE function
        ).values('day').annotate(
            count=Count('id'),
            revenue=Sum('total_amount')
        ).order_by('day')
        
        return Response({
            'total_orders': total_orders,
            'total_revenue': float(total_revenue),
            'status_breakdown': list(status_stats),
            'daily_breakdown': list(daily_stats),
            'period': range_param
        })
        
    except Exception as e:
        return Response({'error': str(e)}, status=500)


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminUser])
def customer_analytics(request):
    """Get customer analytics data with improved error handling"""
    try:
        range_param = request.GET.get('range', '30d')
        days = int(range_param.replace('d', ''))
        
        end_date = timezone.now()
        start_date = end_date - timedelta(days=days)
        
        from django.contrib.auth import get_user_model
        User = get_user_model()
        
        # Get customer statistics with safe queries
        customers = User.objects.filter(role='customer')
        new_customers = customers.filter(date_joined__gte=start_date).count()
        total_customers = customers.count()
        
        # Customer activity - use safer query approach
        try:
            from apps.orders.models import Order
            # Get customers who have orders in the period
            customer_ids_with_orders = Order.objects.filter(
                created_at__gte=start_date
            ).values_list('customer_id', flat=True).distinct()
            
            active_customers = customers.filter(
                id__in=customer_ids_with_orders
            ).count()
            
            # High value customers - get from orders aggregation
            high_value_customer_ids = Order.objects.values('customer_id').annotate(
                total_spent=Sum('total_amount')
            ).filter(total_spent__gte=1000).values_list('customer_id', flat=True)
            
            high_value = customers.filter(
                id__in=high_value_customer_ids
            ).count()
            
        except Exception as order_error:
            # Fallback if order model has issues
            print(f"Order-related query failed: {order_error}")
            active_customers = 0
            high_value = 0
        
        # Customer growth calculation
        previous_period_start = start_date - timedelta(days=days)
        previous_new_customers = customers.filter(
            date_joined__gte=previous_period_start,
            date_joined__lt=start_date
        ).count()
        
        growth_rate = 0
        if previous_new_customers > 0:
            growth_rate = ((new_customers - previous_new_customers) / previous_new_customers) * 100
        
        return Response({
            'total_customers': total_customers,
            'new_customers': new_customers,
            'active_customers': active_customers,
            'high_value_customers': high_value,
            'growth_rate': round(growth_rate, 2),
            'period': range_param,
            'period_days': days
        })
        
    except ValueError as ve:
        return Response({
            'error': f'Invalid range parameter: {str(ve)}'
        }, status=400)
    except Exception as e:
        return Response({
            'error': f'Failed to fetch customer analytics: {str(e)}'
        }, status=500)


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminUser])
def performance_analytics(request):
    """Get system performance analytics data"""
    try:
        range_param = request.GET.get('range', '30d')
        days = int(range_param.replace('d', ''))
        
        end_date = timezone.now()
        start_date = end_date - timedelta(days=days)
        
        from django.contrib.auth import get_user_model
        User = get_user_model()
        
        # System performance metrics
        total_users = User.objects.count()
        active_users = User.objects.filter(last_login__gte=start_date).count()
        
        # Order performance metrics
        try:
            from apps.orders.models import Order
            total_orders = Order.objects.filter(created_at__gte=start_date).count()
            completed_orders = Order.objects.filter(
                created_at__gte=start_date,
                status='completed'
            ).count()
            
            # Calculate completion rate
            completion_rate = (completed_orders / max(total_orders, 1)) * 100
            
            # Average order processing time (mock calculation)
            avg_processing_time = 25.5  # minutes
            
        except Exception as order_error:
            print(f"Order performance query failed: {order_error}")
            total_orders = 0
            completed_orders = 0
            completion_rate = 0
            avg_processing_time = 0
        
        # System health metrics (mock data for now)
        system_health = {
            'cpu_usage': 45.2,
            'memory_usage': 67.8,
            'disk_usage': 23.1,
            'response_time': 1.2,  # seconds
            'uptime': 99.9  # percentage
        }
        
        # Performance trends (mock data)
        performance_trends = {
            'response_time_trend': 'stable',
            'error_rate_trend': 'improving',
            'throughput_trend': 'increasing'
        }
        
        return Response({
            'total_users': total_users,
            'active_users': active_users,
            'total_orders': total_orders,
            'completed_orders': completed_orders,
            'completion_rate': round(completion_rate, 2),
            'avg_processing_time': avg_processing_time,
            'system_health': system_health,
            'performance_trends': performance_trends,
            'period': range_param,
            'period_days': days
        })
        
    except ValueError as ve:
        return Response({
            'error': f'Invalid range parameter: {str(ve)}'
        }, status=400)
    except Exception as e:
        return Response({
            'error': f'Failed to fetch performance analytics: {str(e)}'
        }, status=500)