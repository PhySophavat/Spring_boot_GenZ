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

interface DashboardPageProps {
  onNavigate?: (page: "dashboard" | "users" | "contacts" | "cards" | "wallet" | "payments" | "chat") => void;
}

export default function DashboardPage({ onNavigate }: DashboardPageProps) {
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
    <div className="flex-1 space-y-6 max-w-[1600px] pb-12">
      {/* Header Banner */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Overview
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Monitor balances, user security, and transaction trends in real-time.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadData()}
          disabled={loading}
          className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 shadow-sm transition-all hover:bg-slate-50 dark:hover:bg-slate-700 active:scale-95 disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw className={`h-4 w-4 text-slate-400 dark:text-slate-500 ${loading ? "animate-spin" : ""}`} />
          Refresh Data
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 p-4 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* USD Balance */}
        <div
          onClick={() => onNavigate?.("wallet")}
          className="smooth-card rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm cursor-pointer hover:border-blue-400 dark:hover:border-blue-500 group"
          title="Click to view Wallets"
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Total USD Balance</p>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {loading ? (
                <span className="inline-block h-8 w-32 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />
              ) : (
                formatUsd(summary?.totalUsdBalance ?? 0)
              )}
            </h3>
            <div className="mt-1 flex items-center justify-between">
              <p className="text-xs text-slate-400 dark:text-slate-500">Aggregated across all wallets</p>
              <span className="text-[11px] font-medium text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">View →</span>
            </div>
          </div>
        </div>

        {/* KHR Balance */}
        <div
          onClick={() => onNavigate?.("wallet")}
          className="smooth-card rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm cursor-pointer hover:border-emerald-400 dark:hover:border-emerald-500 group"
          title="Click to view Wallets"
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">Total KHR Balance</p>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-sm">
              <Wallet className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {loading ? (
                <span className="inline-block h-8 w-32 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />
              ) : (
                formatKhr(summary?.totalKhrBalance ?? 0)
              )}
            </h3>
            <div className="mt-1 flex items-center justify-between">
              <p className="text-xs text-slate-400 dark:text-slate-500">Aggregated across all wallets</p>
              <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity">View →</span>
            </div>
          </div>
        </div>

        {/* Total Transactions */}
        <div
          onClick={() => onNavigate?.("payments")}
          className="smooth-card rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-500 group"
          title="Click to view Transactions"
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">Total Transactions</p>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
              <Activity className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {loading ? (
                <span className="inline-block h-8 w-16 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />
              ) : (
                summary?.totalTransactionsCount ?? 0
              )}
            </h3>
            <div className="mt-1 flex items-center justify-between">
              <p className="text-xs text-slate-400 dark:text-slate-500">All payments and transfers</p>
              <span className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity">View →</span>
            </div>
          </div>
        </div>

        {/* Today's Payments */}
        <div
          onClick={() => onNavigate?.("payments")}
          className="smooth-card rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm cursor-pointer hover:border-rose-400 dark:hover:border-rose-500 group"
          title="Click to view Transactions"
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">Today's Payments</p>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 group-hover:scale-110 group-hover:bg-rose-600 group-hover:text-white transition-all shadow-sm">
              <Calendar className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {loading ? (
                <span className="inline-block h-8 w-24 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />
              ) : (
                summary?.todayPaymentsCount ?? 0
              )}
            </h3>
          </div>
          <div className="mt-1 flex items-center justify-between">
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {summary ? formatUsd(summary.todayPaymentsAmountUsd) : "$0.00"} <span className="mx-1 text-slate-300 dark:text-slate-600">•</span> {summary ? formatKhr(summary.todayPaymentsAmountKhr) : "៛0"}
            </div>
            <span className="text-[11px] font-medium text-rose-600 dark:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity">View →</span>
          </div>
        </div>
      </div>

      {/* Analytics Charts Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        
        {/* Trend Area Chart */}
        <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm lg:col-span-2">
          <div className="mb-6">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Transaction Volume Trends</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">Weekly USD and KHR transaction volume comparison.</p>
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
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
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
        <div
          onClick={() => onNavigate?.("users")}
          className="smooth-card flex flex-col rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm cursor-pointer hover:border-emerald-300 group"
          title="Click to view User Security"
        >
          <div className="mb-2 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">User Security Compliance</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Proportion of users with PIN setup.</p>
            </div>
            <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity">View Users →</span>
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
          <div className="mt-2 flex items-center justify-between rounded-xl border border-rose-100 dark:border-rose-900/40 bg-rose-50/60 dark:bg-rose-950/30 p-3">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-300 shadow-sm">
                <ShieldOff size={16} />
              </div>
              <div>
                <p className="text-xs font-semibold text-rose-600 dark:text-rose-400">At Risk Users (No PIN)</p>
                <p className="text-base font-extrabold text-slate-900 dark:text-white">{pinSecurityData[1].value}</p>
              </div>
            </div>
            <span className="text-xs font-bold text-rose-600 dark:text-rose-400">Manage →</span>
          </div>
        </div>
        
        {/* Transaction Types Bar Chart */}
        <div
          onClick={() => onNavigate?.("payments")}
          className="smooth-card rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm cursor-pointer hover:border-indigo-300 group"
          title="Click to view all Transactions"
        >
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">Activity by Type</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Distribution of user operations.</p>
            </div>
            <span className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity">View All →</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={transactionTypesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
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
        <div
          onClick={() => onNavigate?.("wallet")}
          className="smooth-card rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm cursor-pointer hover:border-sky-300 group"
          title="Click to view Wallets"
        >
          <div className="mb-2 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">Balance Allocation</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">USD vs KHR aggregate total values.</p>
            </div>
            <span className="text-[11px] font-medium text-sky-600 dark:text-sky-400 opacity-0 group-hover:opacity-100 transition-opacity">View Wallets →</span>
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
        <div className="flex flex-col justify-center gap-3 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
          <div
            onClick={() => onNavigate?.("users")}
            className="smooth-card flex items-center justify-between rounded-xl border border-slate-100 dark:border-slate-800/80 p-4 transition-all hover:bg-indigo-50/40 dark:hover:bg-indigo-950/30 hover:border-indigo-200 cursor-pointer group"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">
                <Users size={18} />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">Total Users</p>
                <p className="mt-0.5 text-xl font-extrabold text-slate-900 dark:text-white">{loading ? "—" : wallets.length}</p>
              </div>
            </div>
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity">→</span>
          </div>

          <div
            onClick={() => onNavigate?.("wallet")}
            className="smooth-card flex items-center justify-between rounded-xl border border-slate-100 dark:border-slate-800/80 p-4 transition-all hover:bg-emerald-50/40 dark:hover:bg-emerald-950/30 hover:border-emerald-200 cursor-pointer group"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                <TrendingUp size={18} />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">Active Wallets</p>
                <p className="mt-0.5 text-xl font-extrabold text-slate-900 dark:text-white">{loading ? "—" : activeWallets}</p>
              </div>
            </div>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity">→</span>
          </div>

          <div
            onClick={() => onNavigate?.("users")}
            className="smooth-card flex items-center justify-between rounded-xl border border-slate-100 dark:border-slate-800/80 p-4 transition-all hover:bg-rose-50/40 dark:hover:bg-rose-950/30 hover:border-rose-200 cursor-pointer group"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 group-hover:scale-110 transition-transform">
                <ShieldOff size={18} />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">Risk Accounts</p>
                <p className="mt-0.5 text-xl font-extrabold text-slate-900 dark:text-white">{loading ? "—" : walletsWithoutPin}</p>
              </div>
            </div>
            <span className="text-xs font-bold text-rose-600 dark:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity">→</span>
          </div>
        </div>
      </div>

      {/* Filters + Recent Transactions Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-200 dark:border-slate-800 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Recent Transactions
              </h2>
              <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                {transactions.length} transaction{transactions.length !== 1 ? "s" : ""} loaded
              </p>
            </div>
            {onNavigate && (
              <button
                type="button"
                onClick={() => onNavigate("payments")}
                className="smooth-btn hidden sm:inline-flex items-center gap-1 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 hover:text-indigo-600 dark:hover:text-indigo-400 px-3 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 transition-all cursor-pointer"
              >
                View All →
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Currency Filter */}
            <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-800 p-0.5">
              {["ALL", "USD", "KHR"].map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCurrencyFilter(c as any)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                    currencyFilter === c ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  {c === "ALL" ? "All Currencies" : c === "USD" ? "USD ($)" : "KHR (៛)"}
                </button>
              ))}
            </div>

            {/* Status Filter */}
            <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-800 p-0.5">
              {["ALL", "SUCCESS", "FAILED"].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatusFilter(s as any)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                    statusFilter === s
                      ? s === "SUCCESS"
                        ? "bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-400 shadow-sm"
                        : s === "FAILED"
                        ? "bg-white dark:bg-slate-700 text-rose-700 dark:text-rose-400 shadow-sm"
                        : "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  {s === "ALL" ? "All Status" : s.charAt(0) + s.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
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
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 bg-white dark:bg-slate-900">
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
                  <tr key={tx.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                    <td className="px-5 py-3 font-mono text-xs font-semibold text-slate-600 dark:text-slate-400">
                      {tx.referenceNumber}
                    </td>
                    <td className="px-5 py-3">
                      <div className="font-semibold text-slate-900 dark:text-slate-100">{tx.senderName}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">{tx.senderWalletNumber}</div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="font-semibold text-slate-900 dark:text-slate-100">{tx.receiverName}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">{tx.receiverWalletNumber}</div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {tx.currency === "USD" ? formatUsd(tx.amount) : formatKhr(tx.amount)}
                      </div>
                    </td>
                    <td className="max-w-[160px] px-5 py-3">
                      {tx.senderName ? (
                        <span className="block truncate text-xs text-slate-500 dark:text-slate-400">
                          Paid by {tx.senderName}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-300 dark:text-slate-600">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <span className="inline-flex items-center rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300">
                        {tx.transactionType}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-semibold ${
                          tx.status === "SUCCESS"
                            ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 ring-1 ring-inset ring-emerald-600/20"
                            : tx.status === "FAILED"
                            ? "bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 ring-1 ring-inset ring-rose-600/20"
                            : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 ring-1 ring-inset ring-slate-600/20"
                        }`}
                      >
                        {tx.status === "SUCCESS" && <CheckCircle2 className="h-3 w-3" />}
                        {tx.status === "FAILED" && <XCircle className="h-3 w-3" />}
                        {tx.status !== "SUCCESS" && tx.status !== "FAILED" && <Clock className="h-3 w-3" />}
                        {tx.status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-xs text-slate-500 dark:text-slate-400">
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