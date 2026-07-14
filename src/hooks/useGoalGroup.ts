import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/AuthContext";
import type { GoalMember, GoalInvite } from "@/types/goalMember";

function generateCode(): string {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase();
}

export function useGoalGroup(goalId: string) {
  const { user } = useAuth();
  const [members, setMembers] = useState<GoalMember[]>([]);
  const [invite, setInvite] = useState<GoalInvite | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    const [membersRes, inviteRes] = await Promise.all([
      supabase.from("goal_members").select("*").eq("goal_id", goalId).order("joined_at", { ascending: true }),
      supabase.from("goal_invites").select("*").eq("goal_id", goalId).limit(1).maybeSingle(),
    ]);
    if (membersRes.error) setError(membersRes.error.message);
    else setMembers(membersRes.data as GoalMember[]);
    if (inviteRes.data) setInvite(inviteRes.data as GoalInvite);
    setLoading(false);
  }, [goalId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function generateInvite() {
    if (!user) return;
    const { data, error } = await supabase
      .from("goal_invites")
      .insert({ goal_id: goalId, code: generateCode(), created_by: user.id })
      .select()
      .single();
    if (error) {
      setError(error.message);
      return;
    }
    setInvite(data as GoalInvite);
  }

  async function updateMyContribution(amount: number) {
    if (!user) return;
    const { data, error } = await supabase
      .from("goal_members")
      .update({ contributed_amount: Math.max(0, amount) })
      .eq("goal_id", goalId)
      .eq("user_id", user.id)
      .select()
      .single();
    if (error) {
      setError(error.message);
      return;
    }
    setMembers((prev) => prev.map((m) => (m.id === (data as GoalMember).id ? (data as GoalMember) : m)));
  }

  async function removeMember(memberId: string) {
    const { error } = await supabase.from("goal_members").delete().eq("id", memberId);
    if (error) {
      setError(error.message);
      return;
    }
    setMembers((prev) => prev.filter((m) => m.id !== memberId));
  }

  return { members, invite, loading, error, generateInvite, updateMyContribution, removeMember, refresh };
}

export async function leaveGoal(goalId: string, userId: string): Promise<{ error: string } | { ok: true }> {
  const { error } = await supabase.from("goal_members").delete().eq("goal_id", goalId).eq("user_id", userId);
  if (error) return { error: error.message };
  return { ok: true };
}

/** Looks up an invite code and joins the current user to that goal. Returns the goal_id on success. */
export async function joinGoalByCode(code: string, userId: string): Promise<{ goalId: string } | { error: string }> {
  const normalized = code.trim().toUpperCase();
  if (!normalized) return { error: "შეიყვანე კოდი" };

  const { data: invite, error: inviteError } = await supabase
    .from("goal_invites")
    .select("goal_id")
    .eq("code", normalized)
    .maybeSingle();

  if (inviteError) return { error: inviteError.message };
  if (!invite) return { error: "კოდი ვერ მოიძებნა" };

  const { error: joinError } = await supabase
    .from("goal_members")
    .insert({ goal_id: invite.goal_id, user_id: userId, contributed_amount: 0 });

  if (joinError) {
    if (joinError.code === "23505") return { error: "შენ უკვე ამ მიზნის წევრი ხარ" };
    return { error: joinError.message };
  }

  return { goalId: invite.goal_id };
}
