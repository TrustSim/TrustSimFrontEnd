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

// ─── Ledger DTOs ─────────────────────────────────────────────────────────────

export interface LedgerEntryDto {
  id: string;
  accountCode: string;
  accountName: string;
  debitAmount: number;
  creditAmount: number;
  entryType: "DEBIT" | "CREDIT";
  description?: string;
  hash?: string;
  previousHash?: string;
  digitalSignature?: string;
  sequence: number;
}

export interface LedgerJournalDto {
  id: string;
  journalCode: string;
  transactionType: string;
  description?: string;
  totalDebit: number;
  totalCredit: number;
  isBalanced: boolean;
  hash?: string;
  previousHash?: string;
  digitalSignature?: string;
  isSignatureValid?: boolean;
  sequence: number;
  createdAt: string;
  entries?: LedgerEntryDto[];
}

export interface UserBalanceAuditDto {
  userId: string;
  userName: string;
  ledgerBalance: number;
  materializedBalance: number;
  discrepancy: number;
  isMatch: boolean;
}

export interface LedgerIntegrityReportDto {
  isChainValid: boolean;
  isSignatureValid: boolean;
  totalEntriesScanned: number;
  totalUsersAudited: number;
  discrepanciesFound: number;
  firstBrokenSequence?: number;
  totalDebit: number;
  totalCredit: number;
  netBalance: number;
  userAudits?: UserBalanceAuditDto[];
  generatedAt: string;
}

export interface LedgerJournalFilter {
  transactionType?: string;
  fromDate?: string;
  toDate?: string;
  pageIndex?: number;
  pageSize?: number;
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
