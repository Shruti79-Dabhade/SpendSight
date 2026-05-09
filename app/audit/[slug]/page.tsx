import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AuditResults } from "@/components/AuditResults";
import { getSupabaseServerClient } from "@/lib/supabase";

type AuditRow = {
  id: string;
  slug: string;
  audit_data: unknown;
  created_at: string;
};

function formatUsd0(n: number) {
  const v = Number.isFinite(n) ? n : 0;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(v);
}

function toolIdsFromAudit(auditData: any): string[] {
  const results = Array.isArray(auditData?.results) ? auditData.results : [];
  const ids = results
    .map((r: any) => String(r?.toolId ?? ""))
    .filter((v: string) => v.trim().length > 0);
  return Array.from(new Set<string>(ids)).slice(0, 6);
}

async function fetchAuditBySlug(slug: string): Promise<AuditRow | null> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("audits")
    .select("id,slug,audit_data,created_at")
    .eq("slug", slug)
    .maybeSingle();

  if (error) return null;
  return (data as AuditRow) ?? null;
}

export async function generateMetadata({
  params
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const audit = await fetchAuditBySlug(params.slug);
  if (!audit) return { title: "SpendSight Audit" };

  const auditData: any = audit.audit_data;
  const savings = Number(auditData?.totalMonthlySavings ?? 0) || 0;
  const tools = toolIdsFromAudit(auditData);

  const title = `SpendSight Audit — Save ${formatUsd0(savings)}/month on AI tools`;
  const description =
    "See exactly where your team is overspending on Cursor, Claude, ChatGPT and more.";
  const ogImage = `/api/og?savings=${encodeURIComponent(String(Math.round(savings)))}&tools=${encodeURIComponent(
    tools.join(",")
  )}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [ogImage],
      type: "website"
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage]
    }
  };
}

export default async function AuditPage({ params }: { params: { slug: string } }) {
  const audit = await fetchAuditBySlug(params.slug);
  if (!audit) notFound();

  return (
    <AuditResults
      slug={audit.slug}
      auditId={audit.id}
      auditData={audit.audit_data}
      createdAt={audit.created_at}
    />
  );
}

