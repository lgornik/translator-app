/**
 * Dependency Injection Container
 * Uses tsyringe for IoC container management
 */

import "reflect-metadata";
import {
  container,
  DependencyContainer,
  injectable,
  inject,
  singleton,
} from "tsyringe";

// Token symbols for interfaces (since TypeScript interfaces don't exist at runtime)
export const DI_TOKENS = {
  // Repositories
  WordRepository: Symbol.for("IWordRepository"),
  SessionRepository: Symbol.for("ISessionRepository"),

  // Services
  Logger: Symbol.for("ILogger"),
  TranslationChecker: Symbol.for("TranslationChecker"),
  RandomWordPicker: Symbol.for("RandomWordPicker"),
  SessionMutex: Symbol.for("ISessionMutex"),

  // Use Cases
  GetRandomWordUseCase: Symbol.for("GetRandomWordUseCase"),
  GetRandomWordsUseCase: Symbol.for("GetRandomWordsUseCase"),
  CheckTranslationUseCase: Symbol.for("CheckTranslationUseCase"),
  GetCategoriesUseCase: Symbol.for("GetCategoriesUseCase"),
  GetDifficultiesUseCase: Symbol.for("GetDifficultiesUseCase"),
  GetAllWordsUseCase: Symbol.for("GetAllWordsUseCase"),
  GetWordCountUseCase: Symbol.for("GetWordCountUseCase"),
  ResetSessionUseCase: Symbol.for("ResetSessionUseCase"),

  // Config
  Config: Symbol.for("Config"),

  // Infrastructure
  DatabaseHealthCheck: Symbol.for("DatabaseHealthCheck"),
  CacheManager: Symbol.for("CacheManager"),
} as const;

export type DITokens = typeof DI_TOKENS;

/**
 * Get the DI container instance
 */
export function getContainer(): DependencyContainer {
  return container;
}

/**
 * Clear all registrations (useful for testing)
 */
export function clearContainer(): void {
  container.clearInstances();
}

/**
 * Create a child container (useful for request-scoped dependencies)
 */
export function createChildContainer(): DependencyContainer {
  return container.createChildContainer();
}

// Re-export decorators for convenience
export { injectable, inject, singleton };
export { container };
