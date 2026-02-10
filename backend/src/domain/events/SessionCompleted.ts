import { BaseDomainEvent } from "../../shared/events/DomainEvent.js";

/**
 * Session Completed Event
 *
 * Występuje gdy użytkownik kończy sesję quizu.
 *
 * Use cases:
 * - Obliczenie finalnego wyniku
 * - Przyznanie nagród/achievements
 * - Update leaderboard
 * - Send completion notification
 * - Update user statistics
 */
export class SessionCompleted extends BaseDomainEvent {
  constructor(
    public readonly sessionId: string,
    public readonly userId: string | null,
    public readonly stats: {
      totalQuestions: number;
      correctAnswers: number;
      incorrectAnswers: number;
      accuracy: number; // 0-100%
      durationMs: number;
      wordsUsed: string[]; // IDs użytych słów
    },
    metadata?: Record<string, unknown>,
  ) {
    super({
      eventType: "SessionCompleted",
      aggregateId: sessionId,
      userId: userId || undefined,
      metadata,
    });
  }

  protected getPayload(): Record<string, unknown> {
    return {
      sessionId: this.sessionId,
      userId: this.userId,
      ...this.stats,
    };
  }

  /**
   * Helper - czy sesja była udana (>= 70% accuracy)?
   */
  get wasSuccessful(): boolean {
    return this.stats.accuracy >= 70;
  }

  /**
   * Helper - czy to perfect score (100%)?
   */
  get wasPerfect(): boolean {
    return this.stats.accuracy === 100;
  }

  /**
   * Helper - średni czas na pytanie w ms
   */
  get averageTimePerQuestion(): number {
    return this.stats.totalQuestions > 0
      ? this.stats.durationMs / this.stats.totalQuestions
      : 0;
  }
}
