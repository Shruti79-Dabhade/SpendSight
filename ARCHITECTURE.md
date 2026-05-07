# SpendSight Architecture

SpendSight is an AI-powered spend audit tool that helps startups identify savings opportunities across SaaS tools, seat usage, and plan fit. The system is optimized for **fast audits**, **safe handling of secrets**, and **Vercel-first deployment**.

## System diagram

```mermaid
flowchart LR
  U[User Browser] -->|Tool inputs + lead capture| W[Next.js 14 App Router]

  subgraph Vercel["Vercel Runtime"]
    W --> R1["Route Handlers (Server)\n/app/api/*"]
    W --> SC["Server Components\n(app router)"]
  end

  R1 -->|Anon reads/writes (public)| SB[(Supabase Postgres)]
  R1 -->|Service role (server-only)\nwrite audit + lead| SBA[(Supabase Postgres)]

  R1 -->|Send transactional email| RE[Resend API]
  R1 -->|Generate audit narrative| AN[Anthropic API\nclaude-sonnet-4-20250514]

  SB -->|JSONB audit_data + indexes| D[(audits, leads)]
```

## Core data flow

- **User enters spend inputs** (tools, plan, seats, current monthly spend).
- **Next.js Route Handler** validates payload with Zod, applies rate limiting, and creates a deterministic slug.
- The server calls **Anthropic** to generate:
  - Per-tool recommendations
  - Savings estimates
  - A concise executive summary
  - A boolean for Credex eligibility (rules encoded in prompt + validated post-response)
- The server writes the complete `AuditSummary` as **JSONB** into `public.audits.audit_data`.
- If the user opts in, the server writes a `public.leads` row tied to `audit_id` and triggers a **Resend** transactional email.
- The user is redirected to `/audit/[slug]`, where the server loads the stored JSONB and renders the report.

## Stack justification

- **Next.js 14 (App Router)**: best-in-class SSR/streaming + first-party Vercel integration; Route Handlers are a clean place for rate limiting and secret-bound integrations.
- **TypeScript strict mode**: reduces runtime defects in AI + payment-adjacent logic; safer refactors.
- **Tailwind + shadcn/ui**: fast iteration with consistent UI primitives; excellent accessibility baseline.
- **Supabase (Postgres)**: operationally simple, SQL-native, and scales well for structured + semi-structured data (JSONB for AI output).
- **Resend**: reliable transactional delivery with great developer ergonomics.
- **Anthropic SDK**: typed client, predictable model selection, good observability on failures.

## Scaling plan (10k audits/day)

Assumptions:
- 10k audits/day \(\approx 116 requests/minute average\), but expect burstiness during business hours.
- Anthropic calls dominate latency and cost.

Plan:
- **Rate limiting**:
  - Apply IP + user-agent keyed limits on `/api/audit` and `/api/lead`.
  - Use a short burst window + sustained window.
- **Queueing / async** (when needed):
  - Split into create-audit + poll status.
  - Persist an `audit_status` and `error` fields (future migration) to avoid timeouts during spikes.
- **Caching and idempotency**:
  - Hash tool inputs to detect duplicates; reuse existing `audit_data` when payload matches and is recent.
  - Store canonical `slug` and enforce unique constraint (already in schema).
- **DB optimization**:
  - Keep `audits` as append-only; index `created_at` and `slug` (unique).
  - Use GIN on `audit_data` only if you need JSONB querying at scale; otherwise remove it to reduce write cost.
- **Cost controls**:
  - Enforce payload size limits.
  - Use prompt templates with bounded output length.
  - Add lightweight heuristics to skip model calls for obviously invalid/low-signal inputs.
- **Observability**:
  - Add structured logging for model latency, failures, and token usage.
  - Track DB latency and email send outcomes.
- **Vercel considerations**:
  - Keep Route Handlers under timeouts; move long-running audits to background when burst traffic grows.
  - Use Edge only for lightweight, non-secret operations; keep Anthropic + service-role Supabase strictly server runtime.

