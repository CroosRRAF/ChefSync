#!/usr/bin/env node

/**
 * Simple API Test Runner for Admin Dashboard Endpoints
 * This script tests the API endpoints defined in the Postman collection
 * and provides mock data fallback for development/testing purposes.
 */

import { runAllDashboardAPITests } from "./dashboardAPITests.js";

async function main() {
  console.log("🚀 Admin Dashboard API Test Runner");
  console.log("=====================================\n");

  try {
    const results = await runAllDashboardAPITests();

    console.log("\n📋 Test Summary:");
    console.log("================");

    const passed = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);

    if (failed > 0) {
      console.log(
        "\n⚠️  Some tests failed. This is expected if the backend API is not running."
      );
      console.log("   The application will use mock data as fallback.");
    } else {
      console.log("\n🎉 All API endpoints are responding correctly!");
    }

    console.log("\n📊 Detailed Results:");
    console.log("===================");

    results.forEach((result, index) => {
      const testNames = [
        "Orders Trend API",
        "Top Performing Chefs API",
        "Top Performing Food Items API",
      ];
      const status = result.success ? "✅ PASS" : "❌ FAIL (using mock data)";
      console.log(`${index + 1}. ${testNames[index]}: ${status}`);

      if (!result.success && result.error) {
        console.log(`   Error: ${result.error.message}`);
      }
    });

    process.exit(failed > 0 ? 1 : 0);
  } catch (error) {
    console.error("❌ Test runner failed:", error);
    process.exit(1);
  }
}

main();
