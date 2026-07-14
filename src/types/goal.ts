export interface Goal {
  id: string;
  user_id: string;
  name: string;
  target_amount: number;
  saved_amount: number;
  monthly_contribution: number;
  created_at: string;
}

export type GoalInput = Pick<Goal, "name" | "target_amount" | "saved_amount" | "monthly_contribution">;
