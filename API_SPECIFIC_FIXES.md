# 🔧 Specific API Fixes for ChefSync Admin

## Quick Start Testing

### 1. Test Backend is Running

```bash
cd backend
python manage.py runserver
```

### 2. Run Automated Test

```bash
# From project root
python test_api_endpoints.py
```

This will test all endpoints and show you exactly what's working and what's not.

---

## Known Working Endpoints (No Changes Needed)

### ✅ Dashboard APIs

```
GET /api/admin-management/dashboard/stats/
GET /api/admin-management/dashboard/system_health/
GET /api/admin-management/dashboard/recent_activities/
GET /api/admin-management/dashboard/recent_orders/
GET /api/admin-management/dashboard/revenue_trend/
GET /api/admin-management/dashboard/orders_trend/
GET /api/admin-management/dashboard/weekly_performance/
GET /api/admin-management/dashboard/growth_analytics/
GET /api/admin-management/dashboard/orders_distribution/
GET /api/admin-management/dashboard/new_users/
GET /api/admin-management/dashboard/recent_deliveries/
```

### ✅ User Management APIs

```
GET  /api/admin-management/users/list_users/
GET  /api/admin-management/users/{id}/details/
POST /api/admin-management/users/bulk_activate/
POST /api/admin-management/users/bulk_deactivate/
POST /api/admin-management/users/bulk_delete/
PATCH /api/admin-management/users/{id}/update_user_status/
PATCH /api/admin-management/users/{id}/update_user/
```

### ✅ User Approval APIs (Authentication App)

```
GET  /api/auth/admin/pending-approvals/
POST /api/auth/admin/user/{id}/approve/
```

### ✅ Food Management APIs

```
GET   /api/food/admin/foods/
POST  /api/food/admin/foods/
GET   /api/food/admin/foods/{id}/
PATCH /api/food/admin/foods/{id}/
DELETE /api/food/admin/foods/{id}/
GET   /api/food/customer/foods/
GET   /api/food/cuisines/
GET   /api/food/categories/
GET   /api/food/offers/
GET   /api/food/stats/
```

### ✅ Order Management APIs

```
GET /api/admin-management/orders/list_orders/
GET /api/admin-management/orders/{id}/details/
```

### ✅ Communication Basic APIs

```
GET   /api/communications/communications/
POST  /api/communications/communications/
GET   /api/communications/communications/{id}/
PATCH /api/communications/communications/{id}/
DELETE /api/communications/communications/{id}/
POST  /api/communications/communications/{id}/responses/
GET   /api/communications/templates/
GET   /api/communications/categories/
GET   /api/communications/tags/
```

---

## Communication Advanced Features (Verify These)

These endpoints are implemented in `backend/apps/communications/views.py` but need testing:

### 📊 Statistics Endpoints

**File:** `backend/apps/communications/views.py` Line 300+

```python
@action(detail=False, methods=["get"])
def stats(self, request):
    """Get communication statistics"""
    # Implementation exists
```

**Frontend Call:** `communicationService.ts` Line ~800

```typescript
async getCommunicationStats(): Promise<CommunicationStats> {
    const response = await apiClient.get("/communications/communications/stats/");
    return response.data;
}
```

**Test:**

```bash
curl http://localhost:8000/api/communications/communications/stats/ \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 🎯 Sentiment Analysis

**File:** `backend/apps/communications/views.py` Line 343+

```python
@action(detail=False, methods=["get"])
def sentiment_analysis(self, request):
    """Get sentiment analysis data"""
    # Implementation exists
```

**Frontend Call:** `communicationService.ts` Line ~830

```typescript
async getSentimentAnalysis(period: string = "30d"): Promise<any> {
    const response = await apiClient.get(
        "/communications/communications/sentiment_analysis/",
        { params: { period } }
    );
    return response.data;
}
```

**Test:**

```bash
curl http://localhost:8000/api/communications/communications/sentiment_analysis/?period=30d \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 🔔 Notifications

**File:** `backend/apps/communications/views.py` Line 385+

```python
@action(detail=False, methods=["get"])
def notifications(self, request):
    """Get communication notifications"""
    # Implementation exists
```

**Test:**

```bash
curl http://localhost:8000/api/communications/communications/notifications/ \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 📈 Campaign Stats

**File:** `backend/apps/communications/views.py` Line 413+

```python
@action(detail=False, methods=["get"])
def campaign_stats(self, request):
    """Get campaign statistics"""
    # Implementation exists
```

**Test:**

```bash
curl http://localhost:8000/api/communications/communications/campaign_stats/ \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 🚚 Delivery Stats

**File:** `backend/apps/communications/views.py` Line 439+

```python
@action(detail=False, methods=["get"])
def delivery_stats(self, request):
    """Get delivery statistics"""
    # Implementation exists
```

**Test:**

```bash
curl http://localhost:8000/api/communications/communications/delivery_stats/?period=30d \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## If Endpoints Return 404

If any endpoint returns 404, check these:

### 1. ViewSet Action Decorator

Ensure the method has `@action` decorator in views.py:

```python
from rest_framework.decorators import action

@action(detail=False, methods=['get'])
def stats(self, request):
    # Your code
```

### 2. Router Registration

Ensure ViewSet is registered in urls.py:

```python
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
router.register(r'communications', views.CommunicationViewSet)
```

### 3. URL Include

Ensure URLs are included in main urls.py:

```python
# backend/config/urls.py
urlpatterns = [
    path('api/communications/', include('apps.communications.urls')),
]
```

---

## If Endpoints Return 401/403

### Issue: Authentication Required

**Solution:** Ensure you're passing the token correctly:

```typescript
// frontend/src/services/apiClient.ts
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### Issue: Permission Denied

**Check:** Backend permission classes:

```python
# In ViewSet
permission_classes = [IsAuthenticated]  # or IsAdminUser
```

---

## If Endpoints Return 500

### 1. Check Backend Logs

```bash
# Watch logs in real-time
cd backend
python manage.py runserver
# Check console output when making requests
```

### 2. Common Issues

**Missing Database Records:**

```python
# Add try-except blocks
try:
    data = Model.objects.get(id=some_id)
except Model.DoesNotExist:
    return Response({"error": "Not found"}, status=404)
```

**Database Query Errors:**

```python
# Check for annotation/aggregation issues
queryset = Model.objects.annotate(
    total=Sum('amount')
).aggregate(
    grand_total=Sum('total')
)
```

**Import Errors:**

```python
# Ensure all models are imported
from apps.food.models import Food
from apps.orders.models import Order
```

---

## Frontend Error Handling

### Current Error Handling

**File:** `frontend/src/services/communicationService.ts`

```typescript
// Good: Already has error handling
async getCommunicationStats(): Promise<CommunicationStats> {
    try {
        const response = await apiClient.get("/communications/communications/stats/");
        return response.data;
    } catch (error) {
        return this.handleError(error, "getCommunicationStats");
    }
}

// Silently handles 404 for optional endpoints
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const url = error.config?.url || "";
    const isFallbackEndpoint =
      url.includes("/stats") ||
      url.includes("/sentiment-analysis") ||
      url.includes("/notifications");

    if (status === 404 && isFallbackEndpoint) {
      // Silently handle 404s for optional endpoints
      return Promise.reject(error);
    }
    // ... show toast for other errors
  }
);
```

This is **GOOD** ✅ - Optional endpoints won't break the UI

---

## Quick Fixes for Common Issues

### Fix #1: Import Model in Views

If you get `NameError: name 'Food' is not defined`:

```python
# Add to top of views.py
from apps.food.models import Food
from apps.orders.models import Order
from apps.users.models import User
```

### Fix #2: Handle Empty QuerySets

If you get errors when no data exists:

```python
# Before
total = Order.objects.aggregate(Sum('amount'))['amount__sum']

# After
total = Order.objects.aggregate(Sum('amount'))['amount__sum'] or 0
```

### Fix #3: CORS Issues

If you get CORS errors:

```python
# backend/config/settings.py
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",  # Vite dev server
    "http://localhost:3000",  # Alternative port
]

CORS_ALLOW_CREDENTIALS = True
```

### Fix #4: Token Expiry

If tokens expire quickly:

```python
# backend/config/settings.py
from datetime import timedelta

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=24),  # Increase from 5 minutes
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
}
```

---

## Testing Checklist

Use this checklist to test each feature:

### ✅ Dashboard

- [ ] Dashboard loads without errors
- [ ] Statistics show correct numbers
- [ ] Charts render properly
- [ ] Recent activities display
- [ ] Recent orders display

### ✅ User Management

- [ ] User list loads
- [ ] Can search users
- [ ] Can filter by role
- [ ] Can update user status
- [ ] Bulk operations work

### ✅ User Approval

- [ ] Pending approvals list loads
- [ ] Can view user documents
- [ ] Can approve users
- [ ] Can reject users
- [ ] Notifications sent on approval

### ✅ Food Management

- [ ] Food list loads
- [ ] Can create new food
- [ ] Can edit food
- [ ] Can delete food
- [ ] Images upload correctly
- [ ] Categories and cuisines load

### ✅ Order Management

- [ ] Order list loads
- [ ] Can view order details
- [ ] Can update order status
- [ ] Can assign chef
- [ ] Can assign delivery agent

### ✅ Communication

- [ ] Communication list loads
- [ ] Can create communication
- [ ] Can add responses
- [ ] Can update status
- [ ] Statistics display (or gracefully fallback)
- [ ] Email templates work

### ✅ Notifications

- [ ] Notification list loads
- [ ] Unread count displays
- [ ] Can mark as read
- [ ] Can mark all as read

---

## Debug Mode

Enable debug output in frontend:

```typescript
// In any service file, add:
if (import.meta.env.DEV) {
  console.log("[DEBUG] API Call:", endpoint, params);
  console.log("[DEBUG] Response:", response.data);
}
```

Enable debug in Django:

```python
# backend/config/settings.py
DEBUG = True

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'DEBUG',
    },
}
```

---

## Contact & Support

**Still having issues?**

1. Run the test script: `python test_api_endpoints.py`
2. Check backend logs in terminal
3. Check browser console (F12)
4. Check Network tab in DevTools
5. Look for specific error messages

**Common Error Patterns:**

- 404 → URL routing issue
- 401 → Authentication issue
- 403 → Permission issue
- 500 → Backend code error
- CORS → Cross-origin issue

---

**You've got this! 🚀**
