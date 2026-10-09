import { neon } from '@neondatabase/serverless';

interface Env { ANTHROPIC_API_KEY?: string; DATABASE_URL?: string }

// Diagnostics for the Ask feature. Reports only whether things are configured and reachable, never the values.
export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const out: Record<string, unknown> = {
    anthropicKeySet: Boolean(env.ANTHROPIC_API_KEY),
    databaseUrlSet: Boolean(env.DATABASE_URL),
    anthropicAuth: 'skipped',
    database: 'skipped',
    tableExists: false,
  };

  if (env.ANTHROPIC_API_KEY) {
    try {
      const r = await fetch('https://api.anthropic.com/v1/models?limit=1', {
        headers: { 'x-api-key': env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
      });
      out.anthropicAuth = r.ok ? 'ok' : `rejected (HTTP ${r.status})`;
    } catch { out.anthropicAuth = 'unreachable'; }
  }

  if (env.DATABASE_URL) {
    try {
      const sql = neon(env.DATABASE_URL);
      const [row] = await sql`select to_regclass('public.visitor_questions') is not null as ok`;
      out.database = 'ok';
      out.tableExists = row.ok;
    } catch { out.database = 'error'; }
  }

  return new Response(JSON.stringify(out, null, 2), { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
};
