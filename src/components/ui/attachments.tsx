import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import * as Icons from '@/components/ui/icons';
import { cn } from '@/lib/utils';
import { formatStorageLimitMessage, isDataUrlTooLarge } from '@/lib/storage-limits';
import type { Attachment, AttachmentKind } from '@/shared/types';

export function AttachmentIcon({ kind }: { kind: AttachmentKind }) {
  if (kind === 'link') return <Icons.Link2 className="h-4 w-4 shrink-0 text-muted-foreground" />;
  if (kind === 'file') return <Icons.FileText className="h-4 w-4 shrink-0 text-muted-foreground" />;
  if (kind === 'image') return <Icons.ImageIcon className="h-4 w-4 shrink-0 text-muted-foreground" />;
  return <Icons.Paperclip className="h-4 w-4 shrink-0 text-muted-foreground" />;
}

interface AttachmentListProps {
  attachments: Attachment[];
  onRemove: (id: string) => void;
  emptyText?: string;
}

export function AttachmentList({ attachments, onRemove, emptyText }: AttachmentListProps) {
  if (attachments.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">
        {emptyText ?? 'Нет вложений. Добавляйте ссылки, файлы, изображения или заметки.'}
      </p>
    );
  }
  return (
    <div className="space-y-1.5">
      {attachments.map((a) => (
        <div
          key={a.id}
          className="group flex items-center gap-2 rounded-md border border-border/60 bg-card px-3 py-2 text-sm"
        >
          <AttachmentIcon kind={a.kind} />
          <div className="min-w-0 flex-1">
            {a.kind === 'link' ? (
              <a
                href={a.value}
                target="_blank"
                rel="noreferrer"
                className="block truncate text-primary hover:underline"
              >
                {a.label}
              </a>
            ) : a.kind === 'image' ? (
              <a
                href={a.value}
                target="_blank"
                rel="noreferrer"
                className="block truncate text-primary hover:underline"
              >
                {a.label}
              </a>
            ) : (
              <div className="truncate">{a.label}</div>
            )}
            {a.kind !== 'link' && a.kind !== 'image' && a.value && !a.value.startsWith('data:') && (
              <div className="truncate text-xs text-muted-foreground">{a.value}</div>
            )}
          </div>
          <button
            aria-label="Удалить вложение"
            onClick={() => onRemove(a.id)}
            className="opacity-0 transition-opacity group-hover:opacity-100"
          >
            <Icons.Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
          </button>
        </div>
      ))}
    </div>
  );
}

interface AddAttachmentProps {
  onAdd: (a: { kind: AttachmentKind; label: string; value: string }) => void;
  /** Компактный вид для боковой панели. */
  compact?: boolean;
}

export function AddAttachment({ onAdd, compact }: AddAttachmentProps) {
  const [kind, setKind] = useState<AttachmentKind>('link');
  const [label, setLabel] = useState('');
  const [value, setValue] = useState('');
  const fileInput = useRef<HTMLInputElement>(null);

  function reset() {
    setLabel('');
    setValue('');
  }

  function submit(e?: React.FormEvent) {
    e?.preventDefault();
    if (!value.trim()) return;
    onAdd({
      kind,
      label: label.trim() || (kind === 'link' ? value.trim() : kind === 'note' ? 'Заметка' : ''),
      value: value.trim(),
    });
    reset();
  }

  function handleFile(file: File) {
    if (file.size > 90_000) {
      window.alert(formatStorageLimitMessage());
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result ?? '');
      if (isDataUrlTooLarge(dataUrl)) {
        window.alert(formatStorageLimitMessage());
        return;
      }
      const isImage = file.type.startsWith('image/');
      onAdd({
        kind: isImage ? 'image' : 'file',
        label: file.name,
        value: dataUrl,
      });
      reset();
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className={cn('space-y-2', !compact && 'rounded-md border border-border/60 p-3')}>
      <div className={cn('flex flex-wrap gap-2', compact && 'flex-col')}>
        <Select value={kind} onValueChange={(v) => setKind(v as AttachmentKind)}>
          <SelectTrigger className="h-8 w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="link">Ссылка</SelectItem>
            <SelectItem value="file">Файл</SelectItem>
            <SelectItem value="note">Заметка</SelectItem>
          </SelectContent>
        </Select>
        {kind !== 'note' && (
          <Input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder={kind === 'link' ? 'Название' : 'Имя'}
            className="h-8"
          />
        )}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 w-full gap-1.5"
          onClick={() => fileInput.current?.click()}
        >
          <Icons.Plus className="h-3.5 w-3.5" />
          Загрузить файл
        </Button>
        <input
          ref={fileInput}
          type="file"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
            e.target.value = '';
          }}
        />
      </div>
      {kind === 'link' ? (
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="https://…"
          className="h-8"
        />
      ) : kind === 'file' ? (
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Имя или путь файла"
          className="h-8"
        />
      ) : (
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Текст заметки…"
          className="min-h-16 w-full resize-none rounded-md border border-input bg-transparent p-2 text-xs outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
      )}
      <Button type="button" size="sm" className="w-full" onClick={() => submit()} disabled={!value.trim()}>
        Прикрепить
      </Button>
    </div>
  );
}
