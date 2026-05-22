import { useEffect, useRef } from 'react';
import useSocketStore from '../store/useSocketStore';

const MAX_SYMBOLS = 50;
const WS_URL = `wss://ws.finnhub.io?token=${import.meta.env.VITE_FINNHUB_API_KEY}`;

let ws = null;
let subscribedSymbols = new Set();
let pendingSubscriptions = new Set();
let reconnectTimer = null;

function scheduleReconnect() {
  if (reconnectTimer) return;
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    if (!ws || ws.readyState === WebSocket.CLOSED) {
      createSocket();
    }
  }, 3000);
}

function createSocket() {
  if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) return;

  ws = new WebSocket(WS_URL);

  ws.onopen = () => {
    useSocketStore.getState().setConnected(true);
    for (const sym of pendingSubscriptions) {
      ws.send(JSON.stringify({ type: 'subscribe', symbol: sym }));
    }
    pendingSubscriptions.clear();
    // Re-subscribe any symbols that were active before disconnect
    for (const sym of subscribedSymbols) {
      ws.send(JSON.stringify({ type: 'subscribe', symbol: sym }));
    }
  };

  ws.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data);
      if (msg.type === 'trade' && msg.data) {
        for (const tick of msg.data) {
          useSocketStore.getState().updatePrice(tick.s, {
            price: tick.p,
            timestamp: tick.t,
            volume: tick.v,
          });
        }
      }
    } catch {
      // malformed frame — ignore
    }
  };

  ws.onerror = () => {
    useSocketStore.getState().setConnected(false);
  };

  ws.onclose = () => {
    useSocketStore.getState().setConnected(false);
    ws = null;
    scheduleReconnect();
  };
}

export function useFinnhubSocket(symbols = []) {
  const mountedSymbols = useRef(new Set());

  useEffect(() => {
    if (!import.meta.env.VITE_FINNHUB_API_KEY) return;

    const toSubscribe = symbols.filter(
      (s) => !subscribedSymbols.has(s) && subscribedSymbols.size < MAX_SYMBOLS
    );

    createSocket();

    for (const sym of toSubscribe) {
      subscribedSymbols.add(sym);
      mountedSymbols.current.add(sym);
      if (ws?.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'subscribe', symbol: sym }));
      } else {
        pendingSubscriptions.add(sym);
      }
    }

    return () => {
      for (const sym of mountedSymbols.current) {
        subscribedSymbols.delete(sym);
        if (ws?.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'unsubscribe', symbol: sym }));
        }
      }
      mountedSymbols.current.clear();
    };
  }, [symbols.join(',')]);
}
