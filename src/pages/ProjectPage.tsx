import { useState } from "react";
import { useParams, Navigate } from "react-router-dom";
import { Trash2, Plus } from "lucide-react";
import { SubPageHeader } from "@/components/ui/SubPageHeader";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Button } from "@/components/ui/Button";
import { AuthGate } from "@/components/ui/AuthGate";
import { TransactionList } from "@/components/accounts/TransactionList";
import { AddExpenseSheet } from "@/components/accounts/AddExpenseSheet";
import { useTransactions } from "@/hooks/useTransactions";
import { useProjects } from "@/hooks/useProjects";
import { useAuth } from "@/lib/AuthContext";
import { formatGEL } from "@/lib/format";
import { useLanguage } from "@/lib/LanguageContext";

export function ProjectPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useLanguage();
  const { user, loading: authLoading } = useAuth();

  if (authLoading) return null;
  if (!user) {
    return (
      <div className="space-y-5">
        <SubPageHeader title={t("projects")} />
        <AuthGate message={t("projectsAuthGate")} />
      </div>
    );
  }

  return <ProjectDetail id={id} />;
}

function ProjectDetail({ id }: { id: string | undefined }) {
  const { t } = useLanguage();
  const { expenses, removeTransaction, addTransaction, loading: txLoading } = useTransactions();
  const { projects, removeProject, loading: projectsLoading } = useProjects(expenses);
  const [addExpenseOpen, setAddExpenseOpen] = useState(false);

  if (txLoading || projectsLoading) return <p className="text-sm text-text-muted">{t("loadingText")}</p>;

  const project = projects.find((p) => p.id === id);
  if (!project) return <Navigate to="/wallet" replace />;

  const projectExpenses = expenses.filter((e) => e.project_id === project.id);
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
          onClick={() => setAddExpenseOpen(true)}
          className="flex h-8 w-8 items-center justify-center rounded-lg gradient-accent text-white"
          aria-label={t("addExpense")}
        >
          <Plus size={16} />
        </button>
      </div>

      <TransactionList expenses={projectExpenses} onDelete={removeTransaction} />

      <Button variant="danger" className="w-full" onClick={() => removeProject(project.id)}>
        <Trash2 size={16} />
        {t("deleteProject")}
      </Button>

      <AddExpenseSheet open={addExpenseOpen} onClose={() => setAddExpenseOpen(false)} onAdd={addTransaction} projectId={project.id} />
    </div>
  );
}
