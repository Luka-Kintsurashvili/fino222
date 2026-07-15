import { useState } from "react";
import { useParams, Navigate } from "react-router-dom";
import { Plus, Trash2 } from "lucide-react";
import { SubPageHeader } from "@/components/ui/SubPageHeader";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Button } from "@/components/ui/Button";
import { TransactionList } from "@/components/accounts/TransactionList";
import { AddTransactionSheet } from "@/components/accounts/AddTransactionSheet";
import { useTransactions } from "@/hooks/useTransactions";
import { useProjects } from "@/hooks/useProjects";
import { formatGEL } from "@/lib/format";
import { useLanguage } from "@/lib/LanguageContext";

export function ProjectPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useLanguage();
  const { expenses, addTransaction, removeTransaction } = useTransactions();
  const { projects, removeProject } = useProjects(expenses);
  const [addOpen, setAddOpen] = useState(false);

  const project = projects.find((p) => p.id === id);
  if (!project) return <Navigate to="/accounts" replace />;

  const projectExpenses = expenses.filter((e) => e.projectId === project.id);
  const spent = projectExpenses.reduce((sum, e) => sum + e.amount, 0);
  const pct = project.budget ? Math.min((spent / project.budget) * 100, 100) : null;

  return (
    <div className="space-y-5">
      <SubPageHeader title={project.name} subtitle={t("projectSubtitle")} />

      <Card>
        <p className="text-xs font-medium text-text-muted">{t("spentOnProject")}</p>
        <p className="mt-1 text-3xl font-bold tabular text-text-primary">
          {formatGEL(spent)}
          {project.budget && <span className="text-base font-medium text-text-muted"> / {formatGEL(project.budget)}</span>}
        </p>
        {pct !== null && (
          <div className="mt-3">
            <ProgressBar percent={pct} />
          </div>
        )}
      </Card>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-text-primary">{t("expenses")}</h2>
        <button
          onClick={() => setAddOpen(true)}
          className="flex h-8 w-8 items-center justify-center rounded-lg gradient-accent text-white"
          aria-label={t("addTransaction")}
        >
          <Plus size={16} />
        </button>
      </div>

      <TransactionList expenses={projectExpenses} onDelete={removeTransaction} />

      <Button variant="danger" className="w-full" onClick={() => removeProject(project.id)}>
        <Trash2 size={16} />
        {t("deleteProject")}
      </Button>

      <AddTransactionSheet
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onAdd={addTransaction}
        defaultProjectId={project.id}
      />
    </div>
  );
}
