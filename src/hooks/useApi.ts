import { useEffect, useState, useCallback } from 'react';

interface UseApiOptions extends RequestInit {
  skip?: boolean; // Skip automatic fetching
}

interface UseApiResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Custom hook for fetching data from API endpoints
 *
 * @param url - API endpoint URL (null to skip fetching)
 * @param options - Fetch options including skip flag
 * @returns Object containing data, loading state, error, and refetch function
 *
 * @example
 * // Basic usage
 * const { data, loading, error } = useApi<Order>('/api/orders/123');
 *
 * @example
 * // With skip flag
 * const { data, loading, error, refetch } = useApi<Order[]>(
 *   '/api/orders',
 *   { skip: !isAuthenticated }
 * );
 *
 * @example
 * // Manual refetch
 * const { data, refetch } = useApi<Order>('/api/orders/123');
 * // Later...
 * await refetch();
 */
export function useApi<T>(url: string | null, options?: UseApiOptions): UseApiResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { skip, ...fetchOptions } = options || {};

  const fetchData = useCallback(async () => {
    if (!url || skip) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(url, fetchOptions);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Error: ${response.statusText}`);
      }

      const result = await response.json();
      setData(result);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido al cargar datos';
      setError(errorMessage);
      setData(null);
      console.error('API fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [url, skip, JSON.stringify(fetchOptions)]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}
