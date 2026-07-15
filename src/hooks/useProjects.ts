import { useMemo } from "react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import type { Project } from "@/types/project";
import type { Transaction } from "@/types/transaction";

export function useProjects(expenses: Transaction[]) {
  const [projects, setProjects] = useLocalStorage<Project[]>("fino-projects", []);

  function addProject(project: Omit<Project, "id">) {
    setProjects((prev) => [...prev, { ...project, id: crypto.randomUUID() }]);
  }

  function removeProject(id: string) {
    setProjects((prev) => prev.filter((p) => p.id !== id));
  }

  const spentByProject = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of expenses) {
      if (!e.projectId) continue;
      map.set(e.projectId, (map.get(e.projectId) ?? 0) + e.amount);
    }
    return map;
  }, [expenses]);

  return { projects, addProject, removeProject, spentByProject };
}
