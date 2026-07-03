import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

export function useGlobalFileDrop(onFiles: (files: File[]) => void) {
  const location = useLocation();
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    let depth = 0;

    function hasFiles(e: DragEvent) {
      return Array.from(e.dataTransfer?.types ?? []).includes('Files');
    }

    function onDragEnter(e: DragEvent) {
      if (!hasFiles(e)) return;
      e.preventDefault();
      depth += 1;
      setDragging(true);
    }

    function onDragLeave(e: DragEvent) {
      if (!hasFiles(e)) return;
      e.preventDefault();
      depth = Math.max(0, depth - 1);
      if (depth === 0) setDragging(false);
    }

    function onDragOver(e: DragEvent) {
      if (!hasFiles(e)) return;
      e.preventDefault();
    }

    function onDrop(e: DragEvent) {
      if (!hasFiles(e)) return;
      e.preventDefault();
      depth = 0;
      setDragging(false);
      const files = Array.from(e.dataTransfer?.files ?? []);
      if (files.length > 0) onFiles(files);
    }

    window.addEventListener('dragenter', onDragEnter);
    window.addEventListener('dragleave', onDragLeave);
    window.addEventListener('dragover', onDragOver);
    window.addEventListener('drop', onDrop);
    return () => {
      window.removeEventListener('dragenter', onDragEnter);
      window.removeEventListener('dragleave', onDragLeave);
      window.removeEventListener('dragover', onDragOver);
      window.removeEventListener('drop', onDrop);
    };
  }, [location.pathname, onFiles]);

  return dragging;
}

export function FileDropOverlay({ active }: { active: boolean }) {
  if (!active) return null;
  return (
    <div
      className={cn(
        'pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm',
      )}
    >
      <div className="rounded-lg border-2 border-dashed border-primary px-8 py-6 text-center">
        <p className="text-lg font-medium">Отпустите файлы</p>
        <p className="text-sm text-muted-foreground">Файлы будут добавлены в текущий контекст</p>
      </div>
    </div>
  );
}
