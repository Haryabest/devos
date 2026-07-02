import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageContainer } from '@/components/layout/page-container';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DocsWorkspace } from '@/features/docs/components/docs-workspace';
import * as Icons from '@/components/ui/icons';
import { DOC_FORMAT_LABELS, SUPPORTED_DOC_FORMATS } from '@/lib/doc-formats';
import { useProjectsStore } from '@/stores/projects-store';
import { useDocsStore } from '@/stores/docs-store';

export function DocumentsPage() {
  const navigate = useNavigate();
  const projects = useProjectsStore((s) => s.projects);
  const docs = useDocsStore((s) => s.docs);
  const folders = useDocsStore((s) => s.folders);
  const [projectId, setProjectId] = useState('');

  useEffect(() => {
    if (!projectId && projects[0]) setProjectId(projects[0].id);
  }, [projects, projectId]);

  const totalDocs = docs.length;
  const selectedProject = projects.find((p) => p.id === projectId);

  const projectStats = useMemo(
    () =>
      projects.map((p) => ({
        project: p,
        docCount: docs.filter((d) => d.projectId === p.id).length,
        folderCount: folders.filter((f) => f.projectId === p.id).length,
      })),
    [projects, docs, folders],
  );

  if (projects.length === 0) {
    return (
      <PageContainer>
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Документация</h1>
          <p className="text-sm text-muted-foreground">Сначала создайте проект.</p>
        </header>
        <Button onClick={() => navigate('/projects/new')} className="gap-2">
          <Icons.Plus className="h-4 w-4" />
          Новый проект
        </Button>
      </PageContainer>
    );
  }

  return (
    <div className="flex h-[calc(100vh-3rem)] flex-col">
      <PageContainer className="shrink-0 space-y-4 py-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <header className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">Документация</h1>
            <p className="text-sm text-muted-foreground">
              Все проекты · {totalDocs} документов · сохранение в БД при входе в аккаунт
            </p>
          </header>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={projectId} onValueChange={setProjectId}>
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder="Проект" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={() => navigate('/projects')} className="gap-2">
              <Icons.LayoutGrid className="h-4 w-4" />
              Проекты
            </Button>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Форматы</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {SUPPORTED_DOC_FORMATS.map((format) => (
                <Badge key={format} variant={format === 'page' ? 'outline' : 'secondary'}>
                  {DOC_FORMAT_LABELS[format]}
                </Badge>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Проект</CardTitle>
              <CardDescription>{selectedProject?.name ?? '—'}</CardDescription>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">
              {projectStats.find((s) => s.project.id === projectId)?.docCount ?? 0} док. ·{' '}
              {projectStats.find((s) => s.project.id === projectId)?.folderCount ?? 0} папок
            </CardContent>
          </Card>
        </div>
      </PageContainer>

      <div className="min-h-0 flex-1 border-t border-border/60">
        {projectId ? <DocsWorkspace projectId={projectId} /> : null}
      </div>
    </div>
  );
}
