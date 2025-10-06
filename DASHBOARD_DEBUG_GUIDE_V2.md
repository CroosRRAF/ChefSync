# 🔍 Admin Dashboard Not Showing - Debug Guide

## Quick Diagnosis Checklist

### 1. ✅ **Backend Server Running?**

```bash
cd backend
python manage.py runserver
```

**Expected**: Server runs on `http://localhost:8000`

### 2. ✅ **Frontend Server Running?**

```bash
cd frontend
npm run dev
# or
bun run dev
```

**Expected**: Frontend runs on `http://localhost:5173`

### 3. ✅ **Test Backend API**

Run the test script:

```bash
python test_dashboard_endpoint.py
```

---

## Common Issues & Solutions

### Issue 1: "Dashboard Loading Forever"

**Symptoms:**

- Dashboard shows loading state
- Never displays data
- No error message

**Causes & Fixes:**

#### A. Backend Not Running

```bash
# Check if backend is running
curl http://localhost:8000/

# If not running, start it:
cd backend
python manage.py runserver
```

#### B. API Call Failing (Check Browser Console)

1. Open browser (F12)
2. Go to Console tab
3. Look for errors like:
   - `ERR_CONNECTION_REFUSED` → Backend not running
   - `401 Unauthorized` → Not logged in or token expired
   - `404 Not Found` → Wrong API endpoint
   - `500 Server Error` → Backend error

#### C. CORS Issue

Check browser console for CORS errors. If found:

```python
# backend/config/settings.py
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",  # Vite dev server
    "http://localhost:3000",  # Alternative port
]

CORS_ALLOW_CREDENTIALS = True
```

### Issue 2: "Blank Page / Nothing Shows"

**Symptoms:**

- Completely blank page
- No loading indicator
- No errors visible

**Causes & Fixes:**

#### A. JavaScript Error (Check Console)

1. Open browser console (F12)
2. Look for red errors
3. Common errors:
   - `Cannot read property of undefined` → Data structure mismatch
   - `Failed to fetch` → API connection issue
   - `Module not found` → Import error

#### B. Component Not Rendering

Check if the route is correct:

```
http://localhost:5173/admin/dashboard
```

Not:

```
http://localhost:5173/admin/
http://localhost:5173/dashboard
```

#### C. Authentication Issue

1. Make sure you're logged in as admin
2. Check localStorage has token:
   - Open Console (F12)
   - Type: `localStorage.getItem('access_token')`
   - Should show a token string
   - If null, you need to log in again

### Issue 3: "Shows Error Message"

**Symptoms:**

- Dashboard shows with error banner
- Says "Connection Issue" or similar
- May show fallback data

**Solution:**
This means API is failing. Follow these steps:

1. **Check Backend Console** (Terminal running Django)

   - Look for error messages
   - Look for 500 errors
   - Check for missing imports

2. **Run Migrations** (if needed)

   ```bash
   cd backend
   python manage.py migrate
   ```

3. **Check Database Has Data**

   ```bash
   cd backend
   python manage.py shell
   ```

   ```python
   from django.contrib.auth import get_user_model
   User = get_user_model()
   print(f"Total users: {User.objects.count()}")

   from apps.orders.models import Order
   print(f"Total orders: {Order.objects.count()}")
   ```

4. **Generate Test Data** (if database is empty)
   ```bash
   cd backend
   python create_admin_test_data.py
   # or
   python generate_test_data_safe.py
   ```

---

## Step-by-Step Debug Process

### Step 1: Open Browser Developer Tools

1. Open Chrome/Firefox
2. Press F12
3. Go to Console tab
4. Keep it open while loading dashboard

### Step 2: Navigate to Dashboard

```
http://localhost:5173/admin/dashboard
```

### Step 3: Check Console Output

Look for these messages:

**Good Signs:**

```
[Dashboard] Starting API calls with timeFilter: 30d
[Dashboard] All API calls completed
[Dashboard] recentOrdersData: [...]
```

**Bad Signs:**

```
Error loading dashboard data: Failed to fetch
net::ERR_CONNECTION_REFUSED
401 Unauthorized
500 Internal Server Error
```

### Step 4: Check Network Tab

1. Go to Network tab in DevTools
2. Filter by "XHR" or "Fetch"
3. Look for dashboard API calls
4. Check their status:
   - 200 = Success ✅
   - 401 = Not authorized ❌
   - 404 = Endpoint not found ❌
   - 500 = Server error ❌

### Step 5: Test API Directly

```bash
# Test with curl (replace YOUR_TOKEN with actual token)
curl http://localhost:8000/api/admin-management/dashboard/stats/ \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Expected response:

```json
{
  "total_users": 123,
  "total_orders": 456,
  "total_revenue": 12345.67,
  ...
}
```

---

## Quick Fixes

### Fix 1: Re-login

```
1. Clear localStorage: localStorage.clear()
2. Refresh page
3. Log in again with admin credentials
4. Navigate to dashboard
```

### Fix 2: Restart Servers

```bash
# Kill both servers (Ctrl+C)

# Start backend
cd backend
python manage.py runserver

# In new terminal, start frontend
cd frontend
npm run dev
```

### Fix 3: Check Admin User Exists

```bash
cd backend
python manage.py createsuperuser
# Email: admin@chefsync.com
# Password: Admin@123
```

### Fix 4: Clear Browser Cache

```
1. Open DevTools (F12)
2. Right-click refresh button
3. Select "Empty Cache and Hard Reload"
```

---

## Debugging Output

### Backend Logs to Check

Look in backend terminal for:

```
GET /api/admin-management/dashboard/stats/ HTTP/1.1" 200 1234
```

### Frontend Console to Check

Look in browser console for:

```
[Dashboard] Starting API calls...
[Dashboard] All API calls completed
```

### Database to Check

```bash
cd backend
python manage.py dbshell
```

```sql
SELECT COUNT(*) FROM users_user;
SELECT COUNT(*) FROM orders_order;
```

---

## Still Not Working?

### Collect This Information:

1. **Backend Status:**

   - Is server running? (Y/N)
   - Port: (8000?)
   - Any errors in terminal? (Copy/paste)

2. **Frontend Status:**

   - Is server running? (Y/N)
   - Port: (5173?)
   - Any errors in terminal? (Copy/paste)

3. **Browser Console:**

   - Any red errors? (Copy/paste)
   - Network tab shows what status codes?

4. **Authentication:**

   - Are you logged in?
   - Token exists? `localStorage.getItem('access_token')`
   - User role? Check: `localStorage.getItem('user')`

5. **Run Test Script:**
   ```bash
   python test_dashboard_endpoint.py
   ```
   Copy the output

---

## Most Common Solution

**90% of the time, the issue is:**

1. ❌ Backend not running
2. ❌ Not logged in as admin
3. ❌ Token expired

**Quick fix:**

```bash
# Terminal 1: Start backend
cd backend
python manage.py runserver

# Terminal 2: Start frontend
cd frontend
npm run dev

# Browser:
1. Go to http://localhost:5173
2. Log in with admin credentials
3. Go to http://localhost:5173/admin/dashboard
```

---

## Contact Info

If still stuck, provide:

1. Screenshots of browser console errors
2. Backend terminal output
3. Output of `python test_dashboard_endpoint.py`
4. Operating system and browser version

---

**Remember**: Check browser console FIRST. It will tell you exactly what's wrong! 🔍
