import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import * as Icons from '@/components/ui/icons';
import {
  PROJECT_STATUSES,
  STATUS_COLOR,
  STATUS_LABEL,
} from '@/stores/projects-store';
import type { Project } from '@/shared/types';

interface ProjectMetaSectionProps {
  project: Project;
  editingLinks: boolean;
  figmaDraft: string;
  gitDraft: string;
  onStatusChange: (status: Project['status']) => void;
  onStartEditLinks: () => void;
  onFigmaDraftChange: (v: string) => void;
  onGitDraftChange: (v: string) => void;
  onSaveLinks: () => void;
  onCancelEditLinks: () => void;
}

export function ProjectMetaSection({
  project,
  editingLinks,
  figmaDraft,
  gitDraft,
  onStatusChange,
  onStartEditLinks,
  onFigmaDraftChange,
  onGitDraftChange,
  onSaveLinks,
  onCancelEditLinks,
}: ProjectMetaSectionProps) {
  const git = project.links?.git;

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Статус</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={project.status} onValueChange={(v) => onStatusChange(v as Project['status'])}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PROJECT_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  <span
                    className="mr-1.5 inline-block h-2 w-2 rounded-full align-middle"
                    style={{ backgroundColor: STATUS_COLOR[s] }}
                  />
                  {STATUS_LABEL[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
          <CardDescription>Git</CardDescription>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={onStartEditLinks}
            aria-label="Редактировать ссылки"
          >
            <Icons.Pencil className="h-3 w-3" />
          </Button>
        </CardHeader>
        <CardContent className="text-sm">
          {editingLinks ? (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5 text-xs">
                  <Icons.Figma className="h-3.5 w-3.5" /> Figma
                </Label>
                <Input
                  value={figmaDraft}
                  onChange={(e) => onFigmaDraftChange(e.target.value)}
                  placeholder="https://figma.com/file/…"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5 text-xs">
                  <Icons.Github className="h-3.5 w-3.5" /> Git
                </Label>
                <Input
                  value={gitDraft}
                  onChange={(e) => onGitDraftChange(e.target.value)}
                  placeholder="https://github.com/org/repo"
                />
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={onSaveLinks}>
                  Сохранить
                </Button>
                <Button size="sm" variant="outline" onClick={onCancelEditLinks}>
                  Отмена
                </Button>
              </div>
            </div>
          ) : git ? (
            <a
              href={git}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 text-primary hover:underline"
            >
              <Icons.Github className="h-4 w-4 shrink-0" />
              <span className="truncate">{git}</span>
            </a>
          ) : (
            <span className="text-muted-foreground">Не задан</span>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Создан</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          {new Date(project.createdAt).toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
          })}
        </CardContent>
      </Card>
    </div>
  );
}
