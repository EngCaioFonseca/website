import { useEffect, useRef } from 'react';

// A point cloud that breathes between an organic sphere (biology) and a
// computational lattice (systems/AI), wired with nearest-neighbour links.
// Lazy-loads three.js, respects reduced motion, and pauses when offscreen.

function fib(i: number, n: number, r: number): [number, number, number] {
  const phi = Math.acos(1 - (2 * (i + 0.5)) / n);
  const theta = Math.PI * (1 + Math.sqrt(5)) * i;
  return [
    Math.cos(theta) * Math.sin(phi) * r,
    Math.cos(phi) * r,
    Math.sin(theta) * Math.sin(phi) * r,
  ];
}

export default function BioNetCanvas() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    let disposed = false;
    let cleanup = () => {};

    (async () => {
      const THREE = await import('three');
      if (disposed || !mount) return;

      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const accentVar =
        getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#2bbd92';
      const color = new THREE.Color(accentVar);

      const N = 150;
      const R = 120;
      const organic = new Float32Array(N * 3);
      const lattice = new Float32Array(N * 3);

      for (let i = 0; i < N; i += 1) {
        const [x, y, z] = fib(i, N, R * (0.82 + Math.random() * 0.22));
        organic[i * 3] = x;
        organic[i * 3 + 1] = y;
        organic[i * 3 + 2] = z;
      }

      const side = Math.ceil(Math.cbrt(N));
      const gap = (R * 1.8) / (side - 1);
      let idx = 0;
      for (let xi = 0; xi < side && idx < N; xi += 1) {
        for (let yi = 0; yi < side && idx < N; yi += 1) {
          for (let zi = 0; zi < side && idx < N; zi += 1) {
            lattice[idx * 3] = -R * 0.9 + xi * gap + (Math.random() - 0.5) * 6;
            lattice[idx * 3 + 1] = -R * 0.9 + yi * gap + (Math.random() - 0.5) * 6;
            lattice[idx * 3 + 2] = -R * 0.9 + zi * gap + (Math.random() - 0.5) * 6;
            idx += 1;
          }
        }
      }

      // Nearest-neighbour links (computed in lattice space), deduped.
      const seen = new Set<string>();
      const uniq: [number, number][] = [];
      for (let i = 0; i < N; i += 1) {
        const dists: { j: number; d: number }[] = [];
        for (let j = 0; j < N; j += 1) {
          if (i === j) continue;
          const dx = lattice[i * 3] - lattice[j * 3];
          const dy = lattice[i * 3 + 1] - lattice[j * 3 + 1];
          const dz = lattice[i * 3 + 2] - lattice[j * 3 + 2];
          dists.push({ j, d: dx * dx + dy * dy + dz * dz });
        }
        dists.sort((a, b) => a.d - b.d);
        for (let k = 0; k < 2; k += 1) {
          const j = dists[k].j;
          const a = Math.min(i, j);
          const b = Math.max(i, j);
          const key = `${a}-${b}`;
          if (!seen.has(key)) {
            seen.add(key);
            uniq.push([a, b]);
          }
        }
      }

      const positions = new Float32Array(N * 3);
      positions.set(organic);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(60, 1, 1, 2000);
      camera.position.z = 330;

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setClearColor(0x000000, 0);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      mount.appendChild(renderer.domElement);

      const tc = document.createElement('canvas');
      tc.width = 64;
      tc.height = 64;
      const g = tc.getContext('2d');
      if (g) {
        const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
        grd.addColorStop(0, 'rgba(255,255,255,1)');
        grd.addColorStop(0.45, 'rgba(255,255,255,0.7)');
        grd.addColorStop(1, 'rgba(255,255,255,0)');
        g.fillStyle = grd;
        g.fillRect(0, 0, 64, 64);
      }
      const dot = new THREE.CanvasTexture(tc);

      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const pMat = new THREE.PointsMaterial({
        size: 7,
        map: dot,
        color,
        transparent: true,
        opacity: 0.92,
        depthWrite: false,
        sizeAttenuation: true,
      });
      const points = new THREE.Points(geo, pMat);

      const linePos = new Float32Array(uniq.length * 6);
      const lgeo = new THREE.BufferGeometry();
      lgeo.setAttribute('position', new THREE.BufferAttribute(linePos, 3));
      const lMat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.16 });
      const lines = new THREE.LineSegments(lgeo, lMat);

      const group = new THREE.Group();
      group.add(lines);
      group.add(points);
      scene.add(group);

      const sizeTo = () => {
        const w = mount.clientWidth;
        const h = mount.clientHeight || 1;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      };
      sizeTo();
      const ro = new ResizeObserver(sizeTo);
      ro.observe(mount);

      let mx = 0;
      let my = 0;
      const onMove = (e: MouseEvent) => {
        mx = e.clientX / window.innerWidth - 0.5;
        my = e.clientY / window.innerHeight - 0.5;
      };
      window.addEventListener('mousemove', onMove, { passive: true });

      const pos = geo.attributes.position.array as Float32Array;
      const lp = lgeo.attributes.position.array as Float32Array;
      const ease = (t: number) => t * t * (3 - 2 * t);

      const renderFrame = (m: number) => {
        const em = ease(m);
        for (let i = 0; i < N * 3; i += 1) {
          pos[i] = organic[i] + (lattice[i] - organic[i]) * em;
        }
        for (let k = 0; k < uniq.length; k += 1) {
          const [a, b] = uniq[k];
          lp[k * 6] = pos[a * 3];
          lp[k * 6 + 1] = pos[a * 3 + 1];
          lp[k * 6 + 2] = pos[a * 3 + 2];
          lp[k * 6 + 3] = pos[b * 3];
          lp[k * 6 + 4] = pos[b * 3 + 1];
          lp[k * 6 + 5] = pos[b * 3 + 2];
        }
        geo.attributes.position.needsUpdate = true;
        lgeo.attributes.position.needsUpdate = true;
        renderer.render(scene, camera);
      };

      let raf = 0;
      let running = true;
      let visible = true;
      const t0 = performance.now();

      const loop = () => {
        if (!running) return;
        const now = performance.now();
        const m = Math.sin((now - t0) * 0.00012) * 0.5 + 0.5;
        group.rotation.y += 0.0011;
        group.rotation.x += (my * 0.5 - group.rotation.x) * 0.03;
        group.rotation.z = mx * 0.25;
        renderFrame(m);
        raf = requestAnimationFrame(loop);
      };

      const dispose = () => {
        running = false;
        if (raf) cancelAnimationFrame(raf);
        ro.disconnect();
        window.removeEventListener('mousemove', onMove);
        geo.dispose();
        lgeo.dispose();
        pMat.dispose();
        lMat.dispose();
        dot.dispose();
        renderer.dispose();
        renderer.domElement.remove();
      };

      if (reduced) {
        renderFrame(0.4);
        cleanup = dispose;
        return;
      }

      const io = new IntersectionObserver(
        (ents) => {
          visible = ents[0].isIntersecting;
          if (visible && !raf) raf = requestAnimationFrame(loop);
          else if (!visible && raf) {
            cancelAnimationFrame(raf);
            raf = 0;
          }
        },
        { threshold: 0 },
      );
      io.observe(mount);

      const onVis = () => {
        if (document.hidden && raf) {
          cancelAnimationFrame(raf);
          raf = 0;
        } else if (!document.hidden && visible && !raf) {
          raf = requestAnimationFrame(loop);
        }
      };
      document.addEventListener('visibilitychange', onVis);

      raf = requestAnimationFrame(loop);

      cleanup = () => {
        io.disconnect();
        document.removeEventListener('visibilitychange', onVis);
        dispose();
      };
    })();

    return () => {
      disposed = true;
      cleanup();
    };
  }, []);

  return (
    <div ref={mountRef} className="hero-bionet pointer-events-none absolute inset-0 z-0" aria-hidden="true" />
  );
}
