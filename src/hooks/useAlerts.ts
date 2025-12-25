import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { AlertEventPayload } from '@/lib/sse/eventBus';
import { Role } from '@prisma/client';
import { useToast } from '@/contexts/ToastContext';
import { DEFAULT_TOAST_DURATION } from '@/lib/constants';

interface UseAlertsOptions {
  role: Role;
}

export function useAlerts({ role }: UseAlertsOptions) {
  const { data: session, status } = useSession();
  const { addToast } = useToast();
  const [alerts, setAlerts] = useState<AlertEventPayload[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // 1. Initial fetch for existing unread alerts
  useEffect(() => {
    if (status !== 'authenticated') return;

    const fetchInitialAlerts = async () => {
      try {
        setLoading(true);
        // Map role to API endpoint path
        const rolePath = role === Role.DOCTOR ? 'doctor' : 'assistant';
        const response = await fetch(`/api/${rolePath}/alerts`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch alerts');
        }
        const data = await response.json();
        setAlerts(data.alerts || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchInitialAlerts();
  }, [status, role]);

  // 2. Setup SSE connection for real-time updates
  useEffect(() => {
    if (status !== 'authenticated') return;

    const eventSource = new EventSource('/api/alerts/events');

    eventSource.onopen = () => {
      console.log('SSE connection established.');
    };

    eventSource.addEventListener('new-alert', (event) => {
      try {
        const newAlert = JSON.parse(event.data) as AlertEventPayload;

        // Add the new alert to the top of the list, preventing duplicates
        setAlerts((prevAlerts) => {
          if (prevAlerts.some(a => a.id === newAlert.id)) {
            return prevAlerts;
          }
          return [newAlert, ...prevAlerts];
        });

        // Show toast notification for the new alert
        addToast(
          `Nueva alerta: ${newAlert.order.patientName} - Orden #${newAlert.order.orderNumber}`,
          'info',
          DEFAULT_TOAST_DURATION
        );

      } catch (e) {
        console.error('Failed to parse SSE event data:', e);
      }
    });

    eventSource.onerror = (err) => {
      console.error('EventSource error:', err);
      // The browser will automatically try to reconnect.
      // We can close it here if we want to stop reconnection attempts.
      // eventSource.close();
    };

    // Cleanup the connection when the component unmounts
    return () => {
      if (eventSource) {
        console.log('Closing SSE connection.');
        eventSource.close();
      }
    };
  }, [status]);

  return { alerts, loading, error, setAlerts };
}
