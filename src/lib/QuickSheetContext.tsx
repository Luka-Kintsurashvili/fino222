import { createContext, useContext, useState, type ReactNode } from "react";

export type TileTarget = "funds" | "calendar" | "loan" | "budget" | "credit";

/** An action-drafted payload a sheet can pre-fill for the user to review and approve — never auto-saved. */
export interface RecurringPaymentDraft {
  name: string;
  amount: number;
  day_of_month: number;
}

interface QuickSheetContextValue {
  target: TileTarget | null;
  draft: RecurringPaymentDraft | null;
  openSheet: (target: TileTarget, draft?: RecurringPaymentDraft) => void;
  consume: () => void;
}

const QuickSheetContext = createContext<QuickSheetContextValue | null>(null);

export function QuickSheetProvider({ children }: { children: ReactNode }) {
  const [target, setTarget] = useState<TileTarget | null>(null);
  const [draft, setDraft] = useState<RecurringPaymentDraft | null>(null);

  function openSheet(nextTarget: TileTarget, nextDraft?: RecurringPaymentDraft) {
    setTarget(nextTarget);
    setDraft(nextDraft ?? null);
  }

  function consume() {
    setTarget(null);
    setDraft(null);
  }

  return <QuickSheetContext.Provider value={{ target, draft, openSheet, consume }}>{children}</QuickSheetContext.Provider>;
}

export function useQuickSheet() {
  const ctx = useContext(QuickSheetContext);
  if (!ctx) throw new Error("useQuickSheet must be used within QuickSheetProvider");
  return ctx;
}
