import { useEffect, useState } from "react";
import { ArrowDown, ChevronDown, WifiOff } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { CurrencyPickerSheet } from "@/components/currency/CurrencyPickerSheet";
import { formatNumber } from "@/lib/format";
import { currencies, convert, fetchGelRates, type CurrencyCode, type RatesResult } from "@/lib/currency";

function currencyMeta(code: CurrencyCode) {
  return currencies.find((c) => c.code === code)!;
}

export function CurrencyPage() {
  const [amount, setAmount] = useState(100);
  const [amountText, setAmountText] = useState("100");
  const [from, setFrom] = useState<CurrencyCode>("USD");
  const [to, setTo] = useState<CurrencyCode>("GEL");
  const [ratesResult, setRatesResult] = useState<RatesResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [picker, setPicker] = useState<"from" | "to" | null>(null);

  function handleAmountChange(raw: string) {
    setAmountText(raw);
    if (raw === "" || raw === "-") return;
    const num = Number(raw);
    if (!Number.isNaN(num)) setAmount(num);
  }

  function handleAmountBlur() {
    if (amountText === "" || Number.isNaN(Number(amountText))) setAmountText(String(amount));
  }

  useEffect(() => {
    fetchGelRates().then((r) => {
      setRatesResult(r);
      setLoading(false);
    });
  }, []);

  const result = ratesResult ? convert(amount, from, to, ratesResult.rates) : null;

  function swap() {
    setFrom(to);
    setTo(from);
  }

  const fromMeta = currencyMeta(from);
  const toMeta = currencyMeta(to);

  return (
    <div className="space-y-5">
      <PageHeader title="ვალუტის კონვერტორი" subtitle="რეალურ დროში კურსები" />

      {ratesResult && !ratesResult.live && (
        <div className="flex items-center gap-2 rounded-xl border border-warning/30 bg-warning-soft px-4 py-2.5 text-xs text-warning">
          <WifiOff size={14} />
          ვერ მოხერხდა კურსების განახლება — ნაჩვენებია სავარაუდო კურსი
        </div>
      )}

      <div className="relative space-y-2">
        <Card className="!p-4">
          <p className="mb-2 text-xs font-medium text-text-muted">გაქვს</p>
          <div className="flex items-center gap-3">
            <input
              type="number"
              inputMode="decimal"
              value={amountText}
              onFocus={(e) => e.target.select()}
              onChange={(e) => handleAmountChange(e.target.value)}
              onBlur={handleAmountBlur}
              className="w-full min-w-0 bg-transparent font-mono text-3xl font-semibold tabular text-text-primary outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
            <button
              onClick={() => setPicker("from")}
              className="flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-surface py-2 pl-2 pr-3 transition-colors hover:border-accent/50"
            >
              <span className="text-lg leading-none">{fromMeta.flag}</span>
              <span className="font-mono text-sm font-semibold text-text-primary">{fromMeta.code}</span>
              <ChevronDown size={14} className="text-text-muted" />
            </button>
          </div>
        </Card>

        <div className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2">
          <button
            onClick={swap}
            className="flex h-10 w-10 items-center justify-center rounded-full gradient-accent text-white shadow-[0_4px_16px_rgba(99,102,241,0.5)] ring-4 ring-bg transition-transform active:scale-90"
            aria-label="ვალუტების გაცვლა"
          >
            <ArrowDown size={18} />
          </button>
        </div>

        <Card className="!p-4 border-accent/20">
          <p className="mb-2 text-xs font-medium text-text-muted">მიიღებ</p>
          <div className="flex items-center gap-3">
            <div className="w-full min-w-0 truncate font-mono text-3xl font-semibold tabular text-text-primary">
              {loading ? "..." : result !== null ? formatNumber(result, 2) : "-"}
            </div>
            <button
              onClick={() => setPicker("to")}
              className="flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-surface py-2 pl-2 pr-3 transition-colors hover:border-accent/50"
            >
              <span className="text-lg leading-none">{toMeta.flag}</span>
              <span className="font-mono text-sm font-semibold text-text-primary">{toMeta.code}</span>
              <ChevronDown size={14} className="text-text-muted" />
            </button>
          </div>
        </Card>
      </div>

      {ratesResult && result !== null && (
        <p className="text-center font-mono text-xs tabular text-text-muted">
          1 {fromMeta.code} = {formatNumber(convert(1, from, to, ratesResult.rates), 4)} {toMeta.code}
        </p>
      )}

      {ratesResult && (
        <Card>
          <h3 className="mb-3 font-semibold text-text-primary">1 ლარი =</h3>
          <div className="grid grid-cols-2 gap-3">
            {currencies
              .filter((c) => c.code !== "GEL")
              .map((c) => (
                <div
                  key={c.code}
                  className="flex items-center justify-between rounded-xl border border-border-soft bg-bg-elevated px-3.5 py-3"
                >
                  <span className="flex items-center gap-1.5 text-sm text-text-secondary">
                    <span className="text-base leading-none">{c.flag}</span>
                    {c.code}
                  </span>
                  <span className="font-mono text-sm font-semibold tabular text-text-primary">
                    {formatNumber(ratesResult.rates[c.code], 4)}
                  </span>
                </div>
              ))}
          </div>
        </Card>
      )}

      <CurrencyPickerSheet
        open={picker === "from"}
        selected={from}
        onSelect={setFrom}
        onClose={() => setPicker(null)}
      />
      <CurrencyPickerSheet open={picker === "to"} selected={to} onSelect={setTo} onClose={() => setPicker(null)} />
    </div>
  );
}
