export interface Project {
  id: string;
  name: string;
  /** Optional target budget — when set, the project shows progress toward it. */
  budget?: number;
}
