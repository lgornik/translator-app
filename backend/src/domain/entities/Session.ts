import { Entity } from '../../shared/core/Entity.js';
import { SessionId } from '../value-objects/SessionId.js';
import { WordId } from '../value-objects/WordId.js';

/**
 * Session state data for persistence
 */
export interface SessionData {
  id: string;
  usedWordIds: string[];
  createdAt: string;
  lastAccessedAt: string;
}

/**
 * Session Entity
 * Tracks which words have been used in a quiz session
 */
export class Session extends Entity<SessionId> {
  private _usedWordIds: Set<string>;
  private readonly _createdAt: Date;
  private _lastAccessedAt: Date;

  private constructor(
    id: SessionId,
    usedWordIds: Set<string>,
    createdAt: Date,
    lastAccessedAt: Date
  ) {
    super(id);
    this._usedWordIds = usedWordIds;
    this._createdAt = createdAt;
    this._lastAccessedAt = lastAccessedAt;
  }

  // ============================================================================
  // Getters
  // ============================================================================

  get usedWordIds(): ReadonlySet<string> {
    return this._usedWordIds;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get lastAccessedAt(): Date {
    return this._lastAccessedAt;
  }

  get usedWordCount(): number {
    return this._usedWordIds.size;
  }

  // ============================================================================
  // Factory Methods
  // ============================================================================

  /**
   * Create a new session
   */
  static create(id: SessionId): Session {
    const now = new Date();
    return new Session(id, new Set(), now, now);
  }

  /**
   * Restore session from persisted data
   */
  static fromData(data: SessionData): Session {
    return new Session(
      SessionId.fromTrusted(data.id),
      new Set(data.usedWordIds),
      new Date(data.createdAt),
      new Date(data.lastAccessedAt)
    );
  }

  // ============================================================================
  // Commands
  // ============================================================================

  /**
   * Mark a word as used
   */
  markWordAsUsed(wordId: WordId): void {
    this._usedWordIds.add(wordId.value);
    this._lastAccessedAt = new Date();
  }

  /**
   * Check if a word has been used
   */
  hasUsedWord(wordId: WordId): boolean {
    return this._usedWordIds.has(wordId.value);
  }

  /**
   * Reset all used words
   */
  reset(): void {
    this._usedWordIds = new Set();
    this._lastAccessedAt = new Date();
  }

  /**
   * Reset only specific word IDs (for filter-based reset)
   */
  resetWords(wordIds: WordId[]): void {
    for (const wordId of wordIds) {
      this._usedWordIds.delete(wordId.value);
    }
    this._lastAccessedAt = new Date();
  }

  /**
   * Touch session (update last accessed time)
   */
  touch(): void {
    this._lastAccessedAt = new Date();
  }

  /**
   * Check if session is expired
   */
  isExpired(maxAgeMs: number): boolean {
    const age = Date.now() - this._lastAccessedAt.getTime();
    return age > maxAgeMs;
  }

  // ============================================================================
  // Serialization
  // ============================================================================

  /**
   * Convert to data for persistence
   */
  toData(): SessionData {
    return {
      id: this._id.value,
      usedWordIds: Array.from(this._usedWordIds),
      createdAt: this._createdAt.toISOString(),
      lastAccessedAt: this._lastAccessedAt.toISOString(),
    };
  }
}
