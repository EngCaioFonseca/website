import { useMemo, useState } from 'react';

export type Pub = {
  title: string;
  authors: string;
  venue: string;
  year: number;
  type: string;
  doi?: string;
  url?: string;
  pdf?: string;
  code?: string;
  tags: string[];
};

const TYPES = ['all', 'journal', 'conference', 'workshop', 'preprint'];

export default function PublicationList({ items }: { items: Pub[] }) {
  const [type, setType] = useState('all');
  const [q, setQ] = useState('');

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return items
      .filter((p) => (type === 'all' ? true : p.type === type))
      .filter((p) =>
        s ? `${p.title} ${p.authors} ${p.venue} ${p.tags.join(' ')}`.toLowerCase().includes(s) : true,
      )
      .sort((a, b) => b.year - a.year);
  }, [items, type, q]);

  const years = useMemo(
    () => Array.from(new Set(filtered.map((p) => p.year))).sort((a, b) => b - a),
    [filtered],
  );

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center gap-2">
        {TYPES.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setType(t)}
            className={`mono rounded-full border px-3 py-1 text-[12px] capitalize transition-colors ${
              type === t
                ? 'border-accent text-accent'
                : 'border-border text-muted hover:border-border-strong'
            }`}
          >
            {t}
          </button>
        ))}
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="search…"
          aria-label="Search publications"
          className="mono ml-auto w-32 rounded-full border border-border bg-transparent px-3 py-1 text-[12px] outline-none focus:border-accent"
        />
      </div>

      {filtered.length === 0 && <p className="text-sm text-muted">No publications match.</p>}

      <div className="space-y-8">
        {years.map((y) => (
          <div key={y}>
            <h3 className="mono mb-3 text-sm text-faint">{y}</h3>
            <ul className="space-y-5">
              {filtered
                .filter((p) => p.year === y)
                .map((p, i) => (
                  <li key={i} className="border-l-2 border-border pl-4">
                    <p className="font-medium leading-snug">{p.title}</p>
                    <p className="mt-1 text-sm text-muted">{p.authors}</p>
                    <p className="mt-0.5 text-sm">
                      <span className="text-muted">{p.venue}</span>{' '}
                      <span className="mono text-[12px] text-faint">· {p.type}</span>
                    </p>
                    <div className="mono mt-2 flex flex-wrap gap-3 text-[12px]">
                      {p.url && (
                        <a className="text-accent link-underline" href={p.url} target="_blank" rel="noopener noreferrer">
                          link ↗
                        </a>
                      )}
                      {p.doi && (
                        <a
                          className="text-accent link-underline"
                          href={`https://doi.org/${p.doi}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          doi ↗
                        </a>
                      )}
                      {p.pdf && (
                        <a className="text-accent link-underline" href={p.pdf} target="_blank" rel="noopener noreferrer">
                          pdf ↗
                        </a>
                      )}
                      {p.code && (
                        <a className="text-accent link-underline" href={p.code} target="_blank" rel="noopener noreferrer">
                          code ↗
                        </a>
                      )}
                    </div>
                  </li>
                ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
