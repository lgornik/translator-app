import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { createRateLimiter, RateLimitPresets } from '../../infrastructure/http/rateLimiter.js';

describe('RateLimiter', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;
  let setHeaderMock: ReturnType<typeof vi.fn>;
  let statusMock: ReturnType<typeof vi.fn>;
  let jsonMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.useFakeTimers();
    
    setHeaderMock = vi.fn();
    jsonMock = vi.fn();
    statusMock = vi.fn().mockReturnValue({ json: jsonMock });

    mockReq = {
      ip: '127.0.0.1',
      path: '/graphql',
      headers: {},
      socket: { remoteAddress: '127.0.0.1' } as any,
    };

    mockRes = {
      setHeader: setHeaderMock,
      status: statusMock,
    };

    mockNext = vi.fn();
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
      expect(setHeaderMock).toHaveBeenCalledWith('X-RateLimit-Limit', 5);
      expect(setHeaderMock).toHaveBeenCalledWith('X-RateLimit-Remaining', 4);
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

      expect(statusMock).toHaveBeenCalledWith(429);
      expect(jsonMock).toHaveBeenCalledWith(
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
      expect(statusMock).toHaveBeenCalledWith(429);

      // Advance time past window
      vi.advanceTimersByTime(1500);

      // Reset mocks
      mockNext = vi.fn();
      statusMock.mockClear();

      // Third request should pass (new window)
      limiter(mockReq as Request, mockRes as Response, mockNext);
      expect(mockNext).toHaveBeenCalled();
      expect(statusMock).not.toHaveBeenCalled();
    });

    it('should use custom key generator', () => {
      const limiter = createRateLimiter({
        windowMs: 60000,
        maxRequests: 1,
        keyGenerator: (req) => req.headers['x-api-key'] as string || 'anonymous',
      });

      // Request with API key 1
      mockReq.headers = { 'x-api-key': 'key1' };
      limiter(mockReq as Request, mockRes as Response, mockNext);
      expect(mockNext).toHaveBeenCalledTimes(1);

      // Request with API key 2 (different key, so passes)
      mockReq.headers = { 'x-api-key': 'key2' };
      mockNext = vi.fn();
      limiter(mockReq as Request, mockRes as Response, mockNext);
      expect(mockNext).toHaveBeenCalledTimes(1);

      // Request with API key 1 again (blocked)
      mockReq.headers = { 'x-api-key': 'key1' };
      mockNext = vi.fn();
      limiter(mockReq as Request, mockRes as Response, mockNext);
      expect(statusMock).toHaveBeenCalledWith(429);
    });

    it('should skip rate limiting when skip function returns true', () => {
      const limiter = createRateLimiter({
        windowMs: 60000,
        maxRequests: 1,
        skip: (req) => req.path === '/health',
      });

      // Health endpoint should be skipped
      mockReq.path = '/health';
      limiter(mockReq as Request, mockRes as Response, mockNext);
      limiter(mockReq as Request, mockRes as Response, mockNext);
      limiter(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(3);
      expect(statusMock).not.toHaveBeenCalled();
    });

    it('should set Retry-After header when rate limited', () => {
      const limiter = createRateLimiter({
        windowMs: 60000,
        maxRequests: 1,
      });

      limiter(mockReq as Request, mockRes as Response, mockNext);
      limiter(mockReq as Request, mockRes as Response, mockNext);

      expect(setHeaderMock).toHaveBeenCalledWith(
        'Retry-After',
        expect.any(Number)
      );
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
