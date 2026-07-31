import { AuthGate } from "@/components/ui/AuthGate";
import { FinoFace } from "@/components/ui/FinoFace";
import { ChatScreen } from "@/components/chat/ChatScreen";
import { useAuth } from "@/lib/AuthContext";
import { useLanguage } from "@/lib/LanguageContext";

export function HomePage() {
  const { t } = useLanguage();
  const { user, loading: authLoading } = useAuth();

  if (authLoading) return null;
  if (!user) {
    return (
      <div className="flex h-[calc(100dvh-3.5rem)] flex-col justify-center gap-5 px-4">
        <div className="text-center">
          <FinoFace size={56} className="mx-auto mb-3" />
          <h1 className="text-2xl font-bold text-text-primary">{t("chatTitle")}</h1>
          <p className="mt-1 text-sm text-text-secondary">{t("chatSubtitleBalanced")}</p>
        </div>
        <AuthGate message={t("accountsAuthGate")} />
      </div>
    );
  }

  return <ChatScreen />;
}
