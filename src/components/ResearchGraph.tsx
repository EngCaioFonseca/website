import { useEffect, useRef, useState } from 'react';
import {
  nodeColor,
  nodeRadius,
  type GraphNode,
  type ResearchGraphData,
} from '../utils/researchGraph';

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
  const activeRef = useRef<string | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap || data.nodes.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let raf = 0;
    let running = true;
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
    const links = data.links.filter(
      (l) => nodeMap.has(l.source) && nodeMap.has(l.target),
    );

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

      const active = activeRef.current;
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
        ctx.globalAlpha = lit ? 0.35 : 0.15;
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
        ctx.globalAlpha = lit ? 1 : 0.45;
        ctx.fill();
        ctx.globalAlpha = 1;
        if (n.id === active) {
          ctx.strokeStyle = accent;
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.font = '11px JetBrains Mono Variable, ui-monospace, monospace';
          ctx.fillStyle = text;
          ctx.fillText(n.label, Math.min(n.x + 10, w - 140), n.y - 10);
        }
      }
    };

    const loop = () => {
      if (!running) return;
      if (!reduced) tick();
      draw();
      raf = requestAnimationFrame(loop);
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
      activeRef.current = hitTest(e.clientX - rect.left, e.clientY - rect.top);
      canvas.style.cursor = activeRef.current ? 'pointer' : 'default';
    };

    const onClick = () => {
      const id = activeRef.current;
      if (!id) {
        setSelected(null);
        return;
      }
      const n = nodes.find((x) => x.id === id);
      if (!n) return;
      setSelected(n);
      if (n.href) window.open(n.href, '_blank', 'noopener');
    };

    const ro = new ResizeObserver(resize);
    ro.observe(wrap);
    canvas.addEventListener('mousemove', onMove);
    canvas.addEventListener('mouseleave', () => {
      activeRef.current = null;
    });
    canvas.addEventListener('click', onClick);
    loop();

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      canvas.removeEventListener('mousemove', onMove);
      canvas.removeEventListener('click', onClick);
    };
  }, [data, height, compact]);

  if (data.nodes.length === 0) return null;

  return (
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
            <span className="inline-block h-2 w-2 rounded-full bg-indigo-500" /> project
          </span>
          <span className="mono flex items-center gap-1.5 text-[10px] text-faint">
            <span className="inline-block h-2 w-2 rounded-full bg-faint" /> topic
          </span>
        </div>
      </div>
      <canvas
        ref={canvasRef}
        role="img"
        aria-label="Interactive research knowledge graph linking publications, projects and topics"
        className="block w-full"
      />
      {selected && (
        <p className="border-t px-4 py-2 text-sm text-muted" style={{ borderColor: 'var(--border)' }}>
          <span className="font-medium text-text">{selected.label}</span>
          {selected.href && <span className="mono ml-2 text-[11px] text-accent">↗ open</span>}
        </p>
      )}
    </div>
  );
}
