import { ILogger, LogContext, LogLevel } from '../../application/interfaces/ILogger.js';

/**
 * Console Logger Implementation
 * Structured JSON logging for production
 * In production, replace with Pino or Winston
 */
export class ConsoleLogger implements ILogger {
  private readonly baseContext: LogContext;
  private readonly level: LogLevel;

  constructor(
    level: LogLevel = LogLevel.INFO,
    baseContext: LogContext = {}
  ) {
    this.level = level;
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
      this.log(LogLevel.ERROR, message, {
        ...context,
        ...(error && {
          error: {
            name: error.name,
            message: error.message,
            stack: error.stack,
          },
        }),
      });
    }
  }

  child(context: LogContext): ILogger {
    return new ConsoleLogger(this.level, {
      ...this.baseContext,
      ...context,
    });
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];
    return levels.indexOf(level) >= levels.indexOf(this.level);
  }

  private log(level: LogLevel, message: string, context?: LogContext): void {
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...this.baseContext,
      ...context,
    };

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
 * Pretty-printed output for development
 */
export class DevLogger implements ILogger {
  private readonly baseContext: LogContext;

  constructor(baseContext: LogContext = {}) {
    this.baseContext = baseContext;
  }

  debug(message: string, context?: LogContext): void {
    console.debug(
      `[DEBUG] ${message}`,
      this.formatContext(context)
    );
  }

  info(message: string, context?: LogContext): void {
    console.info(
      `[INFO]  ${message}`,
      this.formatContext(context)
    );
  }

  warn(message: string, context?: LogContext): void {
    console.warn(
      `[WARN]  ${message}`,
      this.formatContext(context)
    );
  }

  error(message: string, error?: Error, context?: LogContext): void {
    console.error(
      `[ERROR] ${message}`,
      this.formatContext(context)
    );
    if (error) {
      console.error(error);
    }
  }

  child(context: LogContext): ILogger {
    return new DevLogger({ ...this.baseContext, ...context });
  }

  private formatContext(context?: LogContext): string {
    const merged = { ...this.baseContext, ...context };
    if (Object.keys(merged).length === 0) {
      return '';
    }
    return JSON.stringify(merged, null, 2);
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
}