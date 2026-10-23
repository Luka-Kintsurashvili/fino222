import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Sparkles, CalendarClock, X } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { useTransactions } from "@/hooks/useTransactions";
import { usePayments } from "@/hooks/usePayments";
import { useReminders } from "@/hooks/useReminders";
import { useDismissedRecurring } from "@/hooks/useDismissedRecurring";
import { useLocalStorage } from "@/hooks/useLocalStorage";
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
  const { dismissedNames, dismiss } = useDismissedRecurring();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const recurringCandidates = useMemo(() => {
    const rows = expenses.map((e) => ({ note: e.note, amount: e.amount, date: e.date, category: e.category }));
    const excluded = [...payments.map((p) => p.name), ...dismissedNames];
    return detectRecurringPayments(rows, excluded);
  }, [expenses, payments, dismissedNames]);

  const itemIds = useMemo(
    () => [...recurringCandidates.map((c) => `recur:${c.name}`), ...dueSoon.map((r) => `due:${r.id}`)],
    [recurringCandidates, dueSoon]
  );

  // Clears the unread dot once the user has actually opened the panel, per item — a new item
  // that shows up later (even if the panel was opened before) brings the dot back.
  const [seenIds, setSeenIds] = useLocalStorage<string[]>(`fino-notif-seen-${user?.id ?? "anon"}`, []);
  const unseenCount = itemIds.filter((id) => !seenIds.includes(id)).length;

  if (!user) return null;

  const count = recurringCandidates.length + dueSoon.length;

  function handleToggle() {
    setOpen((prev) => {
      const next = !prev;
      if (next) setSeenIds((seen) => Array.from(new Set([...seen, ...itemIds])));
      return next;
    });
  }

  function handleRecurringClick(candidate: (typeof recurringCandidates)[number]) {
    navigate("/calendar");
    openSheet("calendar", { name: candidate.name, amount: candidate.amount, day_of_month: candidate.day_of_month });
    setOpen(false);
  }

  function handleReminderClick() {
    navigate("/calendar");
    setOpen(false);
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={handleToggle}
        className="relative flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface text-text-secondary transition-colors hover:border-accent/50 hover:text-text-primary"
        aria-label={t("notifications")}
      >
        <Bell size={16} />
        {unseenCount > 0 && <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-accent" />}
      </button>
      {open && (
        <div className="absolute right-0 top-11 z-50 w-72 overflow-hidden rounded-2xl border border-border bg-bg-elevated shadow-[0_12px_40px_rgba(0,0,0,0.5)]">
          <div className="border-b border-border-soft px-4 py-3">
            <p className="text-sm font-semibold text-text-primary">{t("notifications")}</p>
          </div>
          <div className="max-h-80 overflow-y-auto py-1">
            {count === 0 && <p className="px-4 py-4 text-center text-xs text-text-muted">{t("noNotifications")}</p>}

            {recurringCandidates.map((candidate) => (
              <div key={candidate.name} className="flex items-start gap-1 px-2.5 py-1 hover:bg-surface">
                <button onClick={() => handleRecurringClick(candidate)} className="flex min-w-0 flex-1 items-start gap-3 px-1.5 py-2 text-left">
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
                    <Sparkles size={13} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-text-primary">{t("draftDetectedTitle")}</p>
                    <p className="mt-0.5 truncate text-xs text-text-muted">
                      {candidate.name} · {formatGEL(candidate.amount)}
                    </p>
                  </div>
                </button>
                <button
                  onClick={() => dismiss(candidate.name)}
                  className="mt-1.5 shrink-0 rounded-full p-1.5 text-text-muted hover:bg-danger-soft hover:text-danger"
                  aria-label={t("notARecurringBill")}
                  title={t("notARecurringBill")}
                >
                  <X size={13} />
                </button>
              </div>
            ))}

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
