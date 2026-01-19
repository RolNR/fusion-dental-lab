import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Role } from '@prisma/client';
import eventBus, { NewOrderEventPayload } from '@/lib/sse/eventBus';

// Ensure this route is not cached and is treated as dynamic
export const dynamic = 'force-dynamic';

/**
 * SSE endpoint for lab users (LAB_ADMIN and LAB_COLLABORATOR) to receive real-time new order notifications
 * Sends events when orders are submitted and change to PENDING_REVIEW status
 */
export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Only lab admin and lab collaborator can subscribe
  const userRole = session.user.role as Role;
  if (userRole !== Role.LAB_ADMIN && userRole !== Role.LAB_COLLABORATOR) {
    return new Response('Forbidden', { status: 403 });
  }

  // Get laboratory ID (both LAB_ADMIN and LAB_COLLABORATOR have laboratoryId)
  const laboratoryId = session.user.laboratoryId;
  if (!laboratoryId) {
    return new Response('Laboratory not found', { status: 400 });
  }

  const encoder = new TextEncoder();
  let cleanup = () => {};

  const stream = new ReadableStream({
    start(controller) {
      // Handler for broadcasting new order events
      const handleNewOrder = (payload: NewOrderEventPayload) => {
        // Only send the event if it's for this lab user's laboratory
        if (payload.laboratoryId === laboratoryId) {
          try {
            // Format the message according to the SSE spec
            controller.enqueue(encoder.encode(`event: new-order\n`));
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
          } catch (e) {
            console.error('SSE Error: Failed to enqueue data for lab user.', session.user.id, e);
          }
        }
      };

      // Add the listener to our global event bus
      eventBus.on('new-order', handleNewOrder);
      console.log(`SSE order-events connection established for lab user: ${session.user.id}`);

      // Define the cleanup function that will be called on disconnect
      cleanup = () => {
        eventBus.off('new-order', handleNewOrder);
        console.log(`SSE order-events connection closed for lab user: ${session.user.id}`);
      };

      // Send initial connection event
      try {
        controller.enqueue(encoder.encode(`event: connected\n`));
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ connected: true })}\n\n`));
      } catch (e) {
        console.error('SSE Error: Failed to send connection event', e);
      }
    },
    cancel() {
      // This method is called automatically when the client closes the connection
      cleanup();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      Connection: 'keep-alive',
      'Cache-Control': 'no-cache, no-transform',
    },
  });
}
