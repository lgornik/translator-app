import { IEventHandler } from "../../shared/events/IEventHandler.js";
import { DomainEvent } from "../../shared/events/DomainEvent.js";

/**
 * Logging Event Handler
 *
 * Loguje wszystkie eventy dla celów debugowania i audytu.
 * Ma priorytet 1 - wykonuje się jako pierwszy.
 *
 * W produkcji możesz wysyłać logi do:
 * - CloudWatch / Stackdriver
 * - Elasticsearch
 * - Sentry (dla błędów)
 */
export class LoggingEventHandler implements IEventHandler {
  readonly eventType = "*"; // Obsługuje wszystkie eventy
  readonly priority = 1; // Pierwszy

  constructor(
    private readonly logger: {
      info(message: string, meta?: unknown): void;
      debug(message: string, meta?: unknown): void;
    },
  ) {}

  async handle(event: DomainEvent): Promise<void> {
    this.logger.info(`[DOMAIN EVENT] ${event.eventType}`, {
      eventId: event.eventId,
      eventType: event.eventType,
      occurredAt: event.occurredAt.toISOString(),
      aggregateId: event.aggregateId,
      userId: event.userId,
      payload: event.toJSON(),
    });

    // W dev mode możesz też debugować
    if (process.env.NODE_ENV === "development") {
      this.logger.debug(`Event details:`, event.toJSON());
    }
  }
}

/**
 * UWAGA: Ten handler musi być zarejestrowany dla KAŻDEGO typu eventu.
 *
 * W rejestracji w DI container:
 * ```typescript
 * const loggingHandler = new LoggingEventHandler(logger);
 *
 * // Zarejestruj dla każdego typu eventu
 * ['AnswerSubmitted', 'SessionStarted', 'SessionCompleted', 'WordMarkedAsUsed', 'SessionReset']
 *   .forEach(eventType => {
 *     const handler = {
 *       ...loggingHandler,
 *       eventType, // Override eventType
 *     };
 *     eventBus.subscribe(handler);
 *   });
 * ```
 *
 * Lub lepiej: stwórz helper factory:
 */

export function createLoggingHandlers(
  logger: {
    info(message: string, meta?: unknown): void;
    debug(message: string, meta?: unknown): void;
  },
  eventTypes: string[],
): IEventHandler[] {
  return eventTypes.map((eventType) => ({
    eventType,
    priority: 1,
    handle: async (event: DomainEvent) => {
      logger.info(`[DOMAIN EVENT] ${event.eventType}`, {
        eventId: event.eventId,
        eventType: event.eventType,
        occurredAt: event.occurredAt.toISOString(),
        aggregateId: event.aggregateId,
        userId: event.userId,
        payload: event.toJSON(),
      });

      if (process.env.NODE_ENV === "development") {
        logger.debug(`Event details:`, event.toJSON());
      }
    },
  }));
}
