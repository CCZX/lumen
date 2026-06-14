import { createStore } from 'zustand/vanilla';

export interface DebugLogEntry {
  type: 'request' | 'response' | 'error';
  timestamp: number;
  data: unknown;
}

interface DebugState {
  logs: DebugLogEntry[];
  isExpanded: boolean;
  addLog: (entry: Omit<DebugLogEntry, 'timestamp'>) => void;
  clearLogs: () => void;
  toggleExpanded: () => void;
  setExpanded: (expanded: boolean) => void;
}

export const debugStore = createStore<DebugState>()((set) => ({
  logs: [],
  isExpanded: false,
  addLog: (entry) =>
    set((state) => ({
      logs: [
        ...state.logs,
        { ...entry, timestamp: Date.now() },
      ],
    })),
  clearLogs: () => set({ logs: [] }),
  toggleExpanded: () => set((state) => ({ isExpanded: !state.isExpanded })),
  setExpanded: (expanded) => set({ isExpanded: expanded }),
}));