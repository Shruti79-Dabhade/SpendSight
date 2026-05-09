Day 1 — 2026-05-07

Hours worked:
6–7 hours

What I did:
Set up the project architecture using Next.js 14, TypeScript, Tailwind CSS, Supabase, Resend, and Anthropic API. Created config files, database schema, TypeScript interfaces, Supabase setup, and architecture documentation.

What I learned:
Learned scalable SaaS architecture, Supabase integration, strict TypeScript practices, and secure API/environment setup.

Blockers / what I am stuck on:
Need to finalize AI audit logic structure, caching strategy, and rate limiting for high traffic.

Plan for tomorrow:
Set up Supabase account and got the database credentials. Added pricing data for all 8 AI tools.
Build API routes, connect Anthropic API, add validations, create frontend UI, integrate database logic, and start testing.


Day 2 — 2026-05-08

Hours worked: 5 hours.

What I did: Implemented /lib/audit-engine.ts with full audit rules (overpaying seats, use-case matching, duplicates like Cursor+Copilot flag, retail vs credits >$500 for Credex, plan fit spend checks); generated typed AuditResult/Summary outputs with math-driven reasons/savings; wrote 10 Vitest tests in /tests/audit-engine.test.ts covering all cases (e.g., downgrade logic saves $60/mo on Cursor Business for 3 seats).

What I learned: Defensible finance logic requires explicit calcs (e.g., current $403=$120 vs Pro $203=$60); duplicates prioritize 1 coding tool (Cursor/Copilot/Claude); thresholds like >50 seats trigger Enterprise recs.

Blockers / what I am stuck on: None—logic/tests pass; minor tweak for Gemini API token calcs if spend data needs parsing.

Plan for tomorrow: Integrate with pricing-data.ts for live tool lookups; add dashboard UI mockups; run full e2e tests.


Day 3 — 2026-05-09

Hours worked: 4 hours.

What I did: Built the spend input form with dynamic tool rows, auto-calculating monthly spend, and localStorage persistence. Built the audit results page with hero savings section, per-tool breakdown cards with color-coded badges, Credex CTA for savings above $500, and AI summary with skeleton loader.

What I learned: react-hook-form with Zod handles validation and TypeScript types together from one schema — much cleaner than manual error state. Conditional rendering needs careful planning when multiple sections depend on different savings thresholds.

Blockers / what I'm stuck on: OG image generation with @vercel/og is tricky — Twitter card preview not picking up the image yet despite correct meta tags in page head.

Plan for tomorrow: Build API routes for /api/audit, /api/audit/[slug], and /api/leads with Supabase storage, Anthropic summary, Resend email, and rate limiting.