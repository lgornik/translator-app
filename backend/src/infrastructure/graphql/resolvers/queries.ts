import { TranslationService } from '../../../domain/services/TranslationService.js';
import { TranslationMode, Difficulty } from '../../../shared/types/index.js';
import { config } from '../../../config/index.js';

/**
 * GraphQL context type
 */
export interface GraphQLContext {
  translationService: TranslationService;
  sessionId: string;
}

/**
 * Input type for getRandomWord query
 */
export interface GetRandomWordInput {
  mode: keyof typeof TranslationMode;
  category?: string | null;
  difficulty?: number | null;
}

/**
 * Input type for getWordCount query
 */
export interface GetWordCountInput {
  category?: string | null;
  difficulty?: number | null;
}

/**
 * Map GraphQL enum to internal enum
 */
const mapMode = (mode: keyof typeof TranslationMode): TranslationMode => {
  return TranslationMode[mode];
};

/**
 * Map difficulty number to enum
 */
const mapDifficulty = (difficulty: number | null | undefined): Difficulty | null => {
  if (difficulty === null || difficulty === undefined) return null;
  return difficulty as Difficulty;
};

/**
 * Build WordFilters object, excluding undefined values
 */
const buildFilters = (
  category: string | null | undefined,
  difficulty: Difficulty | null
) => {
  return {
    ...(category !== undefined && { category }),
    ...(difficulty !== undefined && { difficulty }),
  };
};

/**
 * Query resolvers
 */
export const queryResolvers = {
  /**
   * Get API information
   */
  info: () => ({
    name: config.api.name,
    version: config.api.version,
    status: 'ok',
  }),

  /**
   * Get a random word for translation
   */
  getRandomWord: (
    _parent: unknown,
    args: GetRandomWordInput,
    context: GraphQLContext
  ) => {
    const { translationService, sessionId } = context;
    const mode = mapMode(args.mode);
    const difficulty = mapDifficulty(args.difficulty);

    return translationService.getRandomWord(
      mode,
      buildFilters(args.category, difficulty),
      sessionId
    );
  },

  /**
   * Get all words in the dictionary
   */
  getAllWords: (_parent: unknown, _args: unknown, context: GraphQLContext) => {
    const { translationService } = context;
    return translationService.getAllWords().map((word) => word.toJSON());
  },

  /**
   * Get all available categories
   */
  getCategories: (_parent: unknown, _args: unknown, context: GraphQLContext) => {
    const { translationService } = context;
    return translationService.getCategories();
  },

  /**
   * Get all available difficulty levels
   */
  getDifficulties: (_parent: unknown, _args: unknown, context: GraphQLContext) => {
    const { translationService } = context;
    return translationService.getDifficulties();
  },

  /**
   * Get count of words matching filters
   */
  getWordCount: (
    _parent: unknown,
    args: GetWordCountInput,
    context: GraphQLContext
  ) => {
    const { translationService } = context;
    const difficulty = mapDifficulty(args.difficulty);

    return {
      count: translationService.getWordCount(
        buildFilters(args.category, difficulty)
      ),
    };
  },
};