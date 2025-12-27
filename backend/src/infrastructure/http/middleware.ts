import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { randomUUID } from 'crypto';
import { isDomainError } from '../../shared/errors/DomainErrors.js';
import { ILogger } from '../../application/interfaces/ILogger.js';

/**
 * Request ID middleware
 * Adds unique request ID for tracing
 */
export function requestIdMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const requestId = (req.headers['x-request-id'] as string) || randomUUID();
  req.headers['x-request-id'] = requestId;
  res.setHeader('x-request-id', requestId);
  next();
}

/**
 * Request logger middleware factory
 */
export function createRequestLogger(logger: ILogger) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const startTime = Date.now();
    const requestId = req.headers['x-request-id'] as string;

    // Log request
    logger.info('Request received', {
      requestId,
      method: req.method,
      path: req.path,
      userAgent: req.headers['user-agent'],
    });

    // Log response when finished
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      const level = res.statusCode >= 400 ? 'warn' : 'info';

      logger[level]('Request completed', {
        requestId,
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        duration,
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
  res.status(404).json({
    code: 'NOT_FOUND',
    message: `Route ${req.method} ${req.path} not found`,
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
    const requestId = req.headers['x-request-id'] as string;

    // Log error
    logger.error('Unhandled error', error, { requestId, path: req.path });

    // Domain errors
    if (isDomainError(error)) {
      res.status(error.httpStatus).json(error.toJSON());
      return;
    }

    // Generic error
    const isProduction = process.env.NODE_ENV === 'production';
    res.status(500).json({
      code: 'INTERNAL_ERROR',
      message: isProduction ? 'Internal server error' : error.message,
      ...(isProduction ? {} : { stack: error.stack }),
    });
  };
}

/**
 * Health check handler
 */
export function createHealthHandler(startTime: number, wordCount: number) {
  return (_req: Request, res: Response): void => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: (Date.now() - startTime) / 1000,
      wordCount,
    });
  };
}
