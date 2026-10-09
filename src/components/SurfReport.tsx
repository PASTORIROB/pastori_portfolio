import { useEffect, useState } from 'react';
import { useTween } from '../hooks';

const spots = [
  { name: 'Cocoa Beach', lat: 28.32, lon: -80.5 },
  { name: 'New Smyrna Beach', lat: 29.03, lon: -80.85 },
];
type Surf = { name: string; ft: number | null; period: number | null; swell: string; swellDeg: number | null; wind: number | null; windDir: string; windDeg: number | null };
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
    swellDeg: m.current?.wave_direction ?? null,
    wind: w.current?.wind_speed_10m == null ? null : Math.round(w.current.wind_speed_10m),
    windDir: compass(w.current?.wind_direction_10m),
    windDeg: w.current?.wind_direction_10m ?? null,
  };
}

function Height({ ft }: { ft: number | null }) {
  const v = useTween(ft ?? 0, 1200);
  return <>{ft == null ? '–' : v.toFixed(1)}</>;
}

// 3000 units wide with a 300-unit period, so shifting by one period loops seamlessly.
const WAVE = `M0 60 q75 -40 150 0${' t150 0'.repeat(19)} V120 H0 Z`;

export default function SurfReport() {
  const [data, setData] = useState<Surf[] | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => { Promise.all(spots.map(loadSpot)).then(setData).catch(() => setFailed(true)); }, []);

  return (
    <div className="glass card surf reveal">
      <h3>Central Florida surf</h3>
      {failed && <p className="dim">Surf data is unavailable right now.</p>}
      {!data && !failed && <p className="dim">Loading…</p>}
      <div className="surf-grid">
        {data?.map((s) => (
          <div key={s.name} className="spot">
            <strong>{s.name}</strong>
            <span className="big mono"><Height ft={s.ft} /><small> ft</small></span>
            <span className="dim mono small">
              {s.period ?? '–'}s from {s.swell}
              {s.swellDeg != null && <svg className="arrow" viewBox="0 0 24 24" width="14" height="14" style={{ transform: `rotate(${s.swellDeg + 180}deg)` }} aria-hidden="true"><path d="M12 3v18M12 3l-5 6M12 3l5 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
              {' '}· wind {s.wind ?? '–'} mph {s.windDir}
            </span>
          </div>
        ))}
      </div>
      <p className="dim note small">Model forecast from Open-Meteo, not a buoy reading. Check a local cam before you paddle out.</p>
      <svg className="waves" viewBox="0 0 2400 120" preserveAspectRatio="none" aria-hidden="true">
        <path className="wv w1" d={WAVE} />
        <path className="wv w2" d={WAVE} />
      </svg>
    </div>
  );
}
