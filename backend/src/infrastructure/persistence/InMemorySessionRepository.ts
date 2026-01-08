import { Session } from '../../domain/entities/Session.js';
import { SessionId } from '../../domain/value-objects/SessionId.js';
import { ISessionRepository } from '../../domain/repositories/ISessionRepository.js';

/**
 * Session repository configuration
 */
export interface InMemorySessionConfig {
  /** Maximum number of sessions to store */
  maxSessions: number;
  /** Session TTL in milliseconds (default: 24 hours) */
  ttlMs: number;
  /** Cleanup interval in milliseconds (default: 5 minutes) */
  cleanupIntervalMs: number;
}

const DEFAULT_CONFIG: InMemorySessionConfig = {
  maxSessions: 10000,
  ttlMs: 24 * 60 * 60 * 1000, // 24 hours
  cleanupIntervalMs: 5 * 60 * 1000, // 5 minutes
};

/**
 * In-Memory Session Repository with automatic TTL cleanup
 * Stores sessions in memory - suitable for development and single-instance deployments
 * For production with multiple instances, use Redis implementation
 */
export class InMemorySessionRepository implements ISessionRepository {
  private readonly sessions: Map<string, Session>;
  private readonly config: InMemorySessionConfig;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(config: Partial<InMemorySessionConfig> = {}) {
    this.sessions = new Map();
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    // Start automatic cleanup
    this.startCleanup();
  }

  async findById(id: SessionId): Promise<Session | null> {
    const session = this.sessions.get(id.value);
    
    if (!session) {
      return null;
    }
    
    // Check if session is expired
    if (session.isExpired(this.config.ttlMs)) {
      this.sessions.delete(id.value);
      return null;
    }
    
    session.touch();
    return session;
  }

  async findOrCreate(id: SessionId): Promise<Session> {
    let session = this.sessions.get(id.value);
    
    // Check if existing session is expired
    if (session && session.isExpired(this.config.ttlMs)) {
      this.sessions.delete(id.value);
      session = undefined;
    }
    
    if (!session) {
      // Evict old sessions if at capacity
      this.evictIfNeeded();
      
      session = Session.create(id);
      this.sessions.set(id.value, session);
    } else {
      session.touch();
    }

    return session;
  }

  async save(session: Session): Promise<void> {
    this.sessions.set(session.id.value, session);
  }

  async delete(id: SessionId): Promise<boolean> {
    return this.sessions.delete(id.value);
  }

  async deleteExpired(maxAgeMs?: number): Promise<number> {
    const ttl = maxAgeMs ?? this.config.ttlMs;
    let deleted = 0;

    for (const [id, session] of this.sessions.entries()) {
      if (session.isExpired(ttl)) {
        this.sessions.delete(id);
        deleted++;
      }
    }

    return deleted;
  }

  async exists(id: SessionId): Promise<boolean> {
    const session = this.sessions.get(id.value);
    
    if (!session) {
      return false;
    }
    
    // Check expiration
    if (session.isExpired(this.config.ttlMs)) {
      this.sessions.delete(id.value);
      return false;
    }
    
    return true;
  }

  /**
   * Get current session count (for monitoring)
   */
  async count(): Promise<number> {
    return this.sessions.size;
  }

  /**
   * Stop automatic cleanup (for graceful shutdown)
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.sessions.clear();
  }

  /**
   * Get TTL configuration (for monitoring)
   */
  getTtlMs(): number {
    return this.config.ttlMs;
  }

  /**
   * Start automatic cleanup of expired sessions
   */
  private startCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      this.deleteExpired();
    }, this.config.cleanupIntervalMs);
    
    // Don't prevent Node.js from exiting
    this.cleanupInterval.unref();
  }

  /**
   * Evict oldest sessions if at capacity
   */
  private evictIfNeeded(): void {
    if (this.sessions.size < this.config.maxSessions) {
      return;
    }

    // Find and remove oldest session
    let oldestId: string | null = null;
    let oldestTime = Date.now();

    for (const [id, session] of this.sessions.entries()) {
      if (session.lastAccessedAt.getTime() < oldestTime) {
        oldestTime = session.lastAccessedAt.getTime();
        oldestId = id;
      }
    }

    if (oldestId) {
      this.sessions.delete(oldestId);
    }
  }
}
