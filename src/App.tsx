import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/lib/AuthContext";
import { ChatUIProvider } from "@/lib/ChatUIContext";
import { ThemeProvider } from "@/lib/ThemeContext";
import { LanguageProvider } from "@/lib/LanguageContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { LoanPage } from "@/pages/LoanPage";
import { SavingsPage } from "@/pages/SavingsPage";
import { BudgetPage } from "@/pages/BudgetPage";
import { InflationPage } from "@/pages/InflationPage";
import { CalendarPage } from "@/pages/CalendarPage";
import { ArticlesPage } from "@/pages/ArticlesPage";
import { CurrencyPage } from "@/pages/CurrencyPage";
import { AdvisorPage } from "@/pages/AdvisorPage";
import { LoginPage } from "@/pages/LoginPage";
import { ProfilePage } from "@/pages/ProfilePage";
import { SecurityPage } from "@/pages/SecurityPage";
import { NotificationsPage } from "@/pages/NotificationsPage";
import { SettingsPage } from "@/pages/SettingsPage";

function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <ChatUIProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route element={<AppLayout />}>
                  <Route index element={<Navigate to="/loan" replace />} />
                  <Route path="/loan" element={<LoanPage />} />
                  <Route path="/savings" element={<SavingsPage />} />
                  <Route path="/budget" element={<BudgetPage />} />
                  <Route path="/inflation" element={<InflationPage />} />
                  <Route path="/goals" element={<Navigate to="/savings" replace />} />
                  <Route path="/calendar" element={<CalendarPage />} />
                  <Route path="/articles" element={<ArticlesPage />} />
                  <Route path="/currency" element={<CurrencyPage />} />
                  <Route path="/advisor" element={<AdvisorPage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/security" element={<SecurityPage />} />
                  <Route path="/notifications" element={<NotificationsPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route path="*" element={<Navigate to="/loan" replace />} />
                </Route>
              </Routes>
            </BrowserRouter>
          </ChatUIProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;
