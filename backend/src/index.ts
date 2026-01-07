/**
 * Application Entry Point
 * Clean Architecture Backend - Translator API
 */

import { config } from './infrastructure/config/Config.js';
import { HttpServer, ServerDependencies } from './infrastructure/http/server.js';
import { createRepositories } from './infrastructure/persistence/repositoryFactory.js';
import { ConsoleLogger, DevLogger } from './infrastructure/logging/Logger.js';
import { LogLevel } from './application/interfaces/ILogger.js';

/**
 * Bootstrap the application
 */
async function bootstrap(): Promise<void> {
  // Create logger based on environment with service metadata
  const logger = config.isDevelopment
    ? new DevLogger()
    : new ConsoleLogger({
        service: 'translator-api',
        version: config.api.version,
        environment: config.nodeEnv,
        level: config.logging.level as LogLevel,
      });

  logger.info('Starting application...', {
    environment: config.nodeEnv,
    version: config.api.version,
    database: config.database.isConfigured ? 'PostgreSQL' : 'InMemory',
  });

  try {
    // Create repositories with caching enabled
    const { 
      wordRepository, 
      sessionRepository, 
      cleanup,
      warmUp,
      invalidateCaches,
      getCacheStats,
      checkDatabase,
      getSessionCount,
    } = createRepositories(config.database.url, {
      logger,
      enableCache: true,
      cacheConfig: {
        ttlMs: config.isDevelopment ? 60 * 1000 : 5 * 60 * 1000,
        maxSize: 10000,
        enableStats: true,
      },
    });

    // Check database connectivity on startup
    const dbHealth = await checkDatabase();
    if (!dbHealth.ok) {
      logger.error('Database connection failed', new Error(dbHealth.error ?? 'Unknown error'));
      process.exit(1);
    }
    logger.info('Database connected', { latency: dbHealth.latency });

    // Warm up cache on startup
    if (warmUp) {
      logger.info('Warming up cache...');
      await warmUp();
    }

    logger.info('Repositories initialized', {
      type: config.database.isConfigured ? 'PostgreSQL' : 'InMemory',
      cacheEnabled: true,
      wordCount: await wordRepository.count(),
      categories: (await wordRepository.getCategories()).map((c) => c.name),
    });

    // Create server dependencies
    const serverDeps: ServerDependencies = {
      wordRepository,
      sessionRepository,
      logger,
      checkDatabase,
      getSessionCount,
    };

    if (getCacheStats) {
      serverDeps.getCacheStats = getCacheStats;
    }
    if (invalidateCaches) {
      serverDeps.invalidateCaches = invalidateCaches;
    }

    // Create and start server
    const server = new HttpServer(serverDeps);
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
      
      if (invalidateCaches) {
        invalidateCaches();
      }
      
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