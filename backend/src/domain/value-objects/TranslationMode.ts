import { ValueObject } from '../../shared/core/ValueObject.js';
import { Result } from '../../shared/core/Result.js';
import { ValidationError } from '../../shared/errors/DomainErrors.js';

/**
 * Translation direction modes
 */
export enum TranslationDirection {
  EN_TO_PL = 'EN_TO_PL',
  PL_TO_EN = 'PL_TO_EN',
}

/**
 * Language codes
 */
export type LanguageCode = 'en' | 'pl';

/**
 * TranslationMode Value Object
 * Encapsulates translation direction with behavior
 */
interface TranslationModeProps {
  direction: TranslationDirection;
}

export class TranslationMode extends ValueObject<TranslationModeProps> {
  private static readonly LANGUAGE_NAMES: Record<LanguageCode, string> = {
    en: 'English',
    pl: 'Polish',
  };

  private constructor(props: TranslationModeProps) {
    super(props);
  }

  /**
   * Get the direction value
   */
  get direction(): TranslationDirection {
    return this.props.direction;
  }

  /**
   * Get source language code
   */
  get sourceLanguage(): LanguageCode {
    return this.props.direction === TranslationDirection.EN_TO_PL ? 'en' : 'pl';
  }

  /**
   * Get target language code
   */
  get targetLanguage(): LanguageCode {
    return this.props.direction === TranslationDirection.EN_TO_PL ? 'pl' : 'en';
  }

  /**
   * Get source language name
   */
  get sourceLanguageName(): string {
    return TranslationMode.LANGUAGE_NAMES[this.sourceLanguage];
  }

  /**
   * Get target language name
   */
  get targetLanguageName(): string {
    return TranslationMode.LANGUAGE_NAMES[this.targetLanguage];
  }

  /**
   * Create from string with validation
   */
  static create(value: string): Result<TranslationMode, ValidationError> {
    if (
      value !== TranslationDirection.EN_TO_PL &&
      value !== TranslationDirection.PL_TO_EN
    ) {
      return Result.fail(ValidationError.invalidTranslationMode(value));
    }

    return Result.ok(new TranslationMode({ direction: value as TranslationDirection }));
  }

  /**
   * Create from string, throwing on invalid
   * Use only when value is trusted (e.g., from database)
   */
  static fromTrusted(value: string): TranslationMode {
    return new TranslationMode({ direction: value as TranslationDirection });
  }

  /**
   * Factory for English to Polish
   */
  static englishToPolish(): TranslationMode {
    return new TranslationMode({ direction: TranslationDirection.EN_TO_PL });
  }

  /**
   * Factory for Polish to English
   */
  static polishToEnglish(): TranslationMode {
    return new TranslationMode({ direction: TranslationDirection.PL_TO_EN });
  }

  /**
   * Check if translating from English
   */
  isFromEnglish(): boolean {
    return this.props.direction === TranslationDirection.EN_TO_PL;
  }

  /**
   * Check if translating from Polish
   */
  isFromPolish(): boolean {
    return this.props.direction === TranslationDirection.PL_TO_EN;
  }

  /**
   * Get the reversed mode
   */
  reverse(): TranslationMode {
    return this.isFromEnglish()
      ? TranslationMode.polishToEnglish()
      : TranslationMode.englishToPolish();
  }

  /**
   * Convert to string for persistence/API
   */
  toString(): TranslationDirection {
    return this.props.direction;
  }

  /**
   * Human readable description
   */
  toDisplayString(): string {
    return `${this.sourceLanguageName} â†’ ${this.targetLanguageName}`;
  }
}
