import type { LiabilityTypeKey } from "@/data/liabilityTypes";

export interface Liability {
  id: string;
  user_id: string;
  name: string;
  type: LiabilityTypeKey;
  amount: number;
  created_at: string;
}

export interface LiabilityInput {
  name: string;
  type: LiabilityTypeKey;
  amount: number;
}
