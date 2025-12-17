import express from 'express';
import cors from 'cors';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';

import { typeDefs } from './graphql/schema.js';
import { resolvers } from './graphql/resolvers.js';

const PORT = process.env.PORT || 4000;

async function startServer() {
  const app = express();

  // Apollo Server - GraphQL
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    // Włącz introspection i playground w development
    introspection: true,
  });

  await server.start();

  // Middleware
  app.use(cors({
    origin: process.env.CORS_ORIGIN || '*', // W produkcji ustaw konkretny origin
    credentials: true,
  }));
  
  app.use(express.json());

  // GraphQL endpoint
  app.use('/graphql', expressMiddleware(server, {
    context: async ({ req }) => ({
      // Tu można dodać autentykację w przyszłości
      // user: await getUser(req.headers.authorization),
    }),
  }));

  // Health check endpoint (przydatne dla Kubernetes)
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Info endpoint
  app.get('/', (req, res) => {
    res.json({
      name: 'Translator API',
      version: '1.0.0',
      graphql: '/graphql',
      health: '/health',
    });
  });

  app.listen(PORT, () => {
    console.log(`
🚀 Translator API started!
   
   GraphQL:  http://localhost:${PORT}/graphql
   Health:   http://localhost:${PORT}/health
   
   Open GraphQL Playground in browser to test queries.
    `);
  });
}

startServer().catch(console.error);
