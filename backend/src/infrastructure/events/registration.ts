import { Container } from "inversify";
import { IEventBus, InMemoryEventBus } from "../../shared/events/EventBus.js";
import { createLoggingHandlers } from "../../application/event-handlers/LoggingEventHandler.js";
import { SessionStatsHandler } from "../../application/event-handlers/SessionStatsHandler.js";
import {
  AnalyticsEventHandler,
  ConsoleAnalyticsService,
  IAnalyticsService,
} from "../../application/event-handlers/AnalyticsEventHandler.js";
import { ILogger } from "../../application/interfaces/ILogger.js";

/**
 * DI Tokens for Event System
 */
export const EVENT_DI_TOKENS = {
  EventBus: Symbol("IEventBus"),
  AnalyticsService: Symbol("IAnalyticsService"),

  // Event Handlers
  SessionStatsHandler: Symbol("SessionStatsHandler"),
  AnalyticsEventHandler: Symbol("AnalyticsEventHandler"),
};

/**
 * Register Event Bus and Handlers in DI Container
 *
 * Wywołaj to w infrastructure/di/registration.ts
 */
export function registerEventSystem(container: Container): void {
  // 1. Register Event Bus
  const logger = container.get<ILogger>(Symbol.for("ILogger"));

  const eventBus = new InMemoryEventBus({
    info: (msg, meta) => logger.info(msg, meta as any),
    error: (msg, meta) => logger.error(msg, meta as any),
  });

  container.bind<IEventBus>(EVENT_DI_TOKENS.EventBus).toConstantValue(eventBus);

  // 2. Register Analytics Service
  const analyticsService =
    process.env.NODE_ENV === "production"
      ? new ConsoleAnalyticsService() // TODO: Replace with real service
      : new ConsoleAnalyticsService();

  container
    .bind<IAnalyticsService>(EVENT_DI_TOKENS.AnalyticsService)
    .toConstantValue(analyticsService);

  // 3. Register Event Handlers
  registerEventHandlers(container, eventBus);

  logger.info("Event system registered", {
    handlers: eventBus.getStats().totalHandlers,
  });
}

/**
 * Register all event handlers
 */
function registerEventHandlers(
  container: Container,
  eventBus: IEventBus,
): void {
  const logger = container.get<ILogger>(Symbol.for("ILogger"));
  const analyticsService = container.get<IAnalyticsService>(
    EVENT_DI_TOKENS.AnalyticsService,
  );

  // 1. Logging Handlers (dla wszystkich eventów)
  const eventTypes = [
    "AnswerSubmitted",
    "SessionStarted",
    "SessionCompleted",
    "WordMarkedAsUsed",
    "SessionReset",
  ];

  const loggingHandlers = createLoggingHandlers(
    {
      info: (msg, meta) => logger.info(msg, meta as any),
      debug: (msg, meta) => logger.debug?.(msg, meta as any),
    },
    eventTypes,
  );

  loggingHandlers.forEach((handler) => eventBus.subscribe(handler));

  // 2. Session Stats Handler
  const sessionStatsHandler = new SessionStatsHandler({
    info: (msg, meta) => logger.info(msg, meta as any),
  });

  container
    .bind(EVENT_DI_TOKENS.SessionStatsHandler)
    .toConstantValue(sessionStatsHandler);

  sessionStatsHandler
    .getHandlers()
    .forEach((handler) => eventBus.subscribe(handler));

  // 3. Analytics Handler
  const analyticsHandler = new AnalyticsEventHandler(analyticsService, {
    error: (msg, meta) => logger.error(msg, meta as any),
  });

  container
    .bind(EVENT_DI_TOKENS.AnalyticsEventHandler)
    .toConstantValue(analyticsHandler);

  analyticsHandler
    .getHandlers()
    .forEach((handler) => eventBus.subscribe(handler));
}

/**
 * Example: How to add custom event handler
 *
 * ```typescript
 * // 1. Create handler
 * const myHandler: IEventHandler<AnswerSubmitted> = {
 *   eventType: 'AnswerSubmitted',
 *   priority: 100,
 *   async handle(event) {
 *     console.log('My custom logic', event);
 *   }
 * };
 *
 * // 2. Subscribe to event bus
 * const eventBus = container.get<IEventBus>(EVENT_DI_TOKENS.EventBus);
 * eventBus.subscribe(myHandler);
 * ```
 */
