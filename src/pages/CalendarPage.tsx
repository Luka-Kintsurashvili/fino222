import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Plus, Trash2 } from "lucide-react";
import { SubPageHeader } from "@/components/ui/SubPageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { AuthGate } from "@/components/ui/AuthGate";
import { AddPaymentSheet } from "@/components/calendar/AddPaymentSheet";
import { formatGEL, georgianMonth } from "@/lib/format";
import { buildMonthGrid, weekdayLabels } from "@/lib/calendar";
import { useAuth } from "@/lib/AuthContext";
import { usePayments } from "@/hooks/usePayments";
import { useLanguage } from "@/lib/LanguageContext";
import { useQuickSheet, type RecurringPaymentDraft } from "@/lib/QuickSheetContext";

export function CalendarPage() {
  const { user, loading: authLoading } = useAuth();
  const { t } = useLanguage();

  if (authLoading) return null;
  if (!user)
    return (
      <div className="space-y-5">
        <SubPageHeader title={t("calendarTitle")} subtitle={t("calendarSubtitle")} />
        <AuthGate message={t("calendarAuthGate")} />
      </div>
    );

  return <CalendarView />;
}

function CalendarView() {
  const { t } = useLanguage();
  const { payments, loading, addPayment, deletePayment } = usePayments();
  const [cursor, setCursor] = useState(() => new Date());
  const [open, setOpen] = useState(false);
  const [sheetDraft, setSheetDraft] = useState<RecurringPaymentDraft | null>(null);
  const { target, draft, consume } = useQuickSheet();

  useEffect(() => {
    if (target === "calendar") {
      if (draft) {
        setSheetDraft(draft);
        setOpen(true);
      }
      consume();
    }
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [target, consume]);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const grid = useMemo(() => buildMonthGrid(year, month), [year, month]);
  const today = new Date();

  const byDay = useMemo(() => {
    const map = new Map<number, typeof payments>();
    for (const p of payments) {
      const list = map.get(p.day_of_month) ?? [];
      list.push(p);
      map.set(p.day_of_month, list);
    }
    return map;
  }, [payments]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <SubPageHeader title={t("calendarTitle")} subtitle={t("calendarSubtitle")} />
        <Button onClick={() => setOpen(true)} className="mb-5 !px-3 !py-2.5">
          <Plus size={18} />
        </Button>
      </div>

      <Card>
        <div className="mb-4 flex items-center justify-between">
          <button
            onClick={() => setCursor(new Date(year, month - 1, 1))}
            className="rounded-lg p-1.5 text-text-secondary hover:bg-surface"
          >
            <ChevronLeft size={18} />
          </button>
          <p className="font-semibold text-text-primary">
            {georgianMonth(month)} {year}
          </p>
          <button
            onClick={() => setCursor(new Date(year, month + 1, 1))}
            className="rounded-lg p-1.5 text-text-secondary hover:bg-surface"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-y-2 text-center">
          {weekdayLabels.map((w) => (
            <span key={w} className="text-[10px] font-medium text-text-muted">
              {w}
            </span>
          ))}
          {grid.map((cell, i) => {
            const isToday =
              cell.day !== null &&
              today.getFullYear() === year &&
              today.getMonth() === month &&
              today.getDate() === cell.day;
            const dayPayments = cell.day !== null ? byDay.get(cell.day) : undefined;
            return (
              <div key={i} className="flex flex-col items-center gap-1 py-1">
                {cell.day !== null && (
                  <>
                    <span
                      className={`flex h-7 w-7 items-center justify-center rounded-full font-mono text-xs tabular ${
                        isToday ? "gradient-accent text-white font-semibold" : "text-text-secondary"
                      }`}
                    >
                      {cell.day}
                    </span>
                    <div className="flex h-1.5 items-center gap-0.5">
                      {dayPayments?.slice(0, 3).map((p) => (
                        <span key={p.id} className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: p.color }} />
                      ))}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      <div className="space-y-3">
        {loading && <p className="text-sm text-text-muted">{t("loadingText")}</p>}
        {!loading && payments.length === 0 && (
          <Card className="py-8 text-center text-sm text-text-secondary">{t("noRecurringPayments")}</Card>
        )}
        {Array.from(byDay.entries())
          .sort(([a], [b]) => a - b)
          .map(([dayNum, list]) => (
            <Card key={dayNum}>
              <p className="mb-2 text-xs font-semibold text-text-muted">{t("everyMonthOnDay").replace("{day}", String(dayNum))}</p>
              <div className="space-y-2">
                {list.map((p) => (
                  <div key={p.id} className="flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: p.color }} />
                      <span className="truncate text-sm text-text-primary">{p.name}</span>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <span className="font-mono text-sm tabular text-text-secondary">{formatGEL(p.amount)}</span>
                      <button
                        onClick={() => deletePayment(p.id)}
                        className="rounded-lg p-1 text-text-muted hover:bg-danger-soft hover:text-danger"
                        aria-label={t("delete")}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ))}
      </div>

      <AddPaymentSheet
        open={open}
        onClose={() => {
          setOpen(false);
          setSheetDraft(null);
        }}
        onAdd={addPayment}
        draft={sheetDraft}
      />
    </div>
  );
}
