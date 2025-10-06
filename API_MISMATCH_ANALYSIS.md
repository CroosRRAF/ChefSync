## 🔧 API Endpoint Mismatch Fix Report

### **Step 1: Backend URL Analysis**

**✅ CORRECT Backend Endpoints (from urls.py files):**

```
/api/food/admin/foods/           # AdminFoodViewSet ✅
/api/food/offers/                # OfferViewSet ✅
/api/food/stats/                 # food_stats view ✅
/api/food/customer/foods/        # CustomerFoodViewSet ✅
/api/food/cuisines/              # CuisineViewSet ✅
/api/food/categories/            # FoodCategoryViewSet ✅

/api/admin-management/users/             # AdminUserManagementViewSet ✅
/api/admin-management/dashboard/         # AdminDashboardViewSet ✅
/api/admin-management/orders/            # AdminOrderManagementViewSet ✅
/api/admin-management/notifications/     # AdminNotificationViewSet ✅
/api/admin-management/settings/          # AdminSystemSettingsViewSet ✅

/api/auth/                       # Authentication endpoints ✅
/api/orders/                     # Order endpoints ✅
/api/payments/                   # Payment endpoints ✅
```

### **❌ MISMATCHED Frontend API Calls:**

#### **1. adminService.ts Issues:**

```typescript
// ❌ WRONG:
await apiClient.get(`/auth/admin/pending-approvals/`);
await apiClient.post(`/auth/admin/user/${userId}/approve/`);

// ✅ SHOULD BE:
await apiClient.get(`/api/admin-management/users/pending_approvals/`);
await apiClient.post(`/api/admin-management/users/${userId}/approve/`);
```

#### **2. menuService.ts Issues:**

```typescript
// ❌ WRONG (double /api prefix):
await apiClient.get(`/api/food/customer/foods/?${searchParams}`);
await apiClient.get(`/api/food/cuisines/`);

// ✅ SHOULD BE:
await apiClient.get(`/food/customer/foods/?${searchParams}`);
await apiClient.get(`/food/cuisines/`);
```

#### **3. foodService.ts Issues:**

```typescript
// ❌ THESE ARE ACTUALLY CORRECT! ✅
// Backend has: router.register(r'admin/foods', views.AdminFoodViewSet)
// So /api/food/admin/foods/ is correct
```

### **Step 2: Required Fixes**

#### **Fix 1: adminService.ts - Update admin endpoints**

- Replace `/auth/admin/` with `/api/admin-management/users/`
- These endpoints exist in AdminUserManagementViewSet

#### **Fix 2: menuService.ts - Remove double /api prefix**

- API base URL is already `/api`, so endpoints should not start with `/api/`

#### **Fix 3: Verify missing endpoints in backend**

- Check if some frontend calls are for endpoints that don't exist yet

### **Step 3: Implementation Plan**

1. **Update adminService.ts** - Fix auth admin endpoints
2. **Update menuService.ts** - Remove double /api prefix
3. **Test all API calls** - Verify they work with backend
4. **Add missing endpoints** - Only if frontend requires functionality not in backend

### **Step 4: Validation**

Run tests to ensure:

- ✅ Admin dashboard loads correctly
- ✅ User management functions work
- ✅ Food menu displays properly
- ✅ Content management CRUD operations work
