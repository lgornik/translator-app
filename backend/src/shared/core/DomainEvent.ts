import { randomUUID } from "crypto";

/**
 * Base interface for all domain events
 */
export interface IDomainEvent {
  readonly eventId: string;
  readonly eventType: string;
  readonly aggregateId: string;
  readonly aggregateType: string;
  readonly occurredAt: Date;
  readonly payload: Record<string, unknown>;
}

/**
 * Abstract base class for domain events
 */
export abstract class DomainEvent implements IDomainEvent {
  readonly eventId: string;
  readonly occurredAt: Date;

  abstract readonly eventType: string;
  abstract readonly aggregateId: string;
  abstract readonly aggregateType: string;
  abstract readonly payload: Record<string, unknown>;

  constructor() {
    this.eventId = randomUUID();
    this.occurredAt = new Date();
  }

  /**
   * Serialize for persistence/messaging
   */
  toJSON(): Record<string, unknown> {
    return {
      eventId: this.eventId,
      eventType: this.eventType,
      aggregateId: this.aggregateId,
      aggregateType: this.aggregateType,
      occurredAt: this.occurredAt.toISOString(),
      payload: this.payload,
    };
  }
}

// ============================================================================
// Session Domain Events
// ============================================================================

export class SessionCreatedEvent extends DomainEvent {
  readonly eventType = "session.created" as const;
  readonly aggregateType = "Session" as const;

  constructor(
    readonly aggregateId: string,
    readonly payload: { createdAt: string },
  ) {
    super();
  }
}

export class WordUsedEvent extends DomainEvent {
  readonly eventType = "session.word_used" as const;
  readonly aggregateType = "Session" as const;

  constructor(
    readonly aggregateId: string,
    readonly payload: {
      wordId: string;
      totalUsedCount: number;
    },
  ) {
    super();
  }
}

export class SessionResetEvent extends DomainEvent {
  readonly eventType = "session.reset" as const;
  readonly aggregateType = "Session" as const;

  constructor(
    readonly aggregateId: string,
    readonly payload: {
      wordsCleared: number;
      resetType: "full" | "partial";
    },
  ) {
    super();
  }
}

export class SessionExpiredEvent extends DomainEvent {
  readonly eventType = "session.expired" as const;
  readonly aggregateType = "Session" as const;

  constructor(
    readonly aggregateId: string,
    readonly payload: {
      lastAccessedAt: string;
      totalWordsUsed: number;
    },
  ) {
    super();
  }
}

// ============================================================================
// Quiz Domain Events
// ============================================================================

export class TranslationAttemptedEvent extends DomainEvent {
  readonly eventType = "quiz.translation_attempted" as const;
  readonly aggregateType = "Quiz" as const;

  constructor(
    readonly aggregateId: string, // sessionId
    readonly payload: {
      wordId: string;
      mode: "EN_TO_PL" | "PL_TO_EN";
      isCorrect: boolean;
      responseTimeMs?: number;
    },
  ) {
    super();
  }
}

export class QuizCompletedEvent extends DomainEvent {
  readonly eventType = "quiz.completed" as const;
  readonly aggregateType = "Quiz" as const;

  constructor(
    readonly aggregateId: string,
    readonly payload: {
      totalWords: number;
      correctCount: number;
      incorrectCount: number;
      durationMs: number;
      mode: "EN_TO_PL" | "PL_TO_EN";
      category?: string;
      difficulty?: number;
    },
  ) {
    super();
  }
}

// ============================================================================
// Event Types Union (for type-safe handlers)
// ============================================================================

export type SessionEvent =
  | SessionCreatedEvent
  | WordUsedEvent
  | SessionResetEvent
  | SessionExpiredEvent;

export type QuizEvent = TranslationAttemptedEvent | QuizCompletedEvent;

export type AnyDomainEvent = SessionEvent | QuizEvent;

// ============================================================================
// Event Handler Interface
// ============================================================================

export interface IEventHandler<T extends IDomainEvent = IDomainEvent> {
  readonly eventTypes: string[];
  handle(event: T): Promise<void>;
}

// ============================================================================
// Event Bus Interface
// ============================================================================

export interface IEventBus {
  publish(events: IDomainEvent | IDomainEvent[]): Promise<void>;
  subscribe<T extends IDomainEvent>(handler: IEventHandler<T>): void;
  unsubscribe(handler: IEventHandler): void;
}
