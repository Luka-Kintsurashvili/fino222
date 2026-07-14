import { createContext, useContext, useState, type ReactNode } from "react";

interface ChatUIContextValue {
  open: boolean;
  openChat: () => void;
  closeChat: () => void;
}

const ChatUIContext = createContext<ChatUIContextValue>({
  open: false,
  openChat: () => {},
  closeChat: () => {},
});

export function ChatUIProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <ChatUIContext.Provider value={{ open, openChat: () => setOpen(true), closeChat: () => setOpen(false) }}>
      {children}
    </ChatUIContext.Provider>
  );
}

export function useChatUI() {
  return useContext(ChatUIContext);
}
