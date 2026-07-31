import { createContext, useContext, useState, type ReactNode } from "react";

export type ChartDrawerSection = "graphs" | "networth" | null;

interface ChartDrawerContextValue {
  open: boolean;
  section: ChartDrawerSection;
  openDrawer: (section?: ChartDrawerSection) => void;
  closeDrawer: () => void;
}

const ChartDrawerContext = createContext<ChartDrawerContextValue | null>(null);

export function ChartDrawerProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [section, setSection] = useState<ChartDrawerSection>(null);

  function openDrawer(nextSection: ChartDrawerSection = null) {
    setSection(nextSection);
    setOpen(true);
  }

  return (
    <ChartDrawerContext.Provider value={{ open, section, openDrawer, closeDrawer: () => setOpen(false) }}>
      {children}
    </ChartDrawerContext.Provider>
  );
}

export function useChartDrawer() {
  const ctx = useContext(ChartDrawerContext);
  if (!ctx) throw new Error("useChartDrawer must be used within ChartDrawerProvider");
  return ctx;
}
