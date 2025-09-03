from rest_framework import serializers
from .models import Delivery, DeliveryNotification, Order

class DeliverySerializer(serializers.ModelSerializer):
    order_id = serializers.IntegerField(source='order.id', read_only=True)
    customer_name = serializers.CharField(source='order.customer.username', read_only=True)

    class Meta:
        model = Delivery
        fields = [
            'id',
            'order_id',
            'customer_name',
            'agent',
            'status',
            'assigned_at',
            'accepted_at',
            'picked_at',
            'delivered_at',
        ]


class DeliveryStatusUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Delivery
        fields = ['status', 'picked_at', 'delivered_at']