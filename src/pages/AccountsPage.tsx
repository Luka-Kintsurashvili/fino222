import { useEffect, useState } from "react";
import { Plus, Wallet, FolderKanban, RefreshCw, Link2, CircleAlert } from "lucide-react";
import { SubPageHeader } from "@/components/ui/SubPageHeader";
import { AuthGate } from "@/components/ui/AuthGate";
import { AccountCardCarousel } from "@/components/accounts/AccountCardCarousel";
import { GraphsTile } from "@/components/accounts/GraphsTile";
import { NetWorthTile } from "@/components/accounts/NetWorthTile";
import { FundsQuickTile } from "@/components/accounts/FundsQuickTile";
import { CalendarQuickTile } from "@/components/accounts/CalendarQuickTile";
import { LoanQuickTile } from "@/components/accounts/LoanQuickTile";
import { LoanSheet } from "@/components/loan/LoanSheet";
import { BudgetQuickTile } from "@/components/accounts/BudgetQuickTile";
import { BudgetSheet } from "@/components/budget/BudgetSheet";
import { TransactionList } from "@/components/accounts/TransactionList";
import { ProjectList } from "@/components/accounts/ProjectList";
import { AddProjectSheet } from "@/components/accounts/AddProjectSheet";
import { useAccounts } from "@/hooks/useAccounts";
import { useTransactions } from "@/hooks/useTransactions";
import { useProjects } from "@/hooks/useProjects";
import { useTbcConnection } from "@/hooks/useTbcConnection";
import { useAuth } from "@/lib/AuthContext";
import { useChartDrawer } from "@/lib/ChartDrawerContext";
import { useQuickSheet } from "@/lib/QuickSheetContext";
import { formatGEL } from "@/lib/format";
import { useLanguage } from "@/lib/LanguageContext";

export function AccountsPage() {
  const { t } = useLanguage();
  const { user, loading: authLoading } = useAuth();

  if (authLoading) return null;
  if (!user) {
    return (
      <div className="space-y-5">
        <SubPageHeader title={t("accountsTitle")} subtitle={t("accountsSubtitle")} showBack={false} />
        <AuthGate message={t("accountsAuthGate")} />
      </div>
    );
  }

  return <AccountsContent />;
}

function AccountsContent() {
  const { t } = useLanguage();
  const { accounts, totalBalance, loading: accountsLoading, refresh: refreshAccounts } = useAccounts();
  const { expenses, removeTransaction, updateTransactionProject, refresh: refreshTransactions, loading: txLoading } = useTransactions();
  const { projects, addProject, spentByProject, loading: projectsLoading } = useProjects(expenses);
  const { status: tbcStatus, connect: connectTbc, sync: syncTbc } = useTbcConnection();
  const { openDrawer } = useChartDrawer();
  const { target, consume } = useQuickSheet();
  const [addProjectOpen, setAddProjectOpen] = useState(false);
  const [loanOpen, setLoanOpen] = useState(false);
  const [loanMode, setLoanMode] = useState<"compare" | "approval">("compare");
  const [budgetOpen, setBudgetOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (target === "loan") {
      setLoanMode("compare");
      setLoanOpen(true);
      consume();
    } else if (target === "budget") {
      setBudgetOpen(true);
      consume();
    } else if (target === "credit") {
      setLoanMode("approval");
      setLoanOpen(true);
      consume();
    }
  }, [target, consume]);

  const loading = accountsLoading || txLoading || projectsLoading;
  const tbcConnected = tbcStatus === "active";

  async function handleConnect() {
    setSyncMessage(null);
    setSyncing(true);
    const error = await connectTbc();
    setSyncing(false);
    if (error) {
      setSyncMessage({ type: "error", text: error });
      return;
    }
    await refreshAccounts();
  }

  async function handleSync() {
    setSyncing(true);
    setSyncMessage(null);
    const result = await syncTbc();
    setSyncing(false);
    if ("error" in result) {
      setSyncMessage({ type: "error", text: result.error });
      return;
    }
    setSyncMessage({ type: "success", text: t("syncSuccess").replace("{count}", String(result.imported)) });
    await refreshTransactions();
  }

  return (
    <div className="space-y-5">
      <SubPageHeader title={t("accountsTitle")} subtitle={t("accountsSubtitle")} showBack={false} />

      {loading ? (
        <p className="text-sm text-text-muted">{t("loadingText")}</p>
      ) : (
        <>
          <button
            onClick={() => openDrawer()}
            className="w-full rounded-3xl gradient-accent p-5 text-left text-white shadow-[0_12px_28px_-10px_rgba(99,102,241,0.5)]"
          >
            <div className="flex items-center gap-2 text-white/80">
              <Wallet size={15} />
              <p className="text-xs font-medium">{t("totalBalance")}</p>
            </div>
            <p className="mt-1.5 text-3xl font-bold tabular">{formatGEL(totalBalance)}</p>
          </button>

          <AccountCardCarousel
            accounts={accounts}
            onConnectClick={tbcConnected ? handleSync : handleConnect}
            connecting={syncing}
          />

          <div className="grid grid-cols-2 gap-2.5">
            <GraphsTile />
            <NetWorthTile />
          </div>

          <div className="grid grid-cols-4 gap-2">
            <FundsQuickTile />
            <CalendarQuickTile />
            <LoanQuickTile
              onClick={() => {
                setLoanMode("compare");
                setLoanOpen(true);
              }}
            />
            <BudgetQuickTile onClick={() => setBudgetOpen(true)} />
          </div>

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
              onClick={tbcConnected ? handleSync : handleConnect}
              disabled={syncing}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-surface text-text-secondary hover:border-accent/50 disabled:opacity-60"
              aria-label={tbcConnected ? t("syncTbc") : t("connectTbc")}
              title={tbcConnected ? t("syncTbc") : t("connectTbc")}
            >
              {tbcConnected ? (
                <RefreshCw size={15} className={syncing ? "animate-spin" : ""} />
              ) : (
                <Link2 size={15} className={syncing ? "animate-pulse" : ""} />
              )}
            </button>
          </div>

          {syncMessage && (
            <div
              className={`flex items-start gap-2 rounded-xl border px-3.5 py-2.5 text-xs ${
                syncMessage.type === "error"
                  ? "border-danger/30 bg-danger-soft text-danger"
                  : "border-success/30 bg-success-soft text-success"
              }`}
            >
              {syncMessage.type === "error" && <CircleAlert size={14} className="mt-0.5 shrink-0" />}
              <p>{syncMessage.text}</p>
            </div>
          )}

          <TransactionList expenses={expenses} onDelete={removeTransaction} projects={projects} onAssignProject={updateTransactionProject} />
        </>
      )}

      <AddProjectSheet open={addProjectOpen} onClose={() => setAddProjectOpen(false)} onAdd={addProject} />
      <LoanSheet open={loanOpen} onClose={() => setLoanOpen(false)} initialMode={loanMode} />
      <BudgetSheet open={budgetOpen} onClose={() => setBudgetOpen(false)} />
    </div>
  );
}
