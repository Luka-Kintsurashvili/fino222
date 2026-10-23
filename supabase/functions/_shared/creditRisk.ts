// AI1 credit-risk inference — pure arithmetic, no ML runtime.
// Standardize -> dot product with logistic-regression coefficients -> sigmoid -> PD.
// Reason codes are just |coefficient x standardized value|, sorted — same approach as the
// course's own reference notebook (NB1_credit_scoring.ipynb). The PTI/PD rule layer below
// mirrors docs/01_consumer_loan_policy_en.md exactly; it is applied AFTER the model score,
// never learned by it.
//
// See ml/model_card.md for the full model card (data, method, fairness, limits).

import { CREDIT_RISK_MODEL, FEATURE_LABELS_KA } from "./creditRiskModel.ts";

export type Region = "Tbilisi" | "Kutaisi" | "Rustavi" | "Batumi" | "Other";
export type EmploymentType = "salaried" | "public_sector" | "self_employed" | "freelancer";
export type CreditHistory = "none" | "some" | "long";
export type LoanCurrency = "GEL" | "USD";

export interface ApplicantInput {
  age: number;
  monthly_income_gel: number;
  loan_amount: number;
  loan_term_months: number;
  loan_currency: LoanCurrency;
  region: Region;
  employment_type: EmploymentType;
  credit_history: CreditHistory;
  years_at_job: number;
  credit_history_months: number;
  income_months_last_6: number;
  overdrafts_last_6m: number;
  essentials_share_pct: number;
  existing_loans: number;
}

export interface ReasonCode {
  label: string;
  direction: "up" | "down";
  magnitude: number;
}

export interface CreditRiskResult {
  pd: number;
  decision: "auto_approve" | "manual_review" | "decline";
  reasons: ReasonCode[];
  monthlyPayment: number;
  ptiPct: number;
  ptiLimitPct: number;
  ptiPass: boolean;
}

// A representative mid-range annual rate per the loan policy (14-22% for GEL consumer loans,
// docs/01_consumer_loan_policy_en.md §5.1). This is an estimate for scoring, not a quoted offer.
const ASSUMED_ANNUAL_RATE: Record<LoanCurrency, number> = { GEL: 0.18, USD: 0.1 };

// Per docs/01_consumer_loan_policy_en.md §3.1, PTI is "all monthly loan payments, including the
// new loan" — not just the one being requested. We don't have each existing loan's real payment,
// so we estimate it: reverse-engineered from ml/data/credit_applicants.csv, pti_pct there equals
// (monthly_payment + 140 * existing_loans) / monthly_income_gel * 100 for ~99.5% of rows, so the
// training data itself assumes a flat 140 GEL/month per existing loan. Matching that keeps live
// scoring consistent with what the model was actually trained on.
const ASSUMED_EXISTING_LOAN_PAYMENT_GEL = 140;

function monthlyPayment(principal: number, annualRate: number, months: number): number {
  if (months <= 0 || principal <= 0) return 0;
  const r = annualRate / 12;
  if (r === 0) return principal / months;
  const factor = Math.pow(1 + r, months);
  return (principal * r * factor) / (factor - 1);
}

/** PTI limit per docs/01_consumer_loan_policy_en.md §3.2-3.3. Threshold is 1500 GEL until Feb 2027. */
function ptiLimitPct(netIncomeGel: number, currency: LoanCurrency, incomeThreshold = 1500): number {
  const aboveThreshold = netIncomeGel >= incomeThreshold;
  if (currency === "GEL") return aboveThreshold ? 50 : 25;
  return aboveThreshold ? 30 : 20;
}

function sigmoid(z: number): number {
  return 1 / (1 + Math.exp(-z));
}

function buildRawFeatures(input: ApplicantInput): Record<string, number> {
  const payment = monthlyPayment(input.loan_amount, ASSUMED_ANNUAL_RATE[input.loan_currency], input.loan_term_months);
  const existingDebtPayment = ASSUMED_EXISTING_LOAN_PAYMENT_GEL * input.existing_loans;
  const ptiPct = input.monthly_income_gel > 0 ? ((payment + existingDebtPayment) / input.monthly_income_gel) * 100 : 100;

  return {
    age: input.age,
    years_at_job: input.years_at_job,
    monthly_income_gel: input.monthly_income_gel,
    income_months_last_6: input.income_months_last_6,
    credit_history_months: input.credit_history_months,
    overdrafts_last_6m: input.overdrafts_last_6m,
    essentials_share_pct: input.essentials_share_pct,
    existing_loans: input.existing_loans,
    loan_amount: input.loan_amount,
    loan_term_months: input.loan_term_months,
    monthly_payment: payment,
    pti_pct: ptiPct,
    region_Kutaisi: input.region === "Kutaisi" ? 1 : 0,
    region_Other: input.region === "Other" ? 1 : 0,
    region_Rustavi: input.region === "Rustavi" ? 1 : 0,
    region_Tbilisi: input.region === "Tbilisi" ? 1 : 0,
    employment_type_public_sector: input.employment_type === "public_sector" ? 1 : 0,
    employment_type_salaried: input.employment_type === "salaried" ? 1 : 0,
    employment_type_self_employed: input.employment_type === "self_employed" ? 1 : 0,
    credit_history_none: input.credit_history === "none" ? 1 : 0,
    credit_history_some: input.credit_history === "some" ? 1 : 0,
    loan_currency_USD: input.loan_currency === "USD" ? 1 : 0,
  };
}

export function scoreApplicant(input: ApplicantInput): CreditRiskResult {
  const raw = buildRawFeatures(input);
  const { features, mean, scale, coef, intercept } = CREDIT_RISK_MODEL;

  let z = intercept;
  const contributions: { feature: string; contribution: number }[] = [];
  for (let i = 0; i < features.length; i++) {
    const standardized = (raw[features[i]] - mean[i]) / scale[i];
    const contribution = coef[i] * standardized;
    z += contribution;
    contributions.push({ feature: features[i], contribution });
  }

  const pd = sigmoid(z);

  const reasons: ReasonCode[] = contributions
    .sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution))
    .slice(0, 3)
    .map((c) => ({
      label: FEATURE_LABELS_KA[c.feature] ?? c.feature,
      direction: c.contribution > 0 ? "up" : "down",
      magnitude: Math.abs(c.contribution),
    }));

  const limit = ptiLimitPct(input.monthly_income_gel, input.loan_currency);
  const ptiPass = raw.pti_pct <= limit;

  // PD bands per docs/01_consumer_loan_policy_en.md §4.2.
  let decision: CreditRiskResult["decision"];
  if (pd >= 0.12) decision = "decline";
  else if (pd >= 0.06) decision = "manual_review";
  else decision = ptiPass ? "auto_approve" : "manual_review";

  return {
    pd,
    decision,
    reasons,
    monthlyPayment: raw.monthly_payment,
    ptiPct: raw.pti_pct,
    ptiLimitPct: limit,
    ptiPass,
  };
}
