import { Result } from '../../shared/core/Result.js';
import { DomainError } from '../../shared/errors/DomainErrors.js';
import { IWordRepository } from '../../domain/repositories/IWordRepository.js';
import { GetCategoriesOutput } from '../dtos/index.js';

/**
 * Get Categories Use Case
 * Returns all available word categories
 */
export class GetCategoriesUseCase {
  constructor(private readonly wordRepository: IWordRepository) {}

  async execute(): Promise<Result<GetCategoriesOutput, DomainError>> {
    const categories = await this.wordRepository.getCategories();
    
    return Result.ok({
      categories: categories.map((cat) => cat.name),
    });
  }
}
