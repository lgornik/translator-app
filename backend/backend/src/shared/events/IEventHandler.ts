import { DomainEvent } from "./DomainEvent.js";

/**
 * Event Handler Interface
 *
 * Definiuje kontrakt dla klas które obsługują eventy domenowe.
 * Każdy handler powinien być odpowiedzialny za JEDNĄ rzecz (SRP).
 */
export interface IEventHandler<T extends DomainEvent = DomainEvent> {
  /**
   * Nazwa eventu który handler obsługuje
   * Np. "AnswerSubmitted", "SessionCompleted"
   */
  readonly eventType: string;

  /**
   * Obsłuż event
   *
   * WAŻNE: Handler powinien być idempotentny - wywołanie
   * wielokrotne z tym samym eventem nie powinno powodować błędów.
   *
   * Handler NIE powinien rzucać wyjątkami - jeśli coś pójdzie nie tak,
   * powinien logować błąd i kontynuować (fail gracefully).
   */
  handle(event: T): Promise<void> | void;
}

/**
 * Event Handler z priorytetem
 *
 * Przydatne gdy masz wiele handlerów tego samego eventu
 * i chcesz kontrolować kolejność wykonania.
 */
export interface IPrioritizedEventHandler<
  T extends DomainEvent = DomainEvent,
> extends IEventHandler<T> {
  /**
   * Priorytet (niższy = wcześniej)
   * Domyślnie: 100
   *
   * Przykład:
   * - Logging handler: priority 1 (pierwszy)
   * - Business logic: priority 100 (normalny)
   * - Analytics: priority 1000 (ostatni)
   */
  readonly priority?: number;
}

/**
 * Type guard dla sprawdzenia czy handler ma priorytet
 */
export function hasPriority(
  handler: IEventHandler,
): handler is IPrioritizedEventHandler {
  return "priority" in handler && typeof handler.priority === "number";
}
