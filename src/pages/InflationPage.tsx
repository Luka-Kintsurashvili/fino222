import { useMemo, useState } from "react";
import { TrendingDown, TrendingUp } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { NumberField } from "@/components/ui/NumberField";
import { SliderField } from "@/components/ui/SliderField";
import { formatGEL, formatPercent } from "@/lib/format";
import { purchasingPower, equivalentFutureAmount } from "@/lib/inflation";
import { georgiaInflationHistory, georgiaInflationAverage } from "@/data/inflationHistory";
import { useLanguage } from "@/lib/LanguageContext";

const inflationMaxRate = Math.max(...georgiaInflationHistory.map((h) => h.rate));

export function InflationPage() {
  const { t } = useLanguage();
  const [amount, setAmount] = useState(1000);
  const [years, setYears] = useState(10);
  const [rate, setRate] = useState(6);

  const power = useMemo(() => purchasingPower(amount, rate / 100, years), [amount, rate, years]);
  const equivalent = useMemo(() => equivalentFutureAmount(amount, rate / 100, years), [amount, rate, years]);
  const lossPct = amount > 0 ? 100 - (power / amount) * 100 : 0;

  return (
    <div className="space-y-5">
      <PageHeader title={t("inflationTitle")} subtitle={t("inflationSubtitle")} />

      <Card className="space-y-4">
        <NumberField label="დღევანდელი თანხა" value={amount} onChange={setAmount} suffix="₾" step={100} />
        <NumberField label="წლების რაოდენობა" value={years} onChange={setYears} suffix="წელი" min={1} max={50} />
        <SliderField
          label="წლიური ინფლაციის განაკვეთი"
          value={rate}
          onChange={setRate}
          min={0}
          max={20}
          step={0.1}
          formatValue={(v) => formatPercent(v)}
        />
      </Card>

      <Card className="relative overflow-hidden border-danger/20">
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-rose-500/15 blur-[60px]" />
        <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-rose-400">
          <TrendingDown size={14} />
          მსყიდველობითი უნარი {years} წელიწადში
        </div>
        <p className="font-mono text-3xl font-bold tabular text-text-primary">{formatGEL(power, { decimals: 2 })}</p>
        <p className="mt-2 text-sm text-text-secondary">
          დღევანდელი {formatGEL(amount)} დაკარგავს ღირებულების{" "}
          <span className="font-mono font-semibold text-danger">{formatPercent(lossPct)}</span>-ს
        </p>
      </Card>

      <Card className="relative overflow-hidden border-accent/20">
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-accent-to/15 blur-[60px]" />
        <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-violet-400">
          <TrendingUp size={14} />
          საჭირო თანხა იგივე ღირებულებისთვის
        </div>
        <p className="font-mono text-3xl font-bold tabular text-text-primary">
          {formatGEL(equivalent, { decimals: 2 })}
        </p>
        <p className="mt-2 text-sm text-text-secondary">
          {years} წელიწადში დაგჭირდება ეს თანხა, რომ იყიდო დღევანდელი {formatGEL(amount)}-ის ექვივალენტი
        </p>
      </Card>

      <Card>
        <h3 className="mb-1 font-semibold text-text-primary">საქართველოს ინფლაცია ბოლო წლებში</h3>
        <p className="mb-4 text-xs text-text-muted">წლიური საშუალო CPI, საქსტატის მონაცემებით</p>
        <div className="space-y-3">
          {georgiaInflationHistory.map((y) => {
            const pct = (y.rate / inflationMaxRate) * 100;
            return (
              <div key={y.year} className="flex items-center gap-3">
                <span className="w-10 shrink-0 font-mono text-xs tabular text-text-muted">{y.year}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-bg-elevated">
                  <div className="h-full rounded-full gradient-accent" style={{ width: `${pct}%` }} />
                </div>
                <span className="w-14 shrink-0 text-right font-mono text-sm font-semibold tabular text-text-primary">
                  {formatPercent(y.rate)}
                </span>
              </div>
            );
          })}
          <div className="flex items-center gap-3 border-t border-border-soft pt-3">
            <span className="w-10 shrink-0 text-xs font-medium text-text-secondary">საშ.</span>
            <div className="flex-1" />
            <span className="w-14 shrink-0 text-right font-mono text-sm font-bold tabular text-accent-to">
              {formatPercent(georgiaInflationAverage)}
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
}
