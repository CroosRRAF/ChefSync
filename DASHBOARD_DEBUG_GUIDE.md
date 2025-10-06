# 🔍 Dashboard Empty Data - Complete Debug Guide

## Problem Summary

Dashboard connects successfully (authentication works) but shows empty arrays for `recentOrders` and `recentDeliveries`.

## ✅ What We Know

1. **Database has data**: 7 orders total, 4 deliveries (delivered status)
2. **Authentication works**: Login successful, user role = admin
3. **Console shows**: Empty arrays `[]` for both tables
4. **Frontend and Backend servers**: Both running

---

## 🎯 Step-by-Step Debugging Process

### **STEP 1: Check Browser Network Tab** (Most Important!)

Open Chrome DevTools (F12) → Network tab → Refresh dashboard

Look for these API calls:

```
/api/admin-management/dashboard/recent_orders/?limit=5
/api/admin-management/dashboard/recent_deliveries/?limit=5
```

**Check each request:**

#### ✅ What to look for:

```
Status: 200 OK          ← Should be 200, not 404/500/403
Response Preview: [...]  ← Should be an array with objects
Response Size: > 100B    ← Empty arrays are tiny (~2 bytes)
```

#### ❌ Common Issues:

**Issue 1: 404 Not Found**

```
Problem: URL is wrong
Solution: Check API base URL in frontend
Expected URL: http://127.0.0.1:8000/api/admin-management/dashboard/recent_orders/
```

**Issue 2: 403 Forbidden**

```
Problem: Authentication/permission issue
Solution: Check Authorization header has Bearer token
Check user has admin role
```

**Issue 3: 500 Server Error**

```
Problem: Backend crash/error
Solution: Check Django console for error traceback
Check backend logs
```

**Issue 4: 200 but empty array `[]`**

```
Problem: Query filtering out all data
Solution: Check date filters, status filters, role-based filters
```

---

### **STEP 2: Check Browser Console Logs**

With our new debug logs, you should see:

```javascript
[Dashboard] Starting API calls with timeFilter: 30d days: 30
[AdminService] Calling getRecentOrders with limit=5
[AdminService] getRecentOrders response: [...]  ← **Should have data here**
[AdminService] Calling getRecentDeliveries with limit=5
[AdminService] getRecentDeliveries response: [...] ← **Should have data here**
[Dashboard] All API calls completed
[Dashboard] recentOrdersData: [...]  ← **Should have data here**
[Dashboard] recentDeliveries Data: [...]  ← **Should have data here**
```

**If you see empty `[]` at the response level**, the problem is backend.
**If you see data in response but empty in state**, the problem is frontend transformation.

---

### **STEP 3: Check Backend Logs** (Django Console)

Look for these logs in the Django terminal:

```python
recent_orders called with limit=5
Found 5 recent orders
Serialized data: [{'id': 307, 'customer_name': 'Roshini Peris', ...}]

recent_deliveries called with limit=5
Found 4 recent orders for deliveries
Delivery data: {'id': 306, 'customer_name': 'Harsha Senanayake', ...}
Returning 4 deliveries
```

**If you DON'T see these logs**: Frontend isn't calling the API (check Step 1)
**If you see "Found 0" logs**: Backend query is filtering out data (see Step 4)
**If you see errors**: Backend code has a bug (see error message)

---

### **STEP 4: Verify Backend Query**

Run this in Django shell to test the exact query:

```bash
cd backend
venv\Scripts\activate  # Windows
python manage.py shell
```

```python
from apps.orders.models import Order

# Test recent_orders query
recent_orders = Order.objects.select_related("customer", "chef").order_by("-created_at")[:5]
print(f"Found {len(recent_orders)} orders")
for order in recent_orders:
    print(f"  Order {order.id}: {order.customer.name if order.customer else 'No customer'}")

# Test recent_deliveries query
deliveries = Order.objects.filter(
    status__in=["delivered", "out_for_delivery", "in_transit"]
).select_related("customer", "delivery_partner").order_by("-created_at")[:5]
print(f"\nFound {len(deliveries)} deliveries")
for delivery in deliveries:
    print(f"  Order {delivery.id}: {delivery.status}, {delivery.customer.name if delivery.customer else 'No customer'}")
```

**Expected output:**

```
Found 5 orders
  Order 307: Roshini Peris
  Order 306: Harsha Senanayake
  ...

Found 4 deliveries
  Order 306: delivered, Harsha Senanayake
  ...
```

**If this returns empty**: Check database (Step 5)
**If this returns data**: Backend query works, problem is serializer or API

---

### **STEP 5: Check Database Directly**

```bash
python manage.py shell
```

```python
from apps.orders.models import Order
from django.contrib.auth import get_user_model

User = get_user_model()

# Check total orders
print(f"Total orders: {Order.objects.count()}")

# Check orders by status
from django.db.models import Count
statuses = Order.objects.values('status').annotate(count=Count('id'))
for status in statuses:
    print(f"  {status['status']}: {status['count']}")

# Check if orders have customers
orders_without_customers = Order.objects.filter(customer__isnull=True).count()
print(f"\nOrders without customers: {orders_without_customers}")

# Check customers exist
print(f"Total users: {User.objects.count()}")
print(f"Customers: {User.objects.filter(role='customer').count()}")
```

---

### **STEP 6: Test API with cURL/Postman**

Get your auth token from localStorage (F12 → Application → Local Storage → `access_token`)

```bash
# Test recent_orders
curl -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  http://127.0.0.1:8000/api/admin-management/dashboard/recent_orders/?limit=5

# Test recent_deliveries
curl -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  http://127.0.0.1:8000/api/admin-management/dashboard/recent_deliveries/?limit=5
```

**Expected response:**

```json
[
  {
    "id": 307,
    "order_number": "ORD-000307",
    "customer_name": "Roshini Peris",
    "total_amount": "2500.00",
    "status": "preparing",
    "created_at": "2024-01-15T10:30:00Z",
    "items_count": 3,
    "payment_status": "paid"
  },
  ...
]
```

---

### **STEP 7: Common Issues & Solutions**

#### Issue: "recentOrders" and "recentDeliveries" are `[]` in console

**Possible Causes:**

1. **API URL mismatch**

   ```typescript
   // Check in frontend/src/services/adminService.ts
   const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

   // Should proxy to: http://127.0.0.1:8000/api
   // Check vite.config.ts proxy settings
   ```

2. **Missing Authorization header**

   ```typescript
   // Check interceptor in adminService.ts
   config.headers.Authorization = `Bearer ${token}`;
   ```

3. **Backend filtering by date/time**

   ```python
   # In views.py, check if there are date filters like:
   .filter(created_at__gte=some_date)  # This might filter out old test data
   ```

4. **Serializer returning None for fields**

   ```python
   # Check AdminOrderSummarySerializer
   # Make sure all fields exist on Order model
   # Check customer.name vs customer.first_name
   ```

5. **Frontend data transformation bug**
   ```typescript
   // In Dashboard.tsx, check transformation:
   const transformedOrders = recentOrdersData.map((order) => ({
     // Make sure field names match API response
     customer_name: order.customer_name, // Not order.customerName
   }));
   ```

---

## 🚀 Quick Fix Checklist

- [ ] Both servers running (frontend :8081, backend :8000)
- [ ] Check Network tab → API calls return 200 OK
- [ ] Check Network tab → Response has data (not empty `[]`)
- [ ] Check Console → No red errors
- [ ] Check Console → Debug logs show API responses
- [ ] Check Django console → No errors or warnings
- [ ] Database has orders (run `python manage.py shell` check)
- [ ] Authorization token in localStorage
- [ ] User role is "admin" (check AuthContext logs)

---

## 📋 Information to Share for Help

If still not working, share:

1. **Network tab screenshot** showing:

   - Request URL
   - Status code
   - Response preview
   - Request headers (Authorization)

2. **Console logs** showing:

   ```
   [Dashboard] Starting API calls...
   [AdminService] getRecentOrders response: ...
   [Dashboard] recentOrdersData: ...
   ```

3. **Django console output** showing:

   ```
   recent_orders called with limit=5
   Found X recent orders
   ```

4. **Database check results**:
   ```python
   Total orders: X
   Orders by status: ...
   ```

---

## 🔧 Manual Fix: Direct API Call Test

Open browser console and run:

```javascript
// Get your token
const token = localStorage.getItem("access_token");

// Test API directly
fetch("/api/admin-management/dashboard/recent_orders/?limit=5", {
  headers: { Authorization: `Bearer ${token}` },
})
  .then((r) => r.json())
  .then((data) => console.log("API Response:", data))
  .catch((err) => console.error("API Error:", err));

// Test deliveries
fetch("/api/admin-management/dashboard/recent_deliveries/?limit=5", {
  headers: { Authorization: `Bearer ${token}` },
})
  .then((r) => r.json())
  .then((data) => console.log("Deliveries Response:", data))
  .catch((err) => console.error("Deliveries Error:", err));
```

This will show you **exactly** what the backend is returning!

---

## Expected Result

After fixing, you should see in console:

```
[AdminService] getRecentOrders response: Array(5)
  0: {id: 307, order_number: "ORD-000307", customer_name: "Roshini Peris", ...}
  1: {id: 306, order_number: "ORD-000306", customer_name: "Harsha Senanayake", ...}
  ...

Dashboard Debug - recentOrders state changed: Array(5) [...]
Dashboard Debug - Rendering Recent Orders Table with data: Array(5) [...]
```

And the tables will display the data! 🎉
