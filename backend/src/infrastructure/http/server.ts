import express, { Express } from 'express';
import cors from 'cors';
import http from 'http';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';

import { config } from '../config/Config.js';
import { typeDefs } from '../graphql/schema.js';
import { resolvers } from '../graphql/resolvers.js';
import { GraphQLContext, ContextDependencies, createContext } from '../graphql/context.js';
import { formatGraphQLError } from '../graphql/errorFormatter.js';
import {
  requestIdMiddleware,
  createRequestLogger,
  notFoundHandler,
  createErrorHandler,
  createHealthHandler,
  createLivenessHandler,
  createReadinessHandler,
  createCacheStatsHandler,
  createCacheInvalidateHandler,
  CacheStats,
  HealthCheckDependencies,
} from './middleware.js';
import { createRateLimiter, createGraphQLRateLimiter, RateLimitPresets } from './rateLimiter.js';
import { ILogger } from '../../application/interfaces/ILogger.js';
import { IWordRepository } from '../../domain/repositories/IWordRepository.js';
import { ISessionRepository } from '../../domain/repositories/ISessionRepository.js';
import { DatabaseHealthCheck } from '../persistence/repositoryFactory.js';

/**
 * Server dependencies
 */
export interface ServerDependencies {
  wordRepository: IWordRepository;
  sessionRepository: ISessionRepository;
  logger: ILogger;
  /** Check database connectivity */
  checkDatabase: () => Promise<DatabaseHealthCheck>;
  /** Get session count */
  getSessionCount: () => Promise<number>;
  /** Get cache statistics (optional) */
  getCacheStats?: (() => CacheStats) | undefined;
  /** Invalidate caches (optional) */
  invalidateCaches?: (() => void) | undefined;
}

/**
 * HTTP Server with graceful shutdown
 */
export class HttpServer {
  private readonly app: Express;
  private readonly httpServer: http.Server;
  private readonly apollo: ApolloServer<GraphQLContext>;
  private readonly logger: ILogger;
  private readonly startTime: number;
  private readonly contextDeps: ContextDependencies;
  private readonly checkDatabase: () => Promise<DatabaseHealthCheck>;
  private readonly getSessionCount: () => Promise<number>;
  private readonly getCacheStats?: (() => CacheStats) | undefined;
  private readonly invalidateCaches?: (() => void) | undefined;

  private isShuttingDown = false;

  constructor(deps: ServerDependencies) {
    this.startTime = Date.now();
    this.logger = deps.logger;
    this.checkDatabase = deps.checkDatabase;
    this.getSessionCount = deps.getSessionCount;
    this.getCacheStats = deps.getCacheStats;
    this.invalidateCaches = deps.invalidateCaches;

    this.contextDeps = {
      wordRepository: deps.wordRepository,
      sessionRepository: deps.sessionRepository,
      logger: deps.logger,
      startTime: this.startTime,
    };

    // Create Express app
    this.app = express();
    this.httpServer = http.createServer(this.app);

    // Create Apollo Server
    this.apollo = new ApolloServer<GraphQLContext>({
      typeDefs,
      resolvers,
      formatError: formatGraphQLError,
      introspection: config.graphql.introspection,
      plugins: [
        ApolloServerPluginDrainHttpServer({ httpServer: this.httpServer }),
        this.createLoggingPlugin(),
      ],
    });
  }

  /**
   * Start the server
   */
  async start(): Promise<void> {
    // Start Apollo
    await this.apollo.start();

    // Setup middleware
    this.setupMiddleware();

    // Setup routes
    this.setupRoutes();

    // Setup error handling
    this.setupErrorHandling();

    // Setup graceful shutdown
    this.setupGracefulShutdown();

    // Start listening
    return new Promise((resolve) => {
      this.httpServer.listen(config.server.port, () => {
        this.logger.info('Server started', {
          port: config.server.port,
          environment: config.nodeEnv,
          graphqlPath: config.graphql.path,
        });

        this.printStartupBanner();
        resolve();
      });
    });
  }

  /**
   * Stop the server gracefully
   */
  async stop(): Promise<void> {
    if (this.isShuttingDown) {
      return;
    }

    this.isShuttingDown = true;
    this.logger.info('Shutting down server...');

    // Stop accepting new connections
    await this.apollo.stop();

    // Close HTTP server
    await new Promise<void>((resolve, reject) => {
      this.httpServer.close((err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    this.logger.info('Server stopped');
  }

  private setupMiddleware(): void {
    // Request ID (correlation ID)
    this.app.use(requestIdMiddleware);

    // Request logging with correlation ID
    this.app.use(createRequestLogger(this.logger));

    // Global rate limiter (for all routes)
    this.app.use(createRateLimiter(RateLimitPresets.standard, this.logger));

    // CORS
    this.app.use(
      cors({
        origin: config.server.corsOrigin,
        credentials: true,
        exposedHeaders: ['x-correlation-id', 'x-request-id'],
      })
    );

    // JSON parsing
    this.app.use(express.json());
  }

  private setupRoutes(): void {
    // Liveness probe (for Kubernetes) - fast, simple
    this.app.get('/livez', createLivenessHandler());

    // Readiness probe (for Kubernetes) - checks DB
    this.app.get('/readyz', createReadinessHandler(this.checkDatabase));

    // Full health check with details
    const healthDeps: HealthCheckDependencies = {
      startTime: this.startTime,
      version: config.api.version,
      wordRepository: this.contextDeps.wordRepository,
      checkDatabase: this.checkDatabase,
      getSessionCount: this.getSessionCount,
    };
    
    if (this.getCacheStats) {
      healthDeps.getCacheStats = this.getCacheStats;
    }

    this.app.get('/health', createHealthHandler(healthDeps));

    // Cache statistics endpoint
    this.app.get(
      '/cache/stats',
      createCacheStatsHandler(this.getCacheStats)
    );

    // Cache invalidation endpoint (POST, requires admin key)
    this.app.post(
      '/cache/invalidate',
      createCacheInvalidateHandler(this.invalidateCaches, this.logger)
    );

    // API info
    this.app.get('/', (_req, res) => {
      res.json({
        name: config.api.name,
        version: config.api.version,
        endpoints: {
          graphql: config.graphql.path,
          health: '/health',
          liveness: '/livez',
          readiness: '/readyz',
          cacheStats: '/cache/stats',
          cacheInvalidate: '/cache/invalidate (POST)',
        },
      });
    });

    // GraphQL endpoint with specific rate limiting
    this.app.use(
      config.graphql.path,
      createGraphQLRateLimiter({}, this.logger),
      expressMiddleware(this.apollo, {
        context: async ({ req }) => {
          const correlationId = req.headers['x-correlation-id'] as string;
          const sessionId = (req.headers['x-session-id'] as string) || 'default';

          return createContext(this.contextDeps, correlationId, sessionId);
        },
      })
    );
  }

  private setupErrorHandling(): void {
    // 404 handler
    this.app.use(notFoundHandler);

    // Error handler
    this.app.use(createErrorHandler(this.logger));
  }

  private setupGracefulShutdown(): void {
    const shutdown = async (signal: string) => {
      this.logger.info(`Received ${signal}, starting graceful shutdown`);

      // Set timeout for forced shutdown
      const forceShutdownTimeout = setTimeout(() => {
        this.logger.error('Forced shutdown due to timeout');
        process.exit(1);
      }, config.server.shutdownTimeoutMs);

      try {
        await this.stop();
        clearTimeout(forceShutdownTimeout);
        process.exit(0);
      } catch (error) {
        this.logger.error('Error during shutdown', error as Error);
        clearTimeout(forceShutdownTimeout);
        process.exit(1);
      }
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  }

  private createLoggingPlugin() {
    const logger = this.logger;

    return {
      async requestDidStart({ contextValue }: { contextValue: GraphQLContext }) {
        const correlationId = contextValue.requestId;
        
        return {
          async didEncounterErrors({ errors }: { errors: readonly Error[] }) {
            for (const error of errors) {
              logger.error('GraphQL error', error as Error, { correlationId });
            }
          },
        };
      },
    };
  }

  private printStartupBanner(): void {
    console.log(`
  ====================================================
            🚀 Translator API
  ====================================================
    Status:    Running
    Mode:      ${config.nodeEnv}
    Port:      ${config.server.port}
  ----------------------------------------------------
    Endpoints:
    • GraphQL:     http://localhost:${config.server.port}${config.graphql.path}
    • Health:      http://localhost:${config.server.port}/health
    • Liveness:    http://localhost:${config.server.port}/livez
    • Readiness:   http://localhost:${config.server.port}/readyz
    • Cache Stats: http://localhost:${config.server.port}/cache/stats
    • Info:        http://localhost:${config.server.port}/
  ====================================================
    `);
  }
}