/**
 * Error Handling & Monitoring Setup
 * Integration guide for production environment
 */

/**
 * 1. SETUP ERROR TRACKING (using Sentry)
 * 
 * Installation:
 * npm install @sentry/react @sentry/tracing
 * 
 * Usage in main.tsx:
 */

/*
import * as Sentry from "@sentry/react";
import { BrowserTracing } from "@sentry/tracing";

Sentry.init({
  dsn: process.env.REACT_APP_SENTRY_DSN,
  integrations: [
    new BrowserTracing(),
    new Sentry.Replay({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  beforeSend(event, hint) {
    // Filter out sensitive data
    if (event.request?.headers?.Authorization) {
      delete event.request.headers.Authorization;
    }
    return event;
  },
});

export const captureException = (error: Error, context?: Record<string, any>) => {
  Sentry.captureException(error, {
    tags: { module: context?.module },
    extra: context,
  });
};
*/

/**
 * 2. SETUP ANALYTICS (using Google Analytics 4)
 * 
 * Installation:
 * npm install @react-google-analytics/core
 * 
 * Usage:
 */

/*
import { GoogleAnalytics } from '@react-google-analytics/core';

declare global {
  interface Window {
    gtag: (command: string, ...args: any[]) => void;
  }
}

export const logEvent = (
  eventName: string,
  eventParams?: Record<string, any>
) => {
  if (window.gtag) {
    window.gtag('event', eventName, eventParams);
  }
};

// Track page views
export const trackPageView = (pageName: string) => {
  logEvent('page_view', {
    page_title: pageName,
    page_location: window.location.href,
  });
};

// Track API calls
export const trackApiCall = (endpoint: string, duration: number, success: boolean) => {
  logEvent('api_call', {
    endpoint,
    duration_ms: Math.round(duration),
    success,
  });
};
*/

/**
 * 3. STRUCTURED LOGGING SYSTEM
 * 
 * Local implementation without external dependencies
 */

export interface LogEntry {
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
  component: string;
  message: string;
  data?: Record<string, any>;
  userId?: string;
}

class Logger {
  private logs: LogEntry[] = [];
  private maxLogs = 1000;

  log(
    level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG',
    component: string,
    message: string,
    data?: Record<string, any>
  ) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      component,
      message,
      data,
      userId: sessionStorage.getItem('qsms_user') || undefined,
    };

    // Add to in-memory log
    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Console output with color coding
    const colors = {
      INFO: 'color: #0369a1',
      WARN: 'color: #ea580c',
      ERROR: 'color: #dc2626',
      DEBUG: 'color: #7c3aed',
    };
    console.log(
      `%c[${level}] ${component}: ${message}`,
      colors[level],
      data || ''
    );

    // Send to backend if error
    if (level === 'ERROR') {
      this.sendToBackend(entry);
    }
  }

  private sendToBackend(entry: LogEntry) {
    // Send error logs to backend for monitoring
    fetch('/api/logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry),
    }).catch(() => {
      // Silently fail if logging fails
    });
  }

  getLogs(filter?: { level?: string; component?: string }): LogEntry[] {
    return this.logs.filter((log) => {
      if (filter?.level && log.level !== filter.level) return false;
      if (filter?.component && log.component !== filter.component) return false;
      return true;
    });
  }

  clear() {
    this.logs = [];
  }

  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}

export const logger = new Logger();

/**
 * 4. API CALL WRAPPER WITH MONITORING
 */

export interface ApiCallOptions {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

export class ApiMonitor {
  private callStack: Map<string, number> = new Map();
  private errorCount = 0;
  private successCount = 0;

  async executeWithMonitoring<T>(
    operation: () => Promise<T>,
    operationName: string,
    options: ApiCallOptions = {}
  ): Promise<T> {
    const startTime = performance.now();
    const callId = `${operationName}-${Date.now()}`;

    this.callStack.set(callId, startTime);

    try {
      const result = await this.withRetry(
        operation,
        options.retries || 3,
        options.retryDelay || 1000
      );

      const duration = performance.now() - startTime;
      this.successCount++;

      logger.log('DEBUG', 'ApiMonitor', `${operationName} completed in ${duration.toFixed(2)}ms`, {
        duration,
        success: true,
      });

      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      this.errorCount++;

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.log('ERROR', 'ApiMonitor', `${operationName} failed after ${duration.toFixed(2)}ms`, {
        duration,
        error: errorMessage,
        retries: options.retries || 3,
      });

      throw error;
    } finally {
      this.callStack.delete(callId);
    }
  }

  private async withRetry<T>(
    fn: () => Promise<T>,
    retries: number,
    delay: number
  ): Promise<T> {
    for (let i = 0; i < retries; i++) {
      try {
        return await fn();
      } catch (error) {
        if (i === retries - 1) throw error;
        await new Promise((resolve) => setTimeout(resolve, delay * Math.pow(2, i)));
      }
    }
    throw new Error('Max retries exceeded');
  }

  getStats() {
    return {
      successCount: this.successCount,
      errorCount: this.errorCount,
      errorRate: this.errorCount / (this.successCount + this.errorCount) || 0,
      pendingCalls: this.callStack.size,
    };
  }

  getHealthStatus(): 'healthy' | 'degraded' | 'unhealthy' {
    const stats = this.getStats();
    if (stats.errorRate > 0.5) return 'unhealthy';
    if (stats.errorRate > 0.1) return 'degraded';
    return 'healthy';
  }
}

export const apiMonitor = new ApiMonitor();

/**
 * 5. USAGE EXAMPLES
 */

/*
// Using Logger
logger.log('INFO', 'App', 'User logged in successfully', {
  userId: 'admin',
  timestamp: new Date().toISOString(),
});

// Using ApiMonitor
const result = await apiMonitor.executeWithMonitoring(
  () => fetchAllCases(),
  'fetchAllCases',
  { retries: 3, timeout: 30000 }
);

// Get health status
const health = apiMonitor.getHealthStatus();
if (health !== 'healthy') {
  logger.log('WARN', 'System', 'API health degraded', {
    health,
    stats: apiMonitor.getStats(),
  });
}

// Export logs for debugging
const logs = logger.exportLogs();
console.log(logs);
*/

/**
 * 6. PRODUCTION DEPLOYMENT RECOMMENDATIONS
 * 
 * - Use environment variables for Sentry DSN and analytics tracking ID
 * - Implement graceful degradation (system works even if monitoring fails)
 * - Set up alerts for error rate > 5%
 * - Log all authentication attempts and failures
 * - Track performance metrics: P50, P95, P99 latency
 * - Monitor GAS quota usage to prevent rate limiting
 * - Set up automated alerts for system health
 */
