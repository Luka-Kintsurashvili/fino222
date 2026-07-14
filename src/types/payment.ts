export interface RecurringPayment {
  id: string;
  user_id: string;
  name: string;
  amount: number;
  day_of_month: number;
  color: string;
  created_at: string;
}

export type PaymentInput = Pick<RecurringPayment, "name" | "amount" | "day_of_month" | "color">;
