/**
 * Performance optimization utilities for click handlers and UI interactions
 */

// Debounce utility for click handlers
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Throttle utility for high-frequency events
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

// Click performance monitor
export const measureClickPerformance = (handler: () => void, label: string = 'Click') => {
  return () => {
    const startTime = performance.now();
    handler();
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    if (duration > 100) {
      console.warn(`Slow ${label} handler: ${duration.toFixed(2)}ms`);
    }
    
    return duration;
  };
};

// Optimized click handler with automatic debouncing
export const createOptimizedClickHandler = <T extends (...args: any[]) => any>(
  handler: T,
  options: {
    debounceMs?: number;
    throttleMs?: number;
    measurePerformance?: boolean;
    label?: string;
  } = {}
): ((...args: Parameters<T>) => void) => {
  const {
    debounceMs = 0,
    throttleMs = 0,
    measurePerformance = false,
    label = 'Click'
  } = options;

  let optimizedHandler = handler;

  // Apply performance measurement
  if (measurePerformance) {
    optimizedHandler = measureClickPerformance(optimizedHandler, label) as T;
  }

  // Apply throttling
  if (throttleMs > 0) {
    optimizedHandler = throttle(optimizedHandler, throttleMs) as T;
  }

  // Apply debouncing
  if (debounceMs > 0) {
    optimizedHandler = debounce(optimizedHandler, debounceMs) as T;
  }

  return optimizedHandler;
};

// Batch DOM updates for better performance
export const batchDOMUpdates = (updates: (() => void)[]) => {
  requestAnimationFrame(() => {
    updates.forEach(update => update());
  });
};

// Optimize scroll handlers
export const createOptimizedScrollHandler = (
  handler: (event: Event) => void,
  throttleMs: number = 16 // ~60fps
) => {
  return throttle(handler, throttleMs);
};

// Optimize resize handlers
export const createOptimizedResizeHandler = (
  handler: (event: Event) => void,
  debounceMs: number = 250
) => {
  return debounce(handler, debounceMs);
};

// Memory-efficient event listener management
export class EventListenerManager {
  private listeners: Map<string, { element: EventTarget; event: string; handler: EventListener }[]> = new Map();

  addListener(
    id: string,
    element: EventTarget,
    event: string,
    handler: EventListener,
    options?: AddEventListenerOptions
  ) {
    element.addEventListener(event, handler, options);
    
    if (!this.listeners.has(id)) {
      this.listeners.set(id, []);
    }
    this.listeners.get(id)!.push({ element, event, handler });
  }

  removeAllListeners(id: string) {
    const listeners = this.listeners.get(id);
    if (listeners) {
      listeners.forEach(({ element, event, handler }) => {
        element.removeEventListener(event, handler);
      });
      this.listeners.delete(id);
    }
  }

  removeAllListeners() {
    this.listeners.forEach((listeners) => {
      listeners.forEach(({ element, event, handler }) => {
        element.removeEventListener(event, handler);
      });
    });
    this.listeners.clear();
  }
}

// Global event listener manager instance
export const globalEventListenerManager = new EventListenerManager();

// Performance monitoring for React components
export const withPerformanceMonitoring = <P extends object>(
  Component: React.ComponentType<P>,
  componentName: string
) => {
  return React.memo((props: P) => {
    const renderStart = performance.now();
    const result = React.createElement(Component, props);
    const renderEnd = performance.now();
    
    if (renderEnd - renderStart > 16) { // More than one frame
      console.warn(`Slow render for ${componentName}: ${(renderEnd - renderStart).toFixed(2)}ms`);
    }
    
    return result;
  });
};

// Export React for the HOC
import React from 'react';
