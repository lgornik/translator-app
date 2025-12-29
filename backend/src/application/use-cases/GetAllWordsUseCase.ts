import { Result } from '../../shared/core/Result.js';
import { DomainError } from '../../shared/errors/DomainErrors.js';
import { IWordRepository } from '../../domain/repositories/IWordRepository.js';
import { GetAllWordsOutput } from '../dtos/index.js';

/**
 * Get All Words Use Case
 * Returns all words in the dictionary
 */
export class GetAllWordsUseCase {
  constructor(private readonly wordRepository: IWordRepository) {}

  async execute(): Promise<Result<GetAllWordsOutput, DomainError>> {
    const words = await this.wordRepository.findAll();
    
    return Result.ok({
      words: words.map((word) => word.toData()),
    });
  }
}
