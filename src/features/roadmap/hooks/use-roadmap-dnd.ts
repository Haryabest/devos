import { useCallback } from 'react';
import {
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { useRoadmapStore } from '@/stores/roadmap-store';
import type { RoadmapCard, RoadmapColumn } from '@/shared/types';

export function useRoadmapDnd(
  columns: RoadmapColumn[],
  cards: RoadmapCard[],
  setActiveCard: (c: RoadmapCard | null) => void,
) {
  const moveCard = useRoadmapStore((s) => s.moveCard);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const findColumnByCard = useCallback(
    (cardId: string): RoadmapColumn | undefined => {
      const c = cards.find((x) => x.id === cardId);
      return c ? columns.find((col) => col.id === c.columnId) : undefined;
    },
    [cards, columns],
  );

  const onDragStart = useCallback(
    (e: DragStartEvent) => {
      setActiveCard(cards.find((c) => c.id === String(e.active.id)) ?? null);
    },
    [cards, setActiveCard],
  );

  const onDragOver = useCallback(
    (e: DragOverEvent) => {
      const { active, over } = e;
      if (!over) return;
      const activeCol = findColumnByCard(String(active.id));
      const overCol = columns.find((c) => c.id === String(over.id));
      if (activeCol && overCol && activeCol.id !== overCol.id) {
        moveCard(String(active.id), overCol.id, Number.MAX_SAFE_INTEGER);
      }
    },
    [findColumnByCard, columns, moveCard],
  );

  const onDragEnd = useCallback(
    (e: DragEndEvent) => {
      const { active, over } = e;
      setActiveCard(null);
      if (!over) return;
      const col = findColumnByCard(String(active.id));
      if (!col) return;
      const list = cards
        .filter((c) => c.columnId === col.id && c.id !== active.id)
        .sort((a, b) => a.order - b.order);
      const overCard = cards.find((c) => c.id === String(over.id));
      const newIndex =
        overCard && overCard.columnId === col.id
          ? list.findIndex((c) => c.id === overCard.id)
          : list.length;
      moveCard(String(active.id), col.id, Math.max(0, newIndex));
    },
    [findColumnByCard, cards, moveCard, setActiveCard],
  );

  return { sensors, onDragStart, onDragOver, onDragEnd };
}
