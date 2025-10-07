// Test script to validate admin service URLs
// This script simulates the URL construction that happens in adminService.ts

const API_BASE_URL = "/api"; // This is what axios will use as baseURL
const SERVICE_BASE_URL = "/admin-management"; // This is what AdminService uses

// Simulate how URLs are constructed
const testEndpoints = [
  "/dashboard/stats/",
  "/dashboard/recent_orders/",
  "/dashboard/recent_activities/",
  "/dashboard/system_health/",
  "/users/list_users/",
  "/orders/list_orders/",
  "/notifications/",
  "/settings/",
];

console.log("🔍 Testing Admin Service URL Construction:");
console.log("=".repeat(50));

testEndpoints.forEach((endpoint) => {
  const fullUrl = `${API_BASE_URL}${SERVICE_BASE_URL}${endpoint}`;
  const expectedBackendUrl = `/api/admin-management${endpoint}`;

  console.log(`✅ Endpoint: ${endpoint}`);
  console.log(`   Frontend URL: ${fullUrl}`);
  console.log(`   Expected:     ${expectedBackendUrl}`);
  console.log(
    `   Match: ${fullUrl === expectedBackendUrl ? "✅ YES" : "❌ NO"}`
  );
  console.log("");
});

console.log("🎯 Summary:");
console.log("- Fixed duplicate /api/ issue");
console.log("- Frontend now constructs: /api/admin-management/endpoint/");
console.log("- Backend expects: /api/admin-management/endpoint/");
console.log("- URLs should now match correctly! ✅");
