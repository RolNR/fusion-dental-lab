import { PostHog } from 'posthog-node';

let posthogClient: PostHog | null = null;

export function getPostHogClient(): PostHog {
  if (!posthogClient) {
    posthogClient = new PostHog(process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN!, {
      host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
      flushAt: 1,
      flushInterval: 0,
    });
  }
  return posthogClient;
}

/**
 * Log an error locally and report it to PostHog.
 *
 * Use this in API route catch blocks instead of bare `console.error` so that
 * server-side exceptions show up in PostHog alongside the client-side errors
 * captured by `instrumentation-client.ts` (`capture_exceptions: true`).
 *
 * @param error   The thrown value (may be any type)
 * @param context A short string describing where the error occurred (e.g. "Error creating order")
 * @param extra   Optional structured metadata (userId, orderId, route, etc.)
 */
export function captureApiError(
  error: unknown,
  context: string,
  extra?: Record<string, unknown>
): void {
  // Preserve local log output for dev + server logs
  console.error(`${context}:`, error);

  try {
    const posthog = getPostHogClient();
    const normalized = error instanceof Error ? error : new Error(String(error));
    const distinctId =
      typeof extra?.userId === 'string' ? extra.userId : 'server-side-error';

    posthog.captureException(normalized, distinctId, {
      context,
      ...extra,
    });
  } catch (reportError) {
    // Never let telemetry failures break the request
    console.error('Failed to report error to PostHog:', reportError);
  }
}
