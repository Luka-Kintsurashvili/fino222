import { Flame, Scale, Zap } from "lucide-react";
import type { TranslationKey } from "@/lib/i18n";

export type ChatMode = "hype" | "balanced" | "roast";

interface ChatModeMeta {
  icon: typeof Flame;
  gradient: string;
  titleKey: TranslationKey;
  subtitleKey: TranslationKey;
  welcomeKey: TranslationKey;
}

export const CHAT_MODE_META: Record<ChatMode, ChatModeMeta> = {
  hype: {
    icon: Zap,
    gradient: "from-amber-400 to-pink-500",
    titleKey: "chatModeHype",
    subtitleKey: "chatSubtitleHype",
    welcomeKey: "chatWelcomeHype",
  },
  balanced: {
    icon: Scale,
    gradient: "from-accent-from to-accent-to",
    titleKey: "chatModeBalanced",
    subtitleKey: "chatSubtitleBalanced",
    welcomeKey: "chatWelcomeBalanced",
  },
  roast: {
    icon: Flame,
    gradient: "from-rose-600 to-orange-500",
    titleKey: "chatModeRoast",
    subtitleKey: "chatSubtitleRoast",
    welcomeKey: "chatWelcomeRoast",
  },
};
