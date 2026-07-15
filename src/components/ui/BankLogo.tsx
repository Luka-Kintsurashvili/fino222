import type { Bank } from "@/data/banks";

interface BankBrand {
  initials: string;
  from: string;
  to: string;
}

export const BANK_BRAND: Record<string, BankBrand> = {
  tbc: { initials: "TBC", from: "#0057FF", to: "#00A3FF" },
  bog: { initials: "BOG", from: "#FF4238", to: "#FF8A38" },
  liberty: { initials: "LB", from: "#00B67A", to: "#4FE3A8" },
  credo: { initials: "CR", from: "#F5A623", to: "#F76B1C" },
  basisbank: { initials: "BB", from: "#7A3BFF", to: "#B366FF" },
};

interface BankLogoProps {
  bank: Bank;
  size?: number;
}

/** Original monogram badge — not a reproduction of any bank's real logo. */
export function BankLogo({ bank, size = 28 }: BankLogoProps) {
  const brand = BANK_BRAND[bank.id] ?? { initials: bank.name.slice(0, 2).toUpperCase(), from: "#3B82F6", to: "#8B5CF6" };
  const fontSize = size * 0.34;

  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-full font-sans font-bold text-white"
      style={{
        width: size,
        height: size,
        fontSize,
        backgroundImage: `linear-gradient(135deg, ${brand.from} 0%, ${brand.to} 100%)`,
      }}
      aria-hidden="true"
    >
      {brand.initials}
    </span>
  );
}
