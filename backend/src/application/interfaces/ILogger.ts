/**
 * Log levels
 */
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

/**
 * Log context - additional metadata
 */
export interface LogContext {
  requestId?: string;
  userId?: string;
  sessionId?: string;
  operation?: string;
  duration?: number;
  [key: string]: unknown;
}

/**
 * Logger Interface (Port)
 * Allows swapping logging implementations
 */
export interface ILogger {
  debug(message: string, context?: LogContext): void;
  info(message: string, context?: LogContext): void;
  warn(message: string, context?: LogContext): void;
  error(message: string, error?: Error, context?: LogContext): void;
  
  /**
   * Create a child logger with preset context
   */
  child(context: LogContext): ILogger;
}
