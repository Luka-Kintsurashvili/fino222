import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User as UserIcon, Shield, Bell, Settings, LogOut, LogIn } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/lib/LanguageContext";

export function ProfileMenu() {
  const { user } = useAuth();
  const { t } = useLanguage();
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

  if (!user) {
    return (
      <Link
        to="/login"
        className="flex items-center gap-1.5 rounded-full border border-border bg-surface px-3.5 py-2 text-sm font-medium text-text-primary hover:border-accent/50"
      >
        <LogIn size={15} />
        {t("login")}
      </Link>
    );
  }

  const name = (user.user_metadata?.full_name as string | undefined) || user.email?.split("@")[0] || "მომხმარებელი";
  const initial = name.charAt(0).toUpperCase();

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
        className="flex h-9 w-9 items-center justify-center rounded-full gradient-accent text-sm font-semibold text-white shadow-[0_2px_10px_rgba(99,102,241,0.4)]"
      >
        {initial}
      </button>
      {open && (
        <div className="absolute right-0 top-11 z-50 w-64 overflow-hidden rounded-2xl border border-border bg-bg-elevated shadow-[0_12px_40px_rgba(0,0,0,0.5)]">
          <div className="border-b border-border-soft px-4 py-3">
            <p className="truncate text-sm font-semibold text-text-primary">{name}</p>
            <p className="truncate text-xs text-text-muted">{user.email}</p>
          </div>
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
        </div>
      )}
    </div>
  );
}
