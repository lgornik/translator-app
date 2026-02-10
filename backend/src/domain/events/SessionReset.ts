import { BaseDomainEvent } from "../../shared/events/DomainEvent.js";

/**
 * Session Reset Event
 *
 * Występuje gdy użytkownik resetuje sesję (zaczyna od nowa).
 *
 * Use cases:
 * - Tracking reset frequency (czy użytkownicy się frustrują?)
 * - Analytics - w którym momencie najczęściej resetują
 * - User behavior patterns
 */
export class SessionReset extends BaseDomainEvent {
  constructor(
    public readonly sessionId: string,
    public readonly userId: string | null,
    public readonly previousStats: {
      usedWordsCount: number;
      // Możesz dodać więcej danych o stanie przed resetem
    },
    metadata?: Record<string, unknown>,
  ) {
    super({
      eventType: "SessionReset",
      aggregateId: sessionId,
      userId: userId || undefined,
      metadata,
    });
  }

  protected getPayload(): Record<string, unknown> {
    return {
      sessionId: this.sessionId,
      userId: this.userId,
      previousStats: this.previousStats,
    };
  }
}
