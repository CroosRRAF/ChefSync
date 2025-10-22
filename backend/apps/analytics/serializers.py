from rest_framework import serializers

from .models import (
    Activity,
    SystemAuditLog,
    SystemMaintenance,
    SystemNotification,
    SystemSettings,
)


class SystemSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = SystemSettings
        fields = "__all__"
        read_only_fields = ["created_at", "updated_at"]


class SystemNotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = SystemNotification
        fields = "__all__"
        read_only_fields = ["created_at", "updated_at"]


class SystemAuditLogSerializer(serializers.ModelSerializer):
    user_username = serializers.CharField(source="user.username", read_only=True)

    class Meta:
        model = SystemAuditLog
        fields = "__all__"
        read_only_fields = ["timestamp"]


class SystemMaintenanceSerializer(serializers.ModelSerializer):
    created_by_username = serializers.CharField(
        source="created_by.username", read_only=True
    )
    executed_by_username = serializers.CharField(
        source="executed_by.username", read_only=True
    )

    class Meta:
        model = SystemMaintenance
        fields = "__all__"
        read_only_fields = ["created_at", "updated_at"]


class DashboardStatsSerializer(serializers.Serializer):
    # User stats
    total_users = serializers.IntegerField()
    active_users = serializers.IntegerField()
    new_users_today = serializers.IntegerField()
    new_users_this_week = serializers.IntegerField()
    new_users_this_month = serializers.IntegerField()
    user_growth = serializers.FloatField()

    # Chef stats
    total_chefs = serializers.IntegerField()
    active_chefs = serializers.IntegerField()
    pending_chef_approvals = serializers.IntegerField()
    chef_growth = serializers.FloatField()

    # Order stats
    total_orders = serializers.IntegerField()
    orders_today = serializers.IntegerField()
    orders_this_week = serializers.IntegerField()
    orders_this_month = serializers.IntegerField()
    order_growth = serializers.FloatField()

    # Revenue stats
    total_revenue = serializers.FloatField()
    revenue_today = serializers.FloatField()
    revenue_this_week = serializers.FloatField()
    revenue_this_month = serializers.FloatField()
    revenue_growth = serializers.FloatField()

    # Food stats
    total_foods = serializers.IntegerField()
    active_foods = serializers.IntegerField()
    pending_approvals = serializers.IntegerField()


class ActivitySerializer(serializers.ModelSerializer):
    class Meta:
        model = Activity
        fields = ["id", "action", "order", "created_at"]
