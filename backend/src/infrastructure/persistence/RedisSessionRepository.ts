/**
 * Redis Session Repository
 * Distributed session storage using Redis
 * Suitable for production multi-instance deployments
 */

import { Session, SessionData } from "../../domain/entities/Session.js";
import { SessionId } from "../../domain/value-objects/SessionId.js";
import { ISessionRepository } from "../../domain/repositories/ISessionRepository.js";
import { ILogger } from "../../application/interfaces/ILogger.js";

/**
 * Redis Session Repository Configuration
 */
export interface RedisSessionConfig {
  /** Session TTL in milliseconds (default: 24 hours) */
  ttlMs: number;
  /** Key prefix for sessions */
  keyPrefix: string;
}

const DEFAULT_CONFIG: RedisSessionConfig = {
  ttlMs: 24 * 60 * 60 * 1000, // 24 hours
  keyPrefix: "session:",
};

/**
 * Redis client interface (to avoid importing redis types when not needed)
 */
interface RedisClient {
  connect(): Promise<void>;
  quit(): Promise<void>;
  get(key: string): Promise<string | null>;
  set(
    key: string,
    value: string,
    options?: { PX?: number },
  ): Promise<string | null>;
  del(key: string | string[]): Promise<number>;
  exists(key: string): Promise<number>;
  keys(pattern: string): Promise<string[]>;
  ttl(key: string): Promise<number>;
  on(event: string, listener: (...args: unknown[]) => void): void;
}

/**
 * Redis Session Repository
 * Stores sessions in Redis for distributed access
 */
export class RedisSessionRepository implements ISessionRepository {
  private client: RedisClient | null = null;
  private readonly config: RedisSessionConfig;
  private isConnected = false;

  constructor(
    private readonly redisUrl: string,
    private readonly logger: ILogger,
    config: Partial<RedisSessionConfig> = {},
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Connect to Redis
   */
  async connect(): Promise<void> {
    if (this.isConnected) return;

    try {
      const { createClient } = await import("redis");
      this.client = createClient({ url: this.redisUrl }) as RedisClient;

      this.client.on("error", (err) => {
        this.logger.error("Redis session repository error", err as Error);
      });

      this.client.on("reconnecting", () => {
        this.logger.warn("Redis session repository reconnecting");
      });

      await this.client.connect();
      this.isConnected = true;
      this.logger.info("Redis session repository connected", {
        url: this.redisUrl,
      });
    } catch (error) {
      this.logger.error(
        "Failed to connect Redis session repository",
        error as Error,
      );
      throw error;
    }
  }

  /**
   * Disconnect from Redis
   */
  async disconnect(): Promise<void> {
    if (this.client && this.isConnected) {
      await this.client.quit();
      this.isConnected = false;
      this.client = null;
      this.logger.info("Redis session repository disconnected");
    }
  }

  private ensureConnected(): void {
    if (!this.client || !this.isConnected) {
      throw new Error("Redis session repository not connected");
    }
  }

  private getKey(id: string): string {
    return `${this.config.keyPrefix}${id}`;
  }

  async findById(id: SessionId): Promise<Session | null> {
    this.ensureConnected();

    const key = this.getKey(id.value);
    const data = await this.client!.get(key);

    if (!data) {
      return null;
    }

    try {
      const sessionData: SessionData = JSON.parse(data);
      const session = Session.fromData(sessionData);

      // Touch the session (extend TTL)
      session.touch();
      await this.save(session);

      return session;
    } catch (error) {
      this.logger.error("Failed to parse session data", error as Error, {
        sessionId: id.value,
      });
      // Delete corrupted data
      await this.client!.del(key);
      return null;
    }
  }

  async findOrCreate(id: SessionId): Promise<Session> {
    this.ensureConnected();

    const existing = await this.findById(id);
    if (existing) {
      return existing;
    }

    const session = Session.create(id);
    await this.save(session);
    return session;
  }

  async save(session: Session): Promise<void> {
    this.ensureConnected();

    const key = this.getKey(session.id.value);
    const data = JSON.stringify(session.toData());

    await this.client!.set(key, data, {
      PX: this.config.ttlMs, // Set TTL in milliseconds
    });
  }

  async delete(id: SessionId): Promise<boolean> {
    this.ensureConnected();

    const key = this.getKey(id.value);
    const deleted = await this.client!.del(key);
    return deleted > 0;
  }

  async deleteExpired(_maxAgeMs?: number): Promise<number> {
    // Redis handles expiration automatically via TTL
    // This method is a no-op for Redis implementation
    // but we can scan for any manually expired sessions if needed
    return 0;
  }

  async exists(id: SessionId): Promise<boolean> {
    this.ensureConnected();

    const key = this.getKey(id.value);
    const exists = await this.client!.exists(key);
    return exists > 0;
  }

  async count(): Promise<number> {
    this.ensureConnected();

    // Get all session keys
    const pattern = `${this.config.keyPrefix}*`;
    const keys = await this.client!.keys(pattern);
    return keys.length;
  }

  /**
   * Get TTL configuration
   */
  getTtlMs(): number {
    return this.config.ttlMs;
  }

  /**
   * Check if connected to Redis
   */
  isReady(): boolean {
    return this.isConnected && this.client !== null;
  }

  /**
   * Destroy the repository (alias for disconnect)
   */
  async destroy(): Promise<void> {
    await this.disconnect();
  }
}

/**
 * Create Redis session repository with automatic connection
 */
export async function createRedisSessionRepository(
  redisUrl: string,
  logger: ILogger,
  config: Partial<RedisSessionConfig> = {},
): Promise<RedisSessionRepository> {
  const repository = new RedisSessionRepository(redisUrl, logger, config);
  await repository.connect();
  return repository;
}
