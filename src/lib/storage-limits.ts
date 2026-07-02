/** Макс. размер вложения в localStorage (base64). */
export const MAX_ATTACHMENT_DATA_URL_CHARS = 120_000;

/** Макс. размер файла документации (байты до кодирования). */
export const MAX_DOC_FILE_BYTES = 1_500_000;

export function isDocFileTooLarge(size: number): boolean {
  return size > MAX_DOC_FILE_BYTES;
}

export function formatDocFileLimitMessage(): string {
  return `Файл слишком большой (лимит ~${Math.round(MAX_DOC_FILE_BYTES / 1024 / 1024)} МБ для локального хранилища).`;
}

export function isDataUrlTooLarge(dataUrl: string): boolean {
  return dataUrl.length > MAX_ATTACHMENT_DATA_URL_CHARS;
}

export function formatStorageLimitMessage(): string {
  return `Файл слишком большой для локального хранилища (лимит ~${Math.round(MAX_ATTACHMENT_DATA_URL_CHARS / 1024)} КБ). Используйте ссылку вместо загрузки.`;
}

export function isQuotaExceededError(error: unknown): boolean {
  return (
    error instanceof DOMException &&
    (error.name === 'QuotaExceededError' || error.code === 22)
  );
}
