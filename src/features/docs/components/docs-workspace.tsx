import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BreadcrumbBack } from '@/components/layout/breadcrumb-back';
import { RichEditorToolbar, useRichEditor } from '@/components/ui/rich-editor';
import { ConfirmDeleteDialog, type DeleteConfirmState } from '@/components/ui/confirm-delete-dialog';
import { DocDetailSidePanel } from '@/features/docs/components/doc-detail-side-panel';
import { DocFolderTree } from '@/features/docs/components/doc-folder-tree';
import { DocFileViewer } from '@/features/docs/components/doc-file-viewer';
import * as Icons from '@/components/ui/icons';
import { cn } from '@/lib/utils';
import { DOC_FORMAT_ACCEPT } from '@/lib/doc-formats';
import { formatDateTime } from '@/lib/format-date';
import { useDocsStore } from '@/stores/docs-store';

interface DocsWorkspaceProps {
  projectId: string;
  backTo?: string;
  backLabel?: string;
  className?: string;
}

export function DocsWorkspace({ projectId, backTo, backLabel, className }: DocsWorkspaceProps) {
  const docs = useDocsStore((s) => s.docs);
  const folders = useDocsStore((s) => s.folders);
  const create = useDocsStore((s) => s.create);
  const createFromFile = useDocsStore((s) => s.createFromFile);
  const createFolder = useDocsStore((s) => s.createFolder);
  const renameFolder = useDocsStore((s) => s.renameFolder);
  const removeFolder = useDocsStore((s) => s.removeFolder);
  const scheduleSave = useDocsStore((s) => s.scheduleSave);
  const flushSave = useDocsStore((s) => s.flushSave);
  const remove = useDocsStore((s) => s.remove);
  const addAttachment = useDocsStore((s) => s.addAttachment);
  const removeAttachment = useDocsStore((s) => s.removeAttachment);
  const addTag = useDocsStore((s) => s.addTag);
  const removeTag = useDocsStore((s) => s.removeTag);
  const restoreVersion = useDocsStore((s) => s.restoreVersion);

  const uploadInputRef = useRef<HTMLInputElement>(null);
  const [uploadFolderId, setUploadFolderId] = useState<string | null>(null);

  const projectDocs = useMemo(
    () => docs.filter((d) => d.projectId === projectId),
    [docs, projectId],
  );
  const projectFolders = useMemo(
    () => folders.filter((f) => f.projectId === projectId),
    [folders, projectId],
  );

  const [activeId, setActiveId] = useState<string | null>(null);
  const active = projectDocs.find((d) => d.id === activeId) ?? projectDocs[0] ?? null;

  const [draftTitle, setDraftTitle] = useState('');
  const [draftContent, setDraftContent] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<DeleteConfirmState | null>(null);

  useEffect(() => {
    setActiveId(null);
  }, [projectId]);

  useEffect(() => {
    if (!activeId && projectDocs[0]) setActiveId(projectDocs[0].id);
  }, [activeId, projectDocs]);

  useEffect(() => {
    if (!active) return;
    setDraftTitle(active.title);
    setDraftContent(active.content);
  }, [active?.id]);

  useEffect(() => () => flushSave(), [flushSave]);

  function handleSelectDoc(id: string) {
    flushSave();
    setActiveId(id);
  }

  const editor = useRichEditor(
    draftContent,
    (html) => {
      setDraftContent(html);
      if (active?.format === 'page') scheduleSave(active.id, { content: html });
    },
    active?.id,
  );

  function handleCreatePage(folderId: string | null = null) {
    flushSave();
    const doc = create(projectId, 'Без названия', folderId);
    setActiveId(doc.id);
  }

  function handleCreateFolder(parentId: string | null = null) {
    const name = window.prompt('Название папки', 'Новая папка');
    if (!name?.trim()) return;
    createFolder(projectId, name.trim(), parentId);
  }

  function triggerUpload(folderId: string | null) {
    setUploadFolderId(folderId);
    uploadInputRef.current?.click();
  }

  async function handleUploadFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    flushSave();
    const doc = await createFromFile(projectId, file, uploadFolderId);
    if (doc) setActiveId(doc.id);
  }

  function requestRemoveDoc(id: string, title: string) {
    setDeleteConfirm({
      title: 'Удалить документ?',
      description: `«${title || 'Без названия'}» будет удалён без возможности восстановления.`,
      onConfirm: () => {
        remove(id);
        if (activeId === id) setActiveId(null);
      },
    });
  }

  function requestRemoveFolder(id: string) {
    setDeleteConfirm({
      title: 'Удалить папку?',
      description: 'Папка, вложенные папки и документы внутри будут удалены.',
      onConfirm: () => {
        removeFolder(id);
        if (active?.folderId === id) setActiveId(null);
      },
    });
  }

  return (
    <div className={cn('flex h-full min-h-0 flex-col', className)}>
      <div className="border-b border-border/60 px-6 py-4">
        {backTo && backLabel ? (
          <BreadcrumbBack label={backLabel} to={backTo} className="mb-2" />
        ) : null}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            PDF, DOCX, TXT, MD, CSV, XLSX, изображения · папки · теги · версии · история
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" className="gap-2" onClick={() => handleCreateFolder(null)}>
              <Icons.FolderPlus className="h-4 w-4" />
              Папка
            </Button>
            <Button variant="outline" size="sm" className="gap-2" onClick={() => triggerUpload(null)}>
              <Icons.Upload className="h-4 w-4" />
              Загрузить
            </Button>
            <Button size="sm" className="gap-2" onClick={() => handleCreatePage(null)}>
              <Icons.Plus className="h-4 w-4" />
              Страница
            </Button>
            {active?.format === 'page' && (
              <RichEditorToolbar controller={editor} className="max-w-full overflow-x-auto" />
            )}
          </div>
        </div>
        <input
          ref={uploadInputRef}
          type="file"
          accept={DOC_FORMAT_ACCEPT}
          className="hidden"
          onChange={handleUploadFile}
        />
      </div>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <aside className="flex w-72 shrink-0 flex-col border-r border-border/60 bg-card/20">
          <DocFolderTree
            folders={projectFolders}
            docs={projectDocs}
            activeId={active?.id ?? null}
            onSelectDoc={handleSelectDoc}
            onCreatePage={handleCreatePage}
            onCreateFolder={handleCreateFolder}
            onUpload={triggerUpload}
            onRenameFolder={renameFolder}
            onRemoveFolder={requestRemoveFolder}
            onRemoveDoc={requestRemoveDoc}
          />
        </aside>

        <div className="min-w-0 flex-1 overflow-auto">
          {active ? (
            <div className="w-full px-8 py-8">
              <Input
                value={draftTitle}
                onChange={(e) => {
                  setDraftTitle(e.target.value);
                  scheduleSave(active.id, { title: e.target.value });
                }}
                placeholder="Без названия"
                className="mb-4 h-auto border-0 bg-transparent px-0 text-3xl font-bold shadow-none focus-visible:ring-0"
              />
              <p className="mb-4 text-xs text-muted-foreground">
                Обновлено {formatDateTime(active.updatedAt)} · v{active.version}
              </p>
              <DocFileViewer
                doc={active}
                content={draftContent}
                onContentChange={(next) => {
                  setDraftContent(next);
                  if (active.format !== 'page') scheduleSave(active.id, { content: next });
                }}
                editor={active.format === 'page' ? editor : undefined}
              />
            </div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
              <Icons.FileText className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Выберите документ или создайте страницу / загрузите файл.
              </p>
            </div>
          )}
        </div>

        {active && (
          <DocDetailSidePanel
            doc={active}
            onDelete={() => requestRemoveDoc(active.id, active.title)}
            onAddTag={(tag) => addTag(active.id, tag)}
            onRemoveTag={(tag) => removeTag(active.id, tag)}
            onRestoreVersion={(revId) => {
              flushSave();
              restoreVersion(active.id, revId);
              const updated = useDocsStore.getState().docs.find((d) => d.id === active.id);
              if (updated) {
                setDraftTitle(updated.title);
                setDraftContent(updated.content);
              }
            }}
            onAddAttachment={(a) => addAttachment(active.id, a)}
            onRemoveAttachment={(aid) => removeAttachment(active.id, aid)}
          />
        )}
      </div>

      <ConfirmDeleteDialog
        open={deleteConfirm !== null}
        onOpenChange={(o) => !o && setDeleteConfirm(null)}
        title={deleteConfirm?.title}
        description={deleteConfirm?.description}
        onConfirm={() => deleteConfirm?.onConfirm()}
      />
    </div>
  );
}
