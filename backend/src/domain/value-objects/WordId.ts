import { ValueObject } from "../../shared/core/ValueObject.js";
import { Result } from "../../shared/core/Result.js";
import { ValidationError } from "../../shared/errors/DomainErrors.js";
import { WordIdBrand, BrandUtils } from "../../shared/core/Brand.js";
import { randomUUID } from "crypto";

interface WordIdProps {
  value: WordIdBrand;
}

export class WordId extends ValueObject<WordIdProps> {
  private static readonly MAX_LENGTH = 255;
  private static readonly MIN_LENGTH = 1;

  private constructor(props: WordIdProps) {
    super(props);
  }

  /**
   * Get the branded string value
   */
  get value(): WordIdBrand {
    return this.props.value;
  }

  /**
   * Get raw string value (for serialization)
   */
  get rawValue(): string {
    return BrandUtils.unwrap(this.props.value);
  }

  /**
   * Create from string with validation
   */
  static create(value: string): Result<WordId, ValidationError> {
    const trimmed = value.trim();

    if (trimmed.length < WordId.MIN_LENGTH) {
      return Result.fail(ValidationError.emptyField("wordId"));
    }

    if (trimmed.length > WordId.MAX_LENGTH) {
      return Result.fail(
        new ValidationError(
          `Word ID must be at most ${WordId.MAX_LENGTH} characters`,
          "wordId",
        ),
      );
    }

    return Result.ok(new WordId({ value: trimmed as WordIdBrand }));
  }

  /**
   * Create from trusted source (e.g., database)
   * @internal Use only when value is known to be valid
   */
  static fromTrusted(value: string): WordId {
    return new WordId({ value: value as WordIdBrand });
  }

  /**
   * Generate a new unique word ID
   */
  static generate(): WordId {
    const uuid = randomUUID();
    return new WordId({ value: `word_${uuid}` as WordIdBrand });
  }

  /**
   * Convert to string (for logging, serialization)
   */
  toString(): string {
    return this.rawValue;
  }

  /**
   * Check equality with another WordId
   */
  equals(other: WordId): boolean {
    return BrandUtils.equals(this.props.value, other.props.value);
  }
}
