import { Result } from '../../shared/core/Result.js';
import {
  DomainError,
  NoWordsAvailableError,
} from '../../shared/errors/DomainErrors.js';
import { IWordRepository, WordFilters } from '../../domain/repositories/IWordRepository.js';
import { ISessionRepository } from '../../domain/repositories/ISessionRepository.js';
import { TranslationMode } from '../../domain/value-objects/TranslationMode.js';
import { Difficulty } from '../../domain/value-objects/Difficulty.js';
import { Category } from '../../domain/value-objects/Category.js';
import { SessionId } from '../../domain/value-objects/SessionId.js';
import { RandomWordPicker } from '../../domain/services/RandomWordPicker.js';
import { ILogger } from '../interfaces/ILogger.js';

/**
 * Input DTO for GetRandomWords use case
 */
export interface GetRandomWordsInput {
  mode: string;
  limit: number;
  category: string | null;
  difficulty: number | null;
  sessionId: string;
}

/**
 * Single word in output
 */
export interface RandomWordOutput {
  id: string;
  wordToTranslate: string;
  correctTranslation: string;
  mode: string;
  category: string;
  difficulty: number;
}

/**
 * Output DTO for GetRandomWords use case
 */
export interface GetRandomWordsOutput {
  words: RandomWordOutput[];
}

/**
 * Get Random Words Use Case
 * Fetches multiple random words for translation (batch loading for quiz pool)
 * Returns up to 'limit' words, may return fewer if not enough available
 */
export class GetRandomWordsUseCase {
  constructor(
    private readonly wordRepository: IWordRepository,
    private readonly sessionRepository: ISessionRepository,
    private readonly randomPicker: RandomWordPicker,
    private readonly logger: ILogger
  ) {}

  async execute(input: GetRandomWordsInput): Promise<Result<GetRandomWordsOutput, DomainError>> {
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

    // Validate limit
    const limit = Math.max(1, Math.min(input.limit, 100)); // Cap at 100

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
      // Return empty array instead of error - let frontend handle it
      this.logger.debug('No words available for filters', {
        category: category?.name,
        difficulty: difficulty?.value,
      });
      return Result.ok({ words: [] });
    }

    // 3. Get or create session
    const session = await this.sessionRepository.findOrCreate(sessionId);

    // 4. Filter out used words
    let unusedWords = availableWords.filter(
      (word) => !session.hasUsedWord(word.id)
    );

    // 5. If not enough unused words, reset session and use all
    if (unusedWords.length < limit && availableWords.length >= limit) {
      this.logger.debug('Not enough unused words, resetting session', {
        sessionId: sessionId.value,
        unusedCount: unusedWords.length,
        requestedLimit: limit,
        totalAvailable: availableWords.length,
      });

      // Reset only words matching current filters
      session.resetWords(availableWords.map((w) => w.id));
      await this.sessionRepository.save(session);
      
      unusedWords = availableWords;
    }

    // 6. Shuffle and pick words
    const shuffled = this.shuffleArray([...unusedWords]);
    const selectedWords = shuffled.slice(0, Math.min(limit, shuffled.length));

    // 7. Mark all selected words as used
    for (const word of selectedWords) {
      session.markWordAsUsed(word.id);
    }
    await this.sessionRepository.save(session);

    // 8. Transform to output format
    const words: RandomWordOutput[] = selectedWords.map(word => ({
      id: word.id.value,
      wordToTranslate: word.getWordToTranslate(mode),
      correctTranslation: word.getCorrectTranslation(mode),
      mode: mode.toString(),
      category: word.category.name,
      difficulty: word.difficulty.value,
    }));

    // 9. Log and return
    const duration = Date.now() - startTime;
    this.logger.info('Random words selected', {
      operation: 'GetRandomWords',
      sessionId: sessionId.value,
      requestedLimit: limit,
      returnedCount: words.length,
      duration,
    });

    return Result.ok({ words });
  }

  /**
   * Fisher-Yates shuffle algorithm
   */
  private shuffleArray<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = result[i]!;
        result[i] = result[j]!;
        result[j] = temp;
    }
    return result;
  }
}