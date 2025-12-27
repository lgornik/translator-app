import { GraphQLContext } from './context.js';
import { Result } from '../../shared/core/Result.js';
import { DomainError } from '../../shared/errors/DomainErrors.js';
import { GraphQLError } from 'graphql';
import { config } from '../config/Config.js';

/**
 * Helper to convert Result to GraphQL response
 */
function handleResult<T>(result: Result<T, DomainError>): T {
  if (result.ok) {
    return result.value;
  }

  throw new GraphQLError(result.error.message, {
    extensions: {
      code: result.error.code,
      http: { status: result.error.httpStatus },
      details: result.error.details,
    },
  });
}

/**
 * Query Resolvers
 */
const queryResolvers = {
  info: (_: unknown, __: unknown, ctx: GraphQLContext) => ({
    name: config.api.name,
    version: config.api.version,
    status: 'ok',
    uptime: (Date.now() - ctx.startTime) / 1000,
  }),

  health: (_: unknown, __: unknown, ctx: GraphQLContext) => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: (Date.now() - ctx.startTime) / 1000,
    sessionCount: ctx.sessionRepository.count(),
    wordCount: ctx.wordRepository.count(),
  }),

  getRandomWord: (
    _: unknown,
    args: { mode: string; category?: string; difficulty?: number },
    ctx: GraphQLContext
  ) => {
    const result = ctx.getRandomWord.execute({
      mode: args.mode,
      category: args.category ?? null,
      difficulty: args.difficulty ?? null,
      sessionId: ctx.sessionId,
    });

    const output = handleResult(result);
    
    // Remove correctTranslation from response for security
    return {
      id: output.id,
      wordToTranslate: output.wordToTranslate,
      mode: output.mode,
      category: output.category,
      difficulty: output.difficulty,
    };
  },

  getAllWords: (_: unknown, __: unknown, ctx: GraphQLContext) => {
    const result = ctx.getAllWords.execute();
    return handleResult(result).words;
  },

  getCategories: (_: unknown, __: unknown, ctx: GraphQLContext) => {
    const result = ctx.getCategories.execute();
    return handleResult(result).categories;
  },

  getDifficulties: (_: unknown, __: unknown, ctx: GraphQLContext) => {
    const result = ctx.getDifficulties.execute();
    return handleResult(result).difficulties;
  },

  getWordCount: (
    _: unknown,
    args: { category?: string; difficulty?: number },
    ctx: GraphQLContext
  ) => {
    const result = ctx.getWordCount.execute({
      category: args.category ?? null,
      difficulty: args.difficulty ?? null,
    });

    return handleResult(result);
  },
};

/**
 * Mutation Resolvers
 */
const mutationResolvers = {
  checkTranslation: (
    _: unknown,
    args: { wordId: string; userTranslation: string; mode: string },
    ctx: GraphQLContext
  ) => {
    const result = ctx.checkTranslation.execute({
      wordId: args.wordId,
      userTranslation: args.userTranslation,
      mode: args.mode,
      sessionId: ctx.sessionId,
    });

    return handleResult(result);
  },

  resetSession: (_: unknown, __: unknown, ctx: GraphQLContext) => {
    const result = ctx.resetSession.execute({
      sessionId: ctx.sessionId,
    });

    return handleResult(result).success;
  },
};

/**
 * Combined Resolvers
 */
export const resolvers = {
  Query: queryResolvers,
  Mutation: mutationResolvers,
};