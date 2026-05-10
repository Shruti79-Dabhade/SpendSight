export type PublicAuditSummary = {
  totalMonthlySavings: number;
  totalAnnualSavings: number;
  credexEligible?: boolean;
  overallVerdict?: string;
  aiSummary?: string;
  results: Array<{
    toolId: string;
    toolName?: string;
    currentSpend?: number;
    recommendedAction?: string;
    recommendedPlan?: string;
    alternativeTool?: string;
    savings: number;
    reason?: string;
  }>;
};

function inferOrigin(): string {
  const envOrigin =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "");
  if (envOrigin) return envOrigin.replace(/\/+$/, "");
  if (typeof window !== "undefined" && window.location?.origin) return window.location.origin;
  return "https://spendsight.app";
}

export function generateAuditUrl(slug: string): string {
  const base = inferOrigin();
  const safeSlug = String(slug || "").trim();
  return `${base}/audit/${encodeURIComponent(safeSlug)}`;
}

function formatUsd0(n: number) {
  const v = Number.isFinite(n) ? n : 0;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(v);
}

export function generateTweetText(savings: number, tools: string[]): string {
  const topTools = tools.filter(Boolean).slice(0, 2);
  const toolPart =
    topTools.length === 0
      ? "my stack"
      : topTools.length === 1
        ? topTools[0]
        : `${topTools[0]} + ${topTools[1]}`;

  return `Just audited my AI tool spend — could save ${formatUsd0(savings)}/month on ${toolPart}. Check yours free 👉 [URL] via @credex_rocks`;
}

function stripPII(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stripPII);
  if (!value || typeof value !== "object") return value;
  const obj = value as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (/email/i.test(k)) continue;
    if (/company/i.test(k)) continue;
    out[k] = stripPII(v);
  }
  return out;
}

export function stripPIIFromAudit(audit: unknown): PublicAuditSummary {
  const cleaned = stripPII(audit) as any;
  const results = Array.isArray(cleaned?.results) ? cleaned.results : [];

  return {
    totalMonthlySavings: Number(cleaned?.totalMonthlySavings ?? 0) || 0,
    totalAnnualSavings: Number(cleaned?.totalAnnualSavings ?? 0) || 0,
    credexEligible: typeof cleaned?.credexEligible === "boolean" ? cleaned.credexEligible : undefined,
    overallVerdict: typeof cleaned?.overallVerdict === "string" ? cleaned.overallVerdict : undefined,
    aiSummary: typeof cleaned?.aiSummary === "string" ? cleaned.aiSummary : undefined,
    results: results.map((r: any) => ({
      toolId: String(r?.toolId ?? ""),
      toolName: r?.toolName ? String(r.toolName) : undefined,
      currentSpend: r?.currentSpend != null ? Number(r.currentSpend) || 0 : undefined,
      recommendedAction: r?.recommendedAction ? String(r.recommendedAction) : undefined,
      recommendedPlan: r?.recommendedPlan ? String(r.recommendedPlan) : undefined,
      alternativeTool: r?.alternativeTool ? String(r.alternativeTool) : undefined,
      savings: Number(r?.savings ?? 0) || 0,
      reason: r?.reason ? String(r.reason) : undefined
    }))
  };
}

