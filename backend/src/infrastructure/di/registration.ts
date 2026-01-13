/**
 * Dependency Registration Module
 * Registers all dependencies in the DI container
 *
 * PRINCIPAL-LEVEL: Use Cases are wrapped with cross-cutting concerns:
 * - Logging (via decorator, not injected)
 * - Metrics collection
 * - Retry with exponential backoff
 * - Circuit breaker for cascade protection
 * - Domain Events publishing
 */

import { container, DI_TOKENS } from "./container.js";
import { DependencyContainer } from "tsyringe";
import { config } from "../config/Config.js";
import { LogLevel, ILogger } from "../../application/interfaces/ILogger.js";
import { ConsoleLogger, DevLogger } from "../logging/Logger.js";
import { TranslationChecker } from "../../domain/services/TranslationChecker.js";
import { RandomWordPicker } from "../../domain/services/RandomWordPicker.js";
import {
  ISessionMutex,
  InMemorySessionMutex,
  RedisSessionMutex,
} from "../persistence/SessionMutex.js";

// Use Cases
import { GetRandomWordUseCase } from "../../application/use-cases/GetRandomWordUseCase.js";
import { GetRandomWordsUseCase } from "../../application/use-cases/GetRandomWordsUseCase.js";
import { CheckTranslationUseCase } from "../../application/use-cases/CheckTranslationUseCase.js";
import { GetCategoriesUseCase } from "../../application/use-cases/GetCategoriesUseCase.js";
import { GetDifficultiesUseCase } from "../../application/use-cases/GetDifficultiesUseCase.js";
import { GetAllWordsUseCase } from "../../application/use-cases/GetAllWordsUseCase.js";
import { GetWordCountUseCase } from "../../application/use-cases/GetWordCountUseCase.js";
import { ResetSessionUseCase } from "../../application/use-cases/ResetSessionUseCase.js";

// Repository factories
import {
  createRepositories,
  RepositoryOptions,
} from "../persistence/repositoryFactory.js";

// Principal-level: Decorators for cross-cutting concerns
import {
  withLogging,
  withMetrics,
  withRetry,
  withCircuitBreaker,
  compose,
  MetricsCollector,
} from "../../application/decorators/UseCaseDecorators.js";

// Principal-level: Domain Events
import {
  InMemoryEventBus,
  AnalyticsEventHandler,
  AuditLogEventHandler,
} from "../events/EventBus.js";

/**
 * Registration options
 */
export interface RegistrationOptions {
  /** Database URL (optional - uses InMemory if not provided) */
  databaseUrl?: string;
  /** Redis URL for session mutex (optional) */
  redisUrl?: string;
  /** Enable caching */
  enableCache?: boolean;
  /** Cache configuration */
  cacheConfig?: {
    ttlMs: number;
    maxSize: number;
    enableStats: boolean;
  };
  /** Enable resilience patterns (retry, circuit breaker) */
  enableResilience?: boolean;
}

/**
 * Registration result with cleanup functions
 */
export interface RegistrationResult {
  cleanup: () => Promise<void>;
  warmUp: () => Promise<void>;
  invalidateCaches: () => void;
  getCacheStats:
    | (() => {
        hits: number;
        misses: number;
        evictions: number;
        size: number;
        hitRate: string;
      })
    | undefined;
  checkDatabase: () => Promise<{
    ok: boolean;
    latency?: number;
    error?: string;
  }>;
  getSessionCount: () => Promise<number>;
  /** NEW: Get metrics from all decorated use cases */
  getMetrics: () => Record<string, unknown>;
  /** NEW: Get recent domain events (for debugging/monitoring) */
  getEventLog: () => unknown[];
}

/**
 * In-memory metrics collector
 * In production, replace with Prometheus/StatsD/etc.
 */
function createMetricsCollector(
  _logger: ILogger,
): MetricsCollector & { getMetrics: () => Record<string, unknown> } {
  const metrics: Record<
    string,
    { count: number; totalMs: number; labels: Record<string, number> }
  > = {};

  return {
    recordDuration(
      name: string,
      durationMs: number,
      labels?: Record<string, string>,
    ): void {
      if (!metrics[name]) {
        metrics[name] = { count: 0, totalMs: 0, labels: {} };
      }
      metrics[name].count++;
      metrics[name].totalMs += durationMs;

      if (labels) {
        const labelKey = Object.entries(labels)
          .map(([k, v]) => `${k}=${v}`)
          .join(",");
        metrics[name].labels[labelKey] =
          (metrics[name].labels[labelKey] || 0) + 1;
      }
    },

    incrementCounter(name: string, labels?: Record<string, string>): void {
      const fullName = labels
        ? `${name}{${Object.entries(labels)
            .map(([k, v]) => `${k}="${v}"`)
            .join(",")}}`
        : name;

      if (!metrics[fullName]) {
        metrics[fullName] = { count: 0, totalMs: 0, labels: {} };
      }
      metrics[fullName].count++;
    },

    getMetrics(): Record<string, unknown> {
      const result: Record<string, unknown> = {};
      for (const [name, data] of Object.entries(metrics)) {
        result[name] = {
          count: data.count,
          avgMs: data.count > 0 ? Math.round(data.totalMs / data.count) : 0,
          totalMs: data.totalMs,
          labels: data.labels,
        };
      }
      return result;
    },
  };
}

/**
 * Register all dependencies in the container
 */
export async function registerDependencies(
  options: RegistrationOptions = {},
): Promise<RegistrationResult> {
  const enableResilience = options.enableResilience ?? true;

  // 1. Register Config
  container.registerInstance(DI_TOKENS.Config, config);

  // 2. Register Logger
  const logger = config.isDevelopment
    ? new DevLogger()
    : new ConsoleLogger({
        service: "translator-api",
        version: config.api.version,
        environment: config.nodeEnv,
        level: config.logging.level as LogLevel,
      });

  container.registerInstance(DI_TOKENS.Logger, logger);

  // 3. Register Domain Services
  container.registerSingleton(DI_TOKENS.TranslationChecker, TranslationChecker);
  container.registerSingleton(DI_TOKENS.RandomWordPicker, RandomWordPicker);

  // 4. Register Session Mutex
  if (options.redisUrl) {
    const redisMutex = new RedisSessionMutex(options.redisUrl, logger);
    await redisMutex.connect();
    container.registerInstance(DI_TOKENS.SessionMutex, redisMutex);
  } else {
    container.registerInstance(
      DI_TOKENS.SessionMutex,
      new InMemorySessionMutex(),
    );
  }

  // 5. Create and register repositories
  const repoOptions: RepositoryOptions = {
    logger,
    enableCache: options.enableCache ?? true,
    cacheConfig: options.cacheConfig ?? {
      ttlMs: config.isDevelopment ? 60 * 1000 : 5 * 60 * 1000,
      maxSize: 10000,
      enableStats: true,
    },
  };

  const {
    wordRepository,
    sessionRepository,
    cleanup,
    warmUp,
    invalidateCaches,
    getCacheStats,
    checkDatabase,
    getSessionCount,
  } = createRepositories(options.databaseUrl, repoOptions);

  container.registerInstance(DI_TOKENS.WordRepository, wordRepository);
  container.registerInstance(DI_TOKENS.SessionRepository, sessionRepository);

  // ============================================================================
  // PRINCIPAL-LEVEL: Initialize cross-cutting infrastructure
  // ============================================================================

  // Metrics collector (in production: replace with Prometheus client)
  const metrics = createMetricsCollector(logger);

  // Event Bus for domain events
  const eventBus = new InMemoryEventBus(logger);

  // Register event handlers
  eventBus.subscribe(new AnalyticsEventHandler(logger));
  eventBus.subscribe(new AuditLogEventHandler(logger));

  container.registerInstance(DI_TOKENS.EventBus, eventBus);

  logger.info("Principal-level infrastructure initialized", {
    resilience: enableResilience,
    eventHandlers: ["AnalyticsEventHandler", "AuditLogEventHandler"],
  });

  // ============================================================================
  // PRINCIPAL-LEVEL: Register Use Cases with Decorators
  // ============================================================================

  // GetRandomWordUseCase - most critical, full decoration stack
  container.register(DI_TOKENS.GetRandomWordUseCase, {
    useFactory: (c: DependencyContainer) => {
      const baseUseCase = new GetRandomWordUseCase(
        c.resolve(DI_TOKENS.WordRepository),
        c.resolve(DI_TOKENS.SessionRepository),
        c.resolve(DI_TOKENS.RandomWordPicker),
        logger, // Still needed by UseCase internally
        c.resolve(DI_TOKENS.SessionMutex),
      );

      if (!enableResilience) {
        return baseUseCase;
      }

      // Apply decorators (order matters: innermost executes first)
      return compose(
        baseUseCase,
        // 1. Retry transient failures (innermost - retries the actual operation)
        (uc) =>
          withRetry(
            uc,
            {
              maxAttempts: 3,
              delayMs: 100,
              backoffMultiplier: 2,
              retryableErrors: ["INFRASTRUCTURE_ERROR"],
            },
            logger,
          ),
        // 2. Circuit breaker (protects against cascade failures)
        (uc) =>
          withCircuitBreaker(
            uc,
            {
              failureThreshold: 5,
              recoveryTimeMs: 30000,
              halfOpenRequests: 3,
            },
            logger,
          ),
        // 3. Metrics (records duration and success/failure)
        (uc) => withMetrics(uc, metrics, "GetRandomWord"),
        // 4. Logging (outermost - logs everything including decorator effects)
        (uc) => withLogging(uc, logger, "GetRandomWord"),
      );
    },
  });

  // GetRandomWordsUseCase - batch operation, same decoration
  container.register(DI_TOKENS.GetRandomWordsUseCase, {
    useFactory: (c: DependencyContainer) => {
      const baseUseCase = new GetRandomWordsUseCase(
        c.resolve(DI_TOKENS.WordRepository),
        c.resolve(DI_TOKENS.SessionRepository),
        c.resolve(DI_TOKENS.RandomWordPicker),
        logger,
        c.resolve(DI_TOKENS.SessionMutex),
      );

      if (!enableResilience) {
        return baseUseCase;
      }

      return compose(
        baseUseCase,
        (uc) => withRetry(uc, { maxAttempts: 3 }, logger),
        (uc) => withCircuitBreaker(uc, { failureThreshold: 5 }, logger),
        (uc) => withMetrics(uc, metrics, "GetRandomWords"),
        (uc) => withLogging(uc, logger, "GetRandomWords"),
      );
    },
  });

  // CheckTranslationUseCase - user-facing, needs logging + metrics
  container.register(DI_TOKENS.CheckTranslationUseCase, {
    useFactory: (c: DependencyContainer) => {
      const baseUseCase = new CheckTranslationUseCase(
        c.resolve(DI_TOKENS.WordRepository),
        c.resolve(DI_TOKENS.TranslationChecker),
        logger,
      );

      if (!enableResilience) {
        return baseUseCase;
      }

      return compose(
        baseUseCase,
        (uc) => withMetrics(uc, metrics, "CheckTranslation"),
        (uc) => withLogging(uc, logger, "CheckTranslation"),
      );
    },
  });

  // ResetSessionUseCase - mutating operation, logging important
  container.register(DI_TOKENS.ResetSessionUseCase, {
    useFactory: (c: DependencyContainer) => {
      const baseUseCase = new ResetSessionUseCase(
        c.resolve(DI_TOKENS.SessionRepository),
        logger,
      );

      if (!enableResilience) {
        return baseUseCase;
      }

      return compose(
        baseUseCase,
        (uc) => withMetrics(uc, metrics, "ResetSession"),
        (uc) => withLogging(uc, logger, "ResetSession"),
      );
    },
  });

  // Simple query use cases - metrics + logging only (no retry/circuit breaker needed)
  container.register(DI_TOKENS.GetCategoriesUseCase, {
    useFactory: (c: DependencyContainer) => {
      const baseUseCase = new GetCategoriesUseCase(
        c.resolve(DI_TOKENS.WordRepository),
      );

      if (!enableResilience) {
        return baseUseCase;
      }

      return compose(
        baseUseCase,
        (uc) => withMetrics(uc, metrics, "GetCategories"),
        (uc) => withLogging(uc, logger, "GetCategories"),
      );
    },
  });

  container.register(DI_TOKENS.GetDifficultiesUseCase, {
    useFactory: (c: DependencyContainer) => {
      const baseUseCase = new GetDifficultiesUseCase(
        c.resolve(DI_TOKENS.WordRepository),
      );

      if (!enableResilience) {
        return baseUseCase;
      }

      return compose(
        baseUseCase,
        (uc) => withMetrics(uc, metrics, "GetDifficulties"),
        (uc) => withLogging(uc, logger, "GetDifficulties"),
      );
    },
  });

  container.register(DI_TOKENS.GetAllWordsUseCase, {
    useFactory: (c: DependencyContainer) => {
      const baseUseCase = new GetAllWordsUseCase(
        c.resolve(DI_TOKENS.WordRepository),
      );

      if (!enableResilience) {
        return baseUseCase;
      }

      return compose(
        baseUseCase,
        (uc) => withMetrics(uc, metrics, "GetAllWords"),
        (uc) => withLogging(uc, logger, "GetAllWords"),
      );
    },
  });

  container.register(DI_TOKENS.GetWordCountUseCase, {
    useFactory: (c: DependencyContainer) => {
      const baseUseCase = new GetWordCountUseCase(
        c.resolve(DI_TOKENS.WordRepository),
      );

      if (!enableResilience) {
        return baseUseCase;
      }

      return compose(
        baseUseCase,
        (uc) => withMetrics(uc, metrics, "GetWordCount"),
        (uc) => withLogging(uc, logger, "GetWordCount"),
      );
    },
  });

  // Return cleanup and utility functions
  return {
    cleanup: async () => {
      const mutex = container.resolve<ISessionMutex>(DI_TOKENS.SessionMutex);
      if (mutex instanceof RedisSessionMutex) {
        await mutex.disconnect();
      }
      if (cleanup) await cleanup();
    },
    warmUp: warmUp ?? (async () => {}),
    invalidateCaches: invalidateCaches ?? (() => {}),
    getCacheStats,
    checkDatabase,
    getSessionCount,
    // NEW: Principal-level observability
    getMetrics: () => metrics.getMetrics(),
    getEventLog: () => eventBus.getRecentEvents(100),
  };
}

/**
 * Resolve a dependency from the container
 */
export function resolve<T>(token: symbol): T {
  return container.resolve<T>(token);
}
