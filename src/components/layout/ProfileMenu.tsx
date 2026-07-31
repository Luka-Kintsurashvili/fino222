import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User as UserIcon, Shield, Bell, Settings, LogOut, LogIn, Sun, Moon, Languages } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/lib/LanguageContext";
import { useTheme } from "@/lib/ThemeContext";

export function ProfileMenu() {
  const { user } = useAuth();
  const { t, language, toggleLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const name = user ? (user.user_metadata?.full_name as string | undefined) || user.email?.split("@")[0] || "მომხმარებელი" : null;
  const initial = name?.charAt(0).toUpperCase();

  async function handleLogout() {
    await supabase.auth.signOut();
    setOpen(false);
    navigate("/");
  }

  const menuItems = [
    { icon: UserIcon, label: t("profile"), path: "/profile" },
    { icon: Shield, label: t("security"), path: "/security" },
    { icon: Bell, label: t("notifications"), path: "/notifications" },
    { icon: Settings, label: t("settings"), path: "/settings" },
  ];

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className={
          user
            ? "flex h-9 w-9 items-center justify-center rounded-full gradient-accent text-sm font-semibold text-white shadow-[0_2px_10px_rgba(99,102,241,0.4)]"
            : "flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface text-text-secondary transition-colors hover:border-accent/50 hover:text-text-primary"
        }
        aria-label={t("accountMenu")}
      >
        {user ? initial : <UserIcon size={16} />}
      </button>
      {open && (
        <div className="absolute right-0 top-11 z-50 w-64 overflow-hidden rounded-2xl border border-border bg-bg-elevated shadow-[0_12px_40px_rgba(0,0,0,0.5)]">
          {user && (
            <div className="border-b border-border-soft px-4 py-3">
              <p className="truncate text-sm font-semibold text-text-primary">{name}</p>
              <p className="truncate text-xs text-text-muted">{user.email}</p>
            </div>
          )}

          <div className="border-b border-border-soft py-1">
            <button
              onClick={toggleLanguage}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-text-secondary hover:bg-surface hover:text-text-primary"
            >
              <Languages size={16} />
              {t("language")}
              <span className="ml-auto text-xs font-bold text-text-muted">{language === "ka" ? "KA" : "EN"}</span>
            </button>
            <button
              onClick={toggleTheme}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-text-secondary hover:bg-surface hover:text-text-primary"
            >
              {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
              {t("theme")}
              <span className="ml-auto text-xs font-bold text-text-muted">{theme === "dark" ? t("themeDark") : t("themeLight")}</span>
            </button>
          </div>

          {user ? (
            <>
              <div className="py-1">
                {menuItems.map(({ icon: Icon, label, path }) => (
                  <Link
                    key={label}
                    to={path}
                    onClick={() => setOpen(false)}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-text-secondary hover:bg-surface hover:text-text-primary"
                  >
                    <Icon size={16} />
                    {label}
                  </Link>
                ))}
              </div>
              <div className="border-t border-border-soft py-1">
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-danger hover:bg-danger-soft"
                >
                  <LogOut size={16} />
                  {t("logout")}
                </button>
              </div>
            </>
          ) : (
            <div className="py-1">
              <Link
                to="/login"
                onClick={() => setOpen(false)}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-text-secondary hover:bg-surface hover:text-text-primary"
              >
                <LogIn size={16} />
                {t("login")}
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
