import { adminService } from "@/services/adminService";
import {
  mockOrdersTrendData,
  mockTopPerformingChefsData,
  mockTopPerformingFoodItemsData,
  runAllDashboardAPITests,
  testOrdersTrendAPI,
  testTopPerformingChefsAPI,
  testTopPerformingFoodItemsAPI,
} from "@/services/dashboardAPITests";

// Mock axios
jest.mock("axios", () => ({
  default: {
    create: jest.fn(() => ({
      interceptors: {
        request: { use: jest.fn() },
        response: { use: jest.fn() },
      },
      get: jest.fn(),
      post: jest.fn(),
      patch: jest.fn(),
      delete: jest.fn(),
    })),
  },
}));

describe("Admin Dashboard API Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Orders Trend API", () => {
    it("should successfully fetch orders trend data", async () => {
      // Mock successful API response
      const mockResponse = { data: mockOrdersTrendData };
      jest
        .mocked(adminService.getOrdersTrend)
        .mockResolvedValue(mockOrdersTrendData);

      const result = await testOrdersTrendAPI();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockOrdersTrendData);
      expect(result.data.chart_type).toBe("line");
      expect(result.data.data.labels).toHaveLength(30);
      expect(result.data.total_orders).toBe(650);
    });

    it("should handle API failure and return mock data", async () => {
      // Mock API failure
      const mockError = new Error("Network Error");
      jest.mocked(adminService.getOrdersTrend).mockRejectedValue(mockError);

      const result = await testOrdersTrendAPI();

      expect(result.success).toBe(false);
      expect(result.error).toEqual(mockError);
      expect(result.data).toEqual(mockOrdersTrendData);
    });
  });

  describe("Top Performing Chefs API", () => {
    it("should successfully fetch top performing chefs data", async () => {
      jest
        .mocked(adminService.getTopPerformingChefs)
        .mockResolvedValue(mockTopPerformingChefsData);

      const result = await testTopPerformingChefsAPI();

      expect(result.success).toBe(true);
      expect(result.data.chefs).toHaveLength(10);
      expect(result.data.chefs[0].name).toBe("Chef Maria Rodriguez");
      expect(result.data.chefs[0].total_orders).toBe(145);
      expect(result.data.chefs[0].rating).toBe(4.8);
    });

    it("should handle API failure and return mock data", async () => {
      const mockError = new Error("API Error");
      jest
        .mocked(adminService.getTopPerformingChefs)
        .mockRejectedValue(mockError);

      const result = await testTopPerformingChefsAPI();

      expect(result.success).toBe(false);
      expect(result.error).toEqual(mockError);
      expect(result.data.chefs).toHaveLength(10);
    });
  });

  describe("Top Performing Food Items API", () => {
    it("should successfully fetch top performing food items data", async () => {
      jest
        .mocked(adminService.getTopPerformingFoodItems)
        .mockResolvedValue(mockTopPerformingFoodItemsData);

      const result = await testTopPerformingFoodItemsAPI();

      expect(result.success).toBe(true);
      expect(result.data.food_items).toHaveLength(10);
      expect(result.data.food_items[0].name).toBe("Margherita Pizza");
      expect(result.data.food_items[0].category).toBe("Italian");
      expect(result.data.food_items[0].total_orders).toBe(89);
    });

    it("should handle API failure and return mock data", async () => {
      const mockError = new Error("Connection Failed");
      jest
        .mocked(adminService.getTopPerformingFoodItems)
        .mockRejectedValue(mockError);

      const result = await testTopPerformingFoodItemsAPI();

      expect(result.success).toBe(false);
      expect(result.error).toEqual(mockError);
      expect(result.data.food_items).toHaveLength(10);
    });
  });

  describe("Run All Dashboard API Tests", () => {
    it("should run all API tests and return results", async () => {
      // Mock all APIs to succeed
      jest
        .mocked(adminService.getOrdersTrend)
        .mockResolvedValue(mockOrdersTrendData);
      jest
        .mocked(adminService.getTopPerformingChefs)
        .mockResolvedValue(mockTopPerformingChefsData);
      jest
        .mocked(adminService.getTopPerformingFoodItems)
        .mockResolvedValue(mockTopPerformingFoodItemsData);

      const results = await runAllDashboardAPITests();

      expect(results).toHaveLength(3);
      results.forEach((result) => {
        expect(result.success).toBe(true);
      });
    });

    it("should handle mixed success/failure scenarios", async () => {
      // Mock mixed results: orders success, chefs fail, food items success
      jest
        .mocked(adminService.getOrdersTrend)
        .mockResolvedValue(mockOrdersTrendData);
      jest
        .mocked(adminService.getTopPerformingChefs)
        .mockRejectedValue(new Error("API Error"));
      jest
        .mocked(adminService.getTopPerformingFoodItems)
        .mockResolvedValue(mockTopPerformingFoodItemsData);

      const results = await runAllDashboardAPITests();

      expect(results).toHaveLength(3);
      expect(results[0].success).toBe(true); // Orders
      expect(results[1].success).toBe(false); // Chefs (should use mock)
      expect(results[2].success).toBe(true); // Food items
    });
  });

  describe("Mock Data Structure Validation", () => {
    it("should have valid orders trend mock data structure", () => {
      expect(mockOrdersTrendData).toHaveProperty("chart_type");
      expect(mockOrdersTrendData).toHaveProperty("title");
      expect(mockOrdersTrendData).toHaveProperty("data");
      expect(mockOrdersTrendData).toHaveProperty("total_orders");
      expect(mockOrdersTrendData.data.labels).toHaveLength(30);
      expect(mockOrdersTrendData.data.datasets).toHaveLength(1);
    });

    it("should have valid top performing chefs mock data structure", () => {
      expect(mockTopPerformingChefsData).toHaveProperty("chefs");
      expect(mockTopPerformingChefsData.chefs).toHaveLength(10);
      mockTopPerformingChefsData.chefs.forEach((chef) => {
        expect(chef).toHaveProperty("id");
        expect(chef).toHaveProperty("name");
        expect(chef).toHaveProperty("email");
        expect(chef).toHaveProperty("total_orders");
        expect(chef).toHaveProperty("total_revenue");
        expect(chef).toHaveProperty("rating");
        expect(chef).toHaveProperty("status");
      });
    });

    it("should have valid top performing food items mock data structure", () => {
      expect(mockTopPerformingFoodItemsData).toHaveProperty("food_items");
      expect(mockTopPerformingFoodItemsData.food_items).toHaveLength(10);
      mockTopPerformingFoodItemsData.food_items.forEach((item) => {
        expect(item).toHaveProperty("id");
        expect(item).toHaveProperty("name");
        expect(item).toHaveProperty("category");
        expect(item).toHaveProperty("total_orders");
        expect(item).toHaveProperty("total_revenue");
        expect(item).toHaveProperty("rating");
        expect(item).toHaveProperty("status");
      });
    });
  });
});
