export interface WalletInfo {
  id: number;
  userId: number;
  walletId: string;
  walletNumber: string;
  fullName: string;
  usdBalance: number;
  khrBalance: number;
  status: string;
  hasPin: boolean;
}
