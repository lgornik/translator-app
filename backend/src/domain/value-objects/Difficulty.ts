import { ValueObject } from '../../shared/core/ValueObject.js';
import { Result } from '../../shared/core/Result.js';
import { ValidationError } from '../../shared/errors/DomainErrors.js';

/**
 * Difficulty levels
 */
export enum DifficultyLevel {
  EASY = 1,
  MEDIUM = 2,
  HARD = 3,
}

/**
 * Difficulty Value Object
 * Encapsulates difficulty level with validation and behavior
 */
interface DifficultyProps {
  value: DifficultyLevel;
}

export class Difficulty extends ValueObject<DifficultyProps> {
  private static readonly LABELS: Record<DifficultyLevel, string> = {
    [DifficultyLevel.EASY]: 'Easy',
    [DifficultyLevel.MEDIUM]: 'Medium',
    [DifficultyLevel.HARD]: 'Hard',
  };

  private static readonly VALID_VALUES = new Set([
    DifficultyLevel.EASY,
    DifficultyLevel.MEDIUM,
    DifficultyLevel.HARD,
  ]);

  private constructor(props: DifficultyProps) {
    super(props);
  }

  /**
   * Get the numeric value
   */
  get value(): DifficultyLevel {
    return this.props.value;
  }

  /**
   * Get human-readable label
   */
  get label(): string {
    return Difficulty.LABELS[this.props.value];
  }

  /**
   * Create from number with validation
   */
  static create(value: number): Result<Difficulty, ValidationError> {
    if (!Difficulty.VALID_VALUES.has(value as DifficultyLevel)) {
      return Result.fail(ValidationError.invalidDifficulty(value));
    }

    return Result.ok(new Difficulty({ value: value as DifficultyLevel }));
  }

  /**
   * Create from number, throwing on invalid
   * Use only when value is trusted (e.g., from database)
   */
  static fromTrusted(value: number): Difficulty {
    return new Difficulty({ value: value as DifficultyLevel });
  }

  /**
   * Factory methods for each level
   */
  static easy(): Difficulty {
    return new Difficulty({ value: DifficultyLevel.EASY });
  }

  static medium(): Difficulty {
    return new Difficulty({ value: DifficultyLevel.MEDIUM });
  }

  static hard(): Difficulty {
    return new Difficulty({ value: DifficultyLevel.HARD });
  }

  /**
   * Check if this difficulty is easier than another
   */
  isEasierThan(other: Difficulty): boolean {
    return this.props.value < other.props.value;
  }

  /**
   * Check if this difficulty is harder than another
   */
  isHarderThan(other: Difficulty): boolean {
    return this.props.value > other.props.value;
  }

  /**
   * Get all valid difficulty values
   */
  static all(): Difficulty[] {
    return [Difficulty.easy(), Difficulty.medium(), Difficulty.hard()];
  }

  /**
   * Convert to number for persistence/API
   */
  toNumber(): number {
    return this.props.value;
  }

  /**
   * String representation
   */
  toString(): string {
    return this.label;
  }
}
