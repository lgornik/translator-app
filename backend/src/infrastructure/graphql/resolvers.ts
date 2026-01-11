import { GraphQLContext } from "./context.js";
import { Result } from "../../shared/core/Result.js";
import { DomainError } from "../../shared/errors/DomainErrors.js";
import { GraphQLError } from "graphql";
import { config } from "../config/Config.js";
import { toApiResponse } from "../../application/dtos/index.js";

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
  info: async (_: unknown, __: unknown, ctx: GraphQLContext) => ({
    name: config.api.name,
    version: config.api.version,
    status: "ok",
    uptime: (Date.now() - ctx.startTime) / 1000,
  }),

  health: async (_: unknown, __: unknown, ctx: GraphQLContext) => ({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: (Date.now() - ctx.startTime) / 1000,
    sessionCount: await ctx.sessionRepository.count(),
    wordCount: await ctx.wordRepository.count(),
  }),

  getRandomWord: async (
    _: unknown,
    args: { mode: string; category?: string; difficulty?: number },
    ctx: GraphQLContext,
  ) => {
    const result = await ctx.getRandomWord.execute({
      mode: args.mode,
      category: args.category ?? null,
      difficulty: args.difficulty ?? null,
      sessionId: ctx.sessionId,
    });

    const output = handleResult(result);

    // Use DTO function to strip correctTranslation
    return toApiResponse(output);
  },

  // NOWY RESOLVER - pobieranie wielu słów naraz
  getRandomWords: async (
    _: unknown,
    args: {
      mode: string;
      limit: number;
      category?: string;
      difficulty?: number;
    },
    ctx: GraphQLContext,
  ) => {
    const result = await ctx.getRandomWords.execute({
      mode: args.mode,
      limit: args.limit,
      category: args.category ?? null,
      difficulty: args.difficulty ?? null,
      sessionId: ctx.sessionId,
    });

    const output = handleResult(result);

    // Use DTO function to strip correctTranslation from each word
    return output.words.map(toApiResponse);
  },

  getAllWords: async (_: unknown, __: unknown, ctx: GraphQLContext) => {
    const result = await ctx.getAllWords.execute();
    return handleResult(result).words;
  },

  getCategories: async (_: unknown, __: unknown, ctx: GraphQLContext) => {
    const result = await ctx.getCategories.execute();
    return handleResult(result).categories;
  },

  getDifficulties: async (_: unknown, __: unknown, ctx: GraphQLContext) => {
    const result = await ctx.getDifficulties.execute();
    return handleResult(result).difficulties;
  },

  getWordCount: async (
    _: unknown,
    args: { category?: string; difficulty?: number },
    ctx: GraphQLContext,
  ) => {
    const result = await ctx.getWordCount.execute({
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
  checkTranslation: async (
    _: unknown,
    args: { wordId: string; userTranslation: string; mode: string },
    ctx: GraphQLContext,
  ) => {
    const result = await ctx.checkTranslation.execute({
      wordId: args.wordId,
      userTranslation: args.userTranslation,
      mode: args.mode,
      sessionId: ctx.sessionId,
    });

    return handleResult(result);
  },

  resetSession: async (_: unknown, __: unknown, ctx: GraphQLContext) => {
    const result = await ctx.resetSession.execute({
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
