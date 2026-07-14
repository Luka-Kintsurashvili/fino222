import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/lib/ThemeContext";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      aria-label={theme === "dark" ? "ღია თემაზე გადართვა" : "მუქ თემაზე გადართვა"}
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-text-secondary transition-colors hover:border-accent/50 hover:text-text-primary"
    >
      {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}
