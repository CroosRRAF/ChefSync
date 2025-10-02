import { useCallback, useMemo, useRef, useEffect } from 'react';

/**
 * Debounce hook for performance optimization
 */
export function useDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const timeoutRef = useRef<NodeJS.Timeout>();
  
  return useCallback((...args: Parameters<T>) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  }, [callback, delay]) as T;
}

/**
 * Throttle hook for performance optimization
 */
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const lastCallRef = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout>();
  
  return useCallback((...args: Parameters<T>) => {
    const now = Date.now();
    const timeSinceLastCall = now - lastCallRef.current;
    
    if (timeSinceLastCall >= delay) {
      lastCallRef.current = now;
      callback(...args);
    } else {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        lastCallRef.current = Date.now();
        callback(...args);
      }, delay - timeSinceLastCall);
    }
  }, [callback, delay]) as T;
}

/**
 * Memoized computation hook with dependency tracking
 */
export function useMemoizedComputation<T>(
  computation: () => T,
  deps: React.DependencyList,
  options: {
    maxAge?: number; // Cache expiry in milliseconds
    debug?: boolean;
  } = {}
): T {
  const { maxAge = 5 * 60 * 1000, debug = false } = options; // Default 5 minutes
  const cacheRef = useRef<{
    value: T;
    timestamp: number;
    deps: React.DependencyList;
  }>();

  return useMemo(() => {
    const now = Date.now();
    
    // Check if we have a cached value
    if (cacheRef.current) {
      const { value, timestamp, deps: cachedDeps } = cacheRef.current;
      
      // Check if dependencies haven't changed and cache hasn't expired
      const depsUnchanged = deps.length === cachedDeps.length && 
        deps.every((dep, index) => dep === cachedDeps[index]);
      const cacheValid = (now - timestamp) < maxAge;
      
      if (depsUnchanged && cacheValid) {
        if (debug) {
          console.log('🚀 Using cached computation result');
        }
        return value;
      }
    }
    
    // Compute new value
    if (debug) {
      console.log('🔄 Computing new result');
    }
    const newValue = computation();
    
    // Cache the result
    cacheRef.current = {
      value: newValue,
      timestamp: now,
      deps: [...deps],
    };
    
    return newValue;
  }, deps);
}

/**
 * Virtual scrolling hook for large lists
 */
export function useVirtualScrolling<T>(
  items: T[],
  itemHeight: number,
  containerHeight: number,
  overscan: number = 5
) {
  const [scrollTop, setScrollTop] = useState(0);
  
  const visibleRange = useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      items.length - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    );
    
    return { startIndex, endIndex };
  }, [scrollTop, itemHeight, containerHeight, items.length, overscan]);
  
  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.startIndex, visibleRange.endIndex + 1);
  }, [items, visibleRange]);
  
  const totalHeight = items.length * itemHeight;
  const offsetY = visibleRange.startIndex * itemHeight;
  
  return {
    visibleItems,
    totalHeight,
    offsetY,
    setScrollTop,
    visibleRange,
  };
}

/**
 * Intersection Observer hook for lazy loading
 */
export function useIntersectionObserver(
  options: IntersectionObserverInit = {}
) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasIntersected, setHasIntersected] = useState(false);
  const targetRef = useRef<HTMLElement>(null);
  
  useEffect(() => {
    const element = targetRef.current;
    if (!element) return;
    
    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting);
      if (entry.isIntersecting && !hasIntersected) {
        setHasIntersected(true);
      }
    }, options);
    
    observer.observe(element);
    
    return () => {
      observer.disconnect();
    };
  }, [options, hasIntersected]);
  
  return {
    targetRef,
    isIntersecting,
    hasIntersected,
  };
}

/**
 * Performance monitoring hook
 */
export function usePerformanceMonitor(name: string) {
  const startTimeRef = useRef<number>();
  
  const start = useCallback(() => {
    startTimeRef.current = performance.now();
  }, []);
  
  const end = useCallback(() => {
    if (startTimeRef.current) {
      const duration = performance.now() - startTimeRef.current;
      console.log(`⏱️ ${name}: ${duration.toFixed(2)}ms`);
      
      // Report to performance monitoring service
      if (typeof window !== 'undefined' && 'performance' in window) {
        performance.mark(`${name}-end`);
        performance.measure(name, `${name}-start`, `${name}-end`);
      }
      
      return duration;
    }
    return 0;
  }, [name]);
  
  useEffect(() => {
    if (typeof window !== 'undefined' && 'performance' in window) {
      performance.mark(`${name}-start`);
    }
  }, [name]);
  
  return { start, end };
}

/**
 * Lazy component loader utility
 * Note: This returns a lazy component factory, JSX implementation should be in .tsx files
 */
export function createLazyComponent<T extends React.ComponentType<any>>(
  importFn: () => Promise<{ default: T }>
) {
  return React.lazy(importFn);
}

/**
 * Memory usage monitoring
 */
export function useMemoryMonitor() {
  const [memoryInfo, setMemoryInfo] = useState<{
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  } | null>(null);
  
  useEffect(() => {
    const updateMemoryInfo = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        setMemoryInfo({
          usedJSHeapSize: memory.usedJSHeapSize,
          totalJSHeapSize: memory.totalJSHeapSize,
          jsHeapSizeLimit: memory.jsHeapSizeLimit,
        });
      }
    };
    
    updateMemoryInfo();
    const interval = setInterval(updateMemoryInfo, 5000); // Update every 5 seconds
    
    return () => clearInterval(interval);
  }, []);
  
  return memoryInfo;
}

/**
 * Bundle size analyzer (development only)
 */
export function analyzeBundleSize() {
  if (process.env.NODE_ENV === 'development') {
    const scripts = Array.from(document.querySelectorAll('script[src]'));
    const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
    
    console.group('📦 Bundle Analysis');
    console.log('Scripts:', scripts.map(s => (s as HTMLScriptElement).src));
    console.log('Styles:', styles.map(s => (s as HTMLLinkElement).href));
    console.groupEnd();
  }
}

// Import React for lazy component creation
import React, { useState } from 'react';

export default {
  useDebounce,
  useThrottle,
  useMemoizedComputation,
  useVirtualScrolling,
  useIntersectionObserver,
  usePerformanceMonitor,
  createLazyComponent,
  useMemoryMonitor,
  analyzeBundleSize,
};