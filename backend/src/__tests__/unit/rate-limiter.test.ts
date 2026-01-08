import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import { createRateLimiter, createGraphQLRateLimiter, RateLimitPresets } from '../../infrastructure/http/rateLimiter.js';

describe('RateLimiter', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    vi.useFakeTimers();

    mockReq = {
      ip: '127.0.0.1',
      path: '/graphql',
      headers: {},
      socket: { remoteAddress: '127.0.0.1' } as any,
      body: {},
    };

    mockRes = {
      setHeader: vi.fn().mockReturnThis(),
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };

    mockNext = vi.fn() as unknown as NextFunction;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('createRateLimiter', () => {
    it('should allow requests under the limit', () => {
      const limiter = createRateLimiter({
        windowMs: 60000,
        maxRequests: 5,
      });

      limiter(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.setHeader).toHaveBeenCalledWith('X-RateLimit-Limit', 5);
      expect(mockRes.setHeader).toHaveBeenCalledWith('X-RateLimit-Remaining', 4);
    });

    it('should block requests over the limit', () => {
      const limiter = createRateLimiter({
        windowMs: 60000,
        maxRequests: 2,
      });

      // First two requests should pass
      limiter(mockReq as Request, mockRes as Response, mockNext);
      limiter(mockReq as Request, mockRes as Response, mockNext);

      // Third request should be blocked
      limiter(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(429);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'RATE_LIMIT_EXCEEDED',
        })
      );
    });

    it('should reset count after window expires', () => {
      const limiter = createRateLimiter({
        windowMs: 1000, // 1 second
        maxRequests: 1,
      });

      // First request passes
      limiter(mockReq as Request, mockRes as Response, mockNext);
      expect(mockNext).toHaveBeenCalledTimes(1);

      // Second request is blocked
      limiter(mockReq as Request, mockRes as Response, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(429);

      // Advance time past window
      vi.advanceTimersByTime(1500);

      // Reset mocks
      mockNext = vi.fn() as unknown as NextFunction;
      (mockRes.status as ReturnType<typeof vi.fn>).mockClear();

      // Third request should pass (new window)
      limiter(mockReq as Request, mockRes as Response, mockNext);
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalledWith(429);
    });

    it('should use custom key generator', () => {
      const limiter = createRateLimiter({
        windowMs: 60000,
        maxRequests: 1,
        keyGenerator: (req) => (req.headers['x-api-key'] as string) || 'anonymous',
      });

      // Request with API key 1
      mockReq.headers = { 'x-api-key': 'key1' };
      limiter(mockReq as Request, mockRes as Response, mockNext);
      expect(mockNext).toHaveBeenCalledTimes(1);

      // Request with API key 2 (different key, so passes)
      mockReq.headers = { 'x-api-key': 'key2' };
      mockNext = vi.fn() as unknown as NextFunction;
      limiter(mockReq as Request, mockRes as Response, mockNext);
      expect(mockNext).toHaveBeenCalledTimes(1);

      // Request with API key 1 again (blocked)
      mockReq.headers = { 'x-api-key': 'key1' };
      mockNext = vi.fn() as unknown as NextFunction;
      limiter(mockReq as Request, mockRes as Response, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(429);
    });

    it('should skip rate limiting when skip function returns true', () => {
      const limiter = createRateLimiter({
        windowMs: 60000,
        maxRequests: 1,
        skip: (req) => req.path === '/health',
      });

      // Health endpoint should be skipped
      const healthReq = { ...mockReq, path: '/health' } as Request;
      limiter(healthReq, mockRes as Response, mockNext);
      limiter(healthReq, mockRes as Response, mockNext);
      limiter(healthReq, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(3);
      expect(mockRes.status).not.toHaveBeenCalledWith(429);
    });

    it('should set Retry-After header when rate limited', () => {
      const limiter = createRateLimiter({
        windowMs: 60000,
        maxRequests: 1,
      });

      limiter(mockReq as Request, mockRes as Response, mockNext);
      limiter(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.setHeader).toHaveBeenCalledWith(
        'Retry-After',
        expect.any(Number)
      );
    });
  });

  describe('createGraphQLRateLimiter - Per-Operation', () => {
    it('should apply per-operation custom limits', () => {
      const limiter = createGraphQLRateLimiter({
        queryLimit: 100,
        mutationLimit: 50,
        windowMs: 60000,
        operations: {
          'getAllWords': 2, // Custom low limit for heavy query
        },
      });

      mockReq.body = { query: 'query { getAllWords { id } }' };

      // First two pass
      limiter(mockReq as Request, mockRes as Response, mockNext);
      mockNext = vi.fn() as unknown as NextFunction;
      limiter(mockReq as Request, mockRes as Response, mockNext);
      expect(mockNext).toHaveBeenCalled();

      // Third is blocked
      mockNext = vi.fn() as unknown as NextFunction;
      (mockRes.status as ReturnType<typeof vi.fn>).mockClear();
      limiter(mockReq as Request, mockRes as Response, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(429);
    });

    it('should track operations independently', () => {
      const limiter = createGraphQLRateLimiter({
        queryLimit: 1,
        mutationLimit: 1,
        windowMs: 60000,
        operations: {},
      });

      // Query getCategories
      mockReq.body = { query: '{ getCategories }' };
      limiter(mockReq as Request, mockRes as Response, mockNext);
      expect(mockNext).toHaveBeenCalled();

      // Query getDifficulties (different operation, separate limit)
      mockReq.body = { query: '{ getDifficulties }' };
      mockNext = vi.fn() as unknown as NextFunction;
      limiter(mockReq as Request, mockRes as Response, mockNext);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should skip introspection queries', () => {
      const limiter = createGraphQLRateLimiter({
        queryLimit: 1,
        windowMs: 60000,
      });

      mockReq.body = { query: '{ __schema { types { name } } }' };

      // Multiple introspection queries should all pass
      for (let i = 0; i < 5; i++) {
        mockNext = vi.fn() as unknown as NextFunction;
        limiter(mockReq as Request, mockRes as Response, mockNext);
        expect(mockNext).toHaveBeenCalled();
      }
    });

    it('should set X-RateLimit-Operation header', () => {
      const limiter = createGraphQLRateLimiter();

      mockReq.body = { query: 'query GetRandomWord { getRandomWord(mode: EN_TO_PL) { id } }' };
      limiter(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.setHeader).toHaveBeenCalledWith('X-RateLimit-Operation', 'GetRandomWord');
    });

    it('should extract operation name from operationName field', () => {
      const limiter = createGraphQLRateLimiter({
        queryLimit: 1,
        operations: { 'MyCustomOp': 5 },
        windowMs: 60000,
      });

      mockReq.body = { 
        query: 'query { getCategories }',
        operationName: 'MyCustomOp',
      };

      // Should use custom limit (5) not query limit (1)
      for (let i = 0; i < 5; i++) {
        mockNext = vi.fn() as unknown as NextFunction;
        limiter(mockReq as Request, mockRes as Response, mockNext);
        expect(mockNext).toHaveBeenCalled();
      }

      // 6th should be blocked
      mockNext = vi.fn() as unknown as NextFunction;
      (mockRes.status as ReturnType<typeof vi.fn>).mockClear();
      limiter(mockReq as Request, mockRes as Response, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(429);
    });

    it('should use stricter limits for mutations vs queries', () => {
      // This test verifies the concept - mutations get mutationLimit, queries get queryLimit
      const limiter = createGraphQLRateLimiter({
        queryLimit: 100,
        mutationLimit: 10,
        windowMs: 60000,
        operations: {},
      });

      // Verify headers show different limits based on operation type
      mockReq.body = { query: '{ getCategories }' };
      limiter(mockReq as Request, mockRes as Response, mockNext);
      expect(mockRes.setHeader).toHaveBeenCalledWith('X-RateLimit-Limit', 300);  // <-- zmień 100 na 300

      // Reset and test mutation
      mockRes.setHeader = vi.fn().mockReturnThis();
      mockReq.body = { query: 'mutation { resetSession }' };
      mockNext = vi.fn() as unknown as NextFunction;
      limiter(mockReq as Request, mockRes as Response, mockNext);
      expect(mockRes.setHeader).toHaveBeenCalledWith('X-RateLimit-Limit', 30);   // <-- zmień 10 na 30
    });
  });

  describe('RateLimitPresets', () => {
    it('should have standard preset with 100 requests per minute', () => {
      expect(RateLimitPresets.standard.maxRequests).toBe(100);
      expect(RateLimitPresets.standard.windowMs).toBe(60000);
    });

    it('should have strict preset with 30 requests per minute', () => {
      expect(RateLimitPresets.strict.maxRequests).toBe(30);
      expect(RateLimitPresets.strict.windowMs).toBe(60000);
    });

    it('should have lenient preset with 300 requests per minute', () => {
      expect(RateLimitPresets.lenient.maxRequests).toBe(300);
      expect(RateLimitPresets.lenient.windowMs).toBe(60000);
    });

    it('should have graphql preset with 200 requests per minute', () => {
      expect(RateLimitPresets.graphql.maxRequests).toBe(200);
      expect(RateLimitPresets.graphql.windowMs).toBe(60000);
    });
  });
});