import { GetRandomWordUseCase } from '../../application/use-cases/GetRandomWordUseCase.js';
import { CheckTranslationUseCase } from '../../application/use-cases/CheckTranslationUseCase.js';
import { GetWordCountUseCase } from '../../application/use-cases/GetWordCountUseCase.js';
import { GetCategoriesUseCase } from '../../application/use-cases/GetCategoriesUseCase.js';
import { GetDifficultiesUseCase } from '../../application/use-cases/GetDifficultiesUseCase.js';
import { ResetSessionUseCase } from '../../application/use-cases/ResetSessionUseCase.js';
import { GetAllWordsUseCase } from '../../application/use-cases/GetAllWordsUseCase.js';
import { IWordRepository } from '../../domain/repositories/IWordRepository.js';
import { ISessionRepository } from '../../domain/repositories/ISessionRepository.js';
import { ILogger } from '../../application/interfaces/ILogger.js';
import { RandomWordPicker } from '../../domain/services/RandomWordPicker.js';
import { TranslationChecker } from '../../domain/services/TranslationChecker.js';

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
  checkTranslation: CheckTranslationUseCase;
  getWordCount: GetWordCountUseCase;
  getCategories: GetCategoriesUseCase;
  getDifficulties: GetDifficultiesUseCase;
  resetSession: ResetSessionUseCase;
  getAllWords: GetAllWordsUseCase;

  // Repositories (for health checks)
  wordRepository: IWordRepository;
  sessionRepository: ISessionRepository;

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
}

/**
 * Create GraphQL context for a request
 */
export function createContext(
  deps: ContextDependencies,
  requestId: string,
  sessionId: string
): GraphQLContext {
  const { wordRepository, sessionRepository, logger, startTime } = deps;

  // Create child logger with request context
  const requestLogger = logger.child({ requestId, sessionId });

  // Create domain services
  const randomPicker = new RandomWordPicker();
  const translationChecker = new TranslationChecker();

  return {
    requestId,
    sessionId,

    getRandomWord: new GetRandomWordUseCase(
      wordRepository,
      sessionRepository,
      randomPicker,
      requestLogger
    ),
    checkTranslation: new CheckTranslationUseCase(
      wordRepository,
      translationChecker,
      requestLogger
    ),
    getWordCount: new GetWordCountUseCase(wordRepository),
    getCategories: new GetCategoriesUseCase(wordRepository),
    getDifficulties: new GetDifficultiesUseCase(wordRepository),
    resetSession: new ResetSessionUseCase(sessionRepository, requestLogger),
    getAllWords: new GetAllWordsUseCase(wordRepository),

    wordRepository,
    sessionRepository,
    logger: requestLogger,
    startTime,
  };
}
