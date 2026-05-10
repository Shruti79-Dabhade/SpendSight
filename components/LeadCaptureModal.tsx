"use client";

import * as React from "react";
import { z } from "zod";

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

const RoleOptions = ["Founder", "Engineering Manager", "CTO", "Developer", "Other"] as const;
type Role = (typeof RoleOptions)[number];

const LeadSchema = z.object({
  email: z.string().email("Enter a valid email."),
  company: z.string().optional(),
  role: z.enum(RoleOptions).optional(),
  website: z.string().optional()
});

const DISMISS_KEY = "spendsight_lead_dismissed";
const DISMISS_TTL_MS = 24 * 60 * 60 * 1000;

function wasDismissedRecently(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = window.localStorage.getItem(DISMISS_KEY);
    const ts = raw ? Number(raw) : 0;
    if (!ts) return false;
    return Date.now() - ts < DISMISS_TTL_MS;
  } catch {
    return false;
  }
}

function markDismissed(): void {
  try {
    window.localStorage.setItem(DISMISS_KEY, String(Date.now()));
  } catch {
    // ignore
  }
}

function formatUsd0(n: number) {
  const v = Number.isFinite(n) ? n : 0;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(v);
}

function getFocusable(container: HTMLElement | null): HTMLElement[] {
  if (!container) return [];
  const nodes = container.querySelectorAll<HTMLElement>(
    'a[href],button:not([disabled]),textarea,input,select,[tabindex]:not([tabindex="-1"])'
  );
  return Array.from(nodes).filter((el) => !el.hasAttribute("disabled") && !el.getAttribute("aria-hidden"));
}

export function LeadCaptureModal(props: {
  auditSlug: string;
  monthlySavings: number;
  tools?: string[];
  autoOpen?: boolean;
}) {
  const { auditSlug, monthlySavings } = props;
  const highSavings = Math.max(0, Number(monthlySavings) || 0) > 500;

  const [open, setOpen] = React.useState(false);
  const [status, setStatus] = React.useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = React.useState<string | null>(null);

  const [email, setEmail] = React.useState("");
  const [company, setCompany] = React.useState("");
  const [role, setRole] = React.useState<Role | "">("");
  const [website, setWebsite] = React.useState("");

  const dialogRef = React.useRef<HTMLDivElement | null>(null);
  const previouslyFocusedRef = React.useRef<HTMLElement | null>(null);
  const emailRef = React.useRef<HTMLInputElement | null>(null);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    if (props.autoOpen === false) return;
    if (wasDismissedRecently()) return;

    const t = window.setTimeout(() => {
      previouslyFocusedRef.current = document.activeElement as HTMLElement | null;
      setOpen(true);
    }, 5000);
    return () => window.clearTimeout(t);
  }, [props.autoOpen]);

  React.useEffect(() => {
    if (!open) return;
    window.setTimeout(() => emailRef.current?.focus(), 0);
  }, [open]);

  React.useEffect(() => {
    if (!open) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        handleDismiss();
        return;
      }
      if (e.key !== "Tab") return;

      const focusables = getFocusable(dialogRef.current);
      if (focusables.length === 0) return;

      const first = focusables[0]!;
      const last = focusables[focusables.length - 1]!;
      const active = document.activeElement as HTMLElement | null;

      if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      } else if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  function handleDismiss() {
    setOpen(false);
    markDismissed();
    window.setTimeout(() => previouslyFocusedRef.current?.focus?.(), 0);
  }

  function openFromButton() {
    previouslyFocusedRef.current = document.activeElement as HTMLElement | null;
    setOpen(true);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setStatus("loading");

    const parsed = LeadSchema.safeParse({
      email: email.trim(),
      company: company.trim() ? company.trim() : undefined,
      role: role ? role : undefined,
      website: website.trim() ? website.trim() : undefined
    });

    if (!parsed.success) {
      setStatus("idle");
      setError(parsed.error.issues[0]?.message ?? "Invalid form.");
      return;
    }

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          auditSlug,
          email: parsed.data.email,
          company: parsed.data.company,
          role: parsed.data.role,
          teamSize: undefined,
          website: parsed.data.website
        })
      });

      if (!res.ok) throw new Error("request_failed");
      setStatus("success");
    } catch {
      setStatus("error");
      setError("Could not send right now. Please try again.");
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={openFromButton}
        className={cn(
          "inline-flex items-center justify-center rounded-md border bg-white px-4 py-2 text-sm font-medium text-slate-900 shadow-sm",
          "hover:bg-slate-50 dark:bg-slate-950 dark:text-slate-50 dark:hover:bg-slate-900",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-slate-600 dark:focus-visible:ring-offset-slate-950"
        )}
      >
        Get this report by email
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
          role="presentation"
        >
          <div
            className="absolute inset-0 bg-black/50"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) handleDismiss();
            }}
          />

          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="lead-modal-title"
            className={cn(
              "relative w-full max-w-xl rounded-t-2xl border bg-white p-6 shadow-xl",
              "sm:rounded-2xl",
              "dark:border-slate-800 dark:bg-slate-950"
            )}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">SpendSight</p>
                <h2 id="lead-modal-title" className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-50">
                  Email me this audit
                </h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  We’ll send your report (estimated savings: {formatUsd0(monthlySavings)}/mo).
                </p>
              </div>

              <button
                type="button"
                onClick={handleDismiss}
                className={cn(
                  "inline-flex size-10 items-center justify-center rounded-md border bg-white text-slate-700 shadow-sm",
                  "hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-slate-600 dark:focus-visible:ring-offset-slate-950"
                )}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="mt-5">
              {status === "success" ? (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900 dark:border-emerald-900/40 dark:bg-emerald-950/40 dark:text-emerald-100">
                  <p className="font-semibold">✓ Report sent! Check your inbox.</p>
                  <p className="mt-2">
                    {highSavings
                      ? "A Credex advisor will reach out within 24 hours to discuss your savings."
                      : "We’ll notify you when new optimisations match your stack."}
                  </p>
                </div>
              ) : (
                <form className="grid gap-4" onSubmit={submit}>
                  <div className="grid gap-1.5">
                    <label htmlFor="lead-email-modal" className="text-sm font-medium text-slate-900 dark:text-slate-50">
                      Email
                    </label>
                    <input
                      ref={emailRef}
                      id="lead-email-modal"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={inputClass(false)}
                      placeholder="you@company.com"
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="grid gap-1.5">
                      <label htmlFor="lead-company-modal" className="text-sm font-medium text-slate-900 dark:text-slate-50">
                        Company name (optional)
                      </label>
                      <input
                        id="lead-company-modal"
                        type="text"
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        className={inputClass(false)}
                        placeholder="Acme Inc."
                      />
                    </div>

                    <div className="grid gap-1.5">
                      <label htmlFor="lead-role-modal" className="text-sm font-medium text-slate-900 dark:text-slate-50">
                        Role (optional)
                      </label>
                      <select
                        id="lead-role-modal"
                        value={role}
                        onChange={(e) => setRole(e.target.value as Role | "")}
                        className={inputClass(false)}
                      >
                        <option value="">Select…</option>
                        {RoleOptions.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Honeypot: display:none via CSS, not hidden attribute */}
                  <div className="hidden">
                    <label htmlFor="website">Website</label>
                    <input
                      id="website"
                      name="website"
                      type="text"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      autoComplete="off"
                      tabIndex={-1}
                    />
                  </div>

                  {error ? (
                    <p className="text-sm text-red-600" role="alert">
                      {error}
                    </p>
                  ) : null}

                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <button
                      type="submit"
                      disabled={status === "loading"}
                      className={cn(
                        "inline-flex items-center justify-center rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm",
                        "hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-slate-600 dark:focus-visible:ring-offset-slate-950"
                      )}
                    >
                      {status === "loading" ? "Sending…" : "Send report"}
                    </button>
                    <p className="text-xs text-slate-500 dark:text-slate-400">No spam. Unsubscribe anytime.</p>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
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

