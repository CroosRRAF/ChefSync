# Admin System Testing Guide

## 🧪 **Testing Framework Documentation**

**Testing Stack**: Jest + React Testing Library + MSW + Playwright
**Coverage Target**: 90%+ for admin components
**Test Environment**: Node.js 18+ with TypeScript

---

## 📋 **Table of Contents**

1. [Testing Setup](#testing-setup)
2. [Unit Testing](#unit-testing)
3. [Integration Testing](#integration-testing)
4. [E2E Testing](#e2e-testing)
5. [Mock Data & Services](#mock-data--services)
6. [Testing Utilities](#testing-utilities)
7. [Performance Testing](#performance-testing)
8. [Accessibility Testing](#accessibility-testing)
9. [Test Coverage](#test-coverage)
10. [CI/CD Integration](#cicd-integration)

---

## ⚙️ **Testing Setup**

### **Dependencies**

```json
{
  "devDependencies": {
    "@testing-library/react": "^13.4.0",
    "@testing-library/jest-dom": "^5.16.5",
    "@testing-library/user-event": "^14.4.3",
    "jest": "^29.7.0",
    "jest-environment-jsdom": "^29.7.0",
    "msw": "^1.3.2",
    "playwright": "^1.40.0",
    "@playwright/test": "^1.40.0",
    "vitest": "^0.34.6",
    "@vitest/ui": "^0.34.6"
  }
}
```

### **Jest Configuration**

```javascript
// jest.config.js
module.exports = {
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/src/test/setup.ts"],
  moduleNameMapping: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "\\.(css|less|scss|sass)$": "identity-obj-proxy",
  },
  collectCoverageFrom: [
    "src/components/admin/**/*.{ts,tsx}",
    "src/pages/admin/**/*.{ts,tsx}",
    "src/services/**/*.{ts,tsx}",
    "!**/*.d.ts",
    "!**/node_modules/**",
  ],
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
  },
  testMatch: [
    "<rootDir>/src/**/__tests__/**/*.{ts,tsx}",
    "<rootDir>/src/**/*.{test,spec}.{ts,tsx}",
  ],
};
```

### **Test Setup File**

```typescript
// src/test/setup.ts
import "@testing-library/jest-dom";
import { server } from "./mocks/server";

// Mock server setup
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// Mock environment variables
process.env.REACT_APP_API_URL = "http://localhost:3001";
process.env.REACT_APP_ENV = "test";

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  observe() {
    return null;
  }
  disconnect() {
    return null;
  }
  unobserve() {
    return null;
  }
};

// Mock window.matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});
```

---

## 🔬 **Unit Testing**

### **Component Testing Pattern**

```typescript
// src/components/admin/__tests__/UserManagement.test.tsx
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { UserManagement } from "../UserManagement";
import { createMockUser } from "../../test/factories/userFactory";

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  );
};

describe("UserManagement Component", () => {
  const user = userEvent.setup();
  const mockUsers = [
    createMockUser({ role: "admin" }),
    createMockUser({ role: "user" }),
  ];

  beforeEach(() => {
    // Reset any mocks
    jest.clearAllMocks();
  });

  test("renders user list correctly", async () => {
    render(<UserManagement />, { wrapper: createWrapper() });

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByTestId("loading-spinner")).not.toBeInTheDocument();
    });

    // Check if users are displayed
    expect(screen.getByText("User Management")).toBeInTheDocument();
    expect(screen.getByRole("table")).toBeInTheDocument();
  });

  test("filters users by role", async () => {
    render(<UserManagement />, { wrapper: createWrapper() });

    // Wait for component to load
    await waitFor(() => {
      expect(screen.queryByTestId("loading-spinner")).not.toBeInTheDocument();
    });

    // Select role filter
    const roleFilter = screen.getByRole("combobox", { name: /role filter/i });
    await user.selectOptions(roleFilter, "admin");

    // Wait for filtered results
    await waitFor(() => {
      expect(screen.getByDisplayValue("admin")).toBeInTheDocument();
    });
  });

  test("creates new user successfully", async () => {
    render(<UserManagement />, { wrapper: createWrapper() });

    // Click create user button
    const createButton = screen.getByRole("button", { name: /create user/i });
    await user.click(createButton);

    // Fill form
    await user.type(screen.getByLabelText(/email/i), "test@example.com");
    await user.type(screen.getByLabelText(/first name/i), "Test");
    await user.type(screen.getByLabelText(/last name/i), "User");

    // Submit form
    const submitButton = screen.getByRole("button", { name: /save user/i });
    await user.click(submitButton);

    // Wait for success message
    await waitFor(() => {
      expect(
        screen.getByText(/user created successfully/i)
      ).toBeInTheDocument();
    });
  });

  test("handles user deletion with confirmation", async () => {
    render(<UserManagement />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.queryByTestId("loading-spinner")).not.toBeInTheDocument();
    });

    // Click delete button for first user
    const deleteButtons = screen.getAllByRole("button", { name: /delete/i });
    await user.click(deleteButtons[0]);

    // Confirm deletion in modal
    const confirmButton = screen.getByRole("button", {
      name: /confirm delete/i,
    });
    await user.click(confirmButton);

    // Wait for success message
    await waitFor(() => {
      expect(
        screen.getByText(/user deleted successfully/i)
      ).toBeInTheDocument();
    });
  });

  test("validates form inputs correctly", async () => {
    render(<UserManagement />, { wrapper: createWrapper() });

    // Click create user button
    const createButton = screen.getByRole("button", { name: /create user/i });
    await user.click(createButton);

    // Try to submit empty form
    const submitButton = screen.getByRole("button", { name: /save user/i });
    await user.click(submitButton);

    // Check for validation errors
    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      expect(screen.getByText(/first name is required/i)).toBeInTheDocument();
    });
  });

  test("handles API errors gracefully", async () => {
    // Mock API failure
    server.use(
      rest.get("/api/admin/users", (req, res, ctx) => {
        return res(ctx.status(500), ctx.json({ error: "Server error" }));
      })
    );

    render(<UserManagement />, { wrapper: createWrapper() });

    // Wait for error state
    await waitFor(() => {
      expect(screen.getByText(/failed to load users/i)).toBeInTheDocument();
    });

    // Check retry button
    const retryButton = screen.getByRole("button", { name: /retry/i });
    expect(retryButton).toBeInTheDocument();
  });
});
```

### **Service Testing**

```typescript
// src/services/__tests__/adminService.test.ts
import { adminService } from "../adminService";
import { server } from "../../test/mocks/server";
import { rest } from "msw";

describe("AdminService", () => {
  describe("getUsers", () => {
    test("fetches users successfully", async () => {
      const mockUsers = [
        { id: "1", email: "user1@example.com", role: "admin" },
        { id: "2", email: "user2@example.com", role: "user" },
      ];

      server.use(
        rest.get("/api/admin/users", (req, res, ctx) => {
          return res(ctx.json({ users: mockUsers, pagination: {} }));
        })
      );

      const result = await adminService.getUsers({ page: 1, limit: 10 });

      expect(result.users).toEqual(mockUsers);
      expect(result.users).toHaveLength(2);
    });

    test("handles API errors", async () => {
      server.use(
        rest.get("/api/admin/users", (req, res, ctx) => {
          return res(ctx.status(500), ctx.json({ error: "Server error" }));
        })
      );

      await expect(adminService.getUsers({})).rejects.toThrow("Server error");
    });

    test("applies filters correctly", async () => {
      server.use(
        rest.get("/api/admin/users", (req, res, ctx) => {
          const role = req.url.searchParams.get("role");
          const search = req.url.searchParams.get("search");

          expect(role).toBe("admin");
          expect(search).toBe("john");

          return res(ctx.json({ users: [], pagination: {} }));
        })
      );

      await adminService.getUsers({
        role: "admin",
        search: "john",
        page: 1,
        limit: 10,
      });
    });
  });

  describe("createUser", () => {
    test("creates user successfully", async () => {
      const userData = {
        email: "new@example.com",
        firstName: "New",
        lastName: "User",
        role: "user" as const,
      };

      const mockResponse = {
        success: true,
        user: { id: "123", ...userData },
      };

      server.use(
        rest.post("/api/admin/users", async (req, res, ctx) => {
          const body = await req.json();
          expect(body).toEqual(userData);
          return res(ctx.json(mockResponse));
        })
      );

      const result = await adminService.createUser(userData);
      expect(result.success).toBe(true);
      expect(result.user.email).toBe(userData.email);
    });
  });
});
```

### **Hook Testing**

```typescript
// src/hooks/__tests__/useUserManagement.test.ts
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useUserManagement } from "../useUserManagement";
import { createMockUser } from "../../test/factories/userFactory";

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe("useUserManagement Hook", () => {
  test("fetches users on mount", async () => {
    const { result } = renderHook(() => useUserManagement(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.users.isSuccess).toBe(true);
    });

    expect(result.current.users.data).toBeDefined();
  });

  test("creates user successfully", async () => {
    const { result } = renderHook(() => useUserManagement(), {
      wrapper: createWrapper(),
    });

    const userData = {
      email: "test@example.com",
      firstName: "Test",
      lastName: "User",
      role: "user" as const,
    };

    await waitFor(() => {
      result.current.createUser.mutate(userData);
    });

    await waitFor(() => {
      expect(result.current.createUser.isSuccess).toBe(true);
    });
  });

  test("handles user creation error", async () => {
    // Mock API error
    server.use(
      rest.post("/api/admin/users", (req, res, ctx) => {
        return res(ctx.status(400), ctx.json({ error: "Validation error" }));
      })
    );

    const { result } = renderHook(() => useUserManagement(), {
      wrapper: createWrapper(),
    });

    const userData = {
      email: "invalid-email",
      firstName: "",
      lastName: "",
      role: "user" as const,
    };

    await waitFor(() => {
      result.current.createUser.mutate(userData);
    });

    await waitFor(() => {
      expect(result.current.createUser.isError).toBe(true);
    });
  });
});
```

---

## 🔗 **Integration Testing**

### **Feature Integration Tests**

```typescript
// src/test/integration/userManagement.integration.test.tsx
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { App } from "../../App";
import { createMockUser } from "../factories/userFactory";

describe("User Management Integration", () => {
  test("complete user management workflow", async () => {
    const user = userEvent.setup();

    render(<App />);

    // Navigate to admin panel
    await user.click(screen.getByRole("link", { name: /admin/i }));

    // Navigate to user management
    await user.click(screen.getByRole("link", { name: /user management/i }));

    // Wait for page to load
    await waitFor(() => {
      expect(screen.getByText("User Management")).toBeInTheDocument();
    });

    // Create new user
    await user.click(screen.getByRole("button", { name: /create user/i }));

    // Fill form
    await user.type(screen.getByLabelText(/email/i), "integration@test.com");
    await user.type(screen.getByLabelText(/first name/i), "Integration");
    await user.type(screen.getByLabelText(/last name/i), "Test");

    // Submit and verify
    await user.click(screen.getByRole("button", { name: /save user/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/user created successfully/i)
      ).toBeInTheDocument();
    });

    // Verify user appears in list
    expect(screen.getByText("integration@test.com")).toBeInTheDocument();
  });

  test("user search and filter integration", async () => {
    const user = userEvent.setup();

    render(<App />);

    // Navigate to user management
    await user.click(screen.getByRole("link", { name: /admin/i }));
    await user.click(screen.getByRole("link", { name: /user management/i }));

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByRole("table")).toBeInTheDocument();
    });

    // Test search functionality
    const searchInput = screen.getByPlaceholderText(/search users/i);
    await user.type(searchInput, "john");

    // Wait for search results
    await waitFor(() => {
      expect(screen.getByDisplayValue("john")).toBeInTheDocument();
    });

    // Test role filter
    const roleFilter = screen.getByRole("combobox", { name: /role/i });
    await user.selectOptions(roleFilter, "admin");

    // Verify combined filters work
    await waitFor(() => {
      expect(screen.getByDisplayValue("admin")).toBeInTheDocument();
    });
  });
});
```

### **API Integration Tests**

```typescript
// src/test/integration/api.integration.test.ts
import { adminService } from "../../services/adminService";
import { setupTestServer } from "../mocks/server";

describe("API Integration Tests", () => {
  test("user CRUD operations", async () => {
    // Create user
    const userData = {
      email: "crud@test.com",
      firstName: "CRUD",
      lastName: "Test",
      role: "user" as const,
    };

    const createResult = await adminService.createUser(userData);
    expect(createResult.success).toBe(true);
    expect(createResult.user.email).toBe(userData.email);

    const userId = createResult.user.id;

    // Read user
    const getResult = await adminService.getUser(userId);
    expect(getResult.email).toBe(userData.email);

    // Update user
    const updateData = { firstName: "Updated" };
    const updateResult = await adminService.updateUser(userId, updateData);
    expect(updateResult.success).toBe(true);
    expect(updateResult.user.firstName).toBe("Updated");

    // Delete user
    const deleteResult = await adminService.deleteUser(userId);
    expect(deleteResult.success).toBe(true);

    // Verify deletion
    await expect(adminService.getUser(userId)).rejects.toThrow(
      "User not found"
    );
  });

  test("error handling across services", async () => {
    // Test network error
    server.use(
      rest.get("/api/admin/users", (req, res) => {
        return res.networkError("Network error");
      })
    );

    await expect(adminService.getUsers({})).rejects.toThrow();

    // Test server error
    server.use(
      rest.get("/api/admin/users", (req, res, ctx) => {
        return res(ctx.status(500), ctx.json({ error: "Internal error" }));
      })
    );

    await expect(adminService.getUsers({})).rejects.toThrow("Internal error");
  });
});
```

---

## 🌐 **E2E Testing (Playwright)**

### **Playwright Configuration**

```typescript
// playwright.config.ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },
    {
      name: "Mobile Chrome",
      use: { ...devices["Pixel 5"] },
    },
  ],
  webServer: {
    command: "npm run dev",
    port: 3000,
    reuseExistingServer: !process.env.CI,
  },
});
```

### **E2E Test Examples**

```typescript
// e2e/admin-workflow.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Admin User Management", () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto("/auth/login");
    await page.fill('[data-testid="email"]', "admin@test.com");
    await page.fill('[data-testid="password"]', "password123");
    await page.click('[data-testid="login-button"]');

    // Wait for redirect to admin dashboard
    await page.waitForURL("/admin/dashboard");
  });

  test("should manage users end-to-end", async ({ page }) => {
    // Navigate to user management
    await page.click('[data-testid="nav-users"]');
    await page.waitForURL("/admin/users");

    // Verify page loaded
    await expect(page.locator("h1")).toContainText("User Management");

    // Create new user
    await page.click('[data-testid="create-user-button"]');

    // Fill user form
    await page.fill('[data-testid="user-email"]', "e2e@test.com");
    await page.fill('[data-testid="user-firstname"]', "E2E");
    await page.fill('[data-testid="user-lastname"]', "Test");
    await page.selectOption('[data-testid="user-role"]', "user");

    // Submit form
    await page.click('[data-testid="save-user-button"]');

    // Wait for success message
    await expect(page.locator('[data-testid="success-message"]')).toContainText(
      "User created successfully"
    );

    // Verify user in table
    await expect(page.locator("table")).toContainText("e2e@test.com");

    // Edit user
    await page.click('[data-testid="edit-user-e2e@test.com"]');
    await page.fill('[data-testid="user-firstname"]', "Updated E2E");
    await page.click('[data-testid="save-user-button"]');

    // Verify update
    await expect(page.locator("table")).toContainText("Updated E2E");

    // Delete user
    await page.click('[data-testid="delete-user-e2e@test.com"]');
    await page.click('[data-testid="confirm-delete"]');

    // Verify deletion
    await expect(page.locator("table")).not.toContainText("e2e@test.com");
  });

  test("should handle search and filtering", async ({ page }) => {
    await page.goto("/admin/users");

    // Test search
    await page.fill('[data-testid="user-search"]', "admin");
    await page.waitForFunction(() => {
      const table = document.querySelector("table");
      return table && table.textContent?.includes("admin");
    });

    // Test role filter
    await page.selectOption('[data-testid="role-filter"]', "admin");
    await page.waitForFunction(() => {
      const rows = document.querySelectorAll("table tbody tr");
      return Array.from(rows).every((row) =>
        row.textContent?.includes("admin")
      );
    });

    // Clear filters
    await page.fill('[data-testid="user-search"]', "");
    await page.selectOption('[data-testid="role-filter"]', "all");
  });

  test("should handle pagination", async ({ page }) => {
    await page.goto("/admin/users");

    // Wait for table to load
    await page.waitForSelector("table tbody tr");

    // Test pagination if multiple pages exist
    const nextButton = page.locator('[data-testid="pagination-next"]');
    const isEnabled = await nextButton.isEnabled();

    if (isEnabled) {
      await nextButton.click();
      await page.waitForURL(/page=2/);
      await expect(page.locator('[data-testid="current-page"]')).toContainText(
        "2"
      );

      // Go back to first page
      await page.click('[data-testid="pagination-prev"]');
      await page.waitForURL(/page=1/);
    }
  });
});

// e2e/admin-orders.spec.ts
test.describe("Admin Order Management", () => {
  test("should view and update order status", async ({ page }) => {
    await page.goto("/admin/orders");

    // Wait for orders to load
    await page.waitForSelector('[data-testid="orders-table"]');

    // Click on first order
    const firstOrder = page.locator('[data-testid^="order-row-"]').first();
    await firstOrder.click();

    // Update order status
    await page.selectOption('[data-testid="order-status"]', "preparing");
    await page.click('[data-testid="update-status-button"]');

    // Verify status update
    await expect(page.locator('[data-testid="order-status"]')).toHaveValue(
      "preparing"
    );
  });
});
```

### **Visual Testing**

```typescript
// e2e/visual-regression.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Visual Regression Tests", () => {
  test("admin dashboard appearance", async ({ page }) => {
    await page.goto("/admin/dashboard");

    // Wait for all content to load
    await page.waitForLoadState("networkidle");

    // Take screenshot
    await expect(page).toHaveScreenshot("admin-dashboard.png");
  });

  test("user management table", async ({ page }) => {
    await page.goto("/admin/users");
    await page.waitForSelector("table");

    // Take screenshot of the table
    await expect(page.locator('[data-testid="users-table"]')).toHaveScreenshot(
      "users-table.png"
    );
  });

  test("responsive design - mobile view", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/admin/dashboard");

    await expect(page).toHaveScreenshot("admin-dashboard-mobile.png");
  });
});
```

---

## 🎭 **Mock Data & Services**

### **MSW Server Setup**

```typescript
// src/test/mocks/server.ts
import { setupServer } from "msw/node";
import { rest } from "msw";
import { userHandlers } from "./handlers/userHandlers";
import { orderHandlers } from "./handlers/orderHandlers";
import { analyticsHandlers } from "./handlers/analyticsHandlers";

export const handlers = [
  ...userHandlers,
  ...orderHandlers,
  ...analyticsHandlers,
];

export const server = setupServer(...handlers);
```

### **User Mock Handlers**

```typescript
// src/test/mocks/handlers/userHandlers.ts
import { rest } from "msw";
import { createMockUser, createMockUserList } from "../factories/userFactory";

export const userHandlers = [
  // Get users
  rest.get("/api/admin/users", (req, res, ctx) => {
    const page = Number(req.url.searchParams.get("page")) || 1;
    const limit = Number(req.url.searchParams.get("limit")) || 10;
    const search = req.url.searchParams.get("search");
    const role = req.url.searchParams.get("role");

    let users = createMockUserList(50);

    // Apply filters
    if (search) {
      users = users.filter(
        (user) =>
          user.email.includes(search) ||
          user.firstName.includes(search) ||
          user.lastName.includes(search)
      );
    }

    if (role && role !== "all") {
      users = users.filter((user) => user.role === role);
    }

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedUsers = users.slice(startIndex, endIndex);

    return res(
      ctx.json({
        users: paginatedUsers,
        pagination: {
          page,
          limit,
          total: users.length,
          totalPages: Math.ceil(users.length / limit),
          hasNext: endIndex < users.length,
          hasPrev: page > 1,
        },
      })
    );
  }),

  // Create user
  rest.post("/api/admin/users", async (req, res, ctx) => {
    const userData = await req.json();

    // Simulate validation
    if (!userData.email || !userData.firstName || !userData.lastName) {
      return res(
        ctx.status(422),
        ctx.json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Required fields missing",
            details: [
              { field: "email", message: "Email is required" },
              { field: "firstName", message: "First name is required" },
              { field: "lastName", message: "Last name is required" },
            ],
          },
        })
      );
    }

    const newUser = createMockUser(userData);

    return res(
      ctx.json({
        success: true,
        message: "User created successfully",
        user: newUser,
      })
    );
  }),

  // Update user
  rest.put("/api/admin/users/:userId", async (req, res, ctx) => {
    const { userId } = req.params;
    const updateData = await req.json();

    const updatedUser = createMockUser({ id: userId, ...updateData });

    return res(
      ctx.json({
        success: true,
        message: "User updated successfully",
        user: updatedUser,
      })
    );
  }),

  // Delete user
  rest.delete("/api/admin/users/:userId", (req, res, ctx) => {
    return res(
      ctx.json({
        success: true,
        message: "User deleted successfully",
      })
    );
  }),

  // Bulk operations
  rest.post("/api/admin/users/bulk", async (req, res, ctx) => {
    const { action, userIds } = await req.json();

    return res(
      ctx.json({
        success: true,
        message: `Bulk ${action} completed`,
        processed: userIds.length,
        failed: 0,
        results: userIds.map((id: string) => ({
          userId: id,
          status: "success",
        })),
      })
    );
  }),
];
```

### **Data Factories**

```typescript
// src/test/factories/userFactory.ts
import { faker } from "@faker-js/faker";
import { User, UserRole } from "../../types/admin";

export const createMockUser = (overrides: Partial<User> = {}): User => ({
  id: faker.string.uuid(),
  email: faker.internet.email(),
  firstName: faker.person.firstName(),
  lastName: faker.person.lastName(),
  role: faker.helpers.arrayElement([
    "admin",
    "user",
    "moderator",
  ] as UserRole[]),
  status: faker.helpers.arrayElement(["active", "inactive", "suspended"]),
  avatar: faker.image.avatar(),
  createdAt: faker.date.past().toISOString(),
  updatedAt: faker.date.recent().toISOString(),
  lastLogin: faker.date.recent().toISOString(),
  permissions: faker.helpers.arrayElements(["read", "write", "delete"], {
    min: 1,
    max: 3,
  }),
  ...overrides,
});

export const createMockUserList = (count: number): User[] =>
  Array.from({ length: count }, () => createMockUser());

export const createMockAdminUser = (): User =>
  createMockUser({
    role: "admin",
    permissions: ["read", "write", "delete"],
    status: "active",
  });

// src/test/factories/orderFactory.ts
export const createMockOrder = (overrides: Partial<Order> = {}): Order => ({
  id: faker.string.uuid(),
  orderNumber: `ORD-${faker.date.recent().getFullYear()}-${faker.string.numeric(
    6
  )}`,
  customerId: faker.string.uuid(),
  customerName: faker.person.fullName(),
  customerEmail: faker.internet.email(),
  status: faker.helpers.arrayElement([
    "pending",
    "preparing",
    "ready",
    "delivered",
    "cancelled",
  ]),
  totalAmount: faker.number.float({ min: 10, max: 100, fractionDigits: 2 }),
  items: Array.from({ length: faker.number.int({ min: 1, max: 5 }) }, () => ({
    id: faker.string.uuid(),
    name: faker.commerce.productName(),
    quantity: faker.number.int({ min: 1, max: 3 }),
    price: faker.number.float({ min: 5, max: 25, fractionDigits: 2 }),
    subtotal: faker.number.float({ min: 5, max: 75, fractionDigits: 2 }),
  })),
  createdAt: faker.date.past().toISOString(),
  updatedAt: faker.date.recent().toISOString(),
  ...overrides,
});
```

---

## 🛠️ **Testing Utilities**

### **Custom Render Function**

```typescript
// src/test/utils/testUtils.tsx
import React from "react";
import { render, RenderOptions } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { ThemeProvider } from "../context/ThemeContext";
import { AuthProvider } from "../context/AuthContext";

interface CustomRenderOptions extends Omit<RenderOptions, "wrapper"> {
  initialEntries?: string[];
  queryClient?: QueryClient;
}

const AllTheProviders = ({
  children,
  initialEntries = ["/"],
  queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  }),
}: {
  children: React.ReactNode;
  initialEntries?: string[];
  queryClient?: QueryClient;
}) => {
  return (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={initialEntries}>
        <ThemeProvider>
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
      </MemoryRouter>
    </QueryClientProvider>
  );
};

const customRender = (
  ui: React.ReactElement,
  options: CustomRenderOptions = {}
) => {
  const { initialEntries, queryClient, ...renderOptions } = options;

  return render(ui, {
    wrapper: (props) => (
      <AllTheProviders
        {...props}
        initialEntries={initialEntries}
        queryClient={queryClient}
      />
    ),
    ...renderOptions,
  });
};

export * from "@testing-library/react";
export { customRender as render };
```

### **Test Helper Functions**

```typescript
// src/test/utils/helpers.ts
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

export const waitForLoadingToFinish = async () => {
  await waitFor(() => {
    expect(screen.queryByTestId("loading-spinner")).not.toBeInTheDocument();
  });
};

export const fillForm = async (fields: Record<string, string>) => {
  const user = userEvent.setup();

  for (const [label, value] of Object.entries(fields)) {
    const field = screen.getByLabelText(new RegExp(label, "i"));
    await user.clear(field);
    await user.type(field, value);
  }
};

export const submitForm = async (buttonText = /submit|save|create/i) => {
  const user = userEvent.setup();
  const submitButton = screen.getByRole("button", { name: buttonText });
  await user.click(submitButton);
};

export const expectValidationErrors = async (errors: string[]) => {
  for (const error of errors) {
    await waitFor(() => {
      expect(screen.getByText(new RegExp(error, "i"))).toBeInTheDocument();
    });
  }
};

export const expectSuccessMessage = async (message = /success/i) => {
  await waitFor(() => {
    expect(screen.getByText(message)).toBeInTheDocument();
  });
};
```

---

## ⚡ **Performance Testing**

### **Component Performance Tests**

```typescript
// src/test/performance/componentPerformance.test.tsx
import { render } from "@testing-library/react";
import { UserManagement } from "../../components/admin/UserManagement";
import { createMockUserList } from "../factories/userFactory";

describe("Component Performance", () => {
  test("UserManagement renders large datasets efficiently", async () => {
    const largeUserList = createMockUserList(1000);

    // Mock the API to return large dataset
    server.use(
      rest.get("/api/admin/users", (req, res, ctx) => {
        return res(
          ctx.json({
            users: largeUserList,
            pagination: { total: 1000 },
          })
        );
      })
    );

    const startTime = performance.now();

    render(<UserManagement />);

    const endTime = performance.now();
    const renderTime = endTime - startTime;

    // Assert render time is reasonable (< 100ms)
    expect(renderTime).toBeLessThan(100);
  });

  test("Table virtualization works correctly", async () => {
    const { container } = render(<UserManagement />);

    // Check that only visible rows are rendered
    const rows = container.querySelectorAll("tbody tr");
    expect(rows.length).toBeLessThanOrEqual(20); // Assuming 20 items per page
  });
});
```

### **Memory Leak Tests**

```typescript
// src/test/performance/memoryLeaks.test.tsx
describe("Memory Leak Tests", () => {
  test("components clean up properly on unmount", () => {
    const { unmount } = render(<UserManagement />);

    // Track initial memory
    const initialMemory = (performance as any).memory?.usedJSHeapSize;

    // Unmount component
    unmount();

    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }

    // Check memory hasn't significantly increased
    const finalMemory = (performance as any).memory?.usedJSHeapSize;

    if (initialMemory && finalMemory) {
      const memoryIncrease = finalMemory - initialMemory;
      expect(memoryIncrease).toBeLessThan(1000000); // 1MB threshold
    }
  });
});
```

---

## ♿ **Accessibility Testing**

### **Automated A11y Tests**

```typescript
// src/test/accessibility/a11y.test.tsx
import { render } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import { UserManagement } from "../../components/admin/UserManagement";

expect.extend(toHaveNoViolations);

describe("Accessibility Tests", () => {
  test("UserManagement component has no accessibility violations", async () => {
    const { container } = render(<UserManagement />);

    // Wait for component to fully render
    await waitFor(() => {
      expect(screen.queryByTestId("loading-spinner")).not.toBeInTheDocument();
    });

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  test("keyboard navigation works correctly", async () => {
    const user = userEvent.setup();
    render(<UserManagement />);

    // Test tab navigation
    await user.tab();
    expect(screen.getByRole("button", { name: /create user/i })).toHaveFocus();

    await user.tab();
    expect(screen.getByRole("textbox", { name: /search/i })).toHaveFocus();
  });

  test("screen reader compatibility", async () => {
    render(<UserManagement />);

    // Check for proper ARIA labels
    expect(screen.getByRole("main")).toHaveAccessibleName();
    expect(screen.getByRole("table")).toHaveAccessibleName("Users table");

    // Check for proper headings structure
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
  });

  test("color contrast and visual indicators", () => {
    render(<UserManagement />);

    // Test that interactive elements have proper focus indicators
    const buttons = screen.getAllByRole("button");
    buttons.forEach((button) => {
      expect(button).toHaveStyle("outline: none"); // Should have custom focus styles
    });
  });
});
```

---

## 📊 **Test Coverage**

### **Coverage Configuration**

```json
{
  "collectCoverageFrom": [
    "src/components/admin/**/*.{ts,tsx}",
    "src/pages/admin/**/*.{ts,tsx}",
    "src/services/**/*.{ts,tsx}",
    "src/hooks/**/*.{ts,tsx}",
    "src/utils/**/*.{ts,tsx}",
    "!**/*.d.ts",
    "!**/node_modules/**",
    "!**/*.stories.{ts,tsx}",
    "!**/*.test.{ts,tsx}"
  ],
  "coverageThreshold": {
    "global": {
      "branches": 90,
      "functions": 90,
      "lines": 90,
      "statements": 90
    },
    "src/components/admin/": {
      "branches": 95,
      "functions": 95,
      "lines": 95,
      "statements": 95
    },
    "src/services/": {
      "branches": 85,
      "functions": 85,
      "lines": 85,
      "statements": 85
    }
  }
}
```

### **Coverage Scripts**

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:coverage:open": "jest --coverage && open coverage/lcov-report/index.html",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:all": "npm run test:coverage && npm run test:e2e"
  }
}
```

---

## 🚀 **CI/CD Integration**

### **GitHub Actions Workflow**

```yaml
# .github/workflows/test.yml
name: Test Suite

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  unit-tests:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "18"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Run unit tests
        run: npm run test:coverage

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info

  e2e-tests:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "18"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright
        run: npx playwright install --with-deps

      - name: Build application
        run: npm run build

      - name: Run E2E tests
        run: npm run test:e2e

      - name: Upload test results
        uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
```

### **Quality Gates**

```yaml
# .github/workflows/quality-gates.yml
name: Quality Gates

on:
  pull_request:
    branches: [main]

jobs:
  quality-check:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "18"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Lint code
        run: npm run lint

      - name: Type check
        run: npm run type-check

      - name: Run tests with coverage
        run: npm run test:coverage

      - name: Check coverage threshold
        run: |
          COVERAGE=$(grep -o '"pct":[0-9.]*' coverage/coverage-summary.json | head -1 | cut -d: -f2)
          if (( $(echo "$COVERAGE < 90" | bc -l) )); then
            echo "Coverage $COVERAGE% is below 90% threshold"
            exit 1
          fi

      - name: Run E2E tests
        run: npm run test:e2e

      - name: Performance audit
        run: npm run audit:performance
```

---

## 📚 **Test Documentation**

### **Testing Best Practices**

1. **Test Structure**

   - Follow AAA pattern (Arrange, Act, Assert)
   - Use descriptive test names
   - Group related tests with `describe` blocks
   - Keep tests focused and independent

2. **Mock Strategy**

   - Mock external dependencies
   - Use MSW for API mocking
   - Create reusable mock factories
   - Reset mocks between tests

3. **Accessibility**

   - Test with screen readers in mind
   - Verify keyboard navigation
   - Check color contrast
   - Use semantic HTML

4. **Performance**
   - Test with large datasets
   - Verify no memory leaks
   - Check render performance
   - Test loading states

### **Running Tests**

```bash
# Run all tests
npm run test:all

# Run unit tests only
npm test

# Run tests with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test UserManagement.test.tsx

# Run tests with specific pattern
npm test -- --testNamePattern="user creation"
```

### **Debugging Tests**

```bash
# Debug with Chrome DevTools
npm test -- --inspect-brk

# Run single test in debug mode
npm test -- --testNamePattern="specific test" --runInBand

# Generate coverage report
npm run test:coverage
open coverage/lcov-report/index.html
```

---

**🎯 Testing Goals**: 90%+ coverage, comprehensive E2E scenarios, accessibility compliance, performance validation

**📝 Last Updated**: September 29, 2025 - Phase 8.2 Testing Documentation Complete
