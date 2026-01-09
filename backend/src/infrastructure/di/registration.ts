/**
 * Dependency Registration Module
 * Registers all dependencies in the DI container
 */

import { container, DI_TOKENS } from "./container.js";
import { DependencyContainer } from "tsyringe";
import { config } from "../config/Config.js";
import { LogLevel } from "../../application/interfaces/ILogger.js";
import { ConsoleLogger, DevLogger } from "../logging/Logger.js";
import { TranslationChecker } from "../../domain/services/TranslationChecker.js";
import { RandomWordPicker } from "../../domain/services/RandomWordPicker.js";
import {
  ISessionMutex,
  InMemorySessionMutex,
  RedisSessionMutex,
} from "../persistence/SessionMutex.js";

// Use Cases
import { GetRandomWordUseCase } from "../../application/use-cases/GetRandomWordUseCase.js";
import { GetRandomWordsUseCase } from "../../application/use-cases/GetRandomWordsUseCase.js";
import { CheckTranslationUseCase } from "../../application/use-cases/CheckTranslationUseCase.js";
import { GetCategoriesUseCase } from "../../application/use-cases/GetCategoriesUseCase.js";
import { GetDifficultiesUseCase } from "../../application/use-cases/GetDifficultiesUseCase.js";
import { GetAllWordsUseCase } from "../../application/use-cases/GetAllWordsUseCase.js";
import { GetWordCountUseCase } from "../../application/use-cases/GetWordCountUseCase.js";
import { ResetSessionUseCase } from "../../application/use-cases/ResetSessionUseCase.js";

// Repository factories
import {
  createRepositories,
  RepositoryOptions,
} from "../persistence/repositoryFactory.js";

/**
 * Registration options
 */
export interface RegistrationOptions {
  /** Database URL (optional - uses InMemory if not provided) */
  databaseUrl?: string;
  /** Redis URL for session mutex (optional) */
  redisUrl?: string;
  /** Enable caching */
  enableCache?: boolean;
  /** Cache configuration */
  cacheConfig?: {
    ttlMs: number;
    maxSize: number;
    enableStats: boolean;
  };
}

/**
 * Registration result with cleanup functions
 */
export interface RegistrationResult {
  cleanup: () => Promise<void>;
  warmUp: () => Promise<void>;
  invalidateCaches: () => void;
  getCacheStats:
    | (() => {
        hits: number;
        misses: number;
        evictions: number;
        size: number;
        hitRate: string;
      })
    | undefined;
  checkDatabase: () => Promise<{
    ok: boolean;
    latency?: number;
    error?: string;
  }>;
  getSessionCount: () => Promise<number>;
}

/**
 * Register all dependencies in the container
 */
export async function registerDependencies(
  options: RegistrationOptions = {},
): Promise<RegistrationResult> {
  // 1. Register Config
  container.registerInstance(DI_TOKENS.Config, config);

  // 2. Register Logger
  const logger = config.isDevelopment
    ? new DevLogger()
    : new ConsoleLogger({
        service: "translator-api",
        version: config.api.version,
        environment: config.nodeEnv,
        level: config.logging.level as LogLevel,
      });

  container.registerInstance(DI_TOKENS.Logger, logger);

  // 3. Register Domain Services
  container.registerSingleton(DI_TOKENS.TranslationChecker, TranslationChecker);
  container.registerSingleton(DI_TOKENS.RandomWordPicker, RandomWordPicker);

  // 4. Register Session Mutex
  if (options.redisUrl) {
    const redisMutex = new RedisSessionMutex(options.redisUrl, logger);
    await redisMutex.connect();
    container.registerInstance(DI_TOKENS.SessionMutex, redisMutex);
  } else {
    container.registerInstance(
      DI_TOKENS.SessionMutex,
      new InMemorySessionMutex(),
    );
  }

  // 5. Create and register repositories
  const repoOptions: RepositoryOptions = {
    logger,
    enableCache: options.enableCache ?? true,
    cacheConfig: options.cacheConfig ?? {
      ttlMs: config.isDevelopment ? 60 * 1000 : 5 * 60 * 1000,
      maxSize: 10000,
      enableStats: true,
    },
  };

  const {
    wordRepository,
    sessionRepository,
    cleanup,
    warmUp,
    invalidateCaches,
    getCacheStats,
    checkDatabase,
    getSessionCount,
  } = createRepositories(options.databaseUrl, repoOptions);

  container.registerInstance(DI_TOKENS.WordRepository, wordRepository);
  container.registerInstance(DI_TOKENS.SessionRepository, sessionRepository);

  // 6. Register Use Cases (factory functions to resolve dependencies)
  container.register(DI_TOKENS.GetRandomWordUseCase, {
    useFactory: (c: DependencyContainer) =>
      new GetRandomWordUseCase(
        c.resolve(DI_TOKENS.WordRepository),
        c.resolve(DI_TOKENS.SessionRepository),
        c.resolve(DI_TOKENS.RandomWordPicker),
        c.resolve(DI_TOKENS.Logger),
        c.resolve(DI_TOKENS.SessionMutex),
      ),
  });

  container.register(DI_TOKENS.GetRandomWordsUseCase, {
    useFactory: (c: DependencyContainer) =>
      new GetRandomWordsUseCase(
        c.resolve(DI_TOKENS.WordRepository),
        c.resolve(DI_TOKENS.SessionRepository),
        c.resolve(DI_TOKENS.RandomWordPicker),
        c.resolve(DI_TOKENS.Logger),
        c.resolve(DI_TOKENS.SessionMutex),
      ),
  });

  container.register(DI_TOKENS.CheckTranslationUseCase, {
    useFactory: (c: DependencyContainer) =>
      new CheckTranslationUseCase(
        c.resolve(DI_TOKENS.WordRepository),
        c.resolve(DI_TOKENS.TranslationChecker),
        c.resolve(DI_TOKENS.Logger),
      ),
  });

  container.register(DI_TOKENS.GetCategoriesUseCase, {
    useFactory: (c: DependencyContainer) =>
      new GetCategoriesUseCase(c.resolve(DI_TOKENS.WordRepository)),
  });

  container.register(DI_TOKENS.GetDifficultiesUseCase, {
    useFactory: (c: DependencyContainer) =>
      new GetDifficultiesUseCase(c.resolve(DI_TOKENS.WordRepository)),
  });

  container.register(DI_TOKENS.GetAllWordsUseCase, {
    useFactory: (c: DependencyContainer) =>
      new GetAllWordsUseCase(c.resolve(DI_TOKENS.WordRepository)),
  });

  container.register(DI_TOKENS.GetWordCountUseCase, {
    useFactory: (c: DependencyContainer) =>
      new GetWordCountUseCase(c.resolve(DI_TOKENS.WordRepository)),
  });

  container.register(DI_TOKENS.ResetSessionUseCase, {
    useFactory: (c: DependencyContainer) =>
      new ResetSessionUseCase(
        c.resolve(DI_TOKENS.SessionRepository),
        c.resolve(DI_TOKENS.Logger),
      ),
  });

  // Return cleanup and utility functions
  return {
    cleanup: async () => {
      const mutex = container.resolve<ISessionMutex>(DI_TOKENS.SessionMutex);
      if (mutex instanceof RedisSessionMutex) {
        await mutex.disconnect();
      }
      if (cleanup) await cleanup();
    },
    warmUp: warmUp ?? (async () => {}),
    invalidateCaches: invalidateCaches ?? (() => {}),
    getCacheStats,
    checkDatabase,
    getSessionCount,
  };
}

/**
 * Resolve a dependency from the container
 */
export function resolve<T>(token: symbol): T {
  return container.resolve<T>(token);
}
