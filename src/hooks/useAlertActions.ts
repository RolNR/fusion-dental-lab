import { useCallback } from 'react';

interface UseAlertActionsProps {
  role: 'doctor' | 'assistant';
  onAlertsUpdate: (updateFn: (prevAlerts: any[]) => any[]) => void;
}

export function useAlertActions({ role, onAlertsUpdate }: UseAlertActionsProps) {
  const baseUrl = role === 'doctor' ? '/api/doctor' : '/api/assistant';

  const handleMarkAsRead = useCallback(async (alertId: string) => {
    try {
      const response = await fetch(`${baseUrl}/alerts/${alertId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'READ' }),
      });

      if (!response.ok) {
        throw new Error('Error al marcar alerta como leída');
      }

      const data = await response.json();

      // Update the alert in the local state
      onAlertsUpdate((prevAlerts) =>
        prevAlerts.map((alert) =>
          alert.id === alertId ? { ...alert, ...data.alert } : alert
        )
      );
    } catch (error) {
      console.error('Error marking alert as read:', error);
    }
  }, [baseUrl, onAlertsUpdate]);

  const handleDeleteAlert = useCallback(async (alertId: string) => {
    // Optimistically remove the alert from the UI
    onAlertsUpdate((prevAlerts) => prevAlerts.filter((alert) => alert.id !== alertId));

    try {
      const response = await fetch(`${baseUrl}/alerts/${alertId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Error al eliminar alerta');
      }
    } catch (error) {
      console.error('Error deleting alert:', error);
      // Note: In a production app, you might want to revert the optimistic update here
    }
  }, [baseUrl, onAlertsUpdate]);

  return {
    handleMarkAsRead,
    handleDeleteAlert,
  };
}
