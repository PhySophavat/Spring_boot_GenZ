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
  ShieldCheck,
  ShieldOff
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend
} from "recharts";
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

// Mock Data for Charts
const transactionTrends = [
  { name: 'Mon', usd: 4000, khr: 2400 },
  { name: 'Tue', usd: 3000, khr: 1398 },
  { name: 'Wed', usd: 2000, khr: 9800 },
  { name: 'Thu', usd: 2780, khr: 3908 },
  { name: 'Fri', usd: 1890, khr: 4800 },
  { name: 'Sat', usd: 2390, khr: 3800 },
  { name: 'Sun', usd: 3490, khr: 4300 },
];

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];
const PIE_COLORS = ['#6366f1', '#14b8a6'];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-slate-100 rounded-xl shadow-lg">
        <p className="font-semibold text-slate-800 mb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {entry.name.toLowerCase().includes('usd') ? formatUsd(entry.value) : formatKhr(entry.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

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
  const walletsWithoutPin = wallets.length - walletsWithPin;

  const pinSecurityData = [
    { name: 'PIN Secured', value: walletsWithPin > 0 ? walletsWithPin : 45 },
    { name: 'No PIN', value: walletsWithoutPin > 0 ? walletsWithoutPin : 12 }
  ];

  const walletCurrencyData = [
    { name: 'USD Wallets', value: summary?.totalUsdBalance ? summary.totalUsdBalance : 252250 },
    { name: 'KHR Wallets', value: summary?.totalKhrBalance ? summary.totalKhrBalance / 4000 : 122499 } // Rough conversion for visual scale
  ];

  const transactionTypesData = [
    { name: 'Transfers', count: 120 },
    { name: 'Deposits', count: 85 },
    { name: 'Payments', count: 65 },
    { name: 'Withdrawals', count: 30 }
  ];

  return (
    <div className="flex-1 space-y-6 p-6 md:p-8 max-w-[1600px] mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Overview
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Monitor balances, user security, and transaction trends in real-time.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadData()}
          disabled={loading}
          className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-all hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-200 active:scale-95 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 text-slate-400 ${loading ? "animate-spin" : ""}`} />
          Refresh Data
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* USD Balance */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">Total USD Balance</p>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-600">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-slate-900">
              {loading ? (
                <span className="inline-block h-8 w-32 animate-pulse rounded bg-slate-100" />
              ) : (
                formatUsd(summary?.totalUsdBalance ?? 0)
              )}
            </h3>
            <p className="mt-1 text-xs text-slate-500">Aggregated across all wallets</p>
          </div>
        </div>

        {/* KHR Balance */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">Total KHR Balance</p>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <Wallet className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-slate-900">
              {loading ? (
                <span className="inline-block h-8 w-32 animate-pulse rounded bg-slate-100" />
              ) : (
                formatKhr(summary?.totalKhrBalance ?? 0)
              )}
            </h3>
            <p className="mt-1 text-xs text-slate-500">Aggregated across all wallets</p>
          </div>
        </div>

        {/* Total Transactions */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">Total Transactions</p>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
              <Activity className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-slate-900">
              {loading ? (
                <span className="inline-block h-8 w-16 animate-pulse rounded bg-slate-100" />
              ) : (
                summary?.totalTransactionsCount ?? 0
              )}
            </h3>
            <p className="mt-1 text-xs text-slate-500">All payments and transfers</p>
          </div>
        </div>

        {/* Today's Payments */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">Today's Payments</p>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-50 text-rose-600">
              <Calendar className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <h3 className="text-2xl font-bold text-slate-900">
              {loading ? (
                <span className="inline-block h-8 w-24 animate-pulse rounded bg-slate-100" />
              ) : (
                summary?.todayPaymentsCount ?? 0
              )}
            </h3>
          </div>
          <div className="mt-1 text-xs font-medium text-slate-500">
            {summary ? formatUsd(summary.todayPaymentsAmountUsd) : "$0.00"} <span className="mx-1 text-slate-300">•</span> {summary ? formatKhr(summary.todayPaymentsAmountKhr) : "៛0"}
          </div>
        </div>
      </div>

      {/* Analytics Charts Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        
        {/* Trend Area Chart */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
          <div className="mb-6">
            <h3 className="text-base font-semibold text-slate-900">Transaction Volume Trends</h3>
            <p className="text-sm text-slate-500">Weekly USD and KHR transaction volume comparison.</p>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={transactionTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorUsd" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorKhr" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dx={-10} tickFormatter={(value) => "$" + value} />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', color: '#64748b', paddingTop: '10px' }} />
                <Area type="monotone" dataKey="usd" name="USD Volume" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorUsd)" />
                <Area type="monotone" dataKey="khr" name="KHR Volume" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorKhr)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Security Compliance Donut */}
        <div className="flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-2">
            <h3 className="text-base font-semibold text-slate-900">User Security Compliance</h3>
            <p className="text-sm text-slate-500">Proportion of users with PIN setup.</p>
          </div>
          <div className="min-h-[220px] flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pinSecurityData}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {pinSecurityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#10b981' : '#f43f5e'} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 p-3">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-100 text-rose-600">
                <ShieldOff size={16} />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">At Risk Users</p>
                <p className="text-base font-semibold text-slate-900">{pinSecurityData[1].value}</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Transaction Types Bar Chart */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-6">
            <h3 className="text-base font-semibold text-slate-900">Activity by Type</h3>
            <p className="text-sm text-slate-500">Distribution of user operations.</p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={transactionTypesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="count" name="Count" fill="#6366f1" radius={[4, 4, 0, 0]}>
                  {transactionTypesData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Currency Allocation Pie */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-2">
            <h3 className="text-base font-semibold text-slate-900">Balance Allocation</h3>
            <p className="text-sm text-slate-500">USD vs KHR aggregate total values.</p>
          </div>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={walletCurrencyData}
                  cx="50%"
                  cy="50%"
                  outerRadius={85}
                  dataKey="value"
                  stroke="none"
                  labelLine={false}
                  label={({ cx = 0, cy = 0, midAngle = 0, innerRadius = 0, outerRadius = 0, percent = 0 }) => {
                    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                    const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
                    const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);
                    return (
                      <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight="600">
                        {`${(percent * 100).toFixed(0)}%`}
                      </text>
                    );
                  }}
                >
                  {walletCurrencyData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Summary Mini Cards */}
        <div className="flex flex-col justify-center gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
           <div className="flex items-center justify-between rounded-lg border border-slate-100 p-4 transition-colors hover:bg-slate-50">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
                <Users size={18} />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">Total Users</p>
                <p className="mt-0.5 text-xl font-bold text-slate-900">{loading ? "—" : wallets.length}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-slate-100 p-4 transition-colors hover:bg-slate-50">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                <TrendingUp size={18} />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">Active Wallets</p>
                <p className="mt-0.5 text-xl font-bold text-slate-900">{loading ? "—" : activeWallets}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-slate-100 p-4 transition-colors hover:bg-slate-50">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-50 text-rose-600">
                <ShieldOff size={18} />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">Risk Accounts</p>
                <p className="mt-0.5 text-xl font-bold text-slate-900">{loading ? "—" : walletsWithoutPin}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters + Recent Transactions Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Recent Transactions
            </h2>
            <p className="mt-0.5 text-sm text-slate-500">
              {transactions.length} transaction{transactions.length !== 1 ? "s" : ""} loaded
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Currency Filter */}
            <div className="inline-flex rounded-lg bg-slate-100 p-0.5">
              {["ALL", "USD", "KHR"].map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCurrencyFilter(c as any)}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                    currencyFilter === c ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  {c === "ALL" ? "All Currencies" : c === "USD" ? "USD ($)" : "KHR (៛)"}
                </button>
              ))}
            </div>

            {/* Status Filter */}
            <div className="inline-flex rounded-lg bg-slate-100 p-0.5">
              {["ALL", "SUCCESS", "FAILED"].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatusFilter(s as any)}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                    statusFilter === s
                      ? s === "SUCCESS"
                        ? "bg-white text-emerald-700 shadow-sm"
                        : s === "FAILED"
                        ? "bg-white text-rose-700 shadow-sm"
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

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3">Transaction ID</th>
                <th className="px-5 py-3">Sender</th>
                <th className="px-5 py-3">Receiver</th>
                <th className="px-5 py-3">Amount</th>
                <th className="px-5 py-3">Note</th>
                <th className="px-5 py-3">Type</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {loading && (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-slate-400">
                    <RefreshCw className="mx-auto mb-2 h-5 w-5 animate-spin text-slate-400" />
                    Loading transaction records...
                  </td>
                </tr>
              )}

              {!loading && transactions.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-slate-500">
                    No transactions found for the selected filters.
                  </td>
                </tr>
              )}

              {!loading &&
                transactions.slice(0, 10).map((tx) => (
                  <tr key={tx.id} className="group hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3 font-mono text-xs font-medium text-slate-600">
                      {tx.referenceNumber}
                    </td>
                    <td className="px-5 py-3">
                      <div className="font-medium text-slate-900">{tx.senderName}</div>
                      <div className="text-xs text-slate-500">{tx.senderWalletNumber}</div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="font-medium text-slate-900">{tx.receiverName}</div>
                      <div className="text-xs text-slate-500">{tx.receiverWalletNumber}</div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="font-semibold text-slate-900">
                        {tx.currency === "USD" ? formatUsd(tx.amount) : formatKhr(tx.amount)}
                      </div>
                    </td>
                    <td className="max-w-[160px] px-5 py-3">
                      {tx.senderName ? (
                        <span className="block truncate text-xs text-slate-500">
                          Paid by {tx.senderName}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-300">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                        {tx.transactionType}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium ${
                          tx.status === "SUCCESS"
                            ? "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20"
                            : tx.status === "FAILED"
                            ? "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-600/20"
                            : "bg-slate-50 text-slate-700 ring-1 ring-inset ring-slate-600/20"
                        }`}
                      >
                        {tx.status === "SUCCESS" && <CheckCircle2 className="h-3 w-3" />}
                        {tx.status === "FAILED" && <XCircle className="h-3 w-3" />}
                        {tx.status !== "SUCCESS" && tx.status !== "FAILED" && <Clock className="h-3 w-3" />}
                        {tx.status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-xs text-slate-500">
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