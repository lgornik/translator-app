/**
 * Application Entry Point
 * Clean Architecture Backend - Translator API
 * Uses tsyringe for Dependency Injection
 */

// IMPORTANT: Import reflect-metadata before anything else
import "reflect-metadata";

import { config } from "./infrastructure/config/Config.js";
import {
  HttpServer,
  ServerDependencies,
} from "./infrastructure/http/server.js";
import {
  DI_TOKENS,
  registerDependencies,
  resolve,
} from "./infrastructure/di/index.js";
import { ILogger } from "./application/interfaces/ILogger.js";
import { ISessionRepository } from "./domain/repositories/ISessionRepository.js";
import { IWordRepository } from "./domain/repositories/IWordRepository.js";

/**
 * Bootstrap the application
 */
async function bootstrap(): Promise<void> {
  console.log("🚀 Starting Translator API...");

  try {
    // Register all dependencies in DI container
    const {
      cleanup,
      warmUp,
      invalidateCaches,
      getCacheStats,
      checkDatabase,
      getSessionCount,
    } = await registerDependencies({
      databaseUrl: config.database.url,
      redisUrl: config.redis.url,
      enableCache: true,
      cacheConfig: {
        ttlMs: config.isDevelopment ? 60 * 1000 : 5 * 60 * 1000,
        maxSize: 10000,
        enableStats: true,
      },
    });

    // Resolve logger from DI container
    const logger = resolve<ILogger>(DI_TOKENS.Logger);

    logger.info("Starting application...", {
      environment: config.nodeEnv,
      version: config.api.version,
      database: config.database.isConfigured ? "PostgreSQL" : "InMemory",
      redis: config.redis.isConfigured ? "Redis" : "InMemory",
    });

    // Check database connectivity on startup
    const dbHealth = await checkDatabase();
    if (!dbHealth.ok) {
      logger.error(
        "Database connection failed",
        new Error(dbHealth.error ?? "Unknown error"),
      );
      process.exit(1);
    }
    logger.info("Database connected", { latency: dbHealth.latency });

    // Warm up cache on startup
    if (warmUp) {
      logger.info("Warming up cache...");
      await warmUp();
    }

    // Get repositories from DI container for server
    const wordRepository = resolve<IWordRepository>(DI_TOKENS.WordRepository);
    const sessionRepository = resolve<ISessionRepository>(
      DI_TOKENS.SessionRepository,
    );

    logger.info("Repositories initialized", {
      type: config.database.isConfigured ? "PostgreSQL" : "InMemory",
      sessionType: config.redis.isConfigured ? "Redis" : "InMemory",
      cacheEnabled: true,
      wordCount: await wordRepository.count(),
      categories: (await wordRepository.getCategories()).map(
        (c: { name: string }) => c.name,
      ),
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

    // Schedule session cleanup (every hour) - only for non-Redis sessions
    let cleanupInterval: NodeJS.Timeout | undefined;
    if (!config.redis.isConfigured) {
      cleanupInterval = setInterval(
        async () => {
          const deleted = await sessionRepository.deleteExpired(
            config.session.maxAgeMs,
          );
          if (deleted > 0) {
            logger.info("Expired sessions cleaned up", { count: deleted });
          }
        },
        60 * 60 * 1000,
      );
    }

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      logger.info(`Received ${signal}, shutting down...`);

      if (cleanupInterval) {
        clearInterval(cleanupInterval);
      }

      if (invalidateCaches) {
        invalidateCaches();
      }

      await server.stop();
      await cleanup();

      process.exit(0);
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
  } catch (error) {
    console.error("Failed to start application:", error);
    process.exit(1);
  }
}

// Handle uncaught errors
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});

// Start the application
bootstrap();
