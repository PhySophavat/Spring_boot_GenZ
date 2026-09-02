import React, { useState } from "react";
import { X, DollarSign, Wallet, ArrowRight, AlertCircle, CheckCircle2 } from "lucide-react";
import type { MemberInfo } from "../../services/chatApi";
import ConfirmPaymentModal from "./ConfirmPaymentModal";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  receiver: MemberInfo | null;
  mainWalletBalance: number;
  onExecutePayment: (payload: {
    receiverId: number;
    amount: number;
    message?: string;
  }) => Promise<void>;
}

const QUICK_AMOUNTS = [5, 10, 25, 50, 100];

export default function PaymentModal({
  isOpen,
  onClose,
  receiver,
  mainWalletBalance,
  onExecutePayment,
}: Props) {
  const [amountInput, setAmountInput] = useState("25.00");
  const [message, setMessage] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen || !receiver) return null;

  const parsedAmount = parseFloat(amountInput) || 0;
  const isAmountValid = parsedAmount > 0;
  const hasSufficientBalance = parsedAmount <= mainWalletBalance;
  const canProceed = isAmountValid && hasSufficientBalance;

  const initials = (receiver.fullName ?? "?")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const handleQuickAmount = (val: number) => {
    setAmountInput(val.toFixed(2));
    setError(null);
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    // Allow numbers and single decimal point up to 2 decimal places
    if (val === "" || /^\d*\.?\d{0,2}$/.test(val)) {
      setAmountInput(val);
      setError(null);
    }
  };

  const handleOpenConfirm = () => {
    if (!isAmountValid) {
      setError("Please enter a valid amount greater than $0");
      return;
    }
    if (!hasSufficientBalance) {
      setError("Insufficient Balance: Your Main Wallet does not have enough money for this payment.");
      return;
    }
    setError(null);
    setShowConfirm(true);
  };

  const handleConfirmAndPay = async () => {
    setIsProcessing(true);
    setError(null);
    try {
      await onExecutePayment({
        receiverId: receiver.id,
        amount: parsedAmount,
        message: message.trim() || undefined,
      });

      setSuccessMsg(`✓ Payment Completed: $${parsedAmount.toFixed(2)} sent successfully.`);
      setShowConfirm(false);

      // Close modal after brief success feedback
      setTimeout(() => {
        setSuccessMsg(null);
        setAmountInput("25.00");
        setMessage("");
        onClose();
      }, 1200);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Payment failed. Your money was not transferred. Please try again.";
      setError(msg);
      setShowConfirm(false);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
        <div
          className="w-full max-w-md bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden transform transition-all animate-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white flex items-center justify-center text-xl shadow-md shadow-violet-500/20">
                💸
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">Send Money</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">Instant Social Payment</p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isProcessing}
              className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            >
              <X size={18} />
            </button>
          </div>

          {/* Form */}
          <div className="p-6 space-y-5">
            {/* Receiver Card */}
            <div className="rounded-2xl p-3.5 bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700/60 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  {receiver.profileImage ? (
                    <img
                      src={receiver.profileImage}
                      alt={receiver.fullName}
                      className="w-10 h-10 rounded-full object-cover ring-2 ring-violet-400"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold ring-2 ring-violet-400/50">
                      {initials}
                    </div>
                  )}
                  <span
                    className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full ring-2 ring-white dark:ring-gray-900 ${
                      receiver.onlineStatus === "ONLINE" ? "bg-emerald-400" : "bg-gray-400"
                    }`}
                  />
                </div>
                <div>
                  <span className="text-[11px] uppercase tracking-wider font-semibold text-gray-400">To</span>
                  <p className="text-sm font-bold text-gray-900 dark:text-white leading-tight">
                    {receiver.fullName}
                  </p>
                </div>
              </div>
              <span className="text-xs font-medium text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/30 px-2.5 py-1 rounded-full">
                Chat Contact
              </span>
            </div>

            {/* Amount Input */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider mb-2">
                Amount (USD)
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-4 text-2xl font-black text-gray-400 dark:text-gray-500 pointer-events-none">
                  $
                </span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={amountInput}
                  onChange={handleAmountChange}
                  placeholder="0.00"
                  autoFocus
                  className="w-full pl-10 pr-4 py-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 text-2xl font-black text-gray-900 dark:text-white placeholder-gray-300 dark:placeholder-gray-600 outline-none focus:border-violet-500 dark:focus:border-violet-400 transition"
                />
              </div>

              {/* Quick Amount Chips */}
              <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                {QUICK_AMOUNTS.map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => handleQuickAmount(val)}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-xl border transition ${
                      parsedAmount === val
                        ? "bg-violet-600 text-white border-violet-600 shadow-sm"
                        : "bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700"
                    }`}
                  >
                    ${val}
                  </button>
                ))}
              </div>
            </div>

            {/* Optional Note / Message */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider mb-2">
                Message (Optional)
              </label>
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="e.g. Lunch today 🍜"
                maxLength={200}
                className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:border-violet-500 transition"
              />
            </div>

            {/* Wallet Source & Balance */}
            <div className="p-3.5 rounded-2xl bg-violet-50/60 dark:bg-violet-950/20 border border-violet-100 dark:border-violet-900/40 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-violet-100 dark:bg-violet-900/50 text-violet-600 dark:text-violet-400 flex items-center justify-center">
                  <Wallet size={16} />
                </div>
                <div>
                  <span className="text-[11px] text-gray-500 dark:text-gray-400 block font-medium">From</span>
                  <span className="text-xs font-bold text-gray-900 dark:text-white">Main Wallet</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-gray-500 dark:text-gray-400 block font-medium">Available Balance</span>
                <span className={`text-xs font-black ${hasSufficientBalance ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"}`}>
                  ${mainWalletBalance.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Validation / Error Feedback */}
            {!hasSufficientBalance && (
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-start gap-2 text-xs text-amber-700 dark:text-amber-300">
                <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
                <span>Insufficient Balance: Amount exceeds your available Main Wallet balance (${mainWalletBalance.toFixed(2)}).</span>
              </div>
            )}

            {error && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 flex items-start gap-2 text-xs text-red-600 dark:text-red-400">
                <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-start gap-2 text-xs text-emerald-700 dark:text-emerald-300 font-medium">
                <CheckCircle2 size={15} className="flex-shrink-0 mt-0.5" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Send Button */}
            <button
              type="button"
              onClick={handleOpenConfirm}
              disabled={!canProceed || isProcessing}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-bold text-sm shadow-lg shadow-violet-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span>Send ${parsedAmount > 0 ? parsedAmount.toFixed(2) : "0.00"}</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Step */}
      <ConfirmPaymentModal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleConfirmAndPay}
        isProcessing={isProcessing}
        receiverName={receiver.fullName}
        amount={parsedAmount}
        currentBalance={mainWalletBalance}
        error={error}
      />
    </>
  );
}
