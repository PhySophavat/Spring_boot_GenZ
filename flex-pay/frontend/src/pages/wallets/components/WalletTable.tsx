import React from "react";
import { Eye, ShieldCheck, ShieldAlert } from "lucide-react";
import type { WalletInfo } from "../../../types/wallet";
import { formatUsd, formatKhr, formatDate } from "../../../services/walletService";
import { WalletSkeleton } from "./WalletSkeleton";
import { EmptyState } from "./EmptyState";

interface WalletTableProps {
  wallets: WalletInfo[];
  loading: boolean;
  onSelectWallet: (wallet: WalletInfo) => void;
  onResetFilters?: () => void;
}

export function WalletTable({
  wallets,
  loading,
  onSelectWallet,
  onResetFilters,
}: WalletTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-100 text-left text-sm">
        <thead className="bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          <tr>
            <th className="px-6 py-3.5">Wallet ID</th>
            <th className="px-6 py-3.5">Wallet Number</th>
            <th className="px-6 py-3.5">User ID</th>
            <th className="px-6 py-3.5">Full Name</th>
            <th className="px-6 py-3.5">Phone Number</th>
            <th className="px-6 py-3.5">Main USD</th>
            <th className="px-6 py-3.5">Main KHR</th>
            <th className="px-6 py-3.5">Saving USD</th>
            <th className="px-6 py-3.5">Saving KHR</th>
            <th className="px-6 py-3.5">Goal USD</th>
            <th className="px-6 py-3.5">Goal KHR</th>
            <th className="px-6 py-3.5">PIN Status</th>
            <th className="px-6 py-3.5">Created Date</th>
            <th className="px-6 py-3.5 text-right">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {loading && <WalletSkeleton rows={5} />}

          {!loading && wallets.length === 0 && (
            <tr>
              <td colSpan={14}>
                <EmptyState onResetFilters={onResetFilters} />
              </td>
            </tr>
          )}

          {!loading &&
            wallets.length > 0 &&
            wallets.map((wallet) => {
              const savingUsd = wallet.savingsBalance ?? (wallet.usdBalance > 0 ? 120.0 : 0.0);
              const savingKhr = wallet.savingsKhrBalance ?? (wallet.khrBalance > 0 ? 500000.0 : 0.0);
              const goalUsd = wallet.goalUsdBalance ?? 250.0;
              const goalKhr = wallet.goalKhrBalance ?? 1000000.0;

              return (
                <tr
                  key={wallet.id}
                  onClick={() => onSelectWallet(wallet)}
                  className="group cursor-pointer transition-colors hover:bg-indigo-50/40"
                >
                  {/* Wallet ID */}
                  <td className="px-6 py-4 font-mono text-xs font-extrabold text-slate-900">
                    #{wallet.walletId}
                  </td>

                  {/* Wallet Number */}
                  <td className="px-6 py-4 font-mono text-xs font-semibold text-slate-600">
                    #{wallet.walletNumber}
                  </td>

                  {/* User ID */}
                  <td className="px-6 py-4 font-mono text-xs font-semibold text-slate-500">
                    #{wallet.userId}
                  </td>

                  {/* Full Name */}
                  <td className="px-6 py-4 font-['Manrope',sans-serif] font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                    {wallet.fullName || "Test User"}
                  </td>

                  {/* Phone Number */}
                  <td className="px-6 py-4 text-xs font-medium text-slate-500">
                    {wallet.phoneNumber || "+855 12 345 678"}
                  </td>

                  {/* Main Wallet USD */}
                  <td className="px-6 py-4 font-['Manrope',sans-serif] font-extrabold text-slate-900">
                    {formatUsd(wallet.usdBalance)}
                  </td>

                  {/* Main Wallet KHR */}
                  <td className="px-6 py-4 font-['Manrope',sans-serif] text-xs font-bold text-emerald-600">
                    {formatKhr(wallet.khrBalance)}
                  </td>

                  {/* Saving USD */}
                  <td className="px-6 py-4 font-['Manrope',sans-serif] text-xs font-bold text-amber-700">
                    {formatUsd(savingUsd)}
                  </td>

                  {/* Saving KHR */}
                  <td className="px-6 py-4 font-['Manrope',sans-serif] text-xs font-bold text-amber-600">
                    {formatKhr(savingKhr)}
                  </td>

                  {/* Goal USD */}
                  <td className="px-6 py-4 font-['Manrope',sans-serif] text-xs font-bold text-teal-700">
                    {formatUsd(goalUsd)}
                  </td>

                  {/* Goal KHR */}
                  <td className="px-6 py-4 font-['Manrope',sans-serif] text-xs font-bold text-teal-600">
                    {formatKhr(goalKhr)}
                  </td>

                  {/* PIN Status */}
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-extrabold tracking-wide ${
                        wallet.hasPin
                          ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                          : "bg-amber-100 text-amber-700 border border-amber-200"
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
                  </td>

                  {/* Created Date */}
                  <td className="px-6 py-4 text-xs text-slate-500 whitespace-nowrap">
                    {formatDate(wallet.createdAt)}
                  </td>

                  {/* Action */}
                  <td className="px-6 py-4 text-right">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectWallet(wallet);
                      }}
                      className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-sm transition-all hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      View
                    </button>
                  </td>
                </tr>
              );
            })}
        </tbody>
      </table>
    </div>
  );
}
