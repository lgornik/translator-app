import { describe, it, expect, vi, beforeEach } from "vitest";
import { Request, Response, NextFunction } from "express";
import {
  createPerUserRateLimiter,
  PerUserRateLimitPresets,
} from "../../infrastructure/http/rateLimiter.js";

function createMockRequest(overrides: Partial<Request> = {}): Request {
  return {
    headers: {},
    ip: "127.0.0.1",
    socket: { remoteAddress: "127.0.0.1" },
    path: "/test",
    method: "GET",
    ...overrides,
  } as unknown as Request;
}

function createMockResponse(): Response {
  const res = {
    setHeader: vi.fn(),
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };
  return res as unknown as Response;
}

describe("createPerUserRateLimiter", () => {
  let next: NextFunction;

  beforeEach(() => {
    next = vi.fn();
  });

  describe("Basic Rate Limiting", () => {
    it("should allow requests under the limit", () => {
      const limiter = createPerUserRateLimiter({
        windowMs: 60000,
        maxRequests: 10,
      });

      const req = createMockRequest();
      const res = createMockResponse();

      limiter(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it("should block requests over the limit", () => {
      const limiter = createPerUserRateLimiter({
        windowMs: 60000,
        maxRequests: 2,
      });

      const req = createMockRequest({ ip: "1.2.3.4" });
      const res = createMockResponse();

      limiter(req, res, next);
      limiter(req, res, next);
      limiter(req, res, next);

      expect(res.status).toHaveBeenCalledWith(429);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: "RATE_LIMIT_EXCEEDED",
        }),
      );
    });

    it("should set rate limit headers", () => {
      const limiter = createPerUserRateLimiter({
        windowMs: 60000,
        maxRequests: 100,
      });

      const req = createMockRequest();
      const res = createMockResponse();

      limiter(req, res, next);

      expect(res.setHeader).toHaveBeenCalledWith("X-RateLimit-Limit", 100);
      expect(res.setHeader).toHaveBeenCalledWith(
        "X-RateLimit-Remaining",
        expect.any(Number),
      );
      expect(res.setHeader).toHaveBeenCalledWith(
        "X-RateLimit-Reset",
        expect.any(Number),
      );
    });
  });

  describe("Session-based Rate Limiting", () => {
    it("should use session ID from header", () => {
      const limiter = createPerUserRateLimiter({
        windowMs: 60000,
        maxRequests: 2,
        sessionHeader: "x-session-id",
      });

      const req1 = createMockRequest({
        headers: { "x-session-id": "session-1" },
      });
      const req2 = createMockRequest({
        headers: { "x-session-id": "session-2" },
      });
      const res = createMockResponse();

      limiter(req1, res, next);
      limiter(req1, res, next);
      limiter(req2, res, next);
      limiter(req2, res, next);

      expect(next).toHaveBeenCalledTimes(4);
    });

    it("should fall back to IP when no session", () => {
      const limiter = createPerUserRateLimiter({
        windowMs: 60000,
        maxRequests: 2,
      });

      const req = createMockRequest({
        ip: "192.168.1.1",
        headers: {},
      });
      const res = createMockResponse();

      limiter(req, res, next);
      limiter(req, res, next);
      limiter(req, res, next);

      expect(res.status).toHaveBeenCalledWith(429);
    });
  });

  describe("Tier-based Rate Limiting", () => {
    it("should apply different limits based on tier", () => {
      const limiter = createPerUserRateLimiter({
        windowMs: 60000,
        maxRequests: 1,
        tiers: {
          default: 1,
          authenticated: 3,
          premium: 10,
        },
        getTier: (req) => {
          if (req.headers["x-premium"]) return "premium";
          if (req.headers["x-session-id"]) return "authenticated";
          return "default";
        },
      });

      const authReq = createMockRequest({
        ip: "2.2.2.2",
        headers: { "x-session-id": "auth-session" },
      });
      const res = createMockResponse();

      limiter(authReq, res, next);
      limiter(authReq, res, next);
      limiter(authReq, res, next);

      expect(next).toHaveBeenCalledTimes(3);
    });

    it("should include tier in headers when not default", () => {
      const limiter = createPerUserRateLimiter({
        windowMs: 60000,
        maxRequests: 10,
        tiers: {
          default: 10,
          authenticated: 100,
        },
        getTier: (req) =>
          req.headers["x-session-id"] ? "authenticated" : "default",
      });

      const authReq = createMockRequest({
        headers: { "x-session-id": "test" },
      });
      const res = createMockResponse();

      limiter(authReq, res, next);

      expect(res.setHeader).toHaveBeenCalledWith(
        "X-RateLimit-Tier",
        "authenticated",
      );
    });
  });

  describe("Skip Function", () => {
    it("should skip rate limiting when skip returns true", () => {
      const limiter = createPerUserRateLimiter({
        windowMs: 60000,
        maxRequests: 1,
        skip: (req) => req.path === "/health",
      });

      const healthReq = createMockRequest({ path: "/health" });
      const res = createMockResponse();

      limiter(healthReq, res, next);
      limiter(healthReq, res, next);
      limiter(healthReq, res, next);

      expect(next).toHaveBeenCalledTimes(3);
    });
  });

  describe("Presets", () => {
    it("should have standard preset", () => {
      expect(PerUserRateLimitPresets.standard).toBeDefined();
      expect(PerUserRateLimitPresets.standard.windowMs).toBe(60000);
      expect(PerUserRateLimitPresets.standard.maxRequests).toBe(100);
    });

    it("should have quiz preset with tiers", () => {
      expect(PerUserRateLimitPresets.quiz).toBeDefined();
      expect(PerUserRateLimitPresets.quiz.tiers).toBeDefined();
      expect(PerUserRateLimitPresets.quiz.tiers?.default).toBe(60);
      expect(PerUserRateLimitPresets.quiz.tiers?.authenticated).toBe(200);
    });

    it("should have api preset", () => {
      expect(PerUserRateLimitPresets.api).toBeDefined();
      expect(PerUserRateLimitPresets.api.sessionHeader).toBe("x-api-key");
    });
  });
});
