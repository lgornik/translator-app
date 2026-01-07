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
  // Correlation/tracing
  correlationId?: string;
  requestId?: string;
  traceId?: string;
  spanId?: string;
  
  // User context
  userId?: string;
  sessionId?: string;
  
  // Operation context
  operation?: string;
  duration?: number;
  
  // Extensible
  [key: string]: unknown;
}

/**
 * Base log entry structure (for structured logging)
 */
export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  service: string;
  version: string;
  environment: string;
  correlationId?: string | undefined;
  requestId?: string | undefined;
  context?: LogContext | undefined;
  error?: {
    name: string;
    message: string;
    stack?: string | undefined;
    code?: string | undefined;
  } | undefined;
}

/**
 * Logger configuration
 */
export interface LoggerConfig {
  service: string;
  version: string;
  environment: string;
  level: LogLevel;
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
   * The correlationId will be inherited by all child loggers
   */
  child(context: LogContext): ILogger;
  
  /**
   * Get current correlation ID (if set)
   */
  getCorrelationId(): string | undefined;
}