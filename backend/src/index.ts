/**
 * Application Entry Point
 * Clean Architecture Backend - Translator API
 */

import { config } from './infrastructure/config/Config.js';
import { HttpServer } from './infrastructure/http/server.js';
import { InMemoryWordRepository } from './infrastructure/persistence/InMemoryWordRepository.js';
import { InMemorySessionRepository } from './infrastructure/persistence/InMemorySessionRepository.js';
import { ConsoleLogger, DevLogger } from './infrastructure/logging/Logger.js';
import { dictionaryData } from './infrastructure/data/dictionary.js';
import { LogLevel } from './application/interfaces/ILogger.js';

/**
 * Bootstrap the application
 */
async function bootstrap(): Promise<void> {
  // Create logger based on environment
  const logger = config.isDevelopment
    ? new DevLogger()
    : new ConsoleLogger(config.logging.level as LogLevel);

  logger.info('Starting application...', {
    environment: config.nodeEnv,
    version: config.api.version,
  });

  try {
    // Create repositories
    const wordRepository = new InMemoryWordRepository(dictionaryData);
    const sessionRepository = new InMemorySessionRepository(config.session.maxCount);

    logger.info('Repositories initialized', {
      wordCount: wordRepository.count(),
      categories: wordRepository.getCategories().map((c) => c.name),
    });

    // Create and start server
    const server = new HttpServer({
      wordRepository,
      sessionRepository,
      logger,
    });

    await server.start();

    // Schedule session cleanup (every hour)
    const cleanupInterval = setInterval(() => {
      const deleted = sessionRepository.deleteExpired(config.session.maxAgeMs);
      if (deleted > 0) {
        logger.info('Expired sessions cleaned up', { count: deleted });
      }
    }, 60 * 60 * 1000);

    // Clear interval on shutdown
    process.on('SIGTERM', () => clearInterval(cleanupInterval));
    process.on('SIGINT', () => clearInterval(cleanupInterval));

  } catch (error) {
    logger.error('Failed to start application', error as Error);
    process.exit(1);
  }
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the application
bootstrap();
