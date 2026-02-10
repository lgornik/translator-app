import { BaseDomainEvent } from "../../shared/events/DomainEvent.js";

/**
 * Session Started Event
 *
 * Występuje gdy użytkownik rozpoczyna nową sesję quizu.
 *
 * Use cases:
 * - Tracking liczby rozpoczętych sesji
 * - Analytics - peak hours
 * - User activity monitoring
 */
export class SessionStarted extends BaseDomainEvent {
  constructor(
    public readonly sessionId: string,
    public readonly userId: string | null,
    public readonly filters?: {
      category?: string;
      difficulty?: number;
      mode?: string;
    },
    metadata?: Record<string, unknown>,
  ) {
    super({
      eventType: "SessionStarted",
      aggregateId: sessionId,
      userId: userId || undefined,
      metadata,
    });
  }

  protected getPayload(): Record<string, unknown> {
    return {
      sessionId: this.sessionId,
      userId: this.userId,
      filters: this.filters,
    };
  }
}
