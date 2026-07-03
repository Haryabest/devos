import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { parseGitHubUrl } from '@/lib/git';
import {
  fetchGitHubActionsStatus,
  fetchJiraIssues,
  fetchLinearIssues,
} from '@/stores/integrations-store';
import type { Project } from '@/shared/types';

interface ProjectIntegrationsPanelProps {
  project: Project;
  onUpdateLinks: (links: Project['links']) => void;
}

export function ProjectIntegrationsPanel({ project, onUpdateLinks }: ProjectIntegrationsPanelProps) {
  const [ghRuns, setGhRuns] = useState<Awaited<ReturnType<typeof fetchGitHubActionsStatus>>>([]);
  const [jira, setJira] = useState<Awaited<ReturnType<typeof fetchJiraIssues>>>([]);
  const [linear, setLinear] = useState<Awaited<ReturnType<typeof fetchLinearIssues>>>([]);
  const [jiraDraft, setJiraDraft] = useState(project.links.jira ?? '');
  const [linearDraft, setLinearDraft] = useState(project.links.linear ?? '');

  useEffect(() => {
    const git = project.links.git;
    if (!git) return;
    const repo = parseGitHubUrl(git);
    if (!repo) return;
    void fetchGitHubActionsStatus(repo.owner, repo.repo).then(setGhRuns);
  }, [project.links.git]);

  useEffect(() => {
    if (!project.links.jira) return;
    void fetchJiraIssues(`project = "${project.links.jira}" ORDER BY updated DESC`).then(setJira);
  }, [project.links.jira]);

  useEffect(() => {
    if (!project.links.linear) return;
    void fetchLinearIssues(project.links.linear).then(setLinear);
  }, [project.links.linear]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Integrations</CardTitle>
        <CardDescription>Jira, Linear, GitHub Actions</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {ghRuns.length > 0 && (
          <section className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">GitHub Actions</p>
            {ghRuns.map((r) => (
              <a
                key={r.htmlUrl}
                href={r.htmlUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between rounded-md border border-border/60 px-3 py-2 text-sm hover:bg-muted/40"
              >
                <span className="truncate">{r.name}</span>
                <Badge variant={r.conclusion === 'success' ? 'default' : 'secondary'}>
                  {r.conclusion ?? r.status}
                </Badge>
              </a>
            ))}
          </section>
        )}

        <section className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Jira project key</p>
          <div className="flex gap-2">
            <Input value={jiraDraft} onChange={(e) => setJiraDraft(e.target.value)} placeholder="DEV" className="h-8" />
            <Button
              type="button"
              size="sm"
              className="h-8"
              onClick={() => onUpdateLinks({ ...project.links, jira: jiraDraft.trim() || undefined })}
            >
              Сохранить
            </Button>
          </div>
          {jira.map((i) => (
            <a key={i.key} href={i.url} target="_blank" rel="noreferrer" className="block text-xs text-primary hover:underline">
              {i.key}: {i.summary} ({i.status})
            </a>
          ))}
        </section>

        <section className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Linear team key</p>
          <div className="flex gap-2">
            <Input value={linearDraft} onChange={(e) => setLinearDraft(e.target.value)} placeholder="ENG" className="h-8" />
            <Button
              type="button"
              size="sm"
              className="h-8"
              onClick={() => onUpdateLinks({ ...project.links, linear: linearDraft.trim() || undefined })}
            >
              Сохранить
            </Button>
          </div>
          {linear.map((i) => (
            <a key={i.id} href={i.url} target="_blank" rel="noreferrer" className="block text-xs text-primary hover:underline">
              {i.title} ({i.state})
            </a>
          ))}
        </section>

        {!project.links.git && !project.links.jira && !project.links.linear && ghRuns.length === 0 && (
          <p className="text-sm text-muted-foreground">Укажите Git, Jira или Linear в карточках проекта.</p>
        )}
      </CardContent>
    </Card>
  );
}
