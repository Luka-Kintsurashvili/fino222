import { useState } from "react";
import { FormSheet } from "@/components/ui/FormSheet";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/lib/AuthContext";
import { joinGoalByCode } from "@/hooks/useGoalGroup";

interface JoinGoalSheetProps {
  open: boolean;
  onClose: () => void;
  onJoined: () => void;
}

export function JoinGoalSheet({ open, onClose, onJoined }: JoinGoalSheetProps) {
  const { user } = useAuth();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleJoin() {
    if (!user) return;
    setLoading(true);
    setError(null);
    const result = await joinGoalByCode(code, user.id);
    setLoading(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    setCode("");
    onJoined();
    onClose();
  }

  return (
    <FormSheet open={open} title="მიზანთან შეერთება" onClose={onClose}>
      <p className="text-sm text-text-secondary">შეიყვანე მეგობრისგან მიღებული მოწვევის კოდი</p>
      <input
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        placeholder="მაგ. A1B2C3D4"
        maxLength={8}
        className="w-full rounded-xl border border-border bg-bg-elevated px-4 py-3 text-center font-mono text-lg font-bold tracking-[0.2em] text-text-primary outline-none placeholder:tracking-normal placeholder:font-normal placeholder:text-text-muted focus:border-accent"
      />
      {error && <p className="text-xs text-danger">{error}</p>}
      <Button className="w-full" onClick={handleJoin} disabled={loading || code.length < 4}>
        შეერთება
      </Button>
    </FormSheet>
  );
}
