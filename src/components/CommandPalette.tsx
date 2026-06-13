import { useEffect, useMemo, useRef, useState } from 'react';
import { NAV, SOCIAL, SITE } from '../consts';
import { searchSiteIndex, typeLabel, type SiteIndexEntry } from '../utils/siteIndex';
import { withBase } from '../utils/url';

type Action = {
  id: string;
  label: string;
  hint?: string;
  icon: string;
  keywords?: string;
  group: 'navigate' | 'content' | 'actions';
  run: () => void;
};

type Props = {
  siteIndex?: SiteIndexEntry[];
};

export default function CommandPalette({ siteIndex = [] }: Props) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  const baseActions = useMemo<Action[]>(() => {
    const nav: Action[] = NAV.map((n) => ({
      id: `nav-${n.href}`,
      label: `Go to ${n.label}`,
      hint: n.href,
      icon: 'ti ti-arrow-right',
      keywords: n.label,
      group: 'navigate',
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
      group: 'actions',
      run: () => {
        if (s.key === 'email') window.location.href = s.href;
        else window.open(s.href, '_blank', 'noopener');
      },
    }));
    const tools: Action[] = [
      {
        id: 'shell',
        label: 'Focus agent shell',
        hint: 'home',
        icon: 'ti ti-terminal-2',
        keywords: 'terminal shell agent boot',
        group: 'actions',
        run: () => {
          window.dispatchEvent(new Event('shell:focus'));
          if (window.location.pathname.endsWith('/') || window.location.pathname.endsWith('/website')) {
            return;
          }
          window.location.href = withBase('/');
        },
      },
      {
        id: 'theme',
        label: 'Toggle colour theme',
        icon: 'ti ti-contrast',
        keywords: 'dark light mode',
        group: 'actions',
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
        group: 'actions',
        run: () => navigator.clipboard?.writeText(SITE.email),
      },
    ];
    return [...nav, ...social, ...tools];
  }, []);

  const contentActions = useMemo<Action[]>(() => {
    if (q.trim().length < 2) return [];
    return searchSiteIndex(siteIndex, q, 6).map((entry) => ({
      id: entry.id,
      label: entry.title,
      hint: typeLabel(entry.type),
      icon:
        entry.type === 'publication'
          ? 'ti ti-flask'
          : entry.type === 'project'
            ? 'ti ti-folder-code'
            : entry.type === 'post'
              ? 'ti ti-pencil'
              : 'ti ti-file',
      keywords: entry.keywords,
      group: 'content' as const,
      run: () => {
        if (entry.href.startsWith('http')) window.open(entry.href, '_blank', 'noopener');
        else window.location.href = entry.href;
      },
    }));
  }, [q, siteIndex]);

  const actions = useMemo(
    () => [...contentActions, ...baseActions],
    [contentActions, baseActions],
  );

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return baseActions;
    if (contentActions.length > 0) return actions;
    return baseActions.filter((a) =>
      `${a.label} ${a.keywords ?? ''} ${a.hint ?? ''}`.toLowerCase().includes(s),
    );
  }, [q, actions, baseActions, contentActions]);

  const grouped = useMemo(() => {
    const groups: { label: string; items: Action[] }[] = [];
    const content = filtered.filter((a) => a.group === 'content');
    const navigate = filtered.filter((a) => a.group === 'navigate');
    const actionsGroup = filtered.filter((a) => a.group === 'actions');
    if (content.length) groups.push({ label: 'Content', items: content });
    if (navigate.length) groups.push({ label: 'Navigate', items: navigate });
    if (actionsGroup.length) groups.push({ label: 'Actions', items: actionsGroup });
    return groups.length ? groups : [{ label: 'Results', items: filtered }];
  }, [filtered]);

  const flatFiltered = useMemo(() => grouped.flatMap((g) => g.items), [grouped]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
      } else if (e.key === 'Escape' && open) {
        e.preventDefault();
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
  }, [open]);

  useEffect(() => {
    if (open) {
      previousFocus.current = document.activeElement as HTMLElement;
      setQ('');
      setActive(0);
      const id = window.setTimeout(() => inputRef.current?.focus(), 20);
      document.body.style.overflow = 'hidden';

      const trap = (e: KeyboardEvent) => {
        if (e.key !== 'Tab' || !panelRef.current) return;
        const nodes = panelRef.current.querySelectorAll<HTMLElement>(
          'input, button:not([disabled])',
        );
        if (!nodes.length) return;
        const first = nodes[0];
        const last = nodes[nodes.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      };
      document.addEventListener('keydown', trap);
      return () => {
        window.clearTimeout(id);
        document.removeEventListener('keydown', trap);
        document.body.style.overflow = '';
        previousFocus.current?.focus();
      };
    }
    document.body.style.overflow = '';
    return undefined;
  }, [open]);

  useEffect(() => setActive(0), [q]);

  if (!open) return null;

  const runAt = (i: number) => {
    const a = flatFiltered[i];
    if (!a) return;
    setOpen(false);
    a.run();
  };

  let rowIndex = -1;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Command menu"
      className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[10vh]"
      onClick={() => setOpen(false)}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" />
      <div
        ref={panelRef}
        className="relative w-full max-w-lg overflow-hidden rounded-xl border border-border-strong bg-surface shadow-2xl"
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
                setActive((a) => Math.min(a + 1, flatFiltered.length - 1));
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setActive((a) => Math.max(a - 1, 0));
              } else if (e.key === 'Enter') {
                e.preventDefault();
                runAt(active);
              }
            }}
            placeholder="Search pages, projects, papers…"
            aria-label="Search commands and content"
            aria-controls="cmdk-listbox"
            aria-activedescendant={
              flatFiltered[active] ? `cmdk-option-${flatFiltered[active].id}` : undefined
            }
            className="w-full bg-transparent py-3 text-sm outline-none"
          />
          <kbd className="mono hidden rounded border border-border px-1.5 py-0.5 text-[11px] text-muted sm:inline">
            esc
          </kbd>
        </div>
        <ul id="cmdk-listbox" role="listbox" className="max-h-80 overflow-y-auto py-1">
          {flatFiltered.length === 0 && (
            <li className="px-4 py-6 text-center text-sm text-muted">No results</li>
          )}
          {grouped.map((group) => (
            <li key={group.label}>
              <p className="palette-group-label">{group.label}</p>
              <ul>
                {group.items.map((a) => {
                  rowIndex += 1;
                  const i = rowIndex;
                  const selected = i === active;
                  return (
                    <li key={a.id} role="presentation">
                      <button
                        id={`cmdk-option-${a.id}`}
                        type="button"
                        role="option"
                        aria-selected={selected}
                        onMouseEnter={() => setActive(i)}
                        onClick={() => runAt(i)}
                        className={`flex w-full items-center gap-3 px-4 py-2 text-left text-sm ${
                          selected ? 'bg-surface-2' : ''
                        }`}
                      >
                        <i className={`${a.icon} text-muted`} aria-hidden="true" />
                        <span className="flex-1">{a.label}</span>
                        {a.hint && (
                          <span className="mono text-[11px] text-faint">{a.hint}</span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
