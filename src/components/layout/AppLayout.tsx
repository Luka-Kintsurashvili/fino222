import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { MoreSheet } from "@/components/layout/MoreSheet";
import { ChatBubble } from "@/components/chat/ChatBubble";
import { moreNav } from "@/lib/nav";

export function AppLayout() {
  const [moreOpen, setMoreOpen] = useState(false);
  const location = useLocation();
  const moreActive = moreNav.some((item) => location.pathname.startsWith(item.path));

  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col">
      <Header />
      <main className="flex-1 px-4 pb-6 pt-5">
        <Outlet />
      </main>
      <BottomNav onMoreClick={() => setMoreOpen(true)} moreActive={moreActive} />
      <MoreSheet open={moreOpen} onClose={() => setMoreOpen(false)} />
      <ChatBubble />
    </div>
  );
}
