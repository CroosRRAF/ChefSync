from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from .models import Order, OrderItem, OrderStatusHistory, CartItem
from django.db.models import Sum
from .serializers import (
    OrderSerializer,
    OrderItemSerializer,
    OrderStatusHistorySerializer,
    CartItemSerializer
)

class OrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.all()
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['get'])
    def available(self, request):
        available_orders = self.queryset.filter(
            status='confirmed',
            delivery_partner=None
        )
        serializer = self.get_serializer(available_orders, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def accept(self, request, pk=None):
        order = self.get_object()
        if order.delivery_partner is not None:
            return Response({"error": "Order already taken"}, status=status.HTTP_400_BAD_REQUEST)

        order.delivery_partner = request.user  # assuming your User model is linked to delivery agents
        order.status = 'out_for_delivery'
        order.save()

        # Optionally add status history
        OrderStatusHistory.objects.create(
            order=order,
            status='out_for_delivery',
            changed_by=request.user,
            notes='Order accepted by delivery agent'
        )

        return Response({"success": "Order accepted"})


    @action(detail=True, methods=['patch'])
    def status(self, request, pk=None):
        order = self.get_object()
        new_status = request.data.get('status')
        if new_status not in ['picked_up', 'in_transit', 'delivered']:
            return Response({"error": "Invalid status"}, status=status.HTTP_400_BAD_REQUEST)

        order.status = new_status
        if new_status == 'delivered':
            order.actual_delivery_time = timezone.now()
        order.save()

        OrderStatusHistory.objects.create(
            order=order,
            status=new_status,
            changed_by=request.user,
            notes=f'Status changed to {new_status}'
        )

        return Response({"success": f"Order status updated to {new_status}"})


    @action(detail=False, methods=['get'])
    def history(self, request):
        completed_orders = Order.objects.filter(
            delivery_partner=request.user,
            status='delivered'
        )
        serializer = self.get_serializer(completed_orders, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def dashboard_summary(self, request):
        today = timezone.now().date()
        active_deliveries = Order.objects.filter(
            delivery_partner=request.user
        ).exclude(status='delivered').count()
        completed_today = Order.objects.filter(
            delivery_partner=request.user,
            status='delivered',
            updated_at__date=today
        ).count()
        todays_earnings = Order.objects.filter(
    delivery_partner=request.user,
    status='delivered',
    updated_at__date=today
).aggregate(total=Sum('delivery_fee'))['total'] or 0

        avg_time = Order.objects.filter(
            delivery_partner=request.user,
            status='delivered'
        ).exclude(actual_delivery_time__isnull=True)
        avg_time_minutes = 0
        if avg_time.exists():
            total_seconds = sum([(o.actual_delivery_time - o.created_at).total_seconds() for o in avg_time])
            avg_time_minutes = total_seconds / 60 / avg_time.count()

        return Response({
            "active_deliveries": active_deliveries,
            "completed_today": completed_today,
            "todays_earnings": float(todays_earnings),
            "avg_delivery_time_min": round(avg_time_minutes, 1)
        })


class OrderItemViewSet(viewsets.ModelViewSet):
    queryset = OrderItem.objects.all()
    serializer_class = OrderItemSerializer
    permission_classes = [IsAuthenticated]


class OrderStatusHistoryViewSet(viewsets.ModelViewSet):
    queryset = OrderStatusHistory.objects.all()
    serializer_class = OrderStatusHistorySerializer
    permission_classes = [IsAuthenticated]


class CartItemViewSet(viewsets.ModelViewSet):
    queryset = CartItem.objects.all()
    serializer_class = CartItemSerializer
    permission_classes = [IsAuthenticated]