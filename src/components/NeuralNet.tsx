import { useEffect, useRef } from 'react';
import { prefersReducedMotion } from '../hooks';

const LAYERS = [4, 7, 8, 7, 3];

type Node = { x: number; y: number; layer: number; phase: number };
type Edge = { a: Node; b: Node; t: number; speed: number };

/** A quiet, always-moving neural network: signals travel layer to layer along faint connections. */
export default function NeuralNet() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    let w = 0, h = 0, raf = 0, last = 0, visible = true;
    let nodes: Node[][] = [];
    let edges: Edge[] = [];
    const still = prefersReducedMotion();

    const build = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const r = canvas.getBoundingClientRect();
      w = r.width; h = r.height;
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      nodes = LAYERS.map((count, layer) =>
        Array.from({ length: count }, (_, i) => ({
          x: w * 0.04 + (layer / (LAYERS.length - 1)) * w * 0.92,
          y: ((i + 1) / (count + 1)) * h,
          layer,
          phase: Math.random() * Math.PI * 2,
        })));
      edges = [];
      for (let l = 0; l < nodes.length - 1; l++)
        for (const a of nodes[l]) for (const b of nodes[l + 1])
          edges.push({ a, b, t: -Math.random() * 4, speed: 0.22 + Math.random() * 0.3 });
    };

    const color = (layer: number, alpha: number) => {
      const k = layer / (LAYERS.length - 1);
      const r = Math.round(103 + (167 - 103) * k), g = Math.round(232 + (139 - 232) * k), b = Math.round(249 + (250 - 249) * k);
      return `rgba(${r},${g},${b},${alpha})`;
    };

    const draw = (time: number) => {
      ctx.clearRect(0, 0, w, h);
      ctx.lineWidth = 1;
      for (const e of edges) {
        ctx.strokeStyle = color(e.a.layer, 0.09);
        ctx.beginPath(); ctx.moveTo(e.a.x, e.a.y); ctx.lineTo(e.b.x, e.b.y); ctx.stroke();
        if (e.t >= 0 && e.t <= 1) {
          const x = e.a.x + (e.b.x - e.a.x) * e.t, y = e.a.y + (e.b.y - e.a.y) * e.t;
          const g = ctx.createRadialGradient(x, y, 0, x, y, 10);
          g.addColorStop(0, color(e.a.layer, 0.95)); g.addColorStop(1, color(e.a.layer, 0));
          ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 10, 0, Math.PI * 2); ctx.fill();
        }
      }
      for (const layer of nodes) for (const n of layer) {
        const pulse = 0.5 + 0.5 * Math.sin(time / 900 + n.phase);
        ctx.fillStyle = color(n.layer, 0.14 + 0.1 * pulse);
        ctx.beginPath(); ctx.arc(n.x, n.y, 9 + pulse * 3, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = color(n.layer, 0.9);
        ctx.beginPath(); ctx.arc(n.x, n.y, 3.2, 0, Math.PI * 2); ctx.fill();
      }
    };

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      if (!visible || document.hidden) { last = now; return; }
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      for (const e of edges) { e.t += e.speed * dt; if (e.t > 1) e.t = -Math.random() * 4; }
      draw(now);
    };

    build();
    if (still) draw(0); else raf = requestAnimationFrame(frame);

    const ro = new ResizeObserver(() => { build(); if (still) draw(0); });
    ro.observe(canvas);
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; });
    io.observe(canvas);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); };
  }, []);

  return <canvas ref={ref} className="neural" aria-hidden="true" />;
}
