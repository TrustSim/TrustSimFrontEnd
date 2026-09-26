
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

export interface TradeFilter {
  status?: TradeTransactionStatus;
  pageIndex?: number;
  pageSize?: number;
}
