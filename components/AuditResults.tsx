"use client";

import * as React from "react";

const TOOL_EMOJI: Record<string, string> = {
  cursor: "⚡",
  "github-copilot": "🐙",
  claude: "🟠",
  chatgpt: "🟢",
  "anthropic-api": "🟠",
  "openai-api": "🟢",
  gemini: "💎",
  windsurf: "🌊"
};

type Action = "switch" | "downgrade" | "keep" | "upgrade" | "optimize" | string;

type AuditResult = {
  toolId: string;
  toolName?: string;
  currentSpend: number;
  recommendedAction: Action;
  savings: number;
  reason: string;
  recommendedPlan?: string;
  alternativeTool?: string;
};

type AuditSummary = {
  totalMonthlySavings: number;
  totalAnnualSavings: number;
  results: AuditResult[];
  // May be stored on the audit, or fetched on-demand.
  aiSummary?: string;
  credexEligible?: boolean;
  overallVerdict?: "optimized" | "minor-savings" | "significant-savings" | string;
};

type LeadPayload = {
  auditId: string;
  email: string;
  company?: string;
  role?: string;
};

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function formatUsd0(n: number) {
  const v = Number.isFinite(n) ? n : 0;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(v);
}

function formatUsd2(n: number) {
  const v = Number.isFinite(n) ? n : 0;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2
  }).format(v);
}

function normalizeAuditData(auditData: unknown): AuditSummary {
  const a: any = auditData ?? {};
  const results: AuditResult[] = Array.isArray(a.results)
    ? a.results.map((r: any) => ({
        toolId: String(r?.toolId ?? ""),
        toolName: r?.toolName ? String(r.toolName) : undefined,
        currentSpend: Number(r?.currentSpend ?? r?.monthlySpend ?? 0) || 0,
        recommendedAction: String(r?.recommendedAction ?? "keep"),
        savings: Number(r?.savings ?? 0) || 0,
        reason: String(r?.reason ?? ""),
        recommendedPlan: r?.recommendedPlan ? String(r.recommendedPlan) : undefined,
        alternativeTool: r?.alternativeTool ? String(r.alternativeTool) : undefined
      }))
    : [];

  const totalMonthlySavings =
    Number(a?.totalMonthlySavings ?? results.reduce((s, r) => s + (Number(r.savings) || 0), 0)) || 0;
  const totalAnnualSavings = Number(a?.totalAnnualSavings ?? totalMonthlySavings * 12) || 0;

  return {
    totalMonthlySavings,
    totalAnnualSavings,
    results,
    aiSummary: typeof a?.aiSummary === "string" ? a.aiSummary : undefined,
    credexEligible: typeof a?.credexEligible === "boolean" ? a.credexEligible : undefined,
    overallVerdict: a?.overallVerdict
  };
}

function actionBadgeClasses(action: string) {
  const a = action.toLowerCase();
  if (a === "switch")
    return "bg-red-500/15 text-red-700 ring-red-500/30 dark:text-red-300 dark:ring-red-500/40";
  if (a === "downgrade")
    return "bg-amber-500/15 text-amber-800 ring-amber-500/30 dark:text-amber-200 dark:ring-amber-500/40";
  if (a === "keep")
    return "bg-emerald-500/15 text-emerald-800 ring-emerald-500/30 dark:text-emerald-200 dark:ring-emerald-500/40";
  if (a === "upgrade")
    return "bg-blue-500/15 text-blue-800 ring-blue-500/30 dark:text-blue-200 dark:ring-blue-500/40";
  return "bg-slate-500/15 text-slate-700 ring-slate-500/30 dark:text-slate-200 dark:ring-slate-500/40";
}

function actionLabel(action: string) {
  const a = action.toLowerCase();
  if (a === "switch") return "Switch";
  if (a === "downgrade") return "Downgrade";
  if (a === "keep") return "Keep";
  if (a === "upgrade") return "Upgrade";
  if (a === "optimize") return "Optimize";
  return action;
}

function newSpend(current: number, savings: number, action: string) {
  const a = action.toLowerCase();
  if (a === "switch" || a === "downgrade" || a === "optimize" || a === "keep") {
    return Math.max(0, (Number(current) || 0) - Math.max(0, Number(savings) || 0));
  }
  return Number(current) || 0;
}

function Hero({
  monthlySavings,
  annualSavings
}: {
  monthlySavings: number;
  annualSavings: number;
}) {
  const low = monthlySavings < 50;
  return (
    <section className="relative overflow-hidden rounded-2xl bg-[#0b1220] text-white shadow-sm print:bg-white print:text-black">
      <div className="pointer-events-none absolute inset-0 opacity-70">
        <div className="absolute -left-24 -top-24 size-[340px] rounded-full bg-emerald-500/25 blur-3xl" />
        <div className="absolute -right-24 -top-32 size-[420px] rounded-full bg-blue-500/20 blur-3xl" />
        <div className="absolute -bottom-28 left-1/3 size-[420px] rounded-full bg-violet-500/15 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_0%,rgba(255,255,255,0.10),transparent_60%)]" />
      </div>

      <div className="relative px-6 py-10 sm:px-10 sm:py-12">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm text-white/70">SpendSight audit results</p>
            <h1 className="mt-3 text-balance text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
              {low ? (
                <>
                  You&apos;re spending well on{" "}
                  <span className="text-white">AI tools</span>
                </>
              ) : (
                <>
                  You could save{" "}
                  <span className="text-emerald-300">{formatUsd0(monthlySavings)}</span>
                  <span className="text-white/90">/month</span> on AI tools
                </>
              )}
            </h1>
            <p className="mt-3 text-pretty text-sm text-white/70 sm:text-base">
              {low ? (
                <>
                  Your stack is already fairly optimized. We still found a few small tweaks and
                  monitoring tips below.
                </>
              ) : (
                <>
                  That&apos;s <span className="font-medium text-white">{formatUsd0(annualSavings)}</span>{" "}
                  annually. Here&apos;s the breakdown.
                </>
              )}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm print:border-slate-200 print:bg-white">
            <p className="text-xs text-white/70 print:text-slate-600">Estimated annual savings</p>
            <p className="mt-2 text-4xl font-semibold tracking-tight text-emerald-300 sm:text-5xl print:text-emerald-600">
              {formatUsd0(annualSavings)}
            </p>
            <p className="mt-2 text-xs text-white/60 print:text-slate-500">
              Based on your current spend inputs.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function ToolCard({ r }: { r: AuditResult }) {
  const action = r.recommendedAction ?? "keep";
  const badge = actionBadgeClasses(action);
  const displayName = r.toolName || r.toolId;
  const nextSpend = newSpend(r.currentSpend, r.savings, action);
  const showNext = Math.abs(nextSpend - r.currentSpend) > 0.009;
  const saving = Math.max(0, Number(r.savings) || 0);

  return (
    <article className="rounded-2xl border bg-white p-5 shadow-sm ring-1 ring-transparent transition-shadow hover:shadow-md dark:bg-slate-950 print:shadow-none">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span
              className="inline-flex size-8 items-center justify-center rounded-lg border bg-slate-50 text-sm dark:bg-slate-900"
              aria-hidden="true"
            >
              {TOOL_EMOJI[r.toolId] ?? "•"}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-50">
                {displayName}
              </p>
              <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                Current plan:{" "}
                <span className="text-slate-700 dark:text-slate-200">
                  {r.recommendedAction?.toLowerCase() === "switch"
                    ? "—"
                    : r.recommendedPlan
                      ? "As selected"
                      : "As selected"}
                </span>
              </p>
            </div>
          </div>
        </div>

        <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1", badge)}>
          {actionLabel(action)}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
        <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-900">
          <p className="text-xs text-slate-500 dark:text-slate-400">Current monthly spend</p>
          <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-50">
            {formatUsd2(r.currentSpend)}
          </p>
        </div>

        <div className="hidden justify-center sm:flex" aria-hidden="true">
          <span className="inline-flex size-9 items-center justify-center rounded-full border bg-white text-slate-400 dark:bg-slate-950 dark:text-slate-500">
            →
          </span>
        </div>

        <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-900">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            New monthly spend {showNext ? "" : "(unchanged)"}
          </p>
          <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-50">
            {formatUsd2(showNext ? nextSpend : r.currentSpend)}
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-600 dark:text-slate-300">
          <span className={cn("font-semibold", saving > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-slate-700 dark:text-slate-200")}>
            {saving > 0 ? `${formatUsd2(saving)}/mo saved` : "No direct savings"}
          </span>
        </p>

        {r.recommendedAction?.toLowerCase() === "switch" || r.recommendedPlan || r.alternativeTool ? (
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {r.recommendedAction?.toLowerCase() === "switch" ? (
              <>
                Recommended:{" "}
                <span className="font-medium text-slate-700 dark:text-slate-200">
                  {r.alternativeTool ?? "Alternative tool"}
                </span>
                {r.recommendedPlan ? (
                  <>
                    {" "}
                    — <span className="font-medium text-slate-700 dark:text-slate-200">{r.recommendedPlan}</span>
                  </>
                ) : null}
              </>
            ) : r.recommendedPlan ? (
              <>
                Recommended plan:{" "}
                <span className="font-medium text-slate-700 dark:text-slate-200">{r.recommendedPlan}</span>
              </>
            ) : null}
          </p>
        ) : null}
      </div>

      <p className="mt-3 text-sm text-slate-700 dark:text-slate-200">{r.reason}</p>
    </article>
  );
}

function AiSummary({ slug, initial }: { slug: string; initial?: string }) {
  const [text, setText] = React.useState<string | null>(initial ?? null);
  const [loading, setLoading] = React.useState(!initial);

  React.useEffect(() => {
    if (initial) return;
    let cancelled = false;

    async function run() {
      try {
        setLoading(true);
        const res = await fetch(`/api/audit/summary?slug=${encodeURIComponent(slug)}`);
        if (!res.ok) throw new Error("Failed to fetch AI summary");
        const json = (await res.json()) as { summary?: string };
        if (!cancelled) setText(typeof json.summary === "string" ? json.summary : "");
      } catch {
        if (!cancelled) setText("");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [slug, initial]);

  return (
    <section className="rounded-2xl border bg-white p-6 shadow-sm dark:bg-slate-950 print:shadow-none">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">
            Your personalised audit summary
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Executive summary of what to change first.
          </p>
        </div>
        <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-200 dark:ring-slate-800">
          AI-generated
        </span>
      </div>

      <div className="mt-4">
        {loading ? (
          <div className="space-y-2" aria-label="Loading AI summary">
            <div className="h-4 w-11/12 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
            <div className="h-4 w-10/12 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
            <div className="h-4 w-9/12 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
            <div className="h-4 w-10/12 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
            <div className="h-4 w-7/12 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
          </div>
        ) : (
          <p className="text-pretty text-sm leading-relaxed text-slate-700 dark:text-slate-200">
            {text && text.trim().length > 0
              ? text
              : "Summary unavailable right now. Your per-tool breakdown above is still accurate."}
          </p>
        )}
      </div>
    </section>
  );
}

function CredexCta() {
  return (
    <section className="rounded-2xl border bg-gradient-to-br from-[#0f2a1d] via-[#0f2a1d] to-[#0b1220] p-6 text-white shadow-sm print:border-slate-200 print:bg-white print:text-black">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="max-w-2xl">
          <p className="text-sm text-white/75">Credex</p>
          <h2 className="mt-1 text-balance text-xl font-semibold">
            Get these savings now — without switching tools
          </h2>
          <p className="mt-2 text-sm text-white/75">
            Credex sources discounted AI credits from companies that overforecast. Same Cursor, same
            Claude, lower price.
          </p>
        </div>

        <a
          href="https://credex.rocks"
          target="_blank"
          rel="noreferrer"
          className={cn(
            "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-semibold shadow-sm",
            "bg-[#1a7a4a] hover:bg-[#166640] text-white",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b1220]",
            "print:hidden"
          )}
        >
          Book a free Credex consultation →
        </a>
      </div>
    </section>
  );
}

function ShareSection({ monthlySavings }: { monthlySavings: number }) {
  const [copied, setCopied] = React.useState(false);
  const url = typeof window !== "undefined" ? window.location.href : "";

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      // no-op
    }
  }

  const tweetText = `Just audited my AI tool spend with SpendSight — could save ${formatUsd0(
    monthlySavings
  )}/mo. Check yours free: ${url}`;

  return (
    <section className="rounded-2xl border bg-white p-6 shadow-sm dark:bg-slate-950 print:hidden">
      <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">Share your audit</h2>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Shared link shows tools and savings only — not your email or company name.
      </p>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={copyLink}
          className={cn(
            "inline-flex items-center justify-center rounded-md border bg-white px-4 py-2 text-sm font-medium text-slate-900 shadow-sm",
            "hover:bg-slate-50 dark:bg-slate-950 dark:text-slate-50 dark:hover:bg-slate-900",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-slate-600 dark:focus-visible:ring-offset-slate-950"
          )}
        >
          {copied ? "Copied!" : "Copy link"}
        </button>

        <a
          className={cn(
            "inline-flex items-center justify-center rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm",
            "hover:bg-slate-800 dark:bg-slate-50 dark:text-slate-900 dark:hover:bg-white",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-slate-600 dark:focus-visible:ring-offset-slate-950"
          )}
          href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`}
          target="_blank"
          rel="noreferrer"
        >
          Share on X
        </a>

        <button
          type="button"
          onClick={() => window.print()}
          className={cn(
            "inline-flex items-center justify-center rounded-md border bg-white px-4 py-2 text-sm font-medium text-slate-900 shadow-sm",
            "hover:bg-slate-50 dark:bg-slate-950 dark:text-slate-50 dark:hover:bg-slate-900",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-slate-600 dark:focus-visible:ring-offset-slate-950"
          )}
        >
          Print / Save PDF
        </button>
      </div>
    </section>
  );
}

function LeadCapture({
  auditId,
  headline,
  subhead
}: {
  auditId: string;
  headline: string;
  subhead: string;
}) {
  const [status, setStatus] = React.useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = React.useState<string | null>(null);

  const [email, setEmail] = React.useState("");
  const [company, setCompany] = React.useState("");
  const [role, setRole] = React.useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setStatus("loading");

    const payload: LeadPayload = {
      auditId,
      email,
      company: company.trim() ? company.trim() : undefined,
      role: role.trim() ? role.trim() : undefined
    };

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error("Request failed");
      setStatus("success");
    } catch {
      setStatus("error");
      setError("Could not submit right now. Please try again.");
    }
  }

  return (
    <section className="rounded-2xl border bg-white p-6 shadow-sm dark:bg-slate-950 print:hidden">
      <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">{headline}</h2>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{subhead}</p>

      {status === "success" ? (
        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900 dark:border-emerald-900/40 dark:bg-emerald-950/40 dark:text-emerald-100">
          You&apos;re subscribed. We&apos;ll email you when new optimisations apply.
        </div>
      ) : (
        <form className="mt-4 grid gap-3" onSubmit={submit}>
          <div className="grid gap-1.5">
            <label htmlFor="lead-email" className="text-sm font-medium text-slate-900 dark:text-slate-50">
              Email
            </label>
            <input
              id="lead-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass(false)}
              placeholder="you@company.com"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <label htmlFor="lead-company" className="text-sm font-medium text-slate-900 dark:text-slate-50">
                Company (optional)
              </label>
              <input
                id="lead-company"
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className={inputClass(false)}
                placeholder="SpendSight Inc."
              />
            </div>

            <div className="grid gap-1.5">
              <label htmlFor="lead-role" className="text-sm font-medium text-slate-900 dark:text-slate-50">
                Role (optional)
              </label>
              <input
                id="lead-role"
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className={inputClass(false)}
                placeholder="Founder / Eng / Ops"
              />
            </div>
          </div>

          {error ? (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          ) : null}

          <div className="mt-1 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="submit"
              disabled={status === "loading"}
              className={cn(
                "inline-flex items-center justify-center rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm",
                "hover:bg-slate-800 disabled:opacity-60 disabled:cursor-not-allowed",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
              )}
            >
              {status === "loading" ? "Submitting…" : "Notify me"}
            </button>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              No spam. Unsubscribe anytime.
            </p>
          </div>
        </form>
      )}
    </section>
  );
}

function inputClass(isInvalid: boolean) {
  return cn(
    "h-10 w-full rounded-md border bg-white px-3 py-2 text-sm text-slate-900 shadow-sm",
    "placeholder:text-slate-400 dark:bg-slate-950 dark:text-slate-50 dark:placeholder:text-slate-500",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-slate-600 dark:focus-visible:ring-offset-slate-950",
    isInvalid ? "border-red-500" : "border-slate-200 dark:border-slate-800"
  );
}

export function AuditResults(props: {
  slug: string;
  auditId: string;
  auditData: unknown;
  createdAt: string;
}) {
  const audit = React.useMemo(() => normalizeAuditData(props.auditData), [props.auditData]);
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  const monthlySavings = Math.max(0, Number(audit.totalMonthlySavings) || 0);
  const annualSavings = Math.max(0, Number(audit.totalAnnualSavings) || 0);
  const credexEligible = audit.credexEligible === true || monthlySavings >= 500;

  const leadHeadline =
    monthlySavings >= 100
      ? "Get this report by email + be notified when better options launch"
      : "Notify me when new optimisations apply to my stack";
  const leadSubhead =
    monthlySavings >= 100
      ? "We’ll email this report and keep you updated as pricing and plans change."
      : "We’ll email you if new pricing or plan changes create fresh savings.";

  return (
    <main className="min-h-dvh bg-slate-50 text-slate-900 dark:bg-[#070a12] dark:text-slate-50 print:bg-white">
      <div className="container max-w-6xl py-8 sm:py-10">
        <div
          className={cn(
            "grid gap-6",
            "transition-all duration-700 motion-reduce:transition-none",
            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
          )}
        >
          <Hero monthlySavings={monthlySavings} annualSavings={annualSavings} />

          <section className="grid gap-4">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div>
                <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">
                  Per-tool breakdown
                </h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Clear, defensible recommendations you can share with your team.
                </p>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Audit ID: <span className="font-mono">{props.slug}</span>
              </p>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              {audit.results.map((r, i) => (
                <ToolCard key={`${r.toolId}-${i}`} r={r} />
              ))}
            </div>
          </section>

          <AiSummary slug={props.slug} initial={audit.aiSummary} />

          {credexEligible ? <CredexCta /> : null}

          <LeadCapture auditId={props.auditId} headline={leadHeadline} subhead={leadSubhead} />

          <ShareSection monthlySavings={monthlySavings} />
        </div>
      </div>
    </main>
  );
}

