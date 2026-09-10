import { AppNotification } from '../types';

export function subscribeWebSocket(stationId: string, onEvent: (event: AppNotification) => void, fallback?: () => () => void) {
  if (typeof WebSocket === 'undefined') return fallback?.() || (() => undefined);
  const base = (import.meta.env.VITE_API_BASE_URL || window.location.origin).replace(/^http/, 'ws').replace(/\/$/, '');
  const socket = new WebSocket(`${base}/ws?station=${encodeURIComponent(stationId)}`);
  socket.onmessage = (message) => {
    try { onEvent(JSON.parse(message.data) as AppNotification); } catch { /* Ignore malformed events. */ }
  };
  socket.onerror = () => { socket.close(); };
  return () => socket.close();
}
