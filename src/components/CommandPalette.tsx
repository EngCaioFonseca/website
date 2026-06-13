import { useEffect, useMemo, useRef, useState } from 'react';
import { NAV, SOCIAL, SITE } from '../consts';
import { withBase } from '../utils/url';

type Action = {
  id: string;
  label: string;
  hint?: string;
  icon: string;
  keywords?: string;
  run: () => void;
};

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const actions = useMemo<Action[]>(() => {
    const nav: Action[] = NAV.map((n) => ({
      id: `nav-${n.href}`,
      label: `Go to ${n.label}`,
      hint: n.href,
      icon: 'ti ti-arrow-right',
      keywords: n.label,
      run: () => {
        window.location.href = withBase(n.href);
      },
    }));
    const social: Action[] = SOCIAL.map((s) => ({
      id: `social-${s.key}`,
      label: s.label,
      hint: s.href.replace('mailto:', ''),
      icon: s.icon,
      keywords: s.key,
      run: () => {
        if (s.key === 'email') window.location.href = s.href;
        else window.open(s.href, '_blank', 'noopener');
      },
    }));
    const tools: Action[] = [
      {
        id: 'theme',
        label: 'Toggle colour theme',
        icon: 'ti ti-contrast',
        keywords: 'dark light mode',
        run: () => {
          const dark = document.documentElement.classList.toggle('dark');
          localStorage.setItem('theme', dark ? 'dark' : 'light');
        },
      },
      {
        id: 'copy-email',
        label: 'Copy email address',
        icon: 'ti ti-copy',
        keywords: 'contact mail',
        run: () => navigator.clipboard?.writeText(SITE.email),
      },
    ];
    return [...nav, ...social, ...tools];
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return actions;
    return actions.filter((a) =>
      `${a.label} ${a.keywords ?? ''} ${a.hint ?? ''}`.toLowerCase().includes(s),
    );
  }, [q, actions]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
      } else if (e.key === 'Escape') {
        setOpen(false);
      }
    };
    const onOpen = () => setOpen(true);
    window.addEventListener('keydown', onKey);
    window.addEventListener('cmdk:open', onOpen);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('cmdk:open', onOpen);
    };
  }, []);

  useEffect(() => {
    if (open) {
      setQ('');
      setActive(0);
      const id = window.setTimeout(() => inputRef.current?.focus(), 20);
      document.body.style.overflow = 'hidden';
      return () => window.clearTimeout(id);
    }
    document.body.style.overflow = '';
    return undefined;
  }, [open]);

  useEffect(() => setActive(0), [q]);

  if (!open) return null;

  const runAt = (i: number) => {
    const a = filtered[i];
    if (!a) return;
    setOpen(false);
    a.run();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Command menu"
      className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[12vh]"
      onClick={() => setOpen(false)}
    >
      <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.45)' }} />
      <div
        className="relative w-full max-w-lg overflow-hidden rounded-xl border border-border-strong bg-surface"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b border-border px-3">
          <i className="ti ti-search text-muted" aria-hidden="true" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                setActive((a) => Math.min(a + 1, filtered.length - 1));
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setActive((a) => Math.max(a - 1, 0));
              } else if (e.key === 'Enter') {
                e.preventDefault();
                runAt(active);
              }
            }}
            placeholder="Type a command or search…"
            aria-label="Search commands"
            className="w-full bg-transparent py-3 text-sm outline-none"
          />
          <kbd className="mono rounded border border-border px-1.5 py-0.5 text-[11px] text-muted">
            esc
          </kbd>
        </div>
        <ul className="max-h-72 overflow-y-auto py-1">
          {filtered.length === 0 && (
            <li className="px-4 py-6 text-center text-sm text-muted">No results</li>
          )}
          {filtered.map((a, i) => (
            <li key={a.id}>
              <button
                type="button"
                onMouseEnter={() => setActive(i)}
                onClick={() => runAt(i)}
                className={`flex w-full items-center gap-3 px-4 py-2 text-left text-sm ${
                  i === active ? 'bg-surface-2' : ''
                }`}
              >
                <i className={`${a.icon} text-muted`} aria-hidden="true" />
                <span className="flex-1">{a.label}</span>
                {a.hint && <span className="mono text-[11px] text-faint">{a.hint}</span>}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
