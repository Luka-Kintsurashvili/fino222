import { Navigate, useNavigate } from "react-router-dom";
import { Sun, Moon, Globe, LogOut, Mail } from "lucide-react";
import { SubPageHeader } from "@/components/ui/SubPageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/lib/AuthContext";
import { useTheme } from "@/lib/ThemeContext";
import { useLanguage } from "@/lib/LanguageContext";
import { supabase } from "@/lib/supabase";

export function SettingsPage() {
  const { user, loading: authLoading } = useAuth();

  if (authLoading) return null;
  if (!user) return <Navigate to="/login" replace />;

  return <SettingsContent />;
}

function SettingsContent() {
  const { theme, toggleTheme } = useTheme();
  const { language, toggleLanguage, t } = useLanguage();
  const navigate = useNavigate();

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate("/login");
  }

  return (
    <div className="space-y-5">
      <SubPageHeader title={t("settings")} subtitle="აპლიკაციის პარამეტრები" />

      <Card className="divide-y divide-border-soft">
        <button
          onClick={toggleTheme}
          className="flex w-full items-center justify-between py-3 first:pt-0 last:pb-0"
        >
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-soft text-accent">
              {theme === "dark" ? <Moon size={16} /> : <Sun size={16} />}
            </span>
            <span className="text-sm font-medium text-text-primary">{t("theme")}</span>
          </div>
          <span className="text-sm text-text-muted">{theme === "dark" ? t("themeDark") : t("themeLight")}</span>
        </button>

        <button
          onClick={toggleLanguage}
          className="flex w-full items-center justify-between py-3 first:pt-0 last:pb-0"
        >
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-soft text-accent">
              <Globe size={16} />
            </span>
            <span className="text-sm font-medium text-text-primary">{t("language")}</span>
          </div>
          <span className="text-sm text-text-muted">{language === "ka" ? "ქართული" : "English"}</span>
        </button>
      </Card>

      <Card className="space-y-3">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-soft text-accent">
            <Mail size={16} />
          </span>
          <p className="text-sm font-medium text-text-primary">ანგარიშის წაშლა</p>
        </div>
        <p className="text-xs text-text-muted">
          ანგარიშის სამუდამოდ წასაშლელად დაგვიკავშირდი მხარდაჭერას — ეს მოქმედება პირდაპირ აპლიკაციიდან ჯერ არ არის
          ხელმისაწვდომი.
        </p>
      </Card>

      <Button variant="danger" className="w-full" onClick={handleLogout}>
        <LogOut size={16} />
        {t("logout")}
      </Button>
    </div>
  );
}
