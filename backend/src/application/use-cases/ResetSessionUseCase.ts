import { Result } from '../../shared/core/Result.js';
import { DomainError } from '../../shared/errors/DomainErrors.js';
import { ISessionRepository } from '../../domain/repositories/ISessionRepository.js';
import { SessionId } from '../../domain/value-objects/SessionId.js';
import { ILogger } from '../interfaces/ILogger.js';
import { ResetSessionInput, ResetSessionOutput } from '../dtos/index.js';

/**
 * Reset Session Use Case
 * Clears all used words from a session
 */
export class ResetSessionUseCase {
  constructor(
    private readonly sessionRepository: ISessionRepository,
    private readonly logger: ILogger
  ) {}

  async execute(input: ResetSessionInput): Promise<Result<ResetSessionOutput, DomainError>> {
    const sessionIdResult = SessionId.create(input.sessionId);
    if (!sessionIdResult.ok) {
      return Result.fail(sessionIdResult.error);
    }
    const sessionId = sessionIdResult.value;

    const deleted = await this.sessionRepository.delete(sessionId);

    this.logger.info('Session reset', {
      operation: 'ResetSession',
      sessionId: sessionId.value,
      existed: deleted,
    });

    return Result.ok({ success: true });
  }
}
