import { InfrastructureError } from "../../shared/errors/DomainErrors.js";

// ============================================================================
// Timeout
// ============================================================================

export class TimeoutError extends Error {
  constructor(public readonly timeoutMs: number) {
    super(`Operation timed out after ${timeoutMs}ms`);
    this.name = "TimeoutError";
  }
}

/**
 * Execute a function with a timeout
 */
export async function withTimeout<T>(
  fn: () => Promise<T>,
  timeoutMs: number,
  _operationName?: string,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new TimeoutError(timeoutMs));
    }, timeoutMs);

    fn()
      .then((result) => {
        clearTimeout(timer);
        resolve(result);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

// ============================================================================
// Retry with Exponential Backoff
// ============================================================================

export interface RetryOptions {
  maxAttempts: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffFactor: number;
  jitter: boolean; // Add randomness to prevent thundering herd
  shouldRetry?: (error: Error, attempt: number) => boolean;
  onRetry?: (error: Error, attempt: number, nextDelayMs: number) => void;
}

const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxAttempts: 3,
  initialDelayMs: 100,
  maxDelayMs: 10000,
  backoffFactor: 2,
  jitter: true,
  shouldRetry: () => true,
};

/**
 * Execute a function with retry and exponential backoff
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: Partial<RetryOptions> = {},
): Promise<T> {
  const opts = { ...DEFAULT_RETRY_OPTIONS, ...options };
  let lastError: Error | undefined;
  let delay = opts.initialDelayMs;

  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt === opts.maxAttempts) {
        break;
      }

      if (opts.shouldRetry && !opts.shouldRetry(lastError, attempt)) {
        break;
      }

      // Calculate next delay with optional jitter
      let nextDelay = Math.min(delay, opts.maxDelayMs);
      if (opts.jitter) {
        nextDelay = nextDelay * (0.5 + Math.random()); // ±50% jitter
      }

      opts.onRetry?.(lastError, attempt, nextDelay);
      await sleep(nextDelay);
      delay *= opts.backoffFactor;
    }
  }

  throw lastError;
}

// ============================================================================
// Fallback
// ============================================================================

/**
 * Execute with fallback on error
 */
export async function withFallback<T>(
  primary: () => Promise<T>,
  fallback: () => Promise<T> | T,
  shouldFallback?: (error: Error) => boolean,
): Promise<T> {
  try {
    return await primary();
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));

    if (shouldFallback && !shouldFallback(err)) {
      throw error;
    }

    return await fallback();
  }
}

/**
 * Execute with cached fallback
 * If primary fails, return cached value (stale-while-revalidate pattern)
 */
export function createCachedFallback<T>(options: {
  maxAge: number;
  staleWhileRevalidate: number;
}): {
  get: (primary: () => Promise<T>) => Promise<T>;
  invalidate: () => void;
} {
  let cache: { value: T; timestamp: number } | null = null;

  return {
    async get(primary: () => Promise<T>): Promise<T> {
      const now = Date.now();

      // If cache is fresh, return it
      if (cache && now - cache.timestamp < options.maxAge) {
        return cache.value;
      }

      try {
        const value = await primary();
        cache = { value, timestamp: now };
        return value;
      } catch (error) {
        // If cache is stale but within stale-while-revalidate window, use it
        if (
          cache &&
          now - cache.timestamp < options.maxAge + options.staleWhileRevalidate
        ) {
          return cache.value;
        }
        throw error;
      }
    },
    invalidate(): void {
      cache = null;
    },
  };
}

// ============================================================================
// Bulkhead (Concurrency Limiting)
// ============================================================================

/**
 * Limits concurrent executions to prevent resource exhaustion
 */
export class Bulkhead {
  private running = 0;
  private queue: Array<{
    fn: () => Promise<unknown>;
    resolve: (value: unknown) => void;
    reject: (error: Error) => void;
  }> = [];

  constructor(
    private readonly maxConcurrent: number,
    private readonly maxQueueSize: number = 100,
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.running < this.maxConcurrent) {
      return this.run(fn);
    }

    if (this.queue.length >= this.maxQueueSize) {
      throw new Error("Bulkhead queue full");
    }

    return new Promise<T>((resolve, reject) => {
      this.queue.push({
        fn: fn as () => Promise<unknown>,
        resolve: resolve as (value: unknown) => void,
        reject,
      });
    });
  }

  private async run<T>(fn: () => Promise<T>): Promise<T> {
    this.running++;
    try {
      return await fn();
    } finally {
      this.running--;
      this.processQueue();
    }
  }

  private processQueue(): void {
    if (this.queue.length > 0 && this.running < this.maxConcurrent) {
      const next = this.queue.shift()!;
      this.run(next.fn).then(next.resolve).catch(next.reject);
    }
  }

  getStats(): { running: number; queued: number; maxConcurrent: number } {
    return {
      running: this.running,
      queued: this.queue.length,
      maxConcurrent: this.maxConcurrent,
    };
  }
}

// ============================================================================
// Circuit Breaker (Standalone)
// ============================================================================

export interface CircuitBreakerOptions {
  failureThreshold: number;
  successThreshold: number; // Successes needed in half-open to close
  timeout: number; // Time in open state before trying half-open
  volumeThreshold: number; // Minimum requests before circuit can open
}

export type CircuitState = "closed" | "open" | "half-open";

export class CircuitBreaker {
  private state: CircuitState = "closed";
  private failures = 0;
  private successes = 0;
  private lastFailureTime = 0;
  private requestCount = 0;

  constructor(
    private readonly options: CircuitBreakerOptions = {
      failureThreshold: 5,
      successThreshold: 2,
      timeout: 30000,
      volumeThreshold: 10,
    },
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (!this.canExecute()) {
      throw new InfrastructureError("Circuit breaker is open");
    }

    this.requestCount++;

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private canExecute(): boolean {
    if (this.state === "closed") {
      return true;
    }

    if (this.state === "open") {
      if (Date.now() - this.lastFailureTime >= this.options.timeout) {
        this.transitionTo("half-open");
        return true;
      }
      return false;
    }

    // half-open: allow limited requests
    return true;
  }

  private onSuccess(): void {
    if (this.state === "half-open") {
      this.successes++;
      if (this.successes >= this.options.successThreshold) {
        this.transitionTo("closed");
      }
    } else {
      this.failures = 0;
    }
  }

  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.state === "half-open") {
      this.transitionTo("open");
    } else if (
      this.state === "closed" &&
      this.requestCount >= this.options.volumeThreshold &&
      this.failures >= this.options.failureThreshold
    ) {
      this.transitionTo("open");
    }
  }

  private transitionTo(newState: CircuitState): void {
    this.state = newState;
    if (newState === "closed") {
      this.failures = 0;
      this.successes = 0;
    } else if (newState === "half-open") {
      this.successes = 0;
    }
  }

  getState(): CircuitState {
    return this.state;
  }

  getStats(): {
    state: CircuitState;
    failures: number;
    requestCount: number;
  } {
    return {
      state: this.state,
      failures: this.failures,
      requestCount: this.requestCount,
    };
  }

  // Manual reset (for testing/admin)
  reset(): void {
    this.transitionTo("closed");
    this.requestCount = 0;
  }
}

// ============================================================================
// Graceful Degradation Helper
// ============================================================================

export interface DegradationLevel {
  name: string;
  check: () => boolean | Promise<boolean>;
  apply: () => void;
  revert: () => void;
}

/**
 * Manages graceful degradation levels
 * Example: Under load, disable expensive features progressively
 */
export class GracefulDegradation {
  private activeLevel = 0;

  constructor(private readonly levels: DegradationLevel[]) {}

  async evaluate(): Promise<void> {
    for (let i = this.levels.length - 1; i >= 0; i--) {
      const level = this.levels[i];
      const shouldActivate = await level.check();

      if (shouldActivate && i > this.activeLevel) {
        // Escalate
        for (let j = this.activeLevel + 1; j <= i; j++) {
          this.levels[j].apply();
        }
        this.activeLevel = i;
        return;
      }
    }

    // Check if we can de-escalate
    if (this.activeLevel > 0) {
      const shouldDeactivate = !(await this.levels[this.activeLevel].check());
      if (shouldDeactivate) {
        this.levels[this.activeLevel].revert();
        this.activeLevel--;
      }
    }
  }

  getCurrentLevel(): string {
    return this.activeLevel === 0
      ? "normal"
      : this.levels[this.activeLevel].name;
  }
}

// ============================================================================
// Health Check Aggregator
// ============================================================================

export interface HealthCheckResult {
  name: string;
  healthy: boolean;
  latencyMs: number;
  message?: string;
}

export type HealthCheck = () => Promise<HealthCheckResult>;

/**
 * Aggregates multiple health checks with timeout
 */
export async function aggregateHealthChecks(
  checks: HealthCheck[],
  timeoutMs: number = 5000,
): Promise<{
  healthy: boolean;
  results: HealthCheckResult[];
}> {
  const results = await Promise.all(
    checks.map(async (check) => {
      try {
        return await withTimeout(check, timeoutMs, "health-check");
      } catch (error) {
        return {
          name: "unknown",
          healthy: false,
          latencyMs: timeoutMs,
          message: error instanceof Error ? error.message : "Unknown error",
        };
      }
    }),
  );

  return {
    healthy: results.every((r) => r.healthy),
    results,
  };
}

// ============================================================================
// Helpers
// ============================================================================

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
