import { useLanguage } from "@/lib/LanguageContext";

export function LanguageToggle() {
  const { language, toggleLanguage } = useLanguage();

  return (
    <button
      onClick={toggleLanguage}
      aria-label="ენის შეცვლა / Change language"
      className="flex h-9 min-w-9 items-center justify-center rounded-full border border-border bg-surface px-2.5 text-xs font-bold text-text-secondary transition-colors hover:border-accent/50 hover:text-text-primary"
    >
      {language === "ka" ? "EN" : "KA"}
    </button>
  );
}
