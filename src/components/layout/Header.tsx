import { Link } from "react-router-dom";
import { ProfileMenu } from "@/components/layout/ProfileMenu";
import { ThemeToggle } from "@/components/layout/ThemeToggle";

export function Header() {
  return (
    <header className="safe-top sticky top-0 z-40 border-b border-border-soft bg-bg/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-lg items-center justify-between px-4">
        <Link to="/loan" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl gradient-accent text-sm font-bold text-white">
            ფ
          </span>
          <span className="text-lg font-bold text-text-primary">ფინო</span>
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <ProfileMenu />
        </div>
      </div>
    </header>
  );
}
