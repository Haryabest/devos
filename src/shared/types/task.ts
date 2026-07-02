import type { Attachment } from './attachment';
import type { Priority } from './project';

export interface TaskColumn {
  id: string;
  projectId: string;
  name: string;
  color: string;
  order: number;
}

export interface Task {
  id: string;
  projectId: string;
  columnId: string;
  parentId: string | null;
  title: string;
  description: string;
  priority: Priority;
  order: number;
  attachments: Attachment[];
  done: boolean;
  createdAt: string;
}
