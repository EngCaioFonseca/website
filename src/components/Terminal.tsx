import { useEffect, useState } from 'react';

type Entry =
  | { kind: 'cmd'; text: string }
  | { kind: 'out'; text: string };

const SCRIPT: Entry[] = [
  { kind: 'cmd', text: 'whoami' },
  { kind: 'out', text: 'caio fonseca — software engineer' },
  { kind: 'cmd', text: 'background --short' },
  { kind: 'out', text: 'phd · Computational Science and Applied maths' },
  { kind: 'out', text: 'ex: UCLA · RIT · IINELS Brain Institute' },
  { kind: 'cmd', text: 'stack' },
  { kind: 'out', text: 'python · ai engineering · simulation · systems design · postgres' },
];

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

function Row({ entry, prompt }: { entry: Entry; prompt: string }) {
  if (entry.kind === 'cmd') {
    return (
      <div>
        <span style={{ color: 'var(--term-prompt)' }}>{prompt}</span> <span>{entry.text}</span>
      </div>
    );
  }
  return <div style={{ color: 'var(--term-muted)' }}>{entry.text}</div>;
}

export default function Terminal({ prompt = '$' }: { prompt?: string }) {
  const reduced = usePrefersReducedMotion();
  const [visible, setVisible] = useState<Entry[]>([]);
  const [typing, setTyping] = useState<{ text: string; len: number } | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (reduced) {
      setVisible(SCRIPT);
      setTyping(null);
      setDone(true);
      return;
    }
    setVisible([]);
    setDone(false);
    let cancelled = false;
    const timers: number[] = [];
    let i = 0;

    function next() {
      if (cancelled) return;
      if (i >= SCRIPT.length) {
        setTyping(null);
        setDone(true);
        return;
      }
      const entry = SCRIPT[i];
      if (entry.kind === 'out') {
        setVisible((v) => [...v, entry]);
        i += 1;
        timers.push(window.setTimeout(next, 240));
        return;
      }
      let c = 0;
      setTyping({ text: entry.text, len: 0 });
      const typeChar = () => {
        if (cancelled) return;
        c += 1;
        setTyping({ text: entry.text, len: c });
        if (c < entry.text.length) {
          timers.push(window.setTimeout(typeChar, 55));
        } else {
          setVisible((v) => [...v, entry]);
          setTyping(null);
          i += 1;
          timers.push(window.setTimeout(next, 320));
        }
      };
      timers.push(window.setTimeout(typeChar, 200));
    }

    timers.push(window.setTimeout(next, 350));
    return () => {
      cancelled = true;
      timers.forEach((t) => clearTimeout(t));
    };
  }, [reduced]);

  return (
    <div
      className="term rounded-xl p-4 font-mono text-[13px] leading-relaxed"
      aria-label="Terminal introduction"
    >
      <div
        className="mb-3 flex items-center gap-1.5 border-b pb-2"
        style={{ borderColor: 'var(--term-border)' }}
      >
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: '#ff5f56' }} />
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: '#ffbd2e' }} />
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: '#27c93f' }} />
        <span className="ml-2 text-[11px]" style={{ color: 'var(--term-muted)' }}>
          ~/caio — zsh
        </span>
      </div>
      <div className="space-y-0.5">
        {visible.map((e, idx) => (
          <Row key={idx} entry={e} prompt={prompt} />
        ))}
        {typing && (
          <div>
            <span style={{ color: 'var(--term-prompt)' }}>{prompt}</span>{' '}
            <span>{typing.text.slice(0, typing.len)}</span>
            <span className="cursor-blink">▋</span>
          </div>
        )}
        {done && (
          <div>
            <span style={{ color: 'var(--term-prompt)' }}>{prompt}</span>{' '}
            <span className="cursor-blink">▋</span>
          </div>
        )}
      </div>
    </div>
  );
}
