import { Link } from "react-router-dom";
import { ProfileMenu } from "@/components/layout/ProfileMenu";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { LanguageToggle } from "@/components/layout/LanguageToggle";
import { FinoMark } from "@/components/ui/FinoMark";
import { useLanguage } from "@/lib/LanguageContext";

export function Header() {
  const { t } = useLanguage();
  return (
    <header className="safe-top sticky top-0 z-40 border-b border-border-soft bg-bg/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-lg items-center justify-between px-4">
        <Link to="/loan" className="flex items-center gap-2">
          <FinoMark size={32} />
          <span className="text-lg font-bold text-text-primary">{t("appName")}</span>
        </Link>
        <div className="flex items-center gap-2">
          <LanguageToggle />
          <ThemeToggle />
          <ProfileMenu />
        </div>
      </div>
    </header>
  );
}
