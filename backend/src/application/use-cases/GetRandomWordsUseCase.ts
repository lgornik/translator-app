import { Result } from "../../shared/core/Result.js";
import { DomainError } from "../../shared/errors/DomainErrors.js";
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
import { ISessionMutex } from "../../infrastructure/persistence/SessionMutex.js";
import { IUseCase } from "../interfaces/IUseCase.js";

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

export class GetRandomWordsUseCase implements IUseCase<
  GetRandomWordsInput,
  GetRandomWordsOutput
> {
  private static readonly MAX_LIMIT = 100;
  private static readonly MIN_LIMIT = 1;

  constructor(
    private readonly wordRepository: IWordRepository,
    private readonly sessionRepository: ISessionRepository,
    private readonly randomPicker: RandomWordPicker,
    private readonly sessionMutex?: ISessionMutex,
  ) {}

  async execute(
    input: GetRandomWordsInput,
  ): Promise<Result<GetRandomWordsOutput, DomainError>> {
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

    // Validate limit with bounds
    const limit = Math.max(
      GetRandomWordsUseCase.MIN_LIMIT,
      Math.min(input.limit, GetRandomWordsUseCase.MAX_LIMIT),
    );

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
      return Result.ok({ words: [] });
    }

    // 3. Execute session operations with mutex lock to prevent race conditions
    const executeWithSession = async (): Promise<
      Result<GetRandomWordsOutput, DomainError>
    > => {
      // Get or create session
      const session = await this.sessionRepository.findOrCreate(sessionId);

      // Filter out used words
      let unusedWords = availableWords.filter(
        (word) => !session.hasUsedWord(word.id),
      );

      // If not enough unused words, reset session and use all
      if (unusedWords.length < limit && availableWords.length >= limit) {
        // Reset only words matching current filters
        session.resetWords(availableWords.map((w) => w.id));
        await this.sessionRepository.save(session);
        unusedWords = availableWords;
      }

      // Shuffle and pick words
      const shuffled = this.shuffleArray([...unusedWords]);
      const selectedWords = shuffled.slice(0, Math.min(limit, shuffled.length));

      // Mark all selected words as used
      for (const word of selectedWords) {
        session.markWordAsUsed(word.id);
      }
      await this.sessionRepository.save(session);

      // Transform to output format
      const words: RandomWordOutput[] = selectedWords.map((word) => ({
        id: word.id.toString(),
        wordToTranslate: word.getWordToTranslate(mode),
        correctTranslation: word.getCorrectTranslation(mode),
        mode: mode.toString(),
        category: word.category.name,
        difficulty: word.difficulty.value,
      }));

      return Result.ok({ words });
    };

    // Use mutex if available, otherwise execute directly
    if (this.sessionMutex) {
      return this.sessionMutex.withLock(
        sessionId.toString(),
        executeWithSession,
      );
    }

    return executeWithSession();
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
