import { useEffect, useState, type FormEvent } from 'react';
import { profile, skills, projects, suggestions } from './data';

const spots = [
  { name: 'Cocoa Beach', lat: 28.32, lon: -80.5 },
  { name: 'New Smyrna Beach', lat: 29.03, lon: -80.85 },
];
type Surf = { name: string; ft: number | null; period: number | null; swell: string; wind: number | null; windDir: string };
const compass = (d?: number | null) => (d == null ? '–' : ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.round(d / 45) % 8]);

async function loadSpot(s: (typeof spots)[number]): Promise<Surf> {
  const [m, w] = await Promise.all([
    fetch(`https://marine-api.open-meteo.com/v1/marine?latitude=${s.lat}&longitude=${s.lon}&current=wave_height,wave_period,wave_direction`).then((r) => r.json()),
    fetch(`https://api.open-meteo.com/v1/forecast?latitude=${s.lat}&longitude=${s.lon}&current=wind_speed_10m,wind_direction_10m&wind_speed_unit=mph`).then((r) => r.json()),
  ]);
  const h = m.current?.wave_height as number | null | undefined;
  return {
    name: s.name,
    ft: h == null ? null : Math.round(h * 3.281 * 10) / 10,
    period: m.current?.wave_period ?? null,
    swell: compass(m.current?.wave_direction),
    wind: w.current?.wind_speed_10m == null ? null : Math.round(w.current.wind_speed_10m),
    windDir: compass(w.current?.wind_direction_10m),
  };
}

function SurfReport() {
  const [data, setData] = useState<Surf[] | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => { Promise.all(spots.map(loadSpot)).then(setData).catch(() => setFailed(true)); }, []);
  return (
    <div className="panel surf">
      <h3>Central Florida surf</h3>
      {failed && <p className="dim">Surf data is unavailable right now.</p>}
      {!data && !failed && <p className="dim">Loading…</p>}
      <div className="surf-grid">
        {data?.map((s) => (
          <div key={s.name} className="spot">
            <strong>{s.name}</strong>
            <span className="big mono">{s.ft ?? '–'}<small> ft</small></span>
            <span className="dim mono">{s.period ?? '–'}s from {s.swell} · wind {s.wind ?? '–'} mph {s.windDir}</span>
          </div>
        ))}
      </div>
      <p className="dim note">Model forecast from Open-Meteo, not a buoy reading. Check a local cam before you paddle out.</p>
    </div>
  );
}

function Ask() {
  const [q, setQ] = useState('');
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function ask(question: string) {
    setBusy(true); setError(''); setAnswer('');
    try {
      const res = await fetch('/api/ask', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question }) });
      const d = (await res.json()) as { answer?: string; error?: string };
      if (!res.ok || !d.answer) throw new Error(d.error || 'The assistant is unavailable. Email Rob instead.');
      setAnswer(d.answer);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    } finally { setBusy(false); }
  }
  const submit = (e: FormEvent) => { e.preventDefault(); if (q.trim()) void ask(q.trim()); };

  return (
    <div className="panel ask">
      <div className="chips">
        {suggestions.map((s) => <button key={s} type="button" className="chip" onClick={() => { setQ(s); void ask(s); }}>{s}</button>)}
      </div>
      <form onSubmit={submit}>
        <label htmlFor="q">Your question</label>
        <textarea id="q" rows={3} maxLength={300} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ask about Rob's experience, projects or skills." />
        <button className="btn btn-solid" disabled={busy || !q.trim()}>{busy ? 'Thinking…' : 'Ask'}</button>
      </form>
      {answer && <p className="answer" role="status">{answer}</p>}
      {error && <p className="down" role="alert">{error}</p>}
      <p className="dim note">AI answers use only the facts on this site and may be imperfect. Questions are logged.</p>
    </div>
  );
}

function Headshot() {
  const [bad, setBad] = useState(false);
  return (
    <div className="headshot">
      {bad ? <span className="chrome-text mono">RP</span> : <img src={profile.headshot} alt={`${profile.name} headshot`} onError={() => setBad(true)} />}
    </div>
  );
}

export default function App() {
  return (
    <>
      <header className="wrap top">
        <a href="#top" className="mark chrome-text">{profile.name}</a>
        <nav>
          <a href="#live">Live</a><a href="#skills">Skills</a><a href="#projects">Projects</a><a href="#ask">Ask</a><a href="#contact">Contact</a>
        </nav>
      </header>

      <main id="top">
        <section className="wrap hero">
          <div>
            <p className="dim mono">{profile.title}, {profile.org}</p>
            <h1 className="chrome-text">{profile.headline}</h1>
            <p className="lead">{profile.blurb}</p>
            <div className="actions">
              <a className="btn btn-solid" href={profile.resume} download>Download resume</a>
              <a className="btn" href="#ask">Ask my AI assistant</a>
            </div>
          </div>
          <Headshot />
        </section>

        <section id="skills" className="wrap sec">
          <h2>What I work with</h2>
          <div className="skill-grid">
            {skills.map((g) => (
              <div className="panel" key={g.group}>
                <h3>{g.group}</h3>
                <ul className="tags">{g.items.map((i) => <li key={i}>{i}</li>)}</ul>
              </div>
            ))}
          </div>
        </section>

        <section id="projects" className="wrap sec">
          <h2>Projects</h2>
          <div className="proj-grid">
            {projects.map((p) => (
              <article className="panel" key={p.title}>
                <h3>{p.title}</h3>
                <p>{p.text}</p>
                <ul className="tags">{p.tags.map((t) => <li key={t}>{t}</li>)}</ul>
              </article>
            ))}
          </div>
        </section>

        <section id="live" className="wrap sec">
          <h2>Live from Florida</h2>
          <SurfReport />
        </section>

        <section id="ask" className="wrap sec">
          <h2>Ask about my work</h2>
          <Ask />
        </section>

        <section id="contact" className="wrap sec">
          <h2>Contact</h2>
          <div className="actions">
            <a className="btn btn-solid" href={`mailto:${profile.email}`}>Email Rob</a>
            <a className="btn" href={profile.linkedin}>LinkedIn</a>
            <a className="btn" href={profile.github}>GitHub</a>
          </div>
        </section>
      </main>
      <footer className="wrap foot dim">© {new Date().getFullYear()} {profile.name}</footer>
    </>
  );
}
