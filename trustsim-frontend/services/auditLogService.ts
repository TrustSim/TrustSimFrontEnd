import { apiFetch } from "./apiClient";
import { withQuery } from "./queryParams";
import type { BaseQueryFilter, PagedResult } from "@/types/common";

export interface AuditLogDto {
  id: string;
  auditLogName: string;
  actionType: "CREATE" | "UPDATE" | number | string;
  entityName: string;
  entityId: string;
  actorId: string;
  actorName: string;
  ipAddress: string;
  oldData?: string;
  newData?: string;
  createdDate: string;
}

export interface AuditLogFilter extends BaseQueryFilter<number> {
  entityName?: string;
  entityId?: string;
  actorId?: string;
  actionType?: "CREATE" | "UPDATE" | string;
}

export async function getAuditLogs(filter: AuditLogFilter = {}): Promise<PagedResult<AuditLogDto>> {
  const pageIndex = filter.pageIndex ?? 1;
  const pageSize = filter.pageSize ?? 15;
  const response = await apiFetch<PagedResult<AuditLogDto>>(withQuery("/AuditLogs", { ...filter, pageIndex, pageSize }));
  return response.data || { items: [], pageIndex, pageSize, totalCount: 0, totalPages: 0, hasPreviousPage: false, hasNextPage: false };
}
