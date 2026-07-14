import { MessageCircle } from "lucide-react";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { useChatUI } from "@/lib/ChatUIContext";

export function ChatBubble() {
  const { open, openChat, closeChat } = useChatUI();

  return (
    <>
      {!open && (
        <button
          onClick={openChat}
          className="fixed bottom-24 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full gradient-accent text-white shadow-[0_8px_30px_rgba(99,102,241,0.5)] transition-transform active:scale-95"
          aria-label="ფინო ასისტენტის გახსნა"
        >
          <MessageCircle size={24} />
        </button>
      )}
      <ChatPanel open={open} onClose={closeChat} />
    </>
  );
}
