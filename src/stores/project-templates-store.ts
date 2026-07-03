import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { createScopedPersistStorage } from '@/lib/scoped-storage';
import type { ProjectType } from '@/shared/types';
import { useProjectsStore } from '@/stores/projects-store';
import { useTasksStore } from '@/stores/tasks-store';
import { useDocsStore } from '@/stores/docs-store';
import { seedColumns } from '@/stores/tasks/constants';

export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  type: ProjectType;
  taskTitles: string[];
  docTitles: string[];
}

export const BUILTIN_TEMPLATES: ProjectTemplate[] = [
  {
    id: 'saas-mvp',
    name: 'SaaS MVP',
    description: 'Базовый продукт: auth, dashboard, billing',
    type: 'SAAS',
    taskTitles: ['Auth & onboarding', 'Dashboard', 'Billing stub', 'Deploy pipeline'],
    docTitles: ['Product brief', 'API overview'],
  },
  {
    id: 'web-landing',
    name: 'Web Landing',
    description: 'Лендинг + аналитика',
    type: 'WEB',
    taskTitles: ['Hero section', 'SEO meta', 'Analytics', 'Contact form'],
    docTitles: ['Copy deck'],
  },
  {
    id: 'mobile-app',
    name: 'Mobile App',
    description: 'iOS/Android скелет',
    type: 'MOBILE',
    taskTitles: ['Navigation', 'Push notifications', 'App Store assets'],
    docTitles: ['User stories'],
  },
];

interface ProjectTemplatesState {
  custom: ProjectTemplate[];
  addCustom: (t: Omit<ProjectTemplate, 'id'>) => ProjectTemplate;
  removeCustom: (id: string) => void;
  instantiate: (templateId: string, projectName: string) => string | null;
}

function uid() {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
}

export const useProjectTemplatesStore = create<ProjectTemplatesState>()(
  persist(
    (set, get) => ({
      custom: [],
      addCustom: (t) => {
        const next = { ...t, id: uid() };
        set((s) => ({ custom: [next, ...s.custom] }));
        return next;
      },
      removeCustom: (id) => set((s) => ({ custom: s.custom.filter((c) => c.id !== id) })),
      instantiate: (templateId, projectName) => {
        const tpl =
          BUILTIN_TEMPLATES.find((t) => t.id === templateId) ??
          get().custom.find((t) => t.id === templateId);
        if (!tpl) return null;

        const project = useProjectsStore.getState().add({
          name: projectName.trim() || tpl.name,
          description: tpl.description,
          type: tpl.type,
        });
        const cols = seedColumns(project.id);
        useTasksStore.setState((s) => ({ columns: [...s.columns, ...cols] }));

        const tasksStore = useTasksStore.getState();
        const columns = tasksStore.columns.filter((c) => c.projectId === project.id);
        const col = columns[0];
        if (col) {
          tpl.taskTitles.forEach((title) => {
            tasksStore.add({
              projectId: project.id,
              columnId: col.id,
              title,
            });
          });
        }

        tpl.docTitles.forEach((title) => {
          useDocsStore.getState().create(project.id, title, null);
        });

        return project.id;
      },
    }),
    {
      name: 'devos:project-templates',
      skipHydration: true,
      storage: createJSONStorage(() => createScopedPersistStorage('devos:project-templates')),
      version: 1,
    },
  ),
);
