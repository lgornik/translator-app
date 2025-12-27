import { Result } from '../../shared/core/Result.js';
import { DomainError } from '../../shared/errors/DomainErrors.js';
import { IWordRepository } from '../../domain/repositories/IWordRepository.js';
import { IUseCaseNoInput } from '../interfaces/IUseCase.js';
import { GetCategoriesOutput } from '../dtos/index.js';

/**
 * Get Categories Use Case
 * Returns all available word categories
 */
export class GetCategoriesUseCase
  implements IUseCaseNoInput<GetCategoriesOutput, DomainError>
{
  constructor(private readonly wordRepository: IWordRepository) {}

  execute(): Result<GetCategoriesOutput, DomainError> {
    const categories = this.wordRepository.getCategories();
    
    return Result.ok({
      categories: categories.map((cat) => cat.name),
    });
  }
}
