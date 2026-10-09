import type { CSSProperties, ReactNode } from 'react';

export const delay = (ms: number) => ({ '--d': `${ms}ms` }) as CSSProperties;

export function SectionHead({ n, label, title, sub }: { n: string; label: string; title: string; sub?: string }) {
  return (
    <div className="sec-head reveal">
      <p className="eyebrow-text mono">{n} <i /> {label}</p>
      <h2>{title}</h2>
      {sub && <p className="sec-sub">{sub}</p>}
    </div>
  );
}

export function Section({ id, children }: { id: string; children: ReactNode }) {
  return <section id={id} className="wrap sec">{children}</section>;
}
