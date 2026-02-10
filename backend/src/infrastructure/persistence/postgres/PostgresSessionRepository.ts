/**
 * PostgreSQL Session Repository
 * Production-ready implementation using Drizzle ORM
 */
// export class PostgresSessionRepository implements ISessionRepository {
//   constructor(private db: PostgresJsDatabase) {}

//   async findOrCreate(id: SessionId): Promise<Session> {
//     const existing = await this.findById(id);
//     if (existing) {
//       // Touch the session
//       existing.touch();
//       await this.save(existing);
//       return existing;
//     }

//     const session = Session.create(id);
//     await this.save(session);
//     return session;
//   }

//   // W PostgresSessionRepository.ts
// async save(session: Session): Promise<void> {
//   const data = session.toData();

//   await this.db.execute(`
//     INSERT INTO sessions (id, used_word_ids, created_at, last_accessed_at, user_id)
//     VALUES ($1, $2, $3, $4, $5)
//     ON CONFLICT (id) DO UPDATE SET
//       used_word_ids = $2,
//       last_accessed_at = $4,
//       user_id = $5
//   `, [
//     data.id,
//     JSON.stringify(data.usedWordIds),
//     data.createdAt,
//     data.lastAccessedAt,
//     data.userId  // ← DODAJ
//   ]);
// }

// async findById(id: SessionId): Promise<Session | null> {
//   const result = await this.db.query(`
//     SELECT id, used_word_ids, created_at, last_accessed_at, user_id
//     FROM sessions WHERE id = $1
//   `, [id.toString()]);

//   if (result.rows.length === 0) return null;

//   const row = result.rows[0];
//   return Session.fromData({
//     id: row.id,
//     usedWordIds: JSON.parse(row.used_word_ids),
//     createdAt: row.created_at,
//     lastAccessedAt: row.last_accessed_at,
//     userId: row.user_id,  // ← DODAJ
//   });
// }

//   async delete(id: SessionId): Promise<boolean> {
//     const result = await this.db
//       .delete(sessions)
//       .where(eq(sessions.id, id.value))
//       .returning({ id: sessions.id });

//     return result.length > 0;
//   }

//   async deleteExpired(maxAgeMs: number): Promise<number> {
//     const cutoff = new Date(Date.now() - maxAgeMs);

//     const result = await this.db
//       .delete(sessions)
//       .where(lt(sessions.lastAccessedAt, cutoff))
//       .returning({ id: sessions.id });

//     return result.length;
//   }

//   async exists(id: SessionId): Promise<boolean> {
//     const session = await this.findById(id);
//     return session !== null;
//   }

//   async count(): Promise<number> {
//     const result = await this.db
//       .select({ count: sql<number>`count(*)::int` })
//       .from(sessions);

//     return result[0]?.count ?? 0;
//   }
// }
