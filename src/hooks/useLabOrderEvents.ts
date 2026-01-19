'use client';

import { useEffect, useRef } from 'react';
import { useToast } from '@/contexts/ToastContext';

export interface NewOrderEvent {
  orderId: string;
  orderNumber: string;
  patientName: string;
  clinicName: string;
  doctorName: string;
  createdAt: string;
  laboratoryId: string;
}

/**
 * Custom hook for lab users to receive real-time new order notifications via SSE
 * Shows toast notifications when new orders are submitted
 *
 * @param onNewOrder - Optional callback when a new order event is received
 */
export function useLabOrderEvents(onNewOrder?: (order: NewOrderEvent) => void) {
  const { addToast } = useToast();
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    // Create SSE connection
    const eventSource = new EventSource('/api/lab/order-events');
    eventSourceRef.current = eventSource;

    // Handle connection
    eventSource.addEventListener('connected', () => {
      console.log('Connected to order events');
    });

    // Handle new order events
    eventSource.addEventListener('new-order', (event) => {
      try {
        const order: NewOrderEvent = JSON.parse(event.data);

        // Show toast notification
        addToast(
          `Nueva orden #${order.orderNumber} de ${order.clinicName} - ${order.patientName}`,
          'info'
        );

        // Call optional callback
        if (onNewOrder) {
          onNewOrder(order);
        }
      } catch (error) {
        console.error('Error parsing new-order event:', error);
      }
    });

    // Handle errors
    eventSource.onerror = (error) => {
      console.error('SSE connection error:', error);
      eventSource.close();
    };

    // Cleanup on unmount
    return () => {
      eventSource.close();
      eventSourceRef.current = null;
    };
  }, [addToast, onNewOrder]);
}
