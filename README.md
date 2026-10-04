# Rob Pastori portfolio (Cloudflare Pages)

1. `npm install && npm run dev` for the front end. Use `npm run cf:dev` to test the functions locally.
2. Edit `src/data.ts` (links, projects) and keep `FACTS` in `functions/api/ask.ts` in sync.
3. Add `public/headshot.jpeg` and `public/Rob_Pastori_Resume.pdf`.
4. Run `migrations/001_visitor_questions.sql` in Neon — project "Portfolio" (`long-hill-00351380`), branch `production` (`br-sparkling-mode-b4t0dnje`). Use a separate Neon project from the handyman site.
5. Secrets (Pages project > Settings, or `wrangler pages secret put NAME --project-name=rob-portfolio`):
   `ANTHROPIC_API_KEY`, `DATABASE_URL`.
6. Set a monthly spend limit on the Anthropic key's workspace before launch.
7. Enable Web Analytics: Cloudflare dashboard > Analytics & Logs > Web Analytics, add the site.
8. Deploy: create a Pages project from the repo (build `npm run build`, output `dist`), or `npm run cf:deploy`.
Never commit secrets. For local testing put them in `.dev.vars` (git-ignored).
