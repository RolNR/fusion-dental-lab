import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import eventBus, { AlertEventPayload } from '@/lib/sse/eventBus';

// Ensure this route is not cached and is treated as dynamic
export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  const currentUserId = session.user.id;
  const encoder = new TextEncoder();
  let cleanup = () => {};

  const stream = new ReadableStream({
    start(controller) {
      // This is the main handler for broadcasting events.
      const handleNewAlert = (payload: AlertEventPayload) => {
        // Only send the event if it's intended for the currently logged-in user
        if (payload.receiverId === currentUserId) {
          try {
            // Format the message according to the SSE spec
            controller.enqueue(encoder.encode(`event: new-alert\n`));
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
          } catch (e) {
            console.error('SSE Error: Failed to enqueue data for user.', currentUserId, e);
          }
        }
      };

      // Add the listener to our global event bus
      eventBus.on('new-alert', handleNewAlert);
      console.log(`SSE connection established for user: ${currentUserId}`);

      // Define the cleanup function that will be called on disconnect
      cleanup = () => {
        eventBus.off('new-alert', handleNewAlert);
        console.log(`SSE connection closed for user: ${currentUserId}`);
      };
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
