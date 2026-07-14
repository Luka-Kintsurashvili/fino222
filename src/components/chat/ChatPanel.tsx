import { useState, useRef, useEffect } from "react";
import { X, Send, Sparkles } from "lucide-react";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
}

interface ChatPanelProps {
  open: boolean;
  onClose: () => void;
}

const WELCOME: ChatMessage = {
  id: "welcome",
  role: "assistant",
  text: "გამარჯობა! ფინო ასისტენტი მალე დაემატება — ამ ფუნქციაზე ჯერ კიდევ ვმუშაობთ. მალე დაბრუნდი!",
};

export function ChatPanel({ open, onClose }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME]);
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  function handleSend() {
    const text = input.trim();
    if (!text) return;

    const userMessage: ChatMessage = { id: crypto.randomUUID(), role: "user", text };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    // The Gemini-powered assistant isn't live yet — respond honestly instead of
    // firing a network call that has no working backend behind it.
    setMessages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        role: "assistant",
        text: "ჩატ-ასისტენტი ჯერ არ არის აქტიური — ამ ფუნქციაზე მუშაობა მალე დასრულდება. მადლობა მოთმინებისთვის!",
      },
    ]);
  }

  return (
    <div
      className={`fixed inset-0 z-50 flex items-end justify-center transition-opacity ${
        open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
      }`}
      inert={!open}
    >
      <div onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className={`safe-bottom relative flex h-[75dvh] w-full max-w-lg flex-col rounded-t-3xl border-t border-border bg-bg-elevated transition-transform duration-300 ${
          open ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-border-soft px-5 py-4">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl gradient-accent text-white">
              <Sparkles size={16} />
            </span>
            <div>
              <p className="text-sm font-bold text-text-primary">ფინო ასისტენტი</p>
              <p className="text-[11px] text-text-muted">ფინანსური რჩევები ქართულად</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-full p-1.5 text-text-muted hover:bg-surface hover:text-text-primary">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
          {messages.map((m) => (
            <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  m.role === "user"
                    ? "gradient-accent text-white"
                    : "border border-border-soft bg-surface text-text-primary"
                }`}
              >
                {m.text}
              </div>
            </div>
          ))}
          <div ref={endRef} />
        </div>

        <div className="border-t border-border-soft p-3">
          <div className="flex items-center gap-2 rounded-xl border border-border bg-bg px-3 py-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="დაწერე შეკითხვა..."
              className="w-full bg-transparent text-sm text-text-primary outline-none placeholder:text-text-muted disabled:opacity-60"
            />
            <button
              onClick={handleSend}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg gradient-accent text-white disabled:opacity-60"
            >
              <Send size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
