import { EventEmitter } from 'events';
import { AlertStatus } from '@prisma/client';

/**
 * The payload for a new alert event.
 * The frontend needs order details and sender info to display the alert properly.
 * Dates are serialized as strings for JSON transmission.
 */
export type AlertEventPayload = {
  id: string;
  message: string;
  status: AlertStatus;
  orderId: string;
  senderId: string;
  receiverId: string;
  createdAt: string;
  readAt: string | null;
  resolvedAt: string | null;
  order: {
    id: string;
    orderNumber: string;
    patientName: string;
  };
  sender: {
    name: string | null;
    role: string;
  };
};

/**
 * The payload for a new order event (for lab users)
 * Sent when an order is submitted and changes to PENDING_REVIEW status
 */
export type NewOrderEventPayload = {
  orderId: string;
  orderNumber: string;
  patientName: string;
  clinicName: string;
  doctorName: string;
  createdAt: string;
  laboratoryId: string;
};

// Create and export a singleton instance of our event bus
const eventBus = new EventEmitter();

export default eventBus;
