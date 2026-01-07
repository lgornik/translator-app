import { Result } from '../../shared/core/Result.js';
import {
  DomainError,
  NotFoundError,
} from '../../shared/errors/DomainErrors.js';
import { IWordRepository } from '../../domain/repositories/IWordRepository.js';
import { TranslationMode } from '../../domain/value-objects/TranslationMode.js';
import { WordId } from '../../domain/value-objects/WordId.js';
import { TranslationChecker } from '../../domain/services/TranslationChecker.js';
import { ILogger } from '../interfaces/ILogger.js';
import { CheckTranslationInput, CheckTranslationOutput } from '../dtos/index.js';

/**
 * Check Translation Use Case
 * Validates a user's translation answer
 */
export class CheckTranslationUseCase {
  constructor(
    private readonly wordRepository: IWordRepository,
    private readonly translationChecker: TranslationChecker,
    private readonly logger: ILogger
  ) {}

  async execute(input: CheckTranslationInput): Promise<Result<CheckTranslationOutput, DomainError>> {
    const startTime = Date.now();

    // 1. Validate input
    const wordIdResult = WordId.create(input.wordId);
    if (!wordIdResult.ok) {
      return Result.fail(wordIdResult.error);
    }
    const wordId = wordIdResult.value;

    const modeResult = TranslationMode.create(input.mode);
    if (!modeResult.ok) {
      return Result.fail(modeResult.error);
    }
    const mode = modeResult.value;

    // 2. Find word
    const word = await this.wordRepository.findById(wordId);
    if (!word) {
      return Result.fail(NotFoundError.word(wordId.value));
    }

    // 3. Check translation using domain service
    const correctAnswer = word.getCorrectTranslation(mode);
    const checkResult = this.translationChecker.check(
      correctAnswer,
      input.userTranslation
    );

    // 4. Log result
    const duration = Date.now() - startTime;
    this.logger.info('Translation checked', {
      operation: 'CheckTranslation',
      sessionId: input.sessionId,
      wordId: wordId.value,
      isCorrect: checkResult.isCorrect,
      duration,
    });

    return Result.ok({
      isCorrect: checkResult.isCorrect,
      correctTranslation: checkResult.correctTranslation,
      userTranslation: checkResult.userTranslation,
    });
  }
}
