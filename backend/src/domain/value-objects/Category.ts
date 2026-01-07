import { ValueObject } from '../../shared/core/ValueObject.js';
import { Result } from '../../shared/core/Result.js';
import { ValidationError } from '../../shared/errors/DomainErrors.js';

/**
 * Category Value Object
 * Encapsulates word category with validation
 */
interface CategoryProps {
  name: string;
}

export class Category extends ValueObject<CategoryProps> {
  private static readonly MIN_LENGTH = 1;
  private static readonly MAX_LENGTH = 100;

  private constructor(props: CategoryProps) {
    super(props);
  }

  /**
   * Get the category name
   */
  get name(): string {
    return this.props.name;
  }

  /**
   * Create with validation
   */
  static create(name: string): Result<Category, ValidationError> {
    const trimmed = name.trim();

    if (trimmed.length < Category.MIN_LENGTH) {
      return Result.fail(ValidationError.emptyField('category'));
    }

    if (trimmed.length > Category.MAX_LENGTH) {
      return Result.fail(
        new ValidationError(
          `Category name must be at most ${Category.MAX_LENGTH} characters`,
          'category'
        )
      );
    }

    return Result.ok(new Category({ name: trimmed }));
  }

  /**
   * Create from trusted source (e.g., database)
   */
  static fromTrusted(name: string): Category {
    return new Category({ name });
  }

  /**
   * Convert to string
   */
  toString(): string {
    return this.props.name;
  }
}
