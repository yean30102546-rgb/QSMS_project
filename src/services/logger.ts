/**
 * Logger Service
 * Centralized logging for errors, warnings, and info messages
 */

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: any;
  stack?: string;
}

interface LoggerConfig {
  isDevelopment: boolean;
  enableRemoteLogging: boolean;
  maxLocalLogs: number;
  remoteEndpoint?: string;
}

class Logger {
  private logs: LogEntry[] = [];
  private config: LoggerConfig = {
    isDevelopment: process.env.NODE_ENV === 'development',
    enableRemoteLogging: false,
    maxLocalLogs: 100,
  };

  constructor(config?: Partial<LoggerConfig>) {
    this.config = { ...this.config, ...config };
  }

  /**
   * Format timestamp for logs
   */
  private getTimestamp(): string {
    return new Date().toISOString();
  }

  /**
   * Log entry with level and message
   */
  private logEntry(level: LogLevel, message: string, data?: any, stack?: string) {
    const entry: LogEntry = {
      timestamp: this.getTimestamp(),
      level,
      message,
      data,
      stack,
    };

    // Store in memory (limited history)
    this.logs.push(entry);
    if (this.logs.length > this.config.maxLocalLogs) {
      this.logs = this.logs.slice(-this.config.maxLocalLogs);
    }

    // Console output in development
    if (this.config.isDevelopment) {
      this.consoleLog(level, message, data, stack);
    }

    // Send to remote service for errors
    if (level === LogLevel.ERROR && this.config.enableRemoteLogging) {
      this.sendToRemote(entry);
    }
  }

  /**
   * Console logging with colors
   */
  private consoleLog(level: LogLevel, message: string, data?: any, stack?: string) {
    const colors: Record<LogLevel, string> = {
      [LogLevel.DEBUG]: 'color: #999; font-weight: bold;',
      [LogLevel.INFO]: 'color: #0066cc; font-weight: bold;',
      [LogLevel.WARN]: 'color: #ff9900; font-weight: bold;',
      [LogLevel.ERROR]: 'color: #cc0000; font-weight: bold;',
    };

    const prefix = `%c[${level}]`;
    const timestamp = `%c${this.getTimestamp()}`;

    switch (level) {
      case LogLevel.DEBUG:
        console.debug(prefix, colors[level], timestamp, colors.DEBUG, message, data);
        break;
      case LogLevel.INFO:
        console.info(prefix, colors[level], timestamp, colors.INFO, message, data);
        break;
      case LogLevel.WARN:
        console.warn(prefix, colors[level], timestamp, colors.WARN, message, data);
        break;
      case LogLevel.ERROR:
        console.error(prefix, colors[level], timestamp, colors.ERROR, message, data);
        if (stack) console.error('Stack:', stack);
        break;
    }
  }

  /**
   * Send log to remote service
   */
  private sendToRemote(entry: LogEntry) {
    if (!this.config.remoteEndpoint) return;

    try {
      // Send to monitoring service (e.g., Sentry, LogRocket)
      fetch(this.config.remoteEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry),
      }).catch((err) => console.error('Failed to send log to remote:', err));
    } catch (error) {
      console.error('Error sending remote log:', error);
    }
  }

  /**
   * Debug level logging
   */
  debug(message: string, data?: any) {
    this.logEntry(LogLevel.DEBUG, message, data);
  }

  /**
   * Info level logging
   */
  info(message: string, data?: any) {
    this.logEntry(LogLevel.INFO, message, data);
  }

  /**
   * Warning level logging
   */
  warn(message: string, data?: any) {
    this.logEntry(LogLevel.WARN, message, data);
  }

  /**
   * Error level logging with stack trace
   */
  error(message: string, error?: Error | any, data?: any) {
    const stack = error instanceof Error ? error.stack : undefined;
    const errorData = {
      ...data,
      errorMessage: error instanceof Error ? error.message : String(error),
    };
    this.logEntry(LogLevel.ERROR, message, errorData, stack);
  }

  /**
   * Log performance metrics
   */
  logPerformance(operation: string, duration: number, metadata?: any) {
    this.info(`Performance: ${operation}`, {
      duration: `${duration.toFixed(2)}ms`,
      ...metadata,
    });
  }

  /**
   * Log API calls
   */
  logApiCall(method: string, endpoint: string, status: number, duration: number, error?: any) {
    const level = status >= 400 ? LogLevel.WARN : LogLevel.DEBUG;
    this.logEntry(level, `API ${method} ${endpoint}`, {
      status,
      duration: `${duration.toFixed(2)}ms`,
      error,
    });
  }

  /**
   * Get all logs
   */
  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  /**
   * Get logs filtered by level
   */
  getLogsByLevel(level: LogLevel): LogEntry[] {
    return this.logs.filter((log) => log.level === level);
  }

  /**
   * Clear all logs
   */
  clearLogs() {
    this.logs = [];
  }

  /**
   * Export logs as JSON
   */
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  /**
   * Configure logger
   */
  configure(config: Partial<LoggerConfig>) {
    this.config = { ...this.config, ...config };
  }
}

// Export singleton instance
export const logger = new Logger();

/**
 * Convenience functions for global use
 */
export const log = {
  debug: (msg: string, data?: any) => logger.debug(msg, data),
  info: (msg: string, data?: any) => logger.info(msg, data),
  warn: (msg: string, data?: any) => logger.warn(msg, data),
  error: (msg: string, error?: Error | any, data?: any) => logger.error(msg, error, data),
  performance: (op: string, duration: number, metadata?: any) => logger.logPerformance(op, duration, metadata),
  api: (method: string, endpoint: string, status: number, duration: number, error?: any) =>
    logger.logApiCall(method, endpoint, status, duration, error),
};