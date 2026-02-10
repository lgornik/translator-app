import { IEventHandler } from "../events/IEventHandler.js";

/**
 * Metadata key dla oznaczenia handlera eventu
 */
export const EVENT_HANDLER_METADATA = Symbol("EventHandler");

/**
 * Decorator @EventHandler
 *
 * Oznacza klasę jako handler eventu i przechowuje typ eventu w metadanych.
 * Pozwala na automatyczną rejestrację w DI container.
 *
 * Użycie:
 * ```typescript
 * @EventHandler('AnswerSubmitted')
 * export class LoggingEventHandler implements IEventHandler<AnswerSubmitted> {
 *   readonly eventType = 'AnswerSubmitted';
 *
 *   async handle(event: AnswerSubmitted) {
 *     console.log('Answer submitted:', event);
 *   }
 * }
 * ```
 */
export function EventHandler(eventType: string, priority?: number) {
  return function <T extends { new (...args: any[]): IEventHandler }>(
    target: T,
  ) {
    // Przechowaj metadata
    Reflect.defineMetadata(
      EVENT_HANDLER_METADATA,
      { eventType, priority },
      target,
    );

    return target;
  };
}

/**
 * Sprawdź czy klasa ma decorator @EventHandler
 */
export function isEventHandler(target: any): boolean {
  return Reflect.hasMetadata(EVENT_HANDLER_METADATA, target);
}

/**
 * Pobierz metadata z decoratora
 */
export function getEventHandlerMetadata(target: any): {
  eventType: string;
  priority?: number;
} | null {
  if (!isEventHandler(target)) {
    return null;
  }
  return Reflect.getMetadata(EVENT_HANDLER_METADATA, target);
}

/**
 * UWAGA: Ten decorator wymaga 'reflect-metadata' package.
 * Dodaj do package.json:
 *
 * npm install reflect-metadata
 *
 * I zaimportuj na początku index.ts:
 *
 * import 'reflect-metadata';
 */
