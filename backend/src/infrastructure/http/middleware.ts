import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { randomUUID } from 'crypto';
import { isDomainError } from '../../shared/errors/DomainErrors.js';
import { ILogger } from '../../application/interfaces/ILogger.js';
import { IWordRepository } from '../../domain/repositories/IWordRepository.js';

/**
 * Request ID middleware
 * Adds unique request ID (correlation ID) for tracing
 */
export function requestIdMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Support various correlation ID headers
  const correlationId = 
    (req.headers['x-correlation-id'] as string) ||
    (req.headers['x-request-id'] as string) ||
    randomUUID();
  
  // Set both headers for compatibility
  req.headers['x-correlation-id'] = correlationId;
  req.headers['x-request-id'] = correlationId;
  
  res.setHeader('x-correlation-id', correlationId);
  res.setHeader('x-request-id', correlationId);
  
  next();
}

/**
 * Request logger middleware factory
 */
export function createRequestLogger(logger: ILogger) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const startTime = Date.now();
    const correlationId = req.headers['x-correlation-id'] as string;

    // Create child logger with correlation ID
    const requestLogger = logger.child({ 
      correlationId,
      requestId: correlationId,
    });

    // Log request start
    requestLogger.info('Request started', {
      method: req.method,
      path: req.path,
      query: Object.keys(req.query).length > 0 ? req.query : undefined,
      userAgent: req.headers['user-agent'],
      ip: req.ip || req.socket.remoteAddress,
    });

    // Log response when finished
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      const level = res.statusCode >= 400 ? 'warn' : 'info';

      requestLogger[level]('Request completed', {
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        duration,
        contentLength: res.get('content-length'),
      });
    });

    next();
  };
}

/**
 * 404 Not Found handler
 */
export function notFoundHandler(
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const correlationId = req.headers['x-correlation-id'] as string;
  
  res.status(404).json({
    code: 'NOT_FOUND',
    message: `Route ${req.method} ${req.path} not found`,
    correlationId,
  });
}

/**
 * Global error handler factory
 */
export function createErrorHandler(logger: ILogger): ErrorRequestHandler {
  return (
    error: Error,
    req: Request,
    res: Response,
    _next: NextFunction
  ): void => {
    const correlationId = req.headers['x-correlation-id'] as string;

    // Log error with correlation ID
    logger.error('Unhandled error', error, { 
      correlationId,
      path: req.path,
      method: req.method,
    });

    // Domain errors
    if (isDomainError(error)) {
      res.status(error.httpStatus).json({
        ...error.toJSON(),
        correlationId,
      });
      return;
    }

    // Generic error
    const isProduction = process.env.NODE_ENV === 'production';
    res.status(500).json({
      code: 'INTERNAL_ERROR',
      message: isProduction ? 'Internal server error' : error.message,
      correlationId,
      ...(isProduction ? {} : { stack: error.stack }),
    });
  };
}

/**
 * Health check status
 */
export interface HealthStatus {
  status: 'ok' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  checks: {
    database: {
      status: 'ok' | 'error';
      latency?: number;
      error?: string;
    };
    cache?: {
      status: 'ok';
      hitRate: string;
      size: number;
    };
  };
  stats?: {
    wordCount: number;
    sessionCount: number;
  };
}

/**
 * Health check dependencies
 */
export interface HealthCheckDependencies {
  startTime: number;
  version: string;
  wordRepository: IWordRepository;
  checkDatabase: () => Promise<{ ok: boolean; latency: number; error?: string }>;
  getCacheStats?: (() => { hitRate: string; size: number }) | undefined;
  getSessionCount?: (() => Promise<number>) | undefined;
}

/**
 * Enhanced health check handler with database connectivity
 */
export function createHealthHandler(deps: HealthCheckDependencies) {
  return async (req: Request, res: Response): Promise<void> => {
    const correlationId = req.headers['x-correlation-id'] as string;
    const startTime = Date.now();

    // Check database connectivity
    const dbCheck = await deps.checkDatabase();

    // Get word count (also validates DB read operations)
    let wordCount = 0;
    let dbReadOk = false;
    try {
      wordCount = await deps.wordRepository.count();
      dbReadOk = true;
    } catch (error) {
      dbReadOk = false;
    }

    // Get session count if available
    let sessionCount: number | undefined;
    if (deps.getSessionCount) {
      try {
        sessionCount = await deps.getSessionCount();
      } catch {
        // Ignore session count errors
      }
    }

    // Determine overall status
    const isDbHealthy = dbCheck.ok && dbReadOk;
    const status: HealthStatus['status'] = isDbHealthy ? 'ok' : 'unhealthy';

    const health: HealthStatus = {
      status,
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - deps.startTime) / 1000),
      version: deps.version,
      checks: {
        database: {
          status: isDbHealthy ? 'ok' : 'error',
          latency: dbCheck.latency,
          ...(dbCheck.error && { error: dbCheck.error }),
        },
      },
      stats: {
        wordCount,
        sessionCount: sessionCount ?? 0,
      },
    };

    // Add cache stats if available
    if (deps.getCacheStats) {
      const cacheStats = deps.getCacheStats();
      health.checks.cache = {
        status: 'ok',
        hitRate: cacheStats.hitRate,
        size: cacheStats.size,
      };
    }

    // Return appropriate status code
    const httpStatus = status === 'ok' ? 200 : 503;
    
    res.status(httpStatus).json({
      ...health,
      correlationId,
      responseTime: Date.now() - startTime,
    });
  };
}

/**
 * Simple health check (for load balancers - fast response)
 */
export function createLivenessHandler() {
  return (_req: Request, res: Response): void => {
    res.status(200).json({ status: 'ok' });
  };
}

/**
 * Readiness check (for Kubernetes - checks if ready to serve traffic)
 */
export function createReadinessHandler(
  checkDatabase: () => Promise<{ ok: boolean }>
) {
  return async (_req: Request, res: Response): Promise<void> => {
    const dbCheck = await checkDatabase();
    
    if (dbCheck.ok) {
      res.status(200).json({ status: 'ready' });
    } else {
      res.status(503).json({ status: 'not ready', reason: 'database unavailable' });
    }
  };
}

/**
 * Cache statistics type
 */
export interface CacheStats {
  hits: number;
  misses: number;
  evictions: number;
  size: number;
  hitRate: string;
}

/**
 * Cache statistics handler
 */
export function createCacheStatsHandler(getCacheStats?: () => CacheStats) {
  return (req: Request, res: Response): void => {
    const correlationId = req.headers['x-correlation-id'] as string;

    if (!getCacheStats) {
      res.status(404).json({
        code: 'CACHE_DISABLED',
        message: 'Cache is not enabled',
        correlationId,
      });
      return;
    }

    const stats = getCacheStats();
    res.json({
      status: 'ok',
      cache: stats,
      timestamp: new Date().toISOString(),
      correlationId,
    });
  };
}

/**
 * Cache invalidation handler
 */
export function createCacheInvalidateHandler(
  invalidateCaches?: () => void,
  logger?: ILogger
) {
  return (req: Request, res: Response): void => {
    const correlationId = req.headers['x-correlation-id'] as string;
    const apiKey = req.headers['x-admin-key'];
    const expectedKey = process.env.ADMIN_API_KEY;

    if (expectedKey && apiKey !== expectedKey) {
      res.status(401).json({
        code: 'UNAUTHORIZED',
        message: 'Invalid admin API key',
        correlationId,
      });
      return;
    }

    if (!invalidateCaches) {
      res.status(404).json({
        code: 'CACHE_DISABLED',
        message: 'Cache is not enabled',
        correlationId,
      });
      return;
    }

    invalidateCaches();
    logger?.info('Cache invalidated via admin endpoint', { correlationId });

    res.json({
      status: 'ok',
      message: 'Cache invalidated successfully',
      timestamp: new Date().toISOString(),
      correlationId,
    });
  };
}