import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ConfirmDeleteDialog, type DeleteConfirmState } from '@/components/ui/confirm-delete-dialog';
import * as Icons from '@/components/ui/icons';
import {
  HEALTH_LABEL,
  PROJECT_STATUSES,
  PROJECT_TYPES,
  STATUS_LABEL,
  useProjectsStore,
} from '@/stores/projects-store';
import { useGroupsStore } from '@/stores/groups-store';
import { useTasksStore } from '@/stores/tasks-store';
import { useDocsStore } from '@/stores/docs-store';
import { useApiStore } from '@/stores/api-store';
import type { Project } from '@/shared/types';
import type { GroupFilter, HealthFilter, StatusFilter, TypeFilter } from '@/features/projects/constants';
import { FilterSelect } from '@/features/projects/components/filter-select';
import { ProjectGrid } from '@/features/projects/components/project-grid';
import { EmptyProjects } from '@/features/projects/components/empty-projects';
import { GroupsBar } from '@/features/projects/components/groups-bar';
import { ProjectFormDialog } from '@/features/projects/components/project-form-dialog';
import { GroupFormDialog } from '@/features/projects/components/group-form-dialog';

export function ProjectsPage() {
  const navigate = useNavigate();
  const projects = useProjectsStore((s) => s.projects);
  const updateProject = useProjectsStore((s) => s.update);
  const removeProject = useProjectsStore((s) => s.remove);
  const groups = useGroupsStore((s) => s.groups);
  const removeGroup = useGroupsStore((s) => s.remove);
  const tasks = useTasksStore((s) => s.tasks);
  const docs = useDocsStore((s) => s.docs);
  const endpoints = useApiStore((s) => s.endpoints);

  const [open, setOpen] = useState(false);
  const [groupOpen, setGroupOpen] = useState(false);
  const [editGroup, setEditGroup] = useState<(typeof groups)[0] | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<DeleteConfirmState | null>(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('ALL');
  const [healthFilter, setHealthFilter] = useState<HealthFilter>('ALL');
  const [groupFilter, setGroupFilter] = useState<GroupFilter>('ALL');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return projects.filter((p) => {
      if (q && !p.name.toLowerCase().includes(q) && !p.description.toLowerCase().includes(q))
        return false;
      if (statusFilter !== 'ALL' && p.status !== statusFilter) return false;
      if (typeFilter !== 'ALL' && p.type !== typeFilter) return false;
      if (healthFilter !== 'ALL' && p.health !== healthFilter) return false;
      if (groupFilter === 'NONE' && p.groupId) return false;
      if (groupFilter !== 'ALL' && groupFilter !== 'NONE' && p.groupId !== groupFilter) return false;
      return true;
    });
  }, [projects, search, statusFilter, typeFilter, healthFilter, groupFilter]);

  const groupedSections = useMemo(() => {
    if (groupFilter !== 'ALL') return null;
    const sortedGroups = [...groups].sort((a, b) => a.order - b.order);
    const sections: { id: string; name: string; color: string; projects: Project[] }[] = [];

    for (const g of sortedGroups) {
      const list = filtered.filter((p) => p.groupId === g.id);
      if (list.length > 0) sections.push({ id: g.id, name: g.name, color: g.color, projects: list });
    }
    const ungrouped = filtered.filter((p) => !p.groupId);
    if (ungrouped.length > 0) {
      sections.push({ id: '__none', name: 'Без группы', color: '#64748b', projects: ungrouped });
    }
    return sections.length > 0 ? sections : null;
  }, [filtered, groups, groupFilter]);

  function handleDeleteGroup(groupId: string, name: string) {
    setDeleteConfirm({
      title: 'Удалить группу?',
      description: `Группа «${name}» будет удалена. Проекты останутся без группы.`,
      onConfirm: () => {
        projects.filter((p) => p.groupId === groupId).forEach((p) => updateProject(p.id, { groupId: null }));
        removeGroup(groupId);
      },
    });
  }

  function handleDeleteProject(p: Project) {
    setDeleteConfirm({
      title: 'Удалить проект?',
      description: `«${p.name}» и все задачи, документация и API будут удалены.`,
      onConfirm: () => removeProject(p.id),
    });
  }

  const hasFilters =
    search.trim() ||
    statusFilter !== 'ALL' ||
    typeFilter !== 'ALL' ||
    healthFilter !== 'ALL' ||
    groupFilter !== 'ALL';

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <header className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Проекты</h1>
          <p className="text-sm text-muted-foreground">
            Фильтрация, группы и локальное хранение — без backend.
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button variant="outline" onClick={() => setGroupOpen(true)} className="gap-2">
            <Icons.FolderPlus className="h-4 w-4" />
            Группа
          </Button>
          <Button onClick={() => setOpen(true)} className="gap-2">
            <Icons.Plus className="h-4 w-4" />
            Проект
          </Button>
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[200px] flex-1">
          <Icons.Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск по названию…"
            className="h-9 pl-8"
          />
        </div>
        <FilterSelect
          value={statusFilter}
          onChange={(v) => setStatusFilter(v as StatusFilter)}
          placeholder="Статус"
          options={[{ value: 'ALL', label: 'Все статусы' }, ...PROJECT_STATUSES.map((s) => ({ value: s, label: STATUS_LABEL[s] }))]}
        />
        <FilterSelect
          value={typeFilter}
          onChange={(v) => setTypeFilter(v as TypeFilter)}
          placeholder="Тип"
          options={[{ value: 'ALL', label: 'Все типы' }, ...PROJECT_TYPES.map((t) => ({ value: t, label: t }))]}
        />
        <FilterSelect
          value={healthFilter}
          onChange={(v) => setHealthFilter(v as HealthFilter)}
          placeholder="Здоровье"
          options={[
            { value: 'ALL', label: 'Любое' },
            { value: 'GREEN', label: HEALTH_LABEL.GREEN },
            { value: 'YELLOW', label: HEALTH_LABEL.YELLOW },
            { value: 'RED', label: HEALTH_LABEL.RED },
          ]}
        />
        <FilterSelect
          value={groupFilter}
          onChange={(v) => setGroupFilter(v as GroupFilter)}
          placeholder="Группа"
          options={[
            { value: 'ALL', label: 'Все группы' },
            { value: 'NONE', label: 'Без группы' },
            ...groups.map((g) => ({ value: g.id, label: g.name })),
          ]}
        />
        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            className="h-9 text-xs"
            onClick={() => {
              setSearch('');
              setStatusFilter('ALL');
              setTypeFilter('ALL');
              setHealthFilter('ALL');
              setGroupFilter('ALL');
            }}
          >
            Сбросить
          </Button>
        )}
      </div>

      <GroupsBar
        groups={groups}
        projects={projects}
        onEdit={(g) => {
          setEditGroup(g);
          setGroupOpen(true);
        }}
        onDelete={handleDeleteGroup}
      />

      {projects.length === 0 ? (
        <EmptyProjects onCreate={() => setOpen(true)} />
      ) : filtered.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Нет проектов по выбранным фильтрам.
          </CardContent>
        </Card>
      ) : groupedSections ? (
        <div className="space-y-8">
          {groupedSections.map((section) => (
            <section key={section.id}>
              <div className="mb-3 flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: section.color }} />
                <h2 className="text-sm font-semibold">{section.name}</h2>
                <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
                  {section.projects.length}
                </Badge>
              </div>
              <ProjectGrid
                projects={section.projects}
                tasks={tasks}
                docs={docs}
                endpoints={endpoints}
                groups={groups}
                onOpen={(id) => navigate(`/projects/${id}`)}
                onDelete={handleDeleteProject}
              />
            </section>
          ))}
        </div>
      ) : (
        <ProjectGrid
          projects={filtered}
          tasks={tasks}
          docs={docs}
          endpoints={endpoints}
          groups={groups}
          onOpen={(id) => navigate(`/projects/${id}`)}
          onDelete={handleDeleteProject}
        />
      )}

      <ProjectFormDialog
        open={open}
        onOpenChange={setOpen}
        onCreated={(id) => navigate(`/projects/${id}`)}
      />
      <GroupFormDialog
        open={groupOpen}
        onOpenChange={(o) => {
          setGroupOpen(o);
          if (!o) setEditGroup(null);
        }}
        group={editGroup}
      />
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
