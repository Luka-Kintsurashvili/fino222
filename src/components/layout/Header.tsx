import { Link } from "react-router-dom";
import { Wallet } from "lucide-react";
import { ProfileMenu } from "@/components/layout/ProfileMenu";
import { NotificationsPanel } from "@/components/layout/NotificationsPanel";
import { FinoMark } from "@/components/ui/FinoMark";
import { useLanguage } from "@/lib/LanguageContext";

export function Header() {
  const { t } = useLanguage();
  return (
    <header className="safe-top sticky top-0 z-40 border-b border-border-soft bg-bg/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-lg items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <FinoMark size={32} />
          <span className="text-lg font-bold text-text-primary">{t("appName")}</span>
        </Link>
        <div className="flex items-center gap-2">
          <Link
            to="/wallet"
            aria-label={t("accountsTitle")}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface text-text-secondary transition-colors hover:border-accent/50 hover:text-text-primary"
          >
            <Wallet size={16} />
          </Link>
          <NotificationsPanel />
          <ProfileMenu />
        </div>
      </div>
    </header>
  );
}
