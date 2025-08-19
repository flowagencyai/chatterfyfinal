export type PlanDef = {
  code: string;
  name: string;
  monthlyCreditsTokens: number;
  dailyTokenLimit: number;
  storageLimitMB: number;
  maxFileSizeMB: number;
  features: Record<string, any>;
};

export const DEFAULT_PLANS: PlanDef[] = [
  {
    code: 'free',
    name: 'Grátis',
    monthlyCreditsTokens: 2_000_000,
    dailyTokenLimit: 200_000,
    storageLimitMB: 200,
    maxFileSizeMB: 10,
    features: { rag: false, s3: false }
  },
  {
    code: 'pro',
    name: 'Pro',
    monthlyCreditsTokens: 10_000_000,
    dailyTokenLimit: 1_000_000,
    storageLimitMB: 2_000,
    maxFileSizeMB: 50,
    features: { rag: true, s3: true }
  }
];
