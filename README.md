# SpendSight

SpendSight is a free, shareable **AI spend audit** for startups and small teams: you enter the SaaS and API tools you pay for, and it returns prioritized savings ideas, eligibility signals, and a concise summary you can share. It is built for founders and finance leads who want a fast sanity check on overlapping assistants, seat economics, and plan fit without a lengthy procurement exercise.

**[Live demo →](YOUR_VERCEL_URL)**

[SCREENSHOT 1: Landing page]

[SCREENSHOT 2: Spend input / audit form]

[SCREENSHOT 3: Audit results & share]

## Quick start

```bash
git clone <YOUR_REPO_URL>
cd SpendSight
npm install
cp .env.example .env
# Fill in Supabase, Anthropic, Resend, and base URL values in .env
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | Description |
|--------|-------------|
| `npm run dev` | Next.js dev server |
| `npm run build` | Production build |
| `npm run lint` | ESLint (Next.js config) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run test:run` | Vitest (CI mode) |

## Decisions

1. **Chose Next.js App Router over Pages Router** because route segments, layouts, and server-first API routes match how we ship `/api/audit` and dynamic `/audit/[slug]` without a separate backend repo, while keeping streaming and metadata co-located with each page.

2. **Chose Supabase over Firebase** because Postgres row-level patterns and a simple service-role server client fit audit persistence and lead capture with SQL-friendly queries, and the team already wanted relational storage over NoSQL document modeling for this scope.

3. **Chose hardcoded rules over ML for the audit engine** because savings recommendations must be explainable line-by-line for a finance audience; deterministic rules from `pricing-data` keep tests stable and avoid non-reproducible model drift on a small MVP.

4. **Chose Resend over SendGrid** because the integration surface for transactional email is minimal, the DX matches a TypeScript Next.js codebase, and the free tier is sufficient for low-volume lead confirmations during the internship demo window.

5. **Chose nanoid slugs over UUIDs** because public share URLs stay short and human-copyable while remaining unguessable enough for read-only audit pages without exposing sequential integer IDs.

## License

Private / submission use unless otherwise noted.
