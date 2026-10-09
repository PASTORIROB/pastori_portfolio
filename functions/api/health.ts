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

  // Shape of the connection string only, never its contents.
  const url = (env.DATABASE_URL ?? '').trim();
  if (url) {
    out.databaseUrlShape = {
      protocol: url.slice(0, url.indexOf('://') + 3) || 'missing',
      hasInnerWhitespace: /\s/.test(url),
      hasPlaceholderDots: url.includes('...'),
      hostLooksLikeNeon: /@ep-[a-z0-9-]+\.[a-z0-9.-]*neon\.tech/.test(url),
      hasDatabaseName: /neon\.tech\/[^/?\s]+/.test(url),
    };
  }

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
      const sql = neon(env.DATABASE_URL.trim());
      const [row] = await sql`select to_regclass('public.visitor_questions') is not null as ok`;
      out.database = 'ok';
      out.tableExists = row.ok;
    } catch (e) {
      out.database = 'error';
      out.databaseError = String(e instanceof Error ? e.message : e).replace(/postgres(ql)?:\/\/\S+/gi, '[url]').slice(0, 200);
    }
  }

  return new Response(JSON.stringify(out, null, 2), { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
};
