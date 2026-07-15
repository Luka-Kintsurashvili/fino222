import { useNavigate } from "react-router-dom";
import { FolderKanban, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { formatGEL } from "@/lib/format";
import { useLanguage } from "@/lib/LanguageContext";
import type { Project } from "@/types/project";

interface ProjectListProps {
  projects: Project[];
  spentByProject: Map<string, number>;
}

export function ProjectList({ projects, spentByProject }: ProjectListProps) {
  const { t } = useLanguage();
  const navigate = useNavigate();

  if (projects.length === 0) {
    return (
      <Card className="flex flex-col items-center gap-2 py-8 text-center">
        <FolderKanban className="text-text-muted" size={24} />
        <p className="text-sm text-text-secondary">{t("noProjects")}</p>
        <p className="text-xs text-text-muted">{t("noProjectsHint")}</p>
      </Card>
    );
  }

  return (
    <div className="space-y-2.5">
      {projects.map((project) => {
        const spent = spentByProject.get(project.id) ?? 0;
        const pct = project.budget ? Math.min((spent / project.budget) * 100, 100) : null;
        return (
          <button
            key={project.id}
            onClick={() => navigate(`/projects/${project.id}`)}
            className="flex w-full items-center gap-3 rounded-2xl border border-border-soft bg-surface p-4 text-left transition-colors hover:border-accent/40"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent">
              <FolderKanban size={19} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-text-primary">{project.name}</p>
              <p className="mt-0.5 font-mono text-xs tabular text-text-muted">
                {formatGEL(spent)}
                {project.budget ? ` / ${formatGEL(project.budget)}` : ` ${t("spentSoFar")}`}
              </p>
              {pct !== null && (
                <div className="mt-2">
                  <ProgressBar percent={pct} />
                </div>
              )}
            </div>
            <ChevronRight size={18} className="shrink-0 text-text-muted" />
          </button>
        );
      })}
    </div>
  );
}
