import type { PagedResult } from "./common";

export type TradeTransactionStatus =
  | "PendingEscrow"
  | "EscrowFunded"
  | "ContractSigned"
  | "SimTransferred"
  | "Completed"
  | "Disputed"
  | "Cancelled";

export type EscrowStatus =
  | "PENDING_FUNDING"
  | "HELD"
  | "RELEASED_TO_SELLER"
  | "REFUNDED_TO_BUYER"
  | "PARTIALLY_RELEASED"
  | "DISPUTED";

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
