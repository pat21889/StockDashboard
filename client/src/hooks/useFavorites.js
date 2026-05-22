import { useState, useEffect, useCallback } from 'react';
import backend from '../api/backend';
import toast from 'react-hot-toast';

export function useFavorites() {
  const [favorites, setFavorites] = useState([]);

  const load = useCallback(async () => {
    try {
      const { data } = await backend.get('/api/market/favorites');
      setFavorites(data);
    } catch { /* non-fatal */ }
  }, []);

  useEffect(() => { load(); }, [load]);

  const add = useCallback(async (symbol, market, name) => {
    try {
      await backend.post('/api/market/favorites', { symbol, market, name });
      setFavorites(prev => {
        if (prev.find(f => f.symbol === symbol)) return prev;
        return [{ symbol, market, name }, ...prev];
      });
    } catch (err) {
      toast.error('Could not add to favorites');
    }
  }, []);

  const remove = useCallback(async (symbol) => {
    try {
      await backend.delete(`/api/market/favorites/${symbol}`);
      setFavorites(prev => prev.filter(f => f.symbol !== symbol));
    } catch {
      toast.error('Could not remove favorite');
    }
  }, []);

  const isFavorite = useCallback((symbol) => favorites.some(f => f.symbol === symbol), [favorites]);

  return { favorites, add, remove, isFavorite };
}
