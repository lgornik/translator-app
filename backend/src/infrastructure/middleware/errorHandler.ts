import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { GraphQLFormattedError } from 'graphql';
import { isAppError, AppError } from '../../shared/errors/index.js';
import { config } from '../../config/index.js';

/**
 * Express error handler middleware
 */
export const errorHandler: ErrorRequestHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  console.error('Error:', err);

  if (isAppError(err)) {
    res.status(err.statusCode).json(err.toJSON());
    return;
  }

  // Unknown error
  res.status(500).json({
    code: 'INTERNAL_ERROR',
    message: config.isDevelopment ? err.message : 'Internal server error',
  });
};

/**
 * GraphQL error formatter
 */
export const formatGraphQLError = (
  formattedError: GraphQLFormattedError,
  error: unknown
): GraphQLFormattedError => {
  // Log original error
  console.error('GraphQL Error:', error);

  // Check if it's our custom error
  const originalError = (error as { originalError?: unknown })?.originalError;
  
  if (originalError && isAppError(originalError)) {
    return {
      ...formattedError,
      message: originalError.message,
      extensions: {
        ...formattedError.extensions,
        code: originalError.code,
        details: originalError.details,
      },
    };
  }

  // Hide internal errors in production
  if (config.isProduction) {
    return {
      ...formattedError,
      message: 'Internal server error',
      extensions: {
        code: 'INTERNAL_ERROR',
      },
    };
  }

  return formattedError;
};

/**
 * Not found handler for unknown routes
 */
export const notFoundHandler = (_req: Request, res: Response): void => {
  res.status(404).json({
    code: 'NOT_FOUND',
    message: 'Resource not found',
  });
};

/**
 * Request logger middleware
 */
export const requestLogger = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  if (config.isDevelopment) {
    console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  }
  next();
};
