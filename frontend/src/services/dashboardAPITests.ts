import { adminService } from "@/services/adminService";

// Mock data for testing when backend is not available
const mockOrdersTrendData = {
  chart_type: "line",
  title: "Orders Trend",
  data: {
    labels: [
      "Day 1",
      "Day 2",
      "Day 3",
      "Day 4",
      "Day 5",
      "Day 6",
      "Day 7",
      "Day 8",
      "Day 9",
      "Day 10",
      "Day 11",
      "Day 12",
      "Day 13",
      "Day 14",
      "Day 15",
      "Day 16",
      "Day 17",
      "Day 18",
      "Day 19",
      "Day 20",
      "Day 21",
      "Day 22",
      "Day 23",
      "Day 24",
      "Day 25",
      "Day 26",
      "Day 27",
      "Day 28",
      "Day 29",
      "Day 30",
    ],
    datasets: [
      {
        label: "Orders",
        data: [
          12, 15, 8, 22, 18, 25, 20, 16, 14, 19, 23, 17, 21, 26, 13, 24, 11, 27,
          15, 20, 18, 22, 16, 19, 14, 21, 23, 17, 25, 28,
        ],
        backgroundColor: "rgba(54, 162, 235, 0.2)",
        borderColor: "rgba(54, 162, 235, 1)",
        borderWidth: 2,
      },
    ],
  },
  total_orders: 650,
};

const mockTopPerformingChefsData = {
  chefs: [
    {
      id: 1,
      name: "Chef Maria Rodriguez",
      email: "maria.rodriguez@chefsync.com",
      total_orders: 145,
      total_revenue: 8750.5,
      rating: 4.8,
      status: "active",
    },
    {
      id: 2,
      name: "Chef James Chen",
      email: "james.chen@chefsync.com",
      total_orders: 132,
      total_revenue: 7920.75,
      rating: 4.7,
      status: "active",
    },
    {
      id: 3,
      name: "Chef Sarah Johnson",
      email: "sarah.johnson@chefsync.com",
      total_orders: 128,
      total_revenue: 7680.0,
      rating: 4.9,
      status: "active",
    },
    {
      id: 4,
      name: "Chef Ahmed Hassan",
      email: "ahmed.hassan@chefsync.com",
      total_orders: 115,
      total_revenue: 6900.25,
      rating: 4.6,
      status: "active",
    },
    {
      id: 5,
      name: "Chef Isabella Rossi",
      email: "isabella.rossi@chefsync.com",
      total_orders: 108,
      total_revenue: 6480.0,
      rating: 4.8,
      status: "active",
    },
    {
      id: 6,
      name: "Chef David Kim",
      email: "david.kim@chefsync.com",
      total_orders: 95,
      total_revenue: 5700.5,
      rating: 4.5,
      status: "active",
    },
    {
      id: 7,
      name: "Chef Emma Thompson",
      email: "emma.thompson@chefsync.com",
      total_orders: 87,
      total_revenue: 5220.75,
      rating: 4.7,
      status: "active",
    },
    {
      id: 8,
      name: "Chef Carlos Mendoza",
      email: "carlos.mendoza@chefsync.com",
      total_orders: 82,
      total_revenue: 4920.0,
      rating: 4.6,
      status: "active",
    },
    {
      id: 9,
      name: "Chef Lisa Wang",
      email: "lisa.wang@chefsync.com",
      total_orders: 76,
      total_revenue: 4560.25,
      rating: 4.8,
      status: "active",
    },
    {
      id: 10,
      name: "Chef Michael Brown",
      email: "michael.brown@chefsync.com",
      total_orders: 71,
      total_revenue: 4260.5,
      rating: 4.4,
      status: "active",
    },
  ],
};

const mockTopPerformingFoodItemsData = {
  food_items: [
    {
      id: 1,
      name: "Margherita Pizza",
      category: "Italian",
      total_orders: 89,
      total_revenue: 2670.0,
      rating: 4.7,
      status: "active",
    },
    {
      id: 2,
      name: "Chicken Biryani",
      category: "Indian",
      total_orders: 76,
      total_revenue: 2280.0,
      rating: 4.8,
      status: "active",
    },
    {
      id: 3,
      name: "Beef Burger",
      category: "American",
      total_orders: 68,
      total_revenue: 2040.0,
      rating: 4.6,
      status: "active",
    },
    {
      id: 4,
      name: "California Roll",
      category: "Japanese",
      total_orders: 62,
      total_revenue: 1860.0,
      rating: 4.5,
      status: "active",
    },
    {
      id: 5,
      name: "Pad Thai",
      category: "Thai",
      total_orders: 58,
      total_revenue: 1740.0,
      rating: 4.7,
      status: "active",
    },
    {
      id: 6,
      name: "Grilled Salmon",
      category: "Seafood",
      total_orders: 54,
      total_revenue: 2160.0,
      rating: 4.9,
      status: "active",
    },
    {
      id: 7,
      name: "Chicken Caesar Salad",
      category: "Healthy",
      total_orders: 51,
      total_revenue: 1530.0,
      rating: 4.4,
      status: "active",
    },
    {
      id: 8,
      name: "Lamb Kebab",
      category: "Middle Eastern",
      total_orders: 47,
      total_revenue: 1410.0,
      rating: 4.6,
      status: "active",
    },
    {
      id: 9,
      name: "Vegetable Stir Fry",
      category: "Chinese",
      total_orders: 43,
      total_revenue: 1290.0,
      rating: 4.5,
      status: "active",
    },
    {
      id: 10,
      name: "Chocolate Lava Cake",
      category: "Dessert",
      total_orders: 39,
      total_revenue: 1170.0,
      rating: 4.8,
      status: "active",
    },
  ],
};

// Test functions that simulate API calls
export const testOrdersTrendAPI = async () => {
  try {
    console.log("🧪 Testing Orders Trend API...");
    const data = await adminService.getOrdersTrend(30);
    console.log("✅ Orders Trend API Success:", data);
    return { success: true, data };
  } catch (error) {
    console.log("❌ Orders Trend API Failed, using mock data:", error);
    return { success: false, data: mockOrdersTrendData, error };
  }
};

export const testTopPerformingChefsAPI = async () => {
  try {
    console.log("🧪 Testing Top Performing Chefs API...");
    const data = await adminService.getTopPerformingChefs(10);
    console.log("✅ Top Performing Chefs API Success:", data);
    return { success: true, data };
  } catch (error) {
    console.log("❌ Top Performing Chefs API Failed, using mock data:", error);
    return { success: false, data: mockTopPerformingChefsData, error };
  }
};

export const testTopPerformingFoodItemsAPI = async () => {
  try {
    console.log("🧪 Testing Top Performing Food Items API...");
    const data = await adminService.getTopPerformingFoodItems(10);
    console.log("✅ Top Performing Food Items API Success:", data);
    return { success: true, data };
  } catch (error) {
    console.log(
      "❌ Top Performing Food Items API Failed, using mock data:",
      error
    );
    return { success: false, data: mockTopPerformingFoodItemsData, error };
  }
};

export const runAllDashboardAPITests = async () => {
  console.log("🚀 Running Admin Dashboard API Tests...\n");

  const results = await Promise.all([
    testOrdersTrendAPI(),
    testTopPerformingChefsAPI(),
    testTopPerformingFoodItemsAPI(),
  ]);

  console.log("\n📊 Test Results Summary:");
  results.forEach((result, index) => {
    const testNames = [
      "Orders Trend",
      "Top Performing Chefs",
      "Top Performing Food Items",
    ];
    console.log(
      `${index + 1}. ${testNames[index]}: ${
        result.success ? "✅ PASS" : "❌ FAIL (using mock data)"
      }`
    );
  });

  return results;
};

// Export mock data for fallback usage
export {
  mockOrdersTrendData,
  mockTopPerformingChefsData,
  mockTopPerformingFoodItemsData,
};
