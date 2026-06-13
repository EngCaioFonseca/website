import { useEffect, useRef, useState } from 'react';
import {
  nodeColor,
  nodeRadius,
  type GraphNode,
  type ResearchGraphData,
} from '../utils/researchGraph';
import { withBase } from '../utils/url';

type SimNode = GraphNode & {
  x: number;
  y: number;
  vx: number;
  vy: number;
};

function cssVar(name: string, fallback: string): string {
  if (typeof document === 'undefined') return fallback;
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
}

type Props = {
  data: ResearchGraphData;
  height?: number;
  compact?: boolean;
};

export default function ResearchGraph({ data, height = 420, compact = false }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState<GraphNode | null>(null);
  const [activeTopic, setActiveTopic] = useState<string | null>(null);
  const hoverRef = useRef<string | null>(null);
  const focusRef = useRef<string | null>(null);
  const drawRef = useRef<() => void>(() => {});

  const topics = data.nodes.filter((n) => n.type === 'topic');
  const papers = data.nodes.filter((n) => n.type === 'paper');
  const projects = data.nodes.filter((n) => n.type === 'project');

  // Keep the sticky focus (topic filter or selected node) in sync; redraw so
  // the change is reflected even when the animation loop is paused.
  useEffect(() => {
    focusRef.current = activeTopic ?? (selected ? selected.id : null);
    drawRef.current();
  }, [activeTopic, selected]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap || data.nodes.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      const w = wrap.clientWidth;
      canvas.width = w * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const nodes: SimNode[] = data.nodes.map((n, i) => {
      const angle = (i / data.nodes.length) * Math.PI * 2;
      const r = 80 + (i % 3) * 24;
      return {
        ...n,
        x: wrap.clientWidth / 2 + Math.cos(angle) * r,
        y: height / 2 + Math.sin(angle) * r,
        vx: 0,
        vy: 0,
      };
    });

    const nodeMap = new Map(nodes.map((n) => [n.id, n]));
    const links = data.links.filter((l) => nodeMap.has(l.source) && nodeMap.has(l.target));

    resize();

    const tick = () => {
      const cx = wrap.clientWidth / 2;
      const cy = height / 2;
      const repulsion = compact ? 420 : 520;
      const linkDist = compact ? 72 : 88;

      for (let i = 0; i < nodes.length; i += 1) {
        for (let j = i + 1; j < nodes.length; j += 1) {
          const a = nodes[i];
          const b = nodes[j];
          let dx = a.x - b.x;
          let dy = a.y - b.y;
          const dist = Math.hypot(dx, dy) || 0.01;
          const force = repulsion / (dist * dist);
          dx = (dx / dist) * force;
          dy = (dy / dist) * force;
          a.vx += dx;
          a.vy += dy;
          b.vx -= dx;
          b.vy -= dy;
        }
      }

      for (const link of links) {
        const a = nodeMap.get(link.source);
        const b = nodeMap.get(link.target);
        if (!a || !b) continue;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.hypot(dx, dy) || 0.01;
        const force = (dist - linkDist) * 0.045;
        a.vx += (dx / dist) * force;
        a.vy += (dy / dist) * force;
        b.vx -= (dx / dist) * force;
        b.vy -= (dy / dist) * force;
      }

      for (const n of nodes) {
        n.vx += (cx - n.x) * 0.012;
        n.vy += (cy - n.y) * 0.012;
        n.vx *= 0.86;
        n.vy *= 0.86;
        n.x += n.vx;
        n.y += n.vy;
        n.x = Math.max(24, Math.min(wrap.clientWidth - 24, n.x));
        n.y = Math.max(24, Math.min(height - 24, n.y));
      }
    };

    const draw = () => {
      const w = wrap.clientWidth;
      const accent = cssVar('--accent', '#0f9b73');
      const faint = cssVar('--faint', '#8a8980');
      const surface2 = cssVar('--surface-2', '#f4f3ef');
      const text = cssVar('--text', '#18181a');

      ctx.clearRect(0, 0, w, height);

      const active = hoverRef.current ?? focusRef.current;
      const connected = new Set<string>();
      if (active) {
        connected.add(active);
        for (const l of links) {
          if (l.source === active) connected.add(l.target);
          if (l.target === active) connected.add(l.source);
        }
      }

      for (const link of links) {
        const a = nodeMap.get(link.source);
        const b = nodeMap.get(link.target);
        if (!a || !b) continue;
        const lit = !active || (connected.has(link.source) && connected.has(link.target));
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = lit ? accent : faint;
        ctx.globalAlpha = lit ? 0.35 : 0.1;
        ctx.lineWidth = lit ? 1.2 : 0.6;
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      for (const n of nodes) {
        const lit = !active || connected.has(n.id);
        const r = nodeRadius(n.type, compact);
        ctx.beginPath();
        ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
        ctx.fillStyle = lit ? nodeColor(n.type, accent) : surface2;
        ctx.globalAlpha = lit ? 1 : 0.4;
        ctx.fill();
        ctx.globalAlpha = 1;
        const labelled = n.id === active || n.id === focusRef.current;
        if (labelled) {
          ctx.strokeStyle = accent;
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.font = '11px JetBrains Mono Variable, ui-monospace, monospace';
          ctx.fillStyle = text;
          ctx.fillText(n.label, Math.min(n.x + 10, w - 140), n.y - 10);
        }
      }
    };

    drawRef.current = draw;

    let raf = 0;
    let running = true;
    let visible = true;

    const loop = () => {
      if (!running) return;
      tick();
      draw();
      raf = requestAnimationFrame(loop);
    };

    const start = () => {
      if (reduced || raf) return;
      raf = requestAnimationFrame(loop);
    };
    const stop = () => {
      if (raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    };

    const hitTest = (mx: number, my: number): string | null => {
      for (const n of nodes) {
        const r = nodeRadius(n.type, compact) + 4;
        if (Math.hypot(mx - n.x, my - n.y) <= r) return n.id;
      }
      return null;
    };

    const onMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      hoverRef.current = hitTest(e.clientX - rect.left, e.clientY - rect.top);
      canvas.style.cursor = hoverRef.current ? 'pointer' : 'default';
      if (reduced) draw();
    };

    const onClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const id = hitTest(e.clientX - rect.left, e.clientY - rect.top);
      setSelected(id ? nodes.find((n) => n.id === id) ?? null : null);
    };

    const onLeave = () => {
      hoverRef.current = null;
      if (reduced) draw();
    };

    const ro = new ResizeObserver(() => {
      resize();
      draw();
    });
    ro.observe(wrap);
    canvas.addEventListener('mousemove', onMove);
    canvas.addEventListener('mouseleave', onLeave);
    canvas.addEventListener('click', onClick);

    const io = new IntersectionObserver(
      (ents) => {
        visible = ents[0].isIntersecting;
        if (visible) start();
        else stop();
      },
      { threshold: 0 },
    );
    io.observe(wrap);

    const onVis = () => {
      if (document.hidden) stop();
      else if (visible) start();
    };
    document.addEventListener('visibilitychange', onVis);

    // Always settle + paint an initial frame so the graph is present even before
    // the loop spins up (and regardless of IntersectionObserver timing).
    for (let i = 0; i < (reduced ? 220 : 90); i += 1) tick();
    draw();
    if (!reduced) start();

    return () => {
      running = false;
      stop();
      ro.disconnect();
      io.disconnect();
      document.removeEventListener('visibilitychange', onVis);
      canvas.removeEventListener('mousemove', onMove);
      canvas.removeEventListener('mouseleave', onLeave);
      canvas.removeEventListener('click', onClick);
    };
  }, [data, height, compact]);

  if (data.nodes.length === 0) return null;

  const chip = (on: boolean) =>
    `mono rounded-full border px-2.5 py-1 text-[11px] transition-colors ${
      on ? 'border-accent text-accent' : 'border-border text-muted hover:border-border-strong'
    }`;

  return (
    <div>
      {topics.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2" role="group" aria-label="Filter research map by topic">
          <button type="button" onClick={() => setActiveTopic(null)} className={chip(activeTopic === null)}>
            all
          </button>
          {topics.map((t) => (
            <button
              key={t.id}
              type="button"
              aria-pressed={activeTopic === t.id}
              onClick={() => setActiveTopic((cur) => (cur === t.id ? null : t.id))}
              className={chip(activeTopic === t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      <div ref={wrapRef} className="research-graph-wrap cockpit-panel overflow-hidden rounded-xl">
        <div
          className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-2.5"
          style={{ borderColor: 'var(--border)' }}
        >
          <span className="mono text-[11px] text-faint">research map · force layout</span>
          <div className="flex flex-wrap gap-3">
            <span className="mono flex items-center gap-1.5 text-[10px] text-faint">
              <span className="inline-block h-2 w-2 rounded-full bg-accent" /> paper
            </span>
            <span className="mono flex items-center gap-1.5 text-[10px] text-faint">
              <span className="inline-block h-2 w-2 rounded-full" style={{ background: '#6366f1' }} /> project
            </span>
            <span className="mono flex items-center gap-1.5 text-[10px] text-faint">
              <span className="inline-block h-2 w-2 rounded-full bg-faint" /> topic
            </span>
          </div>
        </div>
        <canvas
          ref={canvasRef}
          role="img"
          aria-label="Interactive research knowledge graph linking publications, projects and topics. A keyboard-accessible list of the same items follows below."
          className="block w-full"
        />
        {selected && (
          <div
            className="flex items-center justify-between gap-3 border-t px-4 py-2.5"
            style={{ borderColor: 'var(--border)' }}
          >
            <span className="text-sm">
              <span className="mono mr-2 text-[11px] text-faint">{selected.type}</span>
              <span className="font-medium text-text">{selected.label}</span>
            </span>
            {selected.href && (
              <a
                href={selected.href}
                target="_blank"
                rel="noopener noreferrer"
                className="mono shrink-0 text-[12px] text-accent link-underline"
              >
                open ↗
              </a>
            )}
          </div>
        )}
      </div>

      <details className="mt-3 rounded-xl border border-border bg-surface px-4 py-2 text-sm">
        <summary className="mono cursor-pointer py-1 text-[12px] text-muted">
          List view ({papers.length} papers · {projects.length} projects · {topics.length} topics)
        </summary>
        <div className="space-y-4 py-3">
          {papers.length > 0 && (
            <div>
              <p className="mono mb-1 text-[11px] text-faint">Publications</p>
              <ul className="space-y-1">
                {papers.map((n) => (
                  <li key={n.id}>
                    <a
                      href={n.href ?? withBase('/academic')}
                      target={n.href ? '_blank' : undefined}
                      rel="noopener noreferrer"
                      className="text-muted transition-colors hover:text-accent"
                    >
                      {n.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {projects.length > 0 && (
            <div>
              <p className="mono mb-1 text-[11px] text-faint">Projects</p>
              <ul className="space-y-1">
                {projects.map((n) => (
                  <li key={n.id}>
                    <a
                      href={n.href ?? withBase('/projects')}
                      target={n.href ? '_blank' : undefined}
                      rel="noopener noreferrer"
                      className="text-muted transition-colors hover:text-accent"
                    >
                      {n.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {topics.length > 0 && (
            <div>
              <p className="mono mb-1 text-[11px] text-faint">Topics</p>
              <div className="flex flex-wrap gap-2">
                {topics.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setActiveTopic((cur) => (cur === t.id ? null : t.id))}
                    className={chip(activeTopic === t.id)}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </details>
    </div>
  );
}
