'use client';

import { useLabOrderEvents } from '@/hooks/useLabOrderEvents';

/**
 * Client component that subscribes to real-time new order events for lab users
 * Displays toast notifications when new orders are submitted
 * Must be used within a component tree that has ToastProvider
 */
export function LabOrderNotifications() {
  // Subscribe to new order events
  useLabOrderEvents();

  // This component doesn't render anything - it just sets up the SSE subscription
  return null;
}
