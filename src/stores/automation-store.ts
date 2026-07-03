import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { createScopedPersistStorage } from '@/lib/scoped-storage';
import type { AutomationTrigger, IfThenConfig, SlaConfig } from '@/shared/types/automation';

export interface AutomationRule {
  id: string;
  name: string;
  trigger: AutomationTrigger;
  enabled: boolean;
  config: Record<string, unknown> & Partial<IfThenConfig> & Partial<SlaConfig>;
}

interface AutomationState {
  rules: AutomationRule[];
  addRule: (rule: Omit<AutomationRule, 'id'>) => void;
  updateRule: (id: string, patch: Partial<AutomationRule>) => void;
  removeRule: (id: string) => void;
  toggleRule: (id: string) => void;
}

function uid() {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
}

const DEFAULT_RULES: AutomationRule[] = [
  {
    id: 'default-deadline',
    name: 'Дедлайн проекта скоро',
    trigger: 'deadline_soon',
    enabled: true,
    config: { daysBefore: 3 },
  },
  {
    id: 'default-critical',
    name: 'Срочные задачи',
    trigger: 'critical_tasks',
    enabled: true,
    config: {},
  },
  {
    id: 'default-if-done',
    name: 'Статус DONE → webhook',
    trigger: 'if_then',
    enabled: false,
    config: {
      when: { field: 'status', value: 'DONE' },
      then: { action: 'webhook', event: 'task.created', message: 'Задача завершена' },
    },
  },
  {
    id: 'default-sla',
    name: 'SLA: HIGH без апдейта 48ч',
    trigger: 'sla_escalation',
    enabled: false,
    config: { hoursWithoutUpdate: 48, priority: 'HIGH' },
  },
];

export const useAutomationStore = create<AutomationState>()(
  persist(
    (set, get) => ({
      rules: DEFAULT_RULES,
      addRule: (rule) => set((s) => ({ rules: [{ ...rule, id: uid() }, ...s.rules] })),
      updateRule: (id, patch) =>
        set((s) => ({ rules: s.rules.map((r) => (r.id === id ? { ...r, ...patch } : r)) })),
      removeRule: (id) => set((s) => ({ rules: s.rules.filter((r) => r.id !== id) })),
      toggleRule: (id) => {
        const r = get().rules.find((x) => x.id === id);
        if (r) get().updateRule(id, { enabled: !r.enabled });
      },
    }),
    {
      name: 'devos:automation',
      skipHydration: true,
      storage: createJSONStorage(() => createScopedPersistStorage('devos:automation')),
      version: 2,
      migrate: (state) => {
        const s = state as { rules?: AutomationRule[] } | undefined;
        if (!s?.rules?.length) return { rules: DEFAULT_RULES } as AutomationState;
        return s as AutomationState;
      },
    },
  ),
);

export type { AutomationTrigger } from '@/shared/types/automation';
