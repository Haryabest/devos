import { useMemo, useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import * as Icons from '@/components/ui/icons';
import { cn } from '@/lib/utils';
import { SortableRoadmapCard } from '@/features/roadmap/components/sortable-roadmap-card';
import type { RoadmapCard, RoadmapColumn } from '@/shared/types';

export function RoadmapColumn({
  column,
  cards,
  onAdd,
  onRemoveCard,
}: {
  column: RoadmapColumn;
  cards: RoadmapCard[];
  onAdd: (title: string) => void;
  onRemoveCard: (id: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState('');
  const sorted = useMemo(() => [...cards].sort((a, b) => a.order - b.order), [cards]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    onAdd(title);
    setTitle('');
    setAdding(false);
  }

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex h-full w-72 shrink-0 flex-col rounded-lg border border-border/60 bg-card/50',
        isOver && 'border-primary/60 ring-2 ring-primary/20',
      )}
    >
      <div className="flex items-center gap-2 px-3 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: column.color }} />
        <span className="text-sm font-medium">{column.name}</span>
        <Badge variant="secondary" className="ml-auto px-1.5 py-0 text-[10px]">
          {sorted.length}
        </Badge>
      </div>
      <SortableContext items={sorted.map((c) => c.id)} strategy={verticalListSortingStrategy}>
        <div className="flex-1 space-y-2 overflow-y-auto px-2 pb-2">
          {sorted.map((card) => (
            <SortableRoadmapCard key={card.id} card={card} onRemove={() => onRemoveCard(card.id)} />
          ))}
        </div>
      </SortableContext>
      <div className="border-t border-border/40 p-2">
        {adding ? (
          <form onSubmit={submit} className="flex gap-1">
            <Input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Название"
              className="h-8 text-xs"
            />
            <Button type="submit" size="sm" className="h-8 px-2">
              <Icons.Check className="h-3.5 w-3.5" />
            </Button>
          </form>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-full justify-start gap-1.5 text-xs text-muted-foreground"
            onClick={() => setAdding(true)}
          >
            <Icons.Plus className="h-3.5 w-3.5" />
            Карточка
          </Button>
        )}
      </div>
    </div>
  );
}
