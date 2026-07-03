export interface GitCommit {
  sha: string;
  fullSha: string;
  message: string;
  author: string;
  authorEmail: string;
  date: string;
  additions: number;
  deletions: number;
  total: number;
}

export interface GitRepoInfo {
  owner: string;
  repo: string;
  provider: 'github';
}

export function parseGitHubUrl(url: string): GitRepoInfo | null {
  const trimmed = url.trim();
  if (!trimmed) return null;

  const ssh = trimmed.match(/git@github\.com:([^/]+)\/(.+?)(?:\.git)?$/i);
  if (ssh) return { owner: ssh[1]!, repo: ssh[2]!, provider: 'github' };

  try {
    const u = new URL(trimmed);
    if (!u.hostname.includes('github.com')) return null;
    const parts = u.pathname.replace(/^\//, '').replace(/\.git$/, '').split('/');
    if (parts.length < 2 || !parts[0] || !parts[1]) return null;
    return { owner: parts[0], repo: parts[1], provider: 'github' };
  } catch {
    return null;
  }
}

interface GitHubCommitItem {
  sha: string;
  commit: {
    message: string;
    author: { name: string; email: string; date: string };
  };
  author?: { login: string } | null;
}

interface GitHubCommitDetail extends GitHubCommitItem {
  stats?: { total: number; additions: number; deletions: number };
}

async function fetchCommitDetail(
  owner: string,
  repo: string,
  sha: string,
): Promise<{ additions: number; deletions: number; total: number }> {
  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/commits/${sha}`, {
    headers: { Accept: 'application/vnd.github+json' },
  });
  if (!res.ok) return { additions: 0, deletions: 0, total: 0 };
  const data = (await res.json()) as GitHubCommitDetail;
  return {
    additions: data.stats?.additions ?? 0,
    deletions: data.stats?.deletions ?? 0,
    total: data.stats?.total ?? 0,
  };
}

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let index = 0;
  async function worker() {
    while (index < items.length) {
      const i = index++;
      results[i] = await fn(items[i]!);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, () => worker()));
  return results;
}

async function enrichCommits(
  owner: string,
  repo: string,
  items: GitHubCommitItem[],
): Promise<GitCommit[]> {
  const stats = await mapWithConcurrency(items, 3, (c) => fetchCommitDetail(owner, repo, c.sha));
  return items.map((c, idx) => {
    const s = stats[idx]!;
    return {
      sha: c.sha.slice(0, 7),
      fullSha: c.sha,
      message: c.commit.message.split('\n')[0] ?? '',
      author: c.author?.login ?? c.commit.author.name,
      authorEmail: c.commit.author.email,
      date: c.commit.author.date,
      additions: s.additions,
      deletions: s.deletions,
      total: s.total,
    };
  });
}

export async function fetchGitHubCommits(
  owner: string,
  repo: string,
  perPage = 30,
): Promise<GitCommit[]> {
  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/commits?per_page=${perPage}`,
    { headers: { Accept: 'application/vnd.github+json' } },
  );
  if (!res.ok) {
    throw new Error(
      res.status === 404
        ? 'Репозиторий не найден или приватный'
        : `GitHub API: ${res.status}`,
    );
  }
  const data = (await res.json()) as GitHubCommitItem[];
  return enrichCommits(owner, repo, data);
}

export interface GitPullRequest {
  number: number;
  title: string;
  author: string;
  state: string;
  createdAt: string;
  htmlUrl: string;
  draft: boolean;
}

interface GitHubPullItem {
  number: number;
  title: string;
  state: string;
  draft?: boolean;
  html_url: string;
  created_at: string;
  user?: { login: string } | null;
}

export async function fetchGitHubPullRequests(
  owner: string,
  repo: string,
  perPage = 10,
): Promise<GitPullRequest[]> {
  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/pulls?state=open&per_page=${perPage}`,
    { headers: { Accept: 'application/vnd.github+json' } },
  );
  if (!res.ok) {
    throw new Error(res.status === 404 ? 'PR не найдены или репозиторий приватный' : `GitHub API: ${res.status}`);
  }
  const data = (await res.json()) as GitHubPullItem[];
  return data.map((pr) => ({
    number: pr.number,
    title: pr.title,
    author: pr.user?.login ?? 'unknown',
    state: pr.state,
    createdAt: pr.created_at,
    htmlUrl: pr.html_url,
    draft: pr.draft ?? false,
  }));
}

export interface CommitStats {
  author: string;
  count: number;
  additions: number;
  deletions: number;
  lastCommit: string;
}

export function aggregateCommitStats(
  commits: GitCommit[],
  authorFilter?: string,
): CommitStats[] {
  const filtered = authorFilter
    ? commits.filter((c) => c.author === authorFilter)
    : commits;
  const map = new Map<string, CommitStats>();
  for (const c of filtered) {
    const prev = map.get(c.author);
    if (!prev) {
      map.set(c.author, {
        author: c.author,
        count: 1,
        additions: c.additions,
        deletions: c.deletions,
        lastCommit: c.date,
      });
    } else {
      prev.count += 1;
      prev.additions += c.additions;
      prev.deletions += c.deletions;
      if (new Date(c.date) > new Date(prev.lastCommit)) prev.lastCommit = c.date;
    }
  }
  return [...map.values()].sort((a, b) => b.additions + b.deletions - (a.additions + a.deletions));
}
