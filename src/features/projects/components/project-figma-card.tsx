import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import * as Icons from '@/components/ui/icons';
import { FigmaQuickAdd, figmaEmbedUrl } from '@/features/projects/components/figma-quick-add';
import type { Project } from '@/shared/types';

interface ProjectFigmaCardProps {
  project: Project;
  onAddFigma: (url: string) => void;
  onEditLinks: () => void;
}

export function ProjectFigmaCard({ project, onAddFigma, onEditLinks }: ProjectFigmaCardProps) {
  const figma = project.links?.figma;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icons.Figma className="h-4 w-4" />
          Figma
        </CardTitle>
        <CardDescription>Вставьте ссылку — превью подтянется автоматически.</CardDescription>
      </CardHeader>
      <CardContent>
        {figma ? (
          <div className="space-y-2">
            <iframe
              title="Figma preview"
              src={figmaEmbedUrl(figma)}
              className="h-[480px] w-full rounded-md border border-border/60 bg-muted/30"
              allowFullScreen
            />
            <div className="flex items-center justify-between gap-2">
              <a
                href={figma}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
              >
                Открыть в Figma
                <Icons.ExternalLink className="h-3 w-3" />
              </a>
              <Button variant="outline" size="sm" onClick={onEditLinks} className="gap-1.5">
                <Icons.Pencil className="h-3 w-3" />
                Изменить ссылку
              </Button>
            </div>
          </div>
        ) : (
          <FigmaQuickAdd onAdd={onAddFigma} />
        )}
      </CardContent>
    </Card>
  );
}
