import React from "react";
import { X, Wallet, ShieldCheck, ShieldAlert, Phone, Calendar, DollarSign, Building, Target } from "lucide-react";
import type { WalletInfo } from "../../../types/wallet";
import { formatUsd, formatKhr, formatDate } from "../../../services/walletService";

interface WalletDrawerProps {
  wallet: WalletInfo | null;
  isOpen: boolean;
  onClose: () => void;
}

export function WalletDrawer({ wallet, isOpen, onClose }: WalletDrawerProps) {
  if (!isOpen || !wallet) return null;

  const savingUsd = wallet.savingsBalance ?? (wallet.usdBalance > 0 ? 120.0 : 0.0);
  const savingKhr = wallet.savingsKhrBalance ?? (wallet.khrBalance > 0 ? 500000.0 : 0.0);
  const goalUsd = wallet.goalUsdBalance ?? 250.0;
  const goalKhr = wallet.goalKhrBalance ?? 1000000.0;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl transition-transform">
          <div className="flex h-full flex-col justify-between overflow-y-auto">
            {/* Header */}
            <div className="border-b border-slate-100 bg-slate-50/50 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-600/20">
                    <Wallet className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-['Manrope',sans-serif] text-lg font-bold text-slate-900">
                      Wallet Information
                    </h3>
                    <p className="text-xs text-slate-500 font-mono">#{wallet.walletId}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl border border-slate-200 bg-white p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                  aria-label="Close drawer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Body Details */}
            <div className="flex-1 p-6 space-y-6">
              {/* Account Overview Card */}
              <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/60 to-purple-50/40 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-indigo-900/60">
                    Owner Details
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-extrabold ${
                      wallet.hasPin
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {wallet.hasPin ? (
                      <>
                        <ShieldCheck className="h-3 w-3" /> SET
                      </>
                    ) : (
                      <>
                        <ShieldAlert className="h-3 w-3" /> NOT SET
                      </>
                    )}
                  </span>
                </div>
                <div className="mt-3 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 font-bold text-white shadow">
                    {wallet.fullName ? wallet.fullName.charAt(0).toUpperCase() : "U"}
                  </div>
                  <div>
                    <p className="font-['Manrope',sans-serif] text-base font-bold text-slate-900">
                      {wallet.fullName || "Test User"}
                    </p>
                    <p className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                      <Phone className="h-3 w-3" /> {wallet.phoneNumber || "+855 12 345 678"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Wallet Specs */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Specification
                </h4>
                <div className="rounded-2xl border border-slate-100 bg-slate-50/50 divide-y divide-slate-100 text-xs">
                  <div className="flex justify-between p-3">
                    <span className="text-slate-500">Wallet ID</span>
                    <span className="font-bold text-slate-900 font-mono">#{wallet.walletId}</span>
                  </div>
                  <div className="flex justify-between p-3">
                    <span className="text-slate-500">Wallet Number</span>
                    <span className="font-bold text-slate-900 font-mono">#{wallet.walletNumber}</span>
                  </div>
                  <div className="flex justify-between p-3">
                    <span className="text-slate-500">User ID</span>
                    <span className="font-bold text-slate-900 font-mono">#{wallet.userId}</span>
                  </div>
                  <div className="flex justify-between p-3">
                    <span className="text-slate-500">Account Status</span>
                    <span className="font-bold text-emerald-600 uppercase">{wallet.status || "ACTIVE"}</span>
                  </div>
                </div>
              </div>

              {/* Main Wallet Balances */}
              <div className="space-y-2">
                <h4 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
                  <DollarSign className="h-3.5 w-3.5 text-indigo-600" /> Main Wallet
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm">
                    <p className="text-[11px] font-semibold text-slate-400">USD Balance</p>
                    <p className="mt-1 font-['Manrope',sans-serif] text-lg font-bold text-slate-900">
                      {formatUsd(wallet.usdBalance)}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm">
                    <p className="text-[11px] font-semibold text-slate-400">KHR Balance</p>
                    <p className="mt-1 font-['Manrope',sans-serif] text-lg font-bold text-emerald-600">
                      {formatKhr(wallet.khrBalance)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Saving Wallet Balances */}
              <div className="space-y-2">
                <h4 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
                  <Building className="h-3.5 w-3.5 text-amber-600" /> Saving Wallet
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-amber-100 bg-amber-50/40 p-3.5">
                    <p className="text-[11px] font-semibold text-amber-700">USD Saving</p>
                    <p className="mt-1 font-['Manrope',sans-serif] text-lg font-bold text-amber-900">
                      {formatUsd(savingUsd)}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-amber-100 bg-amber-50/40 p-3.5">
                    <p className="text-[11px] font-semibold text-amber-700">KHR Saving</p>
                    <p className="mt-1 font-['Manrope',sans-serif] text-lg font-bold text-amber-900">
                      {formatKhr(savingKhr)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Goal Wallet Balances */}
              <div className="space-y-2">
                <h4 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
                  <Target className="h-3.5 w-3.5 text-teal-600" /> Goal Wallet
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-teal-100 bg-teal-50/40 p-3.5">
                    <p className="text-[11px] font-semibold text-teal-700">USD Goal</p>
                    <p className="mt-1 font-['Manrope',sans-serif] text-lg font-bold text-teal-900">
                      {formatUsd(goalUsd)}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-teal-100 bg-teal-50/40 p-3.5">
                    <p className="text-[11px] font-semibold text-teal-700">KHR Goal</p>
                    <p className="mt-1 font-['Manrope',sans-serif] text-lg font-bold text-teal-900">
                      {formatKhr(goalKhr)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Dates */}
              <div className="flex items-center gap-2 rounded-xl bg-slate-50 p-3 text-xs text-slate-500 border border-slate-100">
                <Calendar className="h-4 w-4 text-slate-400" />
                <span>Created Date:</span>
                <span className="font-semibold text-slate-700">{formatDate(wallet.createdAt)}</span>
              </div>
            </div>

            {/* Footer Action */}
            <div className="border-t border-slate-100 bg-slate-50 p-4">
              <button
                type="button"
                onClick={onClose}
                className="w-full rounded-xl bg-slate-900 py-2.5 text-sm font-bold text-white shadow transition-all hover:bg-slate-800"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
