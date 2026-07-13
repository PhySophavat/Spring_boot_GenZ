import { Key, LayoutDashboard, Users, Wallet } from "lucide-react";
import logoWithoutBg from "../../../logowithoutbg.png";

const NAV_ITEMS = [
  { label: "Dashboard", icon: LayoutDashboard, key: "dashboard" },
  { label: "Users", icon: Users, key: "users" },
  { label: "Wallets", icon: Wallet, key: "wallet" },
  { label: "PIN", icon: Key, key: "pin" },
] as const;

type PageKey = (typeof NAV_ITEMS)[number]["key"];

interface SidebarProps {
  readonly activePage: PageKey;
  readonly onChangePage: (page: PageKey) => void;
}

export default function Sidebar({ activePage, onChangePage }: SidebarProps) {
  return (
    <aside className="flex h-screen w-[250px] flex-col border-r border-slate-200 bg-slate-100 text-slate-100 shadow-xl">
      <div className="flex flex-col justify-between h-full px-5 py-6">
        <div>
          <div className="flex items-center gap-3 rounded-3xl px-4 py-4 shadow-slate-950/20">
            <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl ">
              <img src={logoWithoutBg} alt="Flex Pay logo" className="h-10 w-10 object-contain" />
            </div>
            <div>
              <p className="text-lg font-semibold text-slate-800">Flex Pay</p>
              <p className="text-sm text-slate-400">Admin Dashboard</p>
            </div>
          </div>

          <nav className="mt-8 space-y-2">
            {NAV_ITEMS.map((item) => {
              const isActive = item.key === activePage;
              const Icon = item.icon;

              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => onChangePage(item.key)}
                  className={`flex w-full items-center gap-3 rounded-sm px-1 py-2 text-left text-sm font-medium transition ${
                    isActive
                      ? " text-black"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  <span
                    className={`flex h-10 w-10 items-center justify-center rounded-2xl ${
                      isActive ? "text-blue-800" : "text-slate-400"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="flex-1">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        
      </div>
    </aside>
  );
}
