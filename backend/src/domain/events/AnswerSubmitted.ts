import { BaseDomainEvent } from "../../shared/events/DomainEvent.js";

/**
 * Answer Submitted Event
 *
 * Wystepuje gdy użytkownik udzieli odpowiedzi na pytanie.
 *
 * Use cases:
 * - Dodanie punktów (jeśli poprawna)
 * - Update streak tracking
 * - Sprawdzenie achievements
 * - Aktualizacja statystyk
 * - Analytics tracking
 */
export class AnswerSubmitted extends BaseDomainEvent {
  constructor(
    public readonly sessionId: string,
    public readonly wordId: string,
    public readonly userId: string | null,
    public readonly isCorrect: boolean,
    public readonly userAnswer: string,
    public readonly correctAnswer: string,
    public readonly responseTimeMs?: number,
    metadata?: Record<string, unknown>,
  ) {
    super({
      eventType: "AnswerSubmitted",
      aggregateId: sessionId,
      userId: userId || undefined,
      metadata,
    });
  }

  protected getPayload(): Record<string, unknown> {
    return {
      sessionId: this.sessionId,
      wordId: this.wordId,
      userId: this.userId,
      isCorrect: this.isCorrect,
      userAnswer: this.userAnswer,
      correctAnswer: this.correctAnswer,
      responseTimeMs: this.responseTimeMs,
    };
  }

  /**
   * Helper - czy to poprawna odpowiedź?
   */
  get wasCorrect(): boolean {
    return this.isCorrect;
  }

  /**
   * Helper - czy to błędna odpowiedź?
   */
  get wasIncorrect(): boolean {
    return !this.isCorrect;
  }
}
