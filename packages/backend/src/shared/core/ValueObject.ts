/**
 * Base Value Object class
 * Value Objects are immutable and compared by their properties
 */
export abstract class ValueObject<T extends object> {
  protected readonly props: Readonly<T>;

  protected constructor(props: T) {
    this.props = Object.freeze(props);
  }

  /**
   * Value Objects are equal if all their properties are equal
   */
  equals(other: ValueObject<T>): boolean {
    if (other === null || other === undefined) {
      return false;
    }

    if (other.props === undefined) {
      return false;
    }

    return this.shallowEquals(
      this.props as Record<string, unknown>,
      other.props as Record<string, unknown>
    );
  }

  private shallowEquals(
    obj1: Record<string, unknown>,
    obj2: Record<string, unknown>
  ): boolean {
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);

    if (keys1.length !== keys2.length) {
      return false;
    }

    return keys1.every((key) => obj1[key] === obj2[key]);
  }

  /**
   * Clone with new properties
   */
  protected clone<U extends ValueObject<T>>(
    this: U,
    newProps: Partial<T>
  ): U {
    const Constructor = this.constructor as new (props: T) => U;
    return new Constructor({ ...this.props, ...newProps });
  }
}

/**
 * Branded types for type-safe IDs
 */
declare const brand: unique symbol;

export type Brand<T, TBrand extends string> = T & { [brand]: TBrand };

/**
 * Create a branded type factory
 */
export function createBrandedType<T, TBrand extends string>() {
  return {
    create: (value: T): Brand<T, TBrand> => value as Brand<T, TBrand>,
    extract: (branded: Brand<T, TBrand>): T => branded,
  };
}
