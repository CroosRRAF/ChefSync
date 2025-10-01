/**
 * Admin Pages Index
 * Exports all admin page components for easy importing
 */

// Core Admin Pages
export { default as AIInsights } from "./AIInsights";
export { default as Analytics } from "./Analytics";
export { default as Communication } from "./Communication";
export { default as Dashboard } from "./Dashboard";
export { default as FeedbackManagement } from "./FeedbackManagement";
export { default as FoodMenuManagement } from "./FoodMenuManagement";
export { default as ManageUser } from "./ManageUser";
export { default as OrderManagement } from "./OrderManagement";
export { default as PaymentManagement } from "./PaymentManagement";
export { default as Profile } from "./Profile";
export { default as Reports } from "./Reports";
export { default as Settings } from "./Settings";

// Advanced Features (Phase 5 completions)
export { default as AdvancedAnalytics } from "./AdvancedAnalytics";
export { default as AIReportsAutomation } from "./AIReportsAutomation";
export { default as BackendIntegration } from "./BackendIntegration";
export { default as MachineLearningIntegration } from "./MachineLearningIntegration";

// Type exports
export * from "../../types/admin";
