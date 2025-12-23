import express from 'express';
import cors from 'cors';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';

import { config } from './config/index.js';
import { typeDefs } from './infrastructure/graphql/schema.js';
import { resolvers, GraphQLContext } from './infrastructure/graphql/resolvers/index.js';
import { TranslationService } from './domain/services/TranslationService.js';
import { InMemoryWordRepository } from './domain/repositories/WordRepository.js';
import { dictionaryData } from './infrastructure/data/dictionary.js';
import {
  errorHandler,
  formatGraphQLError,
  notFoundHandler,
  requestLogger,
} from './infrastructure/middleware/errorHandler.js';

/**
 * Create and configure the application
 */
async function createApp() {
  const app = express();

  // ============================================================================
  // Dependency Injection
  // ============================================================================
  
  // Create repository
  const wordRepository = new InMemoryWordRepository(dictionaryData);
  
  // Create service
  const translationService = new TranslationService(wordRepository);

  // ============================================================================
  // Apollo Server
  // ============================================================================
  
  const server = new ApolloServer<GraphQLContext>({
    typeDefs,
    resolvers,
    formatError: formatGraphQLError,
    introspection: config.graphql.introspection,
  });

  await server.start();

  // ============================================================================
  // Middleware
  // ============================================================================
  
  // Request logging
  app.use(requestLogger);
  
  // CORS
  app.use(cors({
    origin: config.server.corsOrigin,
    credentials: true,
  }));
  
  // JSON parsing
  app.use(express.json());

  // ============================================================================
  // Routes
  // ============================================================================
  
  // Health check endpoint
  app.get('/health', (_req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  // API info endpoint
  app.get('/', (_req, res) => {
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
  app.use(
    config.graphql.path,
    expressMiddleware(server, {
      context: async ({ req }): Promise<GraphQLContext> => {
        // Extract session ID from header or generate one
        // In production, this would come from authentication
        const sessionId = req.headers['x-session-id'] as string || 'default';
        
        return {
          translationService,
          sessionId,
        };
      },
    })
  );

  // ============================================================================
  // Error Handling
  // ============================================================================
  
  // 404 handler
  app.use(notFoundHandler);
  
  // Error handler
  app.use(errorHandler);

  return app;
}

/**
 * Start the server
 */
async function startServer() {
  try {
    const app = await createApp();
    
    app.listen(config.server.port, () => {
      console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                    🚀 Translator API                          ║
╠═══════════════════════════════════════════════════════════════╣
║  Status:    Running                                           ║
║  Mode:      ${config.env.NODE_ENV.padEnd(46)}║
║  Port:      ${String(config.server.port).padEnd(46)}║
╠═══════════════════════════════════════════════════════════════╣
║  Endpoints:                                                   ║
║  • GraphQL:  http://localhost:${config.server.port}${config.graphql.path.padEnd(27)}║
║  • Health:   http://localhost:${config.server.port}/health${' '.repeat(22)}║
║  • Info:     http://localhost:${config.server.port}/${' '.repeat(27)}║
╚═══════════════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
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
startServer();
