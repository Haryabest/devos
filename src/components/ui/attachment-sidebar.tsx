import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ConfirmDeleteDialog } from '@/components/ui/confirm-delete-dialog';
import { ImageLightbox } from '@/components/ui/image-lightbox';
import * as Icons from '@/components/ui/icons';
import { cn } from '@/lib/utils';
import { AddAttachment, AttachmentIcon } from '@/components/ui/attachments';
import type { Attachment, AttachmentKind } from '@/shared/types';

interface AttachmentSidebarProps {
  attachments: Attachment[];
  onAdd: (a: { kind: AttachmentKind; label: string; value: string }) => void;
  onRemove: (id: string) => void;
  className?: string;
}

function isImageAttachment(a: Attachment): boolean {
  return a.kind === 'image' || (a.kind === 'file' && a.value.startsWith('data:image/'));
}

function imageSrc(a: Attachment): string {
  return a.value;
}

/** Боковая панель вложений с превью и просмотром файлов/картинок. */
export function AttachmentSidebar({
  attachments,
  onAdd,
  onRemove,
  className,
}: AttachmentSidebarProps) {
  const [selectedId, setSelectedId] = useState<string | null>(attachments[0]?.id ?? null);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (attachments.length === 0) {
      setSelectedId(null);
      return;
    }
    if (!selectedId || !attachments.some((a) => a.id === selectedId)) {
      setSelectedId(attachments[attachments.length - 1]!.id);
    }
  }, [attachments, selectedId]);

  const selected = attachments.find((a) => a.id === selectedId) ?? attachments[0] ?? null;
  const deleteTarget = attachments.find((a) => a.id === deleteId);

  return (
    <>
      <aside
        className={cn('flex h-full w-full shrink-0 flex-col border-l border-border/60 bg-card/30', className)}
      >
        <div className="border-b border-border/60 px-3 py-2.5">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <Icons.Paperclip className="h-3.5 w-3.5" />
            Вложения
            {attachments.length > 0 && (
              <span className="ml-auto tabular-nums">{attachments.length}</span>
            )}
          </div>
        </div>

        <div className="border-b border-border/60 p-3">
          {selected ? (
            <AttachmentPreview
              attachment={selected}
              onRemove={() => setDeleteId(selected.id)}
              onOpenImage={() => setLightboxSrc(imageSrc(selected))}
            />
          ) : (
            <p className="py-6 text-center text-xs text-muted-foreground">Нет вложений</p>
          )}
        </div>

        <div className="flex-1 overflow-auto px-2 py-2">
          {attachments.length === 0 ? (
            <p className="px-2 py-4 text-xs text-muted-foreground">
              Прикрепите ссылки, файлы или фото.
            </p>
          ) : (
            <div className="space-y-1">
              {attachments.map((a) => (
                <button
                  key={a.id}
                  onClick={() => {
                    setSelectedId(a.id);
                    if (isImageAttachment(a)) setLightboxSrc(imageSrc(a));
                  }}
                  className={cn(
                    'group flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors hover:bg-accent',
                    selected?.id === a.id && 'bg-accent',
                  )}
                >
                  {isImageAttachment(a) ? (
                    <img src={a.value} alt="" className="h-8 w-8 shrink-0 rounded object-cover" />
                  ) : (
                    <AttachmentIcon kind={a.kind} />
                  )}
                  <span className="flex-1 truncate">{a.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-border/60 p-2">
          <AddAttachment onAdd={onAdd} compact />
        </div>
      </aside>

      <ImageLightbox
        open={lightboxSrc !== null}
        onOpenChange={(o) => !o && setLightboxSrc(null)}
        src={lightboxSrc ?? ''}
        alt={selected?.label}
      />

      <ConfirmDeleteDialog
        open={deleteId !== null}
        onOpenChange={(o) => !o && setDeleteId(null)}
        title="Удалить вложение?"
        description={`«${deleteTarget?.label ?? 'Вложение'}» будет удалено без возможности восстановления.`}
        onConfirm={() => deleteId && onRemove(deleteId)}
      />
    </>
  );
}

function AttachmentPreview({
  attachment: a,
  onRemove,
  onOpenImage,
}: {
  attachment: Attachment;
  onRemove: () => void;
  onOpenImage: () => void;
}) {
  const isImage = isImageAttachment(a);

  return (
    <div className="space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{a.label}</p>
          <p className="text-[10px] text-muted-foreground">
            {kindLabel(a.kind)} · {new Date(a.createdAt).toLocaleString('ru-RU')}
          </p>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={onRemove}>
          <Icons.Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
        </Button>
      </div>

      {isImage && (
        <button type="button" onClick={onOpenImage} className="block w-full cursor-zoom-in">
          <img
            src={a.value}
            alt={a.label}
            className="max-h-48 w-full rounded-md border border-border/60 object-contain transition-opacity hover:opacity-90"
          />
        </button>
      )}

      {a.kind === 'link' && (
        <div className="space-y-2">
          <a
            href={a.value}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 text-xs text-primary hover:underline"
          >
            <Icons.ExternalLink className="h-3 w-3" />
            Открыть ссылку
          </a>
          <p className="break-all rounded-md bg-muted/40 p-2 font-mono text-[10px] text-muted-foreground">
            {a.value}
          </p>
        </div>
      )}

      {a.kind === 'note' && (
        <pre className="max-h-40 overflow-auto whitespace-pre-wrap rounded-md bg-muted/40 p-2 text-xs">
          {a.value}
        </pre>
      )}

      {a.kind === 'file' && !isImage && <FilePreview attachment={a} />}
    </div>
  );
}

function FilePreview({ attachment: a }: { attachment: Attachment }) {
  const isDataUrl = a.value.startsWith('data:');
  const isText =
    isDataUrl &&
    (a.value.startsWith('data:text/') ||
      a.label.endsWith('.txt') ||
      a.label.endsWith('.md') ||
      a.label.endsWith('.json'));

  if (isText) {
    try {
      const text = isDataUrl ? atob(a.value.split(',')[1] ?? '') : a.value;
      return (
        <pre className="max-h-40 overflow-auto whitespace-pre-wrap rounded-md bg-muted/40 p-2 font-mono text-[10px]">
          {text.slice(0, 4000)}
          {text.length > 4000 ? '…' : ''}
        </pre>
      );
    } catch {
      /* fallthrough */
    }
  }

  if (isDataUrl) {
    return (
      <a
        href={a.value}
        download={a.label}
        className="flex items-center gap-2 rounded-md border border-border/60 bg-muted/30 px-3 py-2 text-xs hover:bg-accent"
      >
        <Icons.FileText className="h-4 w-4" />
        Скачать {a.label}
      </a>
    );
  }

  return (
    <div className="rounded-md bg-muted/40 p-2 text-xs text-muted-foreground">{a.value}</div>
  );
}

function kindLabel(kind: AttachmentKind): string {
  const map: Record<AttachmentKind, string> = {
    link: 'Ссылка',
    file: 'Файл',
    note: 'Заметка',
    image: 'Изображение',
  };
  return map[kind];
}
