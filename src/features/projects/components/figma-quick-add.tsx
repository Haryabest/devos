import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type FigmaQuickAddProps = {
  onAdd: (url: string) => void;
};

export function FigmaQuickAdd({ onAdd }: FigmaQuickAddProps) {
  const [url, setUrl] = useState('');
  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://www.figma.com/file/…"
        />
        <Button
          disabled={!url.trim()}
          onClick={() => {
            onAdd(url.trim());
            setUrl('');
          }}
          className="shrink-0"
        >
          Добавить
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Поддерживаются ссылки на файлы, фреймы и прототипы Figma.
      </p>
    </div>
  );
}

export function figmaEmbedUrl(url: string): string {
  return `https://www.figma.com/embed?embed_host=devos&url=${encodeURIComponent(url)}`;
}
