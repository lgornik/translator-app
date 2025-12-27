import { Result } from '../../shared/core/Result.js';
import { DomainError } from '../../shared/errors/DomainErrors.js';
import { IWordRepository } from '../../domain/repositories/IWordRepository.js';
import { IUseCaseNoInput } from '../interfaces/IUseCase.js';
import { GetDifficultiesOutput } from '../dtos/index.js';

/**
 * Get Difficulties Use Case
 * Returns all available difficulty levels
 */
export class GetDifficultiesUseCase
  implements IUseCaseNoInput<GetDifficultiesOutput, DomainError>
{
  constructor(private readonly wordRepository: IWordRepository) {}

  execute(): Result<GetDifficultiesOutput, DomainError> {
    const difficulties = this.wordRepository.getDifficulties();
    
    return Result.ok({
      difficulties: difficulties.map((d) => d.value),
    });
  }
}
