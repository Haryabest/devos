import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import * as Icons from '@/components/ui/icons';
import { FigmaQuickAdd } from '@/features/projects/components/figma-quick-add';
import { useFigmaStore } from '@/stores/figma-store';
import type { Project } from '@/shared/types';

interface ProjectFigmaCardProps {
  project: Project;
  onAddFigma: (url: string) => void;
}

export function ProjectFigmaCard({ project, onAddFigma }: ProjectFigmaCardProps) {
  const figma = project.links?.figma;
  const ensureCached = useFigmaStore((s) => s.ensureCached);
  const refreshFigma = useFigmaStore((s) => s.refresh);
  const cached = useFigmaStore((s) => (figma ? s.cache[figma.trim()] : undefined));
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    if (!figma) return;
    void ensureCached(figma);
  }, [figma, ensureCached]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Icons.Figma className="h-4 w-4" />
            Figma
          </CardTitle>
          <CardDescription>
            Превью через oEmbed — без embed-iframe (нет ошибок авторизации Figma).
          </CardDescription>
        </div>
        {figma && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-8 shrink-0"
            disabled={syncing}
            onClick={() => {
              setSyncing(true);
              void refreshFigma(figma).finally(() => setSyncing(false));
            }}
          >
            {syncing ? <Icons.Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Sync'}
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {figma ? (
          <div className="space-y-3">
            {cached?.thumbnailUrl ? (
              <a
                href={figma}
                target="_blank"
                rel="noreferrer"
                className="block overflow-hidden rounded-md border border-border/60 transition-opacity hover:opacity-90"
              >
                <img
                  src={cached.thumbnailUrl}
                  alt={cached.title ?? 'Figma preview'}
                  className="h-auto w-full object-cover"
                />
                <p className="bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                  {cached.title ?? 'Figma'} · открыть в новой вкладке
                </p>
              </a>
            ) : (
              <div className="rounded-md border border-dashed border-border/60 py-8 text-center text-sm text-muted-foreground">
                Превью загружается…
              </div>
            )}
            <a
              href={figma}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              Открыть в Figma
              <Icons.ExternalLink className="h-3 w-3" />
            </a>
          </div>
        ) : (
          <FigmaQuickAdd onAdd={onAddFigma} />
        )}
      </CardContent>
    </Card>
  );
}
