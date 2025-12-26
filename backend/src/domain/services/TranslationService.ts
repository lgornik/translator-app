import { Word } from '../entities/Word.js';
import { IWordRepository, WordFilters } from '../repositories/WordRepository.js';
import { TranslationMode, WordChallenge, TranslationResult, Difficulty } from '../../shared/types/index.js';
import { NotFoundError, NoWordsAvailableError } from '../../shared/errors/index.js';

/**
 * Session state for tracking used words
 * In production, this would be stored in Redis or similar
 */
export interface SessionState {
  usedWordIds: Set<string>;
}

/**
 * Translation service - core business logic
 */
export class TranslationService {
  private sessions: Map<string, SessionState> = new Map();

  constructor(private readonly wordRepository: IWordRepository) {}

  /**
   * Get a random word for translation
   */
  getRandomWord(
    mode: TranslationMode,
    filters: WordFilters = {},
    sessionId: string = 'default'
  ): WordChallenge {
    const availableWords = this.wordRepository.findByFilters(filters);

    if (availableWords.length === 0) {
      throw new NoWordsAvailableError({
        ...(filters.category && { category: filters.category }),
        ...(filters.difficulty && { difficulty: filters.difficulty }),
      });
    }

    const session = this.getOrCreateSession(sessionId);

    // Find unused words
    const unusedWords = availableWords.filter(
      (word) => !session.usedWordIds.has(word.id)
    );

    // Reset session if all words used
    if (unusedWords.length === 0) {
      this.resetSessionForFilters(sessionId, availableWords);
      return this.getRandomWord(mode, filters, sessionId);
    }

    // Pick random word
    const randomIndex = Math.floor(Math.random() * unusedWords.length);
    const word = unusedWords[randomIndex];

    if (!word) {
      throw new NoWordsAvailableError();
    }

    // Mark as used
    session.usedWordIds.add(word.id);

    return word.toChallenge(mode);
  }

  /**
   * Check user's translation
   */
  checkTranslation(
    wordId: string,
    userTranslation: string,
    mode: TranslationMode
  ): TranslationResult {
    const word = this.wordRepository.findById(wordId);

    if (!word) {
      throw new NotFoundError('Word', wordId);
    }

    const isCorrect = word.checkTranslation(userTranslation, mode);
    const correctTranslation = word.getCorrectTranslation(mode);

    return {
      isCorrect,
      correctTranslation,
      userTranslation,
    };
  }

  /**
   * Get all words
   */
  getAllWords(): Word[] {
    return this.wordRepository.findAll();
  }

  /**
   * Get words by category
   */
  getWordsByCategory(category: string): Word[] {
    return this.wordRepository.findByFilters({ category });
  }

  /**
   * Get available categories
   */
  getCategories(): string[] {
    return this.wordRepository.getCategories();
  }

  /**
   * Get available difficulties
   */
  getDifficulties(): Difficulty[] {
    return this.wordRepository.getDifficulties();
  }

  /**
   * Get word count with optional filters
   */
  getWordCount(filters: WordFilters = {}): number {
    return this.wordRepository.count(filters);
  }

  /**
   * Reset session (clear used words)
   */
  resetSession(sessionId: string = 'default'): boolean {
    this.sessions.delete(sessionId);
    return true;
  }

  /**
   * Get or create session state
   */
  private getOrCreateSession(sessionId: string): SessionState {
    let session = this.sessions.get(sessionId);
    
    if (!session) {
      session = { usedWordIds: new Set() };
      this.sessions.set(sessionId, session);
    }
    
    return session;
  }

  /**
   * Reset only words matching current filters
   */
  private resetSessionForFilters(sessionId: string, words: Word[]): void {
    const session = this.getOrCreateSession(sessionId);
    const wordIds = new Set(words.map((w) => w.id));
    
    for (const id of wordIds) {
      session.usedWordIds.delete(id);
    }
  }
}