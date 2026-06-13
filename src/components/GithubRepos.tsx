import { useEffect, useState } from 'react';

type Repo = {
  id: number;
  name: string;
  description: string | null;
  html_url: string;
  stargazers_count: number;
  language: string | null;
  fork: boolean;
  archived: boolean;
};

export default function GithubRepos({ user, count = 6 }: { user: string; count?: number }) {
  const [repos, setRepos] = useState<Repo[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetch(`https://api.github.com/users/${user}/repos?sort=updated&per_page=100`, {
      headers: { Accept: 'application/vnd.github+json' },
    })
      .then((r) => {
        if (!r.ok) throw new Error(`status ${r.status}`);
        return r.json();
      })
      .then((data: Repo[]) => {
        if (!active) return;
        const top = data
          .filter((r) => !r.fork && !r.archived)
          .sort((a, b) => b.stargazers_count - a.stargazers_count)
          .slice(0, count);
        setRepos(top);
      })
      .catch((e: unknown) => {
        if (active) setError(e instanceof Error ? e.message : String(e));
      });
    return () => {
      active = false;
    };
  }, [user, count]);

  if (error) {
    return (
      <p className="text-sm text-muted">
        Couldn’t load repositories right now — see them on{' '}
        <a
          className="text-accent link-underline"
          href={`https://github.com/${user}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          GitHub ↗
        </a>
        .
      </p>
    );
  }

  if (!repos) {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-xl border border-border bg-surface-2" />
        ))}
      </div>
    );
  }

  if (repos.length === 0) {
    return <p className="text-sm text-muted">No public repositories to show yet.</p>;
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {repos.map((r) => (
        <a
          key={r.id}
          href={r.html_url}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex flex-col rounded-xl border border-border bg-surface p-4 transition-colors hover:border-border-strong"
        >
          <div className="flex items-center gap-2">
            <i className="ti ti-folder-code text-accent" aria-hidden="true" />
            <span className="font-medium transition-colors group-hover:text-accent">{r.name}</span>
          </div>
          <p className="mt-1 flex-1 text-sm text-muted">{r.description ?? 'No description.'}</p>
          <div className="mono mt-3 flex items-center gap-4 text-[12px] text-faint">
            {r.language && <span>{r.language}</span>}
            <span className="flex items-center gap-1">
              <i className="ti ti-star" aria-hidden="true" />
              {r.stargazers_count}
            </span>
          </div>
        </a>
      ))}
    </div>
  );
}
