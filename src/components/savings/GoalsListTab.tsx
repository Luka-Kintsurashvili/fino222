import { useState } from "react";
import { Plus, Trash2, Target, Users, UserPlus, LogOut, CircleAlert } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { AuthGate } from "@/components/ui/AuthGate";
import { FormSheet } from "@/components/ui/FormSheet";
import { TextField } from "@/components/ui/TextField";
import { NumberField } from "@/components/ui/NumberField";
import { GroupGoalSheet } from "@/components/goals/GroupGoalSheet";
import { JoinGoalSheet } from "@/components/goals/JoinGoalSheet";
import { formatGEL, monthsToYearsLabel } from "@/lib/format";
import { useAuth } from "@/lib/AuthContext";
import { useGoals } from "@/hooks/useGoals";
import { useGoalMemberTotals } from "@/hooks/useGoalMemberTotals";
import { leaveGoal } from "@/hooks/useGoalGroup";
import type { Goal } from "@/types/goal";

export function GoalsListTab() {
  const { user, loading: authLoading } = useAuth();

  if (authLoading) return null;
  if (!user) return <AuthGate message="მიზნების შესაქმნელად და შესანახად საჭიროა ავტორიზაცია." />;

  return <GoalsList currentUserId={user.id} />;
}

function GoalsList({ currentUserId }: { currentUserId: string }) {
  const { goals, loading, addGoal, deleteGoal, refresh } = useGoals();
  const [open, setOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [groupGoal, setGroupGoal] = useState<Goal | null>(null);
  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState(5000);
  const [savedAmount, setSavedAmount] = useState(0);
  const [monthlyContribution, setMonthlyContribution] = useState(200);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const memberTotals = useGoalMemberTotals(goals.map((g) => g.id));

  function resetForm() {
    setName("");
    setTargetAmount(5000);
    setSavedAmount(0);
    setMonthlyContribution(200);
    setFormError(null);
  }

  async function handleSubmit() {
    if (!name.trim() || targetAmount <= 0) {
      setFormError("შეავსე მიზნის სახელი და სამიზნე თანხა");
      return;
    }
    setSubmitting(true);
    const error = await addGoal({
      name: name.trim(),
      target_amount: targetAmount,
      saved_amount: savedAmount,
      monthly_contribution: monthlyContribution,
    });
    setSubmitting(false);
    if (error) {
      setFormError(error);
      return;
    }
    resetForm();
    setOpen(false);
  }

  return (
    <div className="space-y-5">
      <div className="flex justify-end gap-2">
        <Button onClick={() => setJoinOpen(true)} variant="secondary" className="!px-3 !py-2.5">
          <UserPlus size={18} />
        </Button>
        <Button onClick={() => setOpen(true)} className="!px-3 !py-2.5">
          <Plus size={18} />
        </Button>
      </div>

      {loading && <p className="text-sm text-text-muted">იტვირთება...</p>}

      {!loading && goals.length === 0 && (
        <Card className="flex flex-col items-center gap-2 py-10 text-center">
          <Target className="text-text-muted" size={28} />
          <p className="text-sm text-text-secondary">ჯერ არ გაქვს დამატებული მიზანი</p>
          <Button onClick={() => setOpen(true)} variant="secondary" className="mt-2">
            <Plus size={16} />
            მიზნის დამატება
          </Button>
        </Card>
      )}

      <div className="space-y-3">
        {goals.map((goal) => {
          const isOwner = goal.user_id === currentUserId;
          const memberTotal = memberTotals[goal.id];
          const combinedSaved = goal.saved_amount + (memberTotal?.total ?? 0);
          const pct = goal.target_amount > 0 ? (combinedSaved / goal.target_amount) * 100 : 0;
          const remaining = Math.max(0, goal.target_amount - combinedSaved);
          const monthsLeft = goal.monthly_contribution > 0 ? Math.ceil(remaining / goal.monthly_contribution) : null;

          return (
            <Card key={goal.id}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-text-primary">{goal.name}</p>
                    {memberTotal && memberTotal.count > 0 && (
                      <span className="flex items-center gap-1 rounded-full bg-accent-soft px-2 py-0.5 text-[10px] font-medium text-accent-to">
                        <Users size={10} />
                        {memberTotal.count + 1}
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 font-mono text-sm tabular text-text-secondary">
                    {formatGEL(combinedSaved)} / {formatGEL(goal.target_amount)}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setGroupGoal(goal)}
                    className="rounded-lg p-1.5 text-text-muted hover:bg-accent-soft hover:text-accent"
                    aria-label="ჯგუფური მართვა"
                  >
                    <Users size={16} />
                  </button>
                  {isOwner ? (
                    <button
                      onClick={() => deleteGoal(goal.id)}
                      className="rounded-lg p-1.5 text-text-muted hover:bg-danger-soft hover:text-danger"
                      aria-label="წაშლა"
                    >
                      <Trash2 size={16} />
                    </button>
                  ) : (
                    <button
                      onClick={() => leaveGoal(goal.id, currentUserId).then(refresh)}
                      className="rounded-lg p-1.5 text-text-muted hover:bg-danger-soft hover:text-danger"
                      aria-label="მიზნის დატოვება"
                      title="მიზნის დატოვება"
                    >
                      <LogOut size={16} />
                    </button>
                  )}
                </div>
              </div>
              <div className="mt-3">
                <ProgressBar percent={pct} />
              </div>
              <div className="mt-3 flex items-center justify-between text-xs">
                <span className="font-mono tabular text-text-muted">{pct.toFixed(0)}% შესრულებული</span>
                <span className="text-text-muted">
                  {monthsLeft !== null ? `დარჩენილია ${monthsToYearsLabel(monthsLeft)}` : "შენატანი არ არის მითითებული"}
                </span>
              </div>
            </Card>
          );
        })}
      </div>

      <FormSheet
        open={open}
        title="ახალი მიზანი"
        onClose={() => {
          setOpen(false);
          setFormError(null);
        }}
      >
        <TextField label="მიზნის სახელი" value={name} onChange={setName} placeholder="მაგ. ახალი ავტომობილი" />
        <NumberField label="სამიზნე თანხა" value={targetAmount} onChange={setTargetAmount} suffix="₾" step={100} />
        <NumberField label="უკვე შენახული" value={savedAmount} onChange={setSavedAmount} suffix="₾" step={50} />
        <NumberField
          label="ყოველთვიური შენატანი"
          value={monthlyContribution}
          onChange={setMonthlyContribution}
          suffix="₾"
          step={50}
        />
        {formError && (
          <div className="flex items-start gap-2 rounded-xl border border-danger/30 bg-danger-soft px-3.5 py-2.5">
            <CircleAlert size={15} className="mt-0.5 shrink-0 text-danger" />
            <p className="text-xs text-danger">{formError}</p>
          </div>
        )}
        <Button className="w-full" onClick={handleSubmit} disabled={submitting}>
          {submitting ? "ინახება..." : "შენახვა"}
        </Button>
      </FormSheet>

      <JoinGoalSheet open={joinOpen} onClose={() => setJoinOpen(false)} onJoined={refresh} />
      <GroupGoalSheet goal={groupGoal} onClose={() => setGroupGoal(null)} />
    </div>
  );
}
