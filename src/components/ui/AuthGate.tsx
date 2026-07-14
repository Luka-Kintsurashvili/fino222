import { Link } from "react-router-dom";
import { LockKeyhole } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export function AuthGate({ message }: { message: string }) {
  return (
    <Card className="flex flex-col items-center gap-3 py-10 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-soft text-accent">
        <LockKeyhole size={22} />
      </span>
      <p className="max-w-xs text-sm text-text-secondary">{message}</p>
      <Link to="/login">
        <Button>შესვლა</Button>
      </Link>
    </Card>
  );
}
