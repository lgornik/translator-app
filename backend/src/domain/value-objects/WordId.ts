import { ValueObject } from '../../shared/core/ValueObject.js';
import { Result } from '../../shared/core/Result.js';
import { ValidationError } from '../../shared/errors/DomainErrors.js';
import { randomUUID } from 'crypto';

/**
 * WordId Value Object
 * Type-safe identifier for Word entity
 */
interface WordIdProps {
  value: string;
}

export class WordId extends ValueObject<WordIdProps> {
  private constructor(props: WordIdProps) {
    super(props);
  }

  /**
   * Get the string value
   */
  get value(): string {
    return this.props.value;
  }

  /**
   * Create from string with validation
   */
  static create(value: string): Result<WordId, ValidationError> {
    const trimmed = value.trim();

    if (trimmed.length === 0) {
      return Result.fail(ValidationError.emptyField('wordId'));
    }

    return Result.ok(new WordId({ value: trimmed }));
  }

  /**
   * Create from trusted source
   */
  static fromTrusted(value: string): WordId {
    return new WordId({ value });
  }

  /**
   * Generate a new unique ID
   */
  static generate(): WordId {
    return new WordId({ value: randomUUID() });
  }

  /**
   * Convert to string
   */
  toString(): string {
    return this.props.value;
  }
}
