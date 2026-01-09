import { Result } from "../../shared/core/Result.js";
import {
  DomainError,
  NoWordsAvailableError,
} from "../../shared/errors/DomainErrors.js";
import {
  IWordRepository,
  WordFilters,
} from "../../domain/repositories/IWordRepository.js";
import { ISessionRepository } from "../../domain/repositories/ISessionRepository.js";
import { TranslationMode } from "../../domain/value-objects/TranslationMode.js";
import { Difficulty } from "../../domain/value-objects/Difficulty.js";
import { Category } from "../../domain/value-objects/Category.js";
import { SessionId } from "../../domain/value-objects/SessionId.js";
import { RandomWordPicker } from "../../domain/services/RandomWordPicker.js";
import { ILogger } from "../interfaces/ILogger.js";
import { GetRandomWordInput, GetRandomWordOutput } from "../dtos/index.js";
import { ISessionMutex } from "../../infrastructure/persistence/SessionMutex.js";

/**
 * Get Random Word Use Case
 * Fetches a random word for translation, tracking used words per session
 * Uses mutex to prevent race conditions when accessing session data
 */
export class GetRandomWordUseCase {
  constructor(
    private readonly wordRepository: IWordRepository,
    private readonly sessionRepository: ISessionRepository,
    private readonly randomPicker: RandomWordPicker,
    private readonly logger: ILogger,
    private readonly sessionMutex?: ISessionMutex,
  ) {}

  async execute(
    input: GetRandomWordInput,
  ): Promise<Result<GetRandomWordOutput, DomainError>> {
    const startTime = Date.now();

    // 1. Validate and parse input
    const modeResult = TranslationMode.create(input.mode);
    if (!modeResult.ok) {
      return Result.fail(modeResult.error);
    }
    const mode = modeResult.value;

    const sessionIdResult = SessionId.create(input.sessionId);
    if (!sessionIdResult.ok) {
      return Result.fail(sessionIdResult.error);
    }
    const sessionId = sessionIdResult.value;

    // Parse optional filters
    let difficulty: Difficulty | null = null;
    if (input.difficulty !== null && input.difficulty !== undefined) {
      const diffResult = Difficulty.create(input.difficulty);
      if (!diffResult.ok) {
        return Result.fail(diffResult.error);
      }
      difficulty = diffResult.value;
    }

    let category: Category | null = null;
    if (input.category !== null && input.category !== undefined) {
      const catResult = Category.create(input.category);
      if (!catResult.ok) {
        return Result.fail(catResult.error);
      }
      category = catResult.value;
    }

    // 2. Build filters and get available words
    const filters: WordFilters = { category, difficulty };
    const availableWords = await this.wordRepository.findByFilters(filters);

    if (availableWords.length === 0) {
      const errorFilters: {
        category?: string | undefined;
        difficulty?: number | undefined;
      } = {};
      if (category) errorFilters.category = category.name;
      if (difficulty) errorFilters.difficulty = difficulty.value;

      return Result.fail(new NoWordsAvailableError(errorFilters));
    }

    // 3. Execute session operations with mutex lock to prevent race conditions
    const executeWithSession = async (): Promise<
      Result<GetRandomWordOutput, DomainError>
    > => {
      // Get or create session
      const session = await this.sessionRepository.findOrCreate(sessionId);

      // Filter out used words
      const unusedWords = availableWords.filter(
        (word) => !session.hasUsedWord(word.id),
      );

      // Reset session if all words used
      if (unusedWords.length === 0) {
        this.logger.debug("All words used, resetting session for filters", {
          sessionId: sessionId.value,
          wordCount: availableWords.length,
        });

        // Reset only words matching current filters
        session.resetWords(availableWords.map((w) => w.id));
        await this.sessionRepository.save(session);

        // Recursive call with fresh session (outside mutex to avoid deadlock)
        return this.execute(input);
      }

      // Pick random word
      const selectedWord = this.randomPicker.pick(unusedWords);
      if (!selectedWord) {
        return Result.fail(new NoWordsAvailableError());
      }

      // Mark word as used
      session.markWordAsUsed(selectedWord.id);
      await this.sessionRepository.save(session);

      // Log and return
      const duration = Date.now() - startTime;
      this.logger.info("Random word selected", {
        operation: "GetRandomWord",
        sessionId: sessionId.value,
        wordId: selectedWord.id.value,
        duration,
      });

      return Result.ok({
        id: selectedWord.id.value,
        wordToTranslate: selectedWord.getWordToTranslate(mode),
        correctTranslation: selectedWord.getCorrectTranslation(mode),
        mode: mode.toString(),
        category: selectedWord.category.name,
        difficulty: selectedWord.difficulty.value,
      });
    };

    // Use mutex if available, otherwise execute directly
    if (this.sessionMutex) {
      return this.sessionMutex.withLock(sessionId.value, executeWithSession);
    }

    return executeWithSession();
  }
}
