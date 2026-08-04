import { useSyncExternalStore } from "react";

/**
 * Store minimalista (API estilo zustand, zero dependências).
 * SSR-safe: o snapshot do servidor devolve sempre o estado inicial.
 * `persistKey` grava o estado no sessionStorage a cada mutação e
 * reidrata via `hydrate()` (chamar uma vez no client, em useEffect).
 *
 * IMPORTANTE: selecione apenas fatias estáveis do estado
 * (ex.: `s => s.documentos`) — derivações (filter/map) devem ser
 * feitas com useMemo no componente, senão o snapshot muda a cada
 * render e o useSyncExternalStore entra em loop.
 */
export interface Store<T> {
  getState: () => T;
  setState: (patch: Partial<T> | ((s: T) => Partial<T>)) => void;
  subscribe: (listener: () => void) => () => void;
  useStore: <U>(selector: (s: T) => U) => U;
  hydrate: () => void;
  reset: () => void;
}

export function createStore<T>(initial: T, persistKey?: string): Store<T> {
  let state = initial;
  const listeners = new Set<() => void>();

  const notify = () => listeners.forEach((l) => l());

  const persist = () => {
    if (!persistKey || typeof window === "undefined") return;
    try {
      sessionStorage.setItem(persistKey, JSON.stringify(state));
    } catch {
      /* quota/inacessível — ignora (demo) */
    }
  };

  const setState: Store<T>["setState"] = (patch) => {
    const partial = typeof patch === "function" ? patch(state) : patch;
    state = { ...state, ...partial };
    persist();
    notify();
  };

  const subscribe = (listener: () => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };

  const hydrate = () => {
    if (!persistKey || typeof window === "undefined") return;
    try {
      const raw = sessionStorage.getItem(persistKey);
      if (raw) {
        state = { ...state, ...(JSON.parse(raw) as Partial<T>) };
        notify();
      }
    } catch {
      /* payload inválido — mantém seed */
    }
  };

  const reset = () => {
    state = initial;
    if (persistKey && typeof window !== "undefined") sessionStorage.removeItem(persistKey);
    notify();
  };

  const useStore = <U>(selector: (s: T) => U): U =>
    useSyncExternalStore(
      subscribe,
      () => selector(state),
      () => selector(initial),
    );

  return { getState: () => state, setState, subscribe, useStore, hydrate, reset };
}
