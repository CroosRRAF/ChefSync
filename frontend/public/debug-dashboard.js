// ========================================
// QUICK DASHBOARD API TEST
// ========================================
// Copy and paste this entire script into your browser console (F12)
// while on the dashboard page
// ========================================

console.log(
  "%c🔍 Starting Dashboard API Debug Test...",
  "color: #00ff00; font-size: 16px; font-weight: bold"
);

// Step 1: Check if token exists
const token = localStorage.getItem("access_token");
if (!token) {
  console.error("❌ No access_token found in localStorage!");
  console.log("💡 Try logging in again");
} else {
  console.log("✅ Access token found:", token.substring(0, 20) + "...");
}

// Step 2: Test recent_orders API
console.log(
  "\n%c📦 Testing Recent Orders API...",
  "color: #00aaff; font-size: 14px"
);
fetch("/api/admin-management/dashboard/recent_orders/?limit=5", {
  method: "GET",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
})
  .then((response) => {
    console.log("Status:", response.status, response.statusText);
    if (response.status === 200) {
      console.log("✅ Recent Orders API responded with 200 OK");
    } else if (response.status === 404) {
      console.error("❌ 404 Not Found - Check API URL");
    } else if (response.status === 403) {
      console.error("❌ 403 Forbidden - Check permissions");
    } else if (response.status === 401) {
      console.error("❌ 401 Unauthorized - Token invalid or expired");
    } else if (response.status === 500) {
      console.error("❌ 500 Server Error - Check Django console");
    }
    return response.json();
  })
  .then((data) => {
    console.log(
      "Response data type:",
      Array.isArray(data) ? "Array" : typeof data
    );
    console.log("Number of orders:", Array.isArray(data) ? data.length : "N/A");

    if (Array.isArray(data) && data.length > 0) {
      console.log("✅ API returned orders!");
      console.log("Sample order:", data[0]);
      console.table(
        data.map((o) => ({
          id: o.id,
          customer: o.customer_name,
          amount: o.total_amount,
          status: o.status,
          items: o.items_count,
        }))
      );
    } else if (Array.isArray(data) && data.length === 0) {
      console.warn("⚠️ API returned empty array []");
      console.log("💡 Check backend query filters");
    } else if (data.error) {
      console.error("❌ API returned error:", data.error);
    } else {
      console.warn("⚠️ Unexpected response format:", data);
    }
  })
  .catch((error) => {
    console.error("❌ Network Error:", error);
    console.log(
      "💡 Make sure backend server is running on http://127.0.0.1:8000"
    );
  });

// Step 3: Test recent_deliveries API
console.log(
  "\n%c🚚 Testing Recent Deliveries API...",
  "color: #ff9900; font-size: 14px"
);
fetch("/api/admin-management/dashboard/recent_deliveries/?limit=5", {
  method: "GET",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
})
  .then((response) => {
    console.log("Status:", response.status, response.statusText);
    if (response.status === 200) {
      console.log("✅ Recent Deliveries API responded with 200 OK");
    } else {
      console.error("❌ Error status:", response.status);
    }
    return response.json();
  })
  .then((data) => {
    console.log(
      "Response data type:",
      Array.isArray(data) ? "Array" : typeof data
    );
    console.log(
      "Number of deliveries:",
      Array.isArray(data) ? data.length : "N/A"
    );

    if (Array.isArray(data) && data.length > 0) {
      console.log("✅ API returned deliveries!");
      console.log("Sample delivery:", data[0]);
      console.table(
        data.map((d) => ({
          id: d.id,
          customer: d.customer_name,
          agent: d.delivery_agent,
          status: d.status,
          tracking: d.tracking_code,
        }))
      );
    } else if (Array.isArray(data) && data.length === 0) {
      console.warn("⚠️ API returned empty array []");
      console.log("💡 Check if you have delivered/in-transit orders");
    } else if (data.error) {
      console.error("❌ API returned error:", data.error);
    } else {
      console.warn("⚠️ Unexpected response format:", data);
    }
  })
  .catch((error) => {
    console.error("❌ Network Error:", error);
  });

// Step 4: Check current state in React
setTimeout(() => {
  console.log(
    "\n%c📊 Summary",
    "color: #00ff00; font-size: 16px; font-weight: bold"
  );
  console.log("━".repeat(60));
  console.log("✓ Check Network tab for detailed request/response");
  console.log("✓ Check Django console for backend logs");
  console.log("✓ If you see data above but tables are empty → Frontend issue");
  console.log("✓ If you see empty arrays → Backend query issue");
  console.log("✓ If you see errors → Check error message");
  console.log("━".repeat(60));
}, 2000);
