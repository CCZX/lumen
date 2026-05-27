import { useStore } from 'zustand';
import { createStore } from 'zustand/vanilla';
import { DEFAULT_BASE_URL, DEFAULT_MODEL } from '../config/defaults.js';
import type { AgentConfig } from '../config/types.js';

interface ConfigState {
  config: AgentConfig;
  setConfig: (config: AgentConfig) => void;
  patchConfig: (config: Partial<AgentConfig>) => void;
}

export const configStore = createStore<ConfigState>()((set) => ({
  config: {
    apiKey: '',
    baseURL: DEFAULT_BASE_URL,
    model: DEFAULT_MODEL,
  },
  setConfig: (config) => set({ config }),
  patchConfig: (config) =>
    set((state) => ({
      config: {
        ...state.config,
        ...config,
      },
    })),
}));

export function useConfigStore<T>(selector: (state: ConfigState) => T): T {
  return useStore(configStore, selector);
}
