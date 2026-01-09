import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { InMemorySessionMutex } from "../../infrastructure/persistence/SessionMutex.js";

describe("InMemorySessionMutex", () => {
  let mutex: InMemorySessionMutex;

  beforeEach(() => {
    mutex = new InMemorySessionMutex();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("acquire", () => {
    it("should acquire lock for new session", async () => {
      const result = await mutex.acquire("session-1");

      expect(result.acquired).toBe(true);
      expect(result.release).toBeDefined();
    });

    it("should not acquire lock if already held", async () => {
      await mutex.acquire("session-1");

      // Try to acquire immediately (with 0 timeout)
      const result = await mutex.acquire("session-1", 0);

      expect(result.acquired).toBe(false);
    });

    it("should release lock and allow re-acquisition", async () => {
      const first = await mutex.acquire("session-1");
      expect(first.acquired).toBe(true);

      first.release();

      const second = await mutex.acquire("session-1");
      expect(second.acquired).toBe(true);
    });

    it("should allow different sessions to acquire locks simultaneously", async () => {
      const lock1 = await mutex.acquire("session-1");
      const lock2 = await mutex.acquire("session-2");

      expect(lock1.acquired).toBe(true);
      expect(lock2.acquired).toBe(true);
    });

    it("should wait and retry when lock is held", async () => {
      vi.useFakeTimers();

      const lock1 = await mutex.acquire("session-1");
      expect(lock1.acquired).toBe(true);

      // Start acquiring second lock (will wait)
      const acquirePromise = mutex.acquire("session-1", 1000);

      // Advance time a bit
      await vi.advanceTimersByTimeAsync(100);

      // Release first lock
      lock1.release();

      // Now the second acquire should succeed
      const lock2 = await acquirePromise;
      expect(lock2.acquired).toBe(true);
    });

    it("should timeout if lock cannot be acquired", async () => {
      vi.useFakeTimers();

      await mutex.acquire("session-1");

      const acquirePromise = mutex.acquire("session-1", 100);

      await vi.advanceTimersByTimeAsync(150);

      const result = await acquirePromise;
      expect(result.acquired).toBe(false);
    });

    it("should use default timeout", async () => {
      const lock = await mutex.acquire("session-1");
      expect(lock.acquired).toBe(true);
    });
  });

  describe("withLock", () => {
    it("should execute function with lock", async () => {
      const fn = vi.fn().mockResolvedValue("result");

      const result = await mutex.withLock("session-1", fn);

      expect(fn).toHaveBeenCalled();
      expect(result).toBe("result");
    });

    it("should release lock after function completes", async () => {
      await mutex.withLock("session-1", async () => "done");

      // Should be able to acquire lock again
      const lock = await mutex.acquire("session-1", 0);
      expect(lock.acquired).toBe(true);
    });

    it("should release lock even if function throws", async () => {
      await expect(
        mutex.withLock("session-1", async () => {
          throw new Error("Test error");
        }),
      ).rejects.toThrow("Test error");

      // Should be able to acquire lock again
      const lock = await mutex.acquire("session-1", 0);
      expect(lock.acquired).toBe(true);
    });

    it("should serialize concurrent operations on same session", async () => {
      const order: number[] = [];

      const op1 = mutex.withLock("session-1", async () => {
        order.push(1);
        await new Promise((r) => setTimeout(r, 50));
        order.push(2);
        return "op1";
      });

      const op2 = mutex.withLock("session-1", async () => {
        order.push(3);
        return "op2";
      });

      await Promise.all([op1, op2]);

      // Op1 should complete before op2 starts
      expect(order).toEqual([1, 2, 3]);
    });

    it("should allow concurrent operations on different sessions", async () => {
      const results: string[] = [];

      const op1 = mutex.withLock("session-1", async () => {
        await new Promise((r) => setTimeout(r, 50));
        results.push("session-1");
      });

      const op2 = mutex.withLock("session-2", async () => {
        results.push("session-2");
      });

      await Promise.all([op1, op2]);

      // Session-2 should complete first (no delay)
      expect(results[0]).toBe("session-2");
    });

    it("should throw if lock cannot be acquired", async () => {
      // Hold the lock
      const lock = await mutex.acquire("session-1");

      // Try withLock with very short timeout
      await expect(
        mutex.withLock("session-1", async () => "never", 0),
      ).rejects.toThrow("Failed to acquire lock");

      lock.release();
    });
  });

  describe("concurrency", () => {
    it("should handle many concurrent requests", async () => {
      let counter = 0;
      const operations = Array.from({ length: 10 }, (_, i) =>
        mutex.withLock("session-1", async () => {
          const current = counter;
          await new Promise((r) => setTimeout(r, 10));
          counter = current + 1;
          return i;
        }),
      );

      await Promise.all(operations);

      // Counter should be exactly 10 (no race conditions)
      expect(counter).toBe(10);
    });

    it("should process queue in order", async () => {
      const order: number[] = [];

      // Start multiple operations
      const ops = [1, 2, 3, 4, 5].map((n) =>
        mutex.withLock("session-1", async () => {
          order.push(n);
        }),
      );

      await Promise.all(ops);

      expect(order).toEqual([1, 2, 3, 4, 5]);
    });
  });
});
