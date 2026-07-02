import type { Attachment } from './attachment';

/** Формат документа / файла в разделе документации. */
export type DocFormat =
  | 'page'
  | 'pdf'
  | 'docx'
  | 'txt'
  | 'md'
  | 'csv'
  | 'xlsx'
  | 'image';

export interface DocRevision {
  id: string;
  version: number;
  title: string;
  content: string;
  createdAt: string;
  summary?: string;
}

export interface DocFolder {
  id: string;
  projectId: string;
  parentId: string | null;
  name: string;
  createdAt: string;
}

export interface Doc {
  id: string;
  projectId: string;
  folderId: string | null;
  title: string;
  format: DocFormat;
  content: string;
  /** Data URL оригинального файла (PDF, DOCX, XLSX, изображения). */
  fileData?: string | null;
  fileName?: string | null;
  mimeType?: string | null;
  tags: string[];
  version: number;
  history: DocRevision[];
  attachments: Attachment[];
  createdAt: string;
  updatedAt: string;
}
