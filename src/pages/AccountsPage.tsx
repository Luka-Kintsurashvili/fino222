import { useState } from "react";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { AccountCardCarousel } from "@/components/accounts/AccountCardCarousel";
import { AddAccountSheet } from "@/components/accounts/AddAccountSheet";
import { GraphsTile } from "@/components/accounts/GraphsTile";
import { TransactionList } from "@/components/accounts/TransactionList";
import { AddTransactionSheet } from "@/components/accounts/AddTransactionSheet";
import { useAccounts } from "@/hooks/useAccounts";
import { useTransactions } from "@/hooks/useTransactions";
import { formatGEL } from "@/lib/format";
import { useLanguage } from "@/lib/LanguageContext";

export function AccountsPage() {
  const { t } = useLanguage();
  const { accounts, addAccount, totalBalance } = useAccounts();
  const { expenses, addTransaction, removeTransaction } = useTransactions();
  const [addAccountOpen, setAddAccountOpen] = useState(false);
  const [addTransactionOpen, setAddTransactionOpen] = useState(false);

  return (
    <div className="space-y-5">
      <PageHeader title={t("accountsTitle")} subtitle={t("accountsSubtitle")} />

      <Card className="!p-5">
        <p className="text-xs font-medium text-text-muted">{t("totalBalance")}</p>
        <p className="mt-1 text-3xl font-bold tabular text-text-primary">{formatGEL(totalBalance)}</p>
      </Card>

      <AccountCardCarousel accounts={accounts} onAddClick={() => setAddAccountOpen(true)} />

      <GraphsTile />

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-text-primary">{t("expenses")}</h2>
        <button
          onClick={() => setAddTransactionOpen(true)}
          className="flex h-8 w-8 items-center justify-center rounded-lg gradient-accent text-white"
          aria-label={t("addTransaction")}
        >
          <Plus size={16} />
        </button>
      </div>

      <TransactionList expenses={expenses} onDelete={removeTransaction} />

      <AddAccountSheet open={addAccountOpen} onClose={() => setAddAccountOpen(false)} onAdd={addAccount} />
      <AddTransactionSheet open={addTransactionOpen} onClose={() => setAddTransactionOpen(false)} onAdd={addTransaction} />
    </div>
  );
}
