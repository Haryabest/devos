import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { DndContext, DragOverlay, closestCorners } from '@dnd-kit/core';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import * as Icons from '@/components/ui/icons';
import { BreadcrumbBack } from '@/components/layout/breadcrumb-back';
import { PageTopBar } from '@/components/layout/page-top-bar';
import { useProjectsStore } from '@/stores/projects-store';
import { useRoadmapStore } from '@/stores/roadmap-store';
import { RoadmapColumn } from '@/features/roadmap/components/roadmap-column';
import { useRoadmapDnd } from '@/features/roadmap/hooks/use-roadmap-dnd';
import type { RoadmapCard } from '@/shared/types';

export function ProjectRoadmapPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const project = useProjectsStore((s) => s.projects.find((p) => p.id === projectId));
  const columns = useRoadmapStore((s) => s.columns);
  const cards = useRoadmapStore((s) => s.cards);
  const seedProject = useRoadmapStore((s) => s.seedProject);
  const addColumn = useRoadmapStore((s) => s.addColumn);
  const addCard = useRoadmapStore((s) => s.addCard);
  const removeCard = useRoadmapStore((s) => s.removeCard);

  const [activeCard, setActiveCard] = useState<RoadmapCard | null>(null);
  const [newColName, setNewColName] = useState('');

  useEffect(() => {
    if (projectId) seedProject(projectId);
  }, [projectId, seedProject]);

  const projectColumns = useMemo(
    () => columns.filter((c) => c.projectId === projectId).sort((a, b) => a.order - b.order),
    [columns, projectId],
  );

  const projectCards = useMemo(
    () => cards.filter((c) => c.projectId === projectId),
    [cards, projectId],
  );

  const { sensors, onDragStart, onDragOver, onDragEnd } = useRoadmapDnd(
    projectColumns,
    projectCards,
    setActiveCard,
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

  return (
    <div className="flex h-full flex-col">
      <PageTopBar breadcrumb={<BreadcrumbBack label={project.name} to={`/projects/${project.id}`} />}>
        <h1 className="text-2xl font-semibold tracking-tight">Roadmap</h1>
        <p className="text-sm text-muted-foreground">
          Kanban-доска для планирования этапов и роадмапа проекта.
        </p>
      </PageTopBar>

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
              <RoadmapColumn
                key={col.id}
                column={col}
                cards={projectCards.filter((c) => c.columnId === col.id)}
                onAdd={(title) => addCard({ projectId: project.id, columnId: col.id, title })}
                onRemoveCard={removeCard}
              />
            ))}
            <Card className="h-fit w-64 shrink-0 border-dashed">
              <CardHeader className="pb-2">
                <CardDescription>Новая колонка</CardDescription>
              </CardHeader>
              <CardContent className="flex gap-2">
                <Input
                  value={newColName}
                  onChange={(e) => setNewColName(e.target.value)}
                  placeholder="Название"
                  className="h-8"
                />
                <Button
                  size="sm"
                  className="h-8"
                  onClick={() => {
                    if (!newColName.trim()) return;
                    addColumn(project.id, newColName);
                    setNewColName('');
                  }}
                >
                  +
                </Button>
              </CardContent>
            </Card>
          </div>
          <DragOverlay>
            {activeCard ? (
              <div className="w-72 rounded-md border border-border/60 bg-card p-3 shadow-lg">
                <p className="text-sm font-medium">{activeCard.title}</p>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
}
