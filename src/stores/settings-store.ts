import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { createScopedPersistStorage } from '@/lib/scoped-storage';
import { useSaveStore } from '@/stores/save-store';

export type ThemePreference = 'light' | 'dark' | 'system';

interface SettingsState {
  workspaceName: string;
  theme: ThemePreference;
  /** AI использует docs + tasks для контекста (RAG). */
  aiUseDocs: boolean;
  aiUseTasks: boolean;
  aiUseGit: boolean;
  aiUseFigma: boolean;
  /** Локальный ключ до подключения backend. */
  openAiApiKey: string;
  autosaveDelayMs: number;
  update: (patch: Partial<Omit<SettingsState, 'update' | 'exportData' | 'clearAllLocalData'>>) => void;
  exportData: () => string;
  clearAllLocalData: () => void;
}

export function getAutosaveDelayMs(): number {
  return useSettingsStore.getState().autosaveDelayMs;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      workspaceName: 'Мой воркспейс',
      theme: 'system',
      aiUseDocs: true,
      aiUseTasks: true,
      aiUseGit: true,
      aiUseFigma: true,
      openAiApiKey: '',
      autosaveDelayMs: 3000,

      update: (patch) => {
        set(patch);
        useSaveStore.getState().markSaved();
      },

      exportData: () => {
        const keys = [
          'devos:projects',
          'devos:groups',
          'devos:tasks',
          'devos:docs',
          'devos:api',
          'devos:clients',
          'devos:git',
          'devos:roadmap',
          'devos:figma',
          'devos:settings',
        ];
        const data: Record<string, unknown> = {};
        for (const key of keys) {
          const raw = localStorage.getItem(key);
          if (raw) data[key] = JSON.parse(raw);
        }
        return JSON.stringify(data, null, 2);
      },

      clearAllLocalData: () => {
        const keys = [
          'devos:projects',
          'devos:groups',
          'devos:tasks',
          'devos:docs',
          'devos:api',
          'devos:clients',
          'devos:git',
          'devos:roadmap',
          'devos:figma',
          'devos:settings',
          'devos:auth',
          'devos:theme',
        ];
        keys.forEach((k) => localStorage.removeItem(k));
        window.location.href = '/login';
      },
    }),
    {
      name: 'devos:settings',
      skipHydration: true,
      storage: createJSONStorage(() => createScopedPersistStorage('devos:settings')),
      version: 1,
    },
  ),
);
