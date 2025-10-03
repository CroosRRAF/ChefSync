from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from django.db.models import Sum, Count
from .models import Payment, Refund, PaymentMethod, Transaction
from .serializers import PaymentSerializer, RefundSerializer, PaymentMethodSerializer, TransactionSerializer


class PaymentViewSet(viewsets.ModelViewSet):
    queryset = Payment.objects.all()
    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated]


class RefundViewSet(viewsets.ModelViewSet):
    queryset = Refund.objects.all()
    serializer_class = RefundSerializer
    permission_classes = [IsAuthenticated]


class PaymentMethodViewSet(viewsets.ModelViewSet):
    queryset = PaymentMethod.objects.all()
    serializer_class = PaymentMethodSerializer
    permission_classes = [IsAuthenticated]


class TransactionViewSet(viewsets.ModelViewSet):
    queryset = Transaction.objects.all()
    serializer_class = TransactionSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=["get"])
    def stats(self, request):
        """Get payment statistics for admin dashboard"""
        try:
            from django.utils import timezone
            from datetime import timedelta
            
            # Get current date and calculate date ranges
            now = timezone.now()
            today = now.date()
            this_week = today - timedelta(days=7)
            this_month = today - timedelta(days=30)
            
            # Payment statistics
            total_transactions = Transaction.objects.count()
            successful_transactions = Transaction.objects.filter(status='completed').count()
            failed_transactions = Transaction.objects.filter(status='failed').count()
            pending_transactions = Transaction.objects.filter(status='pending').count()
            
            # Revenue calculations
            total_revenue = Transaction.objects.filter(status='completed').aggregate(
                total=Sum('amount')
            )['total'] or 0
            
            revenue_this_week = Transaction.objects.filter(
                status='completed',
                created_at__gte=this_week
            ).aggregate(total=Sum('amount'))['total'] or 0
            
            revenue_this_month = Transaction.objects.filter(
                status='completed',
                created_at__gte=this_month
            ).aggregate(total=Sum('amount'))['total'] or 0
            
            # Refund statistics
            total_refunds = Refund.objects.count()
            pending_refunds = Refund.objects.filter(status='pending').count()
            processed_refunds = Refund.objects.filter(status='processed').count()
            
            refund_amount = Refund.objects.filter(status='processed').aggregate(
                total=Sum('amount')
            )['total'] or 0
            
            # Success rate
            success_rate = (successful_transactions / max(total_transactions, 1)) * 100
            
            return Response({
                'totalTransactions': total_transactions,
                'successfulTransactions': successful_transactions,
                'failedTransactions': failed_transactions,
                'pendingTransactions': pending_transactions,
                'totalRevenue': float(total_revenue),
                'revenueThisWeek': float(revenue_this_week),
                'revenueThisMonth': float(revenue_this_month),
                'totalRefunds': total_refunds,
                'pendingRefunds': pending_refunds,
                'processedRefunds': processed_refunds,
                'refundAmount': float(refund_amount),
                'successRate': round(success_rate, 2),
            })
            
        except Exception as e:
            print(f"Error in payment stats: {str(e)}")
            return Response(
                {"error": f"Failed to fetch payment stats: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )