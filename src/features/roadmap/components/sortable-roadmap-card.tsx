import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import type { RoadmapCard } from '@/shared/types';

export function SortableRoadmapCard({
  card,
  onRemove,
}: {
  card: RoadmapCard;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id,
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
      }}
      {...attributes}
      {...listeners}
      className="rounded-md border border-border/60 bg-card p-3 shadow-sm"
    >
      <p className="text-sm font-medium">{card.title}</p>
      {card.description && (
        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{card.description}</p>
      )}
      <Button
        variant="ghost"
        size="sm"
        className="mt-2 h-6 w-full text-xs text-muted-foreground"
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
      >
        Удалить
      </Button>
    </div>
  );
}
