import { useState } from "react";
import { CircleAlert } from "lucide-react";
import { FormSheet } from "@/components/ui/FormSheet";
import { TextField } from "@/components/ui/TextField";
import { NumberField } from "@/components/ui/NumberField";
import { Button } from "@/components/ui/Button";
import { tagColors } from "@/data/tagColors";
import { useLanguage } from "@/lib/LanguageContext";
import type { PaymentInput } from "@/types/payment";

interface AddPaymentSheetProps {
  open: boolean;
  onClose: () => void;
  onAdd: (input: PaymentInput) => Promise<string | null>;
}

export function AddPaymentSheet({ open, onClose, onAdd }: AddPaymentSheetProps) {
  const { t } = useLanguage();
  const [name, setName] = useState("");
  const [amount, setAmount] = useState(50);
  const [day, setDay] = useState(1);
  const [color, setColor] = useState(tagColors[0].value);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function handleClose() {
    setFormError(null);
    onClose();
  }

  async function handleSubmit() {
    if (!name.trim() || amount <= 0) {
      setFormError(t("fillNameAndAmount"));
      return;
    }
    setSubmitting(true);
    const error = await onAdd({ name: name.trim(), amount, day_of_month: Math.min(31, Math.max(1, day)), color });
    setSubmitting(false);
    if (error) {
      setFormError(error);
      return;
    }
    setName("");
    setAmount(50);
    setDay(1);
    setColor(tagColors[0].value);
    setFormError(null);
    onClose();
  }

  return (
    <FormSheet open={open} title={t("recurringPaymentTitle")} onClose={handleClose}>
      <TextField label={t("paymentName")} value={name} onChange={setName} placeholder={t("paymentNamePlaceholder")} />
      <NumberField label={t("amount")} value={amount} onChange={setAmount} suffix="₾" step={10} />
      <NumberField label={t("dayOfMonthLabel")} value={day} onChange={setDay} min={1} max={31} />
      <div>
        <span className="mb-2 block text-sm font-medium text-text-secondary">{t("colorTagLabel")}</span>
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
        {submitting ? t("saving") : t("save")}
      </Button>
    </FormSheet>
  );
}
