/**
 * Branded Types
 *
 * PRINCIPAL PATTERN: Compile-time type safety for primitive types.
 *
 * Problem:
 *   function getUser(userId: string, sessionId: string) { ... }
 *   getUser(sessionId, userId); // Compiles but WRONG!
 *
 * Solution:
 *   function getUser(userId: UserId, sessionId: SessionId) { ... }
 *   getUser(sessionId, userId); // Compile ERROR!
 *
 * This prevents entire classes of bugs at compile time.
 */

/**
 * Brand symbol - unique per type
 */
declare const __brand: unique symbol;

/**
 * Branded type - adds compile-time type safety to primitives
 */
export type Brand<T, TBrand extends string> = T & {
  readonly [__brand]: TBrand;
};

/**
 * Branded string types for domain identifiers
 */
export type SessionIdBrand = Brand<string, "SessionId">;
export type WordIdBrand = Brand<string, "WordId">;
export type CategoryBrand = Brand<string, "Category">;
export type EventIdBrand = Brand<string, "EventId">;
export type CorrelationIdBrand = Brand<string, "CorrelationId">;

/**
 * Branded number types
 */
export type DifficultyBrand = Brand<number, "Difficulty">;
export type VersionBrand = Brand<number, "Version">;
export type TimestampBrand = Brand<number, "Timestamp">;

/**
 * Type guards for branded types
 */
export const BrandUtils = {
  /**
   * Cast a string to a branded type (unsafe - use only when you trust the source)
   */
  unsafeCast<T extends Brand<string, string>>(value: string): T {
    return value as T;
  },

  /**
   * Cast a number to a branded type (unsafe - use only when you trust the source)
   */
  unsafeCastNumber<T extends Brand<number, string>>(value: number): T {
    return value as T;
  },

  /**
   * Extract the underlying value from a branded type
   */
  unwrap<T extends Brand<unknown, string>>(
    branded: T,
  ): T extends Brand<infer U, string> ? U : never {
    return branded as T extends Brand<infer U, string> ? U : never;
  },

  /**
   * Check if two branded values are equal
   */
  equals<T extends Brand<unknown, string>>(a: T, b: T): boolean {
    return a === b;
  },
} as const;

/**
 * Helper to create branded ID generators
 */
export function createIdGenerator<T extends Brand<string, string>>(
  prefix: string,
  generator: () => string = () => crypto.randomUUID(),
): () => T {
  return () => `${prefix}_${generator()}` as T;
}

/**
 * Helper to create branded ID validators
 */
export function createIdValidator<T extends Brand<string, string>>(
  pattern: RegExp,
): (value: string) => value is T {
  return (value: string): value is T => pattern.test(value);
}
