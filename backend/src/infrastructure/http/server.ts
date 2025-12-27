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
} from './middleware.js';
import { ILogger } from '../../application/interfaces/ILogger.js';
import { IWordRepository } from '../../domain/repositories/IWordRepository.js';
import { ISessionRepository } from '../../domain/repositories/ISessionRepository.js';

/**
 * Server dependencies
 */
export interface ServerDependencies {
  wordRepository: IWordRepository;
  sessionRepository: ISessionRepository;
  logger: ILogger;
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

  private isShuttingDown = false;

  constructor(deps: ServerDependencies) {
    this.startTime = Date.now();
    this.logger = deps.logger;

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
    // Request ID
    this.app.use(requestIdMiddleware);

    // Request logging
    this.app.use(createRequestLogger(this.logger));

    // CORS
    this.app.use(
      cors({
        origin: config.server.corsOrigin,
        credentials: true,
      })
    );

    // JSON parsing
    this.app.use(express.json());
  }

  private setupRoutes(): void {
    // Health check
    this.app.get(
      '/health',
      createHealthHandler(
        this.startTime,
        this.contextDeps.wordRepository.count()
      )
    );

    // API info
    this.app.get('/', (_req, res) => {
      res.json({
        name: config.api.name,
        version: config.api.version,
        endpoints: {
          graphql: config.graphql.path,
          health: '/health',
        },
      });
    });

    // GraphQL endpoint
    this.app.use(
      config.graphql.path,
      expressMiddleware(this.apollo, {
        context: async ({ req }) => {
          const requestId = req.headers['x-request-id'] as string;
          const sessionId = (req.headers['x-session-id'] as string) || 'default';

          return createContext(this.contextDeps, requestId, sessionId);
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
      async requestDidStart() {
        return {
          async didEncounterErrors({ errors }: { errors: readonly Error[] }) {
            for (const error of errors) {
              logger.error('GraphQL error', error as Error);
            }
          },
        };
      },
    };
  }

  private printStartupBanner(): void {
    console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                    🚀 Translator API                          ║
╠═══════════════════════════════════════════════════════════════╣
║  Status:    Running                                           ║
║  Mode:      ${config.nodeEnv.padEnd(46)}║
║  Port:      ${String(config.server.port).padEnd(46)}║
╠═══════════════════════════════════════════════════════════════╣
║  Endpoints:                                                   ║
║  • GraphQL:  http://localhost:${config.server.port}${config.graphql.path.padEnd(27)}║
║  • Health:   http://localhost:${config.server.port}/health${' '.repeat(22)}║
║  • Info:     http://localhost:${config.server.port}/${' '.repeat(27)}║
╚═══════════════════════════════════════════════════════════════╝
    `);
  }
}
