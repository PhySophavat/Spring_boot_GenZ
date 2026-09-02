import React from "react";
import { X, ArrowRight, ShieldCheck, Loader2, AlertCircle } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isProcessing: boolean;
  receiverName: string;
  amount: number;
  currentBalance: number;
  error?: string | null;
}

export default function ConfirmPaymentModal({
  isOpen,
  onClose,
  onConfirm,
  isProcessing,
  receiverName,
  amount,
  currentBalance,
  error,
}: Props) {
  if (!isOpen) return null;

  const remainingBalance = Math.max(0, currentBalance - amount);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden transform transition-all animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400 flex items-center justify-center font-bold">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">Confirm Payment</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">Instant database transaction</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition disabled:opacity-40"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Main prompt */}
          <div className="text-center py-2">
            <p className="text-sm text-gray-500 dark:text-gray-400">You are sending</p>
            <div className="text-3xl font-black text-gray-900 dark:text-white mt-1">
              ${amount.toFixed(2)}
            </div>
            <p className="text-sm font-semibold text-violet-600 dark:text-violet-400 mt-1">
              to {receiverName}
            </p>
          </div>

          {/* Breakdown Card */}
          <div className="rounded-2xl p-4 bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700/60 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500 dark:text-gray-400">From</span>
              <span className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
                <span>💰</span> Main Wallet
              </span>
            </div>

            <div className="h-px bg-gray-200 dark:bg-gray-700/60" />

            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500 dark:text-gray-400">Current Balance</span>
              <span className="font-medium text-gray-700 dark:text-gray-300">
                ${currentBalance.toFixed(2)}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500 dark:text-gray-400">After Payment</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                ${remainingBalance.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Error Message if any */}
          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 flex items-start gap-2.5 text-xs text-red-600 dark:text-red-400">
              <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="flex-1 py-3 px-4 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isProcessing}
              className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white text-sm font-bold shadow-lg shadow-violet-500/25 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <span>Confirm Payment</span>
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
