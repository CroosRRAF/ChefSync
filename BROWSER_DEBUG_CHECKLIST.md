# 🔍 Browser-Side Dashboard Debug Checklist

## All backend checks passed! ✅

The issue is likely in the **browser**. Follow these steps:

---

## Step 1: Open Browser Developer Tools

1. Open your browser
2. Press **F12** (or right-click → Inspect)
3. Go to **Console** tab
4. Keep it open

---

## Step 2: Navigate to Dashboard

Go to: `http://localhost:5173/admin/dashboard`

---

## Step 3: Check Console for Errors

### Look for these specific errors:

#### ❌ Error: "Failed to fetch" or "Network Error"

**Problem**: Frontend can't reach backend
**Solution**:

```bash
# Check if backend is really running
curl http://localhost:8000/api/admin-management/dashboard/stats/
```

#### ❌ Error: "401 Unauthorized"

**Problem**: Not logged in or token expired
**Solution**:

1. Log out
2. Log in again with admin credentials
3. Try dashboard again

#### ❌ Error: "Cannot read property '...' of undefined"

**Problem**: Data structure mismatch
**Check Console**:

```javascript
// Paste this in console to check what data is received:
fetch("http://localhost:8000/api/admin-management/dashboard/stats/", {
  headers: {
    Authorization: "Bearer " + localStorage.getItem("access_token"),
  },
})
  .then((r) => r.json())
  .then((d) => console.log("Dashboard Data:", d));
```

#### ❌ Error: "Module not found" or "Import error"

**Problem**: Missing dependencies
**Solution**:

```bash
cd frontend
npm install
# or
bun install
```

---

## Step 4: Check Network Tab

1. Go to **Network** tab in DevTools
2. Filter by **XHR** or **Fetch**
3. Reload the page
4. Look for requests to `/api/admin-management/dashboard/stats/`

### Check the Status:

- **200** ✅ = Good! Data received
- **401** ❌ = Not authenticated
- **404** ❌ = Endpoint not found
- **500** ❌ = Backend error
- **(failed)** ❌ = Can't connect to backend

---

## Step 5: Check Authentication

### In Console, run:

```javascript
// Check if you're logged in
console.log("Token:", localStorage.getItem("access_token"));
console.log("User:", JSON.parse(localStorage.getItem("user") || "{}"));
```

### Expected Output:

```javascript
Token: "eyJ0eXAiOiJKV1QiLCJhbG..." // Long string
User: {email: "admin@...", role: "admin", ...}
```

### If Token is null:

1. You need to log in
2. Go to: `http://localhost:5173/login`
3. Use admin credentials
4. Return to dashboard

---

## Step 6: Test API Manually

### In Console, paste this:

```javascript
// Test the API call
const token = localStorage.getItem("access_token");

fetch("http://localhost:8000/api/admin-management/dashboard/stats/", {
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
})
  .then((response) => {
    console.log("Status:", response.status);
    return response.json();
  })
  .then((data) => {
    console.log("Dashboard Stats:", data);
    console.log("Total Users:", data.total_users);
    console.log("Total Orders:", data.total_orders);
    console.log("Total Revenue:", data.total_revenue);
  })
  .catch((error) => {
    console.error("Error:", error);
  });
```

### Expected Output:

```javascript
Status: 200
Dashboard Stats: {total_users: 115, total_orders: 7, ...}
Total Users: 115
Total Orders: 7
Total Revenue: 12345.67
```

---

## Step 7: Check if Component is Loading

### Look for these console messages:

```
[Dashboard] Starting API calls with timeFilter: 30d
[Dashboard] All API calls completed
[Dashboard] recentOrdersData: [...]
```

### If you DON'T see these:

- Component might not be mounting
- Check for JavaScript errors above them

---

## Common Solutions

### Solution 1: Clear Everything and Re-login

```javascript
// In console:
localStorage.clear();
sessionStorage.clear();
// Then refresh page and log in again
```

### Solution 2: Hard Refresh

- Windows/Linux: **Ctrl + Shift + R**
- Mac: **Cmd + Shift + R**
- Or: **Ctrl + F5**

### Solution 3: Check CORS

If you see CORS errors, update backend settings:

```python
# backend/config/settings.py
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:3000",
]
CORS_ALLOW_CREDENTIALS = True
```

Then restart backend.

### Solution 4: Check Frontend Proxy

```typescript
// frontend/vite.config.ts
export default defineConfig({
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
    },
  },
});
```

---

## What to Look For

### ✅ Good Signs:

- Console shows `[Dashboard] Starting API calls...`
- Network tab shows 200 status for API calls
- Data is logged in console
- No red errors

### ❌ Bad Signs:

- Red errors in console
- Failed network requests
- 401/403/404/500 status codes
- "Cannot read property" errors
- Empty token or null user

---

## Most Likely Issues (in order):

1. **Not logged in / Token expired** (80% of cases)

   - Solution: Log out and log in again

2. **CORS issue** (10% of cases)

   - Solution: Update CORS settings in backend

3. **Component error** (5% of cases)

   - Solution: Check console for JavaScript errors

4. **API base URL wrong** (5% of cases)
   - Solution: Check vite.config.ts proxy settings

---

## Screenshot Checklist

If still stuck, take screenshots of:

1. ✅ Browser console (with all errors visible)
2. ✅ Network tab (showing failed requests)
3. ✅ Result of localStorage check
4. ✅ Result of manual API test in console
5. ✅ The actual dashboard page (what you see)

---

## Next Steps

### If Everything Shows Green but Dashboard Still Blank:

1. Check React DevTools

   - Install React Developer Tools extension
   - Check if Dashboard component is mounted
   - Check component state

2. Check for CSS Issues

   - Maybe everything is there but invisible?
   - Press Ctrl+U to view page source
   - Check if content is in HTML but not visible

3. Try Incognito Mode
   - Maybe browser extension is interfering
   - Open in incognito/private browsing
   - Try dashboard again

---

## Emergency: Force Debug Mode

Add this to Dashboard.tsx temporarily:

```typescript
useEffect(() => {
  console.log("Dashboard mounted!");
  console.log("User:", user);
  console.log("Loading:", loading);
  console.log("Error:", error);
  console.log("Stats:", stats);
}, [user, loading, error, stats]);
```

This will log everything as dashboard loads.

---

## Still Stuck?

Run this in console and copy the output:

```javascript
const debugInfo = {
  url: window.location.href,
  token: localStorage.getItem("access_token") ? "EXISTS" : "MISSING",
  user: JSON.parse(localStorage.getItem("user") || "{}"),
  apiBase: import.meta.env.VITE_API_BASE_URL || "/api",
};
console.log("DEBUG INFO:", JSON.stringify(debugInfo, null, 2));
```

Share this output for help.

---

**Remember**: 99% of the time, it's either:

1. Not logged in
2. Token expired
3. CORS issue

**Quick fix**: Log out, log in again, try dashboard. 🚀
