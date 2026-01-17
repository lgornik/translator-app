import {
  IDomainEvent,
  IEventBus,
  IEventHandler,
} from "../../shared/core/DomainEvent.js";
import { ILogger } from "../../application/interfaces/ILogger.js";

/**
 * In-Memory Event Bus
 *
 * Good enough for single-instance deployment.
 * For multi-instance: swap to Redis Pub/Sub or proper message broker.
 */
export class InMemoryEventBus implements IEventBus {
  private handlers: Map<string, Set<IEventHandler>> = new Map();
  private eventLog: IDomainEvent[] = [];
  private readonly maxLogSize: number;

  constructor(
    private readonly logger: ILogger,
    options: { maxLogSize?: number } = {},
  ) {
    this.maxLogSize = options.maxLogSize ?? 10000;
  }

  async publish(events: IDomainEvent | IDomainEvent[]): Promise<void> {
    const eventArray = Array.isArray(events) ? events : [events];

    for (const event of eventArray) {
      // 1. Log the event (audit trail)
      this.logEvent(event);

      // 2. Notify all handlers
      const handlers = this.handlers.get(event.eventType) ?? new Set();
      const wildcardHandlers = this.handlers.get("*") ?? new Set();

      const allHandlers = new Set([...handlers, ...wildcardHandlers]);

      // Fire-and-forget with error isolation
      // In production: consider retry, dead-letter queue
      for (const handler of allHandlers) {
        this.safeHandle(handler, event);
      }

      this.logger.debug("Event published", {
        eventType: event.eventType,
        eventId: event.eventId,
        aggregateId: event.aggregateId,
        handlerCount: allHandlers.size,
      });
    }
  }

  subscribe<T extends IDomainEvent>(handler: IEventHandler<T>): void {
    for (const eventType of handler.eventTypes) {
      if (!this.handlers.has(eventType)) {
        this.handlers.set(eventType, new Set());
      }
      this.handlers.get(eventType)!.add(handler as IEventHandler);

      this.logger.info("Event handler subscribed", {
        eventTypes: handler.eventTypes,
        handlerName: handler.constructor.name,
      });
    }
  }

  unsubscribe(handler: IEventHandler): void {
    for (const eventType of handler.eventTypes) {
      this.handlers.get(eventType)?.delete(handler);
    }
  }

  /**
   * Get recent events (for debugging/monitoring)
   */
  getRecentEvents(limit: number = 100): IDomainEvent[] {
    return this.eventLog.slice(-limit);
  }

  /**
   * Get events by type
   */
  getEventsByType(eventType: string, limit: number = 100): IDomainEvent[] {
    return this.eventLog.filter((e) => e.eventType === eventType).slice(-limit);
  }

  /**
   * Get events for aggregate (useful for debugging)
   */
  getEventsForAggregate(aggregateId: string): IDomainEvent[] {
    return this.eventLog.filter((e) => e.aggregateId === aggregateId);
  }

  private logEvent(event: IDomainEvent): void {
    this.eventLog.push(event);

    // Prevent memory leak
    if (this.eventLog.length > this.maxLogSize) {
      this.eventLog = this.eventLog.slice(-this.maxLogSize / 2);
    }
  }

  private async safeHandle(
    handler: IEventHandler,
    event: IDomainEvent,
  ): Promise<void> {
    try {
      await handler.handle(event);
    } catch (error) {
      // Log but don't propagate - event handlers shouldn't break the main flow
      const err = error instanceof Error ? error : new Error(String(error));
      this.logger.error("Event handler failed", err, {
        handlerName: handler.constructor.name,
        eventType: event.eventType,
        eventId: event.eventId,
      });
    }
  }
}

// ============================================================================
// Example Event Handlers
// ============================================================================

/**
 * Analytics Event Handler
 * Tracks quiz performance metrics
 */
export class AnalyticsEventHandler implements IEventHandler {
  readonly eventTypes = [
    "quiz.translation_attempted",
    "quiz.completed",
    "session.created",
  ];

  private metrics = {
    totalAttempts: 0,
    correctAttempts: 0,
    quizzesCompleted: 0,
    sessionsCreated: 0,
  };

  constructor(private readonly logger: ILogger) {}

  async handle(event: IDomainEvent): Promise<void> {
    switch (event.eventType) {
      case "quiz.translation_attempted":
        this.metrics.totalAttempts++;
        if ((event.payload as { isCorrect: boolean }).isCorrect) {
          this.metrics.correctAttempts++;
        }
        break;

      case "quiz.completed":
        this.metrics.quizzesCompleted++;
        break;

      case "session.created":
        this.metrics.sessionsCreated++;
        break;
    }

    // In production: send to Prometheus, Datadog, etc.
    this.logger.debug("Analytics updated", { metrics: this.metrics });
  }

  getMetrics() {
    return {
      ...this.metrics,
      accuracy:
        this.metrics.totalAttempts > 0
          ? (
              (this.metrics.correctAttempts / this.metrics.totalAttempts) *
              100
            ).toFixed(1) + "%"
          : "N/A",
    };
  }
}

/**
 * Audit Log Event Handler
 * Persists all events for compliance/debugging
 */
export class AuditLogEventHandler implements IEventHandler {
  readonly eventTypes = ["*"]; // Subscribe to all events

  constructor(private readonly logger: ILogger) {}

  async handle(event: IDomainEvent): Promise<void> {
    // In production: write to append-only log, S3, or audit database
    this.logger.info("AUDIT", {
      eventId: event.eventId,
      eventType: event.eventType,
      aggregateId: event.aggregateId,
      occurredAt: event.occurredAt,
      payload: event.payload,
    });
  }
}

/**
 * Cache Invalidation Handler
 * Keeps caches fresh when data changes
 */
export class CacheInvalidationHandler implements IEventHandler {
  readonly eventTypes = ["session.word_used", "session.reset"];

  constructor(
    private readonly logger: ILogger,
    private readonly invalidateCache: () => void,
  ) {}

  async handle(event: IDomainEvent): Promise<void> {
    this.invalidateCache();

    this.logger.debug("Cache invalidated due to event", {
      eventType: event.eventType,
    });
  }
}
