import type { WhiteboardData } from '@/shared/types/whiteboard';
import { createUid } from '@/stores/tasks/constants';

export type WhiteboardTemplateId = 'c4-context' | 'user-flow';

export interface WhiteboardTemplate {
  id: WhiteboardTemplateId;
  name: string;
  description: string;
}

export const WHITEBOARD_TEMPLATES: WhiteboardTemplate[] = [
  { id: 'c4-context', name: 'C4 Context', description: 'Система, пользователи и внешние сервисы' },
  { id: 'user-flow', name: 'User Flow', description: 'Шаги сценария пользователя' },
];

export function buildTemplate(projectId: string, templateId: WhiteboardTemplateId): Partial<WhiteboardData> {
  if (templateId === 'c4-context') {
    return {
      projectId,
      notes: [
        { id: createUid(), x: 200, y: 200, width: 220, height: 140, color: '#bfdbfe', text: 'Пользователь' },
        { id: createUid(), x: 520, y: 180, width: 260, height: 180, color: '#bbf7d0', text: 'Наша система\n(DevOS)' },
        { id: createUid(), x: 880, y: 220, width: 220, height: 140, color: '#fef08a', text: 'Внешний API' },
      ],
      shapes: [
        { id: createUid(), kind: 'arrow', x: 420, y: 260, width: 100, height: 0, color: '#64748b' },
        { id: createUid(), kind: 'arrow', x: 780, y: 260, width: 100, height: 0, color: '#64748b' },
      ],
      connectors: [],
    };
  }
  return {
    projectId,
    notes: [
      { id: createUid(), x: 120, y: 300, width: 180, height: 120, color: '#fef08a', text: '1. Вход' },
      { id: createUid(), x: 360, y: 300, width: 180, height: 120, color: '#bbf7d0', text: '2. Действие' },
      { id: createUid(), x: 600, y: 300, width: 180, height: 120, color: '#bfdbfe', text: '3. Результат' },
      { id: createUid(), x: 840, y: 300, width: 180, height: 120, color: '#fbcfe8', text: '4. Выход' },
    ],
    shapes: [
      { id: createUid(), kind: 'arrow', x: 300, y: 360, width: 60, height: 0, color: '#6366f1' },
      { id: createUid(), kind: 'arrow', x: 540, y: 360, width: 60, height: 0, color: '#6366f1' },
      { id: createUid(), kind: 'arrow', x: 780, y: 360, width: 60, height: 0, color: '#6366f1' },
    ],
    connectors: [],
  };
}
