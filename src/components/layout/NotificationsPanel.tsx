import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Sparkles, CalendarClock } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { useTransactions } from "@/hooks/useTransactions";
import { usePayments } from "@/hooks/usePayments";
import { useReminders } from "@/hooks/useReminders";
import { useQuickSheet } from "@/lib/QuickSheetContext";
import { detectRecurringPayments } from "@/lib/recurringDetect";
import { formatGEL } from "@/lib/format";
import { useLanguage } from "@/lib/LanguageContext";

function daysUntil(dueDate: string): number {
  const today = new Date().toISOString().slice(0, 10);
  return Math.ceil((new Date(dueDate).getTime() - new Date(today).getTime()) / 86_400_000);
}

export function NotificationsPanel() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { openSheet } = useQuickSheet();
  const { expenses } = useTransactions();
  const { payments } = usePayments();
  const { dueSoon } = useReminders();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const recurringCandidate = useMemo(() => {
    const rows = expenses.map((e) => ({ note: e.note, amount: e.amount, date: e.date }));
    const candidates = detectRecurringPayments(rows, payments.map((p) => p.name));
    return candidates[0] ?? null;
  }, [expenses, payments]);

  if (!user) return null;

  const count = (recurringCandidate ? 1 : 0) + dueSoon.length;

  function handleRecurringClick() {
    if (!recurringCandidate) return;
    navigate("/calendar");
    openSheet("calendar", { name: recurringCandidate.name, amount: recurringCandidate.amount, day_of_month: recurringCandidate.day_of_month });
    setOpen(false);
  }

  function handleReminderClick() {
    navigate("/calendar");
    setOpen(false);
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface text-text-secondary transition-colors hover:border-accent/50 hover:text-text-primary"
        aria-label={t("notifications")}
      >
        <Bell size={16} />
        {count > 0 && <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-accent" />}
      </button>
      {open && (
        <div className="absolute right-0 top-11 z-50 w-72 overflow-hidden rounded-2xl border border-border bg-bg-elevated shadow-[0_12px_40px_rgba(0,0,0,0.5)]">
          <div className="border-b border-border-soft px-4 py-3">
            <p className="text-sm font-semibold text-text-primary">{t("notifications")}</p>
          </div>
          <div className="max-h-80 overflow-y-auto py-1">
            {count === 0 && <p className="px-4 py-4 text-center text-xs text-text-muted">{t("noNotifications")}</p>}

            {recurringCandidate && (
              <button
                onClick={handleRecurringClick}
                className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-surface"
              >
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
                  <Sparkles size={13} />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-text-primary">{t("draftDetectedTitle")}</p>
                  <p className="mt-0.5 truncate text-xs text-text-muted">
                    {recurringCandidate.name} · {formatGEL(recurringCandidate.amount)}
                  </p>
                </div>
              </button>
            )}

            {dueSoon.map((r) => {
              const days = daysUntil(r.due_date);
              return (
                <button key={r.id} onClick={handleReminderClick} className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-surface">
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-warning-soft text-warning">
                    <CalendarClock size={13} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-text-primary">{r.label}</p>
                    <p className="mt-0.5 text-xs text-text-muted">{days <= 0 ? t("dueToday") : t("dueInDays").replace("{days}", String(days))}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
