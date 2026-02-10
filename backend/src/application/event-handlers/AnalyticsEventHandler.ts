import { IEventHandler } from "../../shared/events/IEventHandler.js";
import {
  AnswerSubmitted,
  SessionCompleted,
  SessionStarted,
} from "../../domain/events/index.js";

/**
 * Analytics Service Interface
 *
 * Abstrakcja dla różnych providerów analytics:
 * - Google Analytics
 * - Mixpanel
 * - Amplitude
 * - Custom analytics
 */
export interface IAnalyticsService {
  track(eventName: string, properties: Record<string, unknown>): Promise<void>;
  identify(userId: string, traits: Record<string, unknown>): Promise<void>;
}

/**
 * Analytics Event Handler
 *
 * Wysyła eventy domenowe do systemu analytics.
 * Priorytet 1000 - wykonuje się jako ostatni (analytics nie blokuje logiki biznesowej).
 */
export class AnalyticsEventHandler {
  constructor(
    private readonly analyticsService: IAnalyticsService,
    private readonly logger?: {
      error(message: string, meta?: unknown): void;
    },
  ) {}

  /**
   * Handler for SessionStarted
   */
  readonly onSessionStarted: IEventHandler<SessionStarted> = {
    eventType: "SessionStarted",
    priority: 1000, // Ostatni - nie blokuj innych handlerów
    handle: async (event: SessionStarted) => {
      try {
        await this.analyticsService.track("Quiz Session Started", {
          sessionId: event.sessionId,
          userId: event.userId,
          filters: event.filters,
          timestamp: event.occurredAt.toISOString(),
        });
      } catch (error) {
        // NIE rzucaj błędu - analytics failure nie powinien crashować aplikacji
        this.logger?.error("Analytics tracking failed", {
          event: "SessionStarted",
          error,
        });
      }
    },
  };

  /**
   * Handler for AnswerSubmitted
   */
  readonly onAnswerSubmitted: IEventHandler<AnswerSubmitted> = {
    eventType: "AnswerSubmitted",
    priority: 1000,
    handle: async (event: AnswerSubmitted) => {
      try {
        await this.analyticsService.track("Answer Submitted", {
          sessionId: event.sessionId,
          wordId: event.wordId,
          userId: event.userId,
          isCorrect: event.isCorrect,
          responseTimeMs: event.responseTimeMs,
          timestamp: event.occurredAt.toISOString(),
        });
      } catch (error) {
        this.logger?.error("Analytics tracking failed", {
          event: "AnswerSubmitted",
          error,
        });
      }
    },
  };

  /**
   * Handler for SessionCompleted
   */
  readonly onSessionCompleted: IEventHandler<SessionCompleted> = {
    eventType: "SessionCompleted",
    priority: 1000,
    handle: async (event: SessionCompleted) => {
      try {
        await this.analyticsService.track("Quiz Session Completed", {
          sessionId: event.sessionId,
          userId: event.userId,
          totalQuestions: event.stats.totalQuestions,
          correctAnswers: event.stats.correctAnswers,
          accuracy: event.stats.accuracy,
          durationSeconds: Math.round(event.stats.durationMs / 1000),
          wasPerfect: event.wasPerfect,
          wasSuccessful: event.wasSuccessful,
          timestamp: event.occurredAt.toISOString(),
        });
      } catch (error) {
        this.logger?.error("Analytics tracking failed", {
          event: "SessionCompleted",
          error,
        });
      }
    },
  };

  /**
   * Get all handlers
   */
  getHandlers(): IEventHandler[] {
    return [
      this.onSessionStarted,
      this.onAnswerSubmitted,
      this.onSessionCompleted,
    ];
  }
}

/**
 * Mock Analytics Service (dla developmentu)
 */
export class ConsoleAnalyticsService implements IAnalyticsService {
  async track(
    eventName: string,
    properties: Record<string, unknown>,
  ): Promise<void> {
    console.log(`[ANALYTICS] ${eventName}`, properties);
  }

  async identify(
    userId: string,
    traits: Record<string, unknown>,
  ): Promise<void> {
    console.log(`[ANALYTICS] Identify user: ${userId}`, traits);
  }
}

/**
 * Null Analytics Service (dla testów)
 */
export class NullAnalyticsService implements IAnalyticsService {
  async track(): Promise<void> {
    // No-op
  }

  async identify(): Promise<void> {
    // No-op
  }
}
