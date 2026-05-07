export interface ToolEntry {
  toolId: string;
  plan: string;
  monthlySpend: number;
  seats: number;
}

export interface AuditResult {
  toolId: string;
  currentSpend: number;
  recommendedAction: string;
  savings: number;
  reason: string;
  alternativeTool?: string;
}

export interface AuditSummary {
  totalMonthlySavings: number;
  totalAnnualSavings: number;
  results: AuditResult[];
  aiSummary: string;
  credexEligible: boolean;
}

export interface LeadCapture {
  id: string;
  auditId: string;
  email: string;
  company: string;
  role: string;
  teamSize: number;
  createdAt: string;
}

export interface SavedAudit {
  id: string;
  slug: string;
  auditData: AuditSummary;
  createdAt: string;
}

