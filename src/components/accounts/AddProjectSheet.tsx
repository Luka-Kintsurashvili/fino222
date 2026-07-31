import { useState } from "react";
import { CircleAlert } from "lucide-react";
import { FormSheet } from "@/components/ui/FormSheet";
import { TextField } from "@/components/ui/TextField";
import { NumberField } from "@/components/ui/NumberField";
import { Button } from "@/components/ui/Button";
import { useLanguage } from "@/lib/LanguageContext";
import type { ProjectInput } from "@/types/project";

interface AddProjectSheetProps {
  open: boolean;
  onClose: () => void;
  onAdd: (project: ProjectInput) => Promise<string | null>;
}

export function AddProjectSheet({ open, onClose, onAdd }: AddProjectSheetProps) {
  const { t } = useLanguage();
  const [name, setName] = useState("");
  const [hasBudget, setHasBudget] = useState(false);
  const [budget, setBudget] = useState(1000);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (!name.trim()) return;
    setSubmitting(true);
    const err = await onAdd({ name: name.trim(), budget: hasBudget ? budget : null });
    setSubmitting(false);
    if (err) {
      setError(err);
      return;
    }
    setName("");
    setHasBudget(false);
    setBudget(1000);
    setError(null);
    onClose();
  }

  return (
    <FormSheet open={open} title={t("addProject")} onClose={onClose}>
      <TextField label={t("projectName")} value={name} onChange={setName} placeholder={t("projectNamePlaceholder")} />

      <label className="flex items-center gap-2.5 text-sm text-text-secondary">
        <input
          type="checkbox"
          checked={hasBudget}
          onChange={(e) => setHasBudget(e.target.checked)}
          className="h-4 w-4 accent-accent"
        />
        {t("setBudget")}
      </label>

      {hasBudget && <NumberField label={t("projectBudget")} value={budget} onChange={setBudget} suffix="₾" step={100} />}

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-danger/30 bg-danger-soft px-3.5 py-2.5">
          <CircleAlert size={15} className="mt-0.5 shrink-0 text-danger" />
          <p className="text-xs text-danger">{error}</p>
        </div>
      )}

      <Button className="w-full" onClick={handleSubmit} disabled={submitting}>
        {submitting ? t("saving") : t("save")}
      </Button>
    </FormSheet>
  );
}
