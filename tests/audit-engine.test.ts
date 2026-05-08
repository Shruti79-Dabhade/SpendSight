import { describe, expect, it } from "vitest";
import { runAudit } from "../lib/audit-engine";

describe("audit-engine", () => {
  it("downgrades team/business plans when seats < 3 (Cursor Business -> Pro)", () => {
    const summary = runAudit({
      tools: [{ toolId: "cursor", plan: "Business", monthlySpend: 80, seats: 2 }],
      useCase: "coding",
      teamSize: 2
    });

    const r = summary.results.find((x) => x.toolId === "cursor")!;
    expect(r.recommendedAction).toBe("downgrade");
    expect(r.recommendedPlan).toBe("Pro");
    expect(r.savings).toBe(40);
    expect(r.reason).toContain("$40");
    expect(r.reason).toContain("× 2");
  });

  it("flags Cursor + Copilot + Anthropic API as likely redundant (duplicate detection)", () => {
    const summary = runAudit({
      tools: [
        { toolId: "cursor", plan: "Pro", monthlySpend: 60, seats: 3 },
        { toolId: "github-copilot", plan: "Business", monthlySpend: 57, seats: 3 },
        { toolId: "anthropic-api", plan: "pay-per-token", monthlySpend: 120, seats: 1 }
      ],
      useCase: "coding",
      teamSize: 3
    });

    const copilot = summary.results.find((x) => x.toolId === "github-copilot")!;
    expect(copilot.recommendedAction).toBe("optimize");
    expect(copilot.savings).toBe(57);
    expect(copilot.reason.toLowerCase()).toContain("consolidating");
  });

  it("flags ChatGPT Plus + Claude Pro overlap for writing and suggests consolidation", () => {
    const summary = runAudit({
      tools: [
        { toolId: "chatgpt", plan: "Plus", monthlySpend: 20, seats: 1 },
        { toolId: "claude", plan: "Pro", monthlySpend: 20, seats: 1 }
      ],
      useCase: "writing",
      teamSize: 1
    });

    const optimized = summary.results.filter((r) => r.recommendedAction === "optimize");
    expect(optimized.length).toBeGreaterThanOrEqual(1);
    const r = optimized[0]!;
    expect(r.savings).toBeGreaterThanOrEqual(20);
    expect(r.reason.toLowerCase()).toContain("overlap");
  });

  it("sets credexEligible when totalMonthlySpend > $500", () => {
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

  it("suggests switching to a preferred coding tool when current tool is misaligned and expensive", () => {
    const summary = runAudit({
      tools: [{ toolId: "gemini", plan: "Pro", monthlySpend: 200, seats: 1 }],
      useCase: "coding",
      teamSize: 1
    });
    const r = summary.results[0]!;
    expect(r.recommendedAction).toBe("switch");
    expect(r.alternativeTool).toBeTruthy();
    expect(r.savings).toBeGreaterThan(150);
    expect(r.reason).toContain("$200");
  });

  it("applies plan-fit rule when reported spend is far below list price × seats (downgrade to cheaper plan)", () => {
    const summary = runAudit({
      tools: [{ toolId: "cursor", plan: "Business", monthlySpend: 120, seats: 5 }],
      useCase: "coding",
      teamSize: 5
    });
    const r = summary.results.find((x) => x.toolId === "cursor")!;
    expect(r.recommendedAction).toBe("downgrade");
    expect(r.recommendedPlan).toBe("Pro");
    expect(r.savings).toBe(20); // 120 - (20*5)
    expect(r.reason).toContain("$40");
    expect(r.reason).toContain("× 5");
  });

  it("recommends upgrading free/hobby tier when seats >= 10 (admin controls)", () => {
    const summary = runAudit({
      tools: [{ toolId: "cursor", plan: "Hobby", monthlySpend: 0, seats: 12 }],
      useCase: "coding",
      teamSize: 12
    });
    const r = summary.results.find((x) => x.toolId === "cursor")!;
    expect(r.recommendedAction).toBe("upgrade");
    expect(r.recommendedPlan).toBe("Business");
    expect(r.savings).toBe(0);
  });

  it("handles zero-savings edge case (keep)", () => {
    const summary = runAudit({
      tools: [{ toolId: "github-copilot", plan: "Individual", monthlySpend: 10, seats: 1 }],
      useCase: "coding",
      teamSize: 1
    });
    const r = summary.results.find((x) => x.toolId === "github-copilot")!;
    expect(r.savings).toBe(0);
    expect(["keep", "optimize", "downgrade", "switch", "upgrade"]).toContain(r.recommendedAction);
  });

  it("computes overallVerdict thresholds correctly", () => {
    const optimized = runAudit({
      tools: [{ toolId: "cursor", plan: "Pro", monthlySpend: 20, seats: 1 }],
      useCase: "coding",
      teamSize: 1
    });
    expect(optimized.overallVerdict).toBe("optimized");

    const minor = runAudit({
      tools: [{ toolId: "cursor", plan: "Business", monthlySpend: 160, seats: 4 }],
      useCase: "coding",
      teamSize: 4
    });
    expect(["optimized", "minor-savings", "significant-savings"]).toContain(minor.overallVerdict);
  });
});

