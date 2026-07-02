import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AttachmentIcon } from '@/components/ui/attachments';
import { ImageLightbox } from '@/components/ui/image-lightbox';
import * as Icons from '@/components/ui/icons';
import type { Attachment } from '@/shared/types';

function downloadAttachment(a: Attachment) {
  const link = document.createElement('a');
  link.href = a.value;
  link.download = a.label || 'file';
  if (a.kind === 'link') {
    window.open(a.value, '_blank', 'noreferrer');
    return;
  }
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function ClientFilesList({
  files,
  onRemove,
  emptyText,
}: {
  files: Attachment[];
  onRemove: (id: string) => void;
  emptyText?: string;
}) {
  const [preview, setPreview] = useState<Attachment | null>(null);

  if (files.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">
        {emptyText ?? 'Нет файлов. Добавьте ссылку или загрузите документ.'}
      </p>
    );
  }

  return (
    <>
      <div className="space-y-2">
        {files.map((a) => (
          <div
            key={a.id}
            className="group flex items-center gap-3 rounded-md border border-border/60 bg-card px-3 py-2"
          >
            {a.kind === 'image' ? (
              <button type="button" onClick={() => setPreview(a)} className="shrink-0">
                <img src={a.value} alt={a.label} className="h-10 w-10 rounded object-cover" />
              </button>
            ) : (
              <AttachmentIcon kind={a.kind} />
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{a.label}</p>
              <p className="text-xs text-muted-foreground capitalize">{a.kind}</p>
            </div>
            <div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
              {(a.kind === 'image' || a.kind === 'file' || a.kind === 'note') && (
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setPreview(a)}>
                  <Icons.ExternalLink className="h-3.5 w-3.5" />
                </Button>
              )}
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => downloadAttachment(a)}>
                <Icons.Paperclip className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onRemove(a.id)}>
                <Icons.Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {preview?.kind === 'image' && (
        <ImageLightbox
          open
          onOpenChange={() => setPreview(null)}
          src={preview.value}
          alt={preview.label}
        />
      )}

      {preview && preview.kind !== 'image' && (
        <Dialog open onOpenChange={() => setPreview(null)}>
          <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{preview.label}</DialogTitle>
            </DialogHeader>
            {preview.kind === 'link' ? (
              <a href={preview.value} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                {preview.value}
              </a>
            ) : preview.kind === 'note' ? (
              <p className="whitespace-pre-wrap text-sm">{preview.value}</p>
            ) : preview.value.startsWith('data:image') ? (
              <img src={preview.value} alt={preview.label} className="max-h-[60vh] w-full rounded object-contain" />
            ) : preview.value.startsWith('data:application/pdf') ? (
              <iframe src={preview.value} title={preview.label} className="h-[60vh] w-full rounded border" />
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">Предпросмотр недоступен для этого типа файла.</p>
                <Button onClick={() => downloadAttachment(preview)} className="gap-2">
                  <Icons.Paperclip className="h-4 w-4" />
                  Скачать
                </Button>
              </div>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => downloadAttachment(preview)}>
                Скачать / открыть
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
