import { CreditCard } from "lucide-react";
import { BANK_BRAND } from "@/components/ui/BankLogo";
import { banks } from "@/data/banks";
import { formatGEL } from "@/lib/format";
import type { BankAccount } from "@/types/account";

interface AccountCardProps {
  account: BankAccount;
}

export function AccountCard({ account }: AccountCardProps) {
  const bank = banks.find((b) => b.id === account.bankId);
  const brand = BANK_BRAND[account.bankId] ?? { initials: "??", from: "#3B82F6", to: "#8B5CF6" };

  return (
    <div
      className="flex h-48 w-full shrink-0 grow-0 basis-full snap-center flex-col justify-between rounded-3xl p-5 text-white shadow-[0_12px_30px_rgba(0,0,0,0.35)]"
      style={{ backgroundImage: `linear-gradient(135deg, ${brand.from} 0%, ${brand.to} 100%)` }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-white/70">{bank?.name ?? account.bankId}</p>
          <p className="mt-0.5 text-sm font-semibold">{account.nickname}</p>
        </div>
        <CreditCard size={26} className="text-white/80" />
      </div>

      <div>
        <p className="mb-1.5 font-mono text-sm tracking-widest text-white/70">•••• •••• •••• {account.last4}</p>
        <p className="text-2xl font-bold tabular">{formatGEL(account.balance)}</p>
      </div>
    </div>
  );
}
