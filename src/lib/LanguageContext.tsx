import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { translations, type Language, type TranslationKey } from "@/lib/i18n";

interface LanguageContextValue {
  language: Language;
  toggleLanguage: () => void;
  t: (key: TranslationKey) => string;
}

const STORAGE_KEY = "fino-language";

const LanguageContext = createContext<LanguageContextValue>({
  language: "ka",
  toggleLanguage: () => {},
  t: (key) => translations[key].ka,
});

function getInitialLanguage(): Language {
  if (typeof window === "undefined") return "ka";
  return window.localStorage.getItem(STORAGE_KEY) === "en" ? "en" : "ka";
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(getInitialLanguage);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, language);
    document.documentElement.lang = language;
  }, [language]);

  function toggleLanguage() {
    setLanguage((l) => (l === "ka" ? "en" : "ka"));
  }

  function t(key: TranslationKey) {
    return translations[key][language];
  }

  return <LanguageContext.Provider value={{ language, toggleLanguage, t }}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  return useContext(LanguageContext);
}
