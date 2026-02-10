import { IEventHandler } from "../../shared/events/IEventHandler.js";
import {
  AnswerSubmitted,
  SessionStarted,
  SessionCompleted,
} from "../../domain/events/index.js";

/**
 * Session Statistics Handler
 *
 * Śledzi statystyki sesji w czasie rzeczywistym.
 * Przydatne dla dashboardów i real-time analytics.
 *
 * W przyszłości możesz to rozbudować do:
 * - Zapisywania do osobnej tabeli statistics
 * - Publikowania na WebSocket (real-time dashboard)
 * - Wysyłania do Analytics (Google Analytics, Mixpanel)
 */

interface SessionStats {
  sessionId: string;
  userId: string | null;
  startedAt: Date;
  totalAnswers: number;
  correctAnswers: number;
  incorrectAnswers: number;
  currentStreak: number;
  longestStreak: number;
}

export class SessionStatsHandler {
  private stats: Map<string, SessionStats> = new Map();

  constructor(
    private readonly logger?: {
      info(message: string, meta?: unknown): void;
    },
  ) {}

  /**
   * Handler for SessionStarted
   */
  readonly onSessionStarted: IEventHandler<SessionStarted> = {
    eventType: "SessionStarted",
    priority: 50,
    handle: async (event: SessionStarted) => {
      this.stats.set(event.sessionId, {
        sessionId: event.sessionId,
        userId: event.userId,
        startedAt: event.occurredAt,
        totalAnswers: 0,
        correctAnswers: 0,
        incorrectAnswers: 0,
        currentStreak: 0,
        longestStreak: 0,
      });

      this.logger?.info(`Session stats initialized`, {
        sessionId: event.sessionId,
        userId: event.userId,
      });
    },
  };

  /**
   * Handler for AnswerSubmitted
   */
  readonly onAnswerSubmitted: IEventHandler<AnswerSubmitted> = {
    eventType: "AnswerSubmitted",
    priority: 50,
    handle: async (event: AnswerSubmitted) => {
      const stats = this.stats.get(event.sessionId);
      if (!stats) {
        // Session nie była zainicjalizowana - może to być restored session
        // Zignoruj lub zainicjalizuj z defaults
        return;
      }

      // Update stats
      stats.totalAnswers++;

      if (event.isCorrect) {
        stats.correctAnswers++;
        stats.currentStreak++;

        if (stats.currentStreak > stats.longestStreak) {
          stats.longestStreak = stats.currentStreak;
        }
      } else {
        stats.incorrectAnswers++;
        stats.currentStreak = 0;
      }

      this.logger?.info(`Session stats updated`, {
        sessionId: event.sessionId,
        totalAnswers: stats.totalAnswers,
        accuracy: this.calculateAccuracy(stats),
        currentStreak: stats.currentStreak,
      });
    },
  };

  /**
   * Handler for SessionCompleted
   */
  readonly onSessionCompleted: IEventHandler<SessionCompleted> = {
    eventType: "SessionCompleted",
    priority: 50,
    handle: async (event: SessionCompleted) => {
      const stats = this.stats.get(event.sessionId);
      if (!stats) {
        return;
      }

      const durationMs = event.stats.durationMs;
      const accuracy = this.calculateAccuracy(stats);

      this.logger?.info(`Session completed`, {
        sessionId: event.sessionId,
        userId: event.userId,
        duration: `${Math.round(durationMs / 1000)}s`,
        totalAnswers: stats.totalAnswers,
        accuracy: `${accuracy.toFixed(1)}%`,
        longestStreak: stats.longestStreak,
      });

      // Cleanup - usuń stats z pamięci
      this.stats.delete(event.sessionId);

      // TODO: Tutaj możesz zapisać finalne statystyki do bazy:
      // await this.sessionStatsRepository.save({
      //   sessionId: event.sessionId,
      //   userId: event.userId,
      //   ...stats,
      //   durationMs,
      //   accuracy,
      // });
    },
  };

  /**
   * Get all handlers as array (for easy registration)
   */
  getHandlers(): IEventHandler[] {
    return [
      this.onSessionStarted,
      this.onAnswerSubmitted,
      this.onSessionCompleted,
    ];
  }

  /**
   * Get current stats for session (for real-time display)
   */
  getSessionStats(sessionId: string): SessionStats | null {
    return this.stats.get(sessionId) || null;
  }

  /**
   * Calculate accuracy percentage
   */
  private calculateAccuracy(stats: SessionStats): number {
    if (stats.totalAnswers === 0) return 0;
    return (stats.correctAnswers / stats.totalAnswers) * 100;
  }
}
