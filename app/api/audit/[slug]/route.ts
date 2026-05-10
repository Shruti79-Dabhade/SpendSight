import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { getSupabaseAdminClient } from "@/lib/supabase";

const ParamsSchema = z.object({
  slug: z.string().min(1)
});

function stripEmailPII(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stripEmailPII);
  if (!value || typeof value !== "object") return value;

  const obj = value as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (/email/i.test(k)) continue;
    out[k] = stripEmailPII(v);
  }
  return out;
}

export async function GET(_req: NextRequest, ctx: { params: { slug: string } }) {
  const parsed = ParamsSchema.safeParse(ctx?.params);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid slug." }, { status: 400 });
  }

  const { slug } = parsed.data;

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase.from("audits").select("audit_data").eq("slug", slug).maybeSingle();
  if (error) {
    return NextResponse.json({ error: "Failed to fetch audit." }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  let auditData: unknown = data.audit_data;
  if (typeof auditData === "string") {
    try {
      auditData = JSON.parse(auditData);
    } catch {
      // leave as-is
    }
  }

  const sanitized = stripEmailPII(auditData);
  return NextResponse.json(sanitized, {
    status: 200,
    headers: { "Cache-Control": "public, s-maxage=3600" }
  });
}

