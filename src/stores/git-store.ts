import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { createScopedPersistStorage } from '@/lib/scoped-storage';
import type { GitCommit, GitPullRequest } from '@/lib/git';
import { fetchGitHubCommits, fetchGitHubPullRequests, parseGitHubUrl } from '@/lib/git';
import { useSaveStore } from '@/stores/save-store';

function normalizeCommits(commits: GitCommit[]): GitCommit[] {
  return commits.map((c) => ({
    ...c,
    fullSha: c.fullSha || c.sha,
    additions: c.additions ?? 0,
    deletions: c.deletions ?? 0,
    total: c.total ?? 0,
  }));
}

interface ProjectGitCache {
  commits: GitCommit[];
  pullRequests: GitPullRequest[];
  fetchedAt: string;
  error?: string;
}

interface GitState {
  cache: Record<string, ProjectGitCache>;
  fetchForProject: (projectId: string, gitUrl: string) => Promise<void>;
  fetchPullRequests: (projectId: string, gitUrl: string) => Promise<void>;
  clearProject: (projectId: string) => void;
}

export const useGitStore = create<GitState>()(
  persist(
    (set) => ({
      cache: {},

      fetchForProject: async (projectId, gitUrl) => {
        const repo = parseGitHubUrl(gitUrl);
        if (!repo) {
          set((s) => ({
            cache: {
              ...s.cache,
              [projectId]: {
                commits: [],
                pullRequests: [],
                fetchedAt: new Date().toISOString(),
                error: 'Поддерживаются только публичные GitHub-репозитории',
              },
            },
          }));
          return;
        }
        try {
          const commits = await fetchGitHubCommits(repo.owner, repo.repo);
          set((s) => ({
            cache: {
              ...s.cache,
              [projectId]: {
                commits,
                pullRequests: s.cache[projectId]?.pullRequests ?? [],
                fetchedAt: new Date().toISOString(),
              },
            },
          }));
          useSaveStore.getState().markSaved();
        } catch (e) {
          set((s) => ({
            cache: {
              ...s.cache,
              [projectId]: {
                commits: s.cache[projectId]?.commits ?? [],
                pullRequests: s.cache[projectId]?.pullRequests ?? [],
                fetchedAt: new Date().toISOString(),
                error: e instanceof Error ? e.message : 'Ошибка загрузки',
              },
            },
          }));
        }
      },

      fetchPullRequests: async (projectId, gitUrl) => {
        const repo = parseGitHubUrl(gitUrl);
        if (!repo) return;
        try {
          const pullRequests = await fetchGitHubPullRequests(repo.owner, repo.repo);
          set((s) => ({
            cache: {
              ...s.cache,
              [projectId]: {
                commits: s.cache[projectId]?.commits ?? [],
                pullRequests,
                fetchedAt: s.cache[projectId]?.fetchedAt ?? new Date().toISOString(),
              },
            },
          }));
        } catch {
          /* PR optional */
        }
      },

      clearProject: (projectId) => {
        set((s) => {
          const next = { ...s.cache };
          delete next[projectId];
          return { cache: next };
        });
      },
    }),
    {
      name: 'devos:git',
      skipHydration: true,
      storage: createJSONStorage(() => createScopedPersistStorage('devos:git')),
      version: 3,
      migrate: (persistedState) => {
        const s = persistedState as { cache?: Record<string, ProjectGitCache> };
        if (!s?.cache) return persistedState;
        return {
          cache: Object.fromEntries(
            Object.entries(s.cache).map(([id, entry]) => [
              id,
              {
                ...entry,
                commits: normalizeCommits(entry.commits ?? []),
                pullRequests: entry.pullRequests ?? [],
              },
            ]),
          ),
        };
      },
    },
  ),
);

export function getProjectCommits(projectId: string): GitCommit[] {
  return useGitStore.getState().cache[projectId]?.commits ?? [];
}
