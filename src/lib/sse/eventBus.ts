import { EventEmitter } from 'events';
import { Alert, Order } from '@prisma/client';

/**
 * The payload for a new alert event.
 * The frontend needs some order details along with the alert
 * to create a meaningful notification.
 */
export type AlertEventPayload = Alert & {
  order: Pick<Order, 'id' | 'orderNumber'>;
};

// Define a type-safe interface for our event bus events
interface AlertEvents {
  'new-alert': (payload: AlertEventPayload) => void;
}

// We need to declare the interface for our typed emitter
// to get proper type-checking and IntelliSense.
declare interface TypedEventEmitter<T extends Record<string, (...args: any[]) => void>> {
  on<E extends keyof T>(event: E, listener: T[E]): this;
  once<E extends keyof T>(event: E, listener: T[E]): this;
  off<E extends keyof T>(event: E, listener: T[E]): this;
  emit<E extends keyof T>(event: E, ...args: Parameters<T[E]>): boolean;
}

/**
 * A type-safe event emitter class.
 */
class TypedEventEmitter<
  T extends Record<string, (...args: any[]) => void>
> extends EventEmitter {}

// Create and export a singleton instance of our typed event bus
const eventBus = new TypedEventEmitter<AlertEvents>();

export default eventBus;
