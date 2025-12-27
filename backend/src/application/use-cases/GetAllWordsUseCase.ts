import { Result } from '../../shared/core/Result.js';
import { DomainError } from '../../shared/errors/DomainErrors.js';
import { IWordRepository } from '../../domain/repositories/IWordRepository.js';
import { IUseCaseNoInput } from '../interfaces/IUseCase.js';
import { GetAllWordsOutput } from '../dtos/index.js';

/**
 * Get All Words Use Case
 * Returns all words in the dictionary
 */
export class GetAllWordsUseCase
  implements IUseCaseNoInput<GetAllWordsOutput, DomainError>
{
  constructor(private readonly wordRepository: IWordRepository) {}

  execute(): Result<GetAllWordsOutput, DomainError> {
    const words = this.wordRepository.findAll();
    
    return Result.ok({
      words: words.map((word) => word.toData()),
    });
  }
}
