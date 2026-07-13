import { useState } from "react";
import { Search, Bell, UserCircle2 } from "lucide-react";
import Sidebar from "./components/shared/Sidebar";
import UsersPage from "./pages/users/UsersPage";
import WalletsPage from "./pages/wallets/WalletsPage";
import PinPage from "./pages/pin/PinPage";

const PAGES = {
  dashboard: "Dashboard",
  users: "Users",
  wallet: "Wallets",
  pin: "PIN",
} as const;

type PageKey = keyof typeof PAGES;

export default function App() {
  const [activePage, setActivePage] = useState<PageKey>("dashboard");

  return (
    <div className="flex h-screen w-full bg-slate-100 text-slate-900">
      <Sidebar activePage={activePage} onChangePage={setActivePage} />

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex items-center justify-between gap-4 border-b border-slate-200 bg-white/90 px-6 py-4 shadow-sm backdrop-blur">
          <div className="flex items-center gap-3">
          

            <div className="relative w-[300px] hidden flex-1 items-center rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm sm:flex">
              <Search className="h-4 w-4 text-slate-400" />
              <input
                type="search"
                placeholder="Search "
                className="ml-3 w-full bg-transparent text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
          
           
            <button
              type="button"
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-700 transition hover:bg-slate-100"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" />
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
              aria-label="Admin profile"
            >
              <UserCircle2 className="h-5 w-5 text-slate-500" />
              Admin
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-auto px-6 py-8">
          {activePage === "dashboard" && (
            <div className="h-full rounded-[32px] border border-slate-200 bg-slate-50 shadow-sm" />
          )}
          {activePage === "users" && <UsersPage />}
          {activePage === "wallet" && <WalletsPage />}
          {activePage === "pin" && <PinPage />}
        </main>

        <footer className="flex items-center justify-between gap-4 border-t border-slate-200 bg-slate-100 px-6 py-3 text-sm text-slate-500">
          <span>© 2026 Flex Pay. All rights reserved.</span>
          <span>Powered by Flex Pay </span>
        </footer>
      </div>
    </div>
  );
}
