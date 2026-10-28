import type { BaseQueryFilter, LedgerJournalSortBy, WalletTransactionSortBy } from "./common";
import type { RevenueHistoryQueryFilter } from "./api-filters";

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
  | "SUCCESS"
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
  idempotencyKey?: string;
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

export interface WalletTransactionFilter extends BaseQueryFilter<WalletTransactionSortBy> {
  type?: WalletTransactionType;
  status?: TransactionStatus;
  minAmount?: number;
  maxAmount?: number;
}

export interface AdminWalletFilter extends WalletTransactionFilter {
  keyword?: string;
  userId?: string;
  walletId?: string;
  walletStatus?: "ACTIVE" | "FROZEN" | "SUSPENDED";
  minBalance?: number;
  maxBalance?: number;
}

export interface UnifiedWalletTransactionDto {
  id: string;
  source: "WALLET" | "AUCTION" | string;
  transactionType: string;
  direction: "CREDIT" | "DEBIT" | "LOCK" | string;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  status: string;
  referenceCode?: string;
  description?: string;
  createdAt: string;
}

export interface UnifiedStatementFilter extends BaseQueryFilter<WalletTransactionSortBy> {
  sourceType?: "WALLET" | "AUCTION" | "AUCTION_DEPOSIT" | "ESCROW" | "COMPENSATION";
  direction?: "CREDIT" | "DEBIT" | "LOCK";
  status?: "PENDING" | "SUCCESS" | "FAILED";
  transactionType?: string;
  minAmount?: number;
  maxAmount?: number;
}

export interface AdminWithdrawalFilter extends BaseQueryFilter<WalletTransactionSortBy> {
  userId?: string;
  walletId?: string;
  status?: "PENDING" | "SUCCESS" | "FAILED";
  minAmount?: number;
  maxAmount?: number;
}

export type AdminRevenueHistoryFilter = RevenueHistoryQueryFilter;

// ─── Ledger DTOs (aligned with backend response) ─────────────────────────────

/** Backend: LedgerEntryDto — một dòng bút toán Nợ/Có trong sổ cái */
export interface LedgerEntryDto {
  id: string;
  journalId: string;
  walletId?: string;
  /** Tên enum tài khoản kế toán (e.g. "USER_WALLET_1010") */
  accountType: string;
  accountTypeName: string;
  accountTypeCode: number;
  /** "DEBIT" | "CREDIT" */
  entryType: string;
  entryTypeName: string;
  /** Số tiền (luôn > 0, không phân biệt Nợ/Có) */
  amount: number;
  sequenceNumber: number;
  prevHash: string;
  entryHash: string;
  signature: string;
  createdAt: string;
  description?: string;
}

/** Backend: LedgerJournalDto — chứng từ kế toán ghi kép */
export interface LedgerJournalDto {
  id: string;
  journalCode: string;
  /** Enum string, e.g. "TOP_UP" | "WITHDRAW" | "ESCROW_LOCK" … */
  transactionType: string;
  transactionTypeName: string;
  referenceType?: string;
  referenceId?: string;
  idempotencyKey?: string;
  description?: string;
  /** Tổng giá trị giao dịch (Nợ = Có = totalAmount trong kế toán ghi kép) */
  totalAmount: number;
  status: string;
  statusName: string;
  signedHash?: string;
  postedAt: string;
  entries: LedgerEntryDto[];
}

/** Backend: AccountReconciliationDetail — đối soát từng tài khoản */
export interface AccountReconciliationDetail {
  accountCode: string;
  accountName: string;
  walletId?: string;
  ledgerCalculatedBalance: number;
  snapshotBalance: number;
  discrepancy: number;
  isBalanced: boolean;
}

/** Backend: ChainAnomalyDetail — chi tiết bất thường chuỗi hash */
export interface ChainAnomalyDetail {
  sequenceNumber: number;
  entryId: string;
  anomalyType: string;
  description: string;
  expectedValue: string;
  actualValue: string;
}

/** Backend: LedgerIntegrityReportDto — báo cáo kiểm toán toàn vẹn */
export interface LedgerIntegrityReportDto {
  isChainValid: boolean;
  isSignatureValid: boolean;
  isBalanceReconciled: boolean;
  isAccountingEquationBalanced: boolean;
  hasFraudDetected: boolean;
  isFraudDetected: boolean;
  fraudStatus: string;
  fraudAlertMessage: string;
  totalEntriesScanned: number;
  totalJournalsScanned: number;
  auditedAt: string;
  executionTimeMs: number;
  anomalies: ChainAnomalyDetail[];
  reconciliations: AccountReconciliationDetail[];
}

export interface LedgerJournalFilter extends BaseQueryFilter<LedgerJournalSortBy> {
  transactionType?: string;
  minAmount?: number;
  maxAmount?: number;
}

// ─── Payment Intent ──────────────────────────────────────────────────────────

export interface PaymentIntentDto {
  intentId: string;
  transactionId: string;
  transactionCode: string;
  amount: number;
  transferContent: string;
  qrCodeUrl: string;
  status: string;
  expiredAt: string;
  idempotencyKey: string;
}
