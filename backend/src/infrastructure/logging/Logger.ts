import { ILogger, LogContext, LogLevel, LogEntry, LoggerConfig } from '../../application/interfaces/ILogger.js';

/**
 * Structured Console Logger
 * Production-ready JSON logging with correlation ID support
 */
export class ConsoleLogger implements ILogger {
  private readonly config: LoggerConfig;
  private readonly baseContext: LogContext;

  constructor(
    config: Partial<LoggerConfig> & { level?: LogLevel } = {},
    baseContext: LogContext = {}
  ) {
    this.config = {
      service: config.service ?? 'translator-api',
      version: config.version ?? '1.0.0',
      environment: config.environment ?? process.env.NODE_ENV ?? 'development',
      level: config.level ?? LogLevel.INFO,
    };
    this.baseContext = baseContext;
  }

  debug(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      this.log(LogLevel.DEBUG, message, context);
    }
  }

  info(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.INFO)) {
      this.log(LogLevel.INFO, message, context);
    }
  }

  warn(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.WARN)) {
      this.log(LogLevel.WARN, message, context);
    }
  }

  error(message: string, error?: Error, context?: LogContext): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      this.log(LogLevel.ERROR, message, context, error);
    }
  }

  child(context: LogContext): ILogger {
    // Inherit correlationId if not provided
    const mergedContext: LogContext = {
      ...this.baseContext,
      ...context,
    };
    
    // If parent has correlationId and child doesn't, inherit it
    if (this.baseContext.correlationId && !context.correlationId) {
      mergedContext.correlationId = this.baseContext.correlationId;
    }
    
    // requestId can serve as correlationId if not set
    if (!mergedContext.correlationId && mergedContext.requestId) {
      mergedContext.correlationId = mergedContext.requestId;
    }

    return new ConsoleLogger(this.config, mergedContext);
  }

  getCorrelationId(): string | undefined {
    return this.baseContext.correlationId ?? this.baseContext.requestId;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];
    return levels.indexOf(level) >= levels.indexOf(this.config.level);
  }

  private log(level: LogLevel, message: string, context?: LogContext, error?: Error): void {
    const mergedContext = { ...this.baseContext, ...context };
    
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      service: this.config.service,
      version: this.config.version,
      environment: this.config.environment,
    };

    // Add correlation/request ID at top level for easy filtering
    if (mergedContext.correlationId) {
      entry.correlationId = mergedContext.correlationId;
    }
    if (mergedContext.requestId) {
      entry.requestId = mergedContext.requestId;
    }

    // Add remaining context
    const { correlationId, requestId, ...restContext } = mergedContext;
    if (Object.keys(restContext).length > 0) {
      entry.context = restContext;
    }

    // Add error details
    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
        code: (error as Error & { code?: string }).code,
      };
    }

    const output = JSON.stringify(entry);

    switch (level) {
      case LogLevel.ERROR:
        console.error(output);
        break;
      case LogLevel.WARN:
        console.warn(output);
        break;
      default:
        console.log(output);
    }
  }
}

/**
 * Development Logger
 * Pretty-printed output with colors for development
 */
export class DevLogger implements ILogger {
  private readonly baseContext: LogContext;

  private static readonly COLORS = {
    reset: '\x1b[0m',
    dim: '\x1b[2m',
    blue: '\x1b[34m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    cyan: '\x1b[36m',
  };

  constructor(baseContext: LogContext = {}) {
    this.baseContext = baseContext;
  }

  debug(message: string, context?: LogContext): void {
    this.log('DEBUG', DevLogger.COLORS.dim, message, context);
  }

  info(message: string, context?: LogContext): void {
    this.log('INFO ', DevLogger.COLORS.green, message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.log('WARN ', DevLogger.COLORS.yellow, message, context);
  }

  error(message: string, error?: Error, context?: LogContext): void {
    this.log('ERROR', DevLogger.COLORS.red, message, context);
    if (error) {
      console.error(error);
    }
  }

  child(context: LogContext): ILogger {
    const mergedContext: LogContext = {
      ...this.baseContext,
      ...context,
    };
    
    if (this.baseContext.correlationId && !context.correlationId) {
      mergedContext.correlationId = this.baseContext.correlationId;
    }
    
    if (!mergedContext.correlationId && mergedContext.requestId) {
      mergedContext.correlationId = mergedContext.requestId;
    }

    return new DevLogger(mergedContext);
  }

  getCorrelationId(): string | undefined {
    return this.baseContext.correlationId ?? this.baseContext.requestId;
  }

  private log(level: string, color: string, message: string, context?: LogContext): void {
    const { reset, dim, cyan } = DevLogger.COLORS;
    const merged = { ...this.baseContext, ...context };
    const time = new Date().toISOString().split('T')[1]?.slice(0, 12) ?? '';
    
    // Build prefix with correlation ID if present
    const correlationId = merged.correlationId ?? merged.requestId;
    const corrIdStr = correlationId 
      ? `${cyan}[${correlationId.slice(0, 8)}]${reset} ` 
      : '';

    console.log(
      `${dim}${time}${reset} ${color}[${level}]${reset} ${corrIdStr}${message}`
    );

    // Print context if present (excluding correlationId/requestId already shown)
    const { correlationId: _, requestId: __, ...restContext } = merged;
    if (Object.keys(restContext).length > 0) {
      console.log(`${dim}         └─ ${JSON.stringify(restContext)}${reset}`);
    }
  }
}

/**
 * Null Logger - for testing
 */
export class NullLogger implements ILogger {
  debug(): void {}
  info(): void {}
  warn(): void {}
  error(): void {}
  child(): ILogger {
    return this;
  }
  getCorrelationId(): string | undefined {
    return undefined;
  }
}