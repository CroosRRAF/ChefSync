// Performance Monitoring Utilities for ChefSync Admin
// Tracks Core Web Vitals and custom metrics

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  url: string;
}

interface WebVitalsMetric {
  name: 'CLS' | 'FID' | 'FCP' | 'LCP' | 'TTFB';
  value: number;
  delta: number;
  id: string;
  timestamp: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private observers: PerformanceObserver[] = [];
  private isEnabled: boolean = true;

  constructor() {
    this.initializeObservers();
    this.trackCustomMetrics();
  }

  // Initialize performance observers
  private initializeObservers() {
    if (!this.isEnabled || typeof window === 'undefined') return;

    try {
      // Observe navigation timing
      if ('PerformanceObserver' in window) {
        const navObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'navigation') {
              this.recordNavigationMetrics(entry as PerformanceNavigationTiming);
            }
          }
        });
        navObserver.observe({ entryTypes: ['navigation'] });
        this.observers.push(navObserver);

        // Observe resource timing
        const resourceObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'resource') {
              this.recordResourceMetric(entry as PerformanceResourceTiming);
            }
          }
        });
        resourceObserver.observe({ entryTypes: ['resource'] });
        this.observers.push(resourceObserver);

        // Observe paint timing
        const paintObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'paint') {
              this.recordMetric(entry.name, entry.startTime);
            }
          }
        });
        paintObserver.observe({ entryTypes: ['paint'] });
        this.observers.push(paintObserver);
      }
    } catch (error) {
      console.warn('Performance monitoring setup failed:', error);
    }
  }

  // Record navigation metrics
  private recordNavigationMetrics(entry: PerformanceNavigationTiming) {
    const metrics = {
      'DNS Lookup': entry.domainLookupEnd - entry.domainLookupStart,
      'TCP Connection': entry.connectEnd - entry.connectStart,
      'TLS Handshake': entry.secureConnectionStart > 0 ? entry.connectEnd - entry.secureConnectionStart : 0,
      'Request': entry.responseStart - entry.requestStart,
      'Response': entry.responseEnd - entry.responseStart,
      'DOM Processing': entry.domComplete - entry.domLoading,
      'Load Complete': entry.loadEventEnd - entry.loadEventStart,
      'Total Page Load': entry.loadEventEnd - entry.navigationStart,
    };

    Object.entries(metrics).forEach(([name, value]) => {
      if (value > 0) {
        this.recordMetric(name, value);
      }
    });
  }

  // Record resource timing
  private recordResourceMetric(entry: PerformanceResourceTiming) {
    const duration = entry.responseEnd - entry.startTime;
    
    // Only track significant resources
    if (duration > 100) {
      const resourceType = this.getResourceType(entry.name);
      this.recordMetric(`${resourceType} Load Time`, duration);
    }
  }

  // Get resource type from URL
  private getResourceType(url: string): string {
    if (url.includes('.js')) return 'JavaScript';
    if (url.includes('.css')) return 'CSS';
    if (url.match(/\.(png|jpg|jpeg|gif|svg|webp)$/)) return 'Image';
    if (url.includes('/api/')) return 'API';
    return 'Other';
  }

  // Track custom application metrics
  private trackCustomMetrics() {
    // Track React component render times
    this.trackReactPerformance();
    
    // Track user interactions
    this.trackUserInteractions();
    
    // Track memory usage
    this.trackMemoryUsage();
  }

  // Track React component performance
  private trackReactPerformance() {
    if (typeof window !== 'undefined' && (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__) {
      // This would integrate with React DevTools if available
      console.log('React DevTools detected - performance tracking enabled');
    }
  }

  // Track user interaction metrics
  private trackUserInteractions() {
    if (typeof window === 'undefined') return;

    const interactionTypes = ['click', 'keydown', 'scroll'];
    
    interactionTypes.forEach(type => {
      document.addEventListener(type, (event) => {
        const startTime = performance.now();
        
        // Use requestIdleCallback to measure after interaction
        if ('requestIdleCallback' in window) {
          requestIdleCallback(() => {
            const duration = performance.now() - startTime;
            this.recordMetric(`${type} Response Time`, duration);
          });
        }
      }, { passive: true });
    });
  }

  // Track memory usage
  private trackMemoryUsage() {
    if (typeof window === 'undefined' || !('memory' in performance)) return;

    setInterval(() => {
      const memory = (performance as any).memory;
      if (memory) {
        this.recordMetric('Heap Used', memory.usedJSHeapSize / 1024 / 1024); // MB
        this.recordMetric('Heap Total', memory.totalJSHeapSize / 1024 / 1024); // MB
        this.recordMetric('Heap Limit', memory.jsHeapSizeLimit / 1024 / 1024); // MB
      }
    }, 30000); // Every 30 seconds
  }

  // Record a performance metric
  recordMetric(name: string, value: number) {
    if (!this.isEnabled) return;

    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: Date.now(),
      url: typeof window !== 'undefined' ? window.location.pathname : '',
    };

    this.metrics.push(metric);

    // Keep only last 100 metrics to prevent memory leaks
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-100);
    }

    // Log significant performance issues
    this.checkPerformanceThresholds(metric);
  }

  // Check if metrics exceed performance thresholds
  private checkPerformanceThresholds(metric: PerformanceMetric) {
    const thresholds = {
      'Total Page Load': 3000, // 3 seconds
      'API Load Time': 2000, // 2 seconds
      'JavaScript Load Time': 1000, // 1 second
      'CSS Load Time': 500, // 500ms
      'click Response Time': 100, // 100ms
      'Heap Used': 50, // 50MB
    };

    const threshold = thresholds[metric.name as keyof typeof thresholds];
    if (threshold && metric.value > threshold) {
      console.warn(`⚠️ Performance threshold exceeded: ${metric.name} = ${metric.value.toFixed(2)}ms (threshold: ${threshold}ms)`);
      
      // In production, you might want to send this to an analytics service
      if (import.meta.env.PROD) {
        this.reportPerformanceIssue(metric, threshold);
      }
    }
  }

  // Report performance issues to analytics
  private reportPerformanceIssue(metric: PerformanceMetric, threshold: number) {
    // This would integrate with your analytics service
    console.log('Reporting performance issue:', {
      metric: metric.name,
      value: metric.value,
      threshold,
      url: metric.url,
      timestamp: metric.timestamp,
    });
  }

  // Get performance summary
  getPerformanceSummary() {
    const summary: Record<string, { avg: number; max: number; count: number }> = {};

    this.metrics.forEach(metric => {
      if (!summary[metric.name]) {
        summary[metric.name] = { avg: 0, max: 0, count: 0 };
      }

      const s = summary[metric.name];
      s.count++;
      s.max = Math.max(s.max, metric.value);
      s.avg = (s.avg * (s.count - 1) + metric.value) / s.count;
    });

    return summary;
  }

  // Get recent metrics
  getRecentMetrics(minutes: number = 5) {
    const cutoff = Date.now() - (minutes * 60 * 1000);
    return this.metrics.filter(metric => metric.timestamp > cutoff);
  }

  // Clear metrics
  clearMetrics() {
    this.metrics = [];
  }

  // Disable monitoring
  disable() {
    this.isEnabled = false;
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }

  // Enable monitoring
  enable() {
    this.isEnabled = true;
    this.initializeObservers();
  }
}

// Web Vitals integration
export function trackWebVitals(callback?: (metric: WebVitalsMetric) => void) {
  if (typeof window === 'undefined') return;

  // This would integrate with the web-vitals library
  // For now, we'll use basic performance API
  
  try {
    // Track Largest Contentful Paint (LCP)
    if ('PerformanceObserver' in window) {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        
        const metric: WebVitalsMetric = {
          name: 'LCP',
          value: lastEntry.startTime,
          delta: lastEntry.startTime,
          id: 'lcp',
          timestamp: Date.now(),
        };
        
        callback?.(metric);
        console.log('LCP:', metric.value.toFixed(2), 'ms');
      });
      
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
    }

    // Track First Input Delay (FID)
    if ('PerformanceObserver' in window) {
      const fidObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const metric: WebVitalsMetric = {
            name: 'FID',
            value: (entry as any).processingStart - entry.startTime,
            delta: (entry as any).processingStart - entry.startTime,
            id: 'fid',
            timestamp: Date.now(),
          };
          
          callback?.(metric);
          console.log('FID:', metric.value.toFixed(2), 'ms');
        }
      });
      
      fidObserver.observe({ entryTypes: ['first-input'] });
    }
  } catch (error) {
    console.warn('Web Vitals tracking failed:', error);
  }
}

// Create singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Export for debugging
if (typeof window !== 'undefined') {
  (window as any).performanceMonitor = performanceMonitor;
}

// Auto-start web vitals tracking
trackWebVitals((metric) => {
  performanceMonitor.recordMetric(metric.name, metric.value);
});
