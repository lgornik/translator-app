import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  withLogging,
  withMetrics,
  withRetry,
  withCircuitBreaker,
  compose,
  IUseCase,
  MetricsCollector,
} from "../../application/decorators/UseCaseDecorators.js";
import { Result } from "../../shared/core/Result.js";
import {
  DomainError,
  InfrastructureError,
  ValidationError,
} from "../../shared/errors/DomainErrors.js";
import { ILogger } from "../../application/interfaces/ILogger.js";

// ============================================================================
// Test Helpers
// ============================================================================

function createMockLogger(): ILogger {
  const mockLogger: ILogger = {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    child: vi.fn(() => mockLogger),
    getCorrelationId: vi.fn(() => undefined),
  };
  return mockLogger;
}

function createMockMetrics(): MetricsCollector & {
  getDurations: () => Array<{
    name: string;
    duration: number;
    labels?: Record<string, string>;
  }>;
  getCounters: () => Array<{ name: string; labels?: Record<string, string> }>;
} {
  const durations: Array<{
    name: string;
    duration: number;
    labels?: Record<string, string>;
  }> = [];
  const counters: Array<{ name: string; labels?: Record<string, string> }> = [];

  return {
    recordDuration(
      name: string,
      durationMs: number,
      labels?: Record<string, string>,
    ): void {
      durations.push({ name, duration: durationMs, labels });
    },
    incrementCounter(name: string, labels?: Record<string, string>): void {
      counters.push({ name, labels });
    },
    getDurations: () => durations,
    getCounters: () => counters,
  };
}

interface TestInput {
  value: string;
  password?: string;
}

interface TestOutput {
  result: string;
}

function createSuccessUseCase(
  delay = 0,
): IUseCase<TestInput, TestOutput, DomainError> {
  return {
    async execute(input: TestInput): Promise<Result<TestOutput, DomainError>> {
      if (delay > 0) {
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
      return Result.ok({ result: `processed: ${input.value}` });
    },
  };
}

function createFailingUseCase(
  error: DomainError,
): IUseCase<TestInput, TestOutput, DomainError> {
  return {
    async execute(_input: TestInput): Promise<Result<TestOutput, DomainError>> {
      return Result.fail(error);
    },
  };
}

function createThrowingUseCase(
  error: Error,
): IUseCase<TestInput, TestOutput, DomainError> {
  return {
    async execute(_input: TestInput): Promise<Result<TestOutput, DomainError>> {
      throw error;
    },
  };
}

function createFlakeyUseCase(
  failCount: number,
  error: DomainError,
): IUseCase<TestInput, TestOutput, DomainError> {
  let callCount = 0;
  return {
    async execute(input: TestInput): Promise<Result<TestOutput, DomainError>> {
      callCount++;
      if (callCount <= failCount) {
        return Result.fail(error);
      }
      return Result.ok({ result: `processed: ${input.value}` });
    },
  };
}

// ============================================================================
// withLogging Tests
// ============================================================================

describe("withLogging decorator", () => {
  let logger: ILogger;

  beforeEach(() => {
    logger = createMockLogger();
  });

  it("should log successful execution", async () => {
    const baseUseCase = createSuccessUseCase();
    const decorated = withLogging(baseUseCase, logger, "TestUseCase");

    const result = await decorated.execute({ value: "test" });

    expect(result.ok).toBe(true);
    expect(logger.debug).toHaveBeenCalledWith(
      expect.stringContaining("[TestUseCase] Starting"),
      expect.objectContaining({ input: { value: "test" } }),
    );
    expect(logger.info).toHaveBeenCalledWith(
      expect.stringContaining("[TestUseCase] Completed successfully"),
      expect.objectContaining({ duration: expect.any(Number) }),
    );
  });

  it("should log domain errors as warnings", async () => {
    const error = new ValidationError("Invalid input", "value");
    const baseUseCase = createFailingUseCase(error);
    const decorated = withLogging(baseUseCase, logger, "TestUseCase");

    const result = await decorated.execute({ value: "test" });

    expect(result.ok).toBe(false);
    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining("[TestUseCase] Completed with domain error"),
      expect.objectContaining({
        errorCode: "VALIDATION_ERROR",
        errorMessage: "Invalid input",
      }),
    );
  });

  it("should log unexpected errors and rethrow", async () => {
    const error = new Error("Unexpected failure");
    const baseUseCase = createThrowingUseCase(error);
    const decorated = withLogging(baseUseCase, logger, "TestUseCase");

    await expect(decorated.execute({ value: "test" })).rejects.toThrow(
      "Unexpected failure",
    );
    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining("[TestUseCase] Unexpected error"),
      error,
      expect.any(Object),
    );
  });

  it("should sanitize sensitive input fields", async () => {
    const baseUseCase = createSuccessUseCase();
    const decorated = withLogging(baseUseCase, logger, "TestUseCase");

    await decorated.execute({ value: "test", password: "secret123" });

    expect(logger.debug).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        input: { value: "test", password: "[REDACTED]" },
      }),
    );
  });

  it("should generate correlation ID for each execution", async () => {
    const baseUseCase = createSuccessUseCase();
    const decorated = withLogging(baseUseCase, logger, "TestUseCase");

    await decorated.execute({ value: "test1" });
    await decorated.execute({ value: "test2" });

    const calls = (logger.debug as ReturnType<typeof vi.fn>).mock.calls;
    const correlationId1 = calls[0][1].correlationId;
    const correlationId2 = calls[1][1].correlationId;

    expect(correlationId1).toBeDefined();
    expect(correlationId2).toBeDefined();
    expect(correlationId1).not.toBe(correlationId2);
  });
});

// ============================================================================
// withMetrics Tests
// ============================================================================

describe("withMetrics decorator", () => {
  it("should record duration and success counter", async () => {
    const metrics = createMockMetrics();
    const baseUseCase = createSuccessUseCase(10); // 10ms delay
    const decorated = withMetrics(baseUseCase, metrics, "TestUseCase");

    const result = await decorated.execute({ value: "test" });

    expect(result.ok).toBe(true);

    const durations = metrics.getDurations();
    expect(durations).toHaveLength(1);
    expect(durations[0].name).toBe("usecase_duration_ms");
    expect(durations[0].duration).toBeGreaterThanOrEqual(5);
    expect(durations[0].labels?.usecase).toBe("TestUseCase");

    const counters = metrics.getCounters();
    expect(counters).toHaveLength(1);
    expect(counters[0].name).toBe("usecase_total");
    expect(counters[0].labels?.status).toBe("success");
  });

  it("should record domain error as domain_error status", async () => {
    const metrics = createMockMetrics();
    const error = new ValidationError("Invalid", "field");
    const baseUseCase = createFailingUseCase(error);
    const decorated = withMetrics(baseUseCase, metrics, "TestUseCase");

    const result = await decorated.execute({ value: "test" });

    expect(result.ok).toBe(false);

    const counters = metrics.getCounters();
    expect(counters[0].labels?.status).toBe("domain_error");
  });

  it("should record exception status and rethrow", async () => {
    const metrics = createMockMetrics();
    const baseUseCase = createThrowingUseCase(new Error("Boom"));
    const decorated = withMetrics(baseUseCase, metrics, "TestUseCase");

    await expect(decorated.execute({ value: "test" })).rejects.toThrow("Boom");

    const counters = metrics.getCounters();
    expect(counters[0].labels?.status).toBe("exception");
  });
});

// ============================================================================
// withRetry Tests
// ============================================================================

describe("withRetry decorator", () => {
  let logger: ILogger;

  beforeEach(() => {
    logger = createMockLogger();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should not retry on success", async () => {
    const baseUseCase = createSuccessUseCase();
    const executeSpy = vi.spyOn(baseUseCase, "execute");
    const decorated = withRetry(baseUseCase, { maxAttempts: 3 }, logger);

    const promise = decorated.execute({ value: "test" });
    await vi.runAllTimersAsync();
    const result = await promise;

    expect(result.ok).toBe(true);
    expect(executeSpy).toHaveBeenCalledTimes(1);
  });

  it("should not retry domain errors by default", async () => {
    const error = new ValidationError("Invalid", "field");
    const baseUseCase = createFailingUseCase(error);
    const executeSpy = vi.spyOn(baseUseCase, "execute");
    const decorated = withRetry(baseUseCase, { maxAttempts: 3 }, logger);

    const promise = decorated.execute({ value: "test" });
    await vi.runAllTimersAsync();
    const result = await promise;

    expect(result.ok).toBe(false);
    expect(executeSpy).toHaveBeenCalledTimes(1); // No retry
  });

  it("should retry infrastructure errors", async () => {
    const error = new InfrastructureError("DB down");
    const baseUseCase = createFlakeyUseCase(2, error); // Fails 2 times, then succeeds
    const executeSpy = vi.spyOn(baseUseCase, "execute");

    const decorated = withRetry(
      baseUseCase,
      {
        maxAttempts: 3,
        delayMs: 100,
        backoffMultiplier: 2,
        retryableErrors: ["INFRASTRUCTURE_ERROR"],
      },
      logger,
    );

    const promise = decorated.execute({ value: "test" });
    await vi.runAllTimersAsync();
    const result = await promise;

    expect(result.ok).toBe(true);
    expect(executeSpy).toHaveBeenCalledTimes(3);
    expect(logger.warn).toHaveBeenCalledTimes(2); // Logged 2 retries
  });

  it("should fail after max attempts", async () => {
    const error = new InfrastructureError("DB down");
    const baseUseCase = createFailingUseCase(error);
    const executeSpy = vi.spyOn(baseUseCase, "execute");

    const decorated = withRetry(
      baseUseCase,
      {
        maxAttempts: 3,
        delayMs: 50,
        backoffMultiplier: 2,
        retryableErrors: ["INFRASTRUCTURE_ERROR"],
      },
      logger,
    );

    const promise = decorated.execute({ value: "test" });
    await vi.runAllTimersAsync();
    const result = await promise;

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("INFRASTRUCTURE_ERROR");
    }
    expect(executeSpy).toHaveBeenCalledTimes(3);
  });

  it("should retry thrown exceptions", async () => {
    let attempts = 0;
    const baseUseCase: IUseCase<TestInput, TestOutput, DomainError> = {
      async execute(
        input: TestInput,
      ): Promise<Result<TestOutput, DomainError>> {
        attempts++;
        if (attempts < 3) {
          throw new Error("Network error");
        }
        return Result.ok({ result: `processed: ${input.value}` });
      },
    };

    const decorated = withRetry(
      baseUseCase,
      { maxAttempts: 3, delayMs: 10 },
      logger,
    );

    const promise = decorated.execute({ value: "test" });
    await vi.runAllTimersAsync();
    const result = await promise;

    expect(result.ok).toBe(true);
    expect(attempts).toBe(3);
  });
});

// ============================================================================
// withCircuitBreaker Tests
// ============================================================================

describe("withCircuitBreaker decorator", () => {
  let logger: ILogger;

  beforeEach(() => {
    logger = createMockLogger();
  });

  it("should allow requests when circuit is closed", async () => {
    const baseUseCase = createSuccessUseCase();
    const decorated = withCircuitBreaker(
      baseUseCase,
      { failureThreshold: 3 },
      logger,
    );

    const result = await decorated.execute({ value: "test" });

    expect(result.ok).toBe(true);
  });

  it("should open circuit after failure threshold", async () => {
    const error = new InfrastructureError("Service down");
    const baseUseCase = createFailingUseCase(error);

    const decorated = withCircuitBreaker(
      baseUseCase,
      { failureThreshold: 3, recoveryTimeMs: 30000, halfOpenRequests: 1 },
      logger,
    );

    // Fail 3 times to open circuit
    for (let i = 0; i < 3; i++) {
      await decorated.execute({ value: "test" });
    }

    expect(logger.error).toHaveBeenCalledWith(
      "Circuit breaker opened",
      undefined,
      expect.any(Object),
    );

    // Next request should fail immediately with circuit open
    const result = await decorated.execute({ value: "test" });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toContain("circuit open");
    }
  });

  it("should transition to half-open after recovery time", async () => {
    vi.useFakeTimers();

    const error = new InfrastructureError("Service down");
    let shouldFail = true;
    const baseUseCase: IUseCase<TestInput, TestOutput, DomainError> = {
      async execute(
        input: TestInput,
      ): Promise<Result<TestOutput, DomainError>> {
        if (shouldFail) {
          return Result.fail(error);
        }
        return Result.ok({ result: `processed: ${input.value}` });
      },
    };

    const decorated = withCircuitBreaker(
      baseUseCase,
      { failureThreshold: 2, recoveryTimeMs: 1000, halfOpenRequests: 1 },
      logger,
    );

    // Open the circuit
    await decorated.execute({ value: "test" });
    await decorated.execute({ value: "test" });

    // Advance time past recovery period
    vi.advanceTimersByTime(1100);

    // Service recovered
    shouldFail = false;

    // Should allow request through (half-open)
    const result = await decorated.execute({ value: "test" });

    expect(result.ok).toBe(true);
    expect(logger.info).toHaveBeenCalledWith(
      expect.stringContaining("half-open"),
    );

    vi.useRealTimers();
  });

  it("should not count domain errors as failures", async () => {
    const error = new ValidationError("Invalid", "field");
    const baseUseCase = createFailingUseCase(error);

    const decorated = withCircuitBreaker(
      baseUseCase,
      { failureThreshold: 2 },
      logger,
    );

    // These should not open the circuit (domain errors, not infra)
    for (let i = 0; i < 5; i++) {
      await decorated.execute({ value: "test" });
    }

    // Circuit should still be closed
    expect(logger.error).not.toHaveBeenCalled();
  });
});

// ============================================================================
// compose Tests
// ============================================================================

describe("compose decorator helper", () => {
  it("should compose decorators in correct order", async () => {
    const executionOrder: string[] = [];

    const baseUseCase: IUseCase<TestInput, TestOutput, DomainError> = {
      async execute(
        input: TestInput,
      ): Promise<Result<TestOutput, DomainError>> {
        executionOrder.push("base");
        return Result.ok({ result: `processed: ${input.value}` });
      },
    };

    // Create decorators that track execution order
    const decorator1 = (
      uc: IUseCase<TestInput, TestOutput, DomainError>,
    ): IUseCase<TestInput, TestOutput, DomainError> => ({
      async execute(
        input: TestInput,
      ): Promise<Result<TestOutput, DomainError>> {
        executionOrder.push("decorator1-before");
        const result = await uc.execute(input);
        executionOrder.push("decorator1-after");
        return result;
      },
    });

    const decorator2 = (
      uc: IUseCase<TestInput, TestOutput, DomainError>,
    ): IUseCase<TestInput, TestOutput, DomainError> => ({
      async execute(
        input: TestInput,
      ): Promise<Result<TestOutput, DomainError>> {
        executionOrder.push("decorator2-before");
        const result = await uc.execute(input);
        executionOrder.push("decorator2-after");
        return result;
      },
    });

    const composed = compose(baseUseCase, decorator1, decorator2);

    await composed.execute({ value: "test" });

    // decorator2 is outermost, decorator1 is next, base is innermost
    expect(executionOrder).toEqual([
      "decorator2-before",
      "decorator1-before",
      "base",
      "decorator1-after",
      "decorator2-after",
    ]);
  });

  it("should work with real decorators", async () => {
    const logger = createMockLogger();
    const metrics = createMockMetrics();
    const baseUseCase = createSuccessUseCase();

    const composed = compose(
      baseUseCase,
      (uc) => withMetrics(uc, metrics, "Test"),
      (uc) => withLogging(uc, logger, "Test"),
    );

    const result = await composed.execute({ value: "test" });

    expect(result.ok).toBe(true);
    expect(logger.info).toHaveBeenCalled();
    expect(metrics.getDurations()).toHaveLength(1);
  });

  it("should handle empty decorator list", async () => {
    const baseUseCase = createSuccessUseCase();
    const composed = compose(baseUseCase);

    const result = await composed.execute({ value: "test" });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.result).toBe("processed: test");
    }
  });
});
