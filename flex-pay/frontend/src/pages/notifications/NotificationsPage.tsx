import React, { useState } from "react";
import {
  ChevronLeft,
  Wallet,
  PartyPopper,
  Receipt,
  Send,
  Bell,
  CheckCheck,
} from "lucide-react";

interface NotificationItem {
  id: number;
  title: string;
  message: string;
  type: "in" | "out";
  category: "received" | "completed" | "request" | "sent" | "general";
  timestamp: string;
  actionText?: string;
  actionType?: "pay" | "view";
  isRead: boolean;
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 1,
    title: "Payment Received",
    message: "dev1 paid you $5.00 for Dinner with Friends",
    type: "in",
    category: "received",
    timestamp: "Aug 29, 2:01 PM",
    actionText: "View Split",
    actionType: "view",
    isRead: false,
  },
  {
    id: 2,
    title: "Split Completed",
    message: "All friends have paid their share for Dinner with Friends ($20.00)",
    type: "in",
    category: "completed",
    timestamp: "Aug 29, 2:01 PM",
    actionText: "View Split",
    actionType: "view",
    isRead: false,
  },
  {
    id: 3,
    title: "Payment Request",
    message: "SOPHAVAT PHY requested $6.67 from you for Dinner with Friends",
    type: "in",
    category: "request",
    timestamp: "Aug 29, 1:43 PM",
    actionText: "Pay Now",
    actionType: "pay",
    isRead: false,
  },
  {
    id: 4,
    title: "Payment Received",
    message: "You received $1.00 USD from dev1",
    type: "in",
    category: "received",
    timestamp: "Aug 28, 7:48 PM",
    isRead: true,
  },
  {
    id: 5,
    title: "Payment Sent Successfully",
    message: "You paid $1.00 USD from MAIN Wallet to SOPHAVAT PHY",
    type: "out",
    category: "sent",
    timestamp: "Aug 28, 4:43 PM",
    isRead: true,
  },
  {
    id: 6,
    title: "Payment Sent Successfully",
    message: "You paid $1.00 USD from MAIN Wallet to SOPHAVAT PHY",
    type: "out",
    category: "sent",
    timestamp: "Aug 28, 4:32 PM",
    isRead: true,
  },
];

export default function NotificationsPage() {
  const [filter, setFilter] = useState<"in" | "out">("in");
  const [notifications, setNotifications] = useState<NotificationItem[]>(
    INITIAL_NOTIFICATIONS
  );

  const filteredList = notifications.filter((n) => n.type === filter);

  function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  }

  function getIcon(category: NotificationItem["category"]) {
    switch (category) {
      case "received":
        return {
          icon: <Wallet className="w-5 h-5 text-emerald-600" />,
          bg: "bg-emerald-50 border border-emerald-100",
        };
      case "completed":
        return {
          icon: <PartyPopper className="w-5 h-5 text-purple-600" />,
          bg: "bg-purple-50 border border-purple-100",
        };
      case "request":
        return {
          icon: <Receipt className="w-5 h-5 text-indigo-600" />,
          bg: "bg-indigo-50 border border-indigo-100",
        };
      case "sent":
        return {
          icon: <Send className="w-5 h-5 text-blue-600" />,
          bg: "bg-blue-50 border border-blue-100",
        };
      default:
        return {
          icon: <Bell className="w-5 h-5 text-indigo-600" />,
          bg: "bg-indigo-50 border border-indigo-100",
        };
    }
  }

  return (
    <div className="min-h-screen bg-[#f8f9fd] flex justify-center text-slate-800">
      {/* Mobile container simulation */}
      <div className="w-full max-w-md min-h-screen bg-[#f8f9fd] relative shadow-2xl flex flex-col">
        {/* ── 1. Clean Top Header ────────────────────────────────────────── */}
        <div className="px-4 pt-5 pb-3 flex items-center justify-between">
          <button
            type="button"
            onClick={() => window.history.back()}
            className="w-9 h-9 rounded-full bg-slate-200/70 hover:bg-slate-300 flex items-center justify-center text-slate-700 transition-colors"
            aria-label="Back"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <h1 className="text-slate-800 text-lg font-bold tracking-tight">
            Notifications
          </h1>

          <button
            type="button"
            onClick={markAllRead}
            className="text-xs font-bold text-[#5b4fe9] hover:text-[#4335c9] transition-colors flex items-center gap-1 py-1 px-2 rounded-lg hover:bg-indigo-50"
          >
            <CheckCheck className="w-4 h-4" />
            <span>Read all</span>
          </button>
        </div>

        {/* ── 2. Filter Buttons (Width 60%, Centered, No Overlap) ────────── */}
        <div className="my-2 flex justify-center px-4">
          <div className="w-[60%] bg-white p-1 rounded-full shadow-md border border-slate-200/80 flex items-center">
            <button
              type="button"
              onClick={() => setFilter("in")}
              className={`flex-1 py-2 text-sm font-semibold rounded-full text-center transition-all duration-200 ${
                filter === "in"
                  ? "bg-[#5b4fe9] text-white shadow-md shadow-[#5b4fe9]/30"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              In
            </button>
            <button
              type="button"
              onClick={() => setFilter("out")}
              className={`flex-1 py-2 text-sm font-semibold rounded-full text-center transition-all duration-200 ${
                filter === "out"
                  ? "bg-[#5b4fe9] text-white shadow-md shadow-[#5b4fe9]/30"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Out
            </button>
          </div>
        </div>

        {/* ── List Section ──────────────────────────────────────────────── */}
        <div className="flex-1 px-4 pt-5 pb-8 overflow-y-auto space-y-3">
          {filteredList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center mb-3 text-[#5b4fe9]">
                <Bell className="w-7 h-7" />
              </div>
              <p className="font-bold text-slate-800 text-base">
                No {filter === "in" ? "incoming" : "outgoing"} notifications
              </p>
              <p className="text-xs text-slate-500 max-w-xs mt-1">
                {filter === "in"
                  ? "Incoming payment requests and received funds will be shown here."
                  : "Transfers and payments sent to your friends will appear here."}
              </p>
            </div>
          ) : (
            filteredList.map((item) => {
              const { icon, bg } = getIcon(item.category);
              return (
                <div
                  key={item.id}
                  className={`bg-white rounded-2xl p-4 border transition-all duration-200 hover:shadow-md ${
                    item.isRead
                      ? "border-slate-100 shadow-sm"
                      : "border-[#5b4fe9]/30 shadow-md shadow-[#5b4fe9]/5"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Distinct Icon with subtle bg */}
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${bg}`}
                    >
                      {icon}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-sm font-bold text-slate-900 truncate">
                          {item.title}
                        </h3>
                        {!item.isRead && (
                          <span className="w-2 h-2 rounded-full bg-[#5b4fe9] shrink-0" />
                        )}
                      </div>

                      <p className="text-xs text-slate-600 mt-1 leading-relaxed line-clamp-2">
                        {item.message}
                      </p>

                      <p className="text-[11px] font-medium text-slate-400 mt-1.5">
                        {item.timestamp}
                      </p>
                    </div>
                  </div>

                  {/* Action Button (View Split or Pay Now) */}
                  {item.actionText && (
                    <div className="mt-3 pt-3 border-t border-slate-50 flex justify-end">
                      {item.actionType === "pay" ? (
                        <button
                          type="button"
                          className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#5b4fe9] text-white text-xs font-semibold hover:bg-[#4d42db] active:scale-95 shadow-sm shadow-[#5b4fe9]/30 transition-all"
                        >
                          <Receipt className="w-3.5 h-3.5" />
                          <span>{item.actionText}</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full border border-[#5b4fe9] text-[#5b4fe9] text-xs font-semibold hover:bg-[#5b4fe9]/5 active:scale-95 transition-all"
                        >
                          <Receipt className="w-3.5 h-3.5" />
                          <span>{item.actionText}</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
