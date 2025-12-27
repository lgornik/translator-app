import { ValueObject } from '../../shared/core/ValueObject.js';
import { Result } from '../../shared/core/Result.js';
import { ValidationError } from '../../shared/errors/DomainErrors.js';
import { randomUUID } from 'crypto';

/**
 * SessionId Value Object
 * Type-safe identifier for quiz sessions
 */
interface SessionIdProps {
  value: string;
}

export class SessionId extends ValueObject<SessionIdProps> {
  private static readonly DEFAULT_SESSION = 'default';

  private constructor(props: SessionIdProps) {
    super(props);
  }

  /**
   * Get the string value
   */
  get value(): string {
    return this.props.value;
  }

  /**
   * Check if this is the default session
   */
  isDefault(): boolean {
    return this.props.value === SessionId.DEFAULT_SESSION;
  }

  /**
   * Create from string with validation
   */
  static create(value: string): Result<SessionId, ValidationError> {
    const trimmed = value.trim();

    if (trimmed.length === 0) {
      return Result.fail(ValidationError.emptyField('sessionId'));
    }

    if (trimmed.length > 255) {
      return Result.fail(
        new ValidationError('Session ID must be at most 255 characters', 'sessionId')
      );
    }

    return Result.ok(new SessionId({ value: trimmed }));
  }

  /**
   * Create from trusted source
   */
  static fromTrusted(value: string): SessionId {
    return new SessionId({ value });
  }

  /**
   * Create the default session
   */
  static default(): SessionId {
    return new SessionId({ value: SessionId.DEFAULT_SESSION });
  }

  /**
   * Generate a new unique session ID
   */
  static generate(): SessionId {
    return new SessionId({ value: randomUUID() });
  }

  /**
   * Convert to string
   */
  toString(): string {
    return this.props.value;
  }
}
