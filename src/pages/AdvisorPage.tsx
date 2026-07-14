import { useMemo, useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { NumberField } from "@/components/ui/NumberField";
import { TextField } from "@/components/ui/TextField";
import { formatGEL, monthsToYearsLabel } from "@/lib/format";
import { evaluateAdvisor } from "@/lib/advisor";

function defaultTargetDate() {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().slice(0, 10);
}

export function AdvisorPage() {
  const [income, setIncome] = useState(3000);
  const [food, setFood] = useState(600);
  const [transport, setTransport] = useState(200);
  const [entertainment, setEntertainment] = useState(250);
  const [other, setOther] = useState(300);
  const [goalName, setGoalName] = useState("");
  const [goalAmount, setGoalAmount] = useState(10000);
  const [targetDateStr, setTargetDateStr] = useState(defaultTargetDate());

  const result = useMemo(() => {
    const targetDate = new Date(targetDateStr);
    if (Number.isNaN(targetDate.getTime())) return null;
    return evaluateAdvisor({ income, food, transport, entertainment, other, goalAmount, targetDate });
  }, [income, food, transport, entertainment, other, goalAmount, targetDateStr]);

  return (
    <div className="space-y-5">
      <PageHeader title="ფინანსური მრჩეველი" subtitle="შეაფასე შენი გეგმის რეალისტურობა" />

      <Card className="space-y-4">
        <NumberField label="ყოველთვიური შემოსავალი" value={income} onChange={setIncome} suffix="₾" step={100} />
        <div className="grid grid-cols-2 gap-3">
          <NumberField label="საკვები" value={food} onChange={setFood} suffix="₾" step={50} />
          <NumberField label="ტრანსპორტი" value={transport} onChange={setTransport} suffix="₾" step={50} />
          <NumberField label="გართობა" value={entertainment} onChange={setEntertainment} suffix="₾" step={50} />
          <NumberField label="სხვა" value={other} onChange={setOther} suffix="₾" step={50} />
        </div>
      </Card>

      <Card className="space-y-4">
        <h3 className="font-semibold text-text-primary">მიზანი</h3>
        <TextField label="მიზნის სახელი" value={goalName} onChange={setGoalName} placeholder="მაგ. ევროპაში მოგზაურობა" />
        <NumberField label="სამიზნე თანხა" value={goalAmount} onChange={setGoalAmount} suffix="₾" step={500} />
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-text-secondary">სამიზნე თარიღი</span>
          <input
            type="date"
            value={targetDateStr}
            onChange={(e) => setTargetDateStr(e.target.value)}
            className="w-full rounded-xl border border-border bg-bg-elevated px-4 py-3 font-mono text-text-primary outline-none focus:border-accent"
          />
        </label>
      </Card>

      {result && (
        <>
          <Card className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-text-muted">სულ ხარჯები</p>
              <p className="font-mono text-lg font-semibold tabular text-text-primary">
                {formatGEL(result.totalExpenses)}
              </p>
            </div>
            <div>
              <p className="text-xs text-text-muted">თავისუფალი თანხა</p>
              <p
                className={`font-mono text-lg font-semibold tabular ${
                  result.leftover >= 0 ? "text-text-primary" : "text-danger"
                }`}
              >
                {formatGEL(result.leftover)}
              </p>
            </div>
            <div>
              <p className="text-xs text-text-muted">საჭირო ყოველთვიური დანაზოგი</p>
              <p className="font-mono text-lg font-semibold tabular text-text-primary">
                {formatGEL(result.requiredMonthlySavings, { decimals: 2 })}
              </p>
            </div>
            <div>
              <p className="text-xs text-text-muted">მიზნამდე დარჩენილია</p>
              <p className="font-mono text-lg font-semibold tabular text-text-primary">
                {monthsToYearsLabel(result.monthsToTarget)}
              </p>
            </div>
          </Card>

          <Card
            className={`flex items-start gap-3 ${
              result.isRealistic ? "border-success/30 bg-success-soft" : "border-danger/30 bg-danger-soft"
            }`}
          >
            {result.isRealistic ? (
              <CheckCircle2 className="mt-0.5 shrink-0 text-success" size={22} />
            ) : (
              <XCircle className="mt-0.5 shrink-0 text-danger" size={22} />
            )}
            <div>
              <p className={`font-semibold ${result.isRealistic ? "text-success" : "text-danger"}`}>
                {result.isRealistic ? "მიზანი რეალისტურია" : "მიზანი ამჟამად არარეალისტურია"}
              </p>
              <p className="mt-1 text-sm text-text-secondary">
                {result.isRealistic
                  ? `შენი ${formatGEL(result.leftover)} თავისუფალი თანხა საკმარისია${
                      goalName ? ` — "${goalName}"-ის` : ""
                    } მისაღწევად.`
                  : `გჭირდება დამატებით ${formatGEL(result.shortfall, {
                      decimals: 2,
                    })} ყოველთვიურად, ან გაზარდე ვადა / შეამცირე ხარჯები.`}
              </p>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
