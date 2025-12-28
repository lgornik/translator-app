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

/**
 * Create a rate limiter for GraphQL that skips introspection queries
 */
export function createGraphQLRateLimiter(config: Partial<RateLimitConfig> = {}, logger?: ILogger) {
  return createRateLimiter(
    {
      ...RateLimitPresets.graphql,
      ...config,
      skip: (req) => {
        // Skip rate limiting for introspection queries (useful for tooling)
        const body = req.body;
        if (body && typeof body === 'object' && 'query' in body) {
          const query = body.query as string;
          return query?.includes('__schema') || query?.includes('__type');
        }
        return false;
      },
    },
    logger
  );
}
