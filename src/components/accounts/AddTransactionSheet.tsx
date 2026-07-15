import { useState } from "react";
import { FormSheet } from "@/components/ui/FormSheet";
import { TextField } from "@/components/ui/TextField";
import { NumberField } from "@/components/ui/NumberField";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Button } from "@/components/ui/Button";
import { budgetCategories, type BudgetCategoryKey } from "@/data/budgetCategories";
import { useLanguage } from "@/lib/LanguageContext";
import type { Transaction, TransactionType } from "@/types/transaction";
import type { Project } from "@/types/project";

interface AddTransactionSheetProps {
  open: boolean;
  onClose: () => void;
  onAdd: (t: Omit<Transaction, "id">) => void;
  projects?: Project[];
  defaultProjectId?: string;
}

export function AddTransactionSheet({ open, onClose, onAdd, projects = [], defaultProjectId }: AddTransactionSheetProps) {
  const { t } = useLanguage();
  const [type, setType] = useState<TransactionType>("expense");
  const [amount, setAmount] = useState(0);
  const [category, setCategory] = useState<BudgetCategoryKey>("food");
  const [projectId, setProjectId] = useState<string | undefined>(defaultProjectId);
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
      projectId: type === "expense" ? projectId : undefined,
      note: note.trim(),
      date: new Date().toISOString().slice(0, 10),
    });
    setAmount(0);
    setNote("");
    setProjectId(defaultProjectId);
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

      {type === "expense" && projects.length > 0 && !defaultProjectId && (
        <div>
          <span className="mb-2 block text-sm font-medium text-text-secondary">{t("project")}</span>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setProjectId(undefined)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                !projectId ? "border-accent/50 bg-accent-soft text-text-primary" : "border-border bg-surface text-text-secondary"
              }`}
            >
              {t("noProject")}
            </button>
            {projects.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setProjectId(p.id)}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                  projectId === p.id
                    ? "border-accent/50 bg-accent-soft text-text-primary"
                    : "border-border bg-surface text-text-secondary"
                }`}
              >
                {p.name}
              </button>
            ))}
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
