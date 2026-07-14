import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Plus, Trash2, CircleAlert } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { AuthGate } from "@/components/ui/AuthGate";
import { FormSheet } from "@/components/ui/FormSheet";
import { TextField } from "@/components/ui/TextField";
import { NumberField } from "@/components/ui/NumberField";
import { formatGEL, georgianMonth } from "@/lib/format";
import { buildMonthGrid, weekdayLabels } from "@/lib/calendar";
import { tagColors } from "@/data/tagColors";
import { useAuth } from "@/lib/AuthContext";
import { usePayments } from "@/hooks/usePayments";
import { useLanguage } from "@/lib/LanguageContext";

export function CalendarPage() {
  const { user, loading: authLoading } = useAuth();
  const { t } = useLanguage();

  if (authLoading) return null;
  if (!user)
    return (
      <div className="space-y-5">
        <PageHeader title={t("calendarTitle")} subtitle={t("calendarSubtitle")} />
        <AuthGate message="გადახდების კალენდრის სანახავად საჭიროა ავტორიზაცია." />
      </div>
    );

  return <CalendarView />;
}

function CalendarView() {
  const { t } = useLanguage();
  const { payments, loading, addPayment, deletePayment } = usePayments();
  const [cursor, setCursor] = useState(() => new Date());
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState(50);
  const [day, setDay] = useState(1);
  const [color, setColor] = useState(tagColors[0].value);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

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

  async function handleSubmit() {
    if (!name.trim() || amount <= 0) {
      setFormError("შეავსე დასახელება და თანხა");
      return;
    }
    setSubmitting(true);
    const error = await addPayment({ name: name.trim(), amount, day_of_month: Math.min(31, Math.max(1, day)), color });
    setSubmitting(false);
    if (error) {
      setFormError(error);
      return;
    }
    setName("");
    setAmount(50);
    setDay(1);
    setFormError(null);
    setOpen(false);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <PageHeader title={t("calendarTitle")} subtitle={t("calendarSubtitle")} />
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
        {loading && <p className="text-sm text-text-muted">იტვირთება...</p>}
        {!loading && payments.length === 0 && (
          <Card className="py-8 text-center text-sm text-text-secondary">
            ჯერ არ გაქვს დამატებული განმეორებადი გადახდა
          </Card>
        )}
        {Array.from(byDay.entries())
          .sort(([a], [b]) => a - b)
          .map(([dayNum, list]) => (
            <Card key={dayNum}>
              <p className="mb-2 text-xs font-semibold text-text-muted">ყოველი თვის {dayNum}</p>
              <div className="space-y-2">
                {list.map((p) => (
                  <div key={p.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                      <span className="text-sm text-text-primary">{p.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm tabular text-text-secondary">{formatGEL(p.amount)}</span>
                      <button
                        onClick={() => deletePayment(p.id)}
                        className="rounded-lg p-1 text-text-muted hover:bg-danger-soft hover:text-danger"
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

      <FormSheet
        open={open}
        title="განმეორებადი გადახდა"
        onClose={() => {
          setOpen(false);
          setFormError(null);
        }}
      >
        <TextField label="დასახელება" value={name} onChange={setName} placeholder="მაგ. ინტერნეტი" />
        <NumberField label="თანხა" value={amount} onChange={setAmount} suffix="₾" step={10} />
        <NumberField label="თვის რიცხვი" value={day} onChange={setDay} min={1} max={31} />
        <div>
          <span className="mb-2 block text-sm font-medium text-text-secondary">ფერის ტეგი</span>
          <div className="flex gap-2">
            {tagColors.map((c) => (
              <button
                key={c.value}
                onClick={() => setColor(c.value)}
                className={`h-8 w-8 rounded-full transition-transform ${color === c.value ? "scale-110 ring-2 ring-offset-2 ring-offset-bg-elevated" : ""}`}
                style={{ backgroundColor: c.value, boxShadow: color === c.value ? `0 0 0 2px ${c.value}` : undefined }}
                aria-label={c.label}
              />
            ))}
          </div>
        </div>
        {formError && (
          <div className="flex items-start gap-2 rounded-xl border border-danger/30 bg-danger-soft px-3.5 py-2.5">
            <CircleAlert size={15} className="mt-0.5 shrink-0 text-danger" />
            <p className="text-xs text-danger">{formError}</p>
          </div>
        )}
        <Button className="w-full" onClick={handleSubmit} disabled={submitting}>
          {submitting ? "ინახება..." : "შენახვა"}
        </Button>
      </FormSheet>
    </div>
  );
}
