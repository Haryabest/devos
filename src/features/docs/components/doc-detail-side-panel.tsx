import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AttachmentSidebar } from '@/components/ui/attachment-sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import * as Icons from '@/components/ui/icons';
import { formatDateTime } from '@/lib/format-date';
import { DOC_FORMAT_LABELS, downloadDocFile } from '@/lib/doc-formats';
import type { AttachmentKind, Doc } from '@/shared/types';

interface DocDetailSidePanelProps {
  doc: Doc;
  onDelete: () => void;
  onAddTag: (tag: string) => void;
  onRemoveTag: (tag: string) => void;
  onRestoreVersion: (revisionId: string) => void;
  onAddAttachment: (a: { kind: AttachmentKind; label: string; value: string }) => void;
  onRemoveAttachment: (id: string) => void;
}

export function DocDetailSidePanel({
  doc,
  onDelete,
  onAddTag,
  onRemoveTag,
  onRestoreVersion,
  onAddAttachment,
  onRemoveAttachment,
}: DocDetailSidePanelProps) {
  const [tagDraft, setTagDraft] = useState('');
  const plainText = doc.content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  const wordCount = plainText ? plainText.split(' ').filter(Boolean).length : 0;

  function submitTag(e: React.FormEvent) {
    e.preventDefault();
    const t = tagDraft.trim();
    if (!t) return;
    onAddTag(t);
    setTagDraft('');
  }

  return (
    <aside className="flex w-[420px] shrink-0 flex-col border-l border-border/60 bg-card/20">
      <Tabs defaultValue="page" className="flex min-h-0 flex-1 flex-col">
        <div className="border-b border-border/60 px-3 py-2">
          <TabsList className="grid h-8 w-full grid-cols-4">
            <TabsTrigger value="page" className="px-1 text-[10px]">
              Инфо
            </TabsTrigger>
            <TabsTrigger value="tags" className="px-1 text-[10px]">
              Теги
            </TabsTrigger>
            <TabsTrigger value="history" className="px-1 text-[10px]">
              История
            </TabsTrigger>
            <TabsTrigger value="files" className="px-1 text-[10px]">
              Файлы
            </TabsTrigger>
          </TabsList>
        </div>

        <ScrollArea className="min-h-0 flex-1">
          <TabsContent value="page" className="mt-0 space-y-4 p-3">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <Icons.FileText className="h-3.5 w-3.5" />
              О документе
            </div>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-xs text-muted-foreground">Формат</dt>
                <dd>{DOC_FORMAT_LABELS[doc.format]}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Версия</dt>
                <dd>v{doc.version}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Создан</dt>
                <dd>{formatDateTime(doc.createdAt)}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Обновлён</dt>
                <dd>{formatDateTime(doc.updatedAt)}</dd>
              </div>
              {doc.format === 'page' && (
                <div>
                  <dt className="text-xs text-muted-foreground">Слов</dt>
                  <dd>{wordCount}</dd>
                </div>
              )}
              {doc.fileName && (
                <div>
                  <dt className="text-xs text-muted-foreground">Файл</dt>
                  <dd className="truncate font-mono text-xs">{doc.fileName}</dd>
                </div>
              )}
            </dl>
            {doc.fileData && doc.fileName && (
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => downloadDocFile(doc.fileData!, doc.fileName!)}
              >
                <Icons.ExternalLink className="h-3.5 w-3.5" />
                Скачать оригинал
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              className="gap-2 text-destructive hover:text-destructive"
              onClick={onDelete}
            >
              <Icons.Trash2 className="h-3.5 w-3.5" />
              Удалить
            </Button>
          </TabsContent>

          <TabsContent value="tags" className="mt-0 space-y-3 p-3">
            <form onSubmit={submitTag} className="flex gap-2">
              <Input
                value={tagDraft}
                onChange={(e) => setTagDraft(e.target.value)}
                placeholder="Новый тег"
                className="h-8 text-sm"
              />
              <Button type="submit" size="sm" variant="outline">
                <Icons.Plus className="h-4 w-4" />
              </Button>
            </form>
            {doc.tags.length === 0 ? (
              <p className="text-xs text-muted-foreground">Тегов пока нет.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {doc.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1 pr-1">
                    <Icons.Tag className="h-3 w-3" />
                    {tag}
                    <button
                      type="button"
                      aria-label={`Удалить тег ${tag}`}
                      onClick={() => onRemoveTag(tag)}
                      className="ml-0.5 rounded hover:bg-muted"
                    >
                      <Icons.X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="history" className="mt-0 space-y-2 p-3">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <Icons.History className="h-3.5 w-3.5" />
              История изменений
            </div>
            {doc.history.length === 0 ? (
              <p className="text-xs text-muted-foreground">Изменений пока нет.</p>
            ) : (
              <div className="space-y-2">
                {doc.history.map((rev) => (
                  <div
                    key={rev.id}
                    className="rounded-md border border-border/60 bg-card/40 p-2 text-xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">v{rev.version}</span>
                      <span className="text-muted-foreground">{formatDateTime(rev.createdAt)}</span>
                    </div>
                    <p className="mt-1 truncate text-muted-foreground">{rev.title || 'Без названия'}</p>
                    {rev.summary && <p className="mt-0.5 text-[10px] text-muted-foreground">{rev.summary}</p>}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-2 h-7 px-2 text-[11px]"
                      onClick={() => onRestoreVersion(rev.id)}
                    >
                      Восстановить
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="files" className="mt-0 h-full">
            <AttachmentSidebar
              className="h-full border-l-0"
              attachments={doc.attachments}
              onAdd={onAddAttachment}
              onRemove={onRemoveAttachment}
            />
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </aside>
  );
}
