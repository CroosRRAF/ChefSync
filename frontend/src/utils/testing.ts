/**
 * Testing Utilities for Admin System
 *
 * Provides testing helpers, mock data generators,
 * and component testing utilities for comprehensive testing.
 */

// Mock data generators
export const mockDataGenerators = {
  // User data
  generateUser: (overrides: Partial<any> = {}) => ({
    id: `user_${Math.random().toString(36).substr(2, 9)}`,
    email: `user${Math.floor(Math.random() * 1000)}@example.com`,
    firstName: ["John", "Jane", "Michael", "Sarah", "David", "Emma"][
      Math.floor(Math.random() * 6)
    ],
    lastName: ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia"][
      Math.floor(Math.random() * 6)
    ],
    role: ["admin", "user", "moderator"][Math.floor(Math.random() * 3)],
    status: ["active", "inactive", "pending"][Math.floor(Math.random() * 3)],
    avatar: `https://ui-avatars.com/api/?name=${Math.random()
      .toString(36)
      .substr(2, 2)}&background=random`,
    createdAt: new Date(Date.now() - Math.random() * 10000000000).toISOString(),
    lastLogin: new Date(Date.now() - Math.random() * 1000000000).toISOString(),
    ...overrides,
  }),

  // Generate multiple users
  generateUsers: (count: number = 10) =>
    Array.from({ length: count }, () => mockDataGenerators.generateUser()),

  // Order data
  generateOrder: (overrides: Partial<any> = {}) => ({
    id: `order_${Math.random().toString(36).substr(2, 9)}`,
    customerId: `user_${Math.random().toString(36).substr(2, 9)}`,
    customerName: `${
      ["John", "Jane", "Michael", "Sarah"][Math.floor(Math.random() * 4)]
    } ${
      ["Smith", "Johnson", "Williams", "Brown"][Math.floor(Math.random() * 4)]
    }`,
    status: ["pending", "preparing", "ready", "delivered", "cancelled"][
      Math.floor(Math.random() * 5)
    ],
    total: Math.floor(Math.random() * 10000) / 100,
    items: Array.from({ length: Math.floor(Math.random() * 5) + 1 }, () => ({
      id: `item_${Math.random().toString(36).substr(2, 9)}`,
      name: [
        "Pizza Margherita",
        "Burger Deluxe",
        "Caesar Salad",
        "Pasta Carbonara",
        "Fish & Chips",
      ][Math.floor(Math.random() * 5)],
      quantity: Math.floor(Math.random() * 3) + 1,
      price: Math.floor(Math.random() * 2000) / 100,
    })),
    createdAt: new Date(Date.now() - Math.random() * 10000000000).toISOString(),
    deliveryAddress: {
      street: `${Math.floor(Math.random() * 9999)} Main Street`,
      city: ["New York", "Los Angeles", "Chicago", "Houston", "Phoenix"][
        Math.floor(Math.random() * 5)
      ],
      zipCode: `${Math.floor(Math.random() * 90000) + 10000}`,
    },
    ...overrides,
  }),

  // Generate multiple orders
  generateOrders: (count: number = 20) =>
    Array.from({ length: count }, () => mockDataGenerators.generateOrder()),

  // Analytics data
  generateAnalyticsData: () => ({
    revenue: {
      total: Math.floor(Math.random() * 100000),
      thisMonth: Math.floor(Math.random() * 10000),
      lastMonth: Math.floor(Math.random() * 10000),
      growth: (Math.random() - 0.5) * 100,
    },
    orders: {
      total: Math.floor(Math.random() * 1000),
      thisWeek: Math.floor(Math.random() * 100),
      lastWeek: Math.floor(Math.random() * 100),
      growth: (Math.random() - 0.5) * 100,
    },
    customers: {
      total: Math.floor(Math.random() * 5000),
      new: Math.floor(Math.random() * 100),
      returning: Math.floor(Math.random() * 200),
      growth: (Math.random() - 0.5) * 100,
    },
    chartData: Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      revenue: Math.floor(Math.random() * 2000),
      orders: Math.floor(Math.random() * 50),
      customers: Math.floor(Math.random() * 30),
    })),
  }),

  // Feedback data
  generateFeedback: (overrides: Partial<any> = {}) => ({
    id: `feedback_${Math.random().toString(36).substr(2, 9)}`,
    customerId: `user_${Math.random().toString(36).substr(2, 9)}`,
    customerName: `${
      ["John", "Jane", "Michael", "Sarah"][Math.floor(Math.random() * 4)]
    } ${
      ["Smith", "Johnson", "Williams", "Brown"][Math.floor(Math.random() * 4)]
    }`,
    type: ["complaint", "suggestion", "compliment", "issue"][
      Math.floor(Math.random() * 4)
    ],
    category: ["food-quality", "delivery", "service", "app-issue", "payment"][
      Math.floor(Math.random() * 5)
    ],
    priority: ["low", "medium", "high", "urgent"][
      Math.floor(Math.random() * 4)
    ],
    status: ["new", "in-progress", "resolved", "closed"][
      Math.floor(Math.random() * 4)
    ],
    subject: [
      "Order was cold when delivered",
      "Missing items from order",
      "Great service, thank you!",
      "App keeps crashing",
      "Payment failed but was charged",
    ][Math.floor(Math.random() * 5)],
    message:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    rating: Math.floor(Math.random() * 5) + 1,
    createdAt: new Date(Date.now() - Math.random() * 10000000000).toISOString(),
    updatedAt: new Date(Date.now() - Math.random() * 1000000000).toISOString(),
    ...overrides,
  }),

  // Generate multiple feedback entries
  generateFeedbackList: (count: number = 15) =>
    Array.from({ length: count }, () => mockDataGenerators.generateFeedback()),

  // Menu item data
  generateMenuItem: (overrides: Partial<any> = {}) => ({
    id: `item_${Math.random().toString(36).substr(2, 9)}`,
    name: [
      "Margherita Pizza",
      "Cheeseburger",
      "Caesar Salad",
      "Spaghetti Carbonara",
      "Fish & Chips",
      "Chicken Wings",
      "Veggie Wrap",
      "BBQ Ribs",
    ][Math.floor(Math.random() * 8)],
    description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
    price: Math.floor(Math.random() * 3000) / 100,
    category: [
      "pizza",
      "burgers",
      "salads",
      "pasta",
      "seafood",
      "chicken",
      "vegetarian",
    ][Math.floor(Math.random() * 7)],
    image: `https://images.unsplash.com/photo-${
      1500000000000 + Math.floor(Math.random() * 100000000)
    }?w=300&h=200&fit=crop`,
    available: Math.random() > 0.2,
    featured: Math.random() > 0.7,
    ingredients: [
      "Tomato",
      "Cheese",
      "Basil",
      "Olive Oil",
      "Salt",
      "Pepper",
    ].slice(0, Math.floor(Math.random() * 4) + 2),
    allergens: ["gluten", "dairy", "nuts"].filter(() => Math.random() > 0.7),
    preparationTime: Math.floor(Math.random() * 30) + 10,
    calories: Math.floor(Math.random() * 800) + 200,
    createdAt: new Date(Date.now() - Math.random() * 10000000000).toISOString(),
    ...overrides,
  }),

  // Generate multiple menu items
  generateMenuItems: (count: number = 25) =>
    Array.from({ length: count }, () => mockDataGenerators.generateMenuItem()),
};

// API response simulators
export const apiSimulators = {
  // Simulate API delay
  delay: (ms: number = 1000) =>
    new Promise((resolve) => setTimeout(resolve, ms)),

  // Simulate successful response
  success: async <T>(data: T, delay: number = 500): Promise<T> => {
    await apiSimulators.delay(delay);
    return data;
  },

  // Simulate error response
  error: async (
    message: string = "Something went wrong",
    delay: number = 500
  ): Promise<never> => {
    await apiSimulators.delay(delay);
    throw new Error(message);
  },

  // Simulate network error
  networkError: async (delay: number = 2000): Promise<never> => {
    await apiSimulators.delay(delay);
    throw new Error("Network request failed");
  },

  // Simulate paginated response
  paginated: async <T>(
    items: T[],
    page: number = 1,
    limit: number = 10,
    delay: number = 500
  ) => {
    await apiSimulators.delay(delay);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedItems = items.slice(startIndex, endIndex);

    return {
      data: paginatedItems,
      pagination: {
        page,
        limit,
        total: items.length,
        totalPages: Math.ceil(items.length / limit),
        hasNext: endIndex < items.length,
        hasPrev: page > 1,
      },
    };
  },
};

// Component testing utilities
export const testingUtils = {
  // Generate test IDs
  generateTestId: (component: string, element?: string) =>
    element ? `${component}-${element}` : component,

  // Create mock event handlers
  createMockHandlers: () => ({
    onClick: jest?.fn?.() || (() => {}),
    onChange: jest?.fn?.() || (() => {}),
    onSubmit: jest?.fn?.() || (() => {}),
    onFocus: jest?.fn?.() || (() => {}),
    onBlur: jest?.fn?.() || (() => {}),
  }),

  // Form validation helpers
  validateForm: (data: Record<string, any>, rules: Record<string, any>) => {
    const errors: Record<string, string> = {};

    Object.entries(rules).forEach(([field, rule]) => {
      const value = data[field];

      if (rule.required && (!value || value.toString().trim() === "")) {
        errors[field] = `${field} is required`;
      }

      if (rule.minLength && value && value.length < rule.minLength) {
        errors[
          field
        ] = `${field} must be at least ${rule.minLength} characters`;
      }

      if (rule.email && value && !/\S+@\S+\.\S+/.test(value)) {
        errors[field] = `${field} must be a valid email`;
      }

      if (rule.pattern && value && !rule.pattern.test(value)) {
        errors[field] = rule.message || `${field} format is invalid`;
      }
    });

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  },

  // Local storage mock
  localStorageMock: {
    store: {} as Record<string, string>,
    getItem: function (key: string) {
      return this.store[key] || null;
    },
    setItem: function (key: string, value: string) {
      this.store[key] = value;
    },
    removeItem: function (key: string) {
      delete this.store[key];
    },
    clear: function () {
      this.store = {};
    },
  },

  // Session storage mock
  sessionStorageMock: {
    store: {} as Record<string, string>,
    getItem: function (key: string) {
      return this.store[key] || null;
    },
    setItem: function (key: string, value: string) {
      this.store[key] = value;
    },
    removeItem: function (key: string) {
      delete this.store[key];
    },
    clear: function () {
      this.store = {};
    },
  },
};

// Performance testing utilities
export const performanceUtils = {
  // Measure function execution time
  measureTime: async <T>(
    fn: () => Promise<T> | T,
    label?: string
  ): Promise<{ result: T; time: number }> => {
    const start = performance.now();
    const result = await fn();
    const end = performance.now();
    const time = end - start;

    if (label) {
      console.log(`${label}: ${time.toFixed(2)}ms`);
    }

    return { result, time };
  },

  // Memory usage tracking
  getMemoryUsage: () => {
    if ("memory" in performance) {
      const memory = (performance as any).memory;
      return {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        limit: memory.jsHeapSizeLimit,
        usedMB: (memory.usedJSHeapSize / 1048576).toFixed(2),
        totalMB: (memory.totalJSHeapSize / 1048576).toFixed(2),
      };
    }
    return null;
  },

  // Bundle size analyzer
  analyzeBundleSize: () => {
    const scripts = Array.from(document.querySelectorAll("script[src]"));
    const styles = Array.from(
      document.querySelectorAll('link[rel="stylesheet"]')
    );

    return {
      scriptCount: scripts.length,
      styleCount: styles.length,
      scripts: scripts.map((script: any) => script.src),
      styles: styles.map((style: any) => style.href),
    };
  },
};

// Accessibility testing utilities
export const a11yUtils = {
  // Check if element has proper ARIA labels
  hasAriaLabel: (element: Element): boolean => {
    return !!(
      element.getAttribute("aria-label") ||
      element.getAttribute("aria-labelledby") ||
      element.getAttribute("title")
    );
  },

  // Check color contrast
  checkColorContrast: (foreground: string, background: string): number => {
    // Simplified contrast calculation
    const getLuminance = (color: string) => {
      const rgb = parseInt(color.replace("#", ""), 16);
      const r = (rgb >> 16) & 0xff;
      const g = (rgb >> 8) & 0xff;
      const b = (rgb >> 0) & 0xff;

      const [rs, gs, bs] = [r, g, b].map((c) => {
        c = c / 255;
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
      });

      return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
    };

    const lum1 = getLuminance(foreground);
    const lum2 = getLuminance(background);
    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);

    return (brightest + 0.05) / (darkest + 0.05);
  },

  // Get focusable elements
  getFocusableElements: (container: Element = document.body): Element[] => {
    const focusableSelectors = [
      "a[href]",
      "button:not([disabled])",
      "input:not([disabled])",
      "select:not([disabled])",
      "textarea:not([disabled])",
      '[tabindex]:not([tabindex="-1"])',
    ].join(", ");

    return Array.from(container.querySelectorAll(focusableSelectors));
  },
};

// Test scenarios
export const testScenarios = {
  // User management scenarios
  userManagement: {
    createUser: () => mockDataGenerators.generateUser(),
    updateUser: (user: any, updates: Partial<any>) => ({ ...user, ...updates }),
    deleteUser: (users: any[], userId: string) =>
      users.filter((u) => u.id !== userId),
    searchUsers: (users: any[], query: string) =>
      users.filter(
        (u) =>
          u.firstName.toLowerCase().includes(query.toLowerCase()) ||
          u.lastName.toLowerCase().includes(query.toLowerCase()) ||
          u.email.toLowerCase().includes(query.toLowerCase())
      ),
  },

  // Order management scenarios
  orderManagement: {
    createOrder: () => mockDataGenerators.generateOrder(),
    updateOrderStatus: (order: any, status: string) => ({ ...order, status }),
    filterOrdersByStatus: (orders: any[], status: string) =>
      orders.filter((o) => o.status === status),
    getOrdersByDateRange: (orders: any[], startDate: string, endDate: string) =>
      orders.filter((o) => o.createdAt >= startDate && o.createdAt <= endDate),
  },

  // Form validation scenarios
  formValidation: {
    validateEmail: (email: string) => /\S+@\S+\.\S+/.test(email),
    validatePassword: (password: string) => password.length >= 8,
    validateRequired: (value: any) =>
      value !== undefined && value !== null && value !== "",
    validatePhoneNumber: (phone: string) => /^\+?[\d\s-()]+$/.test(phone),
  },
};

export default {
  mockDataGenerators,
  apiSimulators,
  testingUtils,
  performanceUtils,
  a11yUtils,
  testScenarios,
};
