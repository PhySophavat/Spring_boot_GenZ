import { useEffect, useRef, useState } from "react";
import { RefreshCw, Key, X, ShieldCheck } from "lucide-react";
import { fetchWallets, setUserPin } from "../../services/walletService";
import type { WalletInfo } from "../../types/wallet";

interface PinModalState {
  open: boolean;
  wallet: WalletInfo | null;
}

export default function PinPage() {
  const [wallets, setWallets] = useState<WalletInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modal, setModal] = useState<PinModalState>({ open: false, wallet: null });
  const [pinDigits, setPinDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [confirmDigits, setConfirmDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const pinRefs = useRef<(HTMLInputElement | null)[]>([]);
  const confirmRefs = useRef<(HTMLInputElement | null)[]>([]);

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
      setError("Unable to load PIN status.");
    } finally {
      setLoading(false);
    }
  }

  function openModal(wallet: WalletInfo) {
    setPinDigits(["", "", "", "", "", ""]);
    setConfirmDigits(["", "", "", "", "", ""]);
    setModalError("");
    setSuccessMsg("");
    setModal({ open: true, wallet });
    setTimeout(() => pinRefs.current[0]?.focus(), 100);
  }

  function closeModal() {
    setModal({ open: false, wallet: null });
    setModalError("");
    setSuccessMsg("");
  }

  function handleDigitChange(
    index: number,
    value: string,
    digits: string[],
    setDigits: React.Dispatch<React.SetStateAction<string[]>>,
    refs: React.MutableRefObject<(HTMLInputElement | null)[]>,
    nextRefs?: React.MutableRefObject<(HTMLInputElement | null)[]>
  ) {
    if (!/^\d?$/.test(value)) return;
    const updated = [...digits];
    updated[index] = value;
    setDigits(updated);
    setModalError("");

    if (value && index < 5) {
      refs.current[index + 1]?.focus();
    } else if (value && index === 5 && nextRefs) {
      nextRefs.current[0]?.focus();
    }
  }

  function handleKeyDown(
    e: React.KeyboardEvent,
    index: number,
    digits: string[],
    setDigits: React.Dispatch<React.SetStateAction<string[]>>,
    refs: React.MutableRefObject<(HTMLInputElement | null)[]>
  ) {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      const updated = [...digits];
      updated[index - 1] = "";
      setDigits(updated);
      refs.current[index - 1]?.focus();
    }
  }

  async function handleSetPin() {
    const pin = pinDigits.join("");
    const confirm = confirmDigits.join("");

    if (pin.length !== 6) {
      setModalError("Please enter all 6 digits for PIN.");
      return;
    }
    if (confirm.length !== 6) {
      setModalError("Please enter all 6 digits for Confirm PIN.");
      return;
    }
    if (pin !== confirm) {
      setModalError("PINs do not match.");
      return;
    }
    if (!modal.wallet) return;

    setSubmitting(true);
    setModalError("");
    try {
      await setUserPin(modal.wallet.userId, pin);
      setSuccessMsg(`PIN set successfully for ${modal.wallet.fullName}`);
      // Refresh wallets after a brief delay
      setTimeout(() => {
        closeModal();
        void loadWallets();
      }, 1500);
    } catch (err: unknown) {
      setModalError(err instanceof Error ? err.message : "Failed to set PIN.");
    } finally {
      setSubmitting(false);
    }
  }

  function renderDigitInputs(
    digits: string[],
    setDigits: React.Dispatch<React.SetStateAction<string[]>>,
    refs: React.MutableRefObject<(HTMLInputElement | null)[]>,
    nextRefs?: React.MutableRefObject<(HTMLInputElement | null)[]>
  ) {
    return (
      <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
        {digits.map((d, i) => (
          <input
            key={i}
            ref={(el) => { refs.current[i] = el; }}
            type="password"
            inputMode="numeric"
            maxLength={1}
            value={d}
            onChange={(e) => handleDigitChange(i, e.target.value, digits, setDigits, refs, nextRefs)}
            onKeyDown={(e) => handleKeyDown(e, i, digits, setDigits, refs)}
            style={{
              width: "48px",
              height: "56px",
              borderRadius: "14px",
              border: "2px solid var(--border, #e2e8f0)",
              background: "var(--surface, #f8fafc)",
              textAlign: "center",
              fontSize: "22px",
              fontWeight: 700,
              outline: "none",
              transition: "border-color 0.2s, box-shadow 0.2s",
              caretColor: "#7c3aed",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "#7c3aed";
              e.currentTarget.style.boxShadow = "0 0 0 3px rgba(124,58,237,0.12)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "var(--border, #e2e8f0)";
              e.currentTarget.style.boxShadow = "none";
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="min-w-0 flex-1">
      <section className="rounded-[28px] border border-[var(--border)] bg-[var(--panel)] p-6 shadow-[0_18px_50px_rgba(15,23,42,0.12)]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-[var(--muted-foreground)]">
              PIN Management
            </p>
            <h2 className="mt-2 font-['Manrope','IBM_Plex_Sans',sans-serif] text-3xl font-bold">
              Wallet PIN status
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

      <section className="mt-6 overflow-hidden rounded-[28px] border border-[var(--border)] bg-[var(--panel)] shadow-[0_18px_50px_rgba(15,23,42,0.12)]">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-[0.2em] text-slate-500">
            <tr>
              <th className="px-6 py-4">Wallet ID</th>
              <th className="px-6 py-4">User ID</th>
              <th className="px-6 py-4">Name</th>
              <th className="px-6 py-4">PIN Set</th>
              <th className="px-6 py-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {loading && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                  Loading PIN status...
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
                <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                  No wallet PIN records found.
                </td>
              </tr>
            )}

            {!loading && !error && wallets.length > 0 &&
              wallets.map((wallet) => (
                <tr key={wallet.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 font-medium text-slate-900">#{wallet.id}</td>
                  <td className="px-6 py-4 text-slate-700">#{wallet.userId}</td>
                  <td className="px-6 py-4 text-slate-700">{wallet.fullName}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${wallet.hasPin ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                      <Key className="h-3.5 w-3.5" />
                      {wallet.hasPin ? "Set" : "Not set"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      type="button"
                      onClick={() => openModal(wallet)}
                      className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-200"
                      style={{
                        background: wallet.hasPin
                          ? "linear-gradient(135deg, #f59e0b, #d97706)"
                          : "linear-gradient(135deg, #7c3aed, #6d28d9)",
                        color: "#fff",
                        border: "none",
                        cursor: "pointer",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.10)",
                      }}
                    >
                      <ShieldCheck className="h-3.5 w-3.5" />
                      {wallet.hasPin ? "Reset PIN" : "Set PIN"}
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </section>

      {/* ─── Set PIN Modal ─── */}
      {modal.open && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(15, 23, 42, 0.55)",
            backdropFilter: "blur(6px)",
          }}
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: "24px",
              padding: "36px 32px",
              width: "100%",
              maxWidth: "440px",
              boxShadow: "0 25px 60px rgba(0,0,0,0.18)",
              position: "relative",
              animation: "fadeInScale 0.25s ease-out",
            }}
          >
            {/* Close */}
            <button
              type="button"
              onClick={closeModal}
              style={{
                position: "absolute",
                top: "16px",
                right: "16px",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                padding: "4px",
                borderRadius: "8px",
                color: "#94a3b8",
              }}
            >
              <X size={20} />
            </button>

            {/* Header */}
            <div style={{ textAlign: "center", marginBottom: "28px" }}>
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "16px",
                  background: "linear-gradient(135deg, #7c3aed, #a78bfa)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 16px",
                  boxShadow: "0 8px 20px rgba(124,58,237,0.25)",
                }}
              >
                <ShieldCheck size={28} color="#fff" />
              </div>
              <h3 style={{ fontSize: "20px", fontWeight: 700, margin: 0, color: "#0f172a" }}>
                {modal.wallet?.hasPin ? "Reset PIN" : "Set PIN"}
              </h3>
              <p style={{ fontSize: "14px", color: "#64748b", marginTop: "6px" }}>
                {modal.wallet?.fullName} — Wallet #{modal.wallet?.id}
              </p>
            </div>

            {/* Success Message */}
            {successMsg && (
              <div
                style={{
                  background: "#ecfdf5",
                  color: "#065f46",
                  borderRadius: "12px",
                  padding: "12px 16px",
                  marginBottom: "20px",
                  fontSize: "14px",
                  fontWeight: 600,
                  textAlign: "center",
                  border: "1px solid #a7f3d0",
                }}
              >
                ✓ {successMsg}
              </div>
            )}

            {/* Error Message */}
            {modalError && (
              <div
                style={{
                  background: "#fef2f2",
                  color: "#991b1b",
                  borderRadius: "12px",
                  padding: "12px 16px",
                  marginBottom: "20px",
                  fontSize: "14px",
                  fontWeight: 500,
                  textAlign: "center",
                  border: "1px solid #fecaca",
                }}
              >
                {modalError}
              </div>
            )}

            {!successMsg && (
              <>
                {/* PIN Input */}
                <div style={{ marginBottom: "24px" }}>
                  <label
                    style={{
                      display: "block",
                      fontSize: "13px",
                      fontWeight: 600,
                      color: "#475569",
                      marginBottom: "10px",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                    }}
                  >
                    Enter 6-Digit PIN
                  </label>
                  {renderDigitInputs(pinDigits, setPinDigits, pinRefs, confirmRefs)}
                </div>

                {/* Confirm PIN Input */}
                <div style={{ marginBottom: "28px" }}>
                  <label
                    style={{
                      display: "block",
                      fontSize: "13px",
                      fontWeight: 600,
                      color: "#475569",
                      marginBottom: "10px",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                    }}
                  >
                    Confirm PIN
                  </label>
                  {renderDigitInputs(confirmDigits, setConfirmDigits, confirmRefs)}
                </div>

                {/* Actions */}
                <div style={{ display: "flex", gap: "12px" }}>
                  <button
                    type="button"
                    onClick={closeModal}
                    style={{
                      flex: 1,
                      padding: "14px",
                      borderRadius: "14px",
                      border: "1px solid #e2e8f0",
                      background: "#fff",
                      fontWeight: 600,
                      fontSize: "14px",
                      cursor: "pointer",
                      color: "#475569",
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleSetPin()}
                    disabled={submitting}
                    style={{
                      flex: 1,
                      padding: "14px",
                      borderRadius: "14px",
                      border: "none",
                      background: submitting
                        ? "#c4b5fd"
                        : "linear-gradient(135deg, #7c3aed, #6d28d9)",
                      color: "#fff",
                      fontWeight: 700,
                      fontSize: "14px",
                      cursor: submitting ? "not-allowed" : "pointer",
                      boxShadow: "0 4px 14px rgba(124,58,237,0.3)",
                      transition: "all 0.2s",
                    }}
                  >
                    {submitting ? "Setting..." : "Set PIN"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Inline keyframe animation */}
      <style>{`
        @keyframes fadeInScale {
          from { opacity: 0; transform: scale(0.92); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
