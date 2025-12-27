import { z } from 'zod';

/**
 * Environment schema with validation
 */
const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  PORT: z
    .string()
    .transform(Number)
    .pipe(z.number().int().min(1).max(65535))
    .default('4000'),
  CORS_ORIGIN: z.string().default('*'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  
  // Session settings
  SESSION_MAX_AGE_HOURS: z
    .string()
    .transform(Number)
    .pipe(z.number().int().min(1))
    .default('24'),
  SESSION_MAX_COUNT: z
    .string()
    .transform(Number)
    .pipe(z.number().int().min(100))
    .default('10000'),
  
  // Graceful shutdown
  SHUTDOWN_TIMEOUT_MS: z
    .string()
    .transform(Number)
    .pipe(z.number().int().min(1000))
    .default('10000'),
});

type EnvConfig = z.infer<typeof envSchema>;

/**
 * Parse and validate environment
 */
function parseEnv(): EnvConfig {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error('❌ Invalid environment configuration:');
    for (const error of result.error.errors) {
      console.error(`   ${error.path.join('.')}: ${error.message}`);
    }
    process.exit(1);
  }

  return result.data;
}

/**
 * Application Configuration
 * Type-safe, validated configuration
 */
class Config {
  private readonly env: EnvConfig;

  constructor() {
    this.env = parseEnv();
  }

  // Environment
  get nodeEnv(): 'development' | 'production' | 'test' {
    return this.env.NODE_ENV;
  }

  get isDevelopment(): boolean {
    return this.env.NODE_ENV === 'development';
  }

  get isProduction(): boolean {
    return this.env.NODE_ENV === 'production';
  }

  get isTest(): boolean {
    return this.env.NODE_ENV === 'test';
  }

  // Server
  get server() {
    return {
      port: this.env.PORT,
      corsOrigin: this.env.CORS_ORIGIN,
      shutdownTimeoutMs: this.env.SHUTDOWN_TIMEOUT_MS,
    } as const;
  }

  // GraphQL
  get graphql() {
    return {
      path: '/graphql',
      introspection: !this.isProduction,
      playground: this.isDevelopment,
    } as const;
  }

  // Logging
  get logging() {
    return {
      level: this.env.LOG_LEVEL,
    } as const;
  }

  // Session
  get session() {
    return {
      maxAgeMs: this.env.SESSION_MAX_AGE_HOURS * 60 * 60 * 1000,
      maxCount: this.env.SESSION_MAX_COUNT,
    } as const;
  }

  // API Info
  get api() {
    return {
      name: 'Translator API',
      version: '2.0.0',
    } as const;
  }
}

// Singleton instance
export const config = new Config();

export type AppConfig = Config;
