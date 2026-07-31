export type ContributionMode = "fixed" | "percent";

export interface Fund {
  id: string;
  user_id: string;
  name: string;
  target_amount: number;
  saved_amount: number;
  contribution_mode: ContributionMode;
  contribution_value: number;
  is_rainy_day: boolean;
  created_at: string;
}

export interface FundInput {
  name: string;
  target_amount: number;
  saved_amount?: number;
  contribution_mode: ContributionMode;
  contribution_value: number;
  is_rainy_day?: boolean;
}
