import type { BaseQueryFilter } from "./common";

export enum DocumentSortBy {
  CreatedDate = 1,
  DocumentName = 2,
  TotalChunks = 3,
  TotalTokens = 4,
  Status = 5,
}

export enum ConsultationSessionSortBy {
  CreatedDate = 1,
  SessionTitle = 2,
}

export enum ConsultationMessageSortBy {
  CreatedDate = 1,
}

export enum BidSortBy {
  BidAmount = 1,
  PlacedAt = 2,
}

export enum SimValuationSortBy {
  CreatedDate = 1,
  SuggestedPrice = 2,
  ConfidenceScore = 3,
}

export enum PendingSettlementSortBy {
  Deadline = 1,
  RemainingPaymentRequired = 2,
  FinalPrice = 3,
}

export interface UnifiedStatementQueryFilter extends BaseQueryFilter<number> {
  sourceType?: "WALLET" | "AUCTION" | "AUCTION_DEPOSIT" | "ESCROW" | "COMPENSATION";
  direction?: "CREDIT" | "DEBIT" | "LOCK";
  status?: "PENDING" | "SUCCESS" | "FAILED";
  transactionType?: string;
  minAmount?: number;
  maxAmount?: number;
}

export interface RevenueHistoryQueryFilter extends BaseQueryFilter<number> {
  transactionType?: "ESCROW_RELEASE" | "AUCTION_DEPOSIT_FORFEITED" | "ADMIN_PROFIT_WITHDRAW";
}

export interface DocumentQueryFilter extends BaseQueryFilter<DocumentSortBy> {
  status?: "PENDING" | "CRAWLING" | "PROCESSING" | "INDEXED" | "FAILED";
  documentType?: "MARKET_RESEARCH" | "FENG_SHUI_RULE" | "PRICING_GUIDELINE" | "GENERAL";
  activeOnly?: boolean;
}

export type ConsultationSessionQueryFilter = BaseQueryFilter<ConsultationSessionSortBy>;

export interface ConsultationMessageQueryFilter extends BaseQueryFilter<ConsultationMessageSortBy> {
  senderRole?: "USER" | "ASSISTANT";
}

export interface AuctionBidQueryFilter extends BaseQueryFilter<BidSortBy> {
  status?: "VALID" | "OUTBID" | "CANCELLED";
  minBidAmount?: number;
  maxBidAmount?: number;
}

export interface SimValuationQueryFilter extends BaseQueryFilter<SimValuationSortBy> {
  appliedToSim?: boolean;
  aiModelName?: string;
}

export interface PendingSettlementQueryFilter extends BaseQueryFilter<PendingSettlementSortBy> {
  role?: "WINNER" | "RUNNER_UP" | "SELLER";
  actionRequired?: "PAY_SETTLEMENT" | "RESPOND_RUNNER_UP_OFFER" | "DECIDE_RUNNER_UP";
}

export interface UserKycHistoryQueryFilter extends BaseQueryFilter<number> {
  status?: "PENDING_VERIFICATION" | "VERIFIED" | "REJECTED" | "EXPIRED";
  idCardNumber?: string;
}

export interface AdminWithdrawalQueryFilter extends BaseQueryFilter<number> {
  userId?: string;
  walletId?: string;
  status?: "PENDING" | "SUCCESS" | "FAILED";
  minAmount?: number;
  maxAmount?: number;
}

export interface AdminWalletTransactionsFilter extends AdminWithdrawalQueryFilter {
  type?: "TOP_UP" | "WITHDRAW";
}
