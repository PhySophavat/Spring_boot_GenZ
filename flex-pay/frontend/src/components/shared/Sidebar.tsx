import { LayoutDashboard, Users, Wallet, ArrowRightLeft, BookUser, CreditCard, MessageSquare } from "lucide-react";
import logoWithoutBg from "../../../logowithoutbg.png";

const NAV_ITEMS = [
  { label: "Dashboard",    icon: LayoutDashboard,  key: "dashboard"  },
  { label: "Users",        icon: Users,             key: "users"      },
  { label: "Contacts",     icon: BookUser,          key: "contacts"   },
  { label: "Cards",        icon: CreditCard,        key: "cards"      },
  { label: "Wallets",      icon: Wallet,            key: "wallet"     },
  { label: "Transactions", icon: ArrowRightLeft,    key: "payments"   },
  { label: "Chat",         icon: MessageSquare,     key: "chat"       },
] as const;

type PageKey = (typeof NAV_ITEMS)[number]["key"];

interface SidebarProps {
  readonly activePage: PageKey;
  readonly onChangePage: (page: PageKey) => void;
}

export default function Sidebar({ activePage, onChangePage }: SidebarProps) {
  return (
    <aside
      style={{
        width: "240px",
        minWidth: "240px",
        height: "100vh",
        background: "#ffffff",
        borderRight: "1px solid #e8ecf0",
        display: "flex",
        flexDirection: "column",
        padding: "24px 16px",
        boxShadow: "2px 0 8px rgba(0,0,0,0.04)",
      }}
    >
      {/* Logo */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          padding: "0 8px 28px",
          borderBottom: "1px solid #f1f4f8",
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
            background: "#EBF8FF",
          }}
        >
          <img src={logoWithoutBg} alt="Flex Pay" style={{ width: "28px", height: "28px", objectFit: "contain" }} />
        </div>
        <div>
          <p style={{ fontSize: "15px", fontWeight: 700, color: "#0f172a", margin: 0, lineHeight: 1.2 }}>
            Flex Pay
          </p>
          <p style={{ fontSize: "11px", color: "#94a3b8", margin: 0, marginTop: "2px" }}>
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
                gap: "10px",
                width: "100%",
                padding: "10px 12px",
                borderRadius: "10px",
                border: "none",
                cursor: "pointer",
                background: isActive ? "#EBF8FF" : "transparent",
                color: isActive ? "#1a5fa8" : "#64748b",
                fontWeight: isActive ? 600 : 500,
                fontSize: "14px",
                textAlign: "left",
                transition: "background 0.15s, color 0.15s",
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = "#f8fafc";
                  e.currentTarget.style.color = "#1e293b";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "#64748b";
                }
              }}
            >
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "32px",
                  height: "32px",
                  borderRadius: "8px",
                  background: isActive ? "#BEE3F8" : "#f1f5f9",
                  color: isActive ? "#1a5fa8" : "#94a3b8",
                  flexShrink: 0,
                  transition: "background 0.15s, color 0.15s",
                }}
              >
                <Icon size={15} />
              </span>
              {item.label}
              {isActive && (
                <span
                  style={{
                    marginLeft: "auto",
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    background: "#3b82f6",
                    flexShrink: 0,
                  }}
                />
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div style={{ marginTop: "auto", padding: "16px 12px 0", borderTop: "1px solid #f1f4f8" }}>
        <p style={{ fontSize: "11px", color: "#cbd5e1", textAlign: "center" }}>
          © 2026 Flex Pay
        </p>
      </div>
    </aside>
  );
}
