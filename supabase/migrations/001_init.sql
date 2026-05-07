-- SpendSight initial schema

create extension if not exists "pgcrypto";

create table if not exists public.audits (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  audit_data jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists audits_created_at_idx on public.audits (created_at desc);
create index if not exists audits_audit_data_gin_idx on public.audits using gin (audit_data);

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  audit_id uuid not null references public.audits(id) on delete cascade,
  email text not null,
  company text not null,
  role text not null,
  team_size integer not null check (team_size >= 1),
  created_at timestamptz not null default now()
);

create index if not exists leads_audit_id_idx on public.leads (audit_id);
create index if not exists leads_email_idx on public.leads (email);
create index if not exists leads_created_at_idx on public.leads (created_at desc);

