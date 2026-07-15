import { useState } from "react";
import { FormSheet } from "@/components/ui/FormSheet";
import { TextField } from "@/components/ui/TextField";
import { NumberField } from "@/components/ui/NumberField";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Button } from "@/components/ui/Button";
import { budgetCategories, type BudgetCategoryKey } from "@/data/budgetCategories";
import { useLanguage } from "@/lib/LanguageContext";
import type { Transaction, TransactionType } from "@/types/transaction";

interface AddTransactionSheetProps {
  open: boolean;
  onClose: () => void;
  onAdd: (t: Omit<Transaction, "id">) => void;
}

export function AddTransactionSheet({ open, onClose, onAdd }: AddTransactionSheetProps) {
  const { t } = useLanguage();
  const [type, setType] = useState<TransactionType>("expense");
  const [amount, setAmount] = useState(0);
  const [category, setCategory] = useState<BudgetCategoryKey>("food");
  const [note, setNote] = useState("");

  const typeOptions: { value: TransactionType; label: string }[] = [
    { value: "expense", label: t("expense") },
    { value: "income", label: t("income") },
  ];

  function handleSubmit() {
    if (amount <= 0) return;
    onAdd({
      type,
      amount,
      category: type === "expense" ? category : undefined,
      note: note.trim(),
      date: new Date().toISOString().slice(0, 10),
    });
    setAmount(0);
    setNote("");
    onClose();
  }

  return (
    <FormSheet open={open} title={t("addTransaction")} onClose={onClose}>
      <SegmentedControl options={typeOptions} value={type} onChange={setType} />

      <NumberField label={t("amount")} value={amount} onChange={setAmount} suffix="₾" step={10} />

      {type === "expense" && (
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
                  <span className="text-center text-[11px] font-medium leading-tight text-text-secondary">
                    {cat.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <TextField label={t("note")} value={note} onChange={setNote} placeholder={t("notePlaceholder")} />

      <Button className="w-full" onClick={handleSubmit}>
        {t("save")}
      </Button>
    </FormSheet>
  );
}
