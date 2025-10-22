from django.db.models import Count, Sum
from rest_framework import status, viewsets
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import IsAdminUser, IsAuthenticated
from rest_framework.response import Response

from .models import Payment, PaymentMethod, Refund, Transaction
from .serializers import (
    PaymentMethodSerializer,
    PaymentSerializer,
    RefundSerializer,
    TransactionSerializer,
)


class PaymentViewSet(viewsets.ModelViewSet):
    queryset = Payment.objects.all()
    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated]


class RefundViewSet(viewsets.ModelViewSet):
    queryset = Refund.objects.all()
    serializer_class = RefundSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=True, methods=["post"], url_path="approve")
    def approve(self, request, pk=None):
        try:
            refund = self.get_object()
            if not (request.user.is_staff or request.user.is_superuser):
                return Response(
                    {"error": "Admin access required"}, status=status.HTTP_403_FORBIDDEN
                )
            note = request.data.get("note", "Approved by admin")
            refund.status = "processed" if hasattr(refund, "status") else "completed"
            refund.processed_by = request.user
            refund.notes = note
            refund.save()
            # Optionally create a Transaction log entry here
            return Response(self.get_serializer(refund).data)
        except Exception as e:
            return Response(
                {"error": f"Failed to approve refund: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    @action(detail=True, methods=["post"], url_path="reject")
    def reject(self, request, pk=None):
        try:
            refund = self.get_object()
            if not (request.user.is_staff or request.user.is_superuser):
                return Response(
                    {"error": "Admin access required"}, status=status.HTTP_403_FORBIDDEN
                )
            note = request.data.get("note", "Rejected by admin")
            refund.status = "cancelled"
            refund.processed_by = request.user
            refund.notes = note
            refund.save()
            return Response(self.get_serializer(refund).data)
        except Exception as e:
            return Response(
                {"error": f"Failed to reject refund: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class PaymentMethodViewSet(viewsets.ModelViewSet):
    queryset = PaymentMethod.objects.all()
    serializer_class = PaymentMethodSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=True, methods=["patch"], url_path="set_default")
    def set_default(self, request, pk=None):
        """Set a payment method as default for the current user."""
        try:
            method = self.get_object()
            # Ensure ownership
            if method.user != request.user and not (
                request.user.is_staff or request.user.is_superuser
            ):
                return Response(
                    {"error": "Not authorized"}, status=status.HTTP_403_FORBIDDEN
                )

            # Unset other defaults for this user
            PaymentMethod.objects.filter(user=method.user, is_default=True).exclude(
                pk=method.pk
            ).update(is_default=False)
            # Set this as default
            method.is_default = True
            method.save(update_fields=["is_default", "updated_at"])

            return Response(self.get_serializer(method).data)
        except Exception as e:
            return Response(
                {"error": f"Failed to set default: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class TransactionViewSet(viewsets.ModelViewSet):
    queryset = Transaction.objects.all()
    serializer_class = TransactionSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=["get"])
    def stats(self, request):
        """Get payment statistics for admin dashboard"""
        try:
            from datetime import timedelta

            from django.utils import timezone

            # Get current date and calculate date ranges
            now = timezone.now()
            today = now.date()
            this_week = today - timedelta(days=7)
            this_month = today - timedelta(days=30)

            # Payment statistics
            total_transactions = Transaction.objects.count()
            successful_transactions = Transaction.objects.filter(
                status="completed"
            ).count()
            failed_transactions = Transaction.objects.filter(status="failed").count()
            pending_transactions = Transaction.objects.filter(status="pending").count()

            # Revenue calculations
            total_revenue = (
                Transaction.objects.filter(status="completed").aggregate(
                    total=Sum("amount")
                )["total"]
                or 0
            )

            revenue_this_week = (
                Transaction.objects.filter(
                    status="completed", created_at__gte=this_week
                ).aggregate(total=Sum("amount"))["total"]
                or 0
            )

            revenue_this_month = (
                Transaction.objects.filter(
                    status="completed", created_at__gte=this_month
                ).aggregate(total=Sum("amount"))["total"]
                or 0
            )

            # Refund statistics
            total_refunds = Refund.objects.count()
            pending_refunds = Refund.objects.filter(status="pending").count()
            processed_refunds = Refund.objects.filter(status="processed").count()

            refund_amount = (
                Refund.objects.filter(status="processed").aggregate(
                    total=Sum("amount")
                )["total"]
                or 0
            )

            # Success rate
            success_rate = (successful_transactions / max(total_transactions, 1)) * 100

            return Response(
                {
                    "totalTransactions": total_transactions,
                    "successfulTransactions": successful_transactions,
                    "failedTransactions": failed_transactions,
                    "pendingTransactions": pending_transactions,
                    "totalRevenue": float(total_revenue),
                    "revenueThisWeek": float(revenue_this_week),
                    "revenueThisMonth": float(revenue_this_month),
                    "totalRefunds": total_refunds,
                    "pendingRefunds": pending_refunds,
                    "processedRefunds": processed_refunds,
                    "refundAmount": float(refund_amount),
                    "successRate": round(success_rate, 2),
                }
            )

        except Exception as e:
            print(f"Error in payment stats: {str(e)}")
            return Response(
                {"error": f"Failed to fetch payment stats: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


# Alias endpoint to provide payment stats at /api/payments/stats/ with snake_case keys
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def payment_stats(request):
    """Return summarized payment statistics for admin dashboards.

    Shape matches frontend PaymentStats interface (snake_case keys):
      - total_transactions: int
      - total_revenue: str (2 decimals)
      - total_refunds: str (2 decimals)
      - pending_refunds: int
      - success_rate: float (0-100)
      - average_transaction_value: str (2 decimals)
    """
    try:
        # Optional admin gate (avoid exposing financials to non-admins)
        if not (request.user.is_staff or request.user.is_superuser):
            return Response(
                {"error": "Admin access required"}, status=status.HTTP_403_FORBIDDEN
            )

        # Aggregate transactions
        total_transactions = Transaction.objects.count()
        successful_transactions = Transaction.objects.filter(status="completed").count()
        failed_transactions = Transaction.objects.filter(status="failed").count()
        pending_transactions = Transaction.objects.filter(status="pending").count()

        # Revenue from completed transactions
        total_revenue = (
            Transaction.objects.filter(status="completed").aggregate(
                total=Sum("amount")
            )["total"]
            or 0
        )

        # Refunds
        total_refunds_amount = (
            Refund.objects.filter(status__in=["processed", "completed"]).aggregate(
                total=Sum("amount")
            )["total"]
            or 0
        )
        pending_refunds = Refund.objects.filter(status="pending").count()

        # Success rate and ATV
        success_rate = (successful_transactions / max(total_transactions, 1)) * 100
        average_txn_value = (
            (total_revenue / max(successful_transactions, 1))
            if successful_transactions
            else 0
        )

        return Response(
            {
                "total_transactions": total_transactions,
                "total_revenue": f"{float(total_revenue):.2f}",
                "total_refunds": f"{float(total_refunds_amount):.2f}",
                "pending_refunds": pending_refunds,
                "success_rate": round(success_rate, 2),
                "average_transaction_value": f"{float(average_txn_value):.2f}",
                # Extra diagnostics (not in interface, harmless if ignored by client)
                "failed_transactions": failed_transactions,
                "pending_transactions": pending_transactions,
            }
        )
    except Exception as e:
        return Response(
            {"error": f"Failed to fetch payment stats: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
