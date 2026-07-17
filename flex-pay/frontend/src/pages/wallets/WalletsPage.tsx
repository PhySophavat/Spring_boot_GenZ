import { useEffect, useState } from "react";
import { RefreshCw, Wallet } from "lucide-react";
import { fetchWallets } from "../../services/walletService";
import type { WalletInfo } from "../../types/wallet";

const KHR_EXCHANGE_RATE = 4100;

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

export default function WalletsPage() {
  const [wallets, setWallets] = useState<WalletInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    void loadWallets();
  }, []);

  async function loadWallets() {
    setLoading(true);
    setError("");
    try {
      const data = await fetchWallets();
      setWallets(data);
    } catch {
      setError("Unable to load wallet records.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-w-0 flex-1">
      <section className="rounded-[28px] border border-[var(--border)] bg-[var(--panel)] p-6 shadow-[0_18px_50px_rgba(15,23,42,0.12)]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-[var(--muted-foreground)]">
              Wallet Records
            </p>
            <h2 className="mt-2 font-['Manrope','IBM_Plex_Sans',sans-serif] text-3xl font-bold">
              Wallet management
            </h2>
          </div>

          <button
            type="button"
            onClick={() => void loadWallets()}
            className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm font-medium"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </section>

      <section className="mt-6 rounded-[28px] border border-[var(--border)] bg-[var(--panel)] p-6 shadow-[0_18px_50px_rgba(15,23,42,0.12)]">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.26em] text-[var(--muted-foreground)]">Total Wallets</p>
            <p className="mt-3 font-['Manrope','IBM_Plex_Sans',sans-serif] text-4xl font-bold">{wallets.length}</p>
          </div>
          <div className="rounded-2xl bg-[var(--muted)] p-4">
            <Wallet className="h-6 w-6" />
          </div>
        </div>
      </section>

      <section className="mt-6">
        <div className="overflow-hidden rounded-[28px] border border-[var(--border)] bg-[var(--panel)] shadow-[0_18px_50px_rgba(15,23,42,0.12)]">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-[0.2em] text-slate-500">
              <tr>
                <th className="px-6 py-4">Wallet ID</th>
                <th className="px-6 py-4">Wallet Number</th>
                <th className="px-6 py-4">User ID</th>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Balance</th>
                <th className="px-6 py-4">PIN</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {loading && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    Loading wallets...
                  </td>
                </tr>
              )}

              {!loading && error && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-red-500">{error}</td>
                </tr>
              )}

              {!loading && !error && wallets.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">No wallets found.</td>
                </tr>
              )}

              {!loading && !error && wallets.length > 0 &&
                wallets.map((wallet) => (
                  <tr key={wallet.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-medium text-slate-900">#{wallet.walletId}</td>
                    <td className="px-6 py-4 text-slate-700">#{wallet.walletNumber}</td>
                    <td className="px-6 py-4 text-slate-700">#{wallet.userId}</td>
                    <td className="px-6 py-4 text-slate-700">{wallet.fullName}</td>
                    <td className="px-6 py-4 text-slate-700">
                      <div className="font-semibold text-slate-900">{formatUsd(wallet.usdBalance)}</div>
                      <div className="text-xs text-slate-500">{formatKhr(wallet.khrBalance)}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${wallet.hasPin ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                        {wallet.hasPin ? "Set" : "Not set"}
                      </span>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
