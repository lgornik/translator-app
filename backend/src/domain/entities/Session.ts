import { AggregateRoot } from "../../shared/core/AggregateRoot.js";
import { SessionId } from "../value-objects/SessionId.js";
import { WordId } from "../value-objects/WordId.js";
import {
  SessionStarted,
  WordMarkedAsUsed,
  SessionReset,
  SessionCompleted,
} from "../events/index.js";

/**
 * Session state data for persistence
 */
export interface SessionData {
  id: string;
  usedWordIds: string[];
  createdAt: string;
  lastAccessedAt: string;
  userId?: string | null;
}

/**
 * Session Entity (Aggregate Root)
 *
 * Tracks which words have been used in a quiz session.
 * Now emits Domain Events for important state changes.
 */
export class Session extends AggregateRoot<SessionId> {
  private _usedWordIds: Set<string>;
  private readonly _createdAt: Date;
  private _lastAccessedAt: Date;
  private readonly _userId: string | null;

  private constructor(
    id: SessionId,
    usedWordIds: Set<string>,
    createdAt: Date,
    lastAccessedAt: Date,
    userId: string | null = null,
  ) {
    super(id);
    this._usedWordIds = usedWordIds;
    this._createdAt = createdAt;
    this._lastAccessedAt = lastAccessedAt;
    this._userId = userId;
  }

  // ============================================================================
  // Getters
  // ============================================================================

  get id(): SessionId {
    // ← DODAJ TO!
    return this._id;
  }

  get usedWordIds(): ReadonlySet<string> {
    return this._usedWordIds;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get lastAccessedAt(): Date {
    return this._lastAccessedAt;
  }

  get userId(): string | null {
    return this._userId;
  }

  get usedWordCount(): number {
    return this._usedWordIds.size;
  }

  // ============================================================================
  // Factory Methods
  // ============================================================================

  /**
   * Create a new session
   *
   * 🔥 EMITS: SessionStarted
   */
  static create(id: SessionId, userId: string | null = null): Session {
    const now = new Date();
    const session = new Session(id, new Set(), now, now, userId);

    // 🔥 Emit event
    session.addDomainEvent(
      new SessionStarted(id.toString(), userId, undefined, {
        source: "Session.create",
      }),
    );

    return session;
  }

  /**
   * Restore session from persisted data
   *
   * NOTE: NIE emituje eventu - to restore z bazy
   */
  static fromData(data: SessionData): Session {
    return new Session(
      SessionId.fromTrusted(data.id),
      new Set(data.usedWordIds),
      new Date(data.createdAt),
      new Date(data.lastAccessedAt),
      data.userId || null,
    );
  }

  // ============================================================================
  // Commands (emitują eventy)
  // ============================================================================

  /**
   * Mark a word as used
   *
   * 🔥 EMITS: WordMarkedAsUsed
   */
  markWordAsUsed(wordId: WordId): void {
    // Invariant: nie dodawaj duplicates
    if (this._usedWordIds.has(wordId.value)) {
      return; // Już użyte, nie emituj eventu
    }

    this._usedWordIds.add(wordId.value);
    this._lastAccessedAt = new Date();

    // 🔥 Emit event
    this.addDomainEvent(
      new WordMarkedAsUsed(
        this.id.toString(),
        wordId.toString(),
        this._userId,
        {
          source: "Session.markWordAsUsed",
          totalUsedWords: this._usedWordIds.size,
        },
      ),
    );
  }

  /**
   * Check if a word has been used
   */
  hasUsedWord(wordId: WordId): boolean {
    return this._usedWordIds.has(wordId.value);
  }

  /**
   * Reset all used words
   *
   * 🔥 EMITS: SessionReset
   */
  reset(): void {
    const previousCount = this._usedWordIds.size;

    this._usedWordIds = new Set();
    this._lastAccessedAt = new Date();

    // 🔥 Emit event
    this.addDomainEvent(
      new SessionReset(
        this.id.toString(),
        this._userId,
        {
          usedWordsCount: previousCount,
        },
        {
          source: "Session.reset",
        },
      ),
    );
  }

  /**
   * Reset only specific word IDs (for filter-based reset)
   *
   * 🔥 EMITS: SessionReset (if any words removed)
   */
  resetWords(wordIds: WordId[]): void {
    const previousCount = this._usedWordIds.size;

    for (const wordId of wordIds) {
      this._usedWordIds.delete(wordId.value);
    }

    this._lastAccessedAt = new Date();

    // Emit tylko jeśli coś się zmieniło
    if (this._usedWordIds.size !== previousCount) {
      this.addDomainEvent(
        new SessionReset(
          this.id.toString(),
          this._userId,
          {
            usedWordsCount: previousCount,
          },
          {
            source: "Session.resetWords",
            removedCount: previousCount - this._usedWordIds.size,
          },
        ),
      );
    }
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

  /**
   * Complete session with statistics
   *
   * 🔥 EMITS: SessionCompleted
   *
   * @param stats - Final session statistics
   */
  complete(stats: {
    totalQuestions: number;
    correctAnswers: number;
    incorrectAnswers: number;
    durationMs: number;
  }): void {
    const accuracy =
      stats.totalQuestions > 0
        ? (stats.correctAnswers / stats.totalQuestions) * 100
        : 0;

    // 🔥 Emit event
    this.addDomainEvent(
      new SessionCompleted(
        this.id.toString(),
        this._userId,
        {
          ...stats,
          accuracy,
          wordsUsed: Array.from(this._usedWordIds),
        },
        {
          source: "Session.complete",
        },
      ),
    );
  }

  // ============================================================================
  // Serialization
  // ============================================================================

  /**
   * Convert to data for persistence
   */
  toData(): SessionData {
    return {
      id: this.id.toString(),
      usedWordIds: Array.from(this._usedWordIds),
      createdAt: this._createdAt.toISOString(),
      lastAccessedAt: this._lastAccessedAt.toISOString(),
      userId: this._userId,
    };
  }
}
