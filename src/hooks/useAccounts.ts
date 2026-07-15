import { useLocalStorage } from "@/hooks/useLocalStorage";
import type { BankAccount } from "@/types/account";

const SEED_ACCOUNTS: BankAccount[] = [
  { id: "seed-bog", bankId: "bog", nickname: "ჩემი ბარათი", balance: 3420, last4: "4821" },
  { id: "seed-tbc", bankId: "tbc", nickname: "დანაზოგი", balance: 1150, last4: "7734" },
];

export function useAccounts() {
  const [accounts, setAccounts] = useLocalStorage<BankAccount[]>("fino-accounts", SEED_ACCOUNTS);

  function addAccount(account: Omit<BankAccount, "id">) {
    setAccounts((prev) => [...prev, { ...account, id: crypto.randomUUID() }]);
  }

  function removeAccount(id: string) {
    setAccounts((prev) => prev.filter((a) => a.id !== id));
  }

  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);

  return { accounts, addAccount, removeAccount, totalBalance };
}
