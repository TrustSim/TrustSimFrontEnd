import type { BaseQueryFilter, DisputeTicketSortBy } from "./common";

export type DisputeStatus =
  | "OPEN"
  | "INVESTIGATING"
  | "RESOLVED_FAVOR_SELLER"
  | "RESOLVED_FAVOR_BUYER";

export interface DisputeTicketDto {
  id: string;
  tradeTransactionId: string;
  complainantId: string;
  complainantName: string;
  reason: string;
  status: DisputeStatus;
  resolvedByAdminId?: string | null;
  adminResolutionNotes?: string | null;
  createdDate: string;
}

export interface CreateDisputeRequest {
  tradeTransactionId: string;
  reason: string;
}

export interface ResolveDisputeRequest {
  resolutionStatus: "RESOLVED_FAVOR_SELLER" | "RESOLVED_FAVOR_BUYER";
  resolutionNotes: string;
}

export interface DisputeFilter extends BaseQueryFilter<DisputeTicketSortBy> {
  status?: DisputeStatus | string;
  tradeId?: string;
}
