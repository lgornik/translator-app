import { Result } from '../../shared/core/Result.js';
import {
  DomainError,
  NoWordsAvailableError,
  ValidationError,
} from '../../shared/errors/DomainErrors.js';
import { IWordRepository, WordFilters } from '../../domain/repositories/IWordRepository.js';
import { ISessionRepository } from '../../domain/repositories/ISessionRepository.js';
import { TranslationMode } from '../../domain/value-objects/TranslationMode.js';
import { Difficulty } from '../../domain/value-objects/Difficulty.js';
import { Category } from '../../domain/value-objects/Category.js';
import { SessionId } from '../../domain/value-objects/SessionId.js';
import { WordId } from '../../domain/value-objects/WordId.js';
import { RandomWordPicker } from '../../domain/services/RandomWordPicker.js';
import { IUseCase } from '../interfaces/IUseCase.js';
import { ILogger } from '../interfaces/ILogger.js';
import { GetRandomWordInput, GetRandomWordOutput } from '../dtos/index.js';

/**
 * Get Random Word Use Case
 * Fetches a random word for translation, tracking used words per session
 */
export class GetRandomWordUseCase
  implements IUseCase<GetRandomWordInput, GetRandomWordOutput, DomainError>
{
  constructor(
    private readonly wordRepository: IWordRepository,
    private readonly sessionRepository: ISessionRepository,
    private readonly randomPicker: RandomWordPicker,
    private readonly logger: ILogger
  ) {}

  execute(input: GetRandomWordInput): Result<GetRandomWordOutput, DomainError> {
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
    const availableWords = this.wordRepository.findByFilters(filters);

    if (availableWords.length === 0) {
      return Result.fail(
        new NoWordsAvailableError({
          category: category?.name,
          difficulty: difficulty?.value,
        })
      );
    }

    // 3. Get or create session
    const session = this.sessionRepository.findOrCreate(sessionId);

    // 4. Filter out used words
    const unusedWords = availableWords.filter(
      (word) => !session.hasUsedWord(word.id as unknown as WordId)
    );

    // 5. Reset session if all words used
    if (unusedWords.length === 0) {
      this.logger.debug('All words used, resetting session for filters', {
        sessionId: sessionId.value,
        wordCount: availableWords.length,
      });

      // Reset only words matching current filters
      session.resetWords(availableWords.map((w) => w.id as unknown as WordId));
      this.sessionRepository.save(session);

      // Recursive call with fresh session
      return this.execute(input);
    }

    // 6. Pick random word
    const selectedWord = this.randomPicker.pick(unusedWords);
    if (!selectedWord) {
      return Result.fail(new NoWordsAvailableError());
    }

    // 7. Mark word as used
    session.markWordAsUsed(selectedWord.id as unknown as WordId);
    this.sessionRepository.save(session);

    // 8. Log and return
    const duration = Date.now() - startTime;
    this.logger.info('Random word selected', {
      operation: 'GetRandomWord',
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
  }
}
