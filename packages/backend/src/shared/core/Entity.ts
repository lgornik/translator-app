/**
 * Base Entity class
 * Entities have identity and lifecycle
 */
export abstract class Entity<TId> {
  protected readonly _id: TId;

  protected constructor(id: TId) {
    this._id = id;
  }

  get id(): TId {
    return this._id;
  }

  /**
   * Entities are equal if their IDs are equal
   */
  equals(other: Entity<TId>): boolean {
    if (other === null || other === undefined) {
      return false;
    }

    if (!(other instanceof Entity)) {
      return false;
    }

    return this._id === other._id;
  }
}

/**
 * Base class for Aggregate Roots
 * Aggregate roots are entry points to aggregates and can emit domain events
 */
export abstract class AggregateRoot<TId> extends Entity<TId> {
  private _domainEvents: DomainEvent[] = [];

  protected constructor(id: TId) {
    super(id);
  }

  get domainEvents(): ReadonlyArray<DomainEvent> {
    return this._domainEvents;
  }

  protected addDomainEvent(event: DomainEvent): void {
    this._domainEvents.push(event);
  }

  clearDomainEvents(): void {
    this._domainEvents = [];
  }
}

/**
 * Domain Event base interface
 */
export interface DomainEvent {
  readonly occurredOn: Date;
  readonly eventType: string;
}

/**
 * Base class for creating domain events
 */
export abstract class BaseDomainEvent implements DomainEvent {
  readonly occurredOn: Date;
  abstract readonly eventType: string;

  protected constructor() {
    this.occurredOn = new Date();
  }
}
