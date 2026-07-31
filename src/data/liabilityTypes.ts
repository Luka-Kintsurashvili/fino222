import { Landmark, Users, CreditCard, Package, type LucideIcon } from "lucide-react";

export type LiabilityTypeKey = "bank_loan" | "personal_debt" | "credit_card" | "other";

interface LiabilityTypeDef {
  key: LiabilityTypeKey;
  label: string;
  icon: LucideIcon;
}

export const liabilityTypes: LiabilityTypeDef[] = [
  { key: "bank_loan", label: "საბანკო სესხი", icon: Landmark },
  { key: "personal_debt", label: "ვალი პირისგან", icon: Users },
  { key: "credit_card", label: "საკრედიტო ბარათი", icon: CreditCard },
  { key: "other", label: "სხვა", icon: Package },
];
