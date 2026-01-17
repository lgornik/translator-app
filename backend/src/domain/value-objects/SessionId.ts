import { ValueObject } from "../../shared/core/ValueObject.js";
import { Result } from "../../shared/core/Result.js";
import { ValidationError } from "../../shared/errors/DomainErrors.js";
import { SessionIdBrand, BrandUtils } from "../../shared/core/Brand.js";
import { randomUUID } from "crypto";

interface SessionIdProps {
  value: SessionIdBrand;
}

export class SessionId extends ValueObject<SessionIdProps> {
  private static readonly DEFAULT_SESSION = "default" as SessionIdBrand;
  private static readonly MAX_LENGTH = 255;
  private static readonly MIN_LENGTH = 1;

  private constructor(props: SessionIdProps) {
    super(props);
  }

  /**
   * Get the branded string value
   */
  get value(): SessionIdBrand {
    return this.props.value;
  }

  /**
   * Get raw string value (for serialization)
   */
  get rawValue(): string {
    return BrandUtils.unwrap(this.props.value);
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

    if (trimmed.length < SessionId.MIN_LENGTH) {
      return Result.fail(ValidationError.emptyField("sessionId"));
    }

    if (trimmed.length > SessionId.MAX_LENGTH) {
      return Result.fail(
        new ValidationError(
          `Session ID must be at most ${SessionId.MAX_LENGTH} characters`,
          "sessionId",
        ),
      );
    }

    // Validate format (alphanumeric, hyphens, underscores)
    if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
      return Result.fail(
        new ValidationError(
          "Session ID must contain only alphanumeric characters, hyphens, and underscores",
          "sessionId",
        ),
      );
    }

    return Result.ok(new SessionId({ value: trimmed as SessionIdBrand }));
  }

  /**
   * Create from trusted source (e.g., database)
   * @internal Use only when value is known to be valid
   */
  static fromTrusted(value: string): SessionId {
    return new SessionId({ value: value as SessionIdBrand });
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
    const uuid = randomUUID();
    return new SessionId({ value: `sess_${uuid}` as SessionIdBrand });
  }

  /**
   * Convert to string (for logging, serialization)
   */
  toString(): string {
    return this.rawValue;
  }

  /**
   * Check equality with another SessionId
   */
  equals(other: SessionId): boolean {
    return BrandUtils.equals(this.props.value, other.props.value);
  }
}
