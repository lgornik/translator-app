import { Result } from '../../shared/core/Result.js';
import { DomainError } from '../../shared/errors/DomainErrors.js';
import { IWordRepository, WordFilters } from '../../domain/repositories/IWordRepository.js';
import { Difficulty } from '../../domain/value-objects/Difficulty.js';
import { Category } from '../../domain/value-objects/Category.js';
import { GetWordCountInput, GetWordCountOutput } from '../dtos/index.js';

/**
 * Get Word Count Use Case
 * Returns the number of words matching given filters
 */
export class GetWordCountUseCase {
  constructor(private readonly wordRepository: IWordRepository) {}

  async execute(input: GetWordCountInput): Promise<Result<GetWordCountOutput, DomainError>> {
    // Parse optional filters
    let difficulty: Difficulty | null = null;
    if (input.difficulty !== null && input.difficulty !== undefined) {
      const diffResult = Difficulty.create(input.difficulty);
      if (!diffResult.ok) {
        return Result.fail(diffResult.error);
      }
      difficulty = diffResult.value;
    }

    let category: Category | null = null;
    if (input.category !== null && input.category !== undefined) {
      const catResult = Category.create(input.category);
      if (!catResult.ok) {
        return Result.fail(catResult.error);
      }
      category = catResult.value;
    }

    const filters: WordFilters = { category, difficulty };
    const count = await this.wordRepository.count(filters);

    return Result.ok({ count });
  }
}
