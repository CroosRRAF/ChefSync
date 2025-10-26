/**
 * Admin Pages Index
 * Exports all admin page components for easy importing
 */

// Active Admin Pages
export { default as Dashboard } from "./Dashboard";

// Development/Testing Pages
export { default as TestingDashboard } from "./TestingDashboard";

// Unified Hub Pages (Phase 2 Consolidation Complete)
export { default as AnalyticsHub } from "./AnalyticsHub";
export { default as UserManagementHub } from "./UserManagementHub";
export { default as OrderManagementHub } from "./OrderManagementHub";
export { default as ContentManagementHub } from "./ContentManagementHub";
export { default as ContentApprovalPage } from "./ContentApprovalPage";
export { default as CommunicationCenter } from "./CommunicationCenter";
export { default as SystemHub } from "./SystemHub";

// Type exports
export * from "../../types/admin";
