import { GraphQLFormattedError } from 'graphql';
import { isDomainError } from '../../shared/errors/DomainErrors.js';

/**
 * Format GraphQL errors for API response
 * Sanitizes errors for production while keeping details in development
 */
export function formatGraphQLError(
  formattedError: GraphQLFormattedError,
  error: unknown
): GraphQLFormattedError {
  // Extract original error
  const originalError = (error as any)?.originalError;

  // If it's a domain error, preserve the code and details
  if (isDomainError(originalError)) {
    return {
      message: originalError.message,
      extensions: {
        code: originalError.code,
        ...(originalError.details && { details: originalError.details }),
      },
    };
  }

  // For other errors in production, hide internal details
  const isProduction = process.env.NODE_ENV === 'production';

  if (isProduction) {
    // Check if it's a client error (4xx)
    const httpStatus = (formattedError.extensions?.http as any)?.status;
    if (httpStatus && httpStatus >= 400 && httpStatus < 500) {
      return formattedError;
    }

    // For server errors, return generic message
    return {
      message: 'Internal server error',
      extensions: {
        code: 'INTERNAL_ERROR',
      },
    };
  }

  // In development, return full error details
  return formattedError;
}
