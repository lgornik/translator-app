/**
 * Application Entry Point
 * Clean Architecture Backend - Translator API
 */

import { config } from './infrastructure/config/Config.js';
import { HttpServer } from './infrastructure/http/server.js';
import { createRepositories } from './infrastructure/persistence/repositoryFactory.js';
import { ConsoleLogger, DevLogger } from './infrastructure/logging/Logger.js';
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
    database: config.database.isConfigured ? 'PostgreSQL' : 'InMemory',
  });

  try {
    // Create repositories (PostgreSQL if DATABASE_URL is set, otherwise InMemory)
    const { wordRepository, sessionRepository, cleanup } = createRepositories(
      config.database.url
    );

    logger.info('Repositories initialized', {
      type: config.database.isConfigured ? 'PostgreSQL' : 'InMemory',
      wordCount: await wordRepository.count(),
      categories: (await wordRepository.getCategories()).map((c) => c.name),
    });

    // Create and start server
    const server = new HttpServer({
      wordRepository,
      sessionRepository,
      logger,
    });

    await server.start();

    // Schedule session cleanup (every hour)
    const cleanupInterval = setInterval(async () => {
      const deleted = await sessionRepository.deleteExpired(config.session.maxAgeMs);
      if (deleted > 0) {
        logger.info('Expired sessions cleaned up', { count: deleted });
      }
    }, 60 * 60 * 1000);

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      logger.info(`Received ${signal}, shutting down...`);
      clearInterval(cleanupInterval);
      await server.stop();
      if (cleanup) {
        await cleanup();
      }
      process.exit(0);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

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
