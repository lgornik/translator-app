import { Result } from '../../shared/core/Result.js';
import { DomainError } from '../../shared/errors/DomainErrors.js';

/**
 * Base Use Case interface
 * All use cases implement this interface
 */
export interface IUseCase<TInput, TOutput, TError extends DomainError = DomainError> {
  execute(input: TInput): Result<TOutput, TError> | Promise<Result<TOutput, TError>>;
}

/**
 * Use Case without input
 */
export interface IUseCaseNoInput<TOutput, TError extends DomainError = DomainError> {
  execute(): Result<TOutput, TError> | Promise<Result<TOutput, TError>>;
}

/**
 * Use Case context - shared dependencies
 */
export interface UseCaseContext {
  requestId?: string;
  userId?: string;
  sessionId?: string;
}
