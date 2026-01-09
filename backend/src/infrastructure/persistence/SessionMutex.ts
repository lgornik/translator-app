/**
 * Session Mutex - Handles concurrent access to sessions
 * Implements optimistic locking pattern to prevent race conditions
 */

import { ILogger } from "../../application/interfaces/ILogger.js";

/**
 * Lock result
 */
export interface LockResult {
  acquired: boolean;
  release: () => Promise<void>;
}

/**
 * Session Mutex Interface
 * Provides distributed locking for session operations
 */
export interface ISessionMutex {
  /**
   * Acquire a lock for a session
   * @param sessionId - Session ID to lock
   * @param timeoutMs - Maximum time to wait for lock (default: 5000ms)
   * @returns Lock result with release function
   */
  acquire(sessionId: string, timeoutMs?: number): Promise<LockResult>;

  /**
   * Execute a function with exclusive access to a session
   * @param sessionId - Session ID to lock
   * @param fn - Function to execute while holding the lock
   * @param timeoutMs - Maximum time to wait for lock
   */
  withLock<T>(
    sessionId: string,
    fn: () => Promise<T>,
    timeoutMs?: number,
  ): Promise<T>;
}

/**
 * In-Memory Session Mutex
 * Uses a Map with Promises for lock management
 * Suitable for single-instance deployments
 */
export class InMemorySessionMutex implements ISessionMutex {
  private readonly locks = new Map<string, Promise<void>>();
  private readonly resolvers = new Map<string, () => void>();

  async acquire(sessionId: string, timeoutMs = 5000): Promise<LockResult> {
    const startTime = Date.now();

    // Wait for existing lock to be released
    while (this.locks.has(sessionId)) {
      if (Date.now() - startTime > timeoutMs) {
        return {
          acquired: false,
          release: async () => {},
        };
      }

      // Wait for the current lock to be released
      await this.locks.get(sessionId);
      await new Promise((resolve) => setTimeout(resolve, 10)); // Small delay to prevent tight loop
    }

    // Create new lock
    let resolver: () => void;
    const lockPromise = new Promise<void>((resolve) => {
      resolver = resolve;
    });

    this.locks.set(sessionId, lockPromise);
    this.resolvers.set(sessionId, resolver!);

    return {
      acquired: true,
      release: async () => {
        const resolve = this.resolvers.get(sessionId);
        this.locks.delete(sessionId);
        this.resolvers.delete(sessionId);
        if (resolve) resolve();
      },
    };
  }

  async withLock<T>(
    sessionId: string,
    fn: () => Promise<T>,
    timeoutMs = 5000,
  ): Promise<T> {
    const lock = await this.acquire(sessionId, timeoutMs);

    if (!lock.acquired) {
      throw new Error(
        `Failed to acquire lock for session ${sessionId} within ${timeoutMs}ms`,
      );
    }

    try {
      return await fn();
    } finally {
      await lock.release();
    }
  }
}

/**
 * Redis Session Mutex
 * Uses Redis for distributed locking
 * Suitable for multi-instance deployments
 */
export class RedisSessionMutex implements ISessionMutex {
  private client: RedisClient | null = null;
  private readonly lockPrefix = "session-lock:";
  private readonly defaultTTL = 30000; // 30 seconds

  constructor(
    private readonly redisUrl: string,
    private readonly logger: ILogger,
  ) {}

  async connect(): Promise<void> {
    try {
      // Dynamic import to avoid requiring redis when not used
      const { createClient } = await import("redis");
      this.client = createClient({ url: this.redisUrl });

      this.client.on("error", (err) => {
        this.logger.error("Redis client error", err);
      });

      await this.client.connect();
      this.logger.info("Redis session mutex connected");
    } catch (error) {
      this.logger.error("Failed to connect to Redis", error as Error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.client = null;
      this.logger.info("Redis session mutex disconnected");
    }
  }

  async acquire(sessionId: string, timeoutMs = 5000): Promise<LockResult> {
    if (!this.client) {
      throw new Error("Redis client not connected");
    }

    const lockKey = `${this.lockPrefix}${sessionId}`;
    const lockValue = `${Date.now()}-${Math.random().toString(36).substring(2)}`;
    const startTime = Date.now();

    // Try to acquire lock with retry
    while (Date.now() - startTime < timeoutMs) {
      const acquired = await this.client.set(lockKey, lockValue, {
        NX: true, // Only set if not exists
        PX: this.defaultTTL, // Expire after TTL
      });

      if (acquired) {
        return {
          acquired: true,
          release: async () => {
            // Only release if we still own the lock
            const currentValue = await this.client!.get(lockKey);
            if (currentValue === lockValue) {
              await this.client!.del(lockKey);
            }
          },
        };
      }

      // Wait a bit before retrying
      await new Promise((resolve) => setTimeout(resolve, 50));
    }

    return {
      acquired: false,
      release: async () => {},
    };
  }

  async withLock<T>(
    sessionId: string,
    fn: () => Promise<T>,
    timeoutMs = 5000,
  ): Promise<T> {
    const lock = await this.acquire(sessionId, timeoutMs);

    if (!lock.acquired) {
      throw new Error(
        `Failed to acquire Redis lock for session ${sessionId} within ${timeoutMs}ms`,
      );
    }

    try {
      return await fn();
    } finally {
      await lock.release();
    }
  }
}

// Type for Redis client (to avoid importing redis types when not needed)
interface RedisClient {
  connect(): Promise<void>;
  quit(): Promise<void>;
  set(
    key: string,
    value: string,
    options?: { NX?: boolean; PX?: number },
  ): Promise<string | null>;
  get(key: string): Promise<string | null>;
  del(key: string): Promise<number>;
  on(event: string, listener: (...args: unknown[]) => void): void;
}
