export interface Project {
  id: string;
  user_id: string;
  name: string;
  budget: number | null;
  created_at: string;
}

export interface ProjectInput {
  name: string;
  budget?: number | null;
}
