import { useEffect, useState, type FormEvent } from 'react';
import { profile, suggestions } from '../data';
import { prefersReducedMotion } from '../hooks';

function Typed({ text }: { text: string }) {
  const words = text.split(/(\s+)/);
  const [n, setN] = useState(prefersReducedMotion() ? words.length : 0);
  useEffect(() => {
    if (n >= words.length) return;
    const id = setTimeout(() => setN((v) => Math.min(words.length, v + 2)), 28);
    return () => clearTimeout(id);
  }, [n, words.length]);
  return <>{words.slice(0, n).join('')}</>;
}

export default function Ask() {
  const [q, setQ] = useState('');
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function ask(question: string) {
    setBusy(true); setError(''); setAnswer('');
    try {
      const res = await fetch('/api/ask', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question }) });
      let d: { answer?: string; error?: string } = {};
      try { d = JSON.parse(await res.text()); } catch { /* non-JSON response, handled below */ }
      if (!res.ok || !d.answer) throw new Error(d.error || 'The assistant is unavailable right now.');
      setAnswer(d.answer);
    } catch (e) {
      setError(e instanceof TypeError ? 'Could not reach the assistant. Check your connection.' : e instanceof Error ? e.message : 'Something went wrong.');
    } finally { setBusy(false); }
  }
  const submit = (e: FormEvent) => { e.preventDefault(); if (q.trim()) void ask(q.trim()); };

  return (
    <div className="glass card ask reveal">
      <div className="chips">
        {suggestions.map((s) => <button key={s} type="button" className="chip" disabled={busy} onClick={() => { setQ(s); void ask(s); }}>{s}</button>)}
      </div>
      <form onSubmit={submit}>
        <label htmlFor="q">Your question</label>
        <textarea id="q" rows={3} maxLength={300} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ask about Rob's experience, projects or skills." />
        <button className="btn btn-solid" disabled={busy || !q.trim()}>{busy ? 'Thinking…' : 'Ask'}</button>
      </form>
      {busy && <p className="thinking" role="status" aria-label="Thinking"><i /><i /><i /></p>}
      {answer && <p className="answer" role="status"><Typed text={answer} /></p>}
      {error && <p className="error" role="alert">{error} <a href={`mailto:${profile.email}`}>Email Rob</a></p>}
      <p className="dim note small">AI answers use only the facts on this site and may be imperfect. Questions are logged.</p>
    </div>
  );
}
