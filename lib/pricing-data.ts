import { z } from "zod";

export type PricingCategory = "coding" | "writing" | "general" | "api";

export type Plan = {
  id: string;
  name: string;
  /**
   * USD per user per month. For pay-per-token API offerings, this is `0` and the
   * token pricing is described in `description`.
   */
  pricePerSeat: number;
  minSeats?: number;
  maxSeats?: number;
  description: string;
  bestFor: string[];
};

export type ToolPricing = {
  id: string; // slug
  name: string;
  plans: Plan[];
  category: PricingCategory;
  pricingUrl: string;
  verifiedDate: string; // YYYY-MM-DD
};

export const PlanSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  pricePerSeat: z.number().nonnegative(),
  minSeats: z.number().int().positive().optional(),
  maxSeats: z.number().int().positive().optional(),
  description: z.string().min(1),
  bestFor: z.array(z.string().min(1)).min(1)
});

export const ToolPricingSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  plans: z.array(PlanSchema).min(1),
  category: z.enum(["coding", "writing", "general", "api"]),
  pricingUrl: z.string().url(),
  verifiedDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "verifiedDate must be YYYY-MM-DD")
});

export const PricingDatabaseSchema = z.array(ToolPricingSchema);

const VERIFIED_DATE = "2026-05-07";

const PRICING_TOOLS_RAW: ToolPricing[] = [
  {
    id: "cursor",
    name: "Cursor",
    category: "coding",
    pricingUrl: "https://www.cursor.com/pricing",
    verifiedDate: VERIFIED_DATE,
    plans: [
      {
        id: "hobby",
        name: "Hobby",
        pricePerSeat: 0,
        description: "Free plan for individuals with limited usage.",
        bestFor: ["Trying Cursor", "Personal projects", "Light usage"]
      },
      {
        id: "pro",
        name: "Pro",
        pricePerSeat: 20,
        description: "Individual paid plan with higher usage limits and model access.",
        bestFor: ["Solo developers", "Daily coding", "Full-time use"]
      },
      {
        id: "business",
        name: "Business",
        pricePerSeat: 40,
        description:
          "Team plan with centralized billing and organization controls (listed as Teams/Business).",
        bestFor: ["Teams", "Centralized billing", "Org controls & SSO needs"]
      },
      {
        id: "enterprise",
        name: "Enterprise",
        pricePerSeat: 0,
        description: "Custom pricing (contact sales).",
        bestFor: ["Large orgs", "Security/compliance", "Procurement & invoicing"]
      }
    ]
  },
  {
    id: "github-copilot",
    name: "GitHub Copilot",
    category: "coding",
    pricingUrl: "https://github.com/features/copilot/plans/",
    verifiedDate: VERIFIED_DATE,
    plans: [
      {
        id: "individual",
        name: "Individual",
        pricePerSeat: 10,
        description: "Individual subscription plan.",
        bestFor: ["Solo developers", "Personal use", "Learning"]
      },
      {
        id: "business",
        name: "Business",
        pricePerSeat: 19,
        description: "Organization plan with admin controls.",
        bestFor: ["Teams", "Policy controls", "Centralized billing"]
      },
      {
        id: "enterprise",
        name: "Enterprise",
        pricePerSeat: 39,
        description: "Enterprise plan with additional governance and controls.",
        bestFor: ["Enterprises", "Security/compliance", "Advanced controls"]
      }
    ]
  },
  {
    id: "claude",
    name: "Claude by Anthropic",
    category: "general",
    pricingUrl: "https://claude.com/pricing",
    verifiedDate: VERIFIED_DATE,
    plans: [
      {
        id: "free",
        name: "Free",
        pricePerSeat: 0,
        description: "Free plan with limited usage.",
        bestFor: ["Trying Claude", "Light personal use", "Occasional tasks"]
      },
      {
        id: "pro",
        name: "Pro",
        pricePerSeat: 20,
        description: "Individual paid plan with increased limits and features.",
        bestFor: ["Power users", "Daily writing/research", "Advanced features"]
      },
      {
        id: "max",
        name: "Max",
        pricePerSeat: 100,
        description: "Higher-usage individual plan (Max 5x tier).",
        bestFor: ["Heavy usage", "High-volume workflows", "Priority access"]
      },
      {
        id: "team",
        name: "Team",
        pricePerSeat: 30,
        minSeats: 5,
        description: "Team plan with collaboration and admin controls (minimum 5 seats).",
        bestFor: ["Teams", "Shared workflows", "Admin controls"]
      },
      {
        id: "enterprise",
        name: "Enterprise",
        pricePerSeat: 0,
        description: "Custom pricing (contact sales).",
        bestFor: ["Enterprises", "SSO/SCIM", "Compliance & governance"]
      }
    ]
  },
  {
    id: "chatgpt",
    name: "ChatGPT",
    category: "general",
    pricingUrl: "https://chatgpt.com/pricing/",
    verifiedDate: VERIFIED_DATE,
    plans: [
      {
        id: "plus",
        name: "Plus",
        pricePerSeat: 20,
        description: "Consumer subscription plan billed monthly.",
        bestFor: ["Individuals", "Daily use", "Expanded capabilities"]
      },
      {
        id: "team",
        name: "Team",
        pricePerSeat: 25,
        minSeats: 2,
        description:
          "Business workspace plan. Typically $25/user/month billed monthly, or $20/user/month billed annually (minimum 2 users).",
        bestFor: ["Small teams", "Shared workspace", "Admin controls"]
      },
      {
        id: "enterprise",
        name: "Enterprise",
        pricePerSeat: 0,
        description: "Custom pricing (contact sales).",
        bestFor: ["Enterprises", "Security/compliance", "Custom terms & support"]
      }
    ]
  },
  {
    id: "anthropic-api",
    name: "Anthropic API",
    category: "api",
    pricingUrl: "https://docs.anthropic.com/en/docs/about-claude/pricing",
    verifiedDate: VERIFIED_DATE,
    plans: [
      {
        id: "pay-per-token",
        name: "Pay-per-token",
        pricePerSeat: 0,
        description:
          "Usage-based pricing. Approx Sonnet: $3/1M input tokens and $15/1M output tokens (model-dependent).",
        bestFor: ["Production integrations", "Backend services", "Token-metered usage"]
      }
    ]
  },
  {
    id: "openai-api",
    name: "OpenAI API",
    category: "api",
    pricingUrl: "https://openai.com/api/pricing",
    verifiedDate: VERIFIED_DATE,
    plans: [
      {
        id: "pay-per-token",
        name: "Pay-per-token",
        pricePerSeat: 0,
        description:
          "Usage-based pricing. Approx GPT-4o: $2.50/1M input tokens and $10/1M output tokens (standard; model-dependent).",
        bestFor: ["Production integrations", "Backend services", "Token-metered usage"]
      }
    ]
  },
  {
    id: "gemini",
    name: "Gemini",
    category: "general",
    pricingUrl: "https://gemini.google/as/subscriptions/?hl=en",
    verifiedDate: VERIFIED_DATE,
    plans: [
      {
        id: "pro",
        name: "Pro",
        pricePerSeat: 19.99,
        description: "Google AI Pro subscription plan.",
        bestFor: ["Individuals", "Deep research", "Higher limits"]
      },
      {
        id: "ultra",
        name: "Ultra",
        pricePerSeat: 249.99,
        description: "Google AI Ultra subscription plan.",
        bestFor: ["Heavy usage", "Top-tier limits", "Advanced features"]
      },
      {
        id: "api",
        name: "API",
        pricePerSeat: 0,
        description:
          "Pay-per-token Gemini Developer API. Rates vary by model (see pricing page).",
        bestFor: ["Developers", "Backend services", "Token-metered usage"]
      }
    ]
  },
  {
    id: "windsurf",
    name: "Windsurf",
    category: "coding",
    pricingUrl: "https://windsurf.com/pricing",
    verifiedDate: VERIFIED_DATE,
    plans: [
      {
        id: "free",
        name: "Free",
        pricePerSeat: 0,
        description: "Free plan with light usage allowance.",
        bestFor: ["Trying Windsurf", "Light usage", "Occasional coding"]
      },
      {
        id: "pro",
        name: "Pro",
        pricePerSeat: 20,
        description: "Individual paid plan with standard usage allowance.",
        bestFor: ["Solo developers", "Daily coding", "Standard usage"]
      },
      {
        id: "team",
        name: "Team",
        pricePerSeat: 40,
        description: "Team plan with centralized billing and admin dashboard.",
        bestFor: ["Teams", "Centralized billing", "Admin analytics"]
      }
    ]
  }
];

export const PRICING_TOOLS: ToolPricing[] = PricingDatabaseSchema.parse(PRICING_TOOLS_RAW);

export function getPricingForTool(toolId: string): ToolPricing | undefined {
  return PRICING_TOOLS.find((t) => t.id === toolId);
}

export function getAllTools(): ToolPricing[] {
  return [...PRICING_TOOLS];
}

