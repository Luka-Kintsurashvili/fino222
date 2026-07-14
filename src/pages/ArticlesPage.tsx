import { useMemo, useState } from "react";
import { ChevronDown, Clock } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { articles, categoryLabels, type ArticleCategory } from "@/data/articles";
import { useLanguage } from "@/lib/LanguageContext";

export function ArticlesPage() {
  const { t } = useLanguage();
  const [category, setCategory] = useState<ArticleCategory | "all">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(
    () => (category === "all" ? articles : articles.filter((a) => a.category === category)),
    [category]
  );

  return (
    <div className="space-y-5">
      <PageHeader title={t("articlesTitle")} subtitle={t("articlesSubtitle")} />

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 no-scrollbar">
        <button
          onClick={() => setCategory("all")}
          className={`shrink-0 rounded-full border px-4 py-1.5 text-xs font-medium transition-colors ${
            category === "all" ? "border-accent/50 bg-accent-soft text-text-primary" : "border-border bg-surface text-text-secondary"
          }`}
        >
          ყველა
        </button>
        {(Object.keys(categoryLabels) as ArticleCategory[]).map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`shrink-0 rounded-full border px-4 py-1.5 text-xs font-medium transition-colors ${
              category === c ? "border-accent/50 bg-accent-soft text-text-primary" : "border-border bg-surface text-text-secondary"
            }`}
          >
            {categoryLabels[c]}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map((article) => {
          const expanded = expandedId === article.id;
          return (
            <Card key={article.id} className="cursor-pointer" onClick={() => setExpandedId(expanded ? null : article.id)}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <span className="mb-1.5 inline-block rounded-full bg-accent-soft px-2 py-0.5 text-[10px] font-medium text-accent-to">
                    {categoryLabels[article.category]}
                  </span>
                  <p className="font-semibold text-text-primary">{article.title}</p>
                  <p className="mt-1 text-sm text-text-secondary">{article.summary}</p>
                  <div className="mt-2 flex items-center gap-1 text-[11px] text-text-muted">
                    <Clock size={11} />
                    {article.readMinutes} წუთი
                  </div>
                </div>
                <ChevronDown
                  size={18}
                  className={`mt-1 shrink-0 text-text-muted transition-transform ${expanded ? "rotate-180" : ""}`}
                />
              </div>
              {expanded && (
                <p className="mt-4 border-t border-border-soft pt-4 text-sm leading-relaxed text-text-secondary">
                  {article.body}
                </p>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
