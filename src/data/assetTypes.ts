import { Banknote, TrendingUp, Building2, Car, Gem, Package, type LucideIcon } from "lucide-react";

export type AssetTypeKey = "cash" | "investment" | "real_estate" | "vehicle" | "valuables" | "other";
export type Liquidity = "liquid" | "nonliquid";

interface AssetTypeDef {
  key: AssetTypeKey;
  label: string;
  icon: LucideIcon;
  liquidity: Liquidity;
}

export const assetTypes: AssetTypeDef[] = [
  { key: "cash", label: "ნაღდი ფული", icon: Banknote, liquidity: "liquid" },
  { key: "investment", label: "ინვესტიცია", icon: TrendingUp, liquidity: "liquid" },
  { key: "real_estate", label: "უძრავი ქონება", icon: Building2, liquidity: "nonliquid" },
  { key: "vehicle", label: "ავტომობილი", icon: Car, liquidity: "nonliquid" },
  { key: "valuables", label: "ძვირფასეულობა", icon: Gem, liquidity: "nonliquid" },
  { key: "other", label: "სხვა", icon: Package, liquidity: "nonliquid" },
];
