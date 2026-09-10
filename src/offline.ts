const prefix = 'railnav:';

export function saveOffline<T>(key: string, value: T): void {
  try { localStorage.setItem(prefix + key, JSON.stringify(value)); } catch { /* storage is optional */ }
}

export function loadOffline<T>(key: string): T | undefined {
  try {
    const value = localStorage.getItem(prefix + key);
    return value ? JSON.parse(value) as T : undefined;
  } catch { return undefined; }
}
