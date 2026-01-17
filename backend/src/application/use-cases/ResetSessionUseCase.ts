import { Result } from "../../shared/core/Result.js";
import { DomainError } from "../../shared/errors/DomainErrors.js";
import { ISessionRepository } from "../../domain/repositories/ISessionRepository.js";
import { SessionId } from "../../domain/value-objects/SessionId.js";
import { ResetSessionInput, ResetSessionOutput } from "../dtos/index.js";
import { IUseCase } from "../interfaces/IUseCase.js";

export class ResetSessionUseCase implements IUseCase<
  ResetSessionInput,
  ResetSessionOutput
> {
  constructor(private readonly sessionRepository: ISessionRepository) {}

  async execute(
    input: ResetSessionInput,
  ): Promise<Result<ResetSessionOutput, DomainError>> {
    const sessionIdResult = SessionId.create(input.sessionId);
    if (!sessionIdResult.ok) {
      return Result.fail(sessionIdResult.error);
    }
    const sessionId = sessionIdResult.value;

    await this.sessionRepository.delete(sessionId);

    return Result.ok({ success: true });
  }
}
