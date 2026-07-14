export interface GoalMember {
  id: string;
  goal_id: string;
  user_id: string;
  contributed_amount: number;
  joined_at: string;
}

export interface GoalInvite {
  id: string;
  goal_id: string;
  code: string;
  created_by: string;
  created_at: string;
}
