import { useEffect, useState, useMemo, useCallback } from "react";
import { RefreshCw, AlertTriangle, CheckCircle2 } from "lucide-react";

import type {
  WalletInfo,
  WalletSummary,
  SavingSummary,
  GoalSummary,
  NotificationSummary,
  PinFilter,
  BalanceFilter,
  CurrencyFilter,
} from "../../types/wallet";

import {
  getWallets,
  getWalletSummary,
  getSavingSummary,
  getGoalSummary,
  getNotificationSummary,
} from "../../services/walletService";

import { WalletSummaryCards } from "./components/WalletSummaryCards";
import { WalletSearch } from "./components/WalletSearch";
import { WalletFilter } from "./components/WalletFilter";
import { WalletTable } from "./components/WalletTable";
import { WalletDrawer } from "./components/WalletDrawer";
import { WalletPagination } from "./components/WalletPagination";

export default function WalletsPage() {
  // Data State
  const [wallets, setWallets] = useState<WalletInfo[]>([]);
  const [walletSummary, setWalletSummary] = useState<WalletSummary>({ usdBalance: 0, khrBalance: 0 });
  const [savingSummary, setSavingSummary] = useState<SavingSummary>({ savingUsd: 0, savingKhr: 0 });
  const [goalSummary, setGoalSummary] = useState<GoalSummary>({ goalUsd: 0, goalKhr: 0 });
  const [notificationSummary, setNotificationSummary] = useState<NotificationSummary>({
    unreadCount: 12,
    latestNotificationTime: "Jul 23, 2026 11:30 AM",
  });

  // UI Status State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState("");
  const [pinFilter, setPinFilter] = useState<PinFilter>("ALL");
  const [balanceFilter, setBalanceFilter] = useState<BalanceFilter>("ALL");
  const [currencyFilter, setCurrencyFilter] = useState<CurrencyFilter>("BOTH");

  // Drawer State
  const [selectedWallet, setSelectedWallet] = useState<WalletInfo | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Show Toast Helper
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Main Data Load Function
  const loadData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    setError(null);

    try {
      const data = await getWallets();
      setWallets(data);

      const wSum = await getWalletSummary(data);
      setWalletSummary(wSum);

      const sSum = await getSavingSummary(data);
      setSavingSummary(sSum);

      const gSum = await getGoalSummary(data);
      setGoalSummary(gSum);
    } catch (err) {
      console.error("Wallet load error:", err);
      setError("Unable to load wallet data.");
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, []);

  // Notifications Load Function
  const loadNotifications = useCallback(async () => {
    try {
      const notifSum = await getNotificationSummary();
      setNotificationSummary(notifSum);
    } catch (err) {
      console.error("Notification load error:", err);
    }
  }, []);

  // Initial Load
  useEffect(() => {
    void loadData(false);
    void loadNotifications();
  }, [loadData, loadNotifications]);

  // Auto Refresh Intervals (30s for wallets, 10s for notifications)
  useEffect(() => {
    const walletInterval = setInterval(() => {
      void loadData(true);
    }, 30000);

    const notifInterval = setInterval(() => {
      void loadNotifications();
    }, 10000);

    return () => {
      clearInterval(walletInterval);
      clearInterval(notifInterval);
    };
  }, [loadData, loadNotifications]);

  // Filter & Search Logic
  const filteredWallets = useMemo(() => {
    return wallets.filter((w) => {
      // 1. Search Query
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase().trim();
        const matchId = String(w.walletId || "").toLowerCase().includes(query);
        const matchNum = String(w.walletNumber || "").toLowerCase().includes(query);
        const matchName = String(w.fullName || "").toLowerCase().includes(query);
        const matchPhone = String(w.phoneNumber || "").toLowerCase().includes(query);
        if (!matchId && !matchNum && !matchName && !matchPhone) {
          return false;
        }
      }

      // 2. PIN Status Filter
      if (pinFilter === "SET" && !w.hasPin) return false;
      if (pinFilter === "NOT_SET" && w.hasPin) return false;

      // 3. Balance Filter
      const totalUsd = Number(w.usdBalance) || 0;
      const totalKhr = Number(w.khrBalance) || 0;
      if (balanceFilter === "POSITIVE" && totalUsd <= 0 && totalKhr <= 0) return false;
      if (balanceFilter === "ZERO" && (totalUsd > 0 || totalKhr > 0)) return false;

      // 4. Currency Filter
      if (currencyFilter === "USD" && totalUsd <= 0) return false;
      if (currencyFilter === "KHR" && totalKhr <= 0) return false;

      return true;
    });
  }, [wallets, searchTerm, pinFilter, balanceFilter, currencyFilter]);

  // Pagination Math
  const totalRecords = filteredWallets.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));

  // Reset to Page 1 when filters or search change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, pinFilter, balanceFilter, currencyFilter, pageSize]);

  // Slice Current Page Data
  const paginatedWallets = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredWallets.slice(start, start + pageSize);
  }, [filteredWallets, currentPage, pageSize]);

  // Drawer Handler
  const handleSelectWallet = (wallet: WalletInfo) => {
    setSelectedWallet(wallet);
    setIsDrawerOpen(true);
  };

  // Reset Filters
  const handleResetFilters = () => {
    setSearchTerm("");
    setPinFilter("ALL");
    setBalanceFilter("ALL");
    setCurrencyFilter("BOTH");
  };

  // Manual Refresh Button Handler
  const handleManualRefresh = () => {
    void loadData(false);
    void loadNotifications();
    showToast("Wallet data updated successfully.");
  };

  return (
    <div className="min-w-0 flex-1 space-y-6 pb-12">
      {/* Toast Alert Popup */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-xs font-bold text-white shadow-2xl transition-all animate-bounce">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          {toastMessage}
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col gap-4 rounded-[28px] border border-slate-200/80 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-slate-400">
            Wallet Administration
          </p>
          <h1 className="mt-1 font-['Manrope',sans-serif] text-2xl font-extrabold text-slate-900">
            Wallet Management
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleManualRefresh}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-sm transition-all hover:bg-slate-50 hover:border-slate-300"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-indigo-600" : ""}`} />
            Refresh Data
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <WalletSummaryCards
        walletSummary={walletSummary}
        savingSummary={savingSummary}
        goalSummary={goalSummary}
        notificationSummary={notificationSummary}
        loading={loading}
      />

      {/* Main Table Container */}
      <div className="rounded-[28px] border border-slate-200/80 bg-white shadow-sm overflow-hidden">
        {/* Search & Filter Bar */}
        <div className="flex flex-col gap-4 p-6 border-b border-slate-100 lg:flex-row lg:items-center lg:justify-between">
          <WalletSearch searchTerm={searchTerm} onSearchChange={setSearchTerm} />
          <WalletFilter
            pinFilter={pinFilter}
            onPinFilterChange={setPinFilter}
            balanceFilter={balanceFilter}
            onBalanceFilterChange={setBalanceFilter}
            currencyFilter={currencyFilter}
            onCurrencyFilterChange={setCurrencyFilter}
            onResetFilters={handleResetFilters}
          />
        </div>

        {/* Error State Display */}
        {error ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-500">
              <AlertTriangle className="h-7 w-7" />
            </div>
            <h3 className="mt-4 font-['Manrope',sans-serif] text-base font-bold text-slate-900">
              Unable to load wallet data.
            </h3>
            <p className="mt-1 text-xs text-slate-500 max-w-sm">
              Failed to connect to the Spring Boot REST API. Please check your backend connection.
            </p>
            <button
              type="button"
              onClick={handleManualRefresh}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-700"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Retry Connection
            </button>
          </div>
        ) : (
          /* Table */
          <WalletTable
            wallets={paginatedWallets}
            loading={loading}
            onSelectWallet={handleSelectWallet}
            onResetFilters={handleResetFilters}
          />
        )}

        {/* Pagination */}
        {!error && !loading && totalRecords > 0 && (
          <WalletPagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalRecords={totalRecords}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
          />
        )}
      </div>

      {/* Right Slide-over Detail Drawer */}
      <WalletDrawer
        wallet={selectedWallet}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />
    </div>
  );
}
