import { useState } from "react";
import { Copy, Check, UserMinus, Users } from "lucide-react";
import { FormSheet } from "@/components/ui/FormSheet";
import { Button } from "@/components/ui/Button";
import { NumberField } from "@/components/ui/NumberField";
import { formatGEL } from "@/lib/format";
import { useAuth } from "@/lib/AuthContext";
import { useGoalGroup } from "@/hooks/useGoalGroup";
import type { Goal } from "@/types/goal";

interface GroupGoalSheetProps {
  goal: Goal | null;
  onClose: () => void;
}

export function GroupGoalSheet({ goal, onClose }: GroupGoalSheetProps) {
  return (
    <FormSheet open={!!goal} title="ჯგუფური მიზანი" onClose={onClose}>
      {goal && <GroupGoalContent goal={goal} />}
    </FormSheet>
  );
}

function GroupGoalContent({ goal }: { goal: Goal }) {
  const { user } = useAuth();
  const { members, invite, loading, generateInvite, updateMyContribution, removeMember } = useGoalGroup(goal.id);
  const [copied, setCopied] = useState(false);
  const [myContribution, setMyContribution] = useState(0);

  const isOwner = user?.id === goal.user_id;
  const myMembership = members.find((m) => m.user_id === user?.id);
  const friendsTotal = members.reduce((sum, m) => sum + m.contributed_amount, 0);
  const combinedTotal = goal.saved_amount + friendsTotal;

  function handleCopy() {
    if (!invite) return;
    navigator.clipboard?.writeText(invite.code).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-accent/20 bg-accent-soft px-4 py-3">
        <p className="text-xs text-text-muted">ჯამური დაზოგილი (შენ + წევრები)</p>
        <p className="font-mono text-xl font-bold tabular text-text-primary">{formatGEL(combinedTotal)}</p>
      </div>

      {isOwner && (
        <div>
          <p className="mb-2 text-sm font-medium text-text-secondary">მოწვევის კოდი</p>
          {invite ? (
            <div className="flex items-center gap-2">
              <span className="flex-1 rounded-xl border border-border bg-bg-elevated px-4 py-3 text-center font-mono text-lg font-bold tracking-[0.2em] text-text-primary">
                {invite.code}
              </span>
              <button
                onClick={handleCopy}
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-border bg-surface text-text-secondary hover:border-accent/50"
              >
                {copied ? <Check size={18} className="text-success" /> : <Copy size={18} />}
              </button>
            </div>
          ) : (
            <Button variant="secondary" className="w-full" onClick={generateInvite}>
              <Users size={16} />
              კოდის გენერაცია
            </Button>
          )}
          <p className="mt-2 text-xs text-text-muted">გაუზიარე ეს კოდი მეგობარს — მას შემდეგ რაც შევა, თავად დაამატებს საკუთარ შენატანს</p>
        </div>
      )}

      <div>
        <p className="mb-2 text-sm font-medium text-text-secondary">წევრები</p>
        {loading && <p className="text-sm text-text-muted">იტვირთება...</p>}
        {!loading && members.length === 0 && (
          <p className="text-sm text-text-muted">ჯერ არავინ შემოგვიერთდა</p>
        )}
        <div className="space-y-2">
          {members.map((m) => (
            <div key={m.id} className="flex items-center justify-between rounded-xl bg-bg-elevated px-3 py-2.5">
              <span className="text-sm text-text-primary">
                {m.user_id === user?.id ? "შენ" : `წევრი ${m.id.slice(0, 4)}`}
              </span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm tabular text-text-secondary">{formatGEL(m.contributed_amount)}</span>
                {isOwner && m.user_id !== user?.id && (
                  <button
                    onClick={() => removeMember(m.id)}
                    className="rounded-lg p-1 text-text-muted hover:bg-danger-soft hover:text-danger"
                  >
                    <UserMinus size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {myMembership && (
        <div className="space-y-2 border-t border-border-soft pt-4">
          <NumberField
            label="ჩემი შენატანი"
            value={myContribution || myMembership.contributed_amount}
            onChange={setMyContribution}
            suffix="₾"
            step={50}
          />
          <Button className="w-full" onClick={() => updateMyContribution(myContribution || myMembership.contributed_amount)}>
            შენატანის განახლება
          </Button>
        </div>
      )}
    </div>
  );
}
