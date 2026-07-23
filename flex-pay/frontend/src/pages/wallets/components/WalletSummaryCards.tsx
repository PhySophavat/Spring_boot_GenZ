import React from "react";
import { Wallet, PiggyBank, Bell } from "lucide-react";
import type { WalletSummary, SavingSummary, NotificationSummary } from "../../../types/wallet";
import { formatUsd, formatKhr } from "../../../services/walletService";

interface MainWalletCardProps {
  summary: WalletSummary;
  loading?: boolean;
}

export function MainWalletCard({ summary, loading }: MainWalletCardProps) {
  return (
    <div className="relative overflow-hidden rounded-[24px] border border-slate-200/80 bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 p-6 text-white shadow-xl shadow-indigo-950/10 transition-all hover:shadow-2xl">
      {/* Decorative gradient blur background */}
      <div className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-purple-500/20 blur-2xl pointer-events-none" />
      <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-indigo-500/20 blur-2xl pointer-events-none" />

      <div className="relative flex items-center justify-between">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-purple-200/70">
            Total Balance
          </span>
          <h3 className="mt-1 font-['Manrope',sans-serif] text-xl font-extrabold text-white">
            Main Wallet
          </h3>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-purple-200">
          <Wallet className="h-6 w-6" />
        </div>
      </div>

      <div className="relative mt-6 grid grid-cols-2 gap-4 rounded-2xl bg-white/10 p-4 backdrop-blur-md border border-white/10">
        <div>
          <p className="text-xs font-medium text-purple-200/80">USD Balance</p>
          <p className="mt-1 font-['Manrope',sans-serif] text-xl font-bold tracking-tight text-white">
            {loading ? "..." : formatUsd(summary.usdBalance)}
          </p>
        </div>
        <div className="border-l border-white/10 pl-4">
          <p className="text-xs font-medium text-purple-200/80">KHR Balance</p>
          <p className="mt-1 font-['Manrope',sans-serif] text-xl font-bold tracking-tight text-emerald-300">
            {loading ? "..." : formatKhr(summary.khrBalance)}
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
  return (
    <div className="relative overflow-hidden rounded-[24px] border border-amber-200/60 bg-gradient-to-br from-amber-700 via-amber-800 to-amber-950 p-6 text-white shadow-xl shadow-amber-950/10 transition-all hover:shadow-2xl">
      <div className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-amber-400/20 blur-2xl pointer-events-none" />

      <div className="relative flex items-center justify-between">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-200/70">
            Savings Reserve
          </span>
          <h3 className="mt-1 font-['Manrope',sans-serif] text-xl font-extrabold text-white">
            Saving Wallet
          </h3>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-amber-200">
          <PiggyBank className="h-6 w-6" />
        </div>
      </div>

      <div className="relative mt-6 grid grid-cols-2 gap-4 rounded-2xl bg-white/10 p-4 backdrop-blur-md border border-white/10">
        <div>
          <p className="text-xs font-medium text-amber-200/80">Saving USD</p>
          <p className="mt-1 font-['Manrope',sans-serif] text-xl font-bold tracking-tight text-white">
            {loading ? "..." : formatUsd(summary.savingUsd)}
          </p>
        </div>
        <div className="border-l border-white/10 pl-4">
          <p className="text-xs font-medium text-amber-200/80">Saving KHR</p>
          <p className="mt-1 font-['Manrope',sans-serif] text-xl font-bold tracking-tight text-amber-200">
            {loading ? "..." : formatKhr(summary.savingKhr)}
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
  return (
    <div className="relative overflow-hidden rounded-[24px] border border-slate-200/80 bg-white p-6 shadow-xl shadow-slate-200/50 transition-all hover:shadow-2xl">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">
            System Alerts
          </span>
          <h3 className="mt-1 font-['Manrope',sans-serif] text-xl font-extrabold text-slate-900">
            Notifications
          </h3>
        </div>
        <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100">
          <Bell className="h-6 w-6" />
          {summary.unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white ring-2 ring-white animate-pulse" />
          )}
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-2 rounded-2xl bg-slate-50 p-4 border border-slate-100">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500">Unread Activity</span>
          <span className="inline-flex items-center rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-extrabold text-rose-700">
            {loading ? "..." : `${summary.unreadCount} Unread`}
          </span>
        </div>
        <div className="mt-1 flex items-center justify-between text-xs text-slate-400">
          <span>Latest Sync</span>
          <span className="font-medium text-slate-600">
            {loading ? "..." : summary.latestNotificationTime}
          </span>
        </div>
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
