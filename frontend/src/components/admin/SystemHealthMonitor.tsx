import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  Activity,
  Cpu,
  HardDrive,
  MemoryStick,
  Database,
  Wifi,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Info
} from 'lucide-react';
import { adminService, type SystemHealth } from '@/services/adminService';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';

interface SystemHealthMonitorProps {
  className?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
  showDetails?: boolean;
}

const SystemHealthMonitor: React.FC<SystemHealthMonitorProps> = ({
  className = '',
  autoRefresh = true,
  refreshInterval = 30000, // 30 seconds
  showDetails = true
}) => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Fetch system health
  const fetchSystemHealth = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      const data = await adminService.getSystemHealth();
      setHealth(data);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch system health');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Get health status
  const getHealthStatus = (score: number, theme: 'light' | 'dark') => {
    if (score >= 80) return { 
      status: 'excellent', 
      color: theme === 'light' ? '#10B981' : '#34D399', 
      bg: theme === 'light' ? '#ECFDF5' : 'rgba(16, 185, 129, 0.15)' 
    };
    if (score >= 60) return { 
      status: 'good', 
      color: theme === 'light' ? '#FACC15' : '#FCD34D', 
      bg: theme === 'light' ? '#FFFBEB' : 'rgba(245, 158, 11, 0.15)' 
    };
    if (score >= 40) return { 
      status: 'warning', 
      color: theme === 'light' ? '#F59E0B' : '#FBBF24', 
      bg: theme === 'light' ? '#FFFBEB' : 'rgba(245, 158, 11, 0.15)' 
    };
    return { 
      status: 'critical', 
      color: theme === 'light' ? '#EF4444' : '#F87171', 
      bg: theme === 'light' ? '#FEF2F2' : 'rgba(239, 68, 68, 0.15)' 
    };
  };

  // Get health icon
  const getHealthIcon = (status: string, theme: 'light' | 'dark') => {
    const iconClass = 'h-5 w-5';
    switch (status) {
      case 'excellent':
        return <CheckCircle className={iconClass} style={{
          color: theme === 'light' ? '#10B981' : '#34D399'
        }} />;
      case 'good':
        return <CheckCircle className={iconClass} style={{
          color: theme === 'light' ? '#FACC15' : '#FCD34D'
        }} />;
      case 'warning':
        return <AlertTriangle className={iconClass} style={{
          color: theme === 'light' ? '#F59E0B' : '#FBBF24'
        }} />;
      case 'critical':
        return <XCircle className={iconClass} style={{
          color: theme === 'light' ? '#EF4444' : '#F87171'
        }} />;
      default:
        return <Info className={iconClass} style={{
          color: theme === 'light' ? '#6B7280' : '#9CA3AF'
        }} />;
    }
  };

  // Get usage color
  const getUsageColor = (usage: number, theme: 'light' | 'dark') => {
    if (usage >= 90) return theme === 'light' ? '#EF4444' : '#F87171';
    if (usage >= 80) return theme === 'light' ? '#F59E0B' : '#FBBF24';
    if (usage >= 60) return theme === 'light' ? '#FACC15' : '#FCD34D';
    return theme === 'light' ? '#10B981' : '#34D399';
  };

  // Get progress color
  const getProgressColor = (usage: number, theme: 'light' | 'dark') => {
    if (usage >= 90) return theme === 'light' ? '#EF4444' : '#F87171';
    if (usage >= 80) return theme === 'light' ? '#F59E0B' : '#FBBF24';
    if (usage >= 60) return theme === 'light' ? '#FACC15' : '#FCD34D';
    return theme === 'light' ? '#10B981' : '#34D399';
  };

  // Auto refresh effect
  useEffect(() => {
    if (autoRefresh && user) {
      fetchSystemHealth();
      const interval = setInterval(fetchSystemHealth, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval, fetchSystemHealth, user]);

  // Manual refresh
  const handleRefresh = () => {
    fetchSystemHealth();
  };

  if (!user) {
    return null;
  }

  if (loading && !health) {
    return (
      <Card className={className}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>System Health</CardTitle>
            <RefreshCw className="h-4 w-4 animate-spin" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-red-600">System Health</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <div className="text-red-500 mb-2">Error loading system health</div>
            <div className="text-sm text-gray-500 mb-4">{error}</div>
            <Button onClick={handleRefresh} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!health) {
    return null;
  }

  const healthStatus = getHealthStatus(health.health_score, theme);

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>System Health</CardTitle>
          <div className="flex items-center space-x-2">
            {lastUpdated && (
              <span className="text-xs text-gray-500">
                Updated {lastUpdated.toLocaleTimeString()}
              </span>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Health Score */}
        <div className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-2">
            {getHealthIcon(healthStatus.status, theme)}
            <span className="text-2xl font-bold" style={{
              color: healthStatus.color
            }}>
              {health.health_score.toFixed(1)}%
            </span>
          </div>
          <Badge className="border-0" style={{
            backgroundColor: healthStatus.bg,
            color: healthStatus.color
          }}>
            {healthStatus.status.toUpperCase()}
          </Badge>
        </div>

        {/* System Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* CPU Usage */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Cpu className="h-4 w-4" style={{
                  color: theme === 'light' ? '#3B82F6' : '#60A5FA'
                }} />
                <span className="text-sm font-medium">CPU Usage</span>
              </div>
              <span className="text-sm font-medium" style={{
                color: getUsageColor(health.cpu_usage, theme)
              }}>
                {health.cpu_usage.toFixed(1)}%
              </span>
            </div>
            <Progress 
              value={health.cpu_usage} 
              className="h-2"
            />
          </div>

          {/* Memory Usage */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <MemoryStick className="h-4 w-4" style={{
                  color: theme === 'light' ? '#10B981' : '#34D399'
                }} />
                <span className="text-sm font-medium">Memory Usage</span>
              </div>
              <span className="text-sm font-medium" style={{
                color: getUsageColor(health.memory_usage, theme)
              }}>
                {health.memory_usage.toFixed(1)}%
              </span>
            </div>
            <Progress 
              value={health.memory_usage} 
              className="h-2"
            />
          </div>

          {/* Disk Usage */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <HardDrive className="h-4 w-4" style={{
                  color: theme === 'light' ? '#7C3AED' : '#A78BFA'
                }} />
                <span className="text-sm font-medium">Disk Usage</span>
              </div>
              <span className="text-sm font-medium" style={{
                color: getUsageColor(health.disk_usage, theme)
              }}>
                {health.disk_usage.toFixed(1)}%
              </span>
            </div>
            <Progress 
              value={health.disk_usage} 
              className="h-2"
            />
          </div>

          {/* Database Connections */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Database className="h-4 w-4 text-orange-600" />
                <span className="text-sm font-medium">DB Connections</span>
              </div>
              <span className="text-sm font-medium text-gray-600">
                {health.database_connections}
              </span>
            </div>
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded">
              <div 
                className="h-2 bg-orange-500 rounded"
                style={{ width: `${Math.min((health.database_connections / 100) * 100, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Additional Metrics */}
        {showDetails && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
            <div className="text-center">
              <div className="flex items-center justify-center space-x-1 mb-1">
                <Activity className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">Response Time</span>
              </div>
              <div className="text-lg font-bold text-gray-900 dark:text-white">
                {health.response_time}ms
              </div>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center space-x-1 mb-1">
                <TrendingDown className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">Error Rate</span>
              </div>
              <div className="text-lg font-bold text-green-600">
                {health.error_rate}%
              </div>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center space-x-1 mb-1">
                <Wifi className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-medium">Uptime</span>
              </div>
              <div className="text-lg font-bold text-purple-600">
                {health.uptime}
              </div>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center space-x-1 mb-1">
                <HardDrive className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium">Last Backup</span>
              </div>
              <div className="text-sm text-gray-600">
                {health.last_backup 
                  ? new Date(health.last_backup).toLocaleDateString()
                  : 'Never'
                }
              </div>
            </div>
          </div>
        )}

        {/* Alerts */}
        {health.alerts && health.alerts.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white">Active Alerts</h4>
            <div className="space-y-2">
              {health.alerts.map((alert, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border ${
                    alert.type === 'critical' 
                      ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
                      : 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    {alert.type === 'critical' ? (
                      <XCircle className="h-4 w-4 text-red-600" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    )}
                    <span className="text-sm font-medium">{alert.message}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SystemHealthMonitor;
