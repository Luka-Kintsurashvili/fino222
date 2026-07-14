import { NavLink } from "react-router-dom";
import { X } from "lucide-react";
import { moreNav } from "@/lib/nav";

interface MoreSheetProps {
  open: boolean;
  onClose: () => void;
}

export function MoreSheet({ open, onClose }: MoreSheetProps) {
  return (
    <div className={`fixed inset-0 z-50 ${open ? "" : "pointer-events-none"}`} inert={!open}>
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0"
        }`}
      />
      <div
        className={`safe-bottom absolute inset-x-0 bottom-0 mx-auto max-w-lg rounded-t-3xl border-t border-border bg-bg-elevated p-5 transition-transform duration-300 ${
          open ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-border" />
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-text-primary">მეტი</h2>
          <button onClick={onClose} className="rounded-full p-1.5 text-text-muted hover:bg-surface hover:text-text-primary">
            <X size={20} />
          </button>
        </div>
        <div className="grid grid-cols-3 gap-3 pb-2">
          {moreNav.map(({ path, label, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              onClick={onClose}
              className={({ isActive }) =>
                `flex flex-col items-center gap-2 rounded-2xl border p-4 text-center text-xs font-medium transition-colors ${
                  isActive
                    ? "border-accent/50 bg-accent-soft text-text-primary"
                    : "border-border bg-surface text-text-secondary hover:border-accent/30"
                }`
              }
            >
              <Icon size={22} />
              <span>{label}</span>
            </NavLink>
          ))}
        </div>
      </div>
    </div>
  );
}
