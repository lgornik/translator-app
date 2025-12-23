import { z } from 'zod';

/**
 * Environment configuration schema with validation
 */
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('4000'),
  CORS_ORIGIN: z.string().default('*'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
});

/**
 * Parse and validate environment variables
 */
const parseEnv = () => {
  const result = envSchema.safeParse(process.env);
  
  if (!result.success) {
    console.error('❌ Invalid environment variables:');
    console.error(result.error.format());
    process.exit(1);
  }
  
  return result.data;
};

/**
 * Application configuration
 */
export const config = {
  env: parseEnv(),
  
  get isDevelopment() {
    return this.env.NODE_ENV === 'development';
  },
  
  get isProduction() {
    return this.env.NODE_ENV === 'production';
  },
  
  get isTest() {
    return this.env.NODE_ENV === 'test';
  },
  
  server: {
    get port() {
      return config.env.PORT;
    },
    get corsOrigin() {
      return config.env.CORS_ORIGIN;
    },
  },
  
  graphql: {
    path: '/graphql',
    introspection: true, // Disable in production if needed
    playground: true,
  },
  
  api: {
    version: '1.0.0',
    name: 'Translator API',
  },
} as const;

export type Config = typeof config;
