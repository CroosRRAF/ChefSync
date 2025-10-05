import React from "react";

/**
 * Loading Skeleton Components
 *
 * Provides elegant loading states for different UI components
 * while data is being fetched or processed.
 */

// Generic skeleton loader
export const Skeleton: React.FC<{ className?: string }> = ({
  className = "",
}) => (
  <div
    className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded ${className}`}
  />
);

// Card skeleton for dashboard widgets
export const CardSkeleton: React.FC = () => (
  <div className="p-6 border rounded-lg space-y-4">
    <div className="flex items-center justify-between">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-8 w-8 rounded-full" />
    </div>
    <Skeleton className="h-8 w-16" />
    <Skeleton className="h-3 w-32" />
  </div>
);

// Table skeleton for data tables
export const TableSkeleton: React.FC<{ rows?: number; columns?: number }> = ({
  rows = 5,
  columns = 4,
}) => (
  <div className="space-y-3">
    {/* Header */}
    <div
      className="grid gap-4"
      style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
    >
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton key={i} className="h-4 w-full" />
      ))}
    </div>
    {/* Rows */}
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div
        key={rowIndex}
        className="grid gap-4"
        style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
      >
        {Array.from({ length: columns }).map((_, colIndex) => (
          <Skeleton key={colIndex} className="h-4 w-full" />
        ))}
      </div>
    ))}
  </div>
);

// Chart skeleton for analytics
export const ChartSkeleton: React.FC = () => (
  <div className="space-y-4">
    <div className="flex items-center justify-between">
      <Skeleton className="h-5 w-32" />
      <Skeleton className="h-4 w-20" />
    </div>
    <div className="h-64 bg-gray-100 dark:bg-gray-800 rounded flex items-end justify-around p-4">
      {Array.from({ length: 7 }).map((_, i) => (
        <Skeleton
          key={i}
          className="w-8"
          style={{ height: `${Math.random() * 60 + 20}%` }}
        />
      ))}
    </div>
  </div>
);

// Profile skeleton
export const ProfileSkeleton: React.FC = () => (
  <div className="flex items-center space-x-4">
    <Skeleton className="h-16 w-16 rounded-full" />
    <div className="space-y-2">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-3 w-20" />
    </div>
  </div>
);

// Form skeleton
export const FormSkeleton: React.FC<{ fields?: number }> = ({ fields = 6 }) => (
  <div className="space-y-6">
    {Array.from({ length: fields }).map((_, i) => (
      <div key={i} className="space-y-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-10 w-full" />
      </div>
    ))}
    <div className="flex justify-end space-x-2">
      <Skeleton className="h-10 w-20" />
      <Skeleton className="h-10 w-24" />
    </div>
  </div>
);

// List skeleton
export const ListSkeleton: React.FC<{ items?: number }> = ({ items = 5 }) => (
  <div className="space-y-3">
    {Array.from({ length: items }).map((_, i) => (
      <div key={i} className="flex items-center space-x-3 p-3 border rounded">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
        <Skeleton className="h-8 w-16" />
      </div>
    ))}
  </div>
);

// Page skeleton for full page loading
export const PageSkeleton: React.FC = () => (
  <div className="space-y-6">
    {/* Header */}
    <div className="space-y-2">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-4 w-96" />
    </div>

    {/* Stats Grid */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>

    {/* Main Content */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <ChartSkeleton />
      </div>
      <div>
        <ListSkeleton />
      </div>
    </div>
  </div>
);

export default {
  Skeleton,
  CardSkeleton,
  TableSkeleton,
  ChartSkeleton,
  ProfileSkeleton,
  FormSkeleton,
  ListSkeleton,
  PageSkeleton,
};
