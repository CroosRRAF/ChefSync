// Modern UI Components (2025 Trending)
export { default as GlassCard } from "./GlassCard";
export type { GlassCardProps } from "./GlassCard";

export { default as AnimatedStats } from "./AnimatedStats";
export type { AnimatedStatsProps } from "./AnimatedStats";

export { default as GradientButton } from "./GradientButton";
export type { GradientButtonProps } from "./GradientButton";

export { default as CommandPalette } from "./CommandPalette";

export { default as AIAssistantButton } from "./AIAssistantButton";
export type { AIAssistantButtonProps } from "./AIAssistantButton";

// Optimistic UI Components
export { default as OptimisticButton } from "./OptimisticButton";
export type { OptimisticButtonProps } from "./OptimisticButton";

// Toast Notifications
export { default as ToastProvider, useToast } from "./Toast";
export type { Toast } from "./Toast";

// Error Boundaries
export { default as ErrorBoundary, withErrorBoundary } from "./ErrorBoundary";

// Performance Components
export { default as LazyPageWrapper, withLazyLoading } from "./LazyPageWrapper";
export { default as MemoizedDataTable, HighlyOptimizedDataTable } from "./MemoizedDataTable";

// Accessibility Components
export { default as AccessibleButton } from "./AccessibleButton";
export type { AccessibleButtonProps } from "./AccessibleButton";
export { default as SkipLinks, useSkipLinkTarget, withSkipLinkTarget } from "./SkipLinks";

// Skeleton Loading Components
export { 
  default as Skeleton,
  SkeletonCard,
  SkeletonTable,
  SkeletonStats,
  SkeletonChart,
  SkeletonList
} from "./SkeletonLoader";
export type { 
  SkeletonProps,
  SkeletonCardProps,
  SkeletonTableProps,
  SkeletonStatsProps,
  SkeletonChartProps,
  SkeletonListProps
} from "./SkeletonLoader";

// Chart Components
export { default as BarChart } from "./charts/BarChart";
export { default as LineChart } from "./charts/LineChart";
export { default as MetricCard } from "./charts/MetricCard";
export { default as PieChart } from "./charts/PieChart";

// Table Components
export { default as DataTable } from "./tables/DataTable";
export type { BulkAction, Column } from "./tables/DataTable";

// Form Components
export { default as DynamicForm } from "./forms/DynamicForm";
export type { FieldOption, FormError, FormField } from "./forms/DynamicForm";

// Modal Components
export {
  ConfirmModal,
  DeleteModal,
  DetailModal,
  FormModal,
  BaseModal as Modal,
  SaveModal,
} from "./modals/index";

// Widget Components
export {
  ActivityWidget,
  ProgressWidget,
  QuickActionsWidget,
  StatsWidget,
  SummaryWidget,
} from "./widgets/index";

// Note: Component prop types are defined within each component file
// Import the specific component files directly if you need access to their types
