import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { SITE } from '../consts';
import { withBase } from '../utils/url';
import {
  searchSiteIndex,
  typeLabel,
  type SiteIndexEntry,
} from '../utils/siteIndex';

type Line = { kind: 'in' | 'out' | 'sys' | 'err'; text: string };

const BOOT: Line[] = [
  { kind: 'sys', text: 'caio-shell v1.0 — local index, no cloud' },
  { kind: 'in', text: 'boot --profile public' },
  { kind: 'out', text: 'loading identity… ok' },
  { kind: 'in', text: 'whoami' },
  { kind: 'out', text: 'caio fonseca — software engineer @ Red Hat' },
  { kind: 'in', text: 'background --short' },
  { kind: 'out', text: 'phd · computational science & applied maths' },
  { kind: 'out', text: 'ex: UCLA · RIT · IINELS Brain Institute' },
  { kind: 'sys', text: "ready — type 'help' or ask about projects & papers" },
];

const HELP = `commands:
  help              show this message
  ask <query>       search site (e.g. ask glioblastoma)
  projects          list software projects
  papers            list publications
  go <n>            open search result #n
  contact           show email
  theme             toggle colour theme
  clear             reset output
  palette           open command menu (⌘K)`;

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const handler = () => setReduced(mq.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return reduced;
}

type Props = {
  siteIndex: SiteIndexEntry[];
};

export default function AgentShell({ siteIndex }: Props) {
  const reduced = usePrefersReducedMotion();
  const [lines, setLines] = useState<Line[]>([]);
  const [input, setInput] = useState('');
  const [ready, setReady] = useState(false);
  const [lastResults, setLastResults] = useState<SiteIndexEntry[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const append = useCallback((...next: Line[]) => {
    setLines((prev) => [...prev, ...next]);
  }, []);

  const scrollDown = useCallback(() => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    });
  }, []);

  useEffect(() => {
    scrollDown();
  }, [lines, scrollDown]);

  useEffect(() => {
    const focus = () => {
      inputRef.current?.focus();
      scrollRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    };
    window.addEventListener('shell:focus', focus);
    return () => window.removeEventListener('shell:focus', focus);
  }, []);

  useEffect(() => {
    if (reduced) {
      setLines(BOOT);
      setReady(true);
      return;
    }

    let cancelled = false;
    const timers: number[] = [];
    let i = 0;

    const pushNext = () => {
      if (cancelled || i >= BOOT.length) {
        if (!cancelled) setReady(true);
        return;
      }
      const line = BOOT[i];
      i += 1;
      setLines((prev) => [...prev, line]);
      timers.push(window.setTimeout(pushNext, line.kind === 'sys' ? 400 : 220));
    };

    timers.push(window.setTimeout(pushNext, 300));
    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [reduced]);

  const runSearch = (query: string) => {
    if (!query.trim()) {
      append({ kind: 'err', text: 'usage: ask <query>' });
      return;
    }
    append({ kind: 'sys', text: `indexing local knowledge base… "${query}"` });
    const results = searchSiteIndex(siteIndex, query, 5);
    setLastResults(results);
    if (results.length === 0) {
      append({ kind: 'out', text: 'no matches — try papers, glioblastoma, 8knot, red hat' });
      return;
    }
    append({ kind: 'out', text: `→ ${results.length} match${results.length === 1 ? '' : 'es'}` });
    results.forEach((r, n) => {
      append({
        kind: 'out',
        text: `  ${n + 1}. [${typeLabel(r.type)}] ${r.title} — ${r.excerpt.slice(0, 72)}${r.excerpt.length > 72 ? '…' : ''}`,
      });
    });
    append({ kind: 'sys', text: 'run: go <n> to open a result' });
  };

  const openResult = (n: number) => {
    const entry = lastResults[n - 1];
    if (!entry) {
      append({ kind: 'err', text: `no result #${n} — run ask <query> first` });
      return;
    }
    append({ kind: 'sys', text: `opening ${entry.title}…` });
    window.location.href = entry.href;
  };

  const handleCommand = (raw: string) => {
    const line = raw.trim();
    if (!line) return;

    append({ kind: 'in', text: line });

    const quoted = line.match(/^(ask|search)\s+["'](.+)["']$/i);
    if (quoted) {
      runSearch(quoted[2]);
      return;
    }

    const parts = line.split(/\s+/);
    const cmd = parts[0].toLowerCase();
    const arg = parts.slice(1).join(' ');

    switch (cmd) {
      case 'help':
      case '?':
        HELP.split('\n').forEach((l) => append({ kind: 'out', text: l }));
        break;
      case 'ask':
      case 'search':
        runSearch(arg);
        break;
      case 'whoami':
        append({ kind: 'out', text: 'caio fonseca — software engineer @ Red Hat' });
        break;
      case 'stack':
        append({
          kind: 'out',
          text: 'python · ai engineering · simulation · systems design · postgres',
        });
        break;
      case 'projects': {
        const sw = siteIndex.filter((e) => e.type === 'project' && e.tags.includes('software'));
        append({ kind: 'out', text: `→ ${sw.length} software project${sw.length === 1 ? '' : 's'}` });
        sw.slice(0, 6).forEach((p, n) =>
          append({ kind: 'out', text: `  ${n + 1}. ${p.title}` }),
        );
        break;
      }
      case 'papers': {
        const pubs = siteIndex.filter((e) => e.type === 'publication');
        append({ kind: 'out', text: `→ ${pubs.length} publication${pubs.length === 1 ? '' : 's'}` });
        pubs.slice(0, 5).forEach((p, n) =>
          append({ kind: 'out', text: `  ${n + 1}. ${p.title.slice(0, 64)}${p.title.length > 64 ? '…' : ''}` }),
        );
        append({ kind: 'sys', text: 'see all: /academic' });
        break;
      }
      case 'go':
      case 'open':
        openResult(parseInt(arg, 10));
        break;
      case 'contact':
        append({ kind: 'out', text: SITE.email });
        break;
      case 'theme': {
        const dark = document.documentElement.classList.toggle('dark');
        localStorage.setItem('theme', dark ? 'dark' : 'light');
        append({ kind: 'sys', text: `theme → ${dark ? 'dark' : 'light'}` });
        break;
      }
      case 'clear':
        setLines([]);
        setLastResults([]);
        break;
      case 'palette':
      case 'cmdk':
        window.dispatchEvent(new Event('cmdk:open'));
        break;
      case 'cd':
        if (arg === 'projects' || arg === '/projects') window.location.href = withBase('/projects');
        else if (arg === 'academic') window.location.href = withBase('/academic');
        else if (arg === 'about') window.location.href = withBase('/about');
        else append({ kind: 'err', text: `cd: ${arg || '?'}: no such route` });
        break;
      default:
        if (line.includes(' ')) runSearch(line);
        else append({ kind: 'err', text: `unknown: ${cmd} — type 'help'` });
    }
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!ready || !input.trim()) return;
    handleCommand(input);
    setInput('');
  };

  return (
    <div className="cockpit-panel term overflow-hidden rounded-xl font-mono text-[13px] leading-relaxed">
      <div
        className="flex items-center gap-1.5 border-b px-4 py-2.5"
        style={{ borderColor: 'var(--term-border)' }}
      >
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: '#ff5f56' }} />
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: '#ffbd2e' }} />
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: '#27c93f' }} />
        <span className="ml-2 flex-1 text-[11px]" style={{ color: 'var(--term-muted)' }}>
          ~/caio — agent shell
        </span>
        <span
          className="mono rounded px-1.5 py-0.5 text-[10px]"
          style={{ color: 'var(--term-prompt)', background: 'rgba(93,202,165,0.12)' }}
        >
          {ready ? 'ready' : 'boot…'}
        </span>
      </div>

      <div
        ref={scrollRef}
        className="max-h-[min(340px,50vh)] min-h-[220px] overflow-y-auto px-4 py-3"
        aria-label="Agent shell output"
        aria-live="polite"
      >
        <div className="space-y-0.5">
          {lines.map((line, idx) => (
            <div key={idx}>
              {line.kind === 'in' && (
                <div>
                  <span style={{ color: 'var(--term-prompt)' }}>$</span> {line.text}
                </div>
              )}
              {line.kind === 'out' && (
                <div style={{ color: 'var(--term-muted)' }}>{line.text}</div>
              )}
              {line.kind === 'sys' && (
                <div style={{ color: 'var(--term-prompt)', opacity: 0.85 }}>{line.text}</div>
              )}
              {line.kind === 'err' && (
                <div style={{ color: '#f87171' }}>{line.text}</div>
              )}
            </div>
          ))}
        </div>
      </div>

      <form
        onSubmit={onSubmit}
        className="flex items-center gap-2 border-t px-4 py-2.5"
        style={{ borderColor: 'var(--term-border)' }}
      >
        <span style={{ color: 'var(--term-prompt)' }}>$</span>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={!ready}
          spellCheck={false}
          autoComplete="off"
          aria-label="Agent shell command input"
          placeholder={ready ? "try: ask glioblastoma" : 'booting…'}
          className="min-w-0 flex-1 bg-transparent outline-none placeholder:opacity-40"
          style={{ color: 'var(--term-fg)' }}
        />
        {!ready && <span className="cursor-blink">▋</span>}
      </form>
    </div>
  );
}
