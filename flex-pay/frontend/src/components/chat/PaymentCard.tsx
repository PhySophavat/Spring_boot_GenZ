import React from "react";
import { Check, CheckCheck, ArrowUpRight, ArrowDownLeft, Sparkles } from "lucide-react";
import type { MessageData, PaymentInfo } from "../../services/chatApi";

interface Props {
  message: MessageData;
  isMine: boolean;
}

function formatTime(iso?: string): string {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

function parsePaymentData(message: MessageData): PaymentInfo {
  if (message.paymentInfo) {
    return message.paymentInfo;
  }
  if (message.content) {
    try {
      const parsed = JSON.parse(message.content);
      return {
        paymentId: parsed.paymentId,
        amount: Number(parsed.amount),
        status: parsed.status || "COMPLETED",
        message: parsed.message || "",
        senderId: parsed.senderId,
        senderName: parsed.senderName,
        receiverId: parsed.receiverId,
        receiverName: parsed.receiverName,
        transactionReference: parsed.transactionReference,
        completedAt: parsed.completedAt,
      };
    } catch {
      // Ignore JSON parse error and fallback
    }
  }
  return {
    amount: 0,
    status: "COMPLETED",
    message: "",
  };
}

export default function PaymentCard({ message, isMine }: Props) {
  const payment = parsePaymentData(message);
  const amountFormatted = (Number(payment.amount) || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const timeDisplay = formatTime(payment.completedAt || message.createdAt);
  const senderName = payment.senderName || message.sender.fullName || "Sender";

  if (isMine) {
    // ── SENDER VIEW: Payment Sent ──────────────────────────────────
    return (
      <div className="w-72 sm:w-80 rounded-2xl p-4 bg-gradient-to-br from-violet-600 via-indigo-600 to-violet-700 text-white shadow-lg border border-violet-400/30 overflow-hidden relative">
        {/* Subtle background glow */}
        <div className="absolute -right-8 -top-8 w-28 h-28 bg-white/10 rounded-full blur-2xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-base shadow-sm">
              💸
            </div>
            <div>
              <h4 className="text-sm font-bold tracking-tight">Payment Sent</h4>
              <p className="text-[11px] text-violet-200">Instant Wallet Transfer</p>
            </div>
          </div>
          <span className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
            <Check size={12} className="stroke-[3]" />
            Completed
          </span>
        </div>

        {/* Amount */}
        <div className="my-3 py-2 px-3 rounded-xl bg-black/15 backdrop-blur-sm border border-white/10 flex items-baseline justify-between">
          <span className="text-xs text-violet-200 uppercase tracking-wider font-semibold">Amount</span>
          <div className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            ${amountFormatted}
          </div>
        </div>

        {/* Note / Message */}
        {payment.message && (
          <div className="mb-3 px-3 py-2 rounded-lg bg-white/10 text-xs text-violet-100 italic break-words flex items-start gap-1.5">
            <span className="not-italic">💬</span>
            <span>"{payment.message}"</span>
          </div>
        )}

        {/* Footer */}
        <div className="pt-2 border-t border-white/15 flex items-center justify-between text-[11px] text-violet-200">
          <div className="flex items-center gap-1">
            <CheckCheck size={13} className="text-emerald-300" />
            <span>Direct to Wallet</span>
          </div>
          <span>{timeDisplay}</span>
        </div>
      </div>
    );
  }

  // ── RECEIVER VIEW: Payment Received ──────────────────────────────
  return (
    <div className="w-72 sm:w-80 rounded-2xl p-4 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-md border-2 border-emerald-500/30 dark:border-emerald-500/40 overflow-hidden relative">
      {/* Subtle top accent bar */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 to-teal-400" />

      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-3 mt-0.5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-base shadow-inner">
            💰
          </div>
          <div>
            <h4 className="text-sm font-bold tracking-tight text-gray-900 dark:text-white">Payment Received</h4>
            <p className="text-[11px] text-gray-500 dark:text-gray-400">Available in Main Wallet</p>
          </div>
        </div>
        <span className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
          <Check size={12} className="stroke-[3]" />
          Received
        </span>
      </div>

      {/* Amount + From */}
      <div className="my-3 py-2.5 px-3 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50">
        <div className="flex items-baseline justify-between mb-1">
          <span className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
            Credited
          </span>
          <div className="text-2xl sm:text-3xl font-black tracking-tight text-emerald-600 dark:text-emerald-400">
            ${amountFormatted}
          </div>
        </div>
        <div className="text-xs text-gray-600 dark:text-gray-300 flex items-center gap-1">
          <span className="text-gray-400">From:</span>
          <span className="font-semibold text-gray-800 dark:text-gray-200">{senderName}</span>
        </div>
      </div>

      {/* Note / Message */}
      {payment.message && (
        <div className="mb-3 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-700/50 text-xs text-gray-700 dark:text-gray-300 italic break-words flex items-start gap-1.5 border border-gray-100 dark:border-gray-700">
          <span className="not-italic">💬</span>
          <span>"{payment.message}"</span>
        </div>
      )}

      {/* Footer (Strictly NO accept/reject buttons) */}
      <div className="pt-2 border-t border-gray-100 dark:border-gray-700/70 flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400">
        <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
          <Sparkles size={12} />
          <span>Instant deposit</span>
        </div>
        <span>{timeDisplay}</span>
      </div>
    </div>
  );
}
