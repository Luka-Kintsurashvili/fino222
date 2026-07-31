import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { useAuth } from "@/lib/AuthContext";
import type { Project, ProjectInput } from "@/types/project";
import type { Transaction } from "@/types/transaction";

export function useProjects(expenses: Transaction[]) {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user || !isSupabaseConfigured) {
      setProjects([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) setError(error.message);
    else setProjects(data as Project[]);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  /** Returns an error message on failure, or null on success. */
  async function addProject(input: ProjectInput): Promise<string | null> {
    if (!user) return "საჭიროა ავტორიზაცია";
    const { data, error } = await supabase
      .from("projects")
      .insert({ name: input.name, budget: input.budget ?? null, user_id: user.id })
      .select()
      .single();
    if (error) {
      setError(error.message);
      return error.message;
    }
    setProjects((prev) => [data as Project, ...prev]);
    return null;
  }

  async function removeProject(id: string) {
    const { error } = await supabase.from("projects").delete().eq("id", id);
    if (error) {
      setError(error.message);
      return;
    }
    setProjects((prev) => prev.filter((p) => p.id !== id));
  }

  const spentByProject = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of expenses) {
      if (!e.project_id) continue;
      map.set(e.project_id, (map.get(e.project_id) ?? 0) + e.amount);
    }
    return map;
  }, [expenses]);

  return { projects, loading, error, addProject, removeProject, spentByProject };
}
