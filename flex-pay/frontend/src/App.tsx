import { useState } from "react";
import { Search, Bell, UserCircle2 } from "lucide-react";
import Sidebar from "./components/shared/Sidebar";
import UsersPage from "./pages/users/UsersPage";
import WalletsPage from "./pages/wallets/WalletsPage";
import DashboardPage from "./pages/dashboard/DashboardPage";
import PaymentsPage from "./pages/payments/PaymentsPage";

const PAGES = {
  dashboard: "Dashboard",
  users:     "Users",
  wallet:    "Wallets",
  payments:  "Transactions",
} as const;

type PageKey = keyof typeof PAGES;

export default function App() {
  const [activePage, setActivePage] = useState<PageKey>("dashboard");

  return (
    <div style={{ display: "flex", height: "100vh", width: "100%", background: "#f5f7fa", color: "#0f172a" }}>
      <Sidebar activePage={activePage} onChangePage={setActivePage} />

      <div style={{ display: "flex", flex: 1, flexDirection: "column", overflow: "hidden" }}>
        {/* Top Bar */}
        <header
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "16px",
            borderBottom: "1px solid #e8ecf0",
            background: "#ffffff",
            padding: "0 28px",
            height: "64px",
            flexShrink: 0,
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          }}
        >
          {/* Left: Page Title + Search */}
          <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
            <div>
              <p style={{ fontSize: "11px", color: "#94a3b8", margin: 0, fontWeight: 500 }}>
                Flex Pay Admin
              </p>
              <p style={{ fontSize: "15px", fontWeight: 700, color: "#0f172a", margin: 0 }}>
                {PAGES[activePage]}
              </p>
            </div>

            <div
              style={{
                display: "flex", alignItems: "center", gap: "8px",
                border: "1px solid #e8ecf0",
                borderRadius: "10px",
                padding: "8px 14px",
                background: "#f8fafc",
                width: "240px",
              }}
            >
              <Search size={14} color="#94a3b8" />
              <input
                type="search"
                placeholder="Search anything..."
                style={{
                  border: "none", background: "transparent",
                  fontSize: "13px", color: "#334155",
                  outline: "none", width: "100%",
                }}
              />
            </div>
          </div>

          {/* Right: Actions */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <button
              type="button"
              aria-label="Notifications"
              style={{
                width: "40px", height: "40px",
                borderRadius: "10px",
                border: "1px solid #e8ecf0",
                background: "#fff",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer",
                color: "#64748b",
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
                border: "1px solid #e8ecf0",
                background: "#fff",
                fontSize: "13px", fontWeight: 600,
                color: "#334155", cursor: "pointer",
              }}
            >
              <UserCircle2 size={18} color="#64748b" />
              Admin
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main style={{ flex: 1, overflowY: "auto", padding: "28px 28px" }}>
          {activePage === "dashboard" && <DashboardPage />}
          {activePage === "users"     && <UsersPage />}
          {activePage === "wallet"    && <WalletsPage />}
          {activePage === "payments"  && <PaymentsPage />}
        </main>

        {/* Footer */}
        <footer
          style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            borderTop: "1px solid #e8ecf0",
            background: "#fff",
            padding: "12px 28px",
            fontSize: "12px", color: "#94a3b8",
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
