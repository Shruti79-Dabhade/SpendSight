import { z } from "zod";
import { getAllTools, getPricingForTool, type ToolPricing } from "./pricing-data";

export const UseCaseSchema = z.enum(["coding", "writing", "data", "research", "mixed"]);
export type UseCase = z.infer<typeof UseCaseSchema>;

export const ToolEntrySchema = z.object({
  toolId: z.string().min(1),
  plan: z.string().min(1),
  monthlySpend: z.number().nonnegative(),
  seats: z.number().int().nonnegative()
});

export type ToolEntry = z.infer<typeof ToolEntrySchema>;

export const AuditResultSchema = z.object({
  toolId: z.string().min(1),
  toolName: z.string().min(1),
  currentSpend: z.number().nonnegative(),
  recommendedAction: z.enum(["downgrade", "switch", "optimize", "keep", "upgrade"]),
  recommendedPlan: z.string().optional(),
  alternativeTool: z.string().optional(),
  savings: z.number().nonnegative(),
  annualSavings: z.number().nonnegative(),
  reason: z.string().min(1),
  priority: z.enum(["high", "medium", "low"])
});

export type AuditResult = z.infer<typeof AuditResultSchema>;

export const AuditSummarySchema = z.object({
  totalMonthlySavings: z.number().nonnegative(),
  totalAnnualSavings: z.number().nonnegative(),
  results: z.array(AuditResultSchema),
  credexEligible: z.boolean(),
  overallVerdict: z.enum(["optimized", "minor-savings", "significant-savings"])
});

export type AuditSummary = z.infer<typeof AuditSummarySchema>;

type Action = AuditResult["recommendedAction"];
type Priority = AuditResult["priority"];

function toUsd(n: number): string {
  const rounded = Math.round((n + Number.EPSILON) * 100) / 100;
  return `$${rounded.toFixed(rounded % 1 === 0 ? 0 : 2)}`;
}

function normalizePlanKey(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, "-");
}

function pickPriority(savings: number, action: Action): Priority {
  if (action === "upgrade") return "low";
  if (savings >= 200) return "high";
  if (savings >= 50) return "medium";
  return action === "keep" ? "low" : "low";
}

function annualize(monthly: number): number {
  return Math.max(0, Math.round((monthly + Number.EPSILON) * 12 * 100) / 100);
}

function findPlan(tool: ToolPricing | undefined, planInput: string) {
  if (!tool) return undefined;
  const key = normalizePlanKey(planInput);
  return tool.plans.find((p) => p.id === key) ?? tool.plans.find((p) => normalizePlanKey(p.name) === key);
}

function planMonthlyCostUsd(planPricePerSeat: number | undefined, seats: number): number | undefined {
  if (planPricePerSeat == null) return undefined;
  if (planPricePerSeat <= 0) return undefined;
  return Math.max(0, planPricePerSeat * Math.max(0, seats));
}

function isTeamLikePlan(planIdOrName: string): boolean {
  const k = normalizePlanKey(planIdOrName);
  return k.includes("team") || k.includes("business") || k.includes("teams");
}

function isFreeLikePlan(planIdOrName: string): boolean {
  const k = normalizePlanKey(planIdOrName);
  return k.includes("free") || k.includes("hobby");
}

function clampNonNegative(n: number): number {
  return Math.max(0, Math.round((n + Number.EPSILON) * 100) / 100);
}

function preferToolsForUseCase(useCase: UseCase): string[] {
  if (useCase === "coding") return ["cursor", "github-copilot", "claude"];
  if (useCase === "writing") return ["claude", "chatgpt", "gemini"];
  if (useCase === "research") return ["claude", "chatgpt"];
  if (useCase === "data") return ["chatgpt", "claude", "gemini"];
  return ["cursor", "github-copilot", "claude", "chatgpt", "gemini"];
}

function recommendedDefaultPlan(toolId: string, useCase: UseCase): string | undefined {
  if (toolId === "cursor") return "Pro";
  if (toolId === "github-copilot") return "Individual";
  if (toolId === "claude") return useCase === "research" ? "Max" : "Pro";
  if (toolId === "chatgpt") return "Plus";
  if (toolId === "gemini") return "Pro";
  return undefined;
}

function cheapestPreferredAlternative(
  useCase: UseCase,
  seats: number,
  alreadyHave: Set<string>
): { toolId: string; toolName: string; planName: string; estimatedMonthlyCost: number } | undefined {
  const preferred = preferToolsForUseCase(useCase);
  const candidates = preferred.filter((id) => !alreadyHave.has(id));
  let best:
    | { toolId: string; toolName: string; planName: string; estimatedMonthlyCost: number }
    | undefined;

  for (const toolId of candidates) {
    const tool = getPricingForTool(toolId);
    if (!tool) continue;
    const desiredPlanName = recommendedDefaultPlan(toolId, useCase);
    if (!desiredPlanName) continue;
    const plan = findPlan(tool, desiredPlanName);
    if (!plan) continue;
    if (plan.minSeats != null && seats < plan.minSeats) continue;
    const cost = planMonthlyCostUsd(plan.pricePerSeat, seats);
    if (cost == null) continue;
    const candidate = { toolId, toolName: tool.name, planName: plan.name, estimatedMonthlyCost: cost };
    if (!best || candidate.estimatedMonthlyCost < best.estimatedMonthlyCost) best = candidate;
  }
  return best;
}

export function runAudit(input: {
  tools: ToolEntry[];
  useCase: UseCase;
  teamSize: number;
}): AuditSummary {
  const ToolsArraySchema = z.array(ToolEntrySchema).min(0);
  const InputSchema = z.object({
    tools: ToolsArraySchema,
    useCase: UseCaseSchema,
    teamSize: z.number().int().nonnegative()
  });
  const { tools, useCase } = InputSchema.parse(input);

  const toolCatalog = new Map(getAllTools().map((t) => [t.id, t]));
  const presentToolIds = new Set(tools.map((t) => t.toolId));
  const totalMonthlySpend = tools.reduce((sum, t) => sum + t.monthlySpend, 0);
  const credexEligible = totalMonthlySpend > 500;

  const results: AuditResult[] = tools.map((entry) => {
    const toolPricing = toolCatalog.get(entry.toolId);
    const toolName = toolPricing?.name ?? entry.toolId;
    const plan = findPlan(toolPricing, entry.plan);
    const knownCurrentPlanCost = planMonthlyCostUsd(plan?.pricePerSeat, entry.seats);

    let recommendedAction: Action = "keep";
    let recommendedPlan: string | undefined;
    let alternativeTool: string | undefined;
    let savings = 0;
    let reason = `No clear savings identified; keep ${toolName} as-is at ${toUsd(entry.monthlySpend)}/mo.`;

    // Rule 1: Overpaying for seats on team/business plans for small seat counts
    if (entry.seats > 0 && entry.seats < 3 && isTeamLikePlan(plan?.id ?? entry.plan)) {
      const candidatePlanName =
        toolPricing?.id === "chatgpt"
          ? "Plus"
          : toolPricing?.id === "github-copilot"
            ? "Individual"
            : toolPricing?.id === "claude"
              ? "Pro"
              : toolPricing?.id === "windsurf"
                ? "Pro"
                : toolPricing?.id === "cursor"
                  ? "Pro"
                  : undefined;
      const candidatePlan = candidatePlanName ? findPlan(toolPricing, candidatePlanName) : undefined;
      const candidateCost = planMonthlyCostUsd(candidatePlan?.pricePerSeat, entry.seats);

      if (candidatePlan && candidateCost != null) {
        const baseline = knownCurrentPlanCost ?? entry.monthlySpend;
        const computedSavings = clampNonNegative(entry.monthlySpend - candidateCost);
        recommendedAction = "downgrade";
        recommendedPlan = candidatePlan.name;
        savings = computedSavings;
        reason =
          `You're paying ${toUsd(plan?.pricePerSeat ?? baseline / Math.max(1, entry.seats))}/seat × ${entry.seats} seats = ` +
          `${toUsd(baseline)}/mo on ${toolName} ${plan?.name ?? entry.plan}, but ${toolName} ${candidatePlan.name} at ` +
          `${toUsd(candidatePlan.pricePerSeat)}/seat × ${entry.seats} = ${toUsd(candidateCost)}/mo saves ${toUsd(
            baseline - candidateCost
          )}/mo.`.replace(`${toUsd(baseline - candidateCost)}/mo`, `${toUsd(computedSavings)}/mo`);
      }
    }

    // Rule 5a: Free/Hobby used at team scale
    if (recommendedAction === "keep" && entry.seats >= 10 && isFreeLikePlan(plan?.id ?? entry.plan)) {
      const teamPlanName =
        toolPricing?.id === "cursor"
          ? "Business"
          : toolPricing?.id === "windsurf"
            ? "Team"
            : toolPricing?.id === "claude"
              ? "Team"
              : toolPricing?.id === "chatgpt"
                ? "Team"
                : undefined;
      const teamPlan = teamPlanName ? findPlan(toolPricing, teamPlanName) : undefined;
      const teamCost = planMonthlyCostUsd(teamPlan?.pricePerSeat, entry.seats);
      recommendedAction = "upgrade";
      recommendedPlan = teamPlan?.name ?? teamPlanName;
      savings = 0;
      reason =
        `With ${entry.seats} seats on a free tier, move to a team plan for admin controls; e.g., ` +
        `${toolName} ${recommendedPlan ?? "Team"} would be ${teamCost != null ? `${toUsd(teamPlan!.pricePerSeat)}/seat × ${entry.seats} = ${toUsd(teamCost)}/mo` : "priced per seat"} ` +
        `while you currently report ${toUsd(entry.monthlySpend)}/mo.`;
    }

    // Rule 5b: Plan fit (spend significantly below list price × seats -> suggests downgrade)
    if (recommendedAction === "keep" && toolPricing && plan && knownCurrentPlanCost != null) {
      if (entry.monthlySpend > 0 && entry.monthlySpend <= knownCurrentPlanCost * 0.8) {
        const cheaperPlans = toolPricing.plans
          .filter((p) => p.pricePerSeat > 0 && p.pricePerSeat < plan.pricePerSeat)
          .filter((p) => (p.minSeats == null ? true : entry.seats >= p.minSeats))
          .sort((a, b) => a.pricePerSeat - b.pricePerSeat);
        const candidate = cheaperPlans[0];
        const candidateCost = candidate ? planMonthlyCostUsd(candidate.pricePerSeat, entry.seats) : undefined;
        if (candidate && candidateCost != null) {
          const computedSavings = clampNonNegative(entry.monthlySpend - candidateCost);
          recommendedAction = "downgrade";
          recommendedPlan = candidate.name;
          savings = computedSavings;
          reason =
            `You report ${toUsd(entry.monthlySpend)}/mo on ${toolName} ${plan.name}, which is well below list price ` +
            `${toUsd(plan.pricePerSeat)}/seat × ${entry.seats} = ${toUsd(knownCurrentPlanCost)}/mo; ` +
            `${toolName} ${candidate.name} at ${toUsd(candidate.pricePerSeat)}/seat × ${entry.seats} = ${toUsd(candidateCost)}/mo ` +
            `would save ${toUsd(entry.monthlySpend - candidateCost)}/mo.`
              .replace(`${toUsd(entry.monthlySpend - candidateCost)}/mo`, `${toUsd(computedSavings)}/mo`);
        }
      }
    }

    // Rule 1b: Large orgs should evaluate Enterprise
    if (recommendedAction === "keep" && entry.seats > 50 && toolPricing) {
      const enterprisePlan = toolPricing.plans.find((p) => normalizePlanKey(p.name) === "enterprise");
      if (enterprisePlan) {
        recommendedAction = "optimize";
        recommendedPlan = "Enterprise (quote)";
        savings = 0;
        reason =
          `With ${entry.seats} seats, request an Enterprise quote to validate per-seat economics; you currently report ` +
          `${toUsd(entry.monthlySpend)}/mo, and Enterprise may offer better unit pricing at this scale.`;
      }
    }

    // Rule 2: Wrong plan/tool for the use case (switch suggestion when not aligned)
    if (recommendedAction === "keep" && !preferToolsForUseCase(useCase).includes(entry.toolId)) {
      const alt = cheapestPreferredAlternative(useCase, Math.max(1, entry.seats), presentToolIds);
      if (alt && entry.monthlySpend > alt.estimatedMonthlyCost + 10) {
        const computedSavings = clampNonNegative(entry.monthlySpend - alt.estimatedMonthlyCost);
        recommendedAction = "switch";
        alternativeTool = alt.toolName;
        recommendedPlan = alt.planName;
        savings = computedSavings;
        reason =
          `For a ${useCase} workflow, ${alt.toolName} (${alt.planName}) is a closer fit: estimated ` +
          `${toUsd(alt.estimatedMonthlyCost)}/mo (${toUsd(alt.estimatedMonthlyCost / Math.max(1, entry.seats))}/seat × ${Math.max(1, entry.seats)}), ` +
          `vs your current ${toolName} spend of ${toUsd(entry.monthlySpend)}/mo, saving ${toUsd(entry.monthlySpend - alt.estimatedMonthlyCost)}/mo.`
            .replace(`${toUsd(entry.monthlySpend - alt.estimatedMonthlyCost)}/mo`, `${toUsd(computedSavings)}/mo`);
      }
    }

    const priority = pickPriority(savings, recommendedAction);
    const annualSavings = annualize(savings);

    return {
      toolId: entry.toolId,
      toolName,
      currentSpend: clampNonNegative(entry.monthlySpend),
      recommendedAction,
      recommendedPlan,
      alternativeTool,
      savings: clampNonNegative(savings),
      annualSavings,
      reason,
      priority
    };
  });

  // Rule 3: Duplicate tool detection adjustments (add/override recommendations where defensible)
  const byId = new Map(results.map((r) => [r.toolId, r]));

  const hasCursor = presentToolIds.has("cursor");
  const hasCopilot = presentToolIds.has("github-copilot");
  const hasClaudeApi = presentToolIds.has("anthropic-api");
  if (hasCursor && hasCopilot && hasClaudeApi) {
    const copilot = byId.get("github-copilot");
    if (copilot) {
      const savings = clampNonNegative(copilot.currentSpend);
      byId.set("github-copilot", {
        ...copilot,
        recommendedAction: copilot.recommendedAction === "downgrade" ? copilot.recommendedAction : "optimize",
        recommendedPlan: copilot.recommendedPlan,
        savings,
        annualSavings: annualize(savings),
        priority: savings >= 50 ? "high" : "medium",
        reason:
          `You have Cursor (${toUsd(byId.get("cursor")?.currentSpend ?? 0)}/mo), Copilot (${toUsd(
            copilot.currentSpend
          )}/mo), and Anthropic API (${toUsd(byId.get("anthropic-api")?.currentSpend ?? 0)}/mo); ` +
          `consolidating to one coding assistant can eliminate up to ${toUsd(copilot.currentSpend)}/mo (e.g., Copilot).`
      });
    }
  }

  const hasChatgptPlus = presentToolIds.has("chatgpt");
  const hasClaude = presentToolIds.has("claude");
  if (useCase === "writing" && hasChatgptPlus && hasClaude) {
    const chatgpt = byId.get("chatgpt");
    const claude = byId.get("claude");
    if (chatgpt && claude) {
      const cut = chatgpt.currentSpend >= claude.currentSpend ? chatgpt : claude;
      const keep = cut.toolId === "chatgpt" ? claude : chatgpt;
      const savings = clampNonNegative(cut.currentSpend);
      byId.set(cut.toolId, {
        ...cut,
        recommendedAction: "optimize",
        alternativeTool: keep.toolName,
        savings,
        annualSavings: annualize(savings),
        priority: savings >= 50 ? "high" : "medium",
        reason:
          `For writing, ${chatgpt.toolName} (${toUsd(chatgpt.currentSpend)}/mo) and ${claude.toolName} (${toUsd(
            claude.currentSpend
          )}/mo) overlap; consolidating to one can save up to ${toUsd(savings)}/mo by dropping ${cut.toolName}.`
      });
    }
  }

  const finalResults = Array.from(byId.values());
  const totalMonthlySavings = clampNonNegative(finalResults.reduce((sum, r) => sum + r.savings, 0));
  const totalAnnualSavings = annualize(totalMonthlySavings);

  const overallVerdict: AuditSummary["overallVerdict"] =
    totalMonthlySavings < 50 ? "optimized" : totalMonthlySavings <= 500 ? "minor-savings" : "significant-savings";

  return AuditSummarySchema.parse({
    totalMonthlySavings,
    totalAnnualSavings,
    results: finalResults,
    credexEligible,
    overallVerdict
  });
}

