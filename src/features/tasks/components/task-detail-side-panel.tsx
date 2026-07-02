import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AttachmentSidebar } from '@/components/ui/attachment-sidebar';
import * as Icons from '@/components/ui/icons';
import { SubtaskList, AddSubtask } from '@/features/tasks/components/subtask-list';
import { TaskExtras } from '@/features/tasks/components/task-extras';
import type { Attachment, AttachmentKind, Task } from '@/shared/types';

interface TaskDetailSidePanelProps {
  task: Task;
  subtasks: Task[];
  siblingTasks: Task[];
  attachments: Attachment[];
  onAddSubtask: (title: string) => void;
  onRequestRemoveSubtask: (s: Task) => void;
  onAddComment: (text: string) => void;
  onAddDependency: (taskId: string) => void;
  onRemoveDependency: (taskId: string) => void;
  onAddAttachment: (a: { kind: AttachmentKind; label: string; value: string }) => void;
  onRemoveAttachment: (id: string) => void;
}

export function TaskDetailSidePanel({
  task,
  subtasks,
  siblingTasks,
  attachments,
  onAddSubtask,
  onRequestRemoveSubtask,
  onAddComment,
  onAddDependency,
  onRemoveDependency,
  onAddAttachment,
  onRemoveAttachment,
}: TaskDetailSidePanelProps) {
  return (
    <aside className="flex w-[420px] shrink-0 flex-col border-l border-border/60 bg-card/20">
      <Tabs defaultValue="subtasks" className="flex min-h-0 flex-1 flex-col">
        <div className="border-b border-border/60 px-3 py-2">
          <TabsList className="grid h-8 w-full grid-cols-5">
            <TabsTrigger value="subtasks" className="px-1 text-[11px]">
              Подзадачи
            </TabsTrigger>
            <TabsTrigger value="deps" className="px-1 text-[11px]">
              Связи
            </TabsTrigger>
            <TabsTrigger value="comments" className="px-1 text-[11px]">
              Чат
            </TabsTrigger>
            <TabsTrigger value="history" className="px-1 text-[11px]">
              История
            </TabsTrigger>
            <TabsTrigger value="files" className="px-1 text-[11px]">
              Файлы
            </TabsTrigger>
          </TabsList>
        </div>

        <ScrollArea className="min-h-0 flex-1">
          <TabsContent value="subtasks" className="mt-0 space-y-3 p-3">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <Icons.Layers className="h-3.5 w-3.5" />
              Подзадачи ({subtasks.length})
            </div>
            <SubtaskList subtasks={subtasks} onRequestRemove={onRequestRemoveSubtask} />
            <AddSubtask onAdd={onAddSubtask} />
          </TabsContent>

          <TabsContent value="deps" className="mt-0 p-3">
            <TaskExtras
              task={task}
              siblingTasks={siblingTasks}
              onAddComment={() => {}}
              onAddDependency={onAddDependency}
              onRemoveDependency={onRemoveDependency}
              sections={['dependencies']}
            />
          </TabsContent>

          <TabsContent value="comments" className="mt-0 p-3">
            <TaskExtras
              task={task}
              siblingTasks={siblingTasks}
              onAddComment={onAddComment}
              onAddDependency={() => {}}
              onRemoveDependency={() => {}}
              sections={['comments']}
            />
          </TabsContent>

          <TabsContent value="history" className="mt-0 p-3">
            <TaskExtras
              task={task}
              siblingTasks={siblingTasks}
              onAddComment={() => {}}
              onAddDependency={() => {}}
              onRemoveDependency={() => {}}
              sections={['history']}
            />
          </TabsContent>

          <TabsContent value="files" className="mt-0 h-full">
            <AttachmentSidebar
              className="h-full border-l-0"
              attachments={attachments}
              onAdd={onAddAttachment}
              onRemove={onRemoveAttachment}
            />
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </aside>
  );
}
