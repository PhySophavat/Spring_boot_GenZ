import type { WalletInfo } from "../types/wallet";

const WALLETS_API_PATH = "/api/wallets";

export async function fetchWallets(): Promise<WalletInfo[]> {
  const response = await fetch(`${WALLETS_API_PATH}`);
  if (!response.ok) {
    throw new Error(`Failed to load wallets (HTTP ${response.status})`);
  }
  return response.json() as Promise<WalletInfo[]>;
}

export async function setUserPin(userId: number, pin: string): Promise<void> {
  const response = await fetch(`${WALLETS_API_PATH}/${userId}/set-pin`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pin, confirmPin: pin }),
  });
  if (!response.ok) {
    const message = await response.text().catch(() => "Unknown error");
    throw new Error(message || `HTTP ${response.status}`);
  }
}
