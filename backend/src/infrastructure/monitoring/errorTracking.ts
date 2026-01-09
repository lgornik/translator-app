import { Request, Response, NextFunction } from "express";
import { ILogger } from "../../application/interfaces/ILogger.js";

/**
 * Error Tracking Service (Sentry-compatible)
 *
 * Provides error tracking and reporting functionality.
 * Can be configured to use Sentry or log errors locally.
 */

// ============================================================================
// Types
// ============================================================================

export interface ErrorContext {
  user?: {
    id?: string;
    sessionId?: string;
  };
  tags?: Record<string, string>;
  extra?: Record<string, unknown>;
  fingerprint?: string[];
}

export interface ErrorTrackerConfig {
  dsn?: string;
  environment: string;
  release?: string;
  sampleRate?: number;
  enabled: boolean;
}

export type ErrorSeverity = "fatal" | "error" | "warning" | "info" | "debug";

// ============================================================================
// Error Tracker Implementation
// ============================================================================

class ErrorTracker {
  private config: ErrorTrackerConfig;
  private logger?: ILogger;
  private initialized = false;

  constructor() {
    this.config = {
      environment: process.env.NODE_ENV ?? "development",
      enabled: false,
    };
  }

  /**
   * Initialize error tracker with configuration
   */
  init(config: Partial<ErrorTrackerConfig>, logger?: ILogger): void {
    this.config = {
      ...this.config,
      ...config,
      enabled: config.enabled ?? !!config.dsn,
    };
    this.logger = logger;
    this.initialized = true;

    if (this.config.enabled && this.config.dsn) {
      // In production, you would initialize Sentry SDK here:
      // Sentry.init({
      //   dsn: this.config.dsn,
      //   environment: this.config.environment,
      //   release: this.config.release,
      //   tracesSampleRate: this.config.sampleRate ?? 0.1,
      // });

      this.logger?.info("Error tracking initialized", {
        environment: this.config.environment,
        release: this.config.release,
      });
    } else {
      this.logger?.info("Error tracking disabled (no DSN configured)");
    }
  }

  /**
   * Capture and report an exception
   */
  captureException(error: Error, context?: ErrorContext): string {
    const eventId = this.generateEventId();

    if (!this.config.enabled) {
      this.logError(error, context, eventId);
      return eventId;
    }

    // In production with Sentry:
    // Sentry.withScope((scope) => {
    //   if (context?.user) scope.setUser(context.user);
    //   if (context?.tags) scope.setTags(context.tags);
    //   if (context?.extra) scope.setExtras(context.extra);
    //   if (context?.fingerprint) scope.setFingerprint(context.fingerprint);
    //   Sentry.captureException(error);
    // });

    this.logError(error, context, eventId);
    return eventId;
  }

  /**
   * Capture a message (for non-error events)
   */
  captureMessage(
    message: string,
    severity: ErrorSeverity = "info",
    context?: ErrorContext,
  ): string {
    const eventId = this.generateEventId();

    if (!this.config.enabled) {
      this.logger?.info(`[${severity.toUpperCase()}] ${message}`, {
        eventId,
        ...context?.extra,
      });
      return eventId;
    }

    // In production with Sentry:
    // Sentry.captureMessage(message, severity);

    this.logger?.info(`[${severity.toUpperCase()}] ${message}`, {
      eventId,
      ...context?.extra,
    });
    return eventId;
  }

  /**
   * Set user context for all subsequent events
   */
  setUser(user: { id?: string; sessionId?: string; ip?: string }): void {
    // In production with Sentry:
    // Sentry.setUser(user);

    this.logger?.debug("User context set", { user });
  }

  /**
   * Clear user context
   */
  clearUser(): void {
    // In production with Sentry:
    // Sentry.setUser(null);
  }

  /**
   * Add breadcrumb for debugging
   */
  addBreadcrumb(breadcrumb: {
    category: string;
    message: string;
    level?: ErrorSeverity;
    data?: Record<string, unknown>;
  }): void {
    // In production with Sentry:
    // Sentry.addBreadcrumb(breadcrumb);

    this.logger?.debug(
      `Breadcrumb: [${breadcrumb.category}] ${breadcrumb.message}`,
      {
        data: breadcrumb.data,
      },
    );
  }

  /**
   * Start a transaction for performance monitoring
   */
  startTransaction(name: string, op: string): Transaction {
    const startTime = Date.now();

    return {
      name,
      op,
      startTime,
      finish: () => {
        const duration = Date.now() - startTime;
        this.logger?.debug(`Transaction finished: ${name}`, {
          op,
          duration,
        });
      },
      setStatus: (status: string) => {
        this.logger?.debug(`Transaction status: ${name} -> ${status}`);
      },
    };
  }

  /**
   * Flush pending events (for graceful shutdown)
   */
  async flush(_timeout: number = 2000): Promise<boolean> {
    // In production with Sentry:
    // return Sentry.flush(_timeout);

    return true;
  }

  /**
   * Close the error tracker
   */
  async close(_timeout: number = 2000): Promise<boolean> {
    // In production with Sentry:
    // return Sentry.close(_timeout);

    this.initialized = false;
    return true;
  }

  // --------------------------------------------------------------------------
  // Private Methods
  // --------------------------------------------------------------------------

  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  private logError(
    error: Error,
    context?: ErrorContext,
    eventId?: string,
  ): void {
    this.logger?.error("Exception captured", error, {
      eventId,
      ...context?.tags,
      ...context?.extra,
      userId: context?.user?.id,
      sessionId: context?.user?.sessionId,
    });
  }
}

interface Transaction {
  name: string;
  op: string;
  startTime: number;
  finish: () => void;
  setStatus: (status: string) => void;
}

// ============================================================================
// Global Instance
// ============================================================================

export const errorTracker = new ErrorTracker();

// ============================================================================
// Express Middleware
// ============================================================================

/**
 * Request handler middleware - adds request context to errors
 */
export function errorTrackerRequestHandler() {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Add request context as breadcrumb
    errorTracker.addBreadcrumb({
      category: "http",
      message: `${req.method} ${req.path}`,
      data: {
        method: req.method,
        url: req.url,
        query: req.query,
      },
    });

    // Set user context from session if available
    const sessionId = req.headers["x-session-id"] as string | undefined;
    if (sessionId) {
      errorTracker.setUser({ sessionId });
    }

    next();
  };
}

/**
 * Error handler middleware - captures unhandled errors
 */
export function errorTrackerErrorHandler() {
  return (
    err: Error,
    req: Request,
    res: Response,
    next: NextFunction,
  ): void => {
    const eventId = errorTracker.captureException(err, {
      tags: {
        method: req.method,
        path: req.path,
      },
      extra: {
        query: req.query,
        body: req.body,
        headers: {
          "user-agent": req.headers["user-agent"],
          "content-type": req.headers["content-type"],
        },
      },
      user: {
        sessionId: req.headers["x-session-id"] as string | undefined,
      },
    });

    // Add event ID to response for debugging
    res.setHeader("X-Error-Id", eventId);

    next(err);
  };
}

// ============================================================================
// GraphQL Error Handler
// ============================================================================

/**
 * Format GraphQL errors and report to error tracker
 */
export function captureGraphQLError(
  error: Error,
  operationName?: string,
  variables?: Record<string, unknown>,
): void {
  errorTracker.captureException(error, {
    tags: {
      graphql: "true",
      operation: operationName ?? "unknown",
    },
    extra: {
      variables,
    },
  });
}

// ============================================================================
// Initialization Helper
// ============================================================================

/**
 * Initialize error tracking from environment variables
 */
export function initErrorTracking(logger?: ILogger): void {
  errorTracker.init(
    {
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV ?? "development",
      release: process.env.APP_VERSION,
      sampleRate: parseFloat(process.env.SENTRY_SAMPLE_RATE ?? "0.1"),
      enabled: process.env.SENTRY_ENABLED === "true",
    },
    logger,
  );
}
