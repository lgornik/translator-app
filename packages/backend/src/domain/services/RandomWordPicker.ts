import { Word } from '../entities/Word.js';

/**
 * Random Word Picker - Domain Service
 * Handles the logic of randomly selecting a word
 * Separated to allow easy mocking in tests
 */
export class RandomWordPicker {
  /**
   * Pick a random word from the provided list
   * Returns null if list is empty
   */
  pick(words: Word[]): Word | null {
    if (words.length === 0) {
      return null;
    }

    const randomIndex = Math.floor(Math.random() * words.length);
    return words[randomIndex] ?? null;
  }

  /**
   * Pick N random words from the provided list
   * Returns up to N words if list has fewer items
   */
  pickMany(words: Word[], count: number): Word[] {
    if (words.length === 0 || count <= 0) {
      return [];
    }

    const shuffled = this.shuffle([...words]);
    return shuffled.slice(0, count);
  }

  /**
   * Fisher-Yates shuffle algorithm
   */
  private shuffle<T>(array: T[]): T[] {
    const result = [...array];
    
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j]!, result[i]!];
    }

    return result;
  }
}

/**
 * Seeded Random Word Picker - For testing
 * Allows deterministic random selection
 */
export class SeededRandomWordPicker extends RandomWordPicker {
  private seed: number;

  constructor(seed: number) {
    super();
    this.seed = seed;
  }

  override pick(words: Word[]): Word | null {
    if (words.length === 0) {
      return null;
    }

    const index = this.nextInt(words.length);
    return words[index] ?? null;
  }

  private nextInt(max: number): number {
    // Simple seeded random using LCG
    this.seed = (this.seed * 1103515245 + 12345) & 0x7fffffff;
    return this.seed % max;
  }
}
