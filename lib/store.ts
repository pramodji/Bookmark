import { create } from 'zustand';

interface AppState {
  theme: 'light' | 'dark';
  ready: boolean;
  toggleTheme: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

const saveToDb = (data: Record<string, any>) =>
  fetch('/api/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });

export const useStore = create<AppState>()((set, get) => ({
  theme: 'dark',
  ready: false,
  toggleTheme: () => {
    const next = get().theme === 'light' ? 'dark' : 'light';
    set({ theme: next });
    saveToDb({ theme: next });
  },
  searchQuery: '',
  setSearchQuery: (query) => {
    set({ searchQuery: query });
    saveToDb({ searchQuery: query });
  },
}));

let _loadPromise: Promise<void> | null = null;
export function loadStoreFromDb() {
  if (!_loadPromise) {
    _loadPromise = (async () => {
      try {
        const res = await fetch('/api/settings');
        const settings = await res.json();
        if (settings.theme) useStore.setState({ theme: settings.theme });
        if (settings.searchQuery !== undefined) useStore.setState({ searchQuery: settings.searchQuery });
      } catch {}
      useStore.setState({ ready: true });
    })();
  }
  return _loadPromise;
}
