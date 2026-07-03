import type { Attachment } from './attachment';
import type { Priority } from './project';

export type TaskStatus =
  | 'BACKLOG'
  | 'TODO'
  | 'IN_PROGRESS'
  | 'REVIEW'
  | 'TESTING'
  | 'DONE';

export interface TaskColumn {
  id: string;
  projectId: string;
  name: string;
  color: string;
  order: number;
  statusKey: TaskStatus;
}

export interface CommentReaction {
  emoji: string;
  userId: string;
  userName: string;
}

export interface TaskComment {
  id: string;
  author: string;
  authorId?: string | null;
  text: string;
  createdAt: string;
  threadId?: string | null;
  parentCommentId?: string | null;
  reactions: CommentReaction[];
  assigneeIds: string[];
}

export interface TaskHistoryEntry {
  id: string;
  field: string;
  oldValue: string;
  newValue: string;
  author: string;
  createdAt: string;
}

export interface Task {
  id: string;
  projectId: string;
  columnId: string;
  parentId: string | null;
  title: string;
  description: string;
  priority: Priority;
  status: TaskStatus;
  order: number;
  attachments: Attachment[];
  done: boolean;
  startAt: string | null;
  dueAt: string | null;
  dependsOn: string[];
  comments: TaskComment[];
  history: TaskHistoryEntry[];
  assigneeId: string | null;
  estimateMinutes: number | null;
  spentMinutes: number | null;
  createdAt: string;
}
