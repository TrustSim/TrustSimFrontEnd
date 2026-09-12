// ─── Wallet DTOs ──────────────────────────────────────────────────────────────

export interface WalletDto {
  id: string;
  userAccountId: string;
  availableBalance: number;
  lockedBalance: number;
  totalBalance: number;
  walletStatus: "ACTIVE" | "FROZEN" | "SUSPENDED";
  createdAt: string;
  updatedAt: string;
}

export type WalletTransactionType =
  | "DEPOSIT"
  | "WITHDRAWAL"
  | "AUCTION_LOCK"
  | "AUCTION_UNLOCK"
  | "AUCTION_PAYMENT"
  | "AUCTION_REFUND"
  | "ADJUSTMENT";

export type TransactionStatus =
  | "PENDING"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED";

export interface WalletTransactionDto {
  id: string;
  walletId: string;
  type: WalletTransactionType;
  status: TransactionStatus;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  note: string;
  referenceId?: string;
  createdAt: string;
  completedAt?: string;
}

export interface DepositResponseDto {
  transactionId: string;
  amount: number;
  transferContent: string;   // Nội dung chuyển khoản SePay
  bankAccountNumber: string;
  bankName: string;
  accountHolderName: string;
  qrCodeUrl: string;         // URL QR VietQR
  expiredAt: string;
}

export interface CreateDepositRequest {
  amount: number;
}

export interface CreateWithdrawRequest {
  amount: number;
  bankAccountNumber: string;
  bankName: string;
  accountHolderName: string;
  note?: string;
}

// ─── Admin Wallet DTOs ───────────────────────────────────────────────────────

export interface AdminWalletDetailDto {
  walletId: string;
  userId: string;
  userName: string;
  email: string;
  fullName: string;
  availableBalance: number;
  lockedBalance: number;
  totalBalance: number;
  walletStatus: "ACTIVE" | "FROZEN" | "SUSPENDED";
  createdAt: string;
}

export interface WalletTransactionFilter {
  type?: WalletTransactionType;
  status?: TransactionStatus;
  pageIndex?: number;
  pageSize?: number;
}

export interface AdminWalletFilter extends WalletTransactionFilter {
  keyword?: string;
  userId?: string;
  walletStatus?: "ACTIVE" | "FROZEN" | "SUSPENDED";
}
