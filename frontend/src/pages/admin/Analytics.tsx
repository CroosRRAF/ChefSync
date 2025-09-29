import React from "react";
// Import shared components
import { BarChart, LineChart } from "@/components/admin/shared";
import { DollarSign, ShoppingCart, TrendingUp, Users } from "lucide-react";

/**
 * Analytics Page
 *
 * Features:
 * - Business analytics dashboard
 * - Sales performance charts
 * - User behavior analytics
 * - Menu performance insights
 * - Trend analysis
 * - Revenue breakdown
 * - Predictive analytics (AI-powered)
 */
const Analytics: React.FC = () => {
  // Example data - in real implementation this would come from API
  const salesData = [
    { name: "Jan", value: 4000 },
    { name: "Feb", value: 3000 },
    { name: "Mar", value: 5000 },
    { name: "Apr", value: 4500 },
    { name: "May", value: 6000 },
    { name: "Jun", value: 5500 },
  ];

  const topMenuItems = [
    { id: 1, name: "Margherita Pizza", orders: 245, revenue: 2450 },
    { id: 2, name: "Chicken Burger", orders: 198, revenue: 1980 },
    { id: 3, name: "Caesar Salad", orders: 156, revenue: 1560 },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Analytics & Insights
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Comprehensive business analytics and performance metrics
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* These will use StatsWidget once dependencies are installed */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Revenue
              </p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                $24,500
              </p>
              <div className="flex items-center mt-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <span className="text-sm text-green-500 ml-1">+12.5%</span>
                <span className="text-sm text-gray-500 ml-2">
                  vs last month
                </span>
              </div>
            </div>
            <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600">
              <DollarSign size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Orders
              </p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                1,245
              </p>
              <div className="flex items-center mt-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <span className="text-sm text-green-500 ml-1">+8.2%</span>
                <span className="text-sm text-gray-500 ml-2">
                  vs last month
                </span>
              </div>
            </div>
            <div className="p-3 rounded-full bg-green-100 dark:bg-green-900 text-green-600">
              <ShoppingCart size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Active Users
              </p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                856
              </p>
              <div className="flex items-center mt-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <span className="text-sm text-green-500 ml-1">+15.3%</span>
                <span className="text-sm text-gray-500 ml-2">
                  vs last month
                </span>
              </div>
            </div>
            <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900 text-purple-600">
              <Users size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Avg. Order Value
              </p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                $19.68
              </p>
              <div className="flex items-center mt-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <span className="text-sm text-green-500 ml-1">+5.4%</span>
                <span className="text-sm text-gray-500 ml-2">
                  vs last month
                </span>
              </div>
            </div>
            <div className="p-3 rounded-full bg-yellow-100 dark:bg-yellow-900 text-yellow-600">
              <DollarSign size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Monthly Sales Trend
          </h3>
          <div className="h-64">
            <LineChart
              data={salesData}
              dataKeys={["value"]}
              xAxisDataKey="name"
              height={240}
              showTrend={true}
              colors={["#3B82F6"]}
            />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Orders by Category
          </h3>
          <div className="h-64">
            <BarChart
              data={salesData}
              dataKeys={["value"]}
              xAxisDataKey="name"
              height={240}
              colors={["#10B981"]}
            />
          </div>
        </div>
      </div>

      {/* Top Menu Items Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Top Performing Menu Items
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Best selling items this month
          </p>
        </div>
        <div className="p-6">
          {/* This will be replaced with DataTable component */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                <tr>
                  <th className="px-6 py-3">Item Name</th>
                  <th className="px-6 py-3">Orders</th>
                  <th className="px-6 py-3">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {topMenuItems.map((item) => (
                  <tr
                    key={item.id}
                    className="bg-white border-b dark:bg-gray-800 dark:border-gray-700"
                  >
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                      {item.name}
                    </td>
                    <td className="px-6 py-4">{item.orders}</td>
                    <td className="px-6 py-4">${item.revenue}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
