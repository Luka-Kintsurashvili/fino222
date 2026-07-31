import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Link2 } from "lucide-react";
import { AccountCard } from "@/components/accounts/AccountCard";
import type { BankAccount } from "@/types/account";
import { useLanguage } from "@/lib/LanguageContext";

interface AccountCardCarouselProps {
  accounts: BankAccount[];
  onConnectClick: () => void;
}

export function AccountCardCarousel({ accounts, onConnectClick }: AccountCardCarouselProps) {
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

  function goToSlide(index: number) {
    const el = trackRef.current;
    if (!el) return;
    const clamped = Math.max(0, Math.min(index, slideCount - 1));
    el.scrollTo({ left: clamped * el.clientWidth, behavior: "smooth" });
    setActive(clamped);
  }

  return (
    <div className="group relative">
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
          onClick={onConnectClick}
          className="flex h-48 w-full shrink-0 grow-0 basis-full snap-center flex-col items-center justify-center gap-2 rounded-3xl border-2 border-dashed border-border text-text-muted transition-colors hover:border-accent/50 hover:text-accent"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-surface">
            <Link2 size={20} />
          </span>
          <span className="text-sm font-medium">{t("connectTbc")}</span>
        </button>
      </div>

      {slideCount > 1 && (
        <>
          {active > 0 && (
            <button
              type="button"
              onClick={() => goToSlide(active - 1)}
              aria-label="Previous"
              className="absolute left-2 top-1/2 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-sm transition-opacity hover:bg-black/45 md:flex"
            >
              <ChevronLeft size={18} />
            </button>
          )}
          {active < slideCount - 1 && (
            <button
              type="button"
              onClick={() => goToSlide(active + 1)}
              aria-label="Next"
              className="absolute right-2 top-1/2 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-sm transition-opacity hover:bg-black/45 md:flex"
            >
              <ChevronRight size={18} />
            </button>
          )}
        </>
      )}

      <div className="mt-3 flex justify-center gap-1.5">
        {Array.from({ length: slideCount }).map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => goToSlide(i)}
            aria-label={`Slide ${i + 1}`}
            className={`h-1.5 rounded-full transition-all ${
              i === active ? "w-5 bg-accent" : "w-1.5 bg-border hover:bg-text-muted"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
