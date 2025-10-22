/**
 * Enhanced Loading States Component
 *
 * Provides beautiful, accessible loading states for different UI scenarios
 * with improved animations and skeleton loading patterns.
 */

// Loading Spinner Component
export const LoadingSpinner = ({
  size = "md",
  color = "blue",
  className = "",
}: {
  size?: "sm" | "md" | "lg";
  color?: "blue" | "gray" | "white";
  className?: string;
}) => {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };

  const colorClasses = {
    blue: "text-blue-600",
    gray: "text-gray-400",
    white: "text-white",
  };

  return `
    <div class="${sizeClasses[size]} ${colorClasses[color]} ${className}" role="status" aria-label="Loading">
      <svg class="animate-spin" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      <span class="sr-only">Loading...</span>
    </div>
  `;
};

// Progressive Loading Bar
export const ProgressBar = ({
  progress = 0,
  showPercentage = false,
  color = "blue",
  height = "md",
  animated = true,
}: {
  progress: number;
  showPercentage?: boolean;
  color?: "blue" | "green" | "yellow" | "red";
  height?: "sm" | "md" | "lg";
  animated?: boolean;
}) => {
  const heightClasses = {
    sm: "h-1",
    md: "h-2",
    lg: "h-3",
  };

  const colorClasses = {
    blue: "bg-blue-600",
    green: "bg-green-600",
    yellow: "bg-yellow-600",
    red: "bg-red-600",
  };

  return `
    <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full ${
      heightClasses[height]
    }">
      <div
        class="${colorClasses[color]} ${heightClasses[height]} rounded-full ${
    animated ? "transition-all duration-300 ease-out" : ""
  }"
        style="width: ${Math.min(Math.max(progress, 0), 100)}%"
        role="progressbar"
        aria-valuenow="${progress}"
        aria-valuemin="0"
        aria-valuemax="100"
        aria-label="${
          showPercentage
            ? `Loading ${Math.round(progress)}%`
            : "Loading progress"
        }"
      ></div>
      ${
        showPercentage
          ? `
        <div class="text-xs text-gray-600 dark:text-gray-400 mt-1 text-center">
          ${Math.round(progress)}%
        </div>
      `
          : ""
      }
    </div>
  `;
};

// Skeleton Loading Templates
export const skeletonTemplates = {
  // Dashboard overview skeleton
  dashboardOverview: `
    <div class="space-y-6 animate-pulse">
      <!-- Header -->
      <div class="space-y-3">
        <div class="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
        <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
      </div>

      <!-- Stats Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        ${Array.from(
          { length: 4 },
          () => `
          <div class="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
            <div class="flex items-center justify-between mb-4">
              <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
              <div class="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
            </div>
            <div class="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16 mb-2"></div>
            <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
          </div>
        `
        ).join("")}
      </div>

      <!-- Charts Section -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <div class="h-5 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-4"></div>
          <div class="h-64 bg-gray-100 dark:bg-gray-700 rounded"></div>
        </div>
        <div class="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <div class="h-5 bg-gray-200 dark:bg-gray-700 rounded w-28 mb-4"></div>
          <div class="space-y-3">
            ${Array.from(
              { length: 5 },
              () => `
              <div class="flex items-center space-x-3">
                <div class="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                <div class="flex-1 space-y-2">
                  <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                  <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                </div>
                <div class="h-6 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
              </div>
            `
            ).join("")}
          </div>
        </div>
      </div>
    </div>
  `,

  // Data table skeleton
  dataTable: `
    <div class="space-y-4 animate-pulse">
      <!-- Table Header -->
      <div class="flex items-center justify-between">
        <div class="h-6 bg-gray-200 dark:bg-gray-700 rounded w-48"></div>
        <div class="flex space-x-2">
          <div class="h-9 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
          <div class="h-9 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
        </div>
      </div>

      <!-- Table -->
      <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <!-- Table Header Row -->
        <div class="border-b border-gray-200 dark:border-gray-700 p-4">
          <div class="grid grid-cols-5 gap-4">
            ${Array.from(
              { length: 5 },
              () => `
              <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
            `
            ).join("")}
          </div>
        </div>

        <!-- Table Body -->
        ${Array.from(
          { length: 8 },
          () => `
          <div class="border-b border-gray-200 dark:border-gray-700 p-4 last:border-b-0">
            <div class="grid grid-cols-5 gap-4 items-center">
              <div class="flex items-center space-x-3">
                <div class="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
              </div>
              <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
              <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
              <div class="h-6 bg-gray-200 dark:bg-gray-700 rounded w-14"></div>
              <div class="flex space-x-2">
                <div class="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div class="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
            </div>
          </div>
        `
        ).join("")}
      </div>
    </div>
  `,

  // Form skeleton
  form: `
    <div class="space-y-6 animate-pulse">
      <div class="space-y-2">
        <div class="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
        <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-48"></div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        ${Array.from(
          { length: 6 },
          () => `
          <div class="space-y-2">
            <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
            <div class="h-10 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
          </div>
        `
        ).join("")}
      </div>

      <div class="space-y-2">
        <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
        <div class="h-24 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
      </div>

      <div class="flex justify-end space-x-3">
        <div class="h-10 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
        <div class="h-10 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
      </div>
    </div>
  `,

  // Profile skeleton
  profile: `
    <div class="space-y-6 animate-pulse">
      <!-- Profile Header -->
      <div class="flex items-center space-x-6">
        <div class="h-24 w-24 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
        <div class="space-y-3">
          <div class="h-6 bg-gray-200 dark:bg-gray-700 rounded w-48"></div>
          <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
          <div class="flex space-x-2">
            <div class="h-8 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
            <div class="h-8 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
          </div>
        </div>
      </div>

      <!-- Tabs -->
      <div class="border-b border-gray-200 dark:border-gray-700">
        <div class="flex space-x-8">
          ${Array.from(
            { length: 5 },
            () => `
            <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16 mb-4"></div>
          `
          ).join("")}
        </div>
      </div>

      <!-- Tab Content -->
      <div class="space-y-6">
        ${Array.from(
          { length: 4 },
          () => `
          <div class="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
            <div class="h-5 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-4"></div>
            <div class="space-y-4">
              ${Array.from(
                { length: 3 },
                () => `
                <div class="flex items-center justify-between">
                  <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                  <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
                </div>
              `
              ).join("")}
            </div>
          </div>
        `
        ).join("")}
      </div>
    </div>
  `,

  // Analytics skeleton
  analytics: `
    <div class="space-y-6 animate-pulse">
      <!-- Date Range Picker -->
      <div class="flex items-center justify-between">
        <div class="h-6 bg-gray-200 dark:bg-gray-700 rounded w-40"></div>
        <div class="h-10 bg-gray-200 dark:bg-gray-700 rounded w-48"></div>
      </div>

      <!-- KPI Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        ${Array.from(
          { length: 4 },
          () => `
          <div class="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
            <div class="flex items-center justify-between mb-2">
              <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
              <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-12"></div>
            </div>
            <div class="h-8 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-2"></div>
            <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
          </div>
        `
        ).join("")}
      </div>

      <!-- Charts Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        ${Array.from(
          { length: 4 },
          () => `
          <div class="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
            <div class="h-5 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-4"></div>
            <div class="h-64 bg-gray-100 dark:bg-gray-700 rounded"></div>
          </div>
        `
        ).join("")}
      </div>
    </div>
  `,
};

// Enhanced Error States
export const errorStates = {
  // Generic error
  generic: `
    <div class="flex flex-col items-center justify-center p-12 text-center">
      <div class="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mb-4">
        <svg class="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.082 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
        </svg>
      </div>
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">Something went wrong</h3>
      <p class="text-gray-600 dark:text-gray-400 mb-4">We encountered an unexpected error. Please try again.</p>
      <button class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
        Try Again
      </button>
    </div>
  `,

  // Network error
  network: `
    <div class="flex flex-col items-center justify-center p-12 text-center">
      <div class="w-16 h-16 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center mb-4">
        <svg class="w-8 h-8 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0"></path>
        </svg>
      </div>
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">Connection Problem</h3>
      <p class="text-gray-600 dark:text-gray-400 mb-4">Unable to connect to the server. Please check your internet connection.</p>
      <button class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
        Retry Connection
      </button>
    </div>
  `,

  // No data
  noData: `
    <div class="flex flex-col items-center justify-center p-12 text-center">
      <div class="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
        <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
        </svg>
      </div>
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Data Available</h3>
      <p class="text-gray-600 dark:text-gray-400 mb-4">There's no data to display at the moment.</p>
      <button class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
        Refresh Data
      </button>
    </div>
  `,
};

// Empty States
export const emptyStates = {
  // Users management
  users: `
    <div class="flex flex-col items-center justify-center p-12 text-center">
      <div class="w-20 h-20 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-6">
        <svg class="w-10 h-10 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"></path>
        </svg>
      </div>
      <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">No Users Found</h3>
      <p class="text-gray-600 dark:text-gray-400 mb-6 max-w-md">Start building your team by inviting users to join your platform.</p>
      <button class="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium">
        Invite First User
      </button>
    </div>
  `,

  // Orders
  orders: `
    <div class="flex flex-col items-center justify-center p-12 text-center">
      <div class="w-20 h-20 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mb-6">
        <svg class="w-10 h-10 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path>
        </svg>
      </div>
      <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">No Orders Yet</h3>
      <p class="text-gray-600 dark:text-gray-400 mb-6 max-w-md">Once customers start placing orders, they'll appear here for you to manage.</p>
      <button class="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium">
        View Menu
      </button>
    </div>
  `,
};

export default {
  LoadingSpinner,
  ProgressBar,
  skeletonTemplates,
  errorStates,
  emptyStates,
};
