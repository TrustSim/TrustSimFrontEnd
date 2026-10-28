import { apiClient, apiFetch } from "./apiClient";
import type {
  DisputeTicketDto,
  CreateDisputeRequest,
  ResolveDisputeRequest,
  DisputeFilter,
} from "@/types/dispute";
import type { PagedResult } from "@/types/common";
import { withQuery } from "./queryParams";

export const disputeService = {
  /** Lấy danh sách khiếu nại tranh chấp (có phân trang và lọc theo trạng thái) */
  async getDisputes(filter: DisputeFilter = {}): Promise<PagedResult<DisputeTicketDto>> {
    const res = await apiFetch<PagedResult<DisputeTicketDto>>(
      withQuery("/Disputes", {
        ...filter,
        status: filter.status === "all" ? undefined : filter.status,
        pageIndex: filter.pageIndex ?? 1,
        pageSize: filter.pageSize ?? 10,
      })
    );
    if (res.data) return res.data;
    throw new Error(res.message || "Không thể tải danh sách khiếu nại.");
  },

  /** Lấy chi tiết một khiếu nại tranh chấp theo ID */
  async getDisputeById(id: string): Promise<DisputeTicketDto> {
    const res = await apiFetch<DisputeTicketDto>(`/Disputes/${id}`);
    if (res.data) return res.data;
    throw new Error(res.message || "Không tìm thấy thông tin khiếu nại.");
  },

  /** Tạo yêu cầu khiếu nại / mở tranh chấp giao dịch */
  async createDispute(data: CreateDisputeRequest): Promise<DisputeTicketDto> {
    const res = await apiFetch<DisputeTicketDto>("/Disputes", {
      method: "POST",
      body: JSON.stringify(data),
    });
    if (res.data) return res.data;
    throw new Error(res.message || "Mở khiếu nại tranh chấp thất bại.");
  },

  /** [Admin] Phán quyết và giải quyết khiếu nại tranh chấp */
  async resolveDispute(id: string, data: ResolveDisputeRequest): Promise<boolean> {
    const res = await apiFetch<boolean>(`/Disputes/${id}/resolve`, {
      method: "POST",
      body: JSON.stringify(data),
    });
    if (res.data !== undefined) return res.data;
    return true;
  },

  /** [Admin] Xuất báo cáo khiếu nại và tranh chấp ra file Excel (.xlsx) */
  async exportDisputes(filter: DisputeFilter = {}): Promise<Blob> {
    const { pageIndex: _pageIndex, pageSize: _pageSize, ...exportFilter } = filter;
    const query = new URLSearchParams(Object.entries(exportFilter).filter(([, value]) => value !== undefined && value !== null && value !== "" && value !== "all").map(([key, value]) => [key, String(value)])).toString();
    const response = await apiClient.get<Blob>(
      `/api/Disputes/export${query ? `?${query}` : ""}`,
      { responseType: "blob" }
    );
    return response.data;
  },
};
