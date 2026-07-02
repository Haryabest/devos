import { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
  const cached = useFigmaStore((s) => (figma ? s.cache[figma.trim()] : undefined));

  useEffect(() => {
    if (!figma) return;
    void ensureCached(figma);
  }, [figma, ensureCached]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icons.Figma className="h-4 w-4" />
          Figma
        </CardTitle>
        <CardDescription>
          Превью через oEmbed — без embed-iframe (нет ошибок авторизации Figma).
        </CardDescription>
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
