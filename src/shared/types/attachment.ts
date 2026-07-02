export type AttachmentKind = 'link' | 'file' | 'note' | 'image';

export interface Attachment {
  id: string;
  kind: AttachmentKind;
  label: string;
  value: string;
  createdAt: string;
}
