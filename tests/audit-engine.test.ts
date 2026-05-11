import { describe, expect, test } from "vitest";
import { runAudit } from "../lib/audit-engine";

describe("audit-engine", () => {
  test("detects duplicate coding tools when user has Cursor + Copilot + Claude API", () => {
    const summary = runAudit({
      tools: [
        { toolId: "cursor", plan: "Pro", monthlySpend: 60, seats: 3 },
        { toolId: "github-copilot", plan: "Business", monthlySpend: 57, seats: 3 },
        { toolId: "anthropic-api", plan: "pay-per-token", monthlySpend: 120, seats: 1 }
      ],
      useCase: "coding",
      teamSize: 3
    });

    const copilot = summary.results.find((r) => r.toolId === "github-copilot")!;
    expect(copilot.recommendedAction).toBe("optimize");
    expect(copilot.savings).toBe(57);
    expect(copilot.reason.toLowerCase()).toContain("cursor");
    expect(copilot.reason.toLowerCase()).toContain("anthropic api");
    expect(copilot.reason.toLowerCase()).toContain("consolidating");
  });

  test("recommends downgrade from Business to Pro when only 2 seats used", () => {
    const summary = runAudit({
      tools: [{ toolId: "cursor", plan: "Business", monthlySpend: 80, seats: 2 }],
      useCase: "coding",
      teamSize: 2
    });

    const r = summary.results.find((x) => x.toolId === "cursor")!;
    expect(r.recommendedAction).toBe("downgrade");
    expect(r.recommendedPlan).toBe("Pro");
    expect(r.savings).toBe(40);
  });

  test("sets credexEligible=true when total monthly spend > $500", () => {
    const summary = runAudit({
      tools: [
        { toolId: "openai-api", plan: "pay-per-token", monthlySpend: 300, seats: 1 },
        { toolId: "anthropic-api", plan: "pay-per-token", monthlySpend: 250.01, seats: 1 }
      ],
      useCase: "mixed",
      teamSize: 5
    });
    expect(summary.credexEligible).toBe(true);
  });

  test("sets credexEligible=false when total monthly spend < $500", () => {
    const summary = runAudit({
      tools: [
        { toolId: "cursor", plan: "Pro", monthlySpend: 200, seats: 2 },
        { toolId: "chatgpt", plan: "Plus", monthlySpend: 200, seats: 2 }
      ],
      useCase: "mixed",
      teamSize: 4
    });
    expect(summary.credexEligible).toBe(false);
  });

  test("returns overallVerdict=optimized when savings < $50", () => {
    const summary = runAudit({
      tools: [
        { toolId: "cursor", plan: "Pro", monthlySpend: 20, seats: 1 },
        { toolId: "claude", plan: "Pro", monthlySpend: 20, seats: 1 }
      ],
      useCase: "mixed",
      teamSize: 2
    });
    expect(summary.totalMonthlySavings).toBeLessThan(50);
    expect(summary.overallVerdict).toBe("optimized");
  });

  test("returns overallVerdict=significant-savings when savings > $500", () => {
    const summary = runAudit({
      tools: [
        { toolId: "cursor", plan: "Pro", monthlySpend: 20, seats: 1 },
        { toolId: "github-copilot", plan: "Individual", monthlySpend: 600, seats: 1 },
        { toolId: "anthropic-api", plan: "pay-per-token", monthlySpend: 50, seats: 1 }
      ],
      useCase: "coding",
      teamSize: 2
    });
    expect(summary.totalMonthlySavings).toBeGreaterThan(500);
    expect(summary.overallVerdict).toBe("significant-savings");
  });

  test("use-case=coding prioritises coding tool recommendations", () => {
    const summary = runAudit({
      tools: [{ toolId: "gemini", plan: "Pro", monthlySpend: 200, seats: 1 }],
      useCase: "coding",
      teamSize: 1
    });
    const r = summary.results[0]!;
    expect(r.recommendedAction).toBe("switch");
    expect(r.alternativeTool).toBe("GitHub Copilot");
    expect(r.reason.toLowerCase()).toContain("coding");
  });

  test("zero-savings edge case: all tools already optimal returns empty savings", () => {
    const summary = runAudit({
      tools: [
        { toolId: "cursor", plan: "Pro", monthlySpend: 20, seats: 1 },
        { toolId: "claude", plan: "Pro", monthlySpend: 20, seats: 1 }
      ],
      useCase: "mixed",
      teamSize: 2
    });
    expect(summary.totalMonthlySavings).toBe(0);
    expect(summary.results.every((r) => r.savings === 0)).toBe(true);
  });

  test("handles single tool correctly without crashing", () => {
    expect(() =>
      runAudit({
        tools: [{ toolId: "cursor", plan: "Pro", monthlySpend: 20, seats: 1 }],
        useCase: "coding",
        teamSize: 1
      })
    ).not.toThrow();

    const summary = runAudit({
      tools: [{ toolId: "cursor", plan: "Pro", monthlySpend: 20, seats: 1 }],
      useCase: "coding",
      teamSize: 1
    });
    expect(summary.results).toHaveLength(1);
    expect(summary.results[0]!.toolId).toBe("cursor");
  });

  test("annual savings = monthly savings × 12", () => {
    const summary = runAudit({
      tools: [{ toolId: "cursor", plan: "Business", monthlySpend: 80, seats: 2 }],
      useCase: "coding",
      teamSize: 2
    });
    const r = summary.results.find((x) => x.toolId === "cursor")!;
    expect(r.savings).toBe(40);
    expect(r.annualSavings).toBeCloseTo(r.savings * 12, 5);
    expect(summary.totalAnnualSavings).toBeCloseTo(summary.totalMonthlySavings * 12, 5);
  });
});
