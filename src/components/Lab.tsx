import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { pipeline } from '../data';
import { prefersReducedMotion, useInView } from '../hooks';
import { delay } from './ui';

/* ---------- seeded synthetic data ---------- */

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function gauss(r: () => number) {
  let u = 0, v = 0;
  while (!u) u = r();
  while (!v) v = r();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

/* ---------- 1. alert threshold tuning ---------- */

const W = 560, H = 230, BINS = 36;
const clip = (x: number) => Math.min(0.999, Math.max(0.001, x));
const SCORES = (() => {
  const r = rng(42);
  return {
    benign: Array.from({ length: 2400 }, () => clip(0.3 + 0.15 * gauss(r))),
    flagged: Array.from({ length: 140 }, () => clip(0.68 + 0.16 * gauss(r))),
  };
})();

function density(values: number[]) {
  const bins: number[] = new Array(BINS).fill(0);
  values.forEach((v) => { bins[Math.min(BINS - 1, Math.floor(v * BINS))]++; });
  const smooth = bins.map((b, i) => (bins[i - 1] ?? b) * 0.25 + b * 0.5 + (bins[i + 1] ?? b) * 0.25);
  const max = Math.max(...smooth);
  return smooth.map((v) => v / max);
}
function curve(d: number[], close: boolean) {
  const pts = d.map((v, i) => [(i / (BINS - 1)) * W, H - 14 - v * (H - 48)] as const);
  let p = close ? `M0 ${H} L${pts[0][0]} ${pts[0][1]}` : `M${pts[0][0]} ${pts[0][1]}`;
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1], [x1, y1] = pts[i], mx = (x0 + x1) / 2;
    p += ` C${mx} ${y0} ${mx} ${y1} ${x1} ${y1}`;
  }
  return close ? `${p} L${W} ${H} Z` : p;
}
const BENIGN = density(SCORES.benign), FLAGGED = density(SCORES.flagged);
const PATHS = {
  benignArea: curve(BENIGN, true), benignLine: curve(BENIGN, false),
  flaggedArea: curve(FLAGGED, true), flaggedLine: curve(FLAGGED, false),
};

function evaluate(t: number) {
  const fp = SCORES.benign.filter((s) => s >= t).length;
  const tp = SCORES.flagged.filter((s) => s >= t).length;
  const alerts = fp + tp, total = SCORES.benign.length + SCORES.flagged.length;
  return { alerts, cut: 1 - alerts / total, recall: tp / SCORES.flagged.length, precision: alerts ? tp / alerts : 0 };
}

function ThresholdLab() {
  const [ref, inView] = useInView<HTMLDivElement>({ threshold: 0.45 });
  const [t, setT] = useState(0.12);
  const touched = useRef(false);

  useEffect(() => {
    if (!inView) return;
    if (prefersReducedMotion()) { setT(0.5); return; }
    let raf = 0;
    const start = performance.now(), from = 0.12, to = 0.52, ms = 2800;
    const tick = (now: number) => {
      if (touched.current) return;
      const p = Math.min(1, (now - start) / ms);
      const e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
      setT(from + (to - from) * e);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView]);

  const m = useMemo(() => evaluate(t), [t]);
  const tx = t * W;
  const pct = ((t - 0.05) / 0.9) * 100;

  return (
    <div ref={ref} className="glass card lab-card reveal">
      <div className="card-head">
        <h3>Alert threshold tuning</h3>
        <span className="badge mono">synthetic data</span>
      </div>
      <p className="dim small">Raise the cut-off and alert volume falls. The skill is doing it without losing the cases that matter.</p>

      <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Score distributions for benign and suspicious activity with a threshold at ${t.toFixed(2)}`}>
        <defs>
          <linearGradient id="gBenign" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#67e8f9" stopOpacity=".55" /><stop offset="1" stopColor="#67e8f9" stopOpacity="0" /></linearGradient>
          <linearGradient id="gFlag" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fbbf24" stopOpacity=".7" /><stop offset="1" stopColor="#fbbf24" stopOpacity="0" /></linearGradient>
          <clipPath id="alerting"><rect x={tx} y="0" width={Math.max(0, W - tx)} height={H} /></clipPath>
        </defs>
        {[0.25, 0.5, 0.75].map((g) => <line key={g} x1={g * W} x2={g * W} y1="0" y2={H} className="gridline" />)}
        <g opacity=".35">
          <path d={PATHS.benignArea} fill="url(#gBenign)" /><path d={PATHS.benignLine} className="ln c1" />
          <path d={PATHS.flaggedArea} fill="url(#gFlag)" /><path d={PATHS.flaggedLine} className="ln c2" />
        </g>
        <g clipPath="url(#alerting)">
          <rect x={tx} y="0" width={Math.max(0, W - tx)} height={H} fill="rgba(255,255,255,.04)" />
          <path d={PATHS.benignArea} fill="url(#gBenign)" /><path d={PATHS.benignLine} className="ln c1" />
          <path d={PATHS.flaggedArea} fill="url(#gFlag)" /><path d={PATHS.flaggedLine} className="ln c2" />
        </g>
        <line x1={tx} x2={tx} y1="0" y2={H} className="thr" />
        <circle cx={tx} cy="16" r="6" className="thr-dot" />
        <text x={Math.min(W - 6, tx + 10)} y="20" className="chart-label" textAnchor={tx > W - 120 ? 'end' : 'start'} transform={tx > W - 120 ? `translate(${-20},0)` : undefined}>alerts raised →</text>
      </svg>

      <div className="legend small">
        <span><i className="sw c1" /> Benign activity</span>
        <span><i className="sw c2" /> Suspicious activity</span>
      </div>

      <label htmlFor="thr" className="slider-label">Score threshold <b className="mono">{t.toFixed(2)}</b></label>
      <input
        id="thr" type="range" min={0.05} max={0.95} step={0.01} value={t}
        style={{ '--pct': `${pct}%` } as CSSProperties}
        onChange={(e) => { touched.current = true; setT(Number(e.target.value)); }}
      />

      <div className="tiles">
        <div className="tile"><span>Alerts raised</span><b className="mono">{m.alerts.toLocaleString()}</b></div>
        <div className="tile"><span>Volume cut</span><b className="mono">{Math.round(m.cut * 100)}%</b></div>
        <div className="tile"><span>Recall</span><b className="mono hot">{Math.round(m.recall * 100)}%</b></div>
        <div className="tile"><span>Precision</span><b className="mono">{Math.round(m.precision * 100)}%</b></div>
      </div>
    </div>
  );
}

/* ---------- 2. hedge-ratio regression ---------- */

const FW = 520, FH = 340, PAD = 38;

function makeFit(seed: number) {
  const r = rng(seed * 7919 + 13);
  const beta = 0.65 + r() * 0.8, alpha = 6 + r() * 18, sigma = 4.5 + r() * 3, n = 34;
  const pts = Array.from({ length: n }, (_, i) => {
    const x = 42 + (i / (n - 1)) * 58 + gauss(r) * 2.5;
    return { x, y: alpha + beta * x + gauss(r) * sigma };
  });
  const mx = pts.reduce((s, p) => s + p.x, 0) / n, my = pts.reduce((s, p) => s + p.y, 0) / n;
  const sxx = pts.reduce((s, p) => s + (p.x - mx) ** 2, 0);
  const b = pts.reduce((s, p) => s + (p.x - mx) * (p.y - my), 0) / sxx, a = my - b * mx;
  const res = pts.map((p) => p.y - (a + b * p.x));
  const sse = res.reduce((s, e) => s + e * e, 0), sst = pts.reduce((s, p) => s + (p.y - my) ** 2, 0);
  const sd = Math.sqrt(sse / (n - 2));
  const z = res.map((e) => e / sd);
  let worst = 0;
  z.forEach((v, i) => { if (Math.abs(v) > Math.abs(z[worst])) worst = i; });
  const xmin = Math.min(...pts.map((p) => p.x)) - 2, xmax = Math.max(...pts.map((p) => p.x)) + 2;
  const ys = [...pts.map((p) => p.y), a + b * xmin - 2 * sd, a + b * xmax + 2 * sd];
  return { pts, a, b, r2: 1 - sse / sst, sd, z, worst, xmin, xmax, ymin: Math.min(...ys) - 2, ymax: Math.max(...ys) + 2 };
}

function FitLab() {
  const [ref, inView] = useInView<HTMLDivElement>({ threshold: 0.4 });
  const [seed, setSeed] = useState(3);
  const f = useMemo(() => makeFit(seed), [seed]);
  const sx = (x: number) => PAD + ((x - f.xmin) / (f.xmax - f.xmin)) * (FW - PAD * 2);
  const sy = (y: number) => FH - PAD - ((y - f.ymin) / (f.ymax - f.ymin)) * (FH - PAD * 2);
  const line = (k: number) => [sx(f.xmin), sy(f.a + f.b * f.xmin + k * f.sd), sx(f.xmax), sy(f.a + f.b * f.xmax + k * f.sd)] as const;
  const [x1, y1, x2, y2] = line(0);
  const len = Math.hypot(x2 - x1, y2 - y1);
  const band = `${line(2)[0]},${line(2)[1]} ${line(2)[2]},${line(2)[3]} ${line(-2)[2]},${line(-2)[3]} ${line(-2)[0]},${line(-2)[1]}`;
  const wz = f.z[f.worst];

  return (
    <div ref={ref} className="glass card lab-card reveal" style={delay(120)}>
      <div className="card-head">
        <h3>Hedge ratio by regression</h3>
        <span className="badge mono">synthetic data</span>
      </div>
      <p className="dim small">Fit one asset against another, then watch for the point that strays outside the band.</p>

      <svg key={seed} className={`chart fit${inView ? ' play' : ''}`} viewBox={`0 0 ${FW} ${FH}`} role="img" aria-label={`Scatter plot with fitted line, hedge ratio ${f.b.toFixed(2)}, R squared ${f.r2.toFixed(2)}`}>
        {[0.2, 0.4, 0.6, 0.8].map((g) => (
          <g key={g}>
            <line x1={PAD} x2={FW - PAD} y1={PAD + g * (FH - PAD * 2)} y2={PAD + g * (FH - PAD * 2)} className="gridline" />
            <line y1={PAD} y2={FH - PAD} x1={PAD + g * (FW - PAD * 2)} x2={PAD + g * (FW - PAD * 2)} className="gridline" />
          </g>
        ))}
        <polygon points={band} className="band" />
        {f.pts.map((p, i) => <line key={`r${i}`} x1={sx(p.x)} x2={sx(p.x)} y1={sy(p.y)} y2={sy(f.a + f.b * p.x)} className="resid" />)}
        <line x1={x1} y1={y1} x2={x2} y2={y2} className="fitline" style={{ '--len': len } as CSSProperties} />
        {f.pts.map((p, i) => (
          <circle key={i} cx={sx(p.x)} cy={sy(p.y)} r={i === f.worst ? 6 : 4} className={`pt${i === f.worst ? ' worst' : ''}`} style={{ animationDelay: `${i * 28}ms` }} />
        ))}
        <text x={FW / 2} y={FH - 8} className="chart-label" textAnchor="middle">Asset A price</text>
        <text x="12" y={FH / 2} className="chart-label" textAnchor="middle" transform={`rotate(-90 12 ${FH / 2})`}>Asset B price</text>
      </svg>

      <div className="tiles three">
        <div className="tile"><span>Hedge ratio (β)</span><b className="mono">{f.b.toFixed(2)}</b></div>
        <div className="tile"><span>R²</span><b className="mono">{f.r2.toFixed(2)}</b></div>
        <div className="tile"><span>Widest spread (z)</span><b className={`mono${Math.abs(wz) >= 2 ? ' hot' : ''}`}>{wz > 0 ? '+' : ''}{wz.toFixed(2)}</b></div>
      </div>
      <button type="button" className="btn btn-glass btn-sm" onClick={() => setSeed((s) => s + 1)}>
        <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M20 12a8 8 0 1 1-2.34-5.66M20 4v5h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        Resample data
      </button>
    </div>
  );
}

/* ---------- 3. Python snippet that types itself ---------- */

const CODE = `# Walk-forward validation: train only on the past
for fold, (train_end, test_end) in enumerate(folds):
    train = df[df["date"] <= train_end - embargo]
    test = df[(df["date"] > train_end) & (df["date"] <= test_end)]

    with mlflow.start_run(nested=True):
        model.fit(train[features], train["label"])
        mlflow.log_metric("fold_score", score(model, test))`;

const RULES: [RegExp, string][] = [
  [/#.*/y, 'c'],
  [/"[^"]*"|'[^']*'/y, 's'],
  [/\b(?:for|in|with|as|import|from|def|return|if|else|True|False)\b/y, 'k'],
  [/\b\d+(?:\.\d+)?\b/y, 'n'],
  [/[A-Za-z_]\w*(?=\()/y, 'f'],
  [/[A-Za-z_]\w*/y, 'v'],
  [/\s+/y, 'w'],
  [/./y, 'p'],
];
const TOKENS = (() => {
  const out: { text: string; cls: string }[] = [];
  let pos = 0;
  while (pos < CODE.length) {
    for (const [re, cls] of RULES) {
      re.lastIndex = pos;
      const m = re.exec(CODE);
      if (m) { out.push({ text: m[0], cls }); pos += m[0].length; break; }
    }
  }
  return out;
})();
const LINES = CODE.split('\n').length;

function CodeCard() {
  const [ref, inView] = useInView<HTMLDivElement>({ threshold: 0.4 });
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!inView) return;
    if (prefersReducedMotion()) { setN(CODE.length); return; }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      setN(Math.min(CODE.length, Math.floor((now - start) / 14)));
      if (now - start < CODE.length * 14) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView]);

  let left = n;
  const spans = [];
  for (let i = 0; i < TOKENS.length && left > 0; i++) {
    const text = TOKENS[i].text.slice(0, left);
    left -= text.length;
    spans.push(<span key={i} className={`tok-${TOKENS[i].cls}`}>{text}</span>);
  }

  return (
    <div ref={ref} className="glass card code-card reveal">
      <div className="code-bar">
        <i /><i /><i />
        <span className="mono">validate.py</span>
        <span className="badge mono">illustrative</span>
      </div>
      <pre className="mono" style={{ minHeight: `${LINES * 1.75}em` }} aria-label={CODE}>
        <code aria-hidden="true">{spans}<span className="caret" /></code>
      </pre>
    </div>
  );
}

/* ---------- 4. workflow ---------- */

function Workflow() {
  const [ref, inView] = useInView<HTMLDivElement>({ threshold: 0.3 });
  return (
    <div className="glass card flow reveal" style={delay(120)}>
      <h3>How a model ships</h3>
      <div ref={ref} className={inView ? 'play' : undefined}>
        <ol>
          {pipeline.map((s, i) => (
            <li key={s.title} style={{ '--k': i } as CSSProperties}>
              <span className="node mono">{String(i + 1).padStart(2, '0')}</span>
              <div><strong>{s.title}</strong><p>{s.text}</p></div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

export function Lab() {
  return (
    <div className="lab">
      <ThresholdLab />
      <FitLab />
      <CodeCard />
      <Workflow />
    </div>
  );
}
