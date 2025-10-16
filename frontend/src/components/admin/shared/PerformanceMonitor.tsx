import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Activity, Zap, Clock, AlertTriangle } from 'lucide-react';
import { getCacheStats, clearApiCache } from '@/services/apiClient';
import { DraggableWrapper } from './DraggableWrapper';

interface PerformanceMetrics {
  apiCacheSize: number;
  renderTime: number;
  memoryUsage: number;
  slowRequests: number;
}

const PerformanceMonitor: React.FC = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    apiCacheSize: 0,
    renderTime: 0,
    memoryUsage: 0,
    slowRequests: 0,
  });

  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const updateMetrics = () => {
      const cacheStats = getCacheStats();
      const memoryInfo = (performance as any).memory;
      
      setMetrics({
        apiCacheSize: cacheStats.size,
        renderTime: performance.now(),
        memoryUsage: memoryInfo ? Math.round(memoryInfo.usedJSHeapSize / 1024 / 1024) : 0,
        slowRequests: 0, // This would be tracked by the API client
      });
    };

    // Update metrics every 5 seconds
    const interval = setInterval(updateMetrics, 5000);
    updateMetrics(); // Initial update

    return () => clearInterval(interval);
  }, []);

  const handleClearCache = () => {
    clearApiCache();
    setMetrics(prev => ({ ...prev, apiCacheSize: 0 }));
  };

  if (!isVisible) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsVisible(true)}
        className="fixed bottom-24 right-6 z-[60] shadow-lg"
      >
        <Activity className="h-4 w-4 mr-2" />
        Performance
      </Button>
    );
  }

  return (
    <DraggableWrapper
      initialPosition={{ x: window.innerWidth - 340, y: window.innerHeight - 400 }}
      storageKey="performance-monitor-position"
      zIndex={55}
    >
      <Card className="w-80 shadow-xl">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center">
            <Zap className="h-4 w-4 mr-2" />
            Performance Monitor
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsVisible(false)}
            className="h-6 w-6 p-0"
          >
            ×
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">API Cache:</span>
            <Badge variant={metrics.apiCacheSize > 10 ? "destructive" : "secondary"}>
              {metrics.apiCacheSize} items
            </Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Memory:</span>
            <Badge variant={metrics.memoryUsage > 100 ? "destructive" : "secondary"}>
              {metrics.memoryUsage}MB
            </Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Render Time:</span>
            <Badge variant={metrics.renderTime > 16 ? "destructive" : "secondary"}>
              {metrics.renderTime.toFixed(1)}ms
            </Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Slow Requests:</span>
            <Badge variant={metrics.slowRequests > 0 ? "destructive" : "secondary"}>
              {metrics.slowRequests}
            </Badge>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearCache}
            className="flex-1 text-xs"
          >
            Clear Cache
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.reload()}
            className="flex-1 text-xs"
          >
            Reload
          </Button>
        </div>
        
        {metrics.memoryUsage > 100 && (
          <div className="flex items-center gap-2 text-xs text-orange-600">
            <AlertTriangle className="h-3 w-3" />
            High memory usage detected
          </div>
        )}
        
        {metrics.renderTime > 16 && (
          <div className="flex items-center gap-2 text-xs text-orange-600">
            <Clock className="h-3 w-3" />
            Slow render detected
          </div>
        )}
      </CardContent>
    </Card>
    </DraggableWrapper>
  );
};

export default PerformanceMonitor;
