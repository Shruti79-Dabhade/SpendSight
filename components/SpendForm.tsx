"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useFieldArray, useForm, type FieldErrors, type Resolver } from "react-hook-form";
import { z } from "zod";

import { getAllTools, getPricingForTool, type Plan } from "@/lib/pricing-data";

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

const USE_CASES = ["Coding", "Writing", "Data", "Research", "Mixed"] as const;

const ToolRowSchema = z.object({
  toolId: z.string().min(1, "Select a tool"),
  planId: z.string().min(1, "Select a plan"),
  seats: z
    .number({ invalid_type_error: "Seats is required" })
    .int("Seats must be a whole number")
    .min(1, "Seats must be at least 1"),
  monthlySpend: z
    .number({ invalid_type_error: "Monthly spend is required" })
    .min(0, "Monthly spend must be ≥ 0")
});

export const SpendFormSchema = z.object({
  teamSize: z
    .number({ invalid_type_error: "Team size is required" })
    .int("Team size must be a whole number")
    .min(1, "Team size must be at least 1")
    .max(500, "Team size must be at most 500"),
  primaryUseCase: z.enum(USE_CASES, { required_error: "Select a primary use case" }),
  tools: z.array(ToolRowSchema).min(1, "Add at least one paid tool")
});

export type SpendFormValues = z.infer<typeof SpendFormSchema>;

type ApiAuditResponse = {
  slug: string;
};

function zodResolver<TSchema extends z.ZodTypeAny>(
  schema: TSchema
): Resolver<z.infer<TSchema>> {
  type Values = z.infer<TSchema>;

  return async (values) => {
    const parsed = schema.safeParse(values);
    if (parsed.success) return { values: parsed.data, errors: {} };

    const fieldErrors: FieldErrors<Values> = {};
    for (const issue of parsed.error.issues) {
      const path = issue.path.join(".");
      setPathError(fieldErrors, path, issue.message);
    }
    return { values: {} as any, errors: fieldErrors };
  };
}

function setPathError(target: FieldErrors<any>, path: string, message: string) {
  if (!path) {
    // Root-level error
    (target as any).root = { type: "validation", message };
    return;
  }

  const parts = path.split(".");
  let cursor: any = target;
  for (let i = 0; i < parts.length; i++) {
    const key = parts[i]!;
    const isLast = i === parts.length - 1;

    // Array index
    const idx = Number.isInteger(Number(key)) ? Number(key) : null;
    const nextKey = idx !== null ? idx : key;

    if (isLast) {
      cursor[nextKey] = { type: "validation", message };
    } else {
      cursor[nextKey] = cursor[nextKey] ?? {};
      cursor = cursor[nextKey];
    }
  }
}

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function formatUsd(n: number) {
  if (!Number.isFinite(n)) return "";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2
  }).format(n);
}

function getExpectedSpend(plan: Plan | undefined, seats: number | undefined) {
  if (!plan || !seats || !Number.isFinite(seats)) return 0;
  const price = Number(plan.pricePerSeat) || 0;
  return Math.max(0, price * seats);
}

function getStoredDefaults(): SpendFormValues | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem("spendsight_form");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const result = SpendFormSchema.safeParse(parsed);
    if (!result.success) return null;
    return result.data;
  } catch {
    return null;
  }
}

function ToolBadge({ toolId }: { toolId?: string }) {
  const emoji = toolId ? TOOL_EMOJI[toolId] : undefined;
  return (
    <span
      className={cn(
        "inline-flex size-7 items-center justify-center rounded-md border bg-muted text-sm",
        !emoji && "text-muted-foreground"
      )}
      aria-hidden="true"
    >
      {emoji ?? "•"}
    </span>
  );
}

const TOOL_OPTIONS = getAllTools().map((t) => ({ id: t.id, name: t.name }));

export function SpendForm() {
  const router = useRouter();
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<SpendFormValues>({
    mode: "onBlur",
    resolver: zodResolver(SpendFormSchema),
    defaultValues: {
      teamSize: 10,
      primaryUseCase: "Coding",
      tools: [{ toolId: "", planId: "", seats: 1, monthlySpend: 0 }]
    }
  });

  const { fields, append, remove, update } = useFieldArray({
    control: form.control,
    name: "tools"
  });

  // Restore localStorage values on mount.
  React.useEffect(() => {
    const stored = getStoredDefaults();
    if (stored) form.reset(stored, { keepDefaultValues: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist on every change.
  React.useEffect(() => {
    const sub = form.watch((values) => {
      try {
        window.localStorage.setItem("spendsight_form", JSON.stringify(values));
      } catch {
        // Ignore quota / privacy mode errors.
      }
    });
    return () => sub.unsubscribe();
  }, [form]);

  // Auto-calc monthly spend when plan/seats changes (but keep user edits otherwise).
  const watchedTools = form.watch("tools");
  const lastExpectedRef = React.useRef<Record<string, number>>({});

  React.useEffect(() => {
    watchedTools?.forEach((row, idx) => {
      const pricing = row?.toolId ? getPricingForTool(row.toolId) : undefined;
      const plan = pricing?.plans.find((p) => p.id === row?.planId);
      const expected = getExpectedSpend(plan, row?.seats);

      const key = `${idx}:${row?.toolId ?? ""}:${row?.planId ?? ""}:${row?.seats ?? ""}`;
      const prev = lastExpectedRef.current[key];

      // Only push a new value when the expected spend changes due to (tool/plan/seats).
      if (prev === undefined || prev !== expected) {
        lastExpectedRef.current[key] = expected;
        form.setValue(`tools.${idx}.monthlySpend`, expected, { shouldDirty: false });
      }
    });
  }, [watchedTools, form]);

  function transformFormData(values: SpendFormValues) {
    return {
      teamSize: values.teamSize,
      useCase: values.primaryUseCase.toLowerCase() as "coding" | "writing" | "data" | "research" | "mixed",
      tools: values.tools.map(tool => ({
        toolId: tool.toolId,
        plan: tool.planId,  // ❌ planId → plan
        monthlySpend: tool.monthlySpend,
        seats: tool.seats
      }))
    };
  }

  async function onSubmit(values: SpendFormValues) {
    setSubmitError(null);
    setIsSubmitting(true);
    try {
      // ✅ Transform to match API schema
    const payload = transformFormData(values);
    console.log("Sending payload:", JSON.stringify(payload, null, 2));
    
      // const res = await fetch("/api/audit", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify(values)
      // });
      const res = await fetch("/api/audit", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(payload)  // ✅ Now matches exactly
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || "Request failed");
      }

  //     const json = (await res.json()) as Partial<ApiAuditResponse>;
  //     if (!json.slug || typeof json.slug !== "string") throw new Error("Invalid API response");

  //     router.push(`/audit/${encodeURIComponent(json.slug)}`);
  //   } catch (e) {
  //     const msg = e instanceof Error ? e.message : "Something went wrong";
  //     setSubmitError(msg);
  //   } finally {
  //     setIsSubmitting(false);
  //   }
  // }
  const json = await res.json() as ApiAuditResponse;
    router.push(`/audit/${encodeURIComponent(json.slug)}`);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Something went wrong";
    setSubmitError(msg);
  } finally {
    setIsSubmitting(false);
  }
}

  const toolsErrorId = "tools-error";
  const submitErrorId = "submit-error";

  return (
    <form
      className="grid gap-6 lg:grid-cols-2"
      onSubmit={form.handleSubmit(onSubmit, () => {
        const el = document.querySelector<HTMLElement>("[data-field-error='true']");
        el?.focus();
      })}
      aria-describedby={cn(form.formState.errors.tools ? toolsErrorId : undefined, submitError ? submitErrorId : undefined)}
    >
      {/* Left: Team */}
      <section className="rounded-xl border bg-card p-5 shadow-sm">
        <header className="mb-4">
          <h2 className="text-base font-semibold">Section 1 — Your team</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            This helps us right-size seats and recommend the best plan tier.
          </p>
        </header>

        <div className="grid gap-4">
          <Field
            label="Team size"
            hint="1–500 people"
            error={form.formState.errors.teamSize?.message}
            inputId="teamSize"
          >
            <input
              id="teamSize"
              type="number"
              inputMode="numeric"
              min={1}
              max={500}
              step={1}
              className={inputClass(!!form.formState.errors.teamSize)}
              {...form.register("teamSize", { valueAsNumber: true })}
              aria-invalid={!!form.formState.errors.teamSize}
              aria-describedby={cn("teamSize-hint", form.formState.errors.teamSize ? "teamSize-error" : undefined)}
              data-field-error={form.formState.errors.teamSize ? "true" : undefined}
            />
          </Field>

          <Field
            label="Primary use case"
            hint="Pick the workflow your team uses most."
            error={form.formState.errors.primaryUseCase?.message}
            inputId="primaryUseCase"
          >
            <select
              id="primaryUseCase"
              className={selectClass(!!form.formState.errors.primaryUseCase)}
              {...form.register("primaryUseCase")}
              aria-invalid={!!form.formState.errors.primaryUseCase}
              aria-describedby={cn(
                "primaryUseCase-hint",
                form.formState.errors.primaryUseCase ? "primaryUseCase-error" : undefined
              )}
              data-field-error={form.formState.errors.primaryUseCase ? "true" : undefined}
            >
              {USE_CASES.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </section>

      {/* Right: Tools */}
      <section className="rounded-xl border bg-card p-5 shadow-sm">
        <header className="mb-4">
          <h2 className="text-base font-semibold">Section 2 — AI tools you pay for</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Add each tool (and plan) your team is currently paying for.
          </p>
        </header>

        <div className="grid gap-4">
          {fields.map((f, idx) => {
            const toolId = watchedTools?.[idx]?.toolId;
            const pricing = toolId ? getPricingForTool(toolId) : undefined;
            const plans = pricing?.plans ?? [];

            const planId = watchedTools?.[idx]?.planId;
            const plan = planId ? plans.find((p) => p.id === planId) : undefined;
            const expected = getExpectedSpend(plan, watchedTools?.[idx]?.seats);

            const rowErrors = form.formState.errors.tools?.[idx];
            const toolSelectId = `tools.${idx}.toolId` as const;
            const planSelectId = `tools.${idx}.planId` as const;
            const seatsId = `tools.${idx}.seats` as const;
            const spendId = `tools.${idx}.monthlySpend` as const;

            return (
              <div key={f.id} className="rounded-xl border bg-background p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <ToolBadge toolId={toolId} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        Tool {idx + 1}
                        {toolId ? (
                          <span className="ml-2 text-muted-foreground">
                            {TOOL_OPTIONS.find((t) => t.id === toolId)?.name ?? toolId}
                          </span>
                        ) : null}
                      </p>
                      <p className="text-xs text-muted-foreground">Select tool, plan, seats, and spend.</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => remove(idx)}
                    className={cn(
                      "rounded-md px-2 py-1 text-sm font-medium",
                      "text-muted-foreground hover:text-foreground hover:bg-muted",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    )}
                    aria-label={`Remove tool row ${idx + 1}`}
                    disabled={fields.length <= 1}
                  >
                    Remove
                  </button>
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <Field
                    label="Tool"
                    error={rowErrors?.toolId?.message}
                    inputId={`tool-${idx}`}
                  >
                    <select
                      id={`tool-${idx}`}
                      className={selectClass(!!rowErrors?.toolId)}
                      value={watchedTools?.[idx]?.toolId ?? ""}
                      onChange={(e) => {
                        const nextToolId = e.target.value;
                        const nextPricing = nextToolId ? getPricingForTool(nextToolId) : undefined;
                        const nextPlans = nextPricing?.plans ?? [];
                        const nextPlanId = nextPlans[0]?.id ?? "";
                        update(idx, {
                          toolId: nextToolId,
                          planId: nextPlanId,
                          seats: watchedTools?.[idx]?.seats ?? 1,
                          monthlySpend: watchedTools?.[idx]?.monthlySpend ?? 0
                        });
                        form.clearErrors(`tools.${idx}`);
                      }}
                      aria-invalid={!!rowErrors?.toolId}
                      aria-describedby={rowErrors?.toolId ? `tool-${idx}-error` : undefined}
                      data-field-error={rowErrors?.toolId ? "true" : undefined}
                      required
                    >
                      <option value="" disabled>
                        Select a tool…
                      </option>
                      {TOOL_OPTIONS.map((t) => (
                        <option key={t.id} value={t.id}>
                          {TOOL_EMOJI[t.id] ? `${TOOL_EMOJI[t.id]} ` : ""}
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field
                    label="Plan"
                    error={rowErrors?.planId?.message}
                    inputId={`plan-${idx}`}
                  >
                    <select
                      id={`plan-${idx}`}
                      className={selectClass(!!rowErrors?.planId)}
                      disabled={!toolId}
                      value={watchedTools?.[idx]?.planId ?? ""}
                      onChange={(e) => {
                        form.setValue(planSelectId, e.target.value, { shouldDirty: true, shouldTouch: true });
                      }}
                      aria-invalid={!!rowErrors?.planId}
                      aria-describedby={rowErrors?.planId ? `plan-${idx}-error` : undefined}
                      data-field-error={rowErrors?.planId ? "true" : undefined}
                      required
                    >
                      <option value="" disabled>
                        {toolId ? "Select a plan…" : "Pick a tool first…"}
                      </option>
                      {plans.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                          {p.pricePerSeat > 0 ? ` — ${formatUsd(p.pricePerSeat)}/seat` : " — $0/seat or usage-based"}
                        </option>
                      ))}
                    </select>
                    {toolId && plan ? (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Expected:{" "}
                        <span className="font-medium text-foreground">{formatUsd(expected)}</span>/month
                      </p>
                    ) : null}
                  </Field>

                  <Field
                    label="Seats"
                    error={rowErrors?.seats?.message}
                    inputId={`seats-${idx}`}
                  >
                    <input
                      id={`seats-${idx}`}
                      type="number"
                      inputMode="numeric"
                      min={1}
                      step={1}
                      className={inputClass(!!rowErrors?.seats)}
                      {...form.register(seatsId, { valueAsNumber: true })}
                      aria-invalid={!!rowErrors?.seats}
                      aria-describedby={rowErrors?.seats ? `seats-${idx}-error` : undefined}
                      data-field-error={rowErrors?.seats ? "true" : undefined}
                      required
                    />
                  </Field>

                  <Field
                    label="Monthly spend (USD)"
                    error={rowErrors?.monthlySpend?.message}
                    inputId={`spend-${idx}`}
                  >
                    <input
                      id={`spend-${idx}`}
                      type="number"
                      inputMode="decimal"
                      min={0}
                      step={0.01}
                      className={inputClass(!!rowErrors?.monthlySpend)}
                      {...form.register(spendId, { valueAsNumber: true })}
                      aria-invalid={!!rowErrors?.monthlySpend}
                      aria-describedby={rowErrors?.monthlySpend ? `spend-${idx}-error` : undefined}
                      data-field-error={rowErrors?.monthlySpend ? "true" : undefined}
                      required
                    />
                    <p className="mt-1 text-xs text-muted-foreground">
                      Auto-filled from plan × seats, but you can edit.
                    </p>
                  </Field>
                </div>
              </div>
            );
          })}

          {form.formState.errors.tools?.message ? (
            <p id={toolsErrorId} className="text-sm text-destructive" role="alert">
              {form.formState.errors.tools.message}
            </p>
          ) : null}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={() => append({ toolId: "", planId: "", seats: 1, monthlySpend: 0 })}
              className={cn(
                "inline-flex items-center justify-center rounded-md border bg-background px-3 py-2 text-sm font-medium",
                "hover:bg-muted",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              )}
            >
              Add another tool
            </button>

            <div className="text-xs text-muted-foreground" aria-label="Hint">
              Tip: include both seat-based tools and APIs you pay for.
            </div>
          </div>
        </div>
      </section>

      {/* Submit */}
      <section className="lg:col-span-2">
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <h2 className="text-base font-semibold">Section 3 — Submit</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            We’ll generate a personalized audit with savings opportunities.
          </p>

          {submitError ? (
            <div
              className="mt-4 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
              role="alert"
              id={submitErrorId}
              tabIndex={-1}
            >
              {submitError}
            </div>
          ) : null}

          <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="submit"
              disabled={isSubmitting}
              className={cn(
                "inline-flex w-full items-center justify-center rounded-md bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-sm",
                "hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed sm:w-auto",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              )}
            >
              {isSubmitting ? "Processing…" : "Get my free audit →"}
            </button>

            <p className="text-xs text-muted-foreground">
              Free. No login. Takes 60 seconds.
            </p>
          </div>
        </div>
      </section>
    </form>
  );
}

function Field(props: {
  label: string;
  hint?: string;
  error?: string;
  inputId: string;
  children: React.ReactNode;
}) {
  const hintId = `${props.inputId}-hint`;
  const errId = `${props.inputId}-error`;
  return (
    <div className="grid gap-1.5">
      <label htmlFor={props.inputId} className="text-sm font-medium">
        {props.label}
      </label>
      {props.children}
      {props.hint ? (
        <p id={hintId} className="text-xs text-muted-foreground">
          {props.hint}
        </p>
      ) : null}
      {props.error ? (
        <p id={errId} className="text-xs text-destructive" role="alert">
          {props.error}
        </p>
      ) : null}
    </div>
  );
}

function inputClass(isInvalid: boolean) {
  return cn(
    "h-10 w-full rounded-md border bg-background px-3 py-2 text-sm shadow-sm",
    "placeholder:text-muted-foreground",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    isInvalid ? "border-destructive focus-visible:ring-destructive" : "border-input"
  );
}

function selectClass(isInvalid: boolean) {
  return cn(
    "h-10 w-full rounded-md border bg-background px-3 py-2 text-sm shadow-sm",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    isInvalid ? "border-destructive focus-visible:ring-destructive" : "border-input"
  );
}

