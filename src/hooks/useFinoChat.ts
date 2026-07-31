import { useEffect, useMemo, useRef, useState } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { useAuth } from "@/lib/AuthContext";
import { useLanguage } from "@/lib/LanguageContext";
import { useAccounts } from "@/hooks/useAccounts";
import { useTransactions } from "@/hooks/useTransactions";
import { useFunds } from "@/hooks/useFunds";
import { useAssets } from "@/hooks/useAssets";
import { useLiabilities } from "@/hooks/useLiabilities";
import { useReminders } from "@/hooks/useReminders";
import { budgetCategories } from "@/data/budgetCategories";
import { CHAT_MODE_META, type ChatMode } from "@/lib/chatModes";
import { formatGEL } from "@/lib/format";

function daysUntil(dueDate: string): number {
  const today = new Date().toISOString().slice(0, 10);
  return Math.ceil((new Date(dueDate).getTime() - new Date(today).getTime()) / 86_400_000);
}

export interface ChatAction {
  target: "funds" | "calendar" | "loan" | "networth" | "budget";
  label: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  action?: ChatAction;
}

const NON_CONVERSATION_IDS = new Set(["welcome", "reminders-banner"]);

export function useFinoChat() {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const [mode, setMode] = useState<ChatMode>("balanced");
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: "welcome", role: "assistant", text: t("chatWelcomeBalanced") },
  ]);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { totalBalance } = useAccounts();
  const { transactions, expensesByCategory } = useTransactions();
  const { funds } = useFunds();
  const { liquidTotal, nonliquidTotal } = useAssets();
  const { total: liabilitiesTotal } = useLiabilities();
  const { dueSoon, acknowledgeReminder, refresh: refreshReminders } = useReminders();
  const bannerShownRef = useRef(false);

  // Load persisted history so the conversation survives route navigation and page reloads.
  useEffect(() => {
    let cancelled = false;
    setHistoryLoaded(false);

    async function loadHistory() {
      if (!user || !isSupabaseConfigured) {
        if (!cancelled) setHistoryLoaded(true);
        return;
      }
      const { data, error: fetchError } = await supabase
        .from("chat_messages")
        .select("*")
        .order("created_at", { ascending: true })
        .limit(100);
      if (cancelled) return;
      if (!fetchError && data && data.length > 0) {
        setMessages(data.map((m) => ({ id: m.id, role: m.role, text: m.text, action: m.action ?? undefined })));
      }
      setHistoryLoaded(true);
    }

    loadHistory();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  useEffect(() => {
    if (!historyLoaded || bannerShownRef.current || dueSoon.length === 0) return;
    bannerShownRef.current = true;

    const lines = dueSoon.map((r) => {
      const days = daysUntil(r.due_date);
      const when = days <= 0 ? t("dueToday") : t("dueInDays").replace("{days}", String(days));
      const amountPart = r.amount != null ? ` (${formatGEL(r.amount)})` : "";
      return `- ${r.label}${amountPart} — ${when}`;
    });
    const text = `${t("reminderBannerIntro").replace("{count}", String(dueSoon.length))}\n${lines.join("\n")}`;

    setMessages((prev) => [...prev, { id: "reminders-banner", role: "assistant", text }]);
    dueSoon.forEach((r) => acknowledgeReminder(r.id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [historyLoaded, dueSoon]);

  useEffect(() => {
    setMessages((prev) => {
      if (prev.length === 1 && prev[0].id === "welcome") {
        return [{ id: "welcome", role: "assistant", text: t(CHAT_MODE_META[mode].welcomeKey) }];
      }
      return prev;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language]);

  function switchMode(next: ChatMode) {
    setMode(next);
    setMessages((prev) => {
      if (prev.length === 1 && prev[0].id === "welcome") {
        return [{ id: "welcome", role: "assistant", text: t(CHAT_MODE_META[next].welcomeKey) }];
      }
      return prev;
    });
  }

  const snapshot = useMemo(() => {
    const now = new Date();
    const monthPrefix = now.toISOString().slice(0, 7);
    const monthTx = transactions.filter((tx) => tx.date.startsWith(monthPrefix));
    const monthlyIncome = monthTx.filter((tx) => tx.type === "income").reduce((s, tx) => s + tx.amount, 0);
    const monthlyExpenses = monthTx.filter((tx) => tx.type === "expense").reduce((s, tx) => s + tx.amount, 0);

    const topCategories = [...expensesByCategory.entries()]
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([key, amount]) => ({
        category: budgetCategories.find((c) => c.key === key)?.label ?? key,
        amount,
      }));

    return {
      totalBalance,
      netWorth: liquidTotal + nonliquidTotal - liabilitiesTotal,
      monthlyIncome,
      monthlyExpenses,
      topCategories,
      funds: funds.map((f) => ({ name: f.name, saved: f.saved_amount, target: f.target_amount })),
      liabilitiesTotal,
    };
  }, [transactions, expensesByCategory, totalBalance, liquidTotal, nonliquidTotal, liabilitiesTotal, funds]);

  async function persistMessage(message: ChatMessage) {
    if (!user || !isSupabaseConfigured) return;
    await supabase
      .from("chat_messages")
      .insert({ user_id: user.id, role: message.role, text: message.text, action: message.action ?? null });
  }

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return;
    const userMessage: ChatMessage = { id: crypto.randomUUID(), role: "user", text: text.trim() };
    const history = [...messages, userMessage];
    setMessages(history);
    setInput("");
    setError(null);
    setLoading(true);
    persistMessage(userMessage);

    const { data, error: fnError } = await supabase.functions.invoke("chat", {
      body: {
        messages: history.filter((m) => !NON_CONVERSATION_IDS.has(m.id)).map((m) => ({ role: m.role, text: m.text })),
        mode,
        snapshot,
        language,
      },
    });

    setLoading(false);

    if (fnError) {
      let detail = fnError.message;
      const context = (fnError as { context?: unknown }).context;
      if (context instanceof Response) {
        const body = await context.clone().json().catch(() => null);
        if (body?.error) detail = body.error;
      }
      setError(detail || t("chatErrorGeneric"));
      return;
    }

    const assistantMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "assistant",
      text: data?.text ?? t("chatErrorGeneric"),
      action: data?.action ?? undefined,
    };
    setMessages((prev) => [...prev, assistantMessage]);
    persistMessage(assistantMessage);
    refreshReminders();
  }

  const showSuggestions = messages.length === 1 && messages[0].id === "welcome" && !loading;

  return {
    mode,
    switchMode,
    messages,
    historyLoaded,
    input,
    setInput,
    loading,
    error,
    sendMessage,
    showSuggestions,
    snapshot,
  };
}
