import { useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Send, ArrowRight } from "lucide-react";
import { FinoFace } from "@/components/ui/FinoFace";
import { MarkdownText } from "@/components/chat/MarkdownText";
import { useLanguage } from "@/lib/LanguageContext";
import { useFinoChat, type ChatAction } from "@/hooks/useFinoChat";
import { useQuickSheet } from "@/lib/QuickSheetContext";
import { useChartDrawer } from "@/lib/ChartDrawerContext";
import { CHAT_MODES, CHAT_MODE_META, type ChatMode } from "@/lib/chatModes";

const TARGET_ROUTES: Record<Exclude<ChatAction["target"], "networth">, string> = {
  funds: "/funds",
  calendar: "/calendar",
  loan: "/wallet",
  budget: "/wallet",
  credit: "/wallet",
};

const MODE_EXPRESSION: Record<ChatMode, "content" | "hype" | "roast"> = {
  hype: "hype",
  balanced: "content",
  roast: "roast",
};

export function ChatScreen() {
  const { t } = useLanguage();
  const { mode, switchMode, messages, historyLoaded, input, setInput, loading, error, sendMessage, showSuggestions } = useFinoChat();
  const { openSheet } = useQuickSheet();
  const { openDrawer } = useChartDrawer();
  const navigate = useNavigate();
  const location = useLocation();
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prefill = (location.state as { prefillInput?: string } | null)?.prefillInput;
    if (prefill) {
      setInput(prefill);
      window.history.replaceState({}, "", location.pathname);
    }
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleActionClick(action: ChatAction) {
    if (action.target === "networth") {
      openDrawer("networth");
      return;
    }
    navigate(TARGET_ROUTES[action.target]);
    openSheet(action.target, action.draft);
  }

  const meta = CHAT_MODE_META[mode];

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  if (!historyLoaded) {
    return (
      <div className="flex h-[calc(100dvh-3.5rem)] items-center justify-center">
        <p className="text-sm text-text-muted">{t("loadingText")}</p>
      </div>
    );
  }

  const suggestions = [t("chatSuggestion1"), t("chatSuggestion2"), t("chatSuggestion3")];

  return (
    <div className="flex h-[calc(100dvh-3.5rem)] flex-col px-4 pb-4 pt-3">
      <div className={`pointer-events-none fixed -top-16 left-1/2 h-40 w-72 -translate-x-1/2 rounded-full bg-gradient-to-br ${meta.gradient} opacity-15 blur-3xl transition-colors duration-500`} />

      <div className="relative mb-3 flex items-center gap-2.5">
        <FinoFace size={36} expression={MODE_EXPRESSION[mode]} bg={`bg-gradient-to-br ${meta.gradient}`} className="shadow-lg transition-colors duration-500" />
        <div>
          <p className="text-sm font-bold text-text-primary">{t("chatTitle")}</p>
          <p className="text-[11px] text-text-muted transition-colors duration-300">{t(meta.subtitleKey)}</p>
        </div>
      </div>

      <div className="relative mb-3 flex items-center gap-1.5">
        {CHAT_MODES.map((key) => {
          const m = CHAT_MODE_META[key];
          const ModeIcon = m.icon;
          const active = key === mode;
          return (
            <button
              key={key}
              onClick={() => switchMode(key)}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
                active ? `bg-gradient-to-br ${m.gradient} text-white shadow-md` : "border border-border bg-surface text-text-secondary hover:border-accent/50"
              }`}
            >
              <ModeIcon size={12} />
              {t(m.titleKey)}
            </button>
          );
        })}
      </div>

      <div className="relative flex-1 space-y-5 overflow-y-auto pb-3">
        {messages.map((m) => (
          <div key={m.id} className={`flex w-full flex-col ${m.role === "user" ? "items-end" : "items-start"}`}>
            {m.role === "user" ? (
              <div className={`max-w-[85%] rounded-3xl px-4 py-2.5 text-sm leading-relaxed bg-gradient-to-br ${meta.gradient} text-white`}>
                <p className="whitespace-pre-wrap">{m.text}</p>
              </div>
            ) : (
              <div className="flex w-full max-w-[92%] gap-2.5">
                <FinoFace size={24} expression={MODE_EXPRESSION[mode]} bg={`bg-gradient-to-br ${meta.gradient}`} className="mt-0.5 shrink-0" />
                <div className="min-w-0 flex-1 pt-0.5 text-sm leading-relaxed text-text-primary">
                  <MarkdownText text={m.text} />
                </div>
              </div>
            )}
            {m.action && (
              <button
                onClick={() => handleActionClick(m.action!)}
                className="ml-8 mt-2 flex items-center gap-1 rounded-full border border-accent/40 bg-accent-soft px-3 py-1.5 text-xs font-semibold text-accent hover:border-accent/70"
              >
                {m.action.label}
                <ArrowRight size={12} />
              </button>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2.5">
            <FinoFace size={24} expression={MODE_EXPRESSION[mode]} bg={`bg-gradient-to-br ${meta.gradient}`} className="shrink-0" />
            <div className="flex items-center gap-1 py-2">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-text-muted [animation-delay:-0.3s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-text-muted [animation-delay:-0.15s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-text-muted" />
            </div>
          </div>
        )}

        {error && <div className="rounded-xl border border-danger/30 bg-danger-soft px-3.5 py-2.5 text-xs text-danger">{error}</div>}

        {showSuggestions && (
          <div className="flex flex-wrap gap-2 pt-1">
            {suggestions.map((s) => (
              <button
                key={s}
                onClick={() => sendMessage(s)}
                className="rounded-full border border-border bg-surface px-3.5 py-2 text-xs font-medium text-text-secondary hover:border-accent/50 hover:text-text-primary"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        <div ref={endRef} />
      </div>

      <div className="relative shrink-0 pt-1">
        <div className="flex items-center gap-2 rounded-full border border-border bg-bg-elevated px-4 py-2.5 shadow-sm">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
            placeholder={t("chatPlaceholder")}
            disabled={loading}
            className="w-full bg-transparent text-sm text-text-primary outline-none placeholder:text-text-muted disabled:opacity-60"
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={loading || !input.trim()}
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${meta.gradient} text-white transition-opacity disabled:opacity-40`}
          >
            <Send size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
