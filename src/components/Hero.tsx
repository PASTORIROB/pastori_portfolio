import { useRef, useState, type CSSProperties, type PointerEvent, type ReactNode } from 'react';
import { profile, stats } from '../data';
import { prefersReducedMotion, useInView, useTween } from '../hooks';
import NeuralNet from './NeuralNet';
import { delay } from './ui';

function Headshot() {
  const [bad, setBad] = useState(false);
  return (
    <div className="headshot">
      {bad
        ? <span className="mono">RP</span>
        : <img src={profile.headshot} alt={`${profile.name} headshot`} width={1122} height={1402} fetchPriority="high" onError={() => setBad(true)} />}
    </div>
  );
}

function Tilt({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const move = (e: PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `perspective(1100px) rotateY(${x * 9}deg) rotateX(${-y * 9}deg)`;
  };
  return <div ref={ref} className="tilt" onPointerMove={move} onPointerLeave={() => { if (ref.current) ref.current.style.transform = ''; }}>{children}</div>;
}

export function Hero() {
  const words = profile.headline.split(' ');
  return (
    <section className="hero wrap">
      <NeuralNet />
      <div className="hero-copy">
        <p className="pill glass reveal"><span className="dot" />{profile.title} · {profile.org}</p>
        <h1 className="headline" aria-label={profile.headline}>
          {words.map((w, i) => (
            <span key={i} className="word" aria-hidden="true" style={{ '--i': i, '--p': `${(i / Math.max(1, words.length - 1)) * 100}%` } as CSSProperties}><span>{w}</span></span>
          ))}
        </h1>
        <p className="lead reveal" style={delay(450)}>{profile.blurb}</p>
        <div className="actions reveal" style={delay(600)}>
          <a className="btn btn-solid" href={profile.resume} download>Download resume</a>
          <a className="btn btn-glass" href="#ask">Ask my AI assistant</a>
        </div>
      </div>

      <div className="hero-visual reveal" style={delay(250)}>
        <Tilt>
          <div className="orbit" aria-hidden="true"><i /></div>
          <div className="orbit o2" aria-hidden="true"><i /></div>
          <div className="glass portrait"><Headshot /></div>
          <span className="float glass f1 mono">Python</span>
          <span className="float glass f2 mono">SQL</span>
          <span className="float glass f3 mono">MLflow</span>
          <span className="float glass f4 mono">Pandas</span>
          <code className="float glass f5 mono"><b>&gt;&gt;&gt;</b> model.fit(X_train, y_train)</code>
        </Tilt>
      </div>

      <a className="scroll-cue" href="#skills" aria-label="Scroll to skills"><i /></a>
    </section>
  );
}

function Counter({ value, suffix = '', go }: { value: number; suffix?: string; go: boolean }) {
  const v = useTween(go ? value : 0, 1600);
  return <>{Math.round(v)}{suffix}</>;
}

export function Stats() {
  const [ref, inView] = useInView<HTMLDivElement>({ threshold: 0.5 });
  return (
    <div className="wrap">
      <div ref={ref} className="stats glass reveal">
        {stats.map((s) => (
          <div className="stat" key={s.label}>
            <strong className="mono">{'text' in s ? s.text : <Counter value={s.value} suffix={'suffix' in s ? s.suffix : ''} go={inView} />}</strong>
            <span>{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
