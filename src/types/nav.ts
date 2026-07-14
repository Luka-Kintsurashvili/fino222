import type { LucideIcon } from "lucide-react";
import type { TranslationKey } from "@/lib/i18n";

export interface NavItem {
  path: string;
  labelKey: TranslationKey;
  icon: LucideIcon;
}
