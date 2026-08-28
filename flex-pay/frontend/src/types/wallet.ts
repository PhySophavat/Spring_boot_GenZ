export interface WalletInfo {
  id: number;
  userId: number;
  walletId: string;
  walletNumber: string;
  fullName: string;
  phoneNumber?: string;
  usdBalance: number;
  khrBalance: number;
  savingsBalance?: number;
  savingsKhrBalance?: number;
  goalUsdBalance?: number;
  goalKhrBalance?: number;
  status: string;
  hasPin: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface WalletSummary {
  usdBalance: number;
  khrBalance: number;
}

export interface SavingSummary {
  savingUsd: number;
  savingKhr: number;
}

export interface GoalSummary {
  goalUsd: number;
  goalKhr: number;
}

export interface NotificationSummary {
  unreadCount: number;
  latestNotificationTime: string;
}

export type PinFilter = "ALL" | "SET" | "NOT_SET";
export type BalanceFilter = "ALL" | "POSITIVE" | "ZERO";
export type CurrencyFilter = "BOTH" | "USD" | "KHR";
