import { useEffect, useState } from "react";
import {
  RefreshCw,
  ArrowRightLeft,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  CreditCard,
  Filter,
  Search,
} from "lucide-react";
import { fetchTransactions, type TransactionInfo } from "../../services/dashboardService";

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

function getTypeIcon(type: string) {
  switch (type) {
    case "PAYMENT": return <CreditCard className="h-4 w-4" />;
    case "DEPOSIT": return <TrendingUp className="h-4 w-4" />;
    case "WITHDRAWAL": return <TrendingDown className="h-4 w-4" />;
    default: return <ArrowRightLeft className="h-4 w-4" />;
  }
}

function getTypeColor(type: string) {
  switch (type) {
    case "PAYMENT": return "bg-indigo-50 text-indigo-700 border-indigo-100";
    case "DEPOSIT": return "bg-emerald-50 text-emerald-700 border-emerald-100";
    case "WITHDRAWAL": return "bg-rose-50 text-rose-700 border-rose-100";
    default: return "bg-slate-50 text-slate-700 border-slate-100";
  }
}

export default function PaymentsPage() {
  const [transactions, setTransactions] = useState<TransactionInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currencyFilter, setCurrencyFilter] = useState<"ALL" | "USD" | "KHR">("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "SUCCESS" | "FAILED">("ALL");
  const [typeFilter, setTypeFilter] = useState<"ALL" | "PAYMENT" | "DEPOSIT" | "TRANSFER">("ALL");
  const [search, setSearch] = useState("");

  useEffect(() => {
    void loadData();
  }, [currencyFilter, statusFilter]);

  async function loadData() {
    setLoading(true);
    setError("");
    try {
      const data = await fetchTransactions(currencyFilter, statusFilter);
      setTransactions(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load transactions.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  const filtered = transactions.filter((tx) => {
    const matchType = typeFilter === "ALL" || tx.transactionType === typeFilter;
    const matchSearch =
      !search ||
      tx.referenceNumber?.toLowerCase().includes(search.toLowerCase()) ||
      tx.senderName?.toLowerCase().includes(search.toLowerCase()) ||
      tx.receiverName?.toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  // Stats
  const totalAmount = filtered.reduce((sum, tx) => {
    if (tx.currency === "USD") return sum + (tx.amount ?? 0);
    return sum;
  }, 0);
  const successCount = filtered.filter((tx) => tx.status === "SUCCESS").length;
  const failedCount = filtered.filter((tx) => tx.status === "FAILED").length;
  const paymentCount = filtered.filter((tx) => tx.transactionType === "PAYMENT").length;

  return (
    <div className="flex-1 space-y-8 p-1">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-r from-violet-900 via-purple-900 to-indigo-900 p-8 text-white shadow-xl">
        <div className="absolute right-0 top-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-purple-500/20 blur-3xl" />
        <div className="absolute left-0 bottom-0 -ml-16 -mb-16 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="relative z-10 flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div>
            <span className="text-xs font-semibold uppercase tracking-[0.3em] text-purple-300">
              Payment Operations
            </span>
            <h1 className="mt-2 text-4xl font-extrabold tracking-tight sm:text-5xl">
              Transactions
            </h1>
            <p className="mt-2 text-slate-300 text-sm max-w-xl">
              Full history of all payments, deposits, and transfers across wallets.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void loadData()}
            disabled={loading}
            className="flex items-center justify-center gap-2 self-start rounded-2xl border border-white/10 bg-white/10 px-5 py-3 text-sm font-semibold backdrop-blur transition hover:bg-white/20 active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-[24px] bg-gradient-to-br from-indigo-600 to-violet-700 p-5 text-white shadow-lg">
          <p className="text-xs font-bold uppercase tracking-widest text-indigo-200">Total Payments</p>
          <p className="mt-3 text-3xl font-extrabold">{paymentCount}</p>
          <p className="mt-1 text-xs text-indigo-200">QR & direct transfers</p>
        </div>
        <div className="rounded-[24px] bg-gradient-to-br from-emerald-500 to-teal-600 p-5 text-white shadow-lg">
          <p className="text-xs font-bold uppercase tracking-widest text-emerald-100">Success</p>
          <p className="mt-3 text-3xl font-extrabold">{successCount}</p>
          <p className="mt-1 text-xs text-emerald-100">Completed</p>
        </div>
        <div className="rounded-[24px] bg-gradient-to-br from-rose-500 to-pink-600 p-5 text-white shadow-lg">
          <p className="text-xs font-bold uppercase tracking-widest text-rose-100">Failed</p>
          <p className="mt-3 text-3xl font-extrabold">{failedCount}</p>
          <p className="mt-1 text-xs text-rose-100">Needs review</p>
        </div>
        <div className="rounded-[24px] bg-gradient-to-br from-sky-500 to-blue-600 p-5 text-white shadow-lg">
          <p className="text-xs font-bold uppercase tracking-widest text-sky-100">Volume (USD)</p>
          <p className="mt-3 text-2xl font-extrabold">{formatUsd(totalAmount)}</p>
          <p className="mt-1 text-xs text-sky-100">Filtered result</p>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-600">
          {error}
        </div>
      )}

      {/* Filters + Table */}
      <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-md">
        <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">Transaction History</h2>
            <p className="mt-1 text-xs text-slate-500">
              {filtered.length} record{filtered.length !== 1 ? "s" : ""} found
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
              <Search className="h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search ref / name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-40 bg-transparent text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
              />
            </div>

            {/* Type Filter */}
            <div className="inline-flex rounded-xl bg-slate-100 p-1 text-xs">
              {(["ALL", "PAYMENT", "DEPOSIT", "TRANSFER"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTypeFilter(t)}
                  className={`rounded-lg px-3 py-1.5 font-medium transition ${
                    typeFilter === t ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  {t === "ALL" ? "All Types" : t.charAt(0) + t.slice(1).toLowerCase()}
                </button>
              ))}
            </div>

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
                  {c === "ALL" ? "All" : c === "USD" ? "USD ($)" : "KHR (៛)"}
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

            <Filter className="h-4 w-4 text-slate-400" />
          </div>
        </div>

        {/* Table */}
        <div className="mt-6 overflow-hidden rounded-2xl border border-slate-100">
          <table className="min-w-full divide-y divide-slate-100 text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-6 py-4">Ref / Type</th>
                <th className="px-6 py-4">Sender</th>
                <th className="px-6 py-4">Receiver</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Note</th>
                <th className="px-6 py-4">Fee</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Date & Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {loading && (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                    <RefreshCw className="mx-auto h-6 w-6 animate-spin text-indigo-400 mb-3" />
                    Loading transactions...
                  </td>
                </tr>
              )}

              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <ArrowRightLeft className="mx-auto h-10 w-10 text-slate-200 mb-3" />
                    <p className="text-slate-400 font-medium">No transactions found</p>
                    <p className="text-xs text-slate-300 mt-1">Try adjusting your filters</p>
                  </td>
                </tr>
              )}

              {!loading &&
                filtered.map((tx) => (
                  <tr
                    key={tx.id}
                    className="hover:bg-slate-50/80 transition-colors duration-150"
                  >
                    {/* Ref + Type */}
                    <td className="px-6 py-4">
                      <div className="font-mono text-xs font-semibold text-indigo-600 truncate max-w-[160px]">
                        {tx.referenceNumber}
                      </div>
                      <span
                        className={`mt-1 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold ${getTypeColor(tx.transactionType)}`}
                      >
                        {getTypeIcon(tx.transactionType)}
                        {tx.transactionType}
                      </span>
                    </td>

                    {/* Sender */}
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-800">
                        {tx.senderName || "—"}
                      </div>
                      <div className="text-xs text-slate-400">
                        {tx.senderWalletNumber !== "SYSTEM" ? `#${tx.senderWalletNumber}` : "SYSTEM"}
                      </div>
                    </td>

                    {/* Receiver */}
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-800">
                        {tx.receiverName || "—"}
                      </div>
                      <div className="text-xs text-slate-400">
                        {tx.receiverWalletNumber !== "SYSTEM" ? `#${tx.receiverWalletNumber}` : "SYSTEM"}
                      </div>
                    </td>

                    {/* Amount */}
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">
                        {tx.currency === "USD" ? formatUsd(tx.amount) : formatKhr(tx.amount)}
                      </div>
                      <div className="text-xs text-slate-400">{tx.currency}</div>
                    </td>

                    {/* Note */}
                    <td className="px-6 py-4 max-w-[180px]">
                      {tx.note ? (
                        <span
                          className="block truncate text-xs text-slate-500 italic"
                          title={tx.note}
                        >
                          "{tx.note}"
                        </span>
                      ) : (
                        <span className="text-xs text-slate-300">—</span>
                      )}
                    </td>

                    {/* Fee */}
                    <td className="px-6 py-4 text-slate-500">
                      {tx.currency === "USD" ? formatUsd(tx.fee ?? 0) : formatKhr(tx.fee ?? 0)}
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                          tx.status === "SUCCESS"
                            ? "bg-emerald-50 text-emerald-700"
                            : tx.status === "FAILED"
                            ? "bg-rose-50 text-rose-700"
                            : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {tx.status === "SUCCESS" && <CheckCircle2 className="h-3.5 w-3.5" />}
                        {tx.status === "FAILED" && <XCircle className="h-3.5 w-3.5" />}
                        {tx.status !== "SUCCESS" && tx.status !== "FAILED" && <Clock className="h-3.5 w-3.5" />}
                        {tx.status}
                      </span>
                    </td>

                    {/* Date */}
                    <td className="px-6 py-4 text-slate-500 whitespace-nowrap text-xs">
                      {new Date(tx.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                      <div className="text-slate-400">
                        {new Date(tx.createdAt).toLocaleTimeString("en-US", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
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
