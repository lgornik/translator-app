import { DomainEvent } from "./DomainEvent.js";
import { IEventHandler, hasPriority } from "./IEventHandler.js";

/**
 * Event Bus Interface
 *
 * Odpowiada za publikację eventów i dystrybucję do handlerów.
 */
export interface IEventBus {
  /**
   * Opublikuj event - asynchronicznie powiadomi wszystkich handlerów
   */
  publish(event: DomainEvent): Promise<void>;

  /**
   * Zarejestruj handler dla określonego typu eventu
   */
  subscribe(handler: IEventHandler): void;

  /**
   * Wyrejestruj handler
   */
  unsubscribe(handler: IEventHandler): void;

  /**
   * Wyczyść wszystkie handlery (przydatne w testach)
   */
  clear(): void;

  /**
   * Pobierz statystyki event bus
   */
  getStats(): EventBusStats;
}

/**
 * Event Bus Statistics
 */
export interface EventBusStats {
  totalHandlers: number;
  handlersByEventType: Record<string, number>;
  publishedEventsCount: number;
  failedEventsCount: number;
}

/**
 * In-Memory Event Bus Implementation
 *
 * Prosta implementacja dla single-instance aplikacji.
 * Dla multi-instance użyj RabbitMQ, Kafka, lub Redis Pub/Sub.
 */
export class InMemoryEventBus implements IEventBus {
  private handlers: Map<string, IEventHandler[]> = new Map();
  private stats = {
    publishedEventsCount: 0,
    failedEventsCount: 0,
  };

  constructor(
    private readonly logger?: {
      info(message: string, meta?: unknown): void;
      error(message: string, meta?: unknown): void;
    },
  ) {}

  async publish(event: DomainEvent): Promise<void> {
    this.stats.publishedEventsCount++;

    const eventHandlers = this.handlers.get(event.eventType) || [];

    if (eventHandlers.length === 0) {
      this.logger?.info(`No handlers for event: ${event.eventType}`, {
        eventId: event.eventId,
      });
      return;
    }

    this.logger?.info(
      `Publishing event: ${event.eventType} to ${eventHandlers.length} handler(s)`,
      {
        eventId: event.eventId,
        eventType: event.eventType,
        handlersCount: eventHandlers.length,
      },
    );

    // Sortuj handlery według priorytetu
    const sortedHandlers = this.sortByPriority(eventHandlers);

    // Wykonaj handlery asynchronicznie
    // WAŻNE: Używamy Promise.allSettled zamiast Promise.all
    // żeby błąd w jednym handlerze nie blokował pozostałych
    const results = await Promise.allSettled(
      sortedHandlers.map((handler) => this.executeHandler(handler, event)),
    );

    // Loguj błędy
    results.forEach((result, index) => {
      if (result.status === "rejected") {
        this.stats.failedEventsCount++;
        const handler = sortedHandlers[index];
        this.logger?.error(
          `Event handler failed: ${handler?.constructor.name}`,
          {
            eventId: event.eventId,
            eventType: event.eventType,
            error: result.reason,
          },
        );
      }
    });
  }

  subscribe(handler: IEventHandler): void {
    const eventType = handler.eventType;
    const existing = this.handlers.get(eventType) || [];

    // Sprawdź czy już nie jest zarejestrowany
    if (existing.includes(handler)) {
      this.logger?.info(
        `Handler already subscribed: ${handler.constructor.name}`,
        { eventType },
      );
      return;
    }

    existing.push(handler);
    this.handlers.set(eventType, existing);

    this.logger?.info(`Handler subscribed: ${handler.constructor.name}`, {
      eventType,
      totalHandlers: existing.length,
    });
  }

  unsubscribe(handler: IEventHandler): void {
    const eventType = handler.eventType;
    const existing = this.handlers.get(eventType) || [];
    const filtered = existing.filter((h) => h !== handler);

    if (filtered.length === existing.length) {
      this.logger?.info(
        `Handler not found for unsubscribe: ${handler.constructor.name}`,
        { eventType },
      );
      return;
    }

    this.handlers.set(eventType, filtered);

    this.logger?.info(`Handler unsubscribed: ${handler.constructor.name}`, {
      eventType,
      remainingHandlers: filtered.length,
    });
  }

  clear(): void {
    const totalHandlers = Array.from(this.handlers.values()).reduce(
      (sum, handlers) => sum + handlers.length,
      0,
    );

    this.handlers.clear();
    this.stats.publishedEventsCount = 0;
    this.stats.failedEventsCount = 0;

    this.logger?.info(`Event bus cleared`, { clearedHandlers: totalHandlers });
  }

  getStats(): EventBusStats {
    const handlersByEventType: Record<string, number> = {};
    let totalHandlers = 0;

    for (const [eventType, handlers] of this.handlers.entries()) {
      handlersByEventType[eventType] = handlers.length;
      totalHandlers += handlers.length;
    }

    return {
      totalHandlers,
      handlersByEventType,
      publishedEventsCount: this.stats.publishedEventsCount,
      failedEventsCount: this.stats.failedEventsCount,
    };
  }

  /**
   * Sortuj handlery według priorytetu (niższy = wcześniej)
   */
  private sortByPriority(handlers: IEventHandler[]): IEventHandler[] {
    return [...handlers].sort((a, b) => {
      const priorityA = hasPriority(a) ? a.priority! : 100;
      const priorityB = hasPriority(b) ? b.priority! : 100;
      return priorityA - priorityB;
    });
  }

  /**
   * Wykonaj handler z timeout i error handling
   */
  private async executeHandler(
    handler: IEventHandler,
    event: DomainEvent,
  ): Promise<void> {
    const startTime = Date.now();

    try {
      // Timeout po 30 sekundach (konfigurowalne)
      await this.withTimeout(handler.handle(event), 30000);

      const duration = Date.now() - startTime;
      this.logger?.info(`Handler executed: ${handler.constructor.name}`, {
        eventType: event.eventType,
        eventId: event.eventId,
        duration: `${duration}ms`,
      });
    } catch (error) {
      // intentional no-op
    }
  }

  /**
   * Wrapper dla timeout
   */
  private withTimeout<T>(
    promise: Promise<T> | T,
    timeoutMs: number,
  ): Promise<T> {
    // Jeśli handler zwraca void (synchroniczny), od razu resolve
    if (!(promise instanceof Promise)) {
      return Promise.resolve(promise);
    }

    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(
          () => reject(new Error(`Handler timeout after ${timeoutMs}ms`)),
          timeoutMs,
        ),
      ),
    ]);
  }
}

/**
 * Null Event Bus - dla testów lub wyłączenia eventów
 */
export class NullEventBus implements IEventBus {
  async publish(_event: DomainEvent): Promise<void> {
    // No-op
  }

  subscribe(_handler: IEventHandler): void {
    // No-op
  }

  unsubscribe(_handler: IEventHandler): void {
    // No-op
  }

  clear(): void {
    // No-op
  }

  getStats(): EventBusStats {
    return {
      totalHandlers: 0,
      handlersByEventType: {},
      publishedEventsCount: 0,
      failedEventsCount: 0,
    };
  }
}
