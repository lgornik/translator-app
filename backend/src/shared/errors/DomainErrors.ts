/**
 * Domain Errors
 * Strongly typed error hierarchy for the domain layer
 */

/**
 * Base domain error - all domain errors extend this
 */
export abstract class DomainError extends Error {
  abstract readonly code: string;
  abstract readonly httpStatus: number;
  readonly timestamp: Date;
  readonly details: Record<string, unknown> | undefined;

  protected constructor(message: string, details?: Record<string, unknown>) {
    super(message);
    this.name = this.constructor.name;
    this.timestamp = new Date();
    this.details = details;

    // Maintains proper stack trace for where error was thrown
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Serialize error for logging/API responses
   */
  toJSON(): Record<string, unknown> {
    return {
      code: this.code,
      message: this.message,
      timestamp: this.timestamp.toISOString(),
      ...(this.details && { details: this.details }),
    };
  }
}

/**
 * Entity not found
 */
export class NotFoundError extends DomainError {
  readonly code = 'NOT_FOUND' as const;
  readonly httpStatus = 404;
  readonly entityType: string;
  readonly entityId: string | undefined;

  constructor(entityType: string, entityId?: string) {
    const message = entityId
      ? `${entityType} with id "${entityId}" not found`
      : `${entityType} not found`;

    super(message, { entityType, entityId });
    this.entityType = entityType;
    this.entityId = entityId;
  }

  static word(id: string): NotFoundError {
    return new NotFoundError('Word', id);
  }

  static session(id: string): NotFoundError {
    return new NotFoundError('Session', id);
  }
}

/**
 * Validation failed
 */
export class ValidationError extends DomainError {
  readonly code = 'VALIDATION_ERROR' as const;
  readonly httpStatus = 400;
  readonly field: string | undefined;

  constructor(message: string, field?: string, details?: Record<string, unknown>) {
    super(message, { field, ...details });
    this.field = field;
  }

  static invalidDifficulty(value: unknown): ValidationError {
    return new ValidationError(
      `Invalid difficulty value: ${value}. Must be 1, 2, or 3`,
      'difficulty'
    );
  }

  static invalidTranslationMode(value: unknown): ValidationError {
    return new ValidationError(
      `Invalid translation mode: ${value}. Must be EN_TO_PL or PL_TO_EN`,
      'mode'
    );
  }

  static emptyField(field: string): ValidationError {
    return new ValidationError(`${field} cannot be empty`, field);
  }

  static invalidFormat(field: string, expectedFormat: string): ValidationError {
    return new ValidationError(
      `${field} has invalid format. Expected: ${expectedFormat}`,
      field
    );
  }
}

/**
 * No words available for given criteria
 */
export class NoWordsAvailableError extends DomainError {
  readonly code = 'NO_WORDS_AVAILABLE' as const;
  readonly httpStatus = 404;
  readonly filters: {
    category?: string | undefined;
    difficulty?: number | undefined;
  };

  constructor(filters: { category?: string | undefined; difficulty?: number | undefined } = {}) {
    const filterDesc = Object.entries(filters)
      .filter(([_, v]) => v !== undefined)
      .map(([k, v]) => `${k}=${v}`)
      .join(', ');

    const message = filterDesc
      ? `No words available for filters: ${filterDesc}`
      : 'No words available';

    super(message, filters as Record<string, unknown>);
    this.filters = filters;
  }
}

/**
 * Session expired or invalid
 */
export class SessionError extends DomainError {
  readonly code = 'SESSION_ERROR' as const;
  readonly httpStatus = 400;

  constructor(message: string, details?: Record<string, unknown>) {
    super(message, details);
  }

  static expired(sessionId: string): SessionError {
    return new SessionError(`Session "${sessionId}" has expired`, { sessionId });
  }

  static invalid(sessionId: string): SessionError {
    return new SessionError(`Invalid session: "${sessionId}"`, { sessionId });
  }
}

/**
 * Infrastructure error (database, external services, etc.)
 */
export class InfrastructureError extends DomainError {
  readonly code = 'INFRASTRUCTURE_ERROR' as const;
  readonly httpStatus = 500;
  readonly cause: Error | undefined;

  constructor(message: string, cause?: Error) {
    super(message, cause ? { originalError: cause.message } : undefined);
    this.cause = cause;
  }

  static database(operation: string, cause?: Error): InfrastructureError {
    return new InfrastructureError(`Database error during ${operation}`, cause);
  }

  static externalService(service: string, cause?: Error): InfrastructureError {
    return new InfrastructureError(`External service "${service}" failed`, cause);
  }
}

/**
 * Rate limit exceeded
 */
export class RateLimitError extends DomainError {
  readonly code = 'RATE_LIMIT_EXCEEDED' as const;
  readonly httpStatus = 429;
  readonly retryAfterSeconds: number;

  constructor(retryAfterSeconds: number = 60) {
    super(`Rate limit exceeded. Retry after ${retryAfterSeconds} seconds`, {
      retryAfterSeconds,
    });
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

/**
 * Type guard to check if error is a DomainError
 */
export function isDomainError(error: unknown): error is DomainError {
  return error instanceof DomainError;
}

/**
 * Type for all possible domain errors
 */
export type AnyDomainError =
  | NotFoundError
  | ValidationError
  | NoWordsAvailableError
  | SessionError
  | InfrastructureError
  | RateLimitError;
