import { eq, lt, sql } from 'drizzle-orm';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { sessions } from './schema.js';
import { Session } from '../../../domain/entities/Session.js';
import { SessionId } from '../../../domain/value-objects/SessionId.js';
import { ISessionRepository } from '../../../domain/repositories/ISessionRepository.js';

/**
 * PostgreSQL Session Repository
 * Production-ready implementation using Drizzle ORM
 */
export class PostgresSessionRepository implements ISessionRepository {
  constructor(private db: PostgresJsDatabase) {}

  async findById(id: SessionId): Promise<Session | null> {
    const rows = await this.db
      .select()
      .from(sessions)
      .where(eq(sessions.id, id.value))
      .limit(1);

    if (rows.length === 0) return null;

    const row = rows[0]!;
    return Session.fromData({
      id: row.id,
      usedWordIds: JSON.parse(row.usedWordIds),
      createdAt: row.createdAt.toISOString(),
      lastAccessedAt: row.lastAccessedAt.toISOString(),
    });
  }

  async findOrCreate(id: SessionId): Promise<Session> {
    const existing = await this.findById(id);
    if (existing) {
      // Touch the session
      existing.touch();
      await this.save(existing);
      return existing;
    }

    const session = Session.create(id);
    await this.save(session);
    return session;
  }

  async save(session: Session): Promise<void> {
    const data = session.toData();

    await this.db
      .insert(sessions)
      .values({
        id: data.id,
        usedWordIds: JSON.stringify(data.usedWordIds),
        createdAt: new Date(data.createdAt),
        lastAccessedAt: new Date(data.lastAccessedAt),
      })
      .onConflictDoUpdate({
        target: sessions.id,
        set: {
          usedWordIds: JSON.stringify(data.usedWordIds),
          lastAccessedAt: new Date(data.lastAccessedAt),
        },
      });
  }

  async delete(id: SessionId): Promise<boolean> {
    const result = await this.db
      .delete(sessions)
      .where(eq(sessions.id, id.value))
      .returning({ id: sessions.id });

    return result.length > 0;
  }

  async deleteExpired(maxAgeMs: number): Promise<number> {
    const cutoff = new Date(Date.now() - maxAgeMs);

    const result = await this.db
      .delete(sessions)
      .where(lt(sessions.lastAccessedAt, cutoff))
      .returning({ id: sessions.id });

    return result.length;
  }

  async exists(id: SessionId): Promise<boolean> {
    const session = await this.findById(id);
    return session !== null;
  }

  async count(): Promise<number> {
    const result = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(sessions);

    return result[0]?.count ?? 0;
  }
}
