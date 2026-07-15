import { useState } from "react";
import { FormSheet } from "@/components/ui/FormSheet";
import { TextField } from "@/components/ui/TextField";
import { NumberField } from "@/components/ui/NumberField";
import { Button } from "@/components/ui/Button";
import { BankLogo } from "@/components/ui/BankLogo";
import { banks } from "@/data/banks";
import { useLanguage } from "@/lib/LanguageContext";
import type { BankAccount } from "@/types/account";

interface AddAccountSheetProps {
  open: boolean;
  onClose: () => void;
  onAdd: (account: Omit<BankAccount, "id">) => void;
}

export function AddAccountSheet({ open, onClose, onAdd }: AddAccountSheetProps) {
  const { t } = useLanguage();
  const [bankId, setBankId] = useState(banks[0].id);
  const [nickname, setNickname] = useState("");
  const [balance, setBalance] = useState(0);

  function handleSubmit() {
    const last4 = String(Math.floor(1000 + Math.random() * 9000));
    onAdd({ bankId, nickname: nickname.trim() || banks.find((b) => b.id === bankId)!.name, balance, last4 });
    setNickname("");
    setBalance(0);
    onClose();
  }

  return (
    <FormSheet open={open} title={t("addAccount")} onClose={onClose}>
      <div>
        <span className="mb-2 block text-sm font-medium text-text-secondary">{t("bank")}</span>
        <div className="grid grid-cols-3 gap-2.5">
          {banks.map((bank) => {
            const active = bank.id === bankId;
            return (
              <button
                key={bank.id}
                type="button"
                onClick={() => setBankId(bank.id)}
                className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 transition-colors ${
                  active ? "border-accent/50 bg-accent-soft" : "border-border bg-surface hover:border-accent/30"
                }`}
              >
                <BankLogo bank={bank} size={30} />
                <span className="text-center text-[11px] font-medium leading-tight text-text-secondary">
                  {bank.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <TextField label={t("accountNickname")} value={nickname} onChange={setNickname} placeholder={t("accountNicknamePlaceholder")} />
      <NumberField label={t("balance")} value={balance} onChange={setBalance} suffix="₾" />

      <Button className="w-full" onClick={handleSubmit}>
        {t("save")}
      </Button>
    </FormSheet>
  );
}
