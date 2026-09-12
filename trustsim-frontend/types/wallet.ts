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

export type WalletTransactionType = "TOP_UP" | "WITHDRAW" | string;

export type TransactionStatus =
  | "PENDING"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED";

export interface WalletTransactionDto {
  id: string;
  walletId: string;
  transactionCode: string;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  description?: string;
  qrCodeUrl?: string;
  destinationBankCode?: string;
  destinationBankName?: string;
  destinationAccountNumberMasked?: string;
  destinationAccountHolderName?: string;
  transactionStatus: TransactionStatus;
  walletTransactionType: WalletTransactionType;
  createdAt: string;
  completedAt?: string;
  expiredAt?: string;
}

export interface DepositResponseDto {
  transactionId: string;
  transactionCode: string;
  amount: number;
  transferContent: string;
  qrCodeUrl: string;
  expiredAt: string;
}

export interface CreateDepositRequest {
  amount: number;
  note?: string;
}

export interface CreateWithdrawRequest {
  amount: number;
  destinationBankCode: string;
  destinationBankName: string;
  destinationAccountNumber: string;
  destinationAccountHolderName: string;
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
