import { Request, Response, NextFunction } from 'express';
import { ILogger } from '../../application/interfaces/ILogger.js';

/**
 * Rate limit configuration
 */
export interface RateLimitConfig {
  /** Time window in milliseconds */
  windowMs: number;
  /** Maximum requests per window */
  maxRequests: number;
  /** Message to return when rate limited */
  message?: string;
  /** Skip rate limiting for certain requests */
  skip?: (req: Request) => boolean;
  /** Key generator for identifying clients */
  keyGenerator?: (req: Request) => string;
}

/**
 * Rate limit entry for tracking
 */
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

/**
 * In-memory rate limiter store
 * For production, consider using Redis for distributed rate limiting
 */
class RateLimitStore {
  private readonly store = new Map<string, RateLimitEntry>();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(private readonly windowMs: number) {
    // Cleanup expired entries every minute
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000);
  }

  /**
   * Increment counter for a key
   * Returns the current count and whether the limit is exceeded
   */
  increment(key: string, maxRequests: number): { count: number; isLimited: boolean; resetTime: number } {
    const now = Date.now();
    const entry = this.store.get(key);

    if (!entry || now > entry.resetTime) {
      // Start new window
      const newEntry: RateLimitEntry = {
        count: 1,
        resetTime: now + this.windowMs,
      };
      this.store.set(key, newEntry);
      return { count: 1, isLimited: false, resetTime: newEntry.resetTime };
    }

    // Increment existing window
    entry.count++;
    return {
      count: entry.count,
      isLimited: entry.count > maxRequests,
      resetTime: entry.resetTime,
    };
  }

  /**
   * Get current count for a key
   */
  get(key: string): RateLimitEntry | undefined {
    const entry = this.store.get(key);
    if (entry && Date.now() > entry.resetTime) {
      this.store.delete(key);
      return undefined;
    }
    return entry;
  }

  /**
   * Cleanup expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store) {
      if (now > entry.resetTime) {
        this.store.delete(key);
      }
    }
  }

  /**
   * Clear the store and stop cleanup
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.store.clear();
  }

  /**
   * Get store size (for monitoring)
   */
  get size(): number {
    return this.store.size;
  }
}

/**
 * Default key generator - uses IP address
 */
function defaultKeyGenerator(req: Request): string {
  // Try various headers for real IP (when behind proxy)
  const forwardedFor = req.headers['x-forwarded-for'];
  if (forwardedFor) {
    const ips = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor.split(',')[0];
    return ips?.trim() || 'unknown';
  }

  const realIp = req.headers['x-real-ip'];
  if (realIp) {
    return Array.isArray(realIp) ? realIp[0] || 'unknown' : realIp;
  }

  return req.ip || req.socket.remoteAddress || 'unknown';
}

/**
 * Create rate limiter middleware
 */
export function createRateLimiter(config: RateLimitConfig, logger?: ILogger) {
  const {
    windowMs,
    maxRequests,
    message = 'Too many requests, please try again later.',
    skip,
    keyGenerator = defaultKeyGenerator,
  } = config;

  const store = new RateLimitStore(windowMs);

  return (req: Request, res: Response, next: NextFunction): void => {
    // Check if we should skip rate limiting for this request
    if (skip && skip(req)) {
      return next();
    }

    const key = keyGenerator(req);
    const { count, isLimited, resetTime } = store.increment(key, maxRequests);

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - count));
    res.setHeader('X-RateLimit-Reset', Math.ceil(resetTime / 1000));

    if (isLimited) {
      logger?.warn('Rate limit exceeded', {
        key,
        count,
        maxRequests,
        path: req.path,
      });

      res.setHeader('Retry-After', Math.ceil((resetTime - Date.now()) / 1000));
      res.status(429).json({
        code: 'RATE_LIMIT_EXCEEDED',
        message,
        retryAfter: Math.ceil((resetTime - Date.now()) / 1000),
      });
      return;
    }

    next();
  };
}

/**
 * Preset configurations for common use cases
 */
export const RateLimitPresets = {
  /**
   * Standard API rate limit - 100 requests per minute
   */
  standard: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100,
    message: 'Too many requests. Please wait a moment and try again.',
  } satisfies RateLimitConfig,

  /**
   * Strict rate limit - 30 requests per minute (for sensitive endpoints)
   */
  strict: {
    windowMs: 60 * 1000,
    maxRequests: 30,
    message: 'Rate limit exceeded. Please slow down.',
  } satisfies RateLimitConfig,

  /**
   * Lenient rate limit - 300 requests per minute (for public queries)
   */
  lenient: {
    windowMs: 60 * 1000,
    maxRequests: 300,
    message: 'Too many requests. Please try again shortly.',
  } satisfies RateLimitConfig,

  /**
   * GraphQL specific - 200 requests per minute
   */
  graphql: {
    windowMs: 60 * 1000,
    maxRequests: 200,
    message: 'Too many GraphQL requests. Please try again in a moment.',
  } satisfies RateLimitConfig,
} as const;

// ============================================================================
// Per-Operation Rate Limiting for GraphQL
// ============================================================================

/**
 * GraphQL operation rate limit configuration
 */
export interface OperationRateLimitConfig {
  /** Default limit for queries */
  queryLimit: number;
  /** Default limit for mutations */
  mutationLimit: number;
  /** Per-operation overrides */
  operations?: Record<string, number>;
  /** Time window in milliseconds */
  windowMs: number;
}

const DEFAULT_OPERATION_CONFIG: OperationRateLimitConfig = {
  queryLimit: 300,      // Queries are read-only, more lenient
  mutationLimit: 60,    // Mutations modify state, stricter
  windowMs: 60 * 1000,  // 1 minute
  operations: {
    // High-frequency queries
    'getRandomWord': 200,
    'getRandomWords': 100,
    'getWordCount': 300,
    'getCategories': 300,
    'getDifficulties': 300,
    'getAllWords': 50,    // Heavy query, more restricted
    
    // Mutations (stricter limits)
    'checkTranslation': 120,  // Core gameplay action
    'resetSession': 30,       // Infrequent action
  },
};

/**
 * Per-operation rate limit entry
 */
interface OperationRateLimitEntry {
  count: number;
  resetTime: number;
}

/**
 * Per-operation rate limit store
 */
class OperationRateLimitStore {
  private readonly store = new Map<string, OperationRateLimitEntry>();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(private readonly windowMs: number) {
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000);
  }

  /**
   * Increment counter for a key and operation
   */
  increment(
    clientKey: string, 
    operation: string, 
    maxRequests: number
  ): { count: number; isLimited: boolean; resetTime: number } {
    const now = Date.now();
    const compositeKey = `${clientKey}:${operation}`;
    
    const entry = this.store.get(compositeKey);

    if (!entry || now > entry.resetTime) {
      const newEntry: OperationRateLimitEntry = {
        count: 1,
        resetTime: now + this.windowMs,
      };
      this.store.set(compositeKey, newEntry);
      return { count: 1, isLimited: false, resetTime: newEntry.resetTime };
    }

    entry.count++;
    return {
      count: entry.count,
      isLimited: entry.count > maxRequests,
      resetTime: entry.resetTime,
    };
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store) {
      if (now > entry.resetTime) {
        this.store.delete(key);
      }
    }
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.store.clear();
  }
}

/**
 * Extract GraphQL operation name and type from request body
 */
function extractGraphQLOperation(body: unknown): { name: string | null; type: 'query' | 'mutation' | null } {
  if (!body || typeof body !== 'object' || !('query' in body)) {
    return { name: null, type: null };
  }

  const query = (body as { query: string }).query;
  const operationName = (body as { operationName?: string }).operationName;

  // Determine operation type
  const isMutation = query.trim().startsWith('mutation') || query.includes('mutation ');
  const type: 'query' | 'mutation' = isMutation ? 'mutation' : 'query';

  // Try to get operation name from explicit operationName
  if (operationName) {
    return { name: operationName, type };
  }

  // Extract from query string - match patterns like: query GetRandomWord, mutation CheckTranslation
  const match = query.match(/(?:query|mutation)\s+(\w+)/);
  if (match) {
    return { name: match[1], type };
  }

  // Try to match field names in the query (for anonymous operations)
  const fieldMatch = query.match(/{\s*(\w+)/);
  if (fieldMatch) {
    return { name: fieldMatch[1], type };
  }

  return { name: null, type };
}

/**
 * Create a GraphQL rate limiter with per-operation limits
 * 
 * This provides granular rate limiting based on:
 * 1. Operation type (queries are more lenient than mutations)
 * 2. Specific operation names (custom limits per operation)
 * 
 * @example
 * ```typescript
 * // Default configuration
 * app.use('/graphql', createGraphQLRateLimiter({}, logger));
 * 
 * // Custom per-operation limits
 * app.use('/graphql', createGraphQLRateLimiter({
 *   queryLimit: 500,
 *   mutationLimit: 100,
 *   operations: {
 *     'heavyQuery': 20,
 *     'checkTranslation': 200,
 *   }
 * }, logger));
 * ```
 */
export function createGraphQLRateLimiter(
  config: Partial<RateLimitConfig & OperationRateLimitConfig> = {}, 
  logger?: ILogger
) {
  const opConfig: OperationRateLimitConfig = {
    queryLimit: config.queryLimit ?? DEFAULT_OPERATION_CONFIG.queryLimit,
    mutationLimit: config.mutationLimit ?? DEFAULT_OPERATION_CONFIG.mutationLimit,
    windowMs: config.windowMs ?? DEFAULT_OPERATION_CONFIG.windowMs,
    operations: { ...DEFAULT_OPERATION_CONFIG.operations, ...config.operations },
  };

  const store = new OperationRateLimitStore(opConfig.windowMs);
  const keyGenerator = config.keyGenerator ?? defaultKeyGenerator;

  return (req: Request, res: Response, next: NextFunction): void => {
    // Skip introspection queries (useful for GraphQL tooling)
    const body = req.body;
    if (body && typeof body === 'object' && 'query' in body) {
      const query = (body as { query: string }).query;
      if (query?.includes('__schema') || query?.includes('__type')) {
        return next();
      }
    }

    const { name: operationName, type: operationType } = extractGraphQLOperation(body);
    const clientKey = keyGenerator(req);

    // Determine rate limit for this operation
    let maxRequests: number;
    if (operationName && opConfig.operations?.[operationName] !== undefined) {
      maxRequests = opConfig.operations[operationName];
    } else if (operationType === 'mutation') {
      maxRequests = opConfig.mutationLimit;
    } else {
      maxRequests = opConfig.queryLimit;
    }

    const operationKey = operationName || operationType || 'unknown';
    const { count, isLimited, resetTime } = store.increment(clientKey, operationKey, maxRequests);

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - count));
    res.setHeader('X-RateLimit-Reset', Math.ceil(resetTime / 1000));
    res.setHeader('X-RateLimit-Operation', operationKey);

    if (isLimited) {
      logger?.warn('GraphQL rate limit exceeded', {
        clientKey,
        operation: operationKey,
        operationType,
        count,
        maxRequests,
      });

      res.setHeader('Retry-After', Math.ceil((resetTime - Date.now()) / 1000));
      res.status(429).json({
        errors: [{
          message: `Rate limit exceeded for operation '${operationKey}'. Please try again later.`,
          extensions: {
            code: 'RATE_LIMIT_EXCEEDED',
            operation: operationKey,
            retryAfter: Math.ceil((resetTime - Date.now()) / 1000),
          },
        }],
      });
      return;
    }

    next();
  };
}
