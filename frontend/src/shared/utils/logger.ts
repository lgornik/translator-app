type LogLevel = 'debug' | 'info' | 'warn' | 'error';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LogContext = Record<string, any>;

interface Logger {
  debug: (message: string, context?: LogContext) => void;
  info: (message: string, context?: LogContext) => void;
  warn: (message: string, context?: LogContext) => void;
  error: (message: string, context?: LogContext) => void;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

/**
 * Simple logger with level filtering and structured context
 * 
 * In production, this could be replaced with a more sophisticated
 * solution like Sentry, DataDog, or custom telemetry.
 * 
 * @example
 * logger.debug('[useQuiz] Word loaded', { wordId: '123' });
 * logger.error('[API] Request failed', { error, endpoint });
 */
function createLogger(): Logger {
  // Could be set via environment variable
  const minLevel: LogLevel = 
    (import.meta.env.VITE_LOG_LEVEL as LogLevel) ?? 
    (import.meta.env.PROD ? 'warn' : 'debug');

  const shouldLog = (level: LogLevel): boolean => {
    return LOG_LEVELS[level] >= LOG_LEVELS[minLevel];
  };

  const formatMessage = (level: LogLevel, message: string, context?: LogContext): string => {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` ${JSON.stringify(context)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
  };

  return {
    debug: (message: string, context?: LogContext) => {
      if (shouldLog('debug')) {
        console.debug(formatMessage('debug', message, context));
      }
    },

    info: (message: string, context?: LogContext) => {
      if (shouldLog('info')) {
        console.info(formatMessage('info', message, context));
      }
    },

    warn: (message: string, context?: LogContext) => {
      if (shouldLog('warn')) {
        console.warn(formatMessage('warn', message, context));
      }
    },

    error: (message: string, context?: LogContext) => {
      if (shouldLog('error')) {
        console.error(formatMessage('error', message, context));
      }
    },
  };
}

export const logger = createLogger();