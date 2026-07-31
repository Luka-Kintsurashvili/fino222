import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/lib/AuthContext";
import { ThemeProvider } from "@/lib/ThemeContext";
import { LanguageProvider } from "@/lib/LanguageContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { HomePage } from "@/pages/HomePage";
import { AccountsPage } from "@/pages/AccountsPage";
import { ProjectPage } from "@/pages/ProjectPage";
import { FundsPage } from "@/pages/FundsPage";
import { CalendarPage } from "@/pages/CalendarPage";
import { LoginPage } from "@/pages/LoginPage";
import { TbcCallbackPage } from "@/pages/TbcCallbackPage";
import { ProfilePage } from "@/pages/ProfilePage";
import { SecurityPage } from "@/pages/SecurityPage";
import { NotificationsPage } from "@/pages/NotificationsPage";
import { SettingsPage } from "@/pages/SettingsPage";

function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/tbc-callback" element={<TbcCallbackPage />} />
              <Route element={<AppLayout />}>
                <Route index element={<HomePage />} />
                <Route path="/wallet" element={<AccountsPage />} />
                <Route path="/accounts" element={<Navigate to="/wallet" replace />} />
                <Route path="/projects/:id" element={<ProjectPage />} />
                <Route path="/funds" element={<FundsPage />} />
                <Route path="/calendar" element={<CalendarPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/security" element={<SecurityPage />} />
                <Route path="/notifications" element={<NotificationsPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;
