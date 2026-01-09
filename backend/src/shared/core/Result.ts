/**
 * Result Pattern - Functional error handling
 * Eliminates throwing exceptions for expected failures
 */

// Success result type
interface OkResult<T> {
  readonly ok: true;
  readonly value: T;
  readonly error?: never;
}

// Failure result type
interface FailResult<E> {
  readonly ok: false;
  readonly error: E;
  readonly value?: never;
}

export type Result<T, E = Error> = OkResult<T> | FailResult<E>;

export const Result = {
  /**
   * Create a success result
   */
  ok<T>(value: T): Result<T, never> {
    return { ok: true, value } as const;
  },

  /**
   * Create a failure result
   */
  fail<E>(error: E): Result<never, E> {
    return { ok: false, error } as const;
  },

  /**
   * Check if result is success
   */
  isOk<T, E>(result: Result<T, E>): result is OkResult<T> {
    return result.ok === true;
  },

  /**
   * Check if result is failure
   */
  isFail<T, E>(result: Result<T, E>): result is FailResult<E> {
    return result.ok === false;
  },

  /**
   * Map over success value
   */
  map<T, U, E>(result: Result<T, E>, fn: (value: T) => U): Result<U, E> {
    if (result.ok) {
      return Result.ok(fn(result.value));
    }
    return Result.fail(result.error);
  },

  /**
   * FlatMap over success value
   */
  flatMap<T, U, E>(
    result: Result<T, E>,
    fn: (value: T) => Result<U, E>,
  ): Result<U, E> {
    if (result.ok) {
      return fn(result.value);
    }
    return Result.fail(result.error);
  },

  /**
   * Get value or default
   */
  getOrElse<T, E>(result: Result<T, E>, defaultValue: T): T {
    if (result.ok) {
      return result.value;
    }
    return defaultValue;
  },

  /**
   * Get value or throw
   */
  getOrThrow<T, E extends Error>(result: Result<T, E>): T {
    if (result.ok) {
      return result.value;
    }
    throw result.error;
  },

  /**
   * Combine multiple results
   */
  combine<T, E>(results: Result<T, E>[]): Result<T[], E> {
    const values: T[] = [];

    for (const result of results) {
      if (!result.ok) {
        return Result.fail(result.error);
      }
      values.push(result.value);
    }

    return Result.ok(values);
  },

  /**
   * Try to execute a function, catching errors
   */
  tryCatch<T>(fn: () => T): Result<T, Error> {
    try {
      return Result.ok(fn());
    } catch (error) {
      return Result.fail(
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  },

  /**
   * Try to execute an async function, catching errors
   */
  async tryCatchAsync<T>(fn: () => Promise<T>): Promise<Result<T, Error>> {
    try {
      const value = await fn();
      return Result.ok(value);
    } catch (error) {
      return Result.fail(
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  },
} as const;

/**
 * Type helper to extract success type from Result
 */
export type ResultValue<R> = R extends Result<infer T, unknown> ? T : never;

/**
 * Type helper to extract error type from Result
 */
export type ResultError<R> = R extends Result<unknown, infer E> ? E : never;
