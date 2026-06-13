import { useEffect, useState } from 'react';

type Props = {
  githubUser: string;
  contributions?: number;
  papers: number;
  projects: number;
  status?: string;
};

export default function LiveStatusStrip({
  githubUser,
  contributions,
  papers,
  projects,
  status = 'online @ Red Hat',
}: Props) {
  const [repos, setRepos] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    fetch(`https://api.github.com/users/${githubUser}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { public_repos?: number } | null) => {
        if (active && data?.public_repos != null) setRepos(data.public_repos);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [githubUser]);

  const metrics = [
    contributions != null && {
      k: 'contrib',
      v: contributions.toLocaleString(),
      title: 'Contributions in the last year',
    },
    repos != null && { k: 'repos', v: String(repos), title: 'Public repositories' },
    { k: 'papers', v: String(papers), title: 'Peer-reviewed publications' },
    { k: 'projects', v: String(projects), title: 'Featured software projects' },
  ].filter(Boolean) as { k: string; v: string; title: string }[];

  return (
    <div className="status-strip border-t border-border">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-5 gap-y-2 px-5 py-3">
        <span className="mono flex items-center gap-2 text-[11px] text-muted">
          <span className="status-live" aria-hidden="true" />
          <span className="text-accent">live</span>
          <span className="text-faint">·</span>
          <span>{status}</span>
        </span>
        <span className="hidden h-3 w-px bg-border sm:block" aria-hidden="true" />
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          {metrics.map((m) => (
            <span key={m.k} className="mono text-[11px]" title={m.title}>
              <span className="text-faint">{m.k}</span>{' '}
              <span className="font-medium text-text">{m.v}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
