export interface BankAccount {
  id: string;
  user_id: string;
  bank_id: string;
  nickname: string;
  balance: number;
  last4: string;
  created_at: string;
}

export type BankAccountInput = Pick<BankAccount, "bank_id" | "nickname" | "balance" | "last4">;
