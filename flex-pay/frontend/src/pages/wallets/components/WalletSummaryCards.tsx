import React, { useState } from "react";
import { Wallet, PiggyBank, Bell, Loader2, Activity } from "lucide-react";
import type { WalletSummary, SavingSummary, NotificationSummary } from "../../../types/wallet";
import { formatUsd, formatKhr } from "../../../services/walletService";

interface MainWalletCardProps {
  summary: WalletSummary;
  loading?: boolean;
}

export function MainWalletCard({ summary, loading }: MainWalletCardProps) {
  const [isSimulating, setIsSimulating] = useState(false);

  const handleClick = () => {
    if (isSimulating) return;
    setIsSimulating(true);
    setTimeout(() => setIsSimulating(false), 1500);
  };

  const showLoading = loading || isSimulating;

  return (
    <div 
      onClick={handleClick}
      className="group relative overflow-hidden rounded-[24px] border border-slate-200/80 bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 p-6 text-white shadow-xl shadow-indigo-950/10 transition-all hover:shadow-2xl hover:-translate-y-1 cursor-pointer"
    >
      {/* Decorative gradient blur background */}
      <div className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-purple-500/20 blur-2xl pointer-events-none transition-transform group-hover:scale-125" />
      <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-indigo-500/20 blur-2xl pointer-events-none transition-transform group-hover:scale-125" />

      {/* Loading Overlay */}
      {showLoading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-indigo-900/40 backdrop-blur-sm">
          <Loader2 className="h-8 w-8 animate-spin text-purple-200" />
        </div>
      )}

      <div className="relative flex items-center justify-between z-0">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-purple-200/70">
            Total Balance
          </span>
          <h3 className="mt-1 font-['Manrope',sans-serif] text-xl font-extrabold text-white">
            Main Wallet
          </h3>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-purple-200 group-hover:bg-white/20 transition-colors">
          <Wallet className="h-6 w-6" />
        </div>
      </div>

      <div className="relative mt-6 grid grid-cols-2 gap-4 rounded-2xl bg-white/10 p-4 backdrop-blur-md border border-white/10 z-0">
        <div>
          <p className="text-xs font-medium text-purple-200/80">USD Balance</p>
          <p className="mt-1 font-['Manrope',sans-serif] text-xl font-bold tracking-tight text-white">
            {showLoading ? "..." : formatUsd(summary.usdBalance)}
          </p>
        </div>
        <div className="border-l border-white/10 pl-4">
          <p className="text-xs font-medium text-purple-200/80">KHR Balance</p>
          <p className="mt-1 font-['Manrope',sans-serif] text-xl font-bold tracking-tight text-emerald-300">
            {showLoading ? "..." : formatKhr(summary.khrBalance)}
          </p>
        </div>
      </div>
    </div>
  );
}

interface SavingWalletCardProps {
  summary: SavingSummary;
  loading?: boolean;
}

export function SavingWalletCard({ summary, loading }: SavingWalletCardProps) {
  const [isSimulating, setIsSimulating] = useState(false);

  const handleClick = () => {
    if (isSimulating) return;
    setIsSimulating(true);
    setTimeout(() => setIsSimulating(false), 1500);
  };

  const showLoading = loading || isSimulating;

  return (
    <div 
      onClick={handleClick}
      className="group relative overflow-hidden rounded-[24px] border border-amber-200/60 bg-gradient-to-br from-amber-700 via-amber-800 to-amber-950 p-6 text-white shadow-xl shadow-amber-950/10 transition-all hover:shadow-2xl hover:-translate-y-1 cursor-pointer"
    >
      <div className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-amber-400/20 blur-2xl pointer-events-none transition-transform group-hover:scale-125" />

      {/* Loading Overlay */}
      {showLoading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-amber-900/40 backdrop-blur-sm">
          <Loader2 className="h-8 w-8 animate-spin text-amber-200" />
        </div>
      )}

      <div className="relative flex items-center justify-between z-0">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-200/70">
            Savings Reserve
          </span>
          <h3 className="mt-1 font-['Manrope',sans-serif] text-xl font-extrabold text-white">
            Saving Wallet
          </h3>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-amber-200 group-hover:bg-white/20 transition-colors">
          <PiggyBank className="h-6 w-6" />
        </div>
      </div>

      <div className="relative mt-6 grid grid-cols-2 gap-4 rounded-2xl bg-white/10 p-4 backdrop-blur-md border border-white/10 z-0">
        <div>
          <p className="text-xs font-medium text-amber-200/80">Saving USD</p>
          <p className="mt-1 font-['Manrope',sans-serif] text-xl font-bold tracking-tight text-white">
            {showLoading ? "..." : formatUsd(summary.savingUsd)}
          </p>
        </div>
        <div className="border-l border-white/10 pl-4">
          <p className="text-xs font-medium text-amber-200/80">Saving KHR</p>
          <p className="mt-1 font-['Manrope',sans-serif] text-xl font-bold tracking-tight text-amber-200">
            {showLoading ? "..." : formatKhr(summary.savingKhr)}
          </p>
        </div>
      </div>
    </div>
  );
}

interface NotificationCardProps {
  summary: NotificationSummary;
  loading?: boolean;
}

export function NotificationCard({ summary, loading }: NotificationCardProps) {
  const [activeAlerts, setActiveAlerts] = useState<{id: number, text: string}[]>([]);
  const [alertCount, setAlertCount] = useState(0);

  const simulateTransfer = () => {
    const newAlert = {
      id: Date.now(),
      text: `Incoming Transfer: +$${(Math.random() * 500 + 10).toFixed(2)}`
    };
    setActiveAlerts(prev => [newAlert, ...prev].slice(0, 3));
    setAlertCount(prev => prev + 1);
    
    // Auto-remove alert after 3s
    setTimeout(() => {
      setActiveAlerts(prev => prev.filter(a => a.id !== newAlert.id));
    }, 3000);
  };

  return (
    <div 
      onClick={simulateTransfer}
      className="group relative overflow-hidden rounded-[24px] border border-slate-200/80 bg-white p-6 shadow-xl shadow-slate-200/50 transition-all hover:shadow-2xl hover:-translate-y-1 cursor-pointer"
    >
      <div className="flex items-center justify-between relative z-10">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">
            System Alerts
          </span>
          <h3 className="mt-1 font-['Manrope',sans-serif] text-xl font-extrabold text-slate-900 flex items-center gap-2">
            Notifications
            <Activity className="h-4 w-4 text-emerald-500 animate-pulse" />
          </h3>
        </div>
        <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 group-hover:bg-indigo-100 transition-colors">
          <Bell className={`h-6 w-6 ${activeAlerts.length > 0 ? 'animate-bounce text-rose-500' : ''}`} />
          {(summary.unreadCount + alertCount) > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white ring-2 ring-white animate-pulse" />
          )}
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-2 rounded-2xl bg-slate-50 p-4 border border-slate-100 relative z-10">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500">Unread Activity</span>
          <span className="inline-flex items-center rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-extrabold text-rose-700">
            {loading ? "..." : `${summary.unreadCount + alertCount} Unread`}
          </span>
        </div>
        <div className="mt-1 flex items-center justify-between text-xs text-slate-400">
          <span>Latest Sync</span>
          <span className="font-medium text-slate-600">
            {loading ? "..." : summary.latestNotificationTime}
          </span>
        </div>
      </div>

      {/* Real-time floating alerts */}
      <div className="absolute inset-x-4 bottom-4 flex flex-col gap-2 z-20 pointer-events-none">
        {activeAlerts.map(alert => (
          <div key={alert.id} className="animate-in slide-in-from-bottom-2 fade-in duration-300 rounded-lg bg-emerald-500 px-3 py-2 text-xs font-bold text-white shadow-lg flex items-center justify-between">
            {alert.text}
            <span className="text-emerald-100 text-[10px]">Just now</span>
          </div>
        ))}
      </div>
    </div>
  );
}

interface WalletSummaryCardsProps {
  walletSummary: WalletSummary;
  savingSummary: SavingSummary;
  notificationSummary: NotificationSummary;
  loading?: boolean;
}

export function WalletSummaryCards({
  walletSummary,
  savingSummary,
  notificationSummary,
  loading,
}: WalletSummaryCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
      <MainWalletCard summary={walletSummary} loading={loading} />
      <SavingWalletCard summary={savingSummary} loading={loading} />
      <NotificationCard summary={notificationSummary} loading={loading} />
    </div>
  );
}
