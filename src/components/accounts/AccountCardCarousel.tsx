import { useRef, useState } from "react";
import { Plus } from "lucide-react";
import { AccountCard } from "@/components/accounts/AccountCard";
import type { BankAccount } from "@/types/account";
import { useLanguage } from "@/lib/LanguageContext";

interface AccountCardCarouselProps {
  accounts: BankAccount[];
  onAddClick: () => void;
}

export function AccountCardCarousel({ accounts, onAddClick }: AccountCardCarouselProps) {
  const { t } = useLanguage();
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const slideCount = accounts.length + 1;

  function handleScroll() {
    const el = trackRef.current;
    if (!el) return;
    const index = Math.round(el.scrollLeft / el.clientWidth);
    setActive(Math.min(index, slideCount - 1));
  }

  return (
    <div>
      <div
        ref={trackRef}
        onScroll={handleScroll}
        className="no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth"
      >
        {accounts.map((account) => (
          <AccountCard key={account.id} account={account} />
        ))}
        <button
          type="button"
          onClick={onAddClick}
          className="flex h-48 w-full shrink-0 grow-0 basis-full snap-center flex-col items-center justify-center gap-2 rounded-3xl border-2 border-dashed border-border text-text-muted transition-colors hover:border-accent/50 hover:text-accent"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-surface">
            <Plus size={20} />
          </span>
          <span className="text-sm font-medium">{t("addAccount")}</span>
        </button>
      </div>

      <div className="mt-3 flex justify-center gap-1.5">
        {Array.from({ length: slideCount }).map((_, i) => (
          <span
            key={i}
            className={`h-1.5 rounded-full transition-all ${
              i === active ? "w-5 bg-accent" : "w-1.5 bg-border"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
