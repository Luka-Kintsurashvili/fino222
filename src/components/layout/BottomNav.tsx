import { NavLink } from "react-router-dom";
import { Menu } from "lucide-react";
import { primaryNav } from "@/lib/nav";
import { useLanguage } from "@/lib/LanguageContext";

interface BottomNavProps {
  onMoreClick: () => void;
  moreActive: boolean;
}

export function BottomNav({ onMoreClick, moreActive }: BottomNavProps) {
  const { t } = useLanguage();
  return (
    <nav className="safe-bottom sticky bottom-0 z-40 border-t border-border-soft bg-bg/90 backdrop-blur-xl">
      <div className="mx-auto grid max-w-lg grid-cols-5 px-1 py-1.5">
        {primaryNav.map(({ path, labelKey, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 rounded-xl py-2 text-[11px] font-medium transition-colors ${
                isActive ? "text-text-primary" : "text-text-muted hover:text-text-secondary"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={20} strokeWidth={isActive ? 2.4 : 2} style={isActive ? { color: "#8B5CF6" } : undefined} />
                <span>{t(labelKey)}</span>
              </>
            )}
          </NavLink>
        ))}
        <button
          onClick={onMoreClick}
          className={`flex flex-col items-center gap-1 rounded-xl py-2 text-[11px] font-medium transition-colors ${
            moreActive ? "text-text-primary" : "text-text-muted hover:text-text-secondary"
          }`}
        >
          <Menu size={20} strokeWidth={moreActive ? 2.4 : 2} style={moreActive ? { color: "#8B5CF6" } : undefined} />
          <span>{t("navMore")}</span>
        </button>
      </div>
    </nav>
  );
}
