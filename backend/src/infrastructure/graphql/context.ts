import { GetRandomWordUseCase } from "../../application/use-cases/GetRandomWordUseCase.js";
import { GetRandomWordsUseCase } from "../../application/use-cases/GetRandomWordsUseCase.js";
import { CheckTranslationUseCase } from "../../application/use-cases/CheckTranslationUseCase.js";
import { GetWordCountUseCase } from "../../application/use-cases/GetWordCountUseCase.js";
import { GetCategoriesUseCase } from "../../application/use-cases/GetCategoriesUseCase.js";
import { GetDifficultiesUseCase } from "../../application/use-cases/GetDifficultiesUseCase.js";
import { ResetSessionUseCase } from "../../application/use-cases/ResetSessionUseCase.js";
import { GetAllWordsUseCase } from "../../application/use-cases/GetAllWordsUseCase.js";
import { IWordRepository } from "../../domain/repositories/IWordRepository.js";
import { ISessionRepository } from "../../domain/repositories/ISessionRepository.js";
import { ILogger } from "../../application/interfaces/ILogger.js";
import { RandomWordPicker } from "../../domain/services/RandomWordPicker.js";
import { TranslationChecker } from "../../domain/services/TranslationChecker.js";

/**
 * GraphQL Context
 * Contains all dependencies needed by resolvers
 */
export interface GraphQLContext {
  // Request metadata
  requestId: string;
  sessionId: string;

  // Use Cases
  getRandomWord: GetRandomWordUseCase;
  getRandomWords: GetRandomWordsUseCase;
  checkTranslation: CheckTranslationUseCase;
  getWordCount: GetWordCountUseCase;
  getCategories: GetCategoriesUseCase;
  getDifficulties: GetDifficultiesUseCase;
  resetSession: ResetSessionUseCase;
  getAllWords: GetAllWordsUseCase;

  // Repositories (for health checks)
  wordRepository: IWordRepository;
  sessionRepository: ISessionRepository;

  // Health check function
  checkDatabase?: () => Promise<{
    ok: boolean;
    latency?: number;
    error?: string;
  }>;

  // Logger
  logger: ILogger;

  // Server start time (for uptime)
  startTime: number;
}

/**
 * Dependencies needed to create context
 */
export interface ContextDependencies {
  wordRepository: IWordRepository;
  sessionRepository: ISessionRepository;
  logger: ILogger;
  startTime: number;
  checkDatabase?: () => Promise<{
    ok: boolean;
    latency?: number;
    error?: string;
  }>;
}

export function createContext(
  deps: ContextDependencies,
  requestId: string,
  sessionId: string,
): GraphQLContext {
  const {
    wordRepository,
    sessionRepository,
    logger,
    startTime,
    checkDatabase,
  } = deps;

  // Create child logger with request context
  const requestLogger = logger.child
    ? logger.child({ requestId, sessionId })
    : logger;

  // Create domain services
  const randomPicker = new RandomWordPicker();
  const translationChecker = new TranslationChecker();

  return {
    requestId,
    sessionId,

    // Use Cases without logger - pure business logic
    getRandomWord: new GetRandomWordUseCase(
      wordRepository,
      sessionRepository,
      randomPicker,
    ),
    getRandomWords: new GetRandomWordsUseCase(
      wordRepository,
      sessionRepository,
      randomPicker,
    ),
    checkTranslation: new CheckTranslationUseCase(
      wordRepository,
      translationChecker,
    ),
    getWordCount: new GetWordCountUseCase(wordRepository),
    getCategories: new GetCategoriesUseCase(wordRepository),
    getDifficulties: new GetDifficultiesUseCase(wordRepository),
    resetSession: new ResetSessionUseCase(sessionRepository),
    getAllWords: new GetAllWordsUseCase(wordRepository),

    wordRepository,
    sessionRepository,
    checkDatabase,
    logger: requestLogger,
    startTime,
  };
}
