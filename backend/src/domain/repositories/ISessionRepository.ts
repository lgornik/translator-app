import { Session } from '../entities/Session.js';
import { SessionId } from '../value-objects/SessionId.js';

/**
 * Session Repository Interface (Port)
 * Defines the contract for session persistence
 * Implementations are in the infrastructure layer
 */
export interface ISessionRepository {
  /**
   * Find session by ID
   */
  findById(id: SessionId): Promise<Session | null>;

  /**
   * Find or create a session
   */
  findOrCreate(id: SessionId): Promise<Session>;

  /**
   * Save session state
   */
  save(session: Session): Promise<void>;

  /**
   * Delete a session
   */
  delete(id: SessionId): Promise<boolean>;

  /**
   * Delete expired sessions
   */
  deleteExpired(maxAgeMs: number): Promise<number>;

  /**
   * Check if session exists
   */
  exists(id: SessionId): Promise<boolean>;

  /**
   * Get total count of active sessions
   */
  count(): Promise<number>;
}
