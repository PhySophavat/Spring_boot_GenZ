import { useEffect, useState } from "react";
import {
  RefreshCw,
  DollarSign,
  Wallet,
  Activity,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  fetchDashboardSummary,
  fetchTransactions,
  type DashboardSummary,
  type TransactionInfo,
} from "../../services/dashboardService";
import { fetchWallets } from "../../services/walletService";
import type { WalletInfo } from "../../types/wallet";

function formatUsd(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatKhr(amount: number) {
  return new Intl.NumberFormat("km-KH", {
    style: "currency",
    currency: "KHR",
    minimumFractionDigits: 0,
  }).format(amount);
}

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [transactions, setTransactions] = useState<TransactionInfo[]>([]);
  const [wallets, setWallets] = useState<WalletInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currencyFilter, setCurrencyFilter] = useState<"ALL" | "USD" | "KHR">("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "SUCCESS" | "FAILED">("ALL");

  useEffect(() => {
    void loadData();
  }, [currencyFilter, statusFilter]);

  async function loadData() {
    setLoading(true);
    setError("");
    try {
      const [sumData, txData, walletData] = await Promise.all([
        fetchDashboardSummary(),
        fetchTransactions(currencyFilter, statusFilter),
        fetchWallets(),
      ]);
      setSummary(sumData);
      setTransactions(txData);
      setWallets(walletData);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load dashboard data.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  const activeWallets = wallets.filter((w) => w.status === "ACTIVE").length;
  const walletsWithPin = wallets.filter((w) => w.hasPin).length;

  return (
    <div className="flex-1 space-y-8 p-1">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-8 text-white shadow-xl">
        <div className="absolute right-0 top-0 -mr-20 -mt-20 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="absolute left-0 bottom-0 -ml-20 -mb-20 h-64 w-64 rounded-full bg-cyan-500/20 blur-3xl" />

        <div className="relative z-10 flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div>
            <span className="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-300">
              Admin Control Panel
            </span>
            <h1 className="mt-2 text-4xl font-extrabold tracking-tight sm:text-5xl">
              Flex Pay Dashboard
            </h1>
            <p className="mt-2 text-slate-300 text-sm max-w-xl">
              Real-time monitoring of multi-currency balances, transactions, and secure QR payments.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadData()}
            disabled={loading}
            className="flex items-center justify-center gap-2 self-start rounded-2xl border border-white/10 bg-white/10 px-5 py-3 text-sm font-semibold backdrop-blur transition hover:bg-white/20 active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh Data
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-600">
          {error}
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* USD Balance */}
        <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-violet-600 to-indigo-700 p-6 text-white shadow-lg transition-transform hover:-translate-y-1">
          <div className="absolute right-0 top-0 -mr-8 -mt-8 h-24 w-24 rounded-full bg-white/10" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-widest text-violet-100">
              Total USD Balance
            </span>
            <div className="rounded-xl bg-white/20 p-2">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-6">
            <h3 className="text-3xl font-extrabold tracking-tight">
              {loading ? (
                <span className="inline-block h-8 w-32 animate-pulse rounded-lg bg-white/20" />
              ) : (
                formatUsd(summary?.totalUsdBalance ?? 0)
              )}
            </h3>
            <p className="mt-2 text-xs text-violet-200">Aggregated across all wallets</p>
          </div>
        </div>

        {/* KHR Balance */}
        <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-emerald-500 to-teal-700 p-6 text-white shadow-lg transition-transform hover:-translate-y-1">
          <div className="absolute right-0 top-0 -mr-8 -mt-8 h-24 w-24 rounded-full bg-white/10" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-100">
              Total KHR Balance
            </span>
            <div className="rounded-xl bg-white/20 p-2">
              <Wallet className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-6">
            <h3 className="text-3xl font-extrabold tracking-tight">
              {loading ? (
                <span className="inline-block h-8 w-32 animate-pulse rounded-lg bg-white/20" />
              ) : (
                formatKhr(summary?.totalKhrBalance ?? 0)
              )}
            </h3>
            <p className="mt-2 text-xs text-emerald-200">Aggregated across all wallets</p>
          </div>
        </div>

        {/* Total Transactions */}
        <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-sky-500 to-blue-600 p-6 text-white shadow-lg transition-transform hover:-translate-y-1">
          <div className="absolute right-0 top-0 -mr-8 -mt-8 h-24 w-24 rounded-full bg-white/10" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-widest text-sky-100">
              Total Transactions
            </span>
            <div className="rounded-xl bg-white/20 p-2">
              <Activity className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-6">
            <h3 className="text-3xl font-extrabold tracking-tight">
              {loading ? (
                <span className="inline-block h-8 w-16 animate-pulse rounded-lg bg-white/20" />
              ) : (
                summary?.totalTransactionsCount ?? 0
              )}
            </h3>
            <p className="mt-2 text-xs text-sky-200">All payments, deposits, transfers</p>
          </div>
        </div>

        {/* Today's Payments */}
        <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-rose-500 to-pink-600 p-6 text-white shadow-lg transition-transform hover:-translate-y-1">
          <div className="absolute right-0 top-0 -mr-8 -mt-8 h-24 w-24 rounded-full bg-white/10" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-widest text-rose-100">
              Today's Payments
            </span>
            <div className="rounded-xl bg-white/20 p-2">
              <Calendar className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-6">
            <h3 className="text-2xl font-extrabold tracking-tight">
              {loading ? (
                <span className="inline-block h-7 w-24 animate-pulse rounded-lg bg-white/20" />
              ) : (
                `${summary?.todayPaymentsCount ?? 0} payments`
              )}
            </h3>
            <div className="mt-2 text-xs text-rose-100 space-y-0.5">
              <div>USD: {summary ? formatUsd(summary.todayPaymentsAmountUsd) : "$0.00"}</div>
              <div>KHR: {summary ? formatKhr(summary.todayPaymentsAmountKhr) : "៛0"}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Wallet Overview Row */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm flex items-center gap-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50">
            <Users className="h-6 w-6 text-indigo-600" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Wallets</p>
            <p className="mt-1 text-3xl font-extrabold text-slate-900">
              {loading ? "—" : wallets.length}
            </p>
          </div>
        </div>

        <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm flex items-center gap-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50">
            <TrendingUp className="h-6 w-6 text-emerald-600" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Active Wallets</p>
            <p className="mt-1 text-3xl font-extrabold text-slate-900">
              {loading ? "—" : activeWallets}
            </p>
          </div>
        </div>

        <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm flex items-center gap-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-50">
            <CheckCircle2 className="h-6 w-6 text-violet-600" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">PIN Secured</p>
            <p className="mt-1 text-3xl font-extrabold text-slate-900">
              {loading ? "—" : walletsWithPin}
            </p>
          </div>
        </div>
      </div>

      {/* Filters + Recent Transactions Table */}
      <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-md">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-5">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              Recent Transactions
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {transactions.length} transaction{transactions.length !== 1 ? "s" : ""} loaded
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Currency Filter */}
            <div className="inline-flex rounded-xl bg-slate-100 p-1 text-xs">
              {(["ALL", "USD", "KHR"] as const).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCurrencyFilter(c)}
                  className={`rounded-lg px-3 py-1.5 font-medium transition ${
                    currencyFilter === c ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  {c === "ALL" ? "All Currencies" : c === "USD" ? "USD ($)" : "KHR (៛)"}
                </button>
              ))}
            </div>

            {/* Status Filter */}
            <div className="inline-flex rounded-xl bg-slate-100 p-1 text-xs">
              {(["ALL", "SUCCESS", "FAILED"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatusFilter(s)}
                  className={`rounded-lg px-3 py-1.5 font-medium transition ${
                    statusFilter === s
                      ? s === "SUCCESS"
                        ? "bg-white text-emerald-600 shadow-sm"
                        : s === "FAILED"
                        ? "bg-white text-rose-600 shadow-sm"
                        : "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  {s === "ALL" ? "All Status" : s.charAt(0) + s.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 overflow-hidden rounded-2xl border border-slate-100">
          <table className="min-w-full divide-y divide-slate-100 text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-6 py-4">Transaction No</th>
                <th className="px-6 py-4">Sender</th>
                <th className="px-6 py-4">Receiver</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Note</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {loading && (
                <tr>
                  <td colSpan={8} className="px-6 py-10 text-center text-slate-400">
                    <RefreshCw className="mx-auto h-5 w-5 animate-spin text-slate-400 mb-2" />
                    Loading transaction records...
                  </td>
                </tr>
              )}

              {!loading && transactions.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-10 text-center text-slate-400">
                    No transactions found for the selected filters.
                  </td>
                </tr>
              )}

              {!loading &&
                transactions.slice(0, 10).map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-4 font-mono font-medium text-indigo-600 text-xs">
                      {tx.referenceNumber}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-800">{tx.senderName}</div>
                      <div className="text-xs text-slate-400">#{tx.senderWalletNumber}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-800">{tx.receiverName}</div>
                      <div className="text-xs text-slate-400">#{tx.receiverWalletNumber}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">
                        {tx.currency === "USD" ? formatUsd(tx.amount) : formatKhr(tx.amount)}
                      </div>
                    </td>
                    <td className="px-6 py-4 max-w-[160px]">
                      {tx.note ? (
                        <span className="block truncate text-xs text-slate-500 italic" title={tx.note}>
                          {tx.note}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-300">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">
                        {tx.transactionType}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                          tx.status === "SUCCESS"
                            ? "bg-emerald-50 text-emerald-700"
                            : tx.status === "FAILED"
                            ? "bg-rose-50 text-rose-700"
                            : "bg-slate-50 text-slate-700"
                        }`}
                      >
                        {tx.status === "SUCCESS" && <CheckCircle2 className="h-3 w-3" />}
                        {tx.status === "FAILED" && <XCircle className="h-3 w-3" />}
                        {tx.status !== "SUCCESS" && tx.status !== "FAILED" && <Clock className="h-3 w-3" />}
                        {tx.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 whitespace-nowrap text-xs">
                      {new Date(tx.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
