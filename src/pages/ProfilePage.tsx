import { useState } from "react";
import { Navigate } from "react-router-dom";
import { CircleAlert, CircleCheck } from "lucide-react";
import { SubPageHeader } from "@/components/ui/SubPageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { useAuth } from "@/lib/AuthContext";
import { supabase } from "@/lib/supabase";

export function ProfilePage() {
  const { user, loading: authLoading } = useAuth();

  if (authLoading) return null;
  if (!user) return <Navigate to="/login" replace />;

  return <ProfileForm />;
}

function ProfileForm() {
  const { user } = useAuth();
  const currentName = (user?.user_metadata?.full_name as string | undefined) || "";
  const [fullName, setFullName] = useState(currentName);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const initial = (fullName || user?.email || "?").charAt(0).toUpperCase();

  async function handleSave() {
    setError(null);
    setNotice(null);
    if (!fullName.trim()) {
      setError("შეიყვანე სახელი");
      return;
    }
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ data: { full_name: fullName.trim() } });
    setSaving(false);
    if (error) setError(error.message);
    else setNotice("პროფილი განახლდა");
  }

  return (
    <div className="space-y-5">
      <SubPageHeader title="პროფილი" subtitle="პირადი ინფორმაციის მართვა" />

      <Card className="flex flex-col items-center gap-3 py-6 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full gradient-accent text-2xl font-bold text-white shadow-[0_4px_16px_rgba(99,102,241,0.4)]">
          {initial}
        </span>
        <div>
          <p className="font-semibold text-text-primary">{fullName || "მომხმარებელი"}</p>
          <p className="text-sm text-text-muted">{user?.email}</p>
        </div>
      </Card>

      <Card className="space-y-4">
        <TextField label="სახელი გვარი" value={fullName} onChange={setFullName} placeholder="შენი სახელი" />
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-text-secondary">ელფოსტა</span>
          <div className="rounded-xl border border-border bg-bg-elevated px-4 py-3 text-sm text-text-muted">
            {user?.email}
          </div>
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

        <Button className="w-full" onClick={handleSave} disabled={saving}>
          {saving ? "ინახება..." : "შენახვა"}
        </Button>
      </Card>
    </div>
  );
}
