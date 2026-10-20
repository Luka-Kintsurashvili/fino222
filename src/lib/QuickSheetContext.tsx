import { createContext, useContext, useState, type ReactNode } from "react";

export type TileTarget = "funds" | "calendar" | "loan" | "budget" | "credit";

interface QuickSheetContextValue {
  target: TileTarget | null;
  openSheet: (target: TileTarget) => void;
  consume: () => void;
}

const QuickSheetContext = createContext<QuickSheetContextValue | null>(null);

export function QuickSheetProvider({ children }: { children: ReactNode }) {
  const [target, setTarget] = useState<TileTarget | null>(null);

  return (
    <QuickSheetContext.Provider value={{ target, openSheet: setTarget, consume: () => setTarget(null) }}>
      {children}
    </QuickSheetContext.Provider>
  );
}

export function useQuickSheet() {
  const ctx = useContext(QuickSheetContext);
  if (!ctx) throw new Error("useQuickSheet must be used within QuickSheetProvider");
  return ctx;
}
