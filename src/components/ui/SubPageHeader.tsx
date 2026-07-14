import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";

interface SubPageHeaderProps {
  title: string;
  subtitle?: string;
}

export function SubPageHeader({ title, subtitle }: SubPageHeaderProps) {
  const navigate = useNavigate();
  return (
    <div className="mb-5">
      <button
        onClick={() => navigate(-1)}
        className="mb-3 flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary"
      >
        <ChevronLeft size={18} />
        უკან
      </button>
      <h1 className="text-2xl font-bold text-text-primary">{title}</h1>
      {subtitle && <p className="mt-1 text-sm text-text-secondary">{subtitle}</p>}
    </div>
  );
}
