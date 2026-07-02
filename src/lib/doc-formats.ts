import type { DocFormat } from '@/shared/types';

export const SUPPORTED_DOC_FORMATS: DocFormat[] = [
  'page',
  'pdf',
  'docx',
  'txt',
  'md',
  'csv',
  'xlsx',
  'image',
];

export const DOC_FORMAT_LABELS: Record<DocFormat, string> = {
  page: 'Страница',
  pdf: 'PDF',
  docx: 'DOCX',
  txt: 'TXT',
  md: 'Markdown',
  csv: 'CSV',
  xlsx: 'XLSX',
  image: 'Изображение',
};

export const DOC_FORMAT_ACCEPT =
  '.pdf,.docx,.txt,.md,.csv,.xlsx,.png,.jpg,.jpeg,.webp,.gif,image/*';

const EXT_MAP: Record<string, DocFormat> = {
  pdf: 'pdf',
  docx: 'docx',
  txt: 'txt',
  md: 'md',
  markdown: 'md',
  csv: 'csv',
  xlsx: 'xlsx',
  xls: 'xlsx',
  png: 'image',
  jpg: 'image',
  jpeg: 'image',
  webp: 'image',
  gif: 'image',
};

const MIME_MAP: Record<string, DocFormat> = {
  'application/pdf': 'pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'text/plain': 'txt',
  'text/markdown': 'md',
  'text/csv': 'csv',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
  'application/vnd.ms-excel': 'xlsx',
  'image/png': 'image',
  'image/jpeg': 'image',
  'image/webp': 'image',
  'image/gif': 'image',
};

export function detectDocFormat(file: File): DocFormat | null {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  if (ext && EXT_MAP[ext]) return EXT_MAP[ext];
  if (file.type && MIME_MAP[file.type]) return MIME_MAP[file.type];
  if (file.type.startsWith('image/')) return 'image';
  return null;
}

export function isEditableFormat(format: DocFormat): boolean {
  return format === 'page' || format === 'txt' || format === 'md' || format === 'csv' || format === 'xlsx';
}

export function isPreviewOnlyFormat(format: DocFormat): boolean {
  return format === 'pdf' || format === 'image';
}

export function docTitleFromFileName(name: string): string {
  const base = name.replace(/\.[^.]+$/, '').trim();
  return base || name;
}

export function downloadDocFile(
  fileData: string,
  fileName: string,
): void {
  const a = document.createElement('a');
  a.href = fileData;
  a.download = fileName;
  a.click();
}

export function dataUrlToText(dataUrl: string): string {
  if (!dataUrl.startsWith('data:')) return dataUrl;
  const comma = dataUrl.indexOf(',');
  const payload = dataUrl.slice(comma + 1);
  const meta = dataUrl.slice(0, comma);
  if (meta.includes(';base64')) {
    return atob(payload);
  }
  return decodeURIComponent(payload);
}

export function dataUrlToArrayBuffer(dataUrl: string): ArrayBuffer {
  const binary = dataUrlToText(dataUrl);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}
