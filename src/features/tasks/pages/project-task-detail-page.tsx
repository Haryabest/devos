import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import {
  PRIORITIES,
  PRIORITY_LABEL,
  useTasksStore,
} from '@/stores/tasks-store';
import type { Priority } from '@/shared/types';
import { PRIORITY_DOT } from '@/features/tasks/constants';
import { SubtaskList, AddSubtask } from '@/features/tasks/components/subtask-list';

export function ProjectTaskDetailPage() {
  const { projectId, taskId } = useParams();
  const navigate = useNavigate();
  const project = useProjectsStore((s) => s.projects.find((p) => p.id === projectId));
  const task = useTasksStore((s) => s.tasks.find((t) => t.id === taskId));
  const columns = useTasksStore((s) => s.columns.filter((c) => c.projectId === projectId));
  const allTasks = useTasksStore((s) => s.tasks);
  const update = useTasksStore((s) => s.update);
  const scheduleUpdate = useTasksStore((s) => s.scheduleUpdate);
  const flushTaskSave = useTasksStore((s) => s.flushTaskSave);
  const remove = useTasksStore((s) => s.remove);
  const addSub = useTasksStore((s) => s.add);
  const addAtt = useTasksStore((s) => s.addAttachment);
  const removeAtt = useTasksStore((s) => s.removeAttachment);

  const [draftTitle, setDraftTitle] = useState(task?.title ?? '');
  const [draftDescription, setDraftDescription] = useState(task?.description ?? '');
  const [deleteConfirm, setDeleteConfirm] = useState<DeleteConfirmState | null>(null);

  useEffect(() => {
    if (!task) return;
    setDraftTitle(task.title);
    setDraftDescription(task.description);
  }, [task?.id]);

  useEffect(() => () => flushTaskSave(), [flushTaskSave]);

  const subtasks = useMemo(
    () =>
      task
        ? allTasks.filter((t) => t.parentId === task.id).sort((a, b) => a.order - b.order)
        : [],
    [allTasks, task],
  );

  const editor = useRichEditor(
    draftDescription,
    (html) => {
      setDraftDescription(html);
      if (task) scheduleUpdate(task.id, { description: html });
    },
    task?.id,
  );

  if (!project) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <Card>
          <CardHeader>
            <CardTitle>Проект не найден</CardTitle>
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

  if (!task || task.projectId !== projectId) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <Card>
          <CardHeader>
            <CardTitle>Задача не найдена</CardTitle>
            <CardDescription>Возможно, она была удалена.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/projects/${projectId}/tasks`)}
              className="gap-2"
            >
              <Icons.ArrowLeft className="h-4 w-4" />
              К задачам
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const column = columns.find((c) => c.id === task.columnId);

  function handleDelete() {
    setDeleteConfirm({
      title: 'Удалить задачу?',
      description: `«${task!.title || 'Без названия'}» и все подзадачи будут удалены.`,
      onConfirm: () => {
        remove(task!.id);
        navigate(`/projects/${projectId}/tasks`);
      },
    });
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border/60 px-6 py-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(`/projects/${projectId}/tasks`)}
          className="mb-2 gap-2 text-muted-foreground"
        >
          <Icons.ArrowLeft className="h-4 w-4" />
          Задачи · {project.name}
        </Button>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">Задача</h1>
          <RichEditorToolbar controller={editor} className="max-w-full overflow-x-auto" />
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-auto">
          <div className="mx-auto max-w-3xl px-8 py-8">
            <div className="mb-4 flex items-start gap-3">
              <button
                onClick={() => update(task.id, { done: !task.done })}
                className={cn(
                  'mt-2 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border',
                  task.done
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-input',
                )}
                aria-label="Отметить выполненным"
              >
                {task.done && <Icons.Check className="h-3.5 w-3.5" />}
              </button>
              <input
                value={draftTitle}
                onChange={(e) => {
                  setDraftTitle(e.target.value);
                  scheduleUpdate(task.id, { title: e.target.value });
                }}
                placeholder="Без названия"
                className={cn(
                  'flex-1 border-0 bg-transparent text-3xl font-bold tracking-tight outline-none placeholder:text-muted-foreground/50',
                  task.done && 'text-muted-foreground line-through',
                )}
              />
              <Button variant="ghost" size="icon" className="shrink-0" onClick={handleDelete}>
                <Icons.Trash2 className="h-4 w-4 text-muted-foreground" />
              </Button>
            </div>

            <p className="mb-4 text-xs text-muted-foreground">
              Создана {new Date(task.createdAt).toLocaleString('ru-RU')}
              {column && (
                <span className="ml-2 inline-flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: column.color }} />
                  {column.name}
                </span>
              )}
            </p>

            <div className="mb-6 flex flex-wrap items-center gap-3">
              <Select
                value={task.priority}
                onValueChange={(v) => update(task.id, { priority: v as Priority })}
              >
                <SelectTrigger className="h-8 w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => (
                    <SelectItem key={p} value={p}>
                      <span className={cn('mr-1.5 inline-block h-2 w-2 rounded-full', PRIORITY_DOT[p])} />
                      {PRIORITY_LABEL[p]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={task.columnId}
                onValueChange={(v) => update(task.id, { columnId: v })}
              >
                <SelectTrigger className="h-8 w-40">
                  <SelectValue placeholder="Колонка" />
                </SelectTrigger>
                <SelectContent>
                  {columns.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      <span className="mr-1.5 inline-block h-2 w-2 rounded-full" style={{ backgroundColor: c.color }} />
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <RichEditorBody
              controller={editor}
              placeholder="Опишите задачу: контекст, шаги, критерии…"
            />

            <div className="mt-8 space-y-2 border-t border-border/40 pt-6">
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <Icons.Layers className="h-3.5 w-3.5" />
                Подзадачи
              </div>
              <SubtaskList
                subtasks={subtasks}
                onRequestRemove={(s) =>
                  setDeleteConfirm({
                    title: 'Удалить подзадачу?',
                    description: `«${s.title || 'Без названия'}» будет удалена.`,
                    onConfirm: () => remove(s.id),
                  })
                }
              />
              <AddSubtask
                onAdd={(title) =>
                  addSub({
                    projectId: task.projectId,
                    columnId: task.columnId,
                    parentId: task.id,
                    title,
                  })
                }
              />
            </div>
          </div>
        </div>

        <AttachmentSidebar
          attachments={task.attachments}
          onAdd={(a) => addAtt(task.id, a)}
          onRemove={(aid) => removeAtt(task.id, aid)}
        />
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
