import { NextResponse, type NextRequest } from "next/server";
import { nanoid } from "nanoid";
import { z } from "zod";
import Anthropic from "@anthropic-ai/sdk";

import { getSupabaseAdminClient } from "@/lib/supabase";
import { getAnthropicApiKey } from "@/lib/env";
import {
  runAudit,
  ToolEntrySchema,
  UseCaseSchema,
  type AuditSummary as EngineAuditSummary
} from "@/lib/audit-engine";

export type AuditSummary = EngineAuditSummary & { aiSummary: string };

const AuditRequestSchema = z.object({
  tools: z.array(ToolEntrySchema),
  teamSize: z.number().int().nonnegative(),
  useCase: UseCaseSchema,
  website: z.any().optional() // honeypot
});

type RateBucket = { count: number; resetAtMs: number };
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const ipBuckets: Map<string, RateBucket> = new Map();

function getClientIp(req: NextRequest): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]?.trim() || "unknown";
  return req.headers.get("x-real-ip")?.trim() || "unknown";
}

function rateLimitOrThrow(ip: string): void {
  const now = Date.now();
  const bucket = ipBuckets.get(ip);
  if (!bucket || now >= bucket.resetAtMs) {
    ipBuckets.set(ip, { count: 1, resetAtMs: now + RATE_LIMIT_WINDOW_MS });
    return;
  }
  if (bucket.count >= RATE_LIMIT_MAX) {
    const retryAfterSec = Math.max(1, Math.ceil((bucket.resetAtMs - now) / 1000));
    const err = new Error("rate_limited");
    (err as any).status = 429;
    (err as any).retryAfterSec = retryAfterSec;
    throw err;
  }
  bucket.count += 1;
  ipBuckets.set(ip, bucket);
}

function buildUserPrompt(input: {
  tools: z.infer<typeof ToolEntrySchema>[];
  audit: EngineAuditSummary;
}): string {
  const toolLines = input.tools
    .map((t) => `- ${t.toolId}: plan="${t.plan}", seats=${t.seats}, spend=$${t.monthlySpend}/mo`)
    .join("\n");

  const topRecs = [...input.audit.results]
    .sort((a, b) => b.savings - a.savings)
    .slice(0, 6)
    .map((r) => {
      const actionBits = [
        r.recommendedAction,
        r.recommendedPlan ? `plan="${r.recommendedPlan}"` : undefined,
        r.alternativeTool ? `alt="${r.alternativeTool}"` : undefined
      ].filter(Boolean);
      return `- ${r.toolName}: ${actionBits.join(", ")}; save=$${r.savings}/mo; why=${r.reason}`;
    })
    .join("\n");

  return [
    "Spend audit results:",
    "",
    "Tools detected:",
    toolLines || "- (none)",
    "",
    `Total savings: $${input.audit.totalMonthlySavings}/mo ($${input.audit.totalAnnualSavings}/yr)`,
    `Credex eligible: ${input.audit.credexEligible ? "yes" : "no"}`,
    "",
    "Recommendations (highest impact first):",
    topRecs || "- (none)",
    "",
    "Write a 100-word summary with 2-4 bullets, focusing on immediate actions and dollar impact."
  ].join("\n");
}

function fallbackAiSummary(audit: EngineAuditSummary): string {
  const recs = [...audit.results].sort((a, b) => b.savings - a.savings).slice(0, 3);
  const bullets = recs
    .map((r) => `- ${r.toolName}: ${r.recommendedAction} to save ~$${r.savings}/mo.`)
    .join("\n");
  return [
    `You can save about $${audit.totalMonthlySavings}/month ($${audit.totalAnnualSavings}/year) by right-sizing your AI stack.`,
    bullets || "- Keep current tools; no clear savings identified.",
    audit.credexEligible
      ? "High savings detected—if you want help negotiating or consolidating contracts, Credex can reach out."
      : "If savings increase as you scale seats, re-run this audit monthly."
  ].join("\n");
}

async function generateAiSummaryOrFallback(args: {
  tools: z.infer<typeof ToolEntrySchema>[];
  audit: EngineAuditSummary;
}): Promise<string> {
  const apiKey = getAnthropicApiKey(); // throws clearly on startup/import
  const client = new Anthropic({ apiKey });

  const system = "You are a concise financial advisor for startups. Write a 100-word audit summary.";
  const user = buildUserPrompt(args);

  try {
    const resp = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 150,
      system,
      messages: [{ role: "user", content: user }]
    });

    const text = resp.content
      .filter((b) => b.type === "text")
      .map((b) => (b.type === "text" ? b.text : ""))
      .join("\n")
      .trim();

    return text.length > 0 ? text : fallbackAiSummary(args.audit);
  } catch (e: any) {
    const status = typeof e?.status === "number" ? e.status : undefined;
    const isTimeout =
      typeof e?.name === "string" &&
      (e.name.toLowerCase().includes("timeout") || e.name.toLowerCase().includes("abort"));
    if (status === 429 || status === 500 || isTimeout) return fallbackAiSummary(args.audit);
    return fallbackAiSummary(args.audit);
  }
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);

  try {
    rateLimitOrThrow(ip);
  } catch (e: any) {
    const retryAfter = e?.retryAfterSec;
    return NextResponse.json(
      { error: "Rate limit exceeded. Try again later." },
      {
        status: 429,
        headers: retryAfter ? { "Retry-After": String(retryAfter) } : undefined
      }
    );
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  // Honeypot silent reject
  if (raw && typeof raw === "object" && "website" in (raw as any)) {
    return new NextResponse(null, { status: 204 });
  }

  const parsed = AuditRequestSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body.", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { tools, teamSize, useCase } = parsed.data;

  try {
    const audit = runAudit({ tools, teamSize, useCase });
    const aiSummary = await generateAiSummaryOrFallback({ tools, audit });

    const summary: AuditSummary = { ...audit, aiSummary };
    const slug = nanoid(10);

    const supabase = getSupabaseAdminClient();
    const { error } = await supabase.from("audits").insert({
      slug,
      audit_data: JSON.stringify(summary)
    });
    if (error) {
      return NextResponse.json({ error: "Failed to save audit." }, { status: 500 });
    }

    return NextResponse.json({ slug, summary }, { status: 200 });
  } catch (e) {
    return NextResponse.json({ error: "Audit failed." }, { status: 500 });
  }
}

