import { useState, useEffect } from "react";
import { Bell, UserCircle2, LogOut, Sun, Moon } from "lucide-react";
import Sidebar from "./components/shared/Sidebar";
import UsersPage from "./pages/users/UsersPage";
import WalletsPage from "./pages/wallets/WalletsPage";
import DashboardPage from "./pages/dashboard/DashboardPage";
import ContactsPage from "./pages/contacts/ContactsPage";
import CardsPage from "./pages/cards/CardsPage";
import PaymentsPage from "./pages/payments/PaymentsPage";
import AuthPage from "./pages/auth/AuthPage";
import AdminChat from "./pages/chat/AdminChat";
import SettingsPage from "./pages/settings/SettingsPage";
import GlobalSearch from "./components/shared/GlobalSearch";
import { getSession, saveSession, clearSession, type UserSession } from "./services/authService";
import { getSettings, saveSettings, applyThemeMode, onSettingsChange, type SystemSettings } from "./services/settingsService";

const PAGES = {
  dashboard: "Dashboard",
  users:     "Users",
  contacts:  "Contacts",
  cards:     "Cards",
  wallet:    "Wallets",
  payments:  "Transactions",
  chat:      "Chat",
  settings:  "Settings",
} as const;

type PageKey = keyof typeof PAGES;

export default function App() {
  const [activePage, setActivePage] = useState<PageKey>("dashboard");
  const [session, setSession] = useState<UserSession | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [settings, setSettings] = useState<SystemSettings>(getSettings());
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const activeSession = getSession();
    if (activeSession) {
      setSession(activeSession);
    }
    const currentSettings = getSettings();
    setSettings(currentSettings);
    const darkActive = applyThemeMode(currentSettings.themeMode);
    setIsDark(darkActive);

    const cleanup = onSettingsChange((updated) => {
      setSettings(updated);
      const isD = applyThemeMode(updated.themeMode);
      setIsDark(isD);
    });

    setIsInitializing(false);
    return cleanup;
  }, []);

  function handleLogin(newSession: UserSession) {
    saveSession(newSession);
    setSession(newSession);
  }

  function handleLogout() {
    clearSession();
    setSession(null);
  }

  function toggleThemeMode() {
    const nextMode = isDark ? "light" : "dark";
    const updated = { ...settings, themeMode: nextMode as "light" | "dark" };
    setSettings(updated);
    saveSettings(updated);
    const darkNow = applyThemeMode(nextMode);
    setIsDark(darkNow);
  }

  if (isInitializing) {
    return (
      <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: isDark ? "#09111f" : "#f8fafc", color: isDark ? "#fff" : "#0f172a" }}>
        Loading...
      </div>
    );
  }

  if (!session) {
    return <AuthPage onAuthSuccess={handleLogin} />;
  }

  return (
    <div
      className={isDark ? "dark" : ""}
      style={{
        display: "flex",
        height: "100vh",
        width: "100%",
        background: isDark ? "#09111f" : "#f5f7fa",
        color: isDark ? "#edf3ff" : "#0f172a",
        transition: "background 0.2s, color 0.2s",
      }}
    >
      <Sidebar activePage={activePage} onChangePage={setActivePage} isDark={isDark} />

      <div style={{ display: "flex", flex: 1, flexDirection: "column", overflow: "hidden" }}>
        {/* Top Bar */}
        <header
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "16px",
            borderBottom: isDark ? "1px solid #1e293b" : "1px solid #e8ecf0",
            background: isDark ? "#0f1a2e" : "#ffffff",
            padding: "0 28px",
            height: "64px",
            flexShrink: 0,
            boxShadow: isDark ? "0 1px 4px rgba(0,0,0,0.3)" : "0 1px 3px rgba(0,0,0,0.04)",
            transition: "background 0.2s, border-color 0.2s",
          }}
        >
          {/* Left: Page Title + Search */}
          <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
            <div>
              <p style={{ fontSize: "11px", color: isDark ? "#64748b" : "#94a3b8", margin: 0, fontWeight: 500 }}>
                Flex Pay Admin
              </p>
              <p style={{ fontSize: "15px", fontWeight: 700, color: isDark ? "#f8fafc" : "#0f172a", margin: 0 }}>
                {PAGES[activePage as keyof typeof PAGES]}
              </p>
            </div>

            <GlobalSearch />
          </div>

          {/* Right: Actions */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {/* Dark / Light Mode Toggle Button */}
            <button
              type="button"
              onClick={toggleThemeMode}
              aria-label={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
              title={isDark ? "Switch to Light Mode (Original)" : "Switch to Dark Mode"}
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "10px",
                border: isDark ? "1px solid #1e293b" : "1px solid #e8ecf0",
                background: isDark ? "#1e293b" : "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: isDark ? "#facc15" : "#64748b",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.05)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "none";
              }}
            >
              {isDark ? <Sun size={17} /> : <Moon size={17} />}
            </button>

            <button
              type="button"
              aria-label="Notifications"
              style={{
                width: "40px", height: "40px",
                borderRadius: "10px",
                border: isDark ? "1px solid #1e293b" : "1px solid #e8ecf0",
                background: isDark ? "#1e293b" : "#fff",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer",
                color: isDark ? "#94a3b8" : "#64748b",
              }}
            >
              <Bell size={16} />
            </button>

            <button
              type="button"
              aria-label="Admin profile"
              style={{
                display: "inline-flex", alignItems: "center", gap: "8px",
                padding: "8px 14px",
                borderRadius: "10px",
                border: isDark ? "1px solid #1e293b" : "1px solid #e8ecf0",
                background: isDark ? "#1e293b" : "#fff",
                fontSize: "13px", fontWeight: 600,
                color: isDark ? "#f1f5f9" : "#334155", cursor: "default",
              }}
            >
              <UserCircle2 size={18} color={isDark ? "#94a3b8" : "#64748b"} />
              {session.user.name} ({session.user.role})
            </button>
            <button
              type="button"
              onClick={handleLogout}
              aria-label="Logout"
              style={{
                display: "inline-flex", alignItems: "center", gap: "8px",
                padding: "8px 14px",
                borderRadius: "10px",
                border: "none",
                background: isDark ? "rgba(239, 68, 68, 0.2)" : "#fee2e2",
                fontSize: "13px", fontWeight: 600,
                color: isDark ? "#f87171" : "#dc2626", cursor: "pointer",
                transition: "background 0.2s"
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = isDark ? "rgba(239, 68, 68, 0.3)" : "#fecaca"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = isDark ? "rgba(239, 68, 68, 0.2)" : "#fee2e2"; }}
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main style={{
          flex: 1,
          overflowY: activePage === "chat" ? "hidden" : "auto",
          padding: activePage === "chat" ? "0" : "28px 28px",
          display: activePage === "chat" ? "flex" : "block",
          flexDirection: "column",
          background: isDark ? "#09111f" : "#f5f7fa",
        }}>
          <div key={activePage} className="animate-page" style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            {activePage === "dashboard" && <DashboardPage onNavigate={setActivePage} />}
            {activePage === "users"     && <UsersPage />}
            {activePage === "contacts"  && <ContactsPage />}
            {activePage === "cards"     && <CardsPage />}
            {activePage === "wallet"    && <WalletsPage />}
            {activePage === "payments"  && <PaymentsPage />}
            {activePage === "chat"      && <AdminChat />}
            {activePage === "settings"  && <SettingsPage />}
          </div>
        </main>

        {/* Footer */}
        <footer
          style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            borderTop: isDark ? "1px solid #1e293b" : "1px solid #e8ecf0",
            background: isDark ? "#0f1a2e" : "#fff",
            padding: "12px 28px",
            fontSize: "12px", color: isDark ? "#64748b" : "#94a3b8",
            flexShrink: 0,
          }}
        >
          <span>© 2026 Flex Pay. All rights reserved.</span>
          <span>Powered by Flex Pay</span>
        </footer>
      </div>
    </div>
  );
}
