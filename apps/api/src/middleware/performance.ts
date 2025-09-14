import { Request, Response, NextFunction } from 'express';
import { performance } from 'perf_hooks';

interface PerformanceMetrics {
  endpoint: string;
  method: string;
  duration: number;
  statusCode: number;
  timestamp: string;
}

class PerformanceMonitor {
  private static metrics: PerformanceMetrics[] = [];
  private static readonly MAX_METRICS = 1000; // Keep last 1000 requests
  private static readonly PERFORMANCE_TARGET_MS = 200; // Target from architecture docs

  static middleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      const startTime = performance.now();
      const originalSend = res.send;

      res.send = function (body) {
        const endTime = performance.now();
        const duration = endTime - startTime;

        const metric: PerformanceMetrics = {
          endpoint: req.path,
          method: req.method,
          duration: Math.round(duration * 100) / 100, // Round to 2 decimal places
          statusCode: res.statusCode,
          timestamp: new Date().toISOString(),
        };

        PerformanceMonitor.recordMetric(metric);

        // Log slow requests
        if (duration > PerformanceMonitor.PERFORMANCE_TARGET_MS) {
          console.warn(`⚠️  Slow API request: ${req.method} ${req.path} took ${duration.toFixed(2)}ms (target: ${PerformanceMonitor.PERFORMANCE_TARGET_MS}ms)`);
        }

        return originalSend.call(this, body);
      };

      next();
    };
  }

  private static recordMetric(metric: PerformanceMetrics) {
    this.metrics.push(metric);

    // Keep only the most recent metrics
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics = this.metrics.slice(-this.MAX_METRICS);
    }
  }

  static getMetrics(): PerformanceMetrics[] {
    return [...this.metrics];
  }

  static getStats() {
    if (this.metrics.length === 0) {
      return {
        totalRequests: 0,
        averageResponseTime: 0,
        p95ResponseTime: 0,
        slowRequestsCount: 0,
        slowRequestsPercentage: 0,
      };
    }

    const durations = this.metrics.map(m => m.duration).sort((a, b) => a - b);
    const slowRequests = this.metrics.filter(m => m.duration > this.PERFORMANCE_TARGET_MS);

    const p95Index = Math.floor(durations.length * 0.95);
    const average = durations.reduce((sum, duration) => sum + duration, 0) / durations.length;

    return {
      totalRequests: this.metrics.length,
      averageResponseTime: Math.round(average * 100) / 100,
      p95ResponseTime: durations[p95Index] || 0,
      slowRequestsCount: slowRequests.length,
      slowRequestsPercentage: Math.round((slowRequests.length / this.metrics.length) * 100 * 100) / 100,
      targetMs: this.PERFORMANCE_TARGET_MS,
    };
  }

  static reset() {
    this.metrics = [];
  }
}

export default PerformanceMonitor;