import { TranslationMode } from '../../../shared/types/index.js';
import { GraphQLContext } from './queries.js';

/**
 * Input type for checkTranslation mutation
 */
interface CheckTranslationInput {
  wordId: string;
  userTranslation: string;
  mode: keyof typeof TranslationMode;
}

/**
 * Map GraphQL enum to internal enum
 */
const mapMode = (mode: keyof typeof TranslationMode): TranslationMode => {
  return TranslationMode[mode];
};

/**
 * Mutation resolvers
 */
export const mutationResolvers = {
  /**
   * Check if a translation is correct
   */
  checkTranslation: (
    _parent: unknown,
    args: CheckTranslationInput,
    context: GraphQLContext
  ) => {
    const { translationService } = context;
    const mode = mapMode(args.mode);

    return translationService.checkTranslation(
      args.wordId,
      args.userTranslation,
      mode
    );
  },

  /**
   * Reset the current session
   */
  resetSession: (
    _parent: unknown,
    _args: unknown,
    context: GraphQLContext
  ) => {
    const { translationService, sessionId } = context;
    return translationService.resetSession(sessionId);
  },
};
