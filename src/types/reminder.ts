export interface Reminder {
  id: string;
  user_id: string;
  label: string;
  amount: number | null;
  due_date: string;
  remind_days_before: number;
  acknowledged_at: string | null;
  created_at: string;
}

export type ReminderInput = Pick<Reminder, "label" | "amount" | "due_date" | "remind_days_before">;
