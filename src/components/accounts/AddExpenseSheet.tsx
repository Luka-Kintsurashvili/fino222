import { useState } from "react";
import { FormSheet } from "@/components/ui/FormSheet";
import { TextField } from "@/components/ui/TextField";
import { NumberField } from "@/components/ui/NumberField";
import { Button } from "@/components/ui/Button";
import { budgetCategories, type BudgetCategoryKey } from "@/data/budgetCategories";
import { useLanguage } from "@/lib/LanguageContext";
import type { TransactionInput } from "@/types/transaction";

interface AddExpenseSheetProps {
  open: boolean;
  onClose: () => void;
  onAdd: (input: TransactionInput) => void;
  projectId: string;
}

/** Manual expense entry scoped to a single project (e.g. cash spending a bank sync wouldn't catch). */
export function AddExpenseSheet({ open, onClose, onAdd, projectId }: AddExpenseSheetProps) {
  const { t } = useLanguage();
  const [amount, setAmount] = useState(0);
  const [category, setCategory] = useState<BudgetCategoryKey>("other");
  const [note, setNote] = useState("");

  function handleSubmit() {
    if (amount <= 0) return;
    onAdd({
      type: "expense",
      amount,
      category,
      project_id: projectId,
      note: note.trim(),
      date: new Date().toISOString().slice(0, 10),
    });
    setAmount(0);
    setNote("");
    setCategory("other");
    onClose();
  }

  return (
    <FormSheet open={open} title={t("addExpense")} onClose={onClose}>
      <NumberField label={t("amount")} value={amount} onChange={setAmount} suffix="₾" step={10} />

      <div>
        <span className="mb-2 block text-sm font-medium text-text-secondary">{t("category")}</span>
        <div className="grid grid-cols-3 gap-2.5">
          {budgetCategories.map((cat) => {
            const active = cat.key === category;
            const Icon = cat.icon;
            return (
              <button
                key={cat.key}
                type="button"
                onClick={() => setCategory(cat.key)}
                className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 transition-colors ${
                  active ? "border-accent/50 bg-accent-soft" : "border-border bg-surface hover:border-accent/30"
                }`}
              >
                <span className={`flex h-8 w-8 items-center justify-center rounded-lg text-white ${cat.colorClass}`}>
                  <Icon size={15} />
                </span>
                <span className="text-center text-[11px] font-medium leading-tight text-text-secondary">{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <TextField label={t("note")} value={note} onChange={setNote} placeholder={t("notePlaceholder")} />

      <Button className="w-full" onClick={handleSubmit}>
        {t("save")}
      </Button>
    </FormSheet>
  );
}
