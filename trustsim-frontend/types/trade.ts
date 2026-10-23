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
  escrowDeadline?: string | null;
  signingDeadline?: string | null;
  transferDeadline?: string | null;
  liquidationDeadline?: string | null;
  completedAt?: string | null;
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
  buyerSignedAt?: string | null;
  sellerSigned: boolean;
  sellerSignedAt?: string | null;
  isFullySigned: boolean;
  contractStatus: string;
  documentPdfUrl?: string | null;
  signingDeadline?: string | null;
  documentHash?: string | null;
  padesSignatureSerial?: string | null;
  padesSignatureHash?: string | null;
  tsaTimestamp?: string | null;
  tsaAuthority?: string | null;
  isAutoEnforced?: boolean;
  sealedAt?: string | null;
  buyerIp?: string | null;
  buyerAuthMethod?: string | null;
  sellerIp?: string | null;
  sellerAuthMethod?: string | null;
  simPhoneNumber?: string | null;
  escrowAmount?: number | null;
  buyerName?: string | null;
  sellerName?: string | null;
  winningNoticeUrl?: string | null;
  winningNoticeHash?: string | null;
  liquidationDocumentUrl?: string | null;
  liquidationDocumentHash?: string | null;
  liquidationSealedAt?: string | null;
  transferDeadline?: string | null;
  liquidationDeadline?: string | null;
}

export interface TransferProofDto {
  id: string;
  imageUrl: string;
  description?: string | null;
  proofStatus: string;
  verifiedAt: string;
  createdDate: string;
}

export interface SimTransferDetailsDto {
  tradeId: string;
  tradeTransactionCode: string;
  simTransferId?: string;
  simTransferStatus: string;
  startAt?: string | null;
  deadline?: string | null;
  cancelledReason?: string | null;
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
  completedAt?: string | null;
  message?: string | null;
}

export interface LiquidationPreviewDto {
  tradeId: string;
  tradeTransactionCode: string;
  htmlContent: string;
  liquidationDocumentUrl?: string | null;
  liquidationDocumentHash?: string | null;
  liquidationSealedAt?: string | null;
  isCompleted: boolean;
  simPhoneNumber: string;
  escrowAmount: number;
  buyerName: string;
  sellerName: string;
  transferDeadline?: string | null;
  liquidationDeadline?: string | null;
}

export interface SignContractResultDto {
  tradeId: string;
  tradeTransactionCode: string;
  signatureRole: "BUYER" | "SELLER" | string;
  signedAt: string;
  isFullySigned: boolean;
  contractStatus: string;
  message: string;
}

export interface VerifyContractIntegrityResponse {
  isValid: boolean;
  documentStatus: string;
  expectedDocumentHash?: string | null;
  providedSha256?: string | null;
  hashMatched: boolean;
  padesSignatureSerial?: string | null;
  padesSignatureHash?: string | null;
  tsaTimestamp?: string | null;
  tsaAuthority?: string | null;
  sealedAt?: string | null;
  isAutoEnforced: boolean;
  totalSignatures: number;
  message: string;
}
