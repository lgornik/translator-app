import { BaseDomainEvent } from "../../shared/events/DomainEvent.js";

/**
 * Word Marked As Used Event
 *
 * Występuje gdy słowo zostaje oznaczone jako użyte w sesji.
 *
 * Use cases:
 * - Tracking popularności słów
 * - Spaced repetition algorithm
 * - Word difficulty adjustment
 * - Analytics - które słowa są najczęściej pokazywane
 */
export class WordMarkedAsUsed extends BaseDomainEvent {
  constructor(
    public readonly sessionId: string,
    public readonly wordId: string,
    public readonly userId: string | null,
    metadata?: Record<string, unknown>,
  ) {
    super({
      eventType: "WordMarkedAsUsed",
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
    };
  }
}
