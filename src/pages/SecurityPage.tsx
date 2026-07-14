import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { CircleAlert, CircleCheck, LogOut, KeyRound } from "lucide-react";
import { SubPageHeader } from "@/components/ui/SubPageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/lib/AuthContext";
import { supabase } from "@/lib/supabase";

export function SecurityPage() {
  const { user, loading: authLoading } = useAuth();

  if (authLoading) return null;
  if (!user) return <Navigate to="/login" replace />;

  return <SecurityContent />;
}

function SecurityContent() {
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function handleChangePassword() {
    setError(null);
    setNotice(null);
    if (newPassword.length < 6) {
      setError("პაროლი უნდა შეიცავდეს მინიმუმ 6 სიმბოლოს");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("პაროლები არ ემთხვევა");
      return;
    }
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    setNotice("პაროლი წარმატებით შეიცვალა");
    setNewPassword("");
    setConfirmPassword("");
  }

  async function handleSignOutEverywhere() {
    await supabase.auth.signOut({ scope: "global" });
    navigate("/login");
  }

  return (
    <div className="space-y-5">
      <SubPageHeader title="უსაფრთხოება" subtitle="მართე შენი ანგარიშის დაცვის პარამეტრები" />

      <Card className="space-y-4">
        <div className="mb-1 flex items-center gap-2.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-soft text-accent">
            <KeyRound size={18} />
          </span>
          <p className="font-semibold text-text-primary">პაროლის შეცვლა</p>
        </div>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-text-secondary">ახალი პაროლი</span>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            minLength={6}
            className="w-full rounded-xl border border-border bg-bg-elevated px-4 py-3 text-text-primary outline-none focus:border-accent"
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-text-secondary">გაიმეორე ახალი პაროლი</span>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            minLength={6}
            className="w-full rounded-xl border border-border bg-bg-elevated px-4 py-3 text-text-primary outline-none focus:border-accent"
          />
        </label>

        {error && (
          <div className="flex items-start gap-2 rounded-xl border border-danger/30 bg-danger-soft px-3.5 py-2.5">
            <CircleAlert size={15} className="mt-0.5 shrink-0 text-danger" />
            <p className="text-xs text-danger">{error}</p>
          </div>
        )}
        {notice && (
          <div className="flex items-start gap-2 rounded-xl border border-success/30 bg-success-soft px-3.5 py-2.5">
            <CircleCheck size={15} className="mt-0.5 shrink-0 text-success" />
            <p className="text-xs text-success">{notice}</p>
          </div>
        )}

        <Button className="w-full" onClick={handleChangePassword} disabled={saving}>
          {saving ? "იცვლება..." : "პაროლის შეცვლა"}
        </Button>
      </Card>

      <Card className="space-y-3">
        <p className="font-semibold text-text-primary">აქტიური სესიები</p>
        <p className="text-sm text-text-secondary">
          თუ ეჭვობ, რომ ვინმე სხვამ შენს ანგარიშზე წვდომა მიიღო, გამოდი ყველა მოწყობილობიდან ერთდროულად.
        </p>
        <Button variant="danger" className="w-full" onClick={handleSignOutEverywhere}>
          <LogOut size={16} />
          გამოსვლა ყველა მოწყობილობიდან
        </Button>
      </Card>
    </div>
  );
}
