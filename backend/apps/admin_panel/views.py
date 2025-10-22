import os
from datetime import datetime, timedelta

import psutil
from apps.authentication.permissions import IsAdminUser
from django.contrib.auth import get_user_model
from django.db import models
from django.db.models import Avg, Count, F, Q, Sum
from django.utils import timezone
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import (
    AdminActivityLog,
    AdminBackupLog,
    AdminDashboardWidget,
    AdminNotification,
    AdminQuickAction,
    AdminSystemSettings,
    SystemHealthMetric,
)
from .serializers import (
    AdminActivityLogSerializer,
    AdminBackupLogSerializer,
    AdminDashboardWidgetSerializer,
    AdminNotificationSerializer,
    AdminOrderSummarySerializer,
    AdminQuickActionSerializer,
    AdminSystemSettingsSerializer,
    AdminUserSummarySerializer,
    DashboardStatsSerializer,
    SystemHealthMetricSerializer,
    SystemHealthSerializer,
)

User = get_user_model()


class AdminDashboardViewSet(viewsets.ViewSet):
    """Admin dashboard analytics and statistics"""

    permission_classes = [IsAuthenticated, IsAdminUser]

    @action(detail=False, methods=["get"])
    def stats(self, request):
        """Get comprehensive dashboard statistics"""
        try:
            # Calculate date ranges
            now = timezone.now()
            today = now.date()
            week_ago = now - timedelta(days=7)
            month_ago = now - timedelta(days=30)

            # Import models from other apps
            from apps.food.models import Food
            from apps.orders.models import Order

            # User statistics
            total_users = User.objects.count()
            active_users = User.objects.filter(is_active=True).count()
            new_users_today = User.objects.filter(date_joined__date=today).count()
            new_users_this_week = User.objects.filter(date_joined__gte=week_ago).count()
            new_users_this_month = User.objects.filter(
                date_joined__gte=month_ago
            ).count()

            # Calculate user growth
            previous_week_users = User.objects.filter(
                date_joined__gte=week_ago - timedelta(days=7), date_joined__lt=week_ago
            ).count()
            user_growth = (
                (new_users_this_week - previous_week_users)
                / max(previous_week_users, 1)
            ) * 100

            # Chef statistics
            total_chefs = User.objects.filter(role="chef").count()
            active_chefs = User.objects.filter(role="chef", is_active=True).count()
            pending_chef_approvals = User.objects.filter(
                role="chef", is_active=False
            ).count()

            # Order statistics
            total_orders = Order.objects.count()
            orders_today = Order.objects.filter(created_at__date=today).count()
            orders_this_week = Order.objects.filter(created_at__gte=week_ago).count()
            orders_this_month = Order.objects.filter(created_at__gte=month_ago).count()

            # Calculate order growth
            previous_week_orders = Order.objects.filter(
                created_at__gte=week_ago - timedelta(days=7), created_at__lt=week_ago
            ).count()
            order_growth = (
                (orders_this_week - previous_week_orders) / max(previous_week_orders, 1)
            ) * 100

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

            # Calculate revenue growth
            previous_week_revenue = (
                Order.objects.filter(
                    payment_status="paid",
                    created_at__gte=week_ago - timedelta(days=7),
                    created_at__lt=week_ago,
                ).aggregate(total=Sum("total_amount"))["total"]
                or 0
            )
            revenue_growth = (
                (revenue_this_week - previous_week_revenue)
                / max(previous_week_revenue, 1)
            ) * 100

            # Food statistics
            total_foods = Food.objects.count()
            active_foods = Food.objects.filter(is_available=True).count()
            pending_food_approvals = Food.objects.filter(is_available=False).count()

            # System statistics
            system_health_score = self._calculate_system_health()
            active_sessions = self._get_active_sessions()
            unread_notifications = AdminNotification.objects.filter(
                is_read=False, is_active=True
            ).count()
            pending_backups = AdminBackupLog.objects.filter(status="pending").count()

            stats_data = {
                "total_users": total_users,
                "active_users": active_users,
                "new_users_today": new_users_today,
                "new_users_this_week": new_users_this_week,
                "new_users_this_month": new_users_this_month,
                "user_growth": round(user_growth, 2),
                "total_chefs": total_chefs,
                "active_chefs": active_chefs,
                "pending_chef_approvals": pending_chef_approvals,
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
                "pending_food_approvals": pending_food_approvals,
                "system_health_score": system_health_score,
                "active_sessions": active_sessions,
                "unread_notifications": unread_notifications,
                "pending_backups": pending_backups,
            }

            serializer = DashboardStatsSerializer(stats_data)
            return Response(serializer.data)

        except Exception as e:
            return Response(
                {"error": f"Failed to fetch dashboard stats: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    def _calculate_system_health(self):
        """Calculate overall system health score"""
        try:
            cpu_usage = psutil.cpu_percent(interval=1)
            memory = psutil.virtual_memory()
            disk = psutil.disk_usage("/")

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


class AdminNotificationViewSet(viewsets.ModelViewSet):
    """Admin notification management"""

    queryset = AdminNotification.objects.all()
    serializer_class = AdminNotificationSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get_queryset(self):
        """Filter notifications based on query parameters"""
        queryset = AdminNotification.objects.all()
        is_read = self.request.query_params.get("is_read")
        notification_type = self.request.query_params.get("type")
        priority = self.request.query_params.get("priority")
        is_active = self.request.query_params.get("is_active", "true")

        if is_read is not None:
            queryset = queryset.filter(is_read=is_read.lower() == "true")
        if notification_type:
            queryset = queryset.filter(notification_type=notification_type)
        if priority:
            queryset = queryset.filter(priority=priority)
        if is_active.lower() == "false":
            queryset = queryset.filter(is_active=False)
        else:
            queryset = queryset.filter(is_active=True)

        return queryset.order_by("-created_at")

    @action(detail=False, methods=["post"])
    def mark_all_read(self, request):
        """Mark all notifications as read"""
        AdminNotification.objects.filter(is_read=False, is_active=True).update(
            is_read=True, read_at=timezone.now()
        )

        return Response({"message": "All notifications marked as read"})

    @action(detail=True, methods=["post"])
    def mark_read(self, request, pk=None):
        """Mark a specific notification as read"""
        notification = self.get_object()
        notification.is_read = True
        notification.read_at = timezone.now()
        notification.save()

        serializer = self.get_serializer(notification)
        return Response(serializer.data)

    @action(detail=True, methods=["post"])
    def mark_unread(self, request, pk=None):
        """Mark a specific notification as unread"""
        notification = self.get_object()
        notification.is_read = False
        notification.read_at = None
        notification.save()

        serializer = self.get_serializer(notification)
        return Response(serializer.data)

    @action(detail=False, methods=["delete"])
    def clear_read(self, request):
        """Delete all read notifications"""
        count = AdminNotification.objects.filter(is_read=True).delete()[0]
        return Response({"message": f"Deleted {count} read notifications"})

    @action(detail=False, methods=["get"])
    def unread_count(self, request):
        """Get count of unread notifications"""
        count = AdminNotification.objects.filter(is_read=False, is_active=True).count()
        return Response({"unread_count": count})


class AdminSystemSettingsViewSet(viewsets.ModelViewSet):
    """Admin system settings management"""

    queryset = AdminSystemSettings.objects.all()
    serializer_class = AdminSystemSettingsSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get_queryset(self):
        """Filter settings based on query parameters"""
        queryset = AdminSystemSettings.objects.all()
        category = self.request.query_params.get("category")
        is_public = self.request.query_params.get("is_public")

        if category:
            queryset = queryset.filter(category=category)
        if is_public is not None:
            queryset = queryset.filter(is_public=is_public.lower() == "true")

        return queryset.order_by("category", "key")

    @action(detail=False, methods=["get"])
    def categories(self, request):
        """Get available setting categories"""
        categories = AdminSystemSettings.SETTING_CATEGORIES
        return Response({"categories": categories})

    @action(detail=False, methods=["get"])
    def by_category(self, request, category=None):
        """Get settings grouped by category"""
        settings = AdminSystemSettings.objects.filter(category=category)
        serializer = self.get_serializer(settings, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["post"])
    def bulk_update(self, request):
        """Bulk update multiple settings"""
        settings_data = request.data.get("settings", [])
        updated_settings = []
        errors = []

        for setting_data in settings_data:
            setting_id = setting_data.get("id")
            value = setting_data.get("value")

            try:
                setting = AdminSystemSettings.objects.get(id=setting_id)
                setting.value = str(value)
                setting.updated_by = request.user
                setting.save()
                updated_settings.append(setting)
            except AdminSystemSettings.DoesNotExist:
                errors.append(f"Setting with id {setting_id} not found")
            except Exception as e:
                errors.append(f"Error updating setting {setting_id}: {str(e)}")

        serializer = self.get_serializer(updated_settings, many=True)
        return Response({"updated": serializer.data, "errors": errors})

    @action(detail=False, methods=["post"])
    def reset_to_default(self, request):
        """Reset settings to their default values"""
        setting_ids = request.data.get("setting_ids", [])
        reset_settings = []

        for setting_id in setting_ids:
            try:
                setting = AdminSystemSettings.objects.get(id=setting_id)
                if setting.default_value:
                    setting.value = setting.default_value
                    setting.updated_by = request.user
                    setting.save()
                    reset_settings.append(setting)
            except AdminSystemSettings.DoesNotExist:
                pass

        serializer = self.get_serializer(reset_settings, many=True)
        return Response(
            {
                "reset": serializer.data,
                "message": f"Reset {len(reset_settings)} settings to default values",
            }
        )

    @action(detail=False, methods=["get"])
    def public_settings(self, request):
        """Get public settings that can be accessed by non-admin users"""
        settings = AdminSystemSettings.objects.filter(is_public=True)
        serializer = self.get_serializer(settings, many=True)
        return Response(serializer.data)


class AdminUserManagementViewSet(viewsets.ModelViewSet):
    """Admin user management"""

    queryset = User.objects.all()
    permission_classes = [IsAuthenticated, IsAdminUser]
    serializer_class = (
        AdminUserSummarySerializer  # We'll use a custom serializer for listing
    )

    def get_queryset(self):
        """Filter users based on query parameters"""
        queryset = User.objects.all()
        role = self.request.query_params.get("role")
        approval_status = self.request.query_params.get("approval_status")
        status = self.request.query_params.get("status")
        search = self.request.query_params.get("search")

        if role:
            queryset = queryset.filter(role=role)
        if approval_status:
            queryset = queryset.filter(approval_status=approval_status)
        if status:
            queryset = queryset.filter(status=status)
        if search:
            queryset = queryset.filter(
                models.Q(email__icontains=search)
                | models.Q(first_name__icontains=search)
                | models.Q(last_name__icontains=search)
                | models.Q(id__icontains=search)
            )

        return queryset.order_by("-date_joined")

    def get_serializer_class(self):
        """Use different serializers for different actions"""
        if self.action == "retrieve":
            # For detail view, we might want a more detailed serializer
            return AdminUserSummarySerializer
        return AdminUserSummarySerializer

    @action(detail=True, methods=["post"])
    def activate(self, request, pk=None):
        """Activate a user account (separate from approval)"""
        user = self.get_object()
        user.status = "active"
        user.save()

        # Send activation notification email
        try:
            from apps.authentication.services.user_management_email_service import (
                UserManagementEmailService,
            )

            UserManagementEmailService.send_user_activation_notification(
                user, activated=True
            )
        except Exception as email_error:
            print(f"Failed to send activation email: {str(email_error)}")
            # Don't fail the activation if email fails

        # Log the activity
        AdminActivityLog.objects.create(
            admin=request.user,
            action="activate",
            resource_type="user",
            resource_id=str(user.id),
            description=f"Activated user account: {user.email}",
            metadata={"user_email": user.email},
        )

        serializer = self.get_serializer(user)
        return Response(serializer.data)

    @action(detail=True, methods=["post"])
    def deactivate(self, request, pk=None):
        """Deactivate a user account (separate from approval)"""
        user = self.get_object()
        user.status = "inactive"
        user.save()

        # Send deactivation notification email
        try:
            from apps.authentication.services.user_management_email_service import (
                UserManagementEmailService,
            )

            UserManagementEmailService.send_user_activation_notification(
                user, activated=False
            )
        except Exception as email_error:
            print(f"Failed to send deactivation email: {str(email_error)}")
            # Don't fail the deactivation if email fails

        # Log the activity
        AdminActivityLog.objects.create(
            admin=request.user,
            action="deactivate",
            resource_type="user",
            resource_id=str(user.id),
            description=f"Deactivated user account: {user.email}",
            metadata={"user_email": user.email},
        )

        serializer = self.get_serializer(user)
        return Response(serializer.data)

    @action(detail=True, methods=["post"])
    def change_role(self, request, pk=None):
        """Change user role"""
        user = self.get_object()
        new_role = request.data.get("role")

        if not new_role:
            return Response(
                {"error": "Role is required"}, status=status.HTTP_400_BAD_REQUEST
            )

        old_role = user.role
        user.role = new_role
        user.save()

        # Log the activity
        AdminActivityLog.objects.create(
            admin=request.user,
            action="update",
            resource_type="user",
            resource_id=str(user.id),
            description=f"Changed user role from {old_role} to {new_role}: {user.email}",
            metadata={
                "user_email": user.email,
                "old_role": old_role,
                "new_role": new_role,
            },
        )

        serializer = self.get_serializer(user)
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def stats(self, request):
        """Get user statistics"""
        total_users = User.objects.count()
        active_users = User.objects.filter(is_active=True).count()
        inactive_users = User.objects.filter(is_active=False).count()

        # Role distribution
        role_stats = (
            User.objects.values("role")
            .annotate(count=models.Count("id"))
            .order_by("role")
        )

        # Recent registrations
        recent_registrations = User.objects.filter(
            date_joined__gte=timezone.now() - timedelta(days=30)
        ).count()

        return Response(
            {
                "total_users": total_users,
                "active_users": active_users,
                "inactive_users": inactive_users,
                "role_distribution": list(role_stats),
                "recent_registrations": recent_registrations,
            }
        )

    @action(detail=False, methods=["post"])
    def bulk_activate(self, request):
        """Bulk activate users"""
        user_ids = request.data.get("user_ids", [])
        if not user_ids:
            return Response(
                {"error": "user_ids is required"}, status=status.HTTP_400_BAD_REQUEST
            )

        users = User.objects.filter(id__in=user_ids, is_active=False)
        count = users.update(is_active=True)

        # Log the activity
        AdminActivityLog.objects.create(
            admin=request.user,
            action="activate",
            resource_type="user",
            description=f"Bulk activated {count} user accounts",
            metadata={"user_ids": user_ids, "count": count},
        )

        return Response({"message": f"Activated {count} users"})

    @action(detail=False, methods=["post"])
    def bulk_deactivate(self, request):
        """Bulk deactivate users"""
        user_ids = request.data.get("user_ids", [])
        if not user_ids:
            return Response(
                {"error": "user_ids is required"}, status=status.HTTP_400_BAD_REQUEST
            )

        users = User.objects.filter(id__in=user_ids, is_active=True)
        count = users.update(is_active=False)

        # Log the activity
        AdminActivityLog.objects.create(
            admin=request.user,
            action="suspend",
            resource_type="user",
            description=f"Bulk deactivated {count} user accounts",
            metadata={"user_ids": user_ids, "count": count},
        )

        return Response({"message": f"Deactivated {count} users"})


class AdminOrderManagementViewSet(viewsets.ModelViewSet):
    """Admin order management"""

    permission_classes = [IsAuthenticated, IsAdminUser]

    def get_queryset(self):
        """Get orders queryset"""
        from apps.orders.models import Order

        queryset = Order.objects.select_related("customer", "chef").all()

        # Filter parameters
        status_filter = self.request.query_params.get("status")
        payment_status = self.request.query_params.get("payment_status")
        customer_id = self.request.query_params.get("customer_id")
        chef_id = self.request.query_params.get("chef_id")
        date_from = self.request.query_params.get("date_from")
        date_to = self.request.query_params.get("date_to")
        search = self.request.query_params.get("search")

        if status_filter:
            queryset = queryset.filter(status=status_filter)
        if payment_status:
            queryset = queryset.filter(payment_status=payment_status)
        if customer_id:
            queryset = queryset.filter(customer_id=customer_id)
        if chef_id:
            queryset = queryset.filter(chef_id=chef_id)
        if date_from:
            queryset = queryset.filter(created_at__date__gte=date_from)
        if date_to:
            queryset = queryset.filter(created_at__date__lte=date_to)
        if search:
            queryset = queryset.filter(
                models.Q(order_number__icontains=search)
                | models.Q(customer__email__icontains=search)
                | models.Q(customer__first_name__icontains=search)
                | models.Q(customer__last_name__icontains=search)
            )

        return queryset.order_by("-created_at")

    def get_serializer_class(self):
        """Use different serializers for different actions"""
        return AdminOrderSummarySerializer

    @action(detail=True, methods=["post"])
    def update_status(self, request, pk=None):
        """Update order status"""
        from apps.orders.models import Order

        order = self.get_object()
        new_status = request.data.get("status")

        if not new_status:
            return Response(
                {"error": "Status is required"}, status=status.HTTP_400_BAD_REQUEST
            )

        old_status = order.status
        order.status = new_status
        order.save()

        # Log the activity
        AdminActivityLog.objects.create(
            admin=request.user,
            action="update",
            resource_type="order",
            resource_id=str(order.id),
            description=f"Updated order {order.order_number} status from {old_status} to {new_status}",
            metadata={
                "order_number": order.order_number,
                "old_status": old_status,
                "new_status": new_status,
            },
        )

        serializer = self.get_serializer(order)
        return Response(serializer.data)

    @action(detail=True, methods=["post"])
    def update_payment_status(self, request, pk=None):
        """Update order payment status"""
        from apps.orders.models import Order

        order = self.get_object()
        new_payment_status = request.data.get("payment_status")

        if not new_payment_status:
            return Response(
                {"error": "Payment status is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        old_payment_status = order.payment_status
        order.payment_status = new_payment_status
        order.save()

        # Log the activity
        AdminActivityLog.objects.create(
            admin=request.user,
            action="update",
            resource_type="order",
            resource_id=str(order.id),
            description=f"Updated order {order.order_number} payment status from {old_payment_status} to {new_payment_status}",
            metadata={
                "order_number": order.order_number,
                "old_payment_status": old_payment_status,
                "new_payment_status": new_payment_status,
            },
        )

        serializer = self.get_serializer(order)
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def stats(self, request):
        """Get order statistics"""
        from apps.orders.models import Order

        total_orders = Order.objects.count()
        orders_by_status = (
            Order.objects.values("status")
            .annotate(count=models.Count("id"))
            .order_by("status")
        )

        orders_by_payment_status = (
            Order.objects.values("payment_status")
            .annotate(count=models.Count("id"))
            .order_by("payment_status")
        )

        # Revenue stats
        total_revenue = (
            Order.objects.filter(payment_status="paid").aggregate(
                total=Sum("total_amount")
            )["total"]
            or 0
        )

        # Recent orders (last 30 days)
        recent_orders = Order.objects.filter(
            created_at__gte=timezone.now() - timedelta(days=30)
        ).count()

        return Response(
            {
                "total_orders": total_orders,
                "orders_by_status": list(orders_by_status),
                "orders_by_payment_status": list(orders_by_payment_status),
                "total_revenue": float(total_revenue),
                "recent_orders": recent_orders,
            }
        )

    @action(detail=False, methods=["post"])
    def bulk_update_status(self, request):
        """Bulk update order statuses"""
        from apps.orders.models import Order

        order_ids = request.data.get("order_ids", [])
        new_status = request.data.get("status")

        if not order_ids or not new_status:
            return Response(
                {"error": "order_ids and status are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        orders = Order.objects.filter(id__in=order_ids)
        count = orders.update(status=new_status)

        # Log the activity
        AdminActivityLog.objects.create(
            admin=request.user,
            action="update",
            resource_type="order",
            description=f"Bulk updated {count} orders to status {new_status}",
            metadata={"order_ids": order_ids, "new_status": new_status, "count": count},
        )

        return Response({"message": f"Updated {count} orders to status {new_status}"})

    @action(detail=True, methods=["get"])
    def details(self, request, pk=None):
        """Get detailed order information including items"""
        from apps.orders.models import Order

        order = self.get_object()
        # This would need a more detailed serializer that includes order items
        # For now, return basic order info
        serializer = self.get_serializer(order)
        return Response(serializer.data)


class AdminActivityLogViewSet(viewsets.ReadOnlyModelViewSet):
    """Admin activity log viewing"""

    queryset = AdminActivityLog.objects.all()
    serializer_class = AdminActivityLogSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get_queryset(self):
        """Filter activity logs based on query parameters"""
        queryset = AdminActivityLog.objects.select_related("admin").all()

        admin_id = self.request.query_params.get("admin_id")
        action = self.request.query_params.get("action")
        resource_type = self.request.query_params.get("resource_type")
        resource_id = self.request.query_params.get("resource_id")
        date_from = self.request.query_params.get("date_from")
        date_to = self.request.query_params.get("date_to")
        search = self.request.query_params.get("search")

        if admin_id:
            queryset = queryset.filter(admin_id=admin_id)
        if action:
            queryset = queryset.filter(action=action)
        if resource_type:
            queryset = queryset.filter(resource_type=resource_type)
        if resource_id:
            queryset = queryset.filter(resource_id=resource_id)
        if date_from:
            queryset = queryset.filter(timestamp__date__gte=date_from)
        if date_to:
            queryset = queryset.filter(timestamp__date__lte=date_to)
        if search:
            queryset = queryset.filter(
                models.Q(description__icontains=search)
                | models.Q(admin__email__icontains=search)
                | models.Q(resource_id__icontains=search)
            )

        return queryset.order_by("-timestamp")

    @action(detail=False, methods=["get"])
    def actions(self, request):
        """Get available action types"""
        actions = AdminActivityLog.ACTION_CHOICES
        return Response({"actions": actions})

    @action(detail=False, methods=["get"])
    def resource_types(self, request):
        """Get available resource types"""
        resource_types = AdminActivityLog.RESOURCE_CHOICES
        return Response({"resource_types": resource_types})

    @action(detail=False, methods=["get"])
    def stats(self, request):
        """Get activity log statistics"""
        total_logs = AdminActivityLog.objects.count()

        # Actions distribution
        actions_stats = (
            AdminActivityLog.objects.values("action")
            .annotate(count=models.Count("id"))
            .order_by("-count")
        )

        # Resource types distribution
        resource_stats = (
            AdminActivityLog.objects.values("resource_type")
            .annotate(count=models.Count("id"))
            .order_by("-count")
        )

        # Recent activity (last 24 hours)
        recent_activity = AdminActivityLog.objects.filter(
            timestamp__gte=timezone.now() - timedelta(hours=24)
        ).count()

        # Top active admins
        admin_activity = (
            AdminActivityLog.objects.values("admin__email")
            .annotate(count=models.Count("id"))
            .order_by("-count")[:10]
        )

        return Response(
            {
                "total_logs": total_logs,
                "actions_distribution": list(actions_stats),
                "resource_distribution": list(resource_stats),
                "recent_activity": recent_activity,
                "top_admins": list(admin_activity),
            }
        )

    @action(detail=False, methods=["delete"])
    def clear_old_logs(self, request):
        """Clear activity logs older than specified days"""
        days = int(request.query_params.get("days", 90))

        cutoff_date = timezone.now() - timedelta(days=days)
        deleted_count = AdminActivityLog.objects.filter(
            timestamp__lt=cutoff_date
        ).delete()[0]

        # Log this action
        AdminActivityLog.objects.create(
            admin=request.user,
            action="delete",
            resource_type="system",
            description=f"Cleared {deleted_count} activity logs older than {days} days",
            metadata={"days": days, "deleted_count": deleted_count},
        )

        return Response(
            {"message": f"Cleared {deleted_count} activity logs older than {days} days"}
        )
