import { useEffect, useMemo, useState } from 'react';
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
import * as Icons from '@/components/ui/icons';
import { aggregateCommitStats } from '@/lib/git';
import { formatDateTime } from '@/lib/format-date';
import { cn } from '@/lib/utils';
import { useGitStore } from '@/stores/git-store';
import { GitLinkDialog } from '@/features/projects/components/git-link-dialog';

interface ProjectGitDashboardProps {
  projectId: string;
  gitUrl?: string;
  onSaveGitUrl: (url: string) => void;
}

export function ProjectGitDashboard({
  projectId,
  gitUrl,
  onSaveGitUrl,
}: ProjectGitDashboardProps) {
  const cache = useGitStore((s) => s.cache[projectId]);
  const fetchForProject = useGitStore((s) => s.fetchForProject);
  const [authorFilter, setAuthorFilter] = useState<string>('__all');
  const [loading, setLoading] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [hovered, setHovered] = useState(false);

  const commits = cache?.commits ?? [];
  const authors = useMemo(
    () => [...new Set(commits.map((c) => c.author))].sort(),
    [commits],
  );
  const stats = useMemo(
    () => aggregateCommitStats(commits, authorFilter === '__all' ? undefined : authorFilter),
    [commits, authorFilter],
  );

  const totalAdd = commits.reduce((s, c) => s + c.additions, 0);
  const totalDel = commits.reduce((s, c) => s + c.deletions, 0);

  useEffect(() => {
    if (!gitUrl) return;
    if (cache?.commits.length && !cache.error) return;
    void refresh();
  }, [projectId, gitUrl]);

  async function refresh() {
    if (!gitUrl) return;
    setLoading(true);
    await fetchForProject(projectId, gitUrl);
    setLoading(false);
  }

  return (
    <>
      <Card
        className="group relative"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
          <div className="min-w-0">
            <CardTitle className="flex items-center gap-2 text-base">
              <Icons.Github className="h-4 w-4" />
              Git-активность
              <button
                type="button"
                onClick={() => setLinkOpen(true)}
                className={cn(
                  'ml-1 rounded-md p-1 text-muted-foreground transition-opacity hover:bg-muted hover:text-foreground',
                  hovered || !gitUrl ? 'opacity-100' : 'opacity-0',
                )}
                aria-label="Указать репозиторий"
              >
                <Icons.Pencil className="h-3.5 w-3.5" />
              </button>
            </CardTitle>
            <CardDescription className="truncate">
              {gitUrl ? (
                <>
                  {commits.length} коммитов ·{' '}
                  <span className="text-green-600 dark:text-green-400">+{totalAdd}</span>{' '}
                  <span className="text-red-600 dark:text-red-400">−{totalDel}</span>
                  {cache?.fetchedAt && ` · ${formatDateTime(cache.fetchedAt)}`}
                </>
              ) : (
                'Наведите и нажмите карандаш, чтобы указать GitHub-репозиторий'
              )}
            </CardDescription>
          </div>
          {gitUrl && (
            <div className="flex shrink-0 items-center gap-2">
              {authors.length > 0 && (
                <Select value={authorFilter} onValueChange={setAuthorFilter}>
                  <SelectTrigger className="h-8 w-40">
                    <SelectValue placeholder="Автор" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all">Все авторы</SelectItem>
                    {authors.map((a) => (
                      <SelectItem key={a} value={a}>
                        {a}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <Button size="sm" variant="outline" onClick={() => void refresh()} disabled={loading}>
                {loading ? <Icons.Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Обновить'}
              </Button>
            </div>
          )}
        </CardHeader>

        {gitUrl && (
          <CardContent className="space-y-4">
            {cache?.error && <p className="text-sm text-destructive">{cache.error}</p>}

            {stats.length > 0 && (
              <div className="grid gap-2 sm:grid-cols-2">
                {stats.slice(0, 6).map((s) => (
                  <div key={s.author} className="rounded-md border border-border/60 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-medium">{s.author}</span>
                      <Badge variant="secondary">{s.count} комм.</Badge>
                    </div>
                    <p className="mt-1 text-xs">
                      <span className="text-green-600 dark:text-green-400">+{s.additions}</span>
                      {' · '}
                      <span className="text-red-600 dark:text-red-400">−{s.deletions}</span>
                      {' · '}
                      <span className="text-muted-foreground">
                        {formatDateTime(s.lastCommit)}
                      </span>
                    </p>
                  </div>
                ))}
              </div>
            )}

            {commits.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground">Последние коммиты</p>
                {(authorFilter === '__all'
                  ? commits
                  : commits.filter((c) => c.author === authorFilter)
                )
                  .slice(0, 8)
                  .map((c, i) => (
                    <div
                      key={`${c.fullSha ?? c.sha}-${i}`}
                      className="flex items-start gap-2 rounded-md border border-border/40 px-3 py-2 text-sm"
                    >
                      <code className="shrink-0 text-xs text-muted-foreground">{c.sha}</code>
                      <div className="min-w-0 flex-1">
                        <p className="truncate">{c.message}</p>
                        <p className="text-xs text-muted-foreground">
                          {c.author} · {formatDateTime(c.date)}
                        </p>
                      </div>
                      <div className="shrink-0 text-right text-xs font-mono">
                        <span className="text-green-600 dark:text-green-400">+{c.additions}</span>
                        <span className="text-muted-foreground"> / </span>
                        <span className="text-red-600 dark:text-red-400">−{c.deletions}</span>
                      </div>
                    </div>
                  ))}
              </div>
            )}

            {!loading && commits.length === 0 && !cache?.error && (
              <p className="text-sm text-muted-foreground">Нажмите «Обновить», чтобы загрузить коммиты.</p>
            )}
          </CardContent>
        )}
      </Card>

      <GitLinkDialog
        open={linkOpen}
        onOpenChange={setLinkOpen}
        value={gitUrl ?? ''}
        onSave={onSaveGitUrl}
      />
    </>
  );
}
