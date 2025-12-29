import { Result } from '../../shared/core/Result.js';
import { DomainError } from '../../shared/errors/DomainErrors.js';
import { IWordRepository } from '../../domain/repositories/IWordRepository.js';
import { GetDifficultiesOutput } from '../dtos/index.js';

/**
 * Get Difficulties Use Case
 * Returns all available difficulty levels
 */
export class GetDifficultiesUseCase {
  constructor(private readonly wordRepository: IWordRepository) {}

  async execute(): Promise<Result<GetDifficultiesOutput, DomainError>> {
    const difficulties = await this.wordRepository.getDifficulties();
    
    return Result.ok({
      difficulties: difficulties.map((d) => d.value),
    });
  }
}
