/**
 * Performance Monitoring & Optimization Utilities
 *
 * Provides performance monitoring, memoization helpers,
 * and optimization utilities for React components.
 */

// Performance metrics collection
export interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  componentCount: number;
  memoryUsage?: number;
  timestamp: number;
}

// Performance observer for monitoring page load
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: PerformanceMetrics[] = [];
  private observers: PerformanceObserver[] = [];

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  constructor() {
    this.initializeObservers();
  }

  private initializeObservers() {
    if (typeof window === "undefined" || !window.PerformanceObserver) {
      return;
    }

    // Observe navigation timing
    try {
      const navigationObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.entryType === "navigation") {
            this.recordMetric({
              loadTime: entry.loadEventEnd - entry.loadEventStart,
              renderTime:
                entry.domContentLoadedEventEnd -
                entry.domContentLoadedEventStart,
              componentCount:
                document.querySelectorAll("[data-component]").length,
              timestamp: Date.now(),
            });
          }
        });
      });

      navigationObserver.observe({ entryTypes: ["navigation"] });
      this.observers.push(navigationObserver);
    } catch (error) {
      console.warn("Navigation observer not supported:", error);
    }

    // Observe largest contentful paint
    try {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        console.log("LCP:", lastEntry.startTime);
      });

      lcpObserver.observe({ entryTypes: ["largest-contentful-paint"] });
      this.observers.push(lcpObserver);
    } catch (error) {
      console.warn("LCP observer not supported:", error);
    }
  }

  recordMetric(metric: PerformanceMetrics) {
    this.metrics.push(metric);

    // Keep only last 50 metrics
    if (this.metrics.length > 50) {
      this.metrics = this.metrics.slice(-50);
    }
  }

  getMetrics(): PerformanceMetrics[] {
    return [...this.metrics];
  }

  getAverageLoadTime(): number {
    if (this.metrics.length === 0) return 0;
    const total = this.metrics.reduce(
      (sum, metric) => sum + metric.loadTime,
      0
    );
    return total / this.metrics.length;
  }

  getMemoryUsage(): number | null {
    if ("memory" in performance) {
      const memory = (performance as any).memory;
      return {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        limit: memory.jsHeapSizeLimit,
      };
    }
    return null;
  }

  disconnect() {
    this.observers.forEach((observer) => observer.disconnect());
    this.observers = [];
  }
}

// Debounce utility for performance optimization
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  immediate?: boolean
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };

    const callNow = immediate && !timeout;

    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);

    if (callNow) func(...args);
  };
}

// Throttle utility for performance optimization
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// Virtual scrolling helper for large lists
export interface VirtualScrollOptions {
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
}

export function calculateVirtualScrollItems(
  scrollTop: number,
  totalItems: number,
  options: VirtualScrollOptions
) {
  const { itemHeight, containerHeight, overscan = 5 } = options;

  const startIndex = Math.floor(scrollTop / itemHeight);
  const endIndex = Math.min(
    startIndex + Math.ceil(containerHeight / itemHeight),
    totalItems - 1
  );

  const visibleStartIndex = Math.max(0, startIndex - overscan);
  const visibleEndIndex = Math.min(totalItems - 1, endIndex + overscan);

  return {
    startIndex: visibleStartIndex,
    endIndex: visibleEndIndex,
    offsetY: visibleStartIndex * itemHeight,
  };
}

// Intersection Observer hook utility
export interface UseIntersectionObserverOptions {
  threshold?: number | number[];
  root?: Element | null;
  rootMargin?: string;
}

export function createIntersectionObserver(
  callback: IntersectionObserverCallback,
  options: UseIntersectionObserverOptions = {}
): IntersectionObserver | null {
  if (typeof window === "undefined" || !window.IntersectionObserver) {
    return null;
  }

  return new IntersectionObserver(callback, {
    threshold: 0.1,
    rootMargin: "0px",
    ...options,
  });
}

// Image lazy loading utility
export function lazyLoadImage(
  img: HTMLImageElement,
  src: string,
  placeholder?: string
) {
  const observer = createIntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const image = entry.target as HTMLImageElement;
        image.src = src;
        image.onload = () => {
          image.classList.add("loaded");
        };
        observer?.unobserve(image);
      }
    });
  });

  if (observer) {
    if (placeholder) {
      img.src = placeholder;
    }
    img.classList.add("lazy-loading");
    observer.observe(img);
  } else {
    // Fallback for browsers without intersection observer
    img.src = src;
  }
}

// Bundle analyzer helper
export function analyzeBundleSize() {
  if (typeof window === "undefined") return;

  const scripts = Array.from(document.querySelectorAll("script[src]"));
  const styles = Array.from(
    document.querySelectorAll('link[rel="stylesheet"]')
  );

  console.group("Bundle Analysis");

  scripts.forEach((script: any) => {
    console.log("Script:", script.src, "Size: Unknown (external)");
  });

  styles.forEach((style: any) => {
    console.log("Stylesheet:", style.href, "Size: Unknown (external)");
  });

  const memoryInfo = (performance as any).memory;
  if (memoryInfo) {
    console.log("Memory Usage:", {
      used: `${(memoryInfo.usedJSHeapSize / 1048576).toFixed(2)} MB`,
      total: `${(memoryInfo.totalJSHeapSize / 1048576).toFixed(2)} MB`,
      limit: `${(memoryInfo.jsHeapSizeLimit / 1048576).toFixed(2)} MB`,
    });
  }

  console.groupEnd();
}

// Component render tracking
export function trackComponentRender(componentName: string) {
  if (process.env.NODE_ENV === "development") {
    console.log(`🔄 ${componentName} rendered at`, new Date().toISOString());
  }
}

export default {
  PerformanceMonitor,
  debounce,
  throttle,
  calculateVirtualScrollItems,
  createIntersectionObserver,
  lazyLoadImage,
  analyzeBundleSize,
  trackComponentRender,
};
