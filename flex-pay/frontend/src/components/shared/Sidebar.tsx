import { LayoutDashboard, Users, Wallet, ArrowRightLeft, BookUser, CreditCard, MessageSquare, Settings } from "lucide-react";
import logoWithoutBg from "../../../logowithoutbg.png";

const NAV_ITEMS = [
  { label: "Dashboard",    icon: LayoutDashboard,  key: "dashboard"  },
  { label: "Users",        icon: Users,             key: "users"      },
  { label: "Contacts",     icon: BookUser,          key: "contacts"   },
  { label: "Cards",        icon: CreditCard,        key: "cards"      },
  { label: "Wallets",      icon: Wallet,            key: "wallet"     },
  { label: "Transactions", icon: ArrowRightLeft,    key: "payments"   },
  { label: "Chat",         icon: MessageSquare,     key: "chat"       },
  { label: "Settings",     icon: Settings,          key: "settings"   },
] as const;

type PageKey = (typeof NAV_ITEMS)[number]["key"];

interface SidebarProps {
  readonly activePage: PageKey;
  readonly onChangePage: (page: PageKey) => void;
  readonly isDark?: boolean;
}

export default function Sidebar({ activePage, onChangePage, isDark }: SidebarProps) {
  return (
    <aside
      className="transition-colors duration-200"
      style={{
        width: "240px",
        minWidth: "240px",
        height: "100vh",
        background: isDark ? "#09111f" : "#ffffff",
        borderRight: isDark ? "1px solid #1e293b" : "1px solid #e8ecf0",
        display: "flex",
        flexDirection: "column",
        padding: "24px 16px",
        boxShadow: isDark ? "2px 0 8px rgba(0,0,0,0.3)" : "2px 0 8px rgba(0,0,0,0.04)",
      }}
    >
      {/* Logo */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          padding: "0 8px 24px",
          borderBottom: isDark ? "1px solid #1e293b" : "1px solid #f1f4f8",
          marginBottom: "16px",
        }}
      >
        <div
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "10px",
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: isDark ? "#0f2338" : "#EBF8FF",
          }}
        >
          <img src={logoWithoutBg} alt="Flex Pay" style={{ width: "28px", height: "28px", objectFit: "contain" }} />
        </div>
        <div>
          <p style={{ fontSize: "15px", fontWeight: 700, color: isDark ? "#f8fafc" : "#0f172a", margin: 0, lineHeight: 1.2 }}>
            Flex Pay
          </p>
          <p style={{ fontSize: "11px", color: isDark ? "#64748b" : "#94a3b8", margin: 0, marginTop: "2px" }}>
            Admin Dashboard
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
        {NAV_ITEMS.map((item) => {
          const isActive = item.key === activePage;
          const Icon = item.icon;

          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onChangePage(item.key)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "11px",
                width: "100%",
                padding: "10px 12px",
                borderRadius: "12px",
                border: isActive
                  ? isDark ? "1px solid rgba(56, 189, 248, 0.25)" : "1px solid rgba(59, 130, 246, 0.18)"
                  : "1px solid transparent",
                cursor: "pointer",
                background: isActive
                  ? isDark
                    ? "linear-gradient(135deg, rgba(14, 165, 233, 0.18) 0%, rgba(3, 105, 161, 0.25) 100%)"
                    : "linear-gradient(135deg, #eff6ff 0%, #e0f2fe 100%)"
                  : "transparent",
                color: isActive
                  ? isDark ? "#38bdf8" : "#0369a1"
                  : isDark ? "#94a3b8" : "#64748b",
                fontWeight: isActive ? 700 : 500,
                fontSize: "14px",
                textAlign: "left",
                transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                transform: isActive ? "translateX(2px)" : "none",
                boxShadow: isActive
                  ? isDark ? "0 2px 8px -1px rgba(14, 165, 233, 0.2)" : "0 2px 8px -1px rgba(3, 105, 161, 0.12)"
                  : "none",
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = isDark ? "#1e293b" : "#f8fafc";
                  e.currentTarget.style.color = isDark ? "#f8fafc" : "#0f172a";
                  e.currentTarget.style.transform = "translateX(3px)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = isDark ? "#94a3b8" : "#64748b";
                  e.currentTarget.style.transform = "none";
                }
              }}
              onMouseDown={(e) => {
                e.currentTarget.style.transform = "scale(0.97)";
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.transform = isActive ? "translateX(2px)" : "translateX(3px)";
              }}
            >
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "32px",
                  height: "32px",
                  borderRadius: "9px",
                  background: isActive
                    ? isDark ? "rgba(56, 189, 248, 0.25)" : "#bae6fd"
                    : isDark ? "#1e293b" : "#f1f5f9",
                  color: isActive
                    ? isDark ? "#38bdf8" : "#0284c7"
                    : isDark ? "#64748b" : "#94a3b8",
                  flexShrink: 0,
                  transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                  boxShadow: isActive ? "0 2px 6px rgba(2, 132, 199, 0.2)" : "none",
                }}
              >
                <Icon size={16} />
              </span>
              <span style={{ flex: 1 }}>{item.label}</span>
              {isActive && (
                <span
                  style={{
                    width: "7px",
                    height: "7px",
                    borderRadius: "50%",
                    background: isDark ? "#38bdf8" : "#0284c7",
                    boxShadow: isDark ? "0 0 8px #38bdf8" : "0 0 8px #0284c7",
                    flexShrink: 0,
                    animation: "pulse 2s infinite ease-in-out",
                  }}
                />
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div style={{ marginTop: "auto", padding: "16px 12px 0", borderTop: isDark ? "1px solid #1e293b" : "1px solid #f1f4f8" }}>
        <p style={{ fontSize: "11px", color: isDark ? "#475569" : "#cbd5e1", textAlign: "center" }}>
          © 2026 Flex Pay
        </p>
      </div>
    </aside>
  );
}
