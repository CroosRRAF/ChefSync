import React, { Suspense } from 'react';
import { motion } from 'framer-motion';
import { ErrorBoundary } from './ErrorBoundary';
import { SkeletonCard } from './SkeletonLoader';
import { GlassCard } from './GlassCard';

interface LazyPageWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  errorFallback?: React.ReactNode;
  showProgress?: boolean;
}

const DefaultFallback: React.FC = () => (
  <div className="space-y-8 p-6">
    {/* Header Skeleton */}
    <GlassCard gradient="blue" className="p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded-xl animate-pulse" />
          <div className="space-y-2">
            <div className="h-8 w-48 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded animate-pulse" />
            <div className="h-4 w-64 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded animate-pulse" />
          </div>
        </div>
        <div className="flex gap-3">
          <div className="h-10 w-24 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded animate-pulse" />
          <div className="h-10 w-20 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded animate-pulse" />
        </div>
      </div>
    </GlassCard>

    {/* Stats Cards Skeleton */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <GlassCard key={i} gradient="none" className="p-6">
          <div className="animate-pulse">
            <div className="flex items-center justify-between mb-4">
              <div className="h-10 w-10 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded-xl" />
              <div className="h-4 w-16 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded" />
            </div>
            <div className="h-8 w-24 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded mb-2" />
            <div className="h-4 w-full bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded" />
          </div>
        </GlassCard>
      ))}
    </div>

    {/* Content Skeleton */}
    <GlassCard gradient="none" className="p-6">
      <div className="space-y-4">
        <div className="h-6 w-32 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded animate-pulse" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded animate-pulse" style={{ width: `${100 - i * 5}%` }} />
          ))}
        </div>
      </div>
    </GlassCard>
  </div>
);

const LoadingProgress: React.FC = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="fixed top-0 left-0 right-0 z-50"
  >
    <div className="h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500">
      <motion.div
        className="h-full bg-white/30 backdrop-blur-sm"
        initial={{ width: "0%" }}
        animate={{ width: "100%" }}
        transition={{ duration: 2, ease: "easeInOut" }}
      />
    </div>
  </motion.div>
);

export const LazyPageWrapper: React.FC<LazyPageWrapperProps> = ({
  children,
  fallback,
  errorFallback,
  showProgress = true,
}) => {
  return (
    <ErrorBoundary
      level="page"
      fallback={errorFallback}
      onError={(error, errorInfo) => {
        console.error('Lazy page error:', error, errorInfo);
      }}
    >
      <Suspense
        fallback={
          <div className="relative">
            {showProgress && <LoadingProgress />}
            {fallback || <DefaultFallback />}
          </div>
        }
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {children}
        </motion.div>
      </Suspense>
    </ErrorBoundary>
  );
};

// Higher-order component for lazy loading pages
export function withLazyLoading<P extends object>(
  Component: React.ComponentType<P>,
  options: {
    fallback?: React.ReactNode;
    errorFallback?: React.ReactNode;
    showProgress?: boolean;
  } = {}
) {
  const LazyComponent = React.forwardRef<any, P>((props, ref) => (
    <LazyPageWrapper {...options}>
      <Component {...props} ref={ref} />
    </LazyPageWrapper>
  ));

  LazyComponent.displayName = `withLazyLoading(${Component.displayName || Component.name})`;
  return LazyComponent;
}

export default LazyPageWrapper;
