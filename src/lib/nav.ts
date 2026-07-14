import {
  Landmark,
  PiggyBank,
  PieChart,
  TrendingUp,
  Target,
  CalendarDays,
  BookOpen,
  ArrowLeftRight,
  Sparkles,
} from "lucide-react";
import type { NavItem } from "@/types/nav";

export const primaryNav: NavItem[] = [
  { path: "/loan", label: "სესხი", icon: Landmark },
  { path: "/savings", label: "დანაზოგი", icon: PiggyBank },
  { path: "/budget", label: "ბიუჯეტი", icon: PieChart },
  { path: "/inflation", label: "ინფლაცია", icon: TrendingUp },
];

export const moreNav: NavItem[] = [
  { path: "/goals", label: "მიზნები", icon: Target },
  { path: "/calendar", label: "კალენდარი", icon: CalendarDays },
  { path: "/articles", label: "სტატიები", icon: BookOpen },
  { path: "/currency", label: "ვალუტა", icon: ArrowLeftRight },
  { path: "/advisor", label: "მრჩეველი", icon: Sparkles },
];

export const allNav: NavItem[] = [...primaryNav, ...moreNav];
