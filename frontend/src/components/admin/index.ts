/**
 * Admin Components Index
 * Exports all admin components for easy importing
 */

// Layout Components
export {
  AdminBreadcrumb,
  AdminLayout,
  AdminSidebar,
  AdminTopbar,
} from "./layout";

// Shared Components
export {
  // Widgets
  ActivityWidget,
  // Modals
  ConfirmModal,
  // Tables
  DataTable,
  DeleteModal,
  DetailModal,
  // Forms
  DynamicForm,
  FormModal,
  Modal,
  ProgressWidget,
  QuickActionsWidget,
  SaveModal,
  StatsWidget,
  SummaryWidget,
} from "./shared";

// Feature-specific component modules (placeholder exports)
export { AnalyticsComponents } from "./analytics";
export { CommunicationComponents } from "./communication";
export { DashboardComponents } from "./dashboard";
export { FeedbackComponents } from "./feedback-management";
export { FoodMenuComponents } from "./food-menu";
export { ProfileComponents } from "./profile";
export { ReportsComponents } from "./reports";
export { SettingsComponents } from "./settings";
export { UsersComponents } from "./users";

// Types
export type {
  FieldOption,
  FormError,
  FormField,
} from "./shared/forms/DynamicForm";
export type { BulkAction, Column } from "./shared/tables/DataTable";
