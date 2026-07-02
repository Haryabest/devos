import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import * as Icons from '@/components/ui/icons';
import { TASK_FILTER_LABELS, type TaskFilter, type TaskView } from '@/features/tasks/constants';

interface TasksPageHeaderProps {
  projectName: string;
  view: TaskView;
  filter: TaskFilter;
  onBack: () => void;
  onViewChange: (v: TaskView) => void;
  onFilterChange: (f: TaskFilter) => void;
}

export function TasksPageHeader({
  projectName,
  view,
  filter,
  onBack,
  onViewChange,
  onFilterChange,
}: TasksPageHeaderProps) {
  return (
    <div className="border-b border-border/60 px-6 py-4">
      <Button
        variant="ghost"
        size="sm"
        onClick={onBack}
        className="mb-2 gap-2 text-muted-foreground"
      >
        <Icons.ArrowLeft className="h-4 w-4" />
        {projectName}
      </Button>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Задачи</h1>
          <p className="text-sm text-muted-foreground">
            Доска, список или таблица — как в Notion. Двойной клик открывает страницу задачи.
          </p>
        </div>
        <Tabs value={view} onValueChange={(v) => onViewChange(v as TaskView)}>
          <TabsList>
            <TabsTrigger value="board" className="gap-1.5">
              <Icons.LayoutGrid className="h-3.5 w-3.5" />
              Доска
            </TabsTrigger>
            <TabsTrigger value="list" className="gap-1.5">
              <Icons.List className="h-3.5 w-3.5" />
              Список
            </TabsTrigger>
            <TabsTrigger value="table" className="gap-1.5">
              <Icons.Table2 className="h-3.5 w-3.5" />
              Таблица
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {TASK_FILTER_LABELS.map(({ key, label }) => (
          <Button
            key={key}
            variant={filter === key ? 'secondary' : 'ghost'}
            size="sm"
            className="h-7 text-xs"
            onClick={() => onFilterChange(key)}
          >
            {label}
          </Button>
        ))}
      </div>
    </div>
  );
}
