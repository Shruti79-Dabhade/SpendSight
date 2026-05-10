"use client";

import * as React from "react";

import { generateAuditUrl, generateTweetText } from "@/lib/share";

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

export function SharePanel(props: { slug: string; savings: number; tools: string[] }) {
  const [copied, setCopied] = React.useState(false);

  const auditUrl = React.useMemo(() => generateAuditUrl(props.slug), [props.slug]);
  const savings = Math.max(0, Number(props.savings) || 0);
  const tools = (props.tools || []).filter(Boolean).slice(0, 6);

  async function copy() {
    try {
      await navigator.clipboard.writeText(auditUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // no-op
    }
  }

  const tweetText = React.useMemo(() => {
    const base = generateTweetText(savings, tools);
    return base.replace("[URL]", auditUrl).replace(formatUsd0(savings), `$${Math.round(savings)}`);
  }, [auditUrl, savings, tools]);

  const twitterHref = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
  const linkedinHref = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(auditUrl)}`;

  return (
    <section className="rounded-2xl border bg-white p-6 shadow-sm dark:bg-slate-950 print:hidden">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">Share your audit</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Your audit URL
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1 rounded-xl border bg-slate-50 px-3 py-2 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-200">
          <p className="truncate font-mono" title={auditUrl}>
            {auditUrl}
          </p>
        </div>

        <button
          type="button"
          onClick={copy}
          className={cn(
            "inline-flex h-10 items-center justify-center gap-2 rounded-md border bg-white px-4 text-sm font-medium text-slate-900 shadow-sm",
            "hover:bg-slate-50 dark:bg-slate-950 dark:text-slate-50 dark:hover:bg-slate-900",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-slate-600 dark:focus-visible:ring-offset-slate-950"
          )}
          aria-label="Copy audit URL"
        >
          {copied ? "✓ Copied" : "Copy"}
        </button>

        <a
          href={twitterHref}
          target="_blank"
          rel="noreferrer"
          className={cn(
            "inline-flex h-10 items-center justify-center rounded-md bg-slate-900 px-4 text-sm font-semibold text-white shadow-sm",
            "hover:bg-slate-800 dark:bg-slate-50 dark:text-slate-900 dark:hover:bg-white",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-slate-600 dark:focus-visible:ring-offset-slate-950"
          )}
        >
          Share on X
        </a>

        <a
          href={linkedinHref}
          target="_blank"
          rel="noreferrer"
          className={cn(
            "inline-flex h-10 items-center justify-center rounded-md border bg-white px-4 text-sm font-medium text-slate-900 shadow-sm",
            "hover:bg-slate-50 dark:bg-slate-950 dark:text-slate-50 dark:hover:bg-slate-900",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-slate-600 dark:focus-visible:ring-offset-slate-950"
          )}
        >
          Share on LinkedIn
        </a>
      </div>

      <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
        🔒 Shared link shows tools and savings only. Email and company name are never included.
      </p>
    </section>
  );
}

