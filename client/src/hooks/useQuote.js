import { useState, useEffect } from 'react';
import { fetchIndices } from '../api/finnhub';

export function useIndices(intervalMs = 60000) {
  const [indices, setIndices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await fetchIndices();
        if (!cancelled) { setIndices(data); setLoading(false); }
      } catch (err) {
        if (!cancelled) { setError(err.message); setLoading(false); }
      }
    }

    load();
    const interval = setInterval(load, intervalMs);
    return () => { cancelled = true; clearInterval(interval); };
  }, [intervalMs]);

  return { indices, loading, error };
}
