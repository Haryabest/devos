import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { DndContext, DragOverlay, closestCorners } from '@dnd-kit/core';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ConfirmDeleteDialog, type DeleteConfirmState } from '@/components/ui/confirm-delete-dialog';
import * as Icons from '@/components/ui/icons';
import { AddColumnCard } from '@/features/tasks/components/add-column-card';
import { KanbanColumn } from '@/features/tasks/components/kanban-column';
import { TaskCard } from '@/features/tasks/components/task-card';
import { TaskListView } from '@/features/tasks/components/task-list-view';
import { TaskTableView } from '@/features/tasks/components/task-table-view';
import { TasksPageHeader } from '@/features/tasks/components/tasks-page-header';
import { applyTaskFilter, type TaskFilter, type TaskView } from '@/features/tasks/constants';
import { useProjectTasksDnd } from '@/features/tasks/hooks/use-project-tasks-dnd';
import { useProjectsStore } from '@/stores/projects-store';
import { seedColumns, useTasksStore } from '@/stores/tasks-store';
import type { Task, TaskColumn } from '@/shared/types';

export function ProjectTasksPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const project = useProjectsStore((s) => s.projects.find((p) => p.id === projectId));

  const columns = useTasksStore((s) => s.columns);
  const tasks = useTasksStore((s) => s.tasks);
  const addColumn = useTasksStore((s) => s.addColumn);
  const renameColumn = useTasksStore((s) => s.renameColumn);
  const recolorColumn = useTasksStore((s) => s.recolorColumn);
  const removeColumn = useTasksStore((s) => s.removeColumn);
  const addTask = useTasksStore((s) => s.add);
  const removeTask = useTasksStore((s) => s.remove);

  useEffect(() => {
    if (!projectId) return;
    const has = useTasksStore.getState().columns.some((c) => c.projectId === projectId);
    if (!has) {
      const seeded = seedColumns(projectId);
      useTasksStore.setState((s) => ({ columns: [...s.columns, ...seeded] }));
    }
  }, [projectId]);

  const projectColumns = useMemo(
    () =>
      columns
        .filter((c) => c.projectId === projectId)
        .sort((a, b) => a.order - b.order),
    [columns, projectId],
  );

  const projectTasks = useMemo(
    () => tasks.filter((t) => t.projectId === projectId && t.parentId === null),
    [tasks, projectId],
  );

  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [view, setView] = useState<TaskView>('board');
  const [filter, setFilter] = useState<TaskFilter>('all');
  const [deleteConfirm, setDeleteConfirm] = useState<DeleteConfirmState | null>(null);

  const filteredTasks = useMemo(
    () => applyTaskFilter(projectTasks, filter),
    [projectTasks, filter],
  );

  const { sensors, onDragStart, onDragOver, onDragEnd } = useProjectTasksDnd(
    projectColumns,
    tasks,
    setActiveTask,
  );

  function openTask(task: Task) {
    navigate(`/projects/${projectId}/tasks/${task.id}`);
  }

  function requestRemoveTask(task: Task) {
    setDeleteConfirm({
      title: 'Удалить задачу?',
      description: `«${task.title || 'Без названия'}» будет удалена.`,
      onConfirm: () => removeTask(task.id),
    });
  }

  function requestRemoveColumn(col: TaskColumn) {
    setDeleteConfirm({
      title: 'Удалить колонку?',
      description: `Колонка «${col.name}» и все задачи в ней будут удалены.`,
      onConfirm: () => removeColumn(col.id),
    });
  }

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

  return (
    <div className="flex h-full flex-col">
      <TasksPageHeader
        projectName={project.name}
        view={view}
        filter={filter}
        onBack={() => navigate(`/projects/${project.id}`)}
        onViewChange={setView}
        onFilterChange={setFilter}
      />

      {view === 'board' ? (
        <div className="flex-1 overflow-x-auto overflow-y-hidden">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={onDragStart}
            onDragOver={onDragOver}
            onDragEnd={onDragEnd}
          >
            <div className="flex h-full gap-4 p-6">
              {projectColumns.map((col) => (
                <KanbanColumn
                  key={col.id}
                  column={col}
                  tasks={filteredTasks.filter((t) => t.columnId === col.id)}
                  onAdd={(title) => addTask({ projectId: project.id, columnId: col.id, title })}
                  onRename={(name) => renameColumn(col.id, name)}
                  onRecolor={(color) => recolorColumn(col.id, color)}
                  onRemove={() => requestRemoveColumn(col)}
                  onRemoveTask={requestRemoveTask}
                  onOpenTask={openTask}
                />
              ))}
              <AddColumnCard onAdd={(name) => addColumn({ projectId: project.id, name })} />
            </div>
            <DragOverlay>
              {activeTask ? <TaskCard task={activeTask} dragging /> : null}
            </DragOverlay>
          </DndContext>
        </div>
      ) : view === 'list' ? (
        <TaskListView
          columns={projectColumns}
          tasks={filteredTasks}
          onOpen={openTask}
          onRemove={requestRemoveTask}
        />
      ) : (
        <TaskTableView
          columns={projectColumns}
          tasks={filteredTasks}
          onOpen={openTask}
          onRemove={requestRemoveTask}
        />
      )}

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
