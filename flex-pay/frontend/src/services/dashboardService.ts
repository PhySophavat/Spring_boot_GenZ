export interface DashboardSummary {
  totalUsdBalance: number;
  totalKhrBalance: number;
  totalTransactionsCount: number;
  todayPaymentsCount: number;
  todayPaymentsAmountUsd: number;
  todayPaymentsAmountKhr: number;
}

export interface TransactionInfo {
  sender?: any;
  id: number;
  referenceNumber: string;
  senderWalletNumber: string;
  senderName: string;
  receiverWalletNumber: string;
  receiverName: string;
  amount: number;
  fee: number;
  totalAmount: number;
  note: string;
  transactionType: string;
  currency: string;
  status: string;
  createdAt: string;
}

export async function fetchDashboardSummary(): Promise<DashboardSummary> {
  const response = await fetch("/api/admin/dashboard/summary");
  if (!response.ok) {
    throw new Error(`Failed to load dashboard summary (HTTP ${response.status})`);
  }
  return response.json() as Promise<DashboardSummary>;
}

export async function fetchTransactions(currency?: string, status?: string): Promise<TransactionInfo[]> {
  const params = new URLSearchParams();
  if (currency && currency !== "ALL") params.append("currency", currency);
  if (status && status !== "ALL") params.append("status", status);

  const response = await fetch(`/api/admin/dashboard/transactions?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`Failed to load transactions (HTTP ${response.status})`);
  }
  return response.json() as Promise<TransactionInfo[]>;
}
