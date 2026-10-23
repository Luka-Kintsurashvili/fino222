import { Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";

interface SubPageHeaderProps {
  title: string;
  subtitle?: string;
  /** Where the back link goes. Defaults to the wallet (home) page — every subpage is reached from there. */
  backTo?: string;
  /** Set false to hide the back link entirely, e.g. on the home page itself. */
  showBack?: boolean;
}

export function SubPageHeader({ title, subtitle, backTo = "/", showBack = true }: SubPageHeaderProps) {
  return (
    <div className="mb-5">
      {showBack && (
        <Link
          to={backTo}
          className="mb-3 flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary"
        >
          <ChevronLeft size={18} />
          უკან
        </Link>
      )}
      <h1 className="text-2xl font-bold text-text-primary">{title}</h1>
      {subtitle && <p className="mt-1 text-sm text-text-secondary">{subtitle}</p>}
    </div>
  );
}
