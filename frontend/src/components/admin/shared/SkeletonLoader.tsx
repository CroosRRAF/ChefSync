import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import React from "react";

export interface SkeletonProps {
  className?: string;
  animate?: boolean;
}

export const Skeleton: React.FC<SkeletonProps> = ({ 
  className, 
  animate = true 
}) => {
  const baseClasses = cn(
    "bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700",
    "rounded-md",
    animate && "animate-pulse",
    className
  );

  if (animate) {
    return (
      <motion.div
        className={baseClasses}
        initial={{ opacity: 0.6 }}
        animate={{ opacity: [0.6, 1, 0.6] }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
    );
  }

  return <div className={baseClasses} />;
};

export interface SkeletonCardProps {
  className?: string;
  showAvatar?: boolean;
  lines?: number;
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({
  className,
  showAvatar = false,
  lines = 3
}) => {
  return (
    <div className={cn("p-6 space-y-4", className)}>
      {showAvatar && (
        <div className="flex items-center space-x-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      )}
      
      <div className="space-y-3">
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton 
            key={i} 
            className={cn(
              "h-4",
              i === lines - 1 ? "w-3/4" : "w-full"
            )} 
          />
        ))}
      </div>
    </div>
  );
};

export interface SkeletonTableProps {
  rows?: number;
  columns?: number;
  className?: string;
}

export const SkeletonTable: React.FC<SkeletonTableProps> = ({
  rows = 5,
  columns = 4,
  className
}) => {
  return (
    <div className={cn("space-y-4", className)}>
      {/* Table Header */}
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={`header-${i}`} className="h-6 w-full" />
        ))}
      </div>
      
      {/* Table Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div 
          key={`row-${rowIndex}`} 
          className="grid gap-4" 
          style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton 
              key={`cell-${rowIndex}-${colIndex}`} 
              className={cn(
                "h-4",
                colIndex === 0 ? "w-full" : "w-3/4"
              )} 
            />
          ))}
        </div>
      ))}
    </div>
  );
};

export interface SkeletonStatsProps {
  count?: number;
  className?: string;
}

export const SkeletonStats: React.FC<SkeletonStatsProps> = ({
  count = 4,
  className
}) => {
  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="p-6 rounded-xl border bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-4">
            <Skeleton className="h-10 w-10 rounded-xl" />
            <Skeleton className="h-4 w-16" />
          </div>
          <Skeleton className="h-8 w-24 mb-2" />
          <Skeleton className="h-4 w-full" />
        </div>
      ))}
    </div>
  );
};

export interface SkeletonChartProps {
  type?: "line" | "bar" | "pie";
  className?: string;
}

export const SkeletonChart: React.FC<SkeletonChartProps> = ({
  type = "line",
  className
}) => {
  return (
    <div className={cn("p-6", className)}>
      <div className="flex items-center justify-between mb-6">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-16" />
      </div>
      
      {type === "pie" ? (
        <div className="flex items-center justify-center">
          <Skeleton className="h-48 w-48 rounded-full" />
        </div>
      ) : (
        <div className="space-y-4">
          {/* Chart bars/lines */}
          <div className="flex items-end justify-between h-48 space-x-2">
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton 
                key={i} 
                className={cn(
                  "w-full",
                  type === "bar" ? "rounded-t" : "rounded",
                )} 
                style={{ 
                  height: `${Math.random() * 80 + 20}%` 
                }}
              />
            ))}
          </div>
          
          {/* X-axis labels */}
          <div className="flex justify-between">
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton key={i} className="h-3 w-8" />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export interface SkeletonListProps {
  items?: number;
  showAvatar?: boolean;
  className?: string;
}

export const SkeletonList: React.FC<SkeletonListProps> = ({
  items = 5,
  showAvatar = true,
  className
}) => {
  return (
    <div className={cn("space-y-4", className)}>
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center space-x-4 p-4 rounded-lg border">
          {showAvatar && <Skeleton className="h-10 w-10 rounded-full" />}
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-3 w-2/3" />
          </div>
          <Skeleton className="h-8 w-20" />
        </div>
      ))}
    </div>
  );
};

export default Skeleton;
