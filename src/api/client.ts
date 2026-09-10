import { AppNotification, Facility, RouteResponse, StationFloor, Train } from '../types';
import { STATION_DESTINATIONS } from '../data';
import { loadOffline, saveOffline } from '../offline';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
const USE_MOCKS = import.meta.env.VITE_USE_MOCKS !== 'false';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options?.headers || {}) },
  });
  if (!response.ok) throw new Error(`RailNav API request failed: ${response.status}`);
  return response.json() as Promise<T>;
}

const mockFacilities: Facility[] = STATION_DESTINATIONS.map((facility, index) => ({
  ...facility,
  id: `facility-${index + 1}`,
  stationId: 'ndls',
  floorId: facility.floor,
  accessible: facility.type !== 'escalators',
}));

export async function getFacilities(stationId = 'ndls', floor?: string): Promise<Facility[]> {
  if (USE_MOCKS) {
    return mockFacilities.filter((facility) => !floor || facility.floor === floor);
  }
  const key = `facilities:${stationId}:${floor || 'all'}`;
  try {
    const value = await request<Facility[]>(`/stations/${encodeURIComponent(stationId)}/facilities${floor ? `?floor=${encodeURIComponent(floor)}` : ''}`);
    saveOffline(key, value); return value;
  } catch (error) {
    const cached = loadOffline<Facility[]>(key); if (cached) return cached;
    throw error;
  }
}

export async function getFloors(stationId = 'ndls'): Promise<StationFloor[]> {
  if (USE_MOCKS) return [
    { id: 'GF', level: 'GF', label: 'Ground Floor' },
    { id: 'FF', level: 'FF', label: 'First Floor' },
    { id: 'SF', level: 'SF', label: 'Second Floor' },
  ];
  return request<StationFloor[]>(`/stations/${encodeURIComponent(stationId)}/floors`);
}

export async function getTrains(stationId = 'ndls'): Promise<Train[]> {
  if (USE_MOCKS) return [];
  return request<Train[]>(`/stations/${encodeURIComponent(stationId)}/trains`);
}

export async function getNotifications(stationId = 'ndls'): Promise<AppNotification[]> {
  if (USE_MOCKS) return [];
  return request<AppNotification[]>(`/notifications?station=${encodeURIComponent(stationId)}`);
}

export async function getRoute(
  from: string,
  to: string,
  stationId = 'ndls',
  accessible = false,
): Promise<RouteResponse> {
  if (USE_MOCKS) {
    const start = mockFacilities.find((facility) => facility.label === from || facility.id === from) || mockFacilities[0];
    const destination = mockFacilities.find((facility) => facility.label === to || facility.id === to) || mockFacilities[1];
    return {
      stationId,
      from: start.id,
      to: destination.id,
      distanceMeters: Math.round(Math.hypot(destination.x - start.x, destination.y - start.y)),
      steps: [{ instruction: `Walk to ${destination.label}`, distanceMeters: 180, floor: destination.floor, kind: 'walk' }, { instruction: `Arrive at ${destination.label}`, distanceMeters: 0, floor: destination.floor, kind: 'arrive' }],
      geometry: [start, destination].map(({ x, y, floor }) => ({ x, y, floor })),
    };
  }
  const key = `route:${stationId}:${from}:${to}:${accessible}`;
  try {
    const value = await request<RouteResponse>(`/route?station=${encodeURIComponent(stationId)}&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&accessible=${accessible}`);
    saveOffline(key, value); return value;
  } catch (error) {
    const cached = loadOffline<RouteResponse>(key); if (cached) return cached;
    throw error;
  }
}

export async function triggerSOS(payload: { stationId: string; floorId: string; note?: string }) {
  return request<{ id: string; status: string }>('/sos', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function subscribeToLiveEvents(stationId: string, onEvent: (event: AppNotification) => void) {
  if (USE_MOCKS) return () => undefined;
  if (typeof WebSocket !== 'undefined') {
    const wsBase = (API_BASE_URL || window.location.origin).replace(/^http/, 'ws');
    const socket = new WebSocket(`${wsBase}/ws?station=${encodeURIComponent(stationId)}`);
    socket.onmessage = (message) => {
      try { onEvent(JSON.parse(message.data) as AppNotification); } catch { /* Ignore malformed external events. */ }
    };
    socket.onerror = () => socket.close();
    return () => socket.close();
  }
  if (typeof EventSource === 'undefined') return () => undefined;
  const source = new EventSource(`${API_BASE_URL}/live?station=${encodeURIComponent(stationId)}`);
  source.onmessage = (message) => { try { onEvent(JSON.parse(message.data) as AppNotification); } catch { /* Ignore malformed events. */ } };
  return () => source.close();
}
