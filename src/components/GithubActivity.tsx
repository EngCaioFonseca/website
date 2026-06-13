import { useEffect, useState } from 'react';

type Profile = {
  public_repos: number;
  followers: number;
  following: number;
};

type GhEvent = {
  id: string;
  type: string;
  created_at: string;
  repo: { name: string };
  payload: {
    commits?: unknown[];
    action?: string;
    ref_type?: string;
    pull_request?: { merged?: boolean };
  };
};

function timeAgo(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  const mo = Math.floor(d / 30);
  if (mo < 12) return `${mo}mo ago`;
  return `${Math.floor(mo / 12)}y ago`;
}

const cap = (s?: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '');

function describe(e: GhEvent): { icon: string; text: string } | null {
  switch (e.type) {
    case 'PushEvent': {
      const n = e.payload.commits?.length ?? 0;
      return {
        icon: 'ti ti-git-commit',
        text: n > 0 ? `Pushed ${n} commit${n === 1 ? '' : 's'} to` : 'Pushed to',
      };
    }
    case 'PullRequestEvent': {
      const merged = e.payload.pull_request?.merged;
      const action = merged ? 'Merged' : e.payload.action === 'opened' ? 'Opened' : 'Updated';
      return { icon: 'ti ti-git-pull-request', text: `${action} a pull request in` };
    }
    case 'PullRequestReviewEvent':
      return { icon: 'ti ti-eye', text: 'Reviewed a pull request in' };
    case 'PullRequestReviewCommentEvent':
      return { icon: 'ti ti-message-circle', text: 'Commented on a pull request in' };
    case 'IssuesEvent':
      return { icon: 'ti ti-alert-circle', text: `${cap(e.payload.action)} an issue in` };
    case 'IssueCommentEvent':
      return { icon: 'ti ti-message-circle', text: 'Commented in' };
    case 'WatchEvent':
      return { icon: 'ti ti-star', text: 'Starred' };
    case 'ForkEvent':
      return { icon: 'ti ti-git-fork', text: 'Forked' };
    case 'CreateEvent':
      return { icon: 'ti ti-plus', text: `Created ${e.payload.ref_type ?? 'a ref'} in` };
    case 'ReleaseEvent':
      return { icon: 'ti ti-tag', text: 'Published a release in' };
    default:
      return null;
  }
}

function Stat({ label, value }: { label: string; value?: number }) {
  return (
    <div>
      <span className="text-lg font-medium">{value ?? '—'}</span>{' '}
      <span className="mono text-[12px] text-faint">{label}</span>
    </div>
  );
}

export default function GithubActivity({ user, count = 6 }: { user: string; count?: number }) {
  const [events, setEvents] = useState<GhEvent[] | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([
      fetch(`https://api.github.com/users/${user}`).then((r) => {
        if (!r.ok) throw new Error(`status ${r.status}`);
        return r.json();
      }),
      fetch(`https://api.github.com/users/${user}/events/public?per_page=30`).then((r) => {
        if (!r.ok) throw new Error(`status ${r.status}`);
        return r.json();
      }),
    ])
      .then(([p, ev]: [Profile, GhEvent[]]) => {
        if (!active) return;
        setProfile(p);
        setEvents(ev);
      })
      .catch((e: unknown) => {
        if (active) setError(e instanceof Error ? e.message : String(e));
      });
    return () => {
      active = false;
    };
  }, [user]);

  if (error) {
    return (
      <p className="text-sm text-muted">
        Couldn’t load GitHub activity — see it on{' '}
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

  const shown = (events ?? [])
    .map((e) => ({ e, d: describe(e) }))
    .filter((x): x is { e: GhEvent; d: { icon: string; text: string } } => x.d !== null)
    .slice(0, count);

  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="mb-4 flex flex-wrap gap-x-6 gap-y-2 border-b border-border pb-4">
        <Stat label="repos" value={profile?.public_repos} />
        <Stat label="followers" value={profile?.followers} />
        <Stat label="following" value={profile?.following} />
      </div>

      {!events && (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-5 animate-pulse rounded bg-surface-2" />
          ))}
        </div>
      )}

      {events && shown.length === 0 && (
        <p className="text-sm text-muted">No recent public activity.</p>
      )}

      <ul className="space-y-3">
        {shown.map(({ e, d }) => (
          <li key={e.id} className="flex items-start gap-3 text-sm">
            <i className={`${d.icon} mt-0.5 text-accent`} aria-hidden="true" />
            <span className="flex-1 text-muted">
              {d.text}{' '}
              <a
                className="text-text link-underline"
                href={`https://github.com/${e.repo.name}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {e.repo.name}
              </a>
            </span>
            <span className="mono shrink-0 text-[12px] text-faint">{timeAgo(e.created_at)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
