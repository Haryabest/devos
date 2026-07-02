import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  RichEditorBody,
  RichEditorToolbar,
  useRichEditor,
} from '@/components/ui/rich-editor';
import { AttachmentSidebar } from '@/components/ui/attachment-sidebar';
import { ConfirmDeleteDialog, type DeleteConfirmState } from '@/components/ui/confirm-delete-dialog';
import * as Icons from '@/components/ui/icons';
import { cn } from '@/lib/utils';
import { useProjectsStore } from '@/stores/projects-store';
import { useDocsStore } from '@/stores/docs-store';

export function ProjectDocsPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const project = useProjectsStore((s) => s.projects.find((p) => p.id === projectId));
  const docs = useDocsStore((s) => s.docs);
  const create = useDocsStore((s) => s.create);
  const scheduleSave = useDocsStore((s) => s.scheduleSave);
  const flushSave = useDocsStore((s) => s.flushSave);
  const remove = useDocsStore((s) => s.remove);
  const addAttachment = useDocsStore((s) => s.addAttachment);
  const removeAttachment = useDocsStore((s) => s.removeAttachment);

  const projectDocs = useMemo(
    () => docs.filter((d) => d.projectId === projectId),
    [docs, projectId],
  );

  const [activeId, setActiveId] = useState<string | null>(null);
  const active = projectDocs.find((d) => d.id === activeId) ?? projectDocs[0] ?? null;

  const [draftTitle, setDraftTitle] = useState('');
  const [draftContent, setDraftContent] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<DeleteConfirmState | null>(null);

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
      if (active) scheduleSave(active.id, { content: html });
    },
    active?.id,
  );

  if (!project) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <Card>
          <CardHeader>
            <CardTitle>Проект не найден</CardTitle>
            <CardDescription>Возможно, он был удалён.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" size="sm" onClick={() => navigate('/projects')} className="gap-2">
              <Icons.ArrowLeft className="h-4 w-4" />
              К проектам
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  function handleCreate() {
    flushSave();
    const doc = create(project!.id);
    setActiveId(doc.id);
  }

  function requestRemoveDoc(id: string, title: string) {
    setDeleteConfirm({
      title: 'Удалить страницу?',
      description: `«${title || 'Без названия'}» будет удалена без возможности восстановления.`,
      onConfirm: () => {
        remove(id);
        if (activeId === id) setActiveId(null);
      },
    });
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border/60 px-6 py-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(`/projects/${project.id}`)}
          className="mb-2 gap-2 text-muted-foreground"
        >
          <Icons.ArrowLeft className="h-4 w-4" />
          {project.name}
        </Button>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">Документация</h1>
          {active && (
            <RichEditorToolbar controller={editor} className="max-w-full overflow-x-auto" />
          )}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <aside className="flex w-64 shrink-0 flex-col border-r border-border/60">
          <div className="flex items-center justify-between px-3 py-2">
            <span className="text-xs font-medium text-muted-foreground">Страницы</span>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleCreate} aria-label="Новая страница">
              <Icons.Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex-1 overflow-auto px-2 pb-2">
            {projectDocs.length === 0 ? (
              <p className="px-2 py-4 text-xs text-muted-foreground">Нет страниц. Создайте первую.</p>
            ) : (
              projectDocs.map((d) => (
                <button
                  key={d.id}
                  onClick={() => handleSelectDoc(d.id)}
                  className={cn(
                    'group flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-accent',
                    active?.id === d.id && 'bg-accent',
                  )}
                >
                  <Icons.FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <span className="flex-1 truncate">{d.title || 'Без названия'}</span>
                  <span
                    role="button"
                    tabIndex={-1}
                    aria-label="Удалить"
                    onClick={(e) => {
                      e.stopPropagation();
                      requestRemoveDoc(d.id, d.title);
                    }}
                    className="opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    <Icons.Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                  </span>
                </button>
              ))
            )}
          </div>
        </aside>

        <div className="flex-1 overflow-auto">
          {active ? (
            <div className="mx-auto max-w-3xl px-8 py-8">
              <input
                value={draftTitle}
                onChange={(e) => {
                  setDraftTitle(e.target.value);
                  scheduleSave(active.id, { title: e.target.value });
                }}
                placeholder="Без названия"
                className="mb-4 w-full border-0 bg-transparent text-3xl font-bold tracking-tight outline-none placeholder:text-muted-foreground/50"
              />
              <RichEditorBody
                controller={editor}
                placeholder="Начните писать… Поддерживаются жирный, курсив, заголовки, списки, цитаты, код и изображения."
              />
            </div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
              <Icons.FileText className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Выберите или создайте страницу.</p>
              <Button variant="outline" size="sm" onClick={handleCreate} className="gap-2">
                <Icons.Plus className="h-4 w-4" />
                Новая страница
              </Button>
            </div>
          )}
        </div>

        {active && (
          <AttachmentSidebar
            attachments={active.attachments}
            onAdd={(a) => addAttachment(active.id, a)}
            onRemove={(aid) => removeAttachment(active.id, aid)}
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
