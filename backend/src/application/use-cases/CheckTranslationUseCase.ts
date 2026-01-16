import { Result } from "../../shared/core/Result.js";
import {
  DomainError,
  NotFoundError,
} from "../../shared/errors/DomainErrors.js";
import { IWordRepository } from "../../domain/repositories/IWordRepository.js";
import { TranslationMode } from "../../domain/value-objects/TranslationMode.js";
import { WordId } from "../../domain/value-objects/WordId.js";
import { TranslationChecker } from "../../domain/services/TranslationChecker.js";
import {
  CheckTranslationInput,
  CheckTranslationOutput,
} from "../dtos/index.js";
import { IUseCase } from "../interfaces/IUseCase.js";

/**
 * Check Translation Use Case
 *
 * PRINCIPAL PATTERN: Pure business logic - no cross-cutting concerns.
 *
 * Logging, metrics, retry logic are handled by decorators.
 * This keeps the use case focused, testable, and reusable.
 */
export class CheckTranslationUseCase implements IUseCase<
  CheckTranslationInput,
  CheckTranslationOutput
> {
  constructor(
    private readonly wordRepository: IWordRepository,
    private readonly translationChecker: TranslationChecker,
  ) {}

  async execute(
    input: CheckTranslationInput,
  ): Promise<Result<CheckTranslationOutput, DomainError>> {
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
      return Result.fail(NotFoundError.word(wordId.toString()));
    }

    // 3. Check translation using domain service
    const correctAnswer = word.getCorrectTranslation(mode);
    const checkResult = this.translationChecker.check(
      correctAnswer,
      input.userTranslation,
    );

    return Result.ok({
      isCorrect: checkResult.isCorrect,
      correctTranslation: checkResult.correctTranslation,
      userTranslation: checkResult.userTranslation,
    });
  }
}
