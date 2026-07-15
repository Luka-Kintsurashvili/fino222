import { useState } from "react";
import { Plus, Wallet, FolderKanban } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { AccountCardCarousel } from "@/components/accounts/AccountCardCarousel";
import { AddAccountSheet } from "@/components/accounts/AddAccountSheet";
import { GraphsTile } from "@/components/accounts/GraphsTile";
import { TransactionList } from "@/components/accounts/TransactionList";
import { AddTransactionSheet } from "@/components/accounts/AddTransactionSheet";
import { ProjectList } from "@/components/accounts/ProjectList";
import { AddProjectSheet } from "@/components/accounts/AddProjectSheet";
import { useAccounts } from "@/hooks/useAccounts";
import { useTransactions } from "@/hooks/useTransactions";
import { useProjects } from "@/hooks/useProjects";
import { formatGEL } from "@/lib/format";
import { useLanguage } from "@/lib/LanguageContext";

export function AccountsPage() {
  const { t } = useLanguage();
  const { accounts, addAccount, totalBalance } = useAccounts();
  const { expenses, addTransaction, removeTransaction } = useTransactions();
  const { projects, addProject, spentByProject } = useProjects(expenses);
  const [addAccountOpen, setAddAccountOpen] = useState(false);
  const [addTransactionOpen, setAddTransactionOpen] = useState(false);
  const [addProjectOpen, setAddProjectOpen] = useState(false);

  return (
    <div className="space-y-5">
      <PageHeader title={t("accountsTitle")} subtitle={t("accountsSubtitle")} />

      <div className="relative overflow-hidden rounded-3xl gradient-accent p-5 text-white shadow-[0_16px_36px_-8px_rgba(99,102,241,0.5)]">
        <div
          className="pointer-events-none absolute -right-12 -top-16 h-44 w-44 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 70%)" }}
        />
        <div className="relative flex items-center gap-2 text-white/80">
          <Wallet size={15} />
          <p className="text-xs font-medium">{t("totalBalance")}</p>
        </div>
        <p className="relative mt-1.5 text-3xl font-bold tabular">{formatGEL(totalBalance)}</p>
      </div>

      <AccountCardCarousel accounts={accounts} onAddClick={() => setAddAccountOpen(true)} />

      <GraphsTile />

      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-bold text-text-primary">
          <FolderKanban size={18} className="text-accent" />
          {t("projects")}
        </h2>
        <button
          onClick={() => setAddProjectOpen(true)}
          className="flex h-8 w-8 items-center justify-center rounded-lg gradient-accent text-white"
          aria-label={t("addProject")}
        >
          <Plus size={16} />
        </button>
      </div>

      <ProjectList projects={projects} spentByProject={spentByProject} />

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
      <AddTransactionSheet
        open={addTransactionOpen}
        onClose={() => setAddTransactionOpen(false)}
        onAdd={addTransaction}
        projects={projects}
      />
      <AddProjectSheet open={addProjectOpen} onClose={() => setAddProjectOpen(false)} onAdd={addProject} />
    </div>
  );
}
