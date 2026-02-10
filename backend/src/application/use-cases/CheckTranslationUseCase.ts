import { Result } from "../../shared/core/Result.js";
import {
  DomainError,
  NotFoundError,
} from "../../shared/errors/DomainErrors.js";
import { IWordRepository } from "../../domain/repositories/IWordRepository.js";
import { ISessionRepository } from "../../domain/repositories/ISessionRepository.js";
import { TranslationMode } from "../../domain/value-objects/TranslationMode.js";
import { WordId } from "../../domain/value-objects/WordId.js";
import { SessionId } from "../../domain/value-objects/SessionId.js";
import { TranslationChecker } from "../../domain/services/TranslationChecker.js";
import { AnswerSubmitted } from "../../domain/events/index.js";
import { CheckTranslationOutput } from "../dtos/index.js";
import { IUseCase } from "../interfaces/IUseCase.js";
import { IEventBus } from "../../shared/events/EventBus.js";

/**
 * Extended input with optional session tracking
 */
export interface CheckTranslationInputWithSession {
  wordId: string;
  userTranslation: string;
  mode: string;
  sessionId?: string;
  userId?: string;
  responseTimeMs?: number;
}

/**
 * Check Translation Use Case
 *
 * Sprawdza czy odpowiedź użytkownika jest poprawna.
 *
 * 🔥 NOWE: Emituje AnswerSubmitted event dla każdej odpowiedzi.
 */
export class CheckTranslationUseCase implements IUseCase<
  CheckTranslationInputWithSession,
  CheckTranslationOutput
> {
  constructor(
    private readonly wordRepository: IWordRepository,
    private readonly sessionRepository: ISessionRepository,
    private readonly translationChecker: TranslationChecker,
    private readonly eventBus: IEventBus,
  ) {}

  async execute(
    input: CheckTranslationInputWithSession,
  ): Promise<Result<CheckTranslationOutput, DomainError>> {
    // 1. Walidacja input
    const wordIdResult = WordId.create(input.wordId);
    if (!wordIdResult.ok) {
      return Result.fail(wordIdResult.error);
    }
    const wordId = wordIdResult.value;

    const modeResult = TranslationMode.create(input.mode);
    if (!modeResult.ok) {
      return Result.fail(modeResult.error);
    }
    const mode = modeResult.value;

    // 2. Find word
    const word = await this.wordRepository.findById(wordId);
    if (!word) {
      return Result.fail(NotFoundError.word(wordId.toString()));
    }

    // 3. Check translation using domain service
    const correctAnswer = word.getCorrectTranslation(mode);
    const checkResult = this.translationChecker.check(
      correctAnswer,
      input.userTranslation,
    );

    // 4. Update session if provided
    if (input.sessionId) {
      await this.updateSession(input.sessionId, wordId);
    }

    // 5. 🔥 Publish AnswerSubmitted event
    await this.publishAnswerEvent(
      input,
      wordId,
      checkResult.isCorrect,
      checkResult.correctTranslation,
      checkResult.userTranslation,
    );

    return Result.ok({
      isCorrect: checkResult.isCorrect,
      correctTranslation: checkResult.correctTranslation,
      userTranslation: checkResult.userTranslation,
    });
  }

  /**
   * Update session with used word
   */
  private async updateSession(
    sessionIdString: string,
    wordId: WordId,
  ): Promise<void> {
    const sessionIdResult = SessionId.create(sessionIdString);
    if (!sessionIdResult.ok) {
      return; // Ignore invalid session ID
    }

    const sessionId = sessionIdResult.value;
    const session = await this.sessionRepository.findById(sessionId);

    if (session) {
      // Mark word as used
      session.markWordAsUsed(wordId);

      // 🔥 Session emituje WordMarkedAsUsed event
      // Wyciągnij i opublikuj eventy
      await this.publishAggregateEvents(session);

      // Save session
      await this.sessionRepository.save(session);
    }
  }

  /**
   * Publish AnswerSubmitted event
   */
  private async publishAnswerEvent(
    input: CheckTranslationInputWithSession,
    wordId: WordId,
    isCorrect: boolean,
    correctAnswer: string,
    userAnswer: string,
  ): Promise<void> {
    const event = new AnswerSubmitted(
      input.sessionId || "anonymous",
      wordId.toString(),
      input.userId || null,
      isCorrect,
      userAnswer,
      correctAnswer,
      input.responseTimeMs,
      {
        source: "CheckTranslationUseCase",
      },
    );

    await this.eventBus.publish(event);
  }

  /**
   * Helper: Publish all domain events from aggregate
   *
   * Ten pattern będzie używany we wszystkich Use Cases.
   */
  private async publishAggregateEvents(aggregate: any): Promise<void> {
    if (!aggregate.hasDomainEvents || !aggregate.hasDomainEvents()) {
      return;
    }

    const events = aggregate.domainEvents;

    // Publish każdy event
    for (const event of events) {
      await this.eventBus.publish(event);
    }

    // Clear events po publikacji
    aggregate.clearDomainEvents();
  }
}
