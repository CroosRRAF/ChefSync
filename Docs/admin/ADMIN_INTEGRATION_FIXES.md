# Admin Integration Fixes Required

**Updated**: October 4, 2025
**Based on**: Comprehensive System Analysis
**Current Status**: 82% Complete (11 endpoints + UI components missing)

## 1. Communication Service Missing Endpoints

**Priority**: 🔴 CRITICAL (Week 1)
**Effort**: 12-15 hours
**Impact**: Removes 404 errors, enables real communication data

Add these methods to `backend/apps/communications/views.py`:

```python
@action(detail=False, methods=['get'])
def stats(self, request):
    """Get communication statistics"""
    queryset = self.get_queryset()

    total = queryset.count()
    unread = queryset.filter(is_read=False).count()
    by_type = queryset.values('communication_type').annotate(count=Count('id'))
    by_status = queryset.values('status').annotate(count=Count('id'))

    return Response({
        'total': total,
        'unread': unread,
        'resolved': queryset.filter(status='resolved').count(),
        'pending': queryset.filter(status='pending').count(),
        'by_type': list(by_type),
        'by_status': list(by_status),
    })

@action(detail=False, methods=['get'])
def sentiment_analysis(self, request):
    """AI-powered sentiment analysis"""
    # Basic implementation - can be enhanced with real AI
    queryset = self.get_queryset()

    # Simple sentiment calculation based on keywords
    positive_keywords = ['good', 'great', 'excellent', 'love', 'amazing']
    negative_keywords = ['bad', 'terrible', 'hate', 'awful', 'worst']

    positive_count = 0
    negative_count = 0
    neutral_count = 0

    for comm in queryset:
        message_lower = comm.message.lower()
        if any(word in message_lower for word in positive_keywords):
            positive_count += 1
        elif any(word in message_lower for word in negative_keywords):
            negative_count += 1
        else:
            neutral_count += 1

    total = queryset.count()

    return Response({
        'sentiment': {
            'positive': positive_count,
            'negative': negative_count,
            'neutral': neutral_count,
            'positive_percentage': (positive_count / max(total, 1)) * 100,
            'negative_percentage': (negative_count / max(total, 1)) * 100,
            'neutral_percentage': (neutral_count / max(total, 1)) * 100,
        },
        'total_analyzed': total,
        'ai_enabled': False,  # Set to True when real AI is implemented
    })
```

## 2. User Approval System Frontend (CRITICAL MISSING)

**Priority**: 🔴 CRITICAL (Week 1)
**Effort**: 8-10 hours
**Impact**: Enables cook/delivery agent approval workflow

**Backend Status**: ✅ Complete (authentication app)
**Frontend Status**: ❌ Missing UI components

**Required Frontend Changes**:

```tsx
// In UserManagementHub.tsx - Add to user table actions
{
  user.approval_status === "pending" && (
    <>
      <DropdownMenuSeparator />
      <DropdownMenuItem onClick={() => handleApprove(user.id)}>
        <UserCheck className="h-4 w-4 mr-2" />
        Approve User
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => handleReject(user.id)}>
        <UserX className="h-4 w-4 mr-2" />
        Reject User
      </DropdownMenuItem>
    </>
  );
}

// Add handler functions
const handleApprove = async (userId: number) => {
  try {
    await adminService.approveUser(userId, "approve", "");
    toast.success("User approved successfully");
    loadUsers();
  } catch (error) {
    toast.error("Failed to approve user");
  }
};
```

**AdminService Update**:

```typescript
// Fix endpoint URL from:
`${this.baseUrl}/users/${userId}/approve_user/`// To:
`/auth/admin/user/${userId}/approve/`;
```

## 3. Analytics Service Real Data Connection

Replace mock data in `frontend/src/services/analyticsService.ts`:

```typescript
// Replace this mock implementation:
async getRevenueAnalytics(range: string = '30d'): Promise<RevenueAnalytics> {
  // REMOVE ALL MOCK DATA
  try {
    const response = await apiClient.get(`/admin-management/dashboard/revenue_analytics/`, {
      params: { range }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching revenue analytics:', error);
    throw error;
  }
}
```

**Priority**: 🟡 MEDIUM (Week 3)
**Effort**: 6-8 hours
**Status**: Fallback data in place, needs real endpoint connection

## 4. Payment Management UI Implementation (HIGH PRIORITY)

**Priority**: 🟡 HIGH (Week 2)
**Effort**: 15-20 hours
**Impact**: Enables revenue management through admin interface

**Backend Status**: ✅ Complete (payments app endpoints working)
**Frontend Status**: ❌ Missing admin interface

**Available Backend Endpoints**:

- `/api/payments/transactions/` - Transaction management ✅
- `/api/payments/refunds/` - Refund processing ✅
- `/api/payments/methods/` - Payment methods ✅
- `/api/payments/stats/` - Payment statistics ✅

**Required Frontend Components**:

```tsx
// Create new file: src/pages/admin/PaymentManagementHub.tsx
// - Transaction history dashboard
// - Refund management interface
// - Payment analytics view
// - Failed payment alerts
```

**Navigation Updates**:

```tsx
// Add to AppRoutes.tsx
<Route path="/admin/payments" element={<PaymentManagementHub />} />

// Add to AdminLayout navigation
{
  label: "Payment Management",
  href: "/admin/payments",
  icon: CreditCard
}
```

## 5. Payment Service Implementation

Create `frontend/src/services/paymentService.ts`:

```typescript
import { apiClient } from "./apiClient";

export interface Payment {
  id: number;
  order: number;
  amount: number;
  status: string;
  payment_method: string;
  created_at: string;
}

export interface PaymentMethod {
  id: number;
  name: string;
  type: string;
  is_active: boolean;
}

class PaymentService {
  private baseUrl = "/payments";

  async processPayment(data: {
    order_id: number;
    amount: number;
    payment_method: string;
  }): Promise<Payment> {
    const response = await apiClient.post(`${this.baseUrl}/payments/`, data);
    return response.data;
  }

  async getPaymentMethods(): Promise<PaymentMethod[]> {
    const response = await apiClient.get(`${this.baseUrl}/methods/`);
    return response.data.results || response.data;
  }

  async getTransactionHistory(
    params: {
      page?: number;
      limit?: number;
      status?: string;
    } = {}
  ): Promise<{
    results: Payment[];
    count: number;
    next: string | null;
    previous: string | null;
  }> {
    const response = await apiClient.get(`${this.baseUrl}/transactions/`, {
      params,
    });
    return response.data;
  }

  async requestRefund(paymentId: number, reason: string): Promise<any> {
    const response = await apiClient.post(`${this.baseUrl}/refunds/`, {
      payment: paymentId,
      reason,
      amount: null, // Full refund by default
    });
    return response.data;
  }

  async getPaymentStats(): Promise<{
    total_payments: number;
    total_revenue: number;
    successful_payments: number;
    failed_payments: number;
    refund_rate: number;
  }> {
    const response = await apiClient.get(`${this.baseUrl}/stats/`);
    return response.data;
  }
}

export const paymentService = new PaymentService();
```

## 4. Backend Payment Stats Endpoint

Add to `backend/apps/payments/views.py`:

```python
@action(detail=False, methods=['get'])
def stats(self, request):
    """Get payment statistics"""
    from django.db.models import Sum, Count

    payments = Payment.objects.all()

    total_payments = payments.count()
    total_revenue = payments.filter(status='completed').aggregate(
        total=Sum('amount')
    )['total'] or 0

    successful_payments = payments.filter(status='completed').count()
    failed_payments = payments.filter(status='failed').count()

    refunds = Refund.objects.count()
    refund_rate = (refunds / max(total_payments, 1)) * 100

    return Response({
        'total_payments': total_payments,
        'total_revenue': float(total_revenue),
        'successful_payments': successful_payments,
        'failed_payments': failed_payments,
        'refund_rate': round(refund_rate, 2),
        'success_rate': round((successful_payments / max(total_payments, 1)) * 100, 2),
    })
```

## 5. Fix Field Name Mismatches

Update `backend/apps/admin_management/serializers.py`:

```python
class AdminUserSummarySerializer(serializers.ModelSerializer):
    # Map backend field names to frontend expectations
    id = serializers.IntegerField(source='user_id')  # Map user_id -> id

    class Meta:
        model = User
        fields = [
            'id',           # Mapped from user_id
            'email',
            'name',
            'role',
            'is_active',
            'last_login',
            'date_joined',
        ]
```

## 6. Remove Duplicate Admin URLs

In `backend/config/urls.py`, remove the duplicate:

```python
urlpatterns = [
    # ... other patterns ...

    # REMOVE THIS LINE:
    # path('api/admin/', include('apps.admin_panel.urls')),

    # KEEP ONLY THIS:
    path('api/admin-management/', include('apps.admin_management.urls')),

    # ... rest of patterns ...
]
```
