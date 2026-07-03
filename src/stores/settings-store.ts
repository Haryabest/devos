import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { createScopedPersistStorage } from '@/lib/scoped-storage';
import { useSaveStore } from '@/stores/save-store';

export type ThemePreference = 'light' | 'dark' | 'system';

export type WebhookProvider = 'slack' | 'telegram' | 'custom';

export type WebhookEvent =
  | 'project.created'
  | 'project.deadline'
  | 'task.created'
  | 'task.mention'
  | 'invite.sent';

export interface WebhookConfig {
  id: string;
  name: string;
  url: string;
  provider: WebhookProvider;
  secret?: string;
  enabled: boolean;
  events: WebhookEvent[];
}

interface SettingsState {
  workspaceName: string;
  theme: ThemePreference;
  webhooks: WebhookConfig[];
  /** AI использует docs + tasks для контекста (RAG). */
  aiUseDocs: boolean;
  aiUseTasks: boolean;
  aiUseGit: boolean;
  aiUseFigma: boolean;
  /** Локальный ключ до подключения backend. */
  openAiApiKey: string;
  autosaveDelayMs: number;
  addWebhook: (hook: Omit<WebhookConfig, 'id'>) => void;
  updateWebhook: (id: string, patch: Partial<WebhookConfig>) => void;
  removeWebhook: (id: string) => void;
  update: (patch: Partial<Omit<SettingsState, 'update' | 'exportData' | 'clearAllLocalData' | 'addWebhook' | 'updateWebhook' | 'removeWebhook'>>) => void;
  exportData: () => string;
  clearAllLocalData: () => void;
}

export function getAutosaveDelayMs(): number {
  return useSettingsStore.getState().autosaveDelayMs;
}

function hookId() {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      workspaceName: 'Мой воркспейс',
      theme: 'system',
      webhooks: [],
      aiUseDocs: true,
      aiUseTasks: true,
      aiUseGit: true,
      aiUseFigma: true,
      openAiApiKey: '',
      autosaveDelayMs: 3000,

      addWebhook: (hook) =>
        set((s) => ({ webhooks: [{ ...hook, id: hookId() }, ...s.webhooks] })),
      updateWebhook: (id, patch) =>
        set((s) => ({ webhooks: s.webhooks.map((h) => (h.id === id ? { ...h, ...patch } : h)) })),
      removeWebhook: (id) => set((s) => ({ webhooks: s.webhooks.filter((h) => h.id !== id) })),

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
      version: 2,
      migrate: (state) => {
        const s = state as Partial<SettingsState> | undefined;
        return { ...s, webhooks: s?.webhooks ?? [] } as SettingsState;
      },
    },
  ),
);
