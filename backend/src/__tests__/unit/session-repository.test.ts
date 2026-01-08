import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { InMemorySessionRepository } from '../../infrastructure/persistence/InMemorySessionRepository.js';
import { SessionId } from '../../domain/value-objects/SessionId.js';

describe('InMemorySessionRepository', () => {
  let repository: InMemorySessionRepository;

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    repository?.destroy();
    vi.useRealTimers();
  });

  describe('TTL Expiration', () => {
    it('should return null for expired sessions on findById', async () => {
      repository = new InMemorySessionRepository({
        ttlMs: 1000, // 1 second TTL
        cleanupIntervalMs: 60000,
      });

      const sessionId = SessionId.fromTrusted('test-session-1');
      await repository.findOrCreate(sessionId);

      // Session exists initially
      const session1 = await repository.findById(sessionId);
      expect(session1).not.toBeNull();

      // Advance time past TTL
      vi.advanceTimersByTime(1500);

      // Session should be expired and return null
      const session2 = await repository.findById(sessionId);
      expect(session2).toBeNull();
    });

    it('should create new session when existing is expired', async () => {
      repository = new InMemorySessionRepository({
        ttlMs: 1000,
        cleanupIntervalMs: 60000,
      });

      const sessionId = SessionId.fromTrusted('test-session-2');
      const session1 = await repository.findOrCreate(sessionId);
      const originalCreatedAt = session1.createdAt;

      // Advance time past TTL
      vi.advanceTimersByTime(1500);

      // Should create new session
      const session2 = await repository.findOrCreate(sessionId);
      expect(session2.createdAt.getTime()).toBeGreaterThan(originalCreatedAt.getTime());
    });

    it('should return false for exists() on expired session', async () => {
      repository = new InMemorySessionRepository({
        ttlMs: 1000,
        cleanupIntervalMs: 60000,
      });

      const sessionId = SessionId.fromTrusted('test-session-3');
      await repository.findOrCreate(sessionId);

      expect(await repository.exists(sessionId)).toBe(true);

      // Advance time past TTL
      vi.advanceTimersByTime(1500);

      expect(await repository.exists(sessionId)).toBe(false);
    });

    it('should extend TTL on touch (via findById)', async () => {
      repository = new InMemorySessionRepository({
        ttlMs: 1000,
        cleanupIntervalMs: 60000,
      });

      const sessionId = SessionId.fromTrusted('test-session-4');
      await repository.findOrCreate(sessionId);

      // Access at 500ms - should touch and extend
      vi.advanceTimersByTime(500);
      const session1 = await repository.findById(sessionId);
      expect(session1).not.toBeNull();

      // Access at 1000ms (500ms after last touch) - should still be valid
      vi.advanceTimersByTime(500);
      const session2 = await repository.findById(sessionId);
      expect(session2).not.toBeNull();

      // Access at 1500ms (500ms after last touch) - should still be valid
      vi.advanceTimersByTime(500);
      const session3 = await repository.findById(sessionId);
      expect(session3).not.toBeNull();
    });
  });

  describe('Automatic Cleanup', () => {
    it('should clean up expired sessions on interval', async () => {
      repository = new InMemorySessionRepository({
        ttlMs: 1000,
        cleanupIntervalMs: 2000,
      });

      // Create multiple sessions
      const sessionId1 = SessionId.fromTrusted('cleanup-1');
      const sessionId2 = SessionId.fromTrusted('cleanup-2');
      await repository.findOrCreate(sessionId1);
      await repository.findOrCreate(sessionId2);

      expect(await repository.count()).toBe(2);

      // Advance time past TTL but before cleanup
      vi.advanceTimersByTime(1500);
      expect(await repository.count()).toBe(2); // Not cleaned yet

      // Advance to trigger cleanup
      vi.advanceTimersByTime(1000);
      expect(await repository.count()).toBe(0); // Cleaned up
    });

    it('should only clean up expired sessions', async () => {
      repository = new InMemorySessionRepository({
        ttlMs: 2000,
        cleanupIntervalMs: 1000,
      });

      const sessionId1 = SessionId.fromTrusted('keep-1');
      await repository.findOrCreate(sessionId1);

      // Advance 1.5s
      vi.advanceTimersByTime(1500);

      // Create new session
      const sessionId2 = SessionId.fromTrusted('keep-2');
      await repository.findOrCreate(sessionId2);

      // Advance to trigger cleanup (sessionId1 is now 2.5s old, sessionId2 is 0.5s old)
      vi.advanceTimersByTime(1000);

      // sessionId1 should be deleted, sessionId2 should remain
      expect(await repository.exists(sessionId1)).toBe(false);
      expect(await repository.exists(sessionId2)).toBe(true);
    });
  });

  describe('Capacity Management', () => {
    it('should evict oldest session when at capacity', async () => {
      repository = new InMemorySessionRepository({
        maxSessions: 2,
        ttlMs: 60000,
        cleanupIntervalMs: 60000,
      });

      const sessionId1 = SessionId.fromTrusted('evict-1');
      await repository.findOrCreate(sessionId1);

      vi.advanceTimersByTime(100);

      const sessionId2 = SessionId.fromTrusted('evict-2');
      await repository.findOrCreate(sessionId2);

      vi.advanceTimersByTime(100);

      // At capacity (2), creating third should evict oldest (sessionId1)
      const sessionId3 = SessionId.fromTrusted('evict-3');
      await repository.findOrCreate(sessionId3);

      expect(await repository.exists(sessionId1)).toBe(false);
      expect(await repository.exists(sessionId2)).toBe(true);
      expect(await repository.exists(sessionId3)).toBe(true);
    });
  });

  describe('deleteExpired', () => {
    it('should delete expired sessions and return count', async () => {
      repository = new InMemorySessionRepository({
        ttlMs: 1000,
        cleanupIntervalMs: 60000, // Long interval to prevent auto-cleanup
      });

      // Create sessions
      await repository.findOrCreate(SessionId.fromTrusted('delete-1'));
      await repository.findOrCreate(SessionId.fromTrusted('delete-2'));
      await repository.findOrCreate(SessionId.fromTrusted('delete-3'));

      expect(await repository.count()).toBe(3);

      // Advance past TTL
      vi.advanceTimersByTime(1500);

      // Manually call deleteExpired
      const deleted = await repository.deleteExpired();
      expect(deleted).toBe(3);
      expect(await repository.count()).toBe(0);
    });

    it('should use custom maxAgeMs if provided', async () => {
      repository = new InMemorySessionRepository({
        ttlMs: 10000, // Default 10s TTL
        cleanupIntervalMs: 60000,
      });

      await repository.findOrCreate(SessionId.fromTrusted('custom-1'));

      // Advance 2 seconds
      vi.advanceTimersByTime(2000);

      // Delete with 1 second maxAge (should delete the session)
      const deleted = await repository.deleteExpired(1000);
      expect(deleted).toBe(1);
    });
  });

  describe('destroy', () => {
    it('should clear all sessions and stop cleanup interval', async () => {
      repository = new InMemorySessionRepository({
        ttlMs: 60000,
        cleanupIntervalMs: 1000,
      });

      await repository.findOrCreate(SessionId.fromTrusted('destroy-1'));
      await repository.findOrCreate(SessionId.fromTrusted('destroy-2'));

      expect(await repository.count()).toBe(2);

      repository.destroy();

      expect(await repository.count()).toBe(0);
    });
  });

  describe('getTtlMs', () => {
    it('should return configured TTL', () => {
      repository = new InMemorySessionRepository({
        ttlMs: 5000,
      });

      expect(repository.getTtlMs()).toBe(5000);
    });

    it('should use default TTL if not specified', () => {
      repository = new InMemorySessionRepository();

      expect(repository.getTtlMs()).toBe(24 * 60 * 60 * 1000); // 24 hours
    });
  });
});
