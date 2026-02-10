import { Session, SessionData } from "../../domain/entities/Session.js";
import { SessionId } from "../../domain/value-objects/SessionId.js";
import { ISessionRepository } from "../../domain/repositories/ISessionRepository.js";

export interface InMemorySessionConfig {
  maxSessions: number;
  ttlMs: number;
  cleanupIntervalMs: number;
}

const DEFAULT_CONFIG: InMemorySessionConfig = {
  maxSessions: 10000,
  ttlMs: 24 * 60 * 60 * 1000,
  cleanupIntervalMs: 5 * 60 * 1000,
};

export class InMemorySessionRepository implements ISessionRepository {
  private sessions: Map<string, SessionData> = new Map(); // ← Store SessionData
  private readonly config: InMemorySessionConfig;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(config: Partial<InMemorySessionConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.startCleanup();
  }

  async findById(id: SessionId): Promise<Session | null> {
    const data = this.sessions.get(id.value);
    if (!data) return null;

    // Check if expired
    const session = Session.fromData(data);
    if (session.isExpired(this.config.ttlMs)) {
      this.sessions.delete(id.value);
      return null;
    }

    return session;
  }

  async findOrCreate(id: SessionId): Promise<Session> {
    const existing = await this.findById(id);

    if (existing) {
      existing.touch();
      await this.save(existing); // Save touched session
      return existing;
    }

    // Evict old sessions if at capacity
    this.evictIfNeeded();

    const session = Session.create(id);
    await this.save(session);
    return session;
  }

  async save(session: Session): Promise<void> {
    const data = session.toData();
    this.sessions.set(data.id, data);
  }

  async delete(id: SessionId): Promise<boolean> {
    return this.sessions.delete(id.value);
  }

  async deleteExpired(maxAgeMs?: number): Promise<number> {
    const ttl = maxAgeMs ?? this.config.ttlMs;
    let deleted = 0;

    for (const [id, data] of this.sessions.entries()) {
      const session = Session.fromData(data);
      if (session.isExpired(ttl)) {
        this.sessions.delete(id);
        deleted++;
      }
    }

    return deleted;
  }

  async exists(id: SessionId): Promise<boolean> {
    const session = await this.findById(id);
    return session !== null;
  }

  async count(): Promise<number> {
    return this.sessions.size;
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.sessions.clear();
  }

  getTtlMs(): number {
    return this.config.ttlMs;
  }

  private startCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      this.deleteExpired();
    }, this.config.cleanupIntervalMs);

    this.cleanupInterval.unref();
  }

  private evictIfNeeded(): void {
    if (this.sessions.size < this.config.maxSessions) {
      return;
    }

    let oldestId: string | null = null;
    let oldestTime = Date.now();

    for (const [id, data] of this.sessions.entries()) {
      const lastAccessed = new Date(data.lastAccessedAt).getTime();
      if (lastAccessed < oldestTime) {
        oldestTime = lastAccessed;
        oldestId = id;
      }
    }

    if (oldestId) {
      this.sessions.delete(oldestId);
    }
  }
}
