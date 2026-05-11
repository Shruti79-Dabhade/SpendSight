# SpendSight — metrics

## North Star

**Primary North Star:**  
**Number of completed audits where modeled monthly savings ≥ $200** (or total reported AI spend ≥ $500/mo if savings are suppressed but spend qualifies as “high-intent credit buyer”).

**Why this over “total audits”:** raw audit count rewards junk traffic and one-field abandoners. **≥$200/mo modeled savings** correlates with someone who **feels pain**, will **forward the link**, and is **economically interesting** for Credex-style credit conversations. It is a **quality lead** metric, not vanity.

**Supporting guardrail:** **completed audits / started audits** (completion rate)—if the North Star grows but completion collapses, you’re attracting clicks, not buyers.

---

## Three input metrics that drive the North Star

1. **Form completion rate** — % of sessions that start the spend form and **submit** a valid audit. Drives the denominator of quality audits; fix validation UX and perceived effort.

2. **Average modeled savings per completed audit** — tracks whether ICP (heavy stacks) is arriving vs tire-kickers. Segment by traffic source (HN vs X vs Credex email).

3. **Share / copy-link rate** — % of completed audits where user copies share URL or uses native share. High-intent audits that get **forwarded to finance** compound leads without ad spend.

---

## Instrument first (5 specific events)

Track in **PostHog** or **Amplitude** with stable names and properties (`savings_monthly`, `spend_total`, `source`, `tool_count`):

| # | Event name | Properties (minimum) |
|---|------------|----------------------|
| 1 | `audit_started` | `referrer`, `utm_*`, `device` |
| 2 | `audit_completed` | `tool_count`, `total_monthly_spend`, `total_monthly_savings`, `high_intent` (bool: savings ≥ 200 or spend ≥ 500) |
| 3 | `email_captured` | `placement` (modal vs footer), `high_intent` |
| 4 | `share_link_copied` | `high_intent` |
| 5 | `consult_cta_clicked` | `placement`, `high_intent` |

Add **server-side** `audit_persisted` if you save to DB—client events lie; DB is truth for “completed.”

---

## Pivot trigger (funnel broken)

**Red flag:** After **≥200 completed audits** from non-Credex organic traffic, **email capture rate < 15%** *and* **consult CTA CTR < 2%** among audits with **high_intent = true**.

Interpretation: the **value isn’t landing** post-results, or the **ask is mistimed** (too early, too vague). Pivot: change **headline + first screen** of results, reduce fields before value, or move email ask to **after** share interaction.

**Secondary red flag:** `high_intent` audits **< 12%** of completions—wrong channels or messaging attracting students/hobbyists; tighten distribution and copy.

---

## Why not DAU (daily active users)

SpendSight is **episodic**: a sane EM runs an audit **once a quarter** or at **renewal**, not daily. Optimizing **DAU** incentivizes **notification spam** or **fake engagement loops** that don’t produce credit buyers. Prefer **weekly qualified audits**, **North Star volume**, and **down-funnel conversion** over login habit metrics.
