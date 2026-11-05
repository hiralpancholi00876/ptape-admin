'use client';
import { useCallback, useSyncExternalStore } from 'react';

const listeners = new Set<() => void>();

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  window.addEventListener('storage', listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', listener);
  };
};

// A localStorage-backed string. The server render and hydration use `fallback`,
// so pages render identically on both sides before switching to the stored value.
export function useLocalStorage(key: string, fallback: string): [string, (value: string) => void] {
  const value = useSyncExternalStore(
    subscribe,
    () => localStorage.getItem(key) ?? fallback,
    () => fallback
  );

  const setValue = useCallback(
    (next: string) => {
      localStorage.setItem(key, next);
      listeners.forEach((listener) => listener());
    },
    [key]
  );

  return [value, setValue];
}
