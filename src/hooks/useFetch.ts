import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';

interface UseFetchOptions {
  autoFetch?: boolean;
}

export function useFetch<T>(url: string, options: UseFetchOptions = { autoFetch: true }) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(options.autoFetch ?? true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get<T>(url);
      setData(response.data);
    } catch (err: any) {
      console.error(`Error fetching ${url}:`, err);
      setError(err?.response?.data?.detail || err?.response?.data?.message || err?.message || 'Error fetching data');
    } finally {
      setLoading(false);
    }
  }, [url]);

  useEffect(() => {
    if (options.autoFetch) {
      fetchData();
    }
  }, [fetchData, options.autoFetch]);

  return { data, loading, error, refetch: fetchData, setData };
}
