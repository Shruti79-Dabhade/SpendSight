# SpendSight → Credex — unit economics

## Deal value (average purchase)

Credex resells **discounted AI credits** (OpenAI, Anthropic, etc.). Realistic **first purchase** for a team that just discovered they can buy off-retail:

- **Small team (5–15 eng):** $1,500–$3,000 initial buy (test + cover 1–2 months of displaced retail/API).
- **Series A–B with heavy API:** $4,000–$10,000 initial buy after one procurement-friendly quote.

**Working average order value (AOV) for modeling:** **$4,500** first credit purchase (mid-weighted toward “serious” buyers who came from an audit showing **$500+/mo** in spend or savings).

## Gross margin on credit resale

Assume Credex secures **12–18%** margin after payment processing, breakage, and support—use **20%** as an **optimistic** cap and **16%** as **conservative** for first-principles math below.

## LTV (one converted credit buyer)

**Margin per deal** = AOV × gross margin.

- Conservative: $4,500 × **16%** = **$720** contribution per first purchase.
- Optimistic: $6,000 × **20%** = **$1,200** (slightly larger first buy).

**Repeat:** API-heavy teams reorder quarterly-ish once trust is established. Assume **1.4×** first-year repeat (conservative) vs **2.0×** (optimistic) on the same cohort.

| Scenario | Year-1 LTV (margin × repeat) |
|----------|------------------------------|
| Conservative | $720 × 1.4 ≈ **$1,008** |
| Optimistic | $1,200 × 2.0 = **$2,400** |

Use **~$1,200 LTV** as a **base case** for funnel math (between the two).

## Funnel (audit → revenue)

SpendSight funnel (illustrative, **per 1,000 completed audits**):

| Step | Rate | Count |
|------|------|-------|
| Audit completed | 100% | 1,000 |
| Email captured | **30%** | 300 |
| Consultation booked | **8%** of captures | 24 |
| Credit purchase | **35%** of consultations | **~8.4** |

So **~8–9 credit buyers per 1,000 audits** at base-case conversion.

**Year-1 gross margin from those buyers:** 8.4 × $1,200 ≈ **$10,080** per 1,000 audits (using blended LTV; sensitivity below).

## CAC by channel

| Channel | Notes | Implied CAC / audit |
|---------|--------|----------------------|
| Organic HN Show + Reddit + Slack | ~$0 cash; high founder time | **~$0** direct; treat **20–80 audits** per “big” post as burst |
| X DMs (organic) | ~$0 | **<$0.10** marginal |
| Paid Twitter/X lead form | $500 → **40–100** completed audits | **$5–$15** per **completed audit** (not click) |

CAC to a **paid credit customer** (not per audit):  
At 8.4 buyers / 1,000 audits, if paid channel delivered **all** 1,000 audits at **$10** each → **$10,000 / 8.4 ≈ $1,190** CAC per buyer—**still below $1,200 LTV** in base case, but **tight**; organic must anchor the mix.

## Break-even vs tool build cost

Assume **fully loaded** SpendSight build (eng + design + infra + legal) = **$8k–$15k** one-time.

**Margin per converted buyer (base):** ~$1,200.

**Buyers needed to recover $12k:** 12,000 / 1,200 = **10 credit purchases** (not audits).

From funnel above: **10 purchases ≈ 1,190 completed audits** (10 ÷ 0.0084).  
So break-even is **~1.2k high-quality audits** if the funnel holds—or **far fewer** if Credex nurtures existing leads (higher consultation → purchase rate).

## Path to $1M ARR (gross margin on credits)

**$1M ARR** here means **$1M/year in contribution margin** from credit resale attributed to this motion—not SaaS subscription ARR.

Required: **$1,000,000 / $1,200 ≈ 833 paying credit buyers / year** (base LTV in margin terms per year—simplify as “buyers per year” × margin per buyer).

833 buyers / 0.0084 ≈ **99,000 completed audits/year** at the **same** funnel—or improve conversion:

- If **consultation → purchase** rises to **50%** (strong Credex sales): 833 / (0.30 × 0.08 × 0.50) = **69,000 audits/year**.
- If **email capture** rises to **40%** and consult **10%**: buyers per 1k audits = 0.40 × 0.10 × 0.35 × 1000 = **14** → 833 / 14 ≈ **59,500 audits/year**.

**Reality:** a mix of **inbound audits + Credex list nurture** improves downstream rates; model **40% of revenue** from “audit-sourced” and **60%** from “Credex base + audit reactivation” once instrumentation exists.

## Summary table

| Metric | Conservative | Optimistic |
|--------|----------------|------------|
| First credit AOV | $3,000 | $8,000 |
| Gross margin % | 14% | 22% |
| Year-1 repeat multiplier | 1.2× | 2.2× |
| Email capture rate | 22% | 38% |
| Consult booked / capture | 5% | 12% |
| Purchase / consult | 28% | 45% |
| Buyers per 1,000 audits | ~4 | ~18 |
| Implied LTV (margin, yr1) | ~$750 | ~$2,800 |
| Break-even audits (@$12k build, base funnel) | ~2,500+ | ~600 |

Use the table to **stress-test**: if conservative row is true, paid social **must not** be the primary channel until capture and consult rates move toward optimistic.
