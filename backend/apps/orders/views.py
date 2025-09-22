from rest_framework import viewsets, permissions
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from .models import Order, OrderItem, OrderStatusHistory, CartItem
from .serializers import OrderSerializer, OrderItemSerializer, OrderStatusHistorySerializer, CartItemSerializer


class OrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.all()
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]


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

class ChefOrderViewSet(viewsets.ReadOnlyModelViewSet):
    """Chef sees his order queue"""
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Order.objects.filter(chef=self.request.user)

    @action(detail=False, methods=["get"])
    def search(self, request):
        q = request.query_params.get("q", "")
        orders = self.get_queryset().filter(
            Q(id__icontains=q) |
            Q(customer__username__icontains=q) |
            Q(items__food__name__icontains=q)
        ).distinct()
        return Response(OrderSerializer(orders, many=True).data)

    @action(detail=False, methods=["get"])
    def counts(self, request):
        qs = self.get_queryset()
        return Response({
            "pending": qs.filter(status="pending").count(),
            "in_progress": qs.filter(status="in_progress").count(),
            "completed": qs.filter(status="completed").count(),
        })


class ChefBulkOrderViewSet(viewsets.ReadOnlyModelViewSet):
    """Chef sees only bulk orders"""
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Order.objects.filter(chef=self.request.user, order_type="bulk")

    @action(detail=False, methods=["get"])
    def counts(self, request):
        qs = self.get_queryset()
        return Response({
            "pending": qs.filter(status="pending").count(),
            "in_progress": qs.filter(status="in_progress").count(),
            "completed": qs.filter(status="completed").count(),
        })