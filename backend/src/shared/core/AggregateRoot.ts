import { Entity } from "../../shared/core/Entity.js";
import { DomainEvent } from "../../shared/events/DomainEvent.js";

/**
 * Aggregate Root
 *
 * Rozszerzenie Entity o możliwość gromadzenia Domain Events.
 * Każdy Aggregate może emitować eventy, które są publikowane
 * przez Use Case po zakończeniu operacji.
 *
 * Pattern: Event Sourcing Light
 * - Eventy są gromadzone w agregacie
 * - Use Case po commitcie publikuje je przez Event Bus
 * - NIE zapisujemy eventów do event store (to byłby full Event Sourcing)
 */
export abstract class AggregateRoot<T> extends Entity<T> {
  private _domainEvents: DomainEvent[] = [];

  /**
   * Pobierz wszystkie zgromadzone eventy
   */
  get domainEvents(): ReadonlyArray<DomainEvent> {
    return this._domainEvents;
  }

  /**
   * Dodaj event do listy
   *
   * WAŻNE: Event NIE jest od razu publikowany!
   * Use Case musi go wyciągnąć i opublikować przez Event Bus.
   */
  protected addDomainEvent(event: DomainEvent): void {
    this._domainEvents.push(event);
  }

  /**
   * Wyczyść listę eventów
   *
   * Wywoływane przez Use Case po publikacji eventów.
   */
  clearDomainEvents(): void {
    this._domainEvents = [];
  }

  /**
   * Sprawdź czy agregat ma eventy do publikacji
   */
  hasDomainEvents(): boolean {
    return this._domainEvents.length > 0;
  }
}
