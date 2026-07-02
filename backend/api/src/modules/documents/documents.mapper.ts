export interface ClientExtraJson {
  contactList?: unknown[];
  contracts?: unknown[];
  files?: unknown[];
  notes?: string;
}

export interface DocPayloadJson {
  format?: string;
  content?: string;
  fileData?: string | null;
  fileName?: string | null;
  mimeType?: string | null;
  attachments?: unknown[];
  history?: unknown[];
}

export function parseClientExtra(raw: unknown): ClientExtraJson {
  if (!raw || typeof raw !== 'object') return {};
  return raw as ClientExtraJson;
}

export function serializeClientExtra(data: ClientExtraJson): ClientExtraJson {
  return {
    contactList: data.contactList ?? [],
    contracts: data.contracts ?? [],
    files: data.files ?? [],
    notes: data.notes ?? '',
  };
}

export function parseDocPayload(contentMd: string): DocPayloadJson {
  if (!contentMd) return { format: 'page', content: '', attachments: [], history: [] };
  try {
    const parsed = JSON.parse(contentMd) as DocPayloadJson;
    if (parsed && typeof parsed === 'object' && 'format' in parsed) return parsed;
  } catch {
    /* legacy markdown/html */
  }
  return { format: 'page', content: contentMd, attachments: [], history: [] };
}

export function serializeDocPayload(payload: DocPayloadJson): string {
  return JSON.stringify({
    format: payload.format ?? 'page',
    content: payload.content ?? '',
    fileData: payload.fileData ?? null,
    fileName: payload.fileName ?? null,
    mimeType: payload.mimeType ?? null,
    attachments: payload.attachments ?? [],
    history: payload.history ?? [],
  });
}
