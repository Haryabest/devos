import type { Attachment } from './attachment';

export interface Doc {
  id: string;
  projectId: string;
  title: string;
  content: string;
  attachments: Attachment[];
  updatedAt: string;
}
