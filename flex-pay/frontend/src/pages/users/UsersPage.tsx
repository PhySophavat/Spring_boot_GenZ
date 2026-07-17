import { useEffect, useRef, useState } from "react";
import {
  RefreshCw,
  ShieldCheck,
  ShieldOff,
  Search,
  X,
  CheckCircle,
} from "lucide-react";
import { fetchWallets, setUserPin } from "../../services/walletService";
import type { WalletInfo } from "../../types/wallet";

interface PinModalState {
  open: boolean;
  wallet: WalletInfo | null;
}

export default function UsersPage() {
  const [wallets, setWallets] = useState<WalletInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  // PIN Modal
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
      setError("Unable to load user records.");
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
    setTimeout(() => pinRefs.current[0]?.focus(), 120);
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
    if (pin.length !== 6) { setModalError("Enter all 6 digits for PIN."); return; }
    if (confirm.length !== 6) { setModalError("Enter all 6 digits for Confirm PIN."); return; }
    if (pin !== confirm) { setModalError("PINs do not match."); return; }
    if (!modal.wallet) return;
    setSubmitting(true);
    setModalError("");
    try {
      await setUserPin(modal.wallet.userId, pin);
      setSuccessMsg(`PIN set successfully for ${modal.wallet.fullName}`);
      setTimeout(() => { closeModal(); void loadWallets(); }, 1500);
    } catch (err: unknown) {
      setModalError(err instanceof Error ? err.message : "Failed to set PIN.");
    } finally {
      setSubmitting(false);
    }
  }

  function renderDigits(
    digits: string[],
    setDigits: React.Dispatch<React.SetStateAction<string[]>>,
    refs: React.MutableRefObject<(HTMLInputElement | null)[]>,
    nextRefs?: React.MutableRefObject<(HTMLInputElement | null)[]>
  ) {
    return (
      <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
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
              width: "44px", height: "52px",
              borderRadius: "12px",
              border: "1.5px solid #e2e8f0",
              background: "#f8fafc",
              textAlign: "center",
              fontSize: "20px", fontWeight: 700,
              outline: "none",
              transition: "border-color 0.15s, box-shadow 0.15s",
              color: "#0f172a",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "#3b82f6";
              e.currentTarget.style.boxShadow = "0 0 0 3px rgba(59,130,246,0.12)";
              e.currentTarget.style.background = "#fff";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "#e2e8f0";
              e.currentTarget.style.boxShadow = "none";
              e.currentTarget.style.background = "#f8fafc";
            }}
          />
        ))}
      </div>
    );
  }

  const filtered = wallets.filter((w) =>
    !search ||
    w.fullName?.toLowerCase().includes(search.toLowerCase()) ||
    w.walletId?.toLowerCase().includes(search.toLowerCase()) ||
    String(w.userId).includes(search)
  );

  const pinSetCount = wallets.filter((w) => w.hasPin).length;
  const pinNotSetCount = wallets.filter((w) => !w.hasPin).length;

  return (
    <div style={{ flex: 1, minWidth: 0 }}>

      {/* ── Page Header ── */}
      <div
        style={{
          background: "#fff",
          borderRadius: "16px",
          border: "1px solid #e8ecf0",
          padding: "24px 28px",
          marginBottom: "20px",
          boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <p style={{ fontSize: "11px", fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.1em", margin: 0 }}>
              User Management
            </p>
            <h1 style={{ fontSize: "24px", fontWeight: 700, color: "#0f172a", margin: "6px 0 0" }}>
              User Security &amp; PIN Management
            </h1>
            <p style={{ fontSize: "13px", color: "#64748b", margin: "4px 0 0" }}>
              View wallet users and manage their PIN security settings.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void loadWallets()}
            disabled={loading}
            style={{
              display: "inline-flex", alignItems: "center", gap: "8px",
              padding: "10px 18px",
              borderRadius: "10px",
              border: "1px solid #e2e8f0",
              background: "#fff",
              fontSize: "13px", fontWeight: 600,
              color: "#475569", cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#f8fafc"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "#fff"; }}
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {/* ── Summary Cards ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "20px" }}>
        {[
          { label: "Total Users", value: wallets.length, color: "#3b82f6", bg: "#EBF8FF" },
          { label: "PIN Secured", value: pinSetCount, color: "#059669", bg: "#ecfdf5" },
          { label: "PIN Not Set", value: pinNotSetCount, color: "#d97706", bg: "#fffbeb" },
        ].map((card) => (
          <div
            key={card.label}
            style={{
              background: "#fff",
              borderRadius: "14px",
              border: "1px solid #e8ecf0",
              padding: "20px 24px",
              boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
            }}
          >
            <p style={{ fontSize: "11px", fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", margin: 0 }}>
              {card.label}
            </p>
            <p style={{ fontSize: "32px", fontWeight: 800, color: card.color, margin: "8px 0 0", lineHeight: 1 }}>
              {loading ? "—" : card.value}
            </p>
          </div>
        ))}
      </div>

      {/* ── Table Card ── */}
      <div
        style={{
          background: "#fff",
          borderRadius: "16px",
          border: "1px solid #e8ecf0",
          boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
          overflow: "hidden",
        }}
      >
        {/* Table toolbar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 24px",
            borderBottom: "1px solid #f1f4f8",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <h2 style={{ fontSize: "15px", fontWeight: 700, color: "#0f172a", margin: 0 }}>
            All Users
            {!loading && (
              <span style={{ marginLeft: "8px", fontSize: "12px", fontWeight: 500, color: "#94a3b8" }}>
                ({filtered.length})
              </span>
            )}
          </h2>

          {/* Search */}
          <div
            style={{
              display: "flex", alignItems: "center", gap: "8px",
              border: "1px solid #e2e8f0",
              borderRadius: "10px",
              padding: "8px 12px",
              background: "#f8fafc",
            }}
          >
            <Search size={14} color="#94a3b8" />
            <input
              type="text"
              placeholder="Search name, wallet ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                border: "none", background: "transparent",
                fontSize: "13px", color: "#334155",
                outline: "none", width: "200px",
              }}
            />
            {search && (
              <button type="button" onClick={() => setSearch("")} style={{ border: "none", background: "transparent", cursor: "pointer", padding: 0 }}>
                <X size={12} color="#94a3b8" />
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
            <thead>
              <tr style={{ background: "#f8fafc" }}>
                {["Wallet ID", "User ID", "Name", "PIN Status", "Actions"].map((col) => (
                  <th
                    key={col}
                    style={{
                      padding: "12px 20px",
                      textAlign: "left",
                      fontSize: "11px",
                      fontWeight: 600,
                      color: "#94a3b8",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      borderBottom: "1px solid #f1f4f8",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={5} style={{ padding: "48px", textAlign: "center", color: "#94a3b8", fontSize: "14px" }}>
                    <RefreshCw size={20} style={{ margin: "0 auto 8px", display: "block", animation: "spin 1s linear infinite", color: "#3b82f6" }} />
                    Loading users...
                  </td>
                </tr>
              )}

              {!loading && error && (
                <tr>
                  <td colSpan={5} style={{ padding: "48px", textAlign: "center", color: "#ef4444", fontSize: "14px" }}>
                    {error}
                  </td>
                </tr>
              )}

              {!loading && !error && filtered.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ padding: "48px", textAlign: "center", color: "#94a3b8", fontSize: "14px" }}>
                    No users found.
                  </td>
                </tr>
              )}

              {!loading && !error && filtered.map((wallet, idx) => (
                <tr
                  key={wallet.id}
                  style={{
                    borderBottom: idx < filtered.length - 1 ? "1px solid #f1f4f8" : "none",
                    transition: "background 0.1s",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "#fafbfc"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                >
                  {/* Wallet ID */}
                  <td style={{ padding: "16px 20px" }}>
                    <span style={{ fontFamily: "monospace", fontSize: "13px", fontWeight: 600, color: "#3b82f6" }}>
                      #{wallet.walletId}
                    </span>
                  </td>

                  {/* User ID */}
                  <td style={{ padding: "16px 20px", color: "#64748b", fontSize: "13px" }}>
                    #{wallet.userId}
                  </td>

                  {/* Name */}
                  <td style={{ padding: "16px 20px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div
                        style={{
                          width: "32px", height: "32px",
                          borderRadius: "50%",
                          background: `hsl(${(wallet.userId * 47) % 360}, 60%, 90%)`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: "12px", fontWeight: 700,
                          color: `hsl(${(wallet.userId * 47) % 360}, 60%, 35%)`,
                          flexShrink: 0,
                        }}
                      >
                        {wallet.fullName?.charAt(0).toUpperCase() ?? "?"}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: "#0f172a", fontSize: "14px" }}>
                          {wallet.fullName}
                        </div>
                        <div style={{ fontSize: "11px", color: "#94a3b8" }}>
                          Wallet #{wallet.walletNumber}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* PIN Status */}
                  <td style={{ padding: "16px 20px" }}>
                    {wallet.hasPin ? (
                      <span
                        style={{
                          display: "inline-flex", alignItems: "center", gap: "5px",
                          padding: "4px 10px",
                          borderRadius: "999px",
                          background: "#ecfdf5",
                          color: "#059669",
                          fontSize: "12px", fontWeight: 600,
                          border: "1px solid #a7f3d0",
                        }}
                      >
                        <ShieldCheck size={12} />
                        PIN Set
                      </span>
                    ) : (
                      <span
                        style={{
                          display: "inline-flex", alignItems: "center", gap: "5px",
                          padding: "4px 10px",
                          borderRadius: "999px",
                          background: "#fffbeb",
                          color: "#d97706",
                          fontSize: "12px", fontWeight: 600,
                          border: "1px solid #fde68a",
                        }}
                      >
                        <ShieldOff size={12} />
                        Not Set
                      </span>
                    )}
                  </td>

                  {/* Actions */}
                  <td style={{ padding: "16px 20px" }}>
                    <button
                      type="button"
                      onClick={() => openModal(wallet)}
                      style={{
                        display: "inline-flex", alignItems: "center", gap: "6px",
                        padding: "7px 14px",
                        borderRadius: "8px",
                        border: wallet.hasPin ? "1px solid #fde68a" : "1px solid #bfdbfe",
                        background: wallet.hasPin ? "#fffbeb" : "#EBF8FF",
                        color: wallet.hasPin ? "#b45309" : "#1a5fa8",
                        fontSize: "12px", fontWeight: 600,
                        cursor: "pointer",
                        transition: "background 0.15s, border-color 0.15s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = wallet.hasPin ? "#fef3c7" : "#dbeafe";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = wallet.hasPin ? "#fffbeb" : "#EBF8FF";
                      }}
                    >
                      <ShieldCheck size={13} />
                      {wallet.hasPin ? "Reset PIN" : "Set PIN"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── PIN Modal ── */}
      {modal.open && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 9999,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "rgba(15, 23, 42, 0.5)",
            backdropFilter: "blur(4px)",
          }}
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: "20px",
              padding: "32px 28px",
              width: "100%", maxWidth: "420px",
              boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
              position: "relative",
              animation: "modalIn 0.2s ease-out",
            }}
          >
            {/* Close */}
            <button
              type="button"
              onClick={closeModal}
              style={{
                position: "absolute", top: "16px", right: "16px",
                background: "#f1f5f9", border: "none",
                borderRadius: "8px", padding: "6px",
                cursor: "pointer", color: "#64748b",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <X size={16} />
            </button>

            {/* Header */}
            <div style={{ textAlign: "center", marginBottom: "24px" }}>
              <div
                style={{
                  width: "52px", height: "52px",
                  borderRadius: "14px",
                  background: modal.wallet?.hasPin ? "#fffbeb" : "#EBF8FF",
                  border: modal.wallet?.hasPin ? "1px solid #fde68a" : "1px solid #bfdbfe",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  margin: "0 auto 14px",
                }}
              >
                <ShieldCheck size={24} color={modal.wallet?.hasPin ? "#d97706" : "#1a5fa8"} />
              </div>
              <h3 style={{ fontSize: "18px", fontWeight: 700, margin: 0, color: "#0f172a" }}>
                {modal.wallet?.hasPin ? "Reset PIN" : "Set PIN"}
              </h3>
              <p style={{ fontSize: "13px", color: "#64748b", marginTop: "4px" }}>
                {modal.wallet?.fullName}
                <span style={{ color: "#94a3b8" }}> · Wallet #{modal.wallet?.walletId}</span>
              </p>
            </div>

            {/* Success */}
            {successMsg && (
              <div
                style={{
                  display: "flex", alignItems: "center", gap: "8px",
                  background: "#ecfdf5", color: "#059669",
                  borderRadius: "10px", padding: "12px 16px",
                  marginBottom: "20px", fontSize: "13px", fontWeight: 600,
                  border: "1px solid #a7f3d0",
                }}
              >
                <CheckCircle size={16} />
                {successMsg}
              </div>
            )}

            {/* Error */}
            {modalError && (
              <div
                style={{
                  background: "#fef2f2", color: "#dc2626",
                  borderRadius: "10px", padding: "12px 16px",
                  marginBottom: "20px", fontSize: "13px",
                  border: "1px solid #fecaca",
                }}
              >
                {modalError}
              </div>
            )}

            {!successMsg && (
              <>
                {/* PIN */}
                <div style={{ marginBottom: "20px" }}>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#475569", marginBottom: "10px", textTransform: "uppercase", letterSpacing: "0.07em" }}>
                    Enter 6-Digit PIN
                  </label>
                  {renderDigits(pinDigits, setPinDigits, pinRefs, confirmRefs)}
                </div>

                {/* Confirm PIN */}
                <div style={{ marginBottom: "24px" }}>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#475569", marginBottom: "10px", textTransform: "uppercase", letterSpacing: "0.07em" }}>
                    Confirm PIN
                  </label>
                  {renderDigits(confirmDigits, setConfirmDigits, confirmRefs)}
                </div>

                {/* Buttons */}
                <div style={{ display: "flex", gap: "10px" }}>
                  <button
                    type="button"
                    onClick={closeModal}
                    style={{
                      flex: 1, padding: "12px",
                      borderRadius: "12px",
                      border: "1px solid #e2e8f0",
                      background: "#fff",
                      fontWeight: 600, fontSize: "14px",
                      cursor: "pointer", color: "#475569",
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleSetPin()}
                    disabled={submitting}
                    style={{
                      flex: 1, padding: "12px",
                      borderRadius: "12px",
                      border: "none",
                      background: submitting ? "#93c5fd" : "#1a5fa8",
                      color: "#fff",
                      fontWeight: 700, fontSize: "14px",
                      cursor: submitting ? "not-allowed" : "pointer",
                      boxShadow: submitting ? "none" : "0 4px 12px rgba(26,95,168,0.3)",
                      transition: "background 0.15s",
                    }}
                  >
                    {submitting ? "Saving..." : "Confirm PIN"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: translateY(12px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
