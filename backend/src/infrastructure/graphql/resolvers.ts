import { GraphQLContext } from "./context.js";
import { Result } from "../../shared/core/Result.js";
import { DomainError } from "../../shared/errors/DomainErrors.js";
import { config } from "../config/Config.js";
import { toApiResponse } from "../../application/dtos/index.js";

function getErrorTypename(code: string): string {
  switch (code) {
    case "NOT_FOUND":
      return "NotFoundError";
    case "VALIDATION_ERROR":
      return "ValidationError";
    case "RATE_LIMIT_ERROR":
      return "RateLimitError";
    case "SESSION_ERROR":
      return "SessionError";
    default:
      return "ValidationError";
  }
}

/**
 * Convert domain error to GraphQL error type
 */
function toGraphQLError(error: DomainError): Record<string, unknown> {
  const base = {
    __typename: getErrorTypename(error.code),
    code: error.code,
    message: error.message,
  };

  // Add type-specific fields
  switch (error.code) {
    case "NOT_FOUND":
      return {
        ...base,
        resourceType: error.details?.resourceType ?? "unknown",
      };
    case "RATE_LIMIT_ERROR":
      return { ...base, retryAfter: error.details?.retryAfter ?? 60 };
    case "VALIDATION_ERROR":
      return { ...base, field: error.details?.field ?? null };
    default:
      return base;
  }
}

/**
 * Helper to convert Result to union type response
 */
function handleResultUnion<T>(
  result: Result<T, DomainError>,
  successTypename: string,
): Record<string, unknown> {
  if (result.ok) {
    return { __typename: successTypename, ...(result.value as object) };
  }
  return toGraphQLError(result.error);
}

/**
 * Health check status type
 */
type HealthStatus = "healthy" | "degraded" | "unhealthy";

/**
 * Dependency health check result
 */
interface DependencyHealth {
  name: string;
  status: HealthStatus;
  latencyMs?: number;
  error?: string;
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

  health: async (_: unknown, __: unknown, ctx: GraphQLContext) => {
    const dependencies: DependencyHealth[] = [];
    let overallStatus: HealthStatus = "healthy";

    // Check word repository
    const wordRepoStart = Date.now();
    try {
      const wordCount = await ctx.wordRepository.count();
      dependencies.push({
        name: "wordRepository",
        status: wordCount > 0 ? "healthy" : "degraded",
        latencyMs: Date.now() - wordRepoStart,
      });
      if (wordCount === 0) {
        overallStatus = "degraded";
      }
    } catch (error) {
      dependencies.push({
        name: "wordRepository",
        status: "unhealthy",
        latencyMs: Date.now() - wordRepoStart,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      overallStatus = "unhealthy";
    }

    // Check session repository
    const sessionRepoStart = Date.now();
    try {
      dependencies.push({
        name: "sessionRepository",
        status: "healthy",
        latencyMs: Date.now() - sessionRepoStart,
      });
    } catch (error) {
      dependencies.push({
        name: "sessionRepository",
        status: "unhealthy",
        latencyMs: Date.now() - sessionRepoStart,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      overallStatus = "unhealthy";
    }

    // Check database if available
    if (ctx.checkDatabase) {
      const dbHealth = await ctx.checkDatabase();
      dependencies.push({
        name: "database",
        status: dbHealth.ok ? "healthy" : "unhealthy",
        latencyMs: dbHealth.latency,
        error: dbHealth.error,
      });
      if (!dbHealth.ok && overallStatus === "healthy") {
        overallStatus = "degraded";
      }
    }

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: (Date.now() - ctx.startTime) / 1000,
      version: config.api.version,
      dependencies,
      sessionCount: await ctx.sessionRepository.count().catch(() => -1),
      wordCount: await ctx.wordRepository.count().catch(() => -1),
    };
  },

  /**
   * Get random word - returns union type
   */
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

    if (result.ok) {
      return {
        __typename: "WordChallenge",
        ...toApiResponse(result.value),
      };
    }
    return toGraphQLError(result.error);
  },

  /**
   * Get random words (batch) - returns union type
   */
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

    if (result.ok) {
      return {
        __typename: "WordChallengeList",
        words: result.value.words.map(toApiResponse),
        count: result.value.words.length,
      };
    }
    return toGraphQLError(result.error);
  },

  getAllWords: async (_: unknown, __: unknown, ctx: GraphQLContext) => {
    const result = await ctx.getAllWords.execute();
    if (result.ok) {
      return result.value.words;
    }
    return [];
  },

  getCategories: async (_: unknown, __: unknown, ctx: GraphQLContext) => {
    const result = await ctx.getCategories.execute();
    if (result.ok) {
      return result.value.categories;
    }
    return [];
  },

  getDifficulties: async (_: unknown, __: unknown, ctx: GraphQLContext) => {
    const result = await ctx.getDifficulties.execute();
    if (result.ok) {
      return result.value.difficulties;
    }
    return [];
  },

  /**
   * Get word count - returns union type
   */
  getWordCount: async (
    _: unknown,
    args: { category?: string; difficulty?: number },
    ctx: GraphQLContext,
  ) => {
    const result = await ctx.getWordCount.execute({
      category: args.category ?? null,
      difficulty: args.difficulty ?? null,
    });

    return handleResultUnion(result, "WordCount");
  },
};

/**
 * Mutation Resolvers
 */
const mutationResolvers = {
  /**
   * Check translation - returns union type
   */
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

    return handleResultUnion(result, "TranslationResult");
  },

  /**
   * Reset session - returns union type
   */
  resetSession: async (_: unknown, __: unknown, ctx: GraphQLContext) => {
    const result = await ctx.resetSession.execute({
      sessionId: ctx.sessionId,
    });

    if (result.ok) {
      return {
        __typename: "ResetSessionSuccess",
        success: true,
        message: "Session reset successfully",
      };
    }
    return toGraphQLError(result.error);
  },
};

/**
 * Union Type Resolvers
 * GraphQL needs these to determine which type in a union was returned
 */
const unionResolvers = {
  GetRandomWordResult: {
    __resolveType(obj: { __typename?: string }) {
      return obj.__typename ?? "WordChallenge";
    },
  },
  GetRandomWordsResult: {
    __resolveType(obj: { __typename?: string }) {
      return obj.__typename ?? "WordChallengeList";
    },
  },
  CheckTranslationResult: {
    __resolveType(obj: { __typename?: string }) {
      return obj.__typename ?? "TranslationResult";
    },
  },
  ResetSessionResult: {
    __resolveType(obj: { __typename?: string }) {
      return obj.__typename ?? "ResetSessionSuccess";
    },
  },
  GetWordCountResult: {
    __resolveType(obj: { __typename?: string }) {
      return obj.__typename ?? "WordCount";
    },
  },
};

/**
 * Combined Resolvers
 */
export const resolvers = {
  Query: queryResolvers,
  Mutation: mutationResolvers,
  ...unionResolvers,
};
