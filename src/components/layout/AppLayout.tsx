import { Outlet, useLocation } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { ChartDrawer } from "@/components/chat/ChartDrawer";
import { OnboardingModal } from "@/components/onboarding/OnboardingModal";
import { ChartDrawerProvider } from "@/lib/ChartDrawerContext";
import { QuickSheetProvider } from "@/lib/QuickSheetContext";
import { useAuth } from "@/lib/AuthContext";

export function AppLayout() {
  const location = useLocation();
  const { user } = useAuth();
  const isChatScreen = location.pathname === "/chat";

  return (
    <ChartDrawerProvider>
      <QuickSheetProvider>
        <div className="mx-auto flex min-h-dvh max-w-lg flex-col">
          <Header />
          <main className={`flex-1 ${isChatScreen ? "" : "px-4 pb-6 pt-5"}`}>
            <Outlet />
          </main>
          <ChartDrawer />
          {user && <OnboardingModal />}
        </div>
      </QuickSheetProvider>
    </ChartDrawerProvider>
  );
}
