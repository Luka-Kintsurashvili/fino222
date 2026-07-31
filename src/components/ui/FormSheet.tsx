import type { ReactNode } from "react";
import { X } from "lucide-react";

interface FormSheetProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

export function FormSheet({ open, title, onClose, children }: FormSheetProps) {
  return (
    <div className={`fixed inset-0 z-50 ${open ? "" : "pointer-events-none"}`} inert={!open}>
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0"
        }`}
      />
      <div
        className={`safe-bottom absolute inset-x-0 bottom-0 mx-auto max-w-lg rounded-t-3xl border-t border-border bg-bg-elevated shadow-[0_-16px_40px_-12px_rgba(0,0,0,0.5)] transition-transform duration-300 ${
          open ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="mx-auto mt-3 h-1 w-9 rounded-full bg-border" />
        <div className="flex items-center justify-between border-b border-border-soft px-5 py-4">
          <h2 className="text-lg font-bold text-text-primary">{title}</h2>
          <button onClick={onClose} className="rounded-full p-1.5 text-text-muted hover:bg-surface hover:text-text-primary">
            <X size={20} />
          </button>
        </div>
        <div className="max-h-[65dvh] space-y-4 overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}
