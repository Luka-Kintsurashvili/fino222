import { useState } from "react";
import { FormSheet } from "@/components/ui/FormSheet";
import { TextField } from "@/components/ui/TextField";
import { NumberField } from "@/components/ui/NumberField";
import { Button } from "@/components/ui/Button";
import { useLanguage } from "@/lib/LanguageContext";
import type { Project } from "@/types/project";

interface AddProjectSheetProps {
  open: boolean;
  onClose: () => void;
  onAdd: (project: Omit<Project, "id">) => void;
}

export function AddProjectSheet({ open, onClose, onAdd }: AddProjectSheetProps) {
  const { t } = useLanguage();
  const [name, setName] = useState("");
  const [hasBudget, setHasBudget] = useState(false);
  const [budget, setBudget] = useState(1000);

  function handleSubmit() {
    if (!name.trim()) return;
    onAdd({ name: name.trim(), budget: hasBudget ? budget : undefined });
    setName("");
    setHasBudget(false);
    setBudget(1000);
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

      <Button className="w-full" onClick={handleSubmit}>
        {t("save")}
      </Button>
    </FormSheet>
  );
}
