import { Wifi } from "lucide-react";
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
      className="relative flex h-48 w-full shrink-0 grow-0 basis-full snap-center flex-col justify-between overflow-hidden rounded-3xl p-5 text-white shadow-[0_16px_36px_-6px_rgba(0,0,0,0.45)]"
      style={{ backgroundImage: `linear-gradient(135deg, ${brand.from} 0%, ${brand.to} 100%)` }}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{ backgroundImage: "linear-gradient(115deg, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0) 30%, rgba(255,255,255,0) 70%, rgba(255,255,255,0.08) 100%)" }}
      />
      <div
        className="pointer-events-none absolute -right-10 -top-14 h-40 w-40 rounded-full"
        style={{ background: "radial-gradient(circle, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0) 70%)" }}
      />

      <div className="relative flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-[11px] font-bold backdrop-blur-sm">
            {brand.initials}
          </span>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-white/70">{bank?.name ?? account.bankId}</p>
            <p className="text-sm font-semibold">{account.nickname}</p>
          </div>
        </div>
        <Wifi size={20} className="rotate-90 text-white/70" />
      </div>

      <div className="relative">
        <div className="mb-3 h-6 w-9 rounded-md bg-gradient-to-br from-yellow-200/90 to-yellow-500/80" />
        <p className="mb-1.5 font-mono text-sm tracking-widest text-white/70">•••• •••• •••• {account.last4}</p>
        <p className="text-2xl font-bold tabular">{formatGEL(account.balance)}</p>
      </div>
    </div>
  );
}
