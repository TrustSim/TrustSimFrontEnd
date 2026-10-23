import type { BaseQueryFilter, TradeTransactionSortBy } from "./common";
export type TradeTransactionStatus =
  | "PendingEscrow"
  | "PendingSignature"
  | "PendingTransfer"
  | "Completed"
  | "Cancelled_EscrowTimeout"
  | "Cancelled_SigningTimeout"
  | "Cancelled_TransferTimeout"
  | "Cancelled_ByAdmin"
  | "Disputed"
  | string;

export type EscrowStatus =
  | "PENDING_FUNDING"
  | "HELD"
  | "FROZEN"
  | "RELEASED"
  | "REFUNDED"
  | "CANCELLED"
  | string;

export interface TradeTransactionDto {
  id: string;
  tradeTransactionCode: string;
  auctionId?: string;
  buyerId: string;
  buyerName?: string;
  sellerId: string;
  sellerName?: string;
  simNumberId: string;
  simPhoneNumber: string;
  escrowAmount: number;
  status: TradeTransactionStatus;
  escrowStatus: EscrowStatus;
  escrowDeadline: string;
  signingDeadline?: string;
  transferDeadline?: string;
  completedAt?: string;
  cancelledReason?: string;
  documentUrl?: string;
  documentHash?: string;
  blockchainTxHash?: string;
  contractStatus?: string;
  createdDate: string;
}

export interface CreateTradeTransactionRequest {
  sellerId: string;
  simNumberId: string;
  escrowAmount: number;
  auctionId?: string;
}

export interface TradeFilter extends BaseQueryFilter<TradeTransactionSortBy> {
  status?: TradeTransactionStatus;
  role?: "buyer" | "seller" | "all";
  buyerId?: string;
  sellerId?: string;
  minAmount?: number;
  maxAmount?: number;
}

export interface ContractPreviewDto {
  tradeId: string;
  tradeTransactionCode: string;
  htmlContent: string;
  buyerSigned: boolean;
  buyerSignedAt?: string;
  sellerSigned: boolean;
  sellerSignedAt?: string;
  isFullySigned: boolean;
  contractStatus: string;
  documentPdfUrl?: string;
  signingDeadline: string;
  documentHash?: string;
  padesSignatureSerial?: string;
  padesSignatureHash?: string;
  tsaTimestamp?: string;
  tsaAuthority?: string;
  isAutoEnforced?: boolean;
  sealedAt?: string;
  buyerIp?: string;
  buyerAuthMethod?: string;
  sellerIp?: string;
  sellerAuthMethod?: string;
}

export interface TransferProofDto {
  proofId?: string;
  documentType: string;
  proofDocumentUrl: string;
  uploadedAt: string;
  note?: string;
}

export interface SimTransferDetailsDto {
  tradeId: string;
  tradeTransactionCode: string;
  simTransferId?: string;
  simTransferStatus: string;
  startAt?: string;
  deadline?: string;
  cancelledReason?: string;
  isSeller: boolean;
  isBuyer: boolean;
  canSubmitProof: boolean;
  canConfirmTransfer: boolean;
  simPhoneNumber: string;
  proofs: TransferProofDto[];
  escrowAmount: number;
  escrowStatus: string;
  platformFeePercent: number;
  platformFeeAmount: number;
  netSellerPayout: number;
  completedAt?: string;
  message?: string;
}
