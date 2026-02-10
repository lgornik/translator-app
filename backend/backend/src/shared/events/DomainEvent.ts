/**
 * Domain Event
 *
 * Reprezentuje fakt biznesowy, który zaszedł w domenie.
 * Eventy są immutable i zawierają wszystkie dane potrzebne handlerom.
 *
 * Naming convention: Czas przeszły (AnswerSubmitted, SessionStarted)
 * bo event reprezentuje coś co JUŻ SIĘ STAŁO.
 */
export interface DomainEvent {
  /**
   * Unikalny identyfikator eventu
   */
  readonly eventId: string;

  /**
   * Nazwa typu eventu (np. "AnswerSubmitted")
   */
  readonly eventType: string;

  /**
   * Kiedy event wystąpił
   */
  readonly occurredAt: Date;

  /**
   * Opcjonalny: ID agregatu który wygenerował event
   */
  readonly aggregateId?: string;

  /**
   * Opcjonalny: Wersja agregatu (dla Event Sourcing w przyszłości)
   */
  readonly aggregateVersion?: number;

  /**
   * Opcjonalny: ID użytkownika związanego z eventem
   */
  readonly userId?: string;

  /**
   * Metadata - dodatkowe dane techniczne
   */
  readonly metadata?: Record<string, unknown>;
}

/**
 * Helper do tworzenia eventów
 */
export abstract class BaseDomainEvent implements DomainEvent {
  public readonly eventId: string;
  public readonly eventType: string;
  public readonly occurredAt: Date;
  public readonly aggregateId?: string;
  public readonly aggregateVersion?: number;
  public readonly userId?: string;
  public readonly metadata?: Record<string, unknown>;

  constructor(props: {
    eventType: string;
    aggregateId?: string;
    aggregateVersion?: number;
    userId?: string;
    metadata?: Record<string, unknown>;
  }) {
    this.eventId = this.generateEventId();
    this.eventType = props.eventType;
    this.occurredAt = new Date();
    this.aggregateId = props.aggregateId;
    this.aggregateVersion = props.aggregateVersion;
    this.userId = props.userId;
    this.metadata = props.metadata;
  }

  private generateEventId(): string {
    // Proste UUID v4 (możesz użyć biblioteki uuid)
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  /**
   * Convert to plain object (for logging, persistence)
   */
  toJSON(): Record<string, unknown> {
    return {
      eventId: this.eventId,
      eventType: this.eventType,
      occurredAt: this.occurredAt.toISOString(),
      aggregateId: this.aggregateId,
      aggregateVersion: this.aggregateVersion,
      userId: this.userId,
      metadata: this.metadata,
      ...this.getPayload(),
    };
  }

  /**
   * Subclasses override to provide event-specific data
   */
  protected abstract getPayload(): Record<string, unknown>;
}
