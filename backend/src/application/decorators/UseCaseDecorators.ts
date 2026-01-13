/**
 * Use Case Decorators
 *
 * PRINCIPAL PATTERN: Cross-cutting concerns don't belong in business logic.
 *
 * Instead of:
 *   class MyUseCase {
 *     constructor(private logger: ILogger) {}
 *     execute() {
 *       this.logger.info('Starting...');
 *       // business logic
 *       this.logger.info('Done');
 *     }
 *   }
 *
 * We do:
 *   const useCase = withLogging(
 *     withMetrics(
 *       withRetry(
 *         new MyUseCase()
 *       )
 *     )
 *   );
 *
 * Benefits:
 * - Single Responsibility: Use Case only does business logic
 * - Open/Closed: Add new concerns without changing Use Cases
 * - Testable: Test business logic without mocking logger
 */

import { Result } from "../../shared/core/Result.js";
import {
  DomainError,
  InfrastructureError,
} from "../../shared/errors/DomainErrors.js";
import { ILogger } from "../../application/interfaces/ILogger.js";

/**
 * Generic Use Case interface
 */
export interface IUseCase<TInput, TOutput, TError = DomainError> {
  execute(input: TInput): Promise<Result<TOutput, TError>>;
}

// ============================================================================
// Logging Decorator
// ============================================================================

/**
 * Wraps a use case with logging
 */
export function withLogging<TInput, TOutput, TError extends DomainError>(
  useCase: IUseCase<TInput, TOutput, TError>,
  logger: ILogger,
  useCaseName?: string,
): IUseCase<TInput, TOutput, TError> {
  const name = useCaseName ?? useCase.constructor.name;

  return {
    async execute(input: TInput): Promise<Result<TOutput, TError>> {
      const startTime = Date.now();
      const correlationId = generateCorrelationId();

      logger.debug(`[${name}] Starting`, {
        correlationId,
        input: sanitizeInput(input),
      });

      try {
        const result = await useCase.execute(input);
        const duration = Date.now() - startTime;

        if (result.ok) {
          logger.info(`[${name}] Completed successfully`, {
            correlationId,
            duration,
          });
        } else {
          logger.warn(`[${name}] Completed with domain error`, {
            correlationId,
            duration,
            errorCode: result.error.code,
            errorMessage: result.error.message,
          });
        }

        return result;
      } catch (error) {
        const duration = Date.now() - startTime;
        const err = error instanceof Error ? error : new Error(String(error));
        logger.error(`[${name}] Unexpected error`, err, {
          correlationId,
          duration,
        });
        throw error;
      }
    },
  };
}

// ============================================================================
// Metrics Decorator
// ============================================================================

export interface MetricsCollector {
  recordDuration(
    name: string,
    durationMs: number,
    labels?: Record<string, string>,
  ): void;
  incrementCounter(name: string, labels?: Record<string, string>): void;
}

/**
 * Wraps a use case with metrics collection
 */
export function withMetrics<TInput, TOutput, TError extends DomainError>(
  useCase: IUseCase<TInput, TOutput, TError>,
  metrics: MetricsCollector,
  useCaseName?: string,
): IUseCase<TInput, TOutput, TError> {
  const name = useCaseName ?? useCase.constructor.name;

  return {
    async execute(input: TInput): Promise<Result<TOutput, TError>> {
      const startTime = Date.now();

      try {
        const result = await useCase.execute(input);
        const duration = Date.now() - startTime;

        // Record timing
        metrics.recordDuration(`usecase_duration_ms`, duration, {
          usecase: name,
        });

        // Record result
        metrics.incrementCounter(`usecase_total`, {
          usecase: name,
          status: result.ok ? "success" : "domain_error",
        });

        return result;
      } catch (error) {
        const duration = Date.now() - startTime;

        metrics.recordDuration(`usecase_duration_ms`, duration, {
          usecase: name,
        });
        metrics.incrementCounter(`usecase_total`, {
          usecase: name,
          status: "exception",
        });

        throw error;
      }
    },
  };
}

// ============================================================================
// Retry Decorator
// ============================================================================

export interface RetryConfig {
  maxAttempts: number;
  delayMs: number;
  backoffMultiplier: number;
  retryableErrors: string[]; // Error codes that should trigger retry
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  delayMs: 100,
  backoffMultiplier: 2,
  retryableErrors: ["INFRASTRUCTURE_ERROR"], // Only retry infra errors by default
};

/**
 * Wraps a use case with retry logic
 * Only retries on infrastructure errors (not domain errors)
 */
export function withRetry<TInput, TOutput, TError extends DomainError>(
  useCase: IUseCase<TInput, TOutput, TError>,
  config: Partial<RetryConfig> = {},
  logger?: ILogger,
): IUseCase<TInput, TOutput, TError> {
  const cfg = { ...DEFAULT_RETRY_CONFIG, ...config };

  return {
    async execute(input: TInput): Promise<Result<TOutput, TError>> {
      let lastError: Error | undefined;
      let delay = cfg.delayMs;

      for (let attempt = 1; attempt <= cfg.maxAttempts; attempt++) {
        try {
          const result = await useCase.execute(input);

          // Domain errors are not retried - they represent business failures
          if (!result.ok && cfg.retryableErrors.includes(result.error.code)) {
            if (attempt < cfg.maxAttempts) {
              logger?.warn(`Retrying due to ${result.error.code}`, {
                attempt,
                maxAttempts: cfg.maxAttempts,
                nextDelayMs: delay,
              });
              await sleep(delay);
              delay *= cfg.backoffMultiplier;
              continue;
            }
          }

          return result;
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error));

          if (attempt < cfg.maxAttempts) {
            logger?.warn(`Retrying due to exception`, {
              attempt,
              maxAttempts: cfg.maxAttempts,
              error: lastError.message,
              nextDelayMs: delay,
            });
            await sleep(delay);
            delay *= cfg.backoffMultiplier;
          }
        }
      }

      // All retries exhausted
      throw lastError ?? new Error("All retry attempts failed");
    },
  };
}

// ============================================================================
// Circuit Breaker Decorator
// ============================================================================

export interface CircuitBreakerConfig {
  failureThreshold: number; // Number of failures before opening
  recoveryTimeMs: number; // Time to wait before trying again
  halfOpenRequests: number; // Requests to allow in half-open state
}

type CircuitState = "closed" | "open" | "half-open";

const DEFAULT_CIRCUIT_CONFIG: CircuitBreakerConfig = {
  failureThreshold: 5,
  recoveryTimeMs: 30000,
  halfOpenRequests: 3,
};

/**
 * Wraps a use case with circuit breaker pattern
 * Prevents cascading failures when downstream services are down
 */
export function withCircuitBreaker<TInput, TOutput, TError extends DomainError>(
  useCase: IUseCase<TInput, TOutput, TError>,
  config: Partial<CircuitBreakerConfig> = {},
  logger?: ILogger,
): IUseCase<TInput, TOutput, TError> {
  const cfg = { ...DEFAULT_CIRCUIT_CONFIG, ...config };

  let state: CircuitState = "closed";
  let failures = 0;
  let lastFailureTime = 0;
  let halfOpenAttempts = 0;

  return {
    async execute(input: TInput): Promise<Result<TOutput, TError>> {
      // Check if circuit should transition from open to half-open
      if (state === "open") {
        const timeSinceFailure = Date.now() - lastFailureTime;
        if (timeSinceFailure >= cfg.recoveryTimeMs) {
          state = "half-open";
          halfOpenAttempts = 0;
          logger?.info("Circuit breaker transitioning to half-open");
        } else {
          // Circuit is open - fail fast
          return Result.fail(
            new InfrastructureError(
              "Service unavailable (circuit open)",
            ) as TError,
          );
        }
      }

      // Half-open: limit requests
      if (state === "half-open" && halfOpenAttempts >= cfg.halfOpenRequests) {
        return Result.fail(
          new InfrastructureError(
            "Service unavailable (circuit half-open, limit reached)",
          ) as TError,
        );
      }

      try {
        if (state === "half-open") {
          halfOpenAttempts++;
        }

        const result = await useCase.execute(input);

        // Success - reset failure count
        if (result.ok || !isInfrastructureFailure(result.error)) {
          if (state === "half-open") {
            state = "closed";
            logger?.info("Circuit breaker closed (service recovered)");
          }
          failures = 0;
          return result;
        }

        // Infrastructure failure
        recordFailure();
        return result;
      } catch (error) {
        recordFailure();
        throw error;
      }
    },
  };

  function recordFailure(): void {
    failures++;
    lastFailureTime = Date.now();

    if (failures >= cfg.failureThreshold && state !== "open") {
      state = "open";
      logger?.error("Circuit breaker opened", undefined, {
        failures,
        threshold: cfg.failureThreshold,
      });
    }
  }

  function isInfrastructureFailure(error: DomainError): boolean {
    return error.code === "INFRASTRUCTURE_ERROR";
  }
}

// ============================================================================
// Composition Helper
// ============================================================================

/**
 * Compose multiple decorators in a readable way
 *
 * Usage:
 *   const decoratedUseCase = compose(
 *     new MyUseCase(deps),
 *     (uc) => withLogging(uc, logger),
 *     (uc) => withMetrics(uc, metrics),
 *     (uc) => withRetry(uc, { maxAttempts: 3 }),
 *   );
 */
export function compose<TInput, TOutput, TError extends DomainError>(
  useCase: IUseCase<TInput, TOutput, TError>,
  ...decorators: Array<
    (uc: IUseCase<TInput, TOutput, TError>) => IUseCase<TInput, TOutput, TError>
  >
): IUseCase<TInput, TOutput, TError> {
  return decorators.reduce(
    (decorated, decorator) => decorator(decorated),
    useCase,
  );
}

// ============================================================================
// Helpers
// ============================================================================

function generateCorrelationId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function sanitizeInput(input: unknown): unknown {
  if (typeof input !== "object" || input === null) {
    return input;
  }

  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    // Don't log sensitive fields
    if (
      ["password", "token", "secret", "key"].some((s) =>
        key.toLowerCase().includes(s),
      )
    ) {
      sanitized[key] = "[REDACTED]";
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
