import {
  Wallet,
  Landmark,
  PiggyBank,
  PieChart,
  TrendingUp,
  CalendarDays,
  BookOpen,
  ArrowLeftRight,
} from "lucide-react";
import type { NavItem } from "@/types/nav";

export const primaryNav: NavItem[] = [
  { path: "/accounts", labelKey: "navAccounts", icon: Wallet },
  { path: "/loan", labelKey: "navLoan", icon: Landmark },
  { path: "/budget", labelKey: "navBudget", icon: PieChart },
  { path: "/calendar", labelKey: "navCalendar", icon: CalendarDays },
];

export const moreNav: NavItem[] = [
  { path: "/savings", labelKey: "navSavings", icon: PiggyBank },
  { path: "/inflation", labelKey: "navInflation", icon: TrendingUp },
  { path: "/articles", labelKey: "navArticles", icon: BookOpen },
  { path: "/currency", labelKey: "navCurrency", icon: ArrowLeftRight },
];

export const allNav: NavItem[] = [...primaryNav, ...moreNav];
