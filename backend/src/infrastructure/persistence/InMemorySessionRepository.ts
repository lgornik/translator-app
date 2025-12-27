import { Session } from '../../domain/entities/Session.js';
import { SessionId } from '../../domain/value-objects/SessionId.js';
import { ISessionRepository } from '../../domain/repositories/ISessionRepository.js';

/**
 * In-Memory Session Repository
 * Stores sessions in memory - suitable for development
 * In production, replace with Redis implementation
 */
export class InMemorySessionRepository implements ISessionRepository {
  private readonly sessions: Map<string, Session>;
  private readonly maxSessions: number;

  constructor(maxSessions: number = 10000) {
    this.sessions = new Map();
    this.maxSessions = maxSessions;
  }

  findById(id: SessionId): Session | null {
    const session = this.sessions.get(id.value);
    if (session) {
      session.touch();
    }
    return session ?? null;
  }

  findOrCreate(id: SessionId): Session {
    let session = this.sessions.get(id.value);
    
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

  save(session: Session): void {
    this.sessions.set(session.id.value, session);
  }

  delete(id: SessionId): boolean {
    return this.sessions.delete(id.value);
  }

  deleteExpired(maxAgeMs: number): number {
    let deleted = 0;

    for (const [id, session] of this.sessions.entries()) {
      if (session.isExpired(maxAgeMs)) {
        this.sessions.delete(id);
        deleted++;
      }
    }

    return deleted;
  }

  exists(id: SessionId): boolean {
    return this.sessions.has(id.value);
  }

  /**
   * Get current session count (for monitoring)
   */
  count(): number {
    return this.sessions.size;
  }

  /**
   * Evict oldest sessions if at capacity
   */
  private evictIfNeeded(): void {
    if (this.sessions.size < this.maxSessions) {
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
