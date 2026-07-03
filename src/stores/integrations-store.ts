import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { createScopedPersistStorage } from '@/lib/scoped-storage';

export interface IntegrationCredentials {
  jiraBaseUrl: string;
  jiraEmail: string;
  jiraToken: string;
  linearApiKey: string;
}

interface IntegrationsState extends IntegrationCredentials {
  update: (patch: Partial<IntegrationCredentials>) => void;
}

export const useIntegrationsStore = create<IntegrationsState>()(
  persist(
    (set) => ({
      jiraBaseUrl: '',
      jiraEmail: '',
      jiraToken: '',
      linearApiKey: '',
      update: (patch) => set(patch),
    }),
    {
      name: 'devos:integrations',
      skipHydration: true,
      storage: createJSONStorage(() => createScopedPersistStorage('devos:integrations')),
      version: 1,
    },
  ),
);

export interface JiraIssue {
  key: string;
  summary: string;
  status: string;
  url: string;
}

export interface LinearIssue {
  id: string;
  title: string;
  state: string;
  url: string;
}

export interface GitHubActionRun {
  name: string;
  status: string;
  conclusion: string | null;
  htmlUrl: string;
  updatedAt: string;
}

export async function fetchJiraIssues(jql: string): Promise<JiraIssue[]> {
  const creds = useIntegrationsStore.getState();
  if (!creds.jiraBaseUrl || !creds.jiraEmail || !creds.jiraToken) return [];
  const auth = btoa(`${creds.jiraEmail}:${creds.jiraToken}`);
  const url = `${creds.jiraBaseUrl.replace(/\/$/, '')}/rest/api/3/search/jql?jql=${encodeURIComponent(jql)}&maxResults=10&fields=summary,status`;
  const res = await fetch(url, { headers: { Authorization: `Basic ${auth}`, Accept: 'application/json' } });
  if (!res.ok) return [];
  const data = (await res.json()) as { issues?: { key: string; fields: { summary: string; status: { name: string } } }[] };
  return (data.issues ?? []).map((i) => ({
    key: i.key,
    summary: i.fields.summary,
    status: i.fields.status.name,
    url: `${creds.jiraBaseUrl.replace(/\/$/, '')}/browse/${i.key}`,
  }));
}

export async function fetchLinearIssues(projectLink: string): Promise<LinearIssue[]> {
  const key = useIntegrationsStore.getState().linearApiKey;
  if (!key) return [];
  const res = await fetch('https://api.linear.app/graphql', {
    method: 'POST',
    headers: { Authorization: key, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: `{ issues(first: 10, filter: { team: { key: { eq: "${projectLink}" } } }) { nodes { id title url state { name } } } }`,
    }),
  });
  if (!res.ok) return [];
  const data = (await res.json()) as { data?: { issues?: { nodes: { id: string; title: string; url: string; state: { name: string } }[] } } };
  return (data.data?.issues?.nodes ?? []).map((n) => ({
    id: n.id,
    title: n.title,
    state: n.state.name,
    url: n.url,
  }));
}

export async function fetchGitHubActionsStatus(owner: string, repo: string): Promise<GitHubActionRun[]> {
  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/actions/runs?per_page=5`,
    { headers: { Accept: 'application/vnd.github+json' } },
  );
  if (!res.ok) return [];
  const data = (await res.json()) as {
    workflow_runs?: { name: string; status: string; conclusion: string | null; html_url: string; updated_at: string }[];
  };
  return (data.workflow_runs ?? []).map((r) => ({
    name: r.name,
    status: r.status,
    conclusion: r.conclusion,
    htmlUrl: r.html_url,
    updatedAt: r.updated_at,
  }));
}
