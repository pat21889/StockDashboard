import { useState, useEffect } from 'react';
import backend from '../api/backend';

export function useExchangeRate() {
  const [rate, setRate] = useState(33.5); // default fallback

  useEffect(() => {
    backend.get('/api/market/rate')
      .then(r => setRate(r.data.USDTHB || 33.5))
      .catch(() => {});
  }, []);

  return rate;
}
