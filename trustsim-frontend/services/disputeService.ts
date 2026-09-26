import { apiFetch } from "./apiClient";
import type {
  DisputeTicketDto,
  CreateDisputeRequest,
  ResolveDisputeRequest,
  DisputeFilter,
} from "@/types/dispute";
import type { PagedResult } from "@/types/common";

export const disputeService = {
  /** Lấy danh sách khiếu nại tranh chấp (có phân trang và lọc theo trạng thái) */
  async getDisputes(filter: DisputeFilter = {}): Promise<PagedResult<DisputeTicketDto>> {
    const params = new URLSearchParams();
    if (filter.status && filter.status !== "all") params.set("status", filter.status);
    if (filter.pageIndex) params.set("pageIndex", String(filter.pageIndex));
    if (filter.pageSize) params.set("pageSize", String(filter.pageSize));

    const res = await apiFetch<PagedResult<DisputeTicketDto>>(
      `/Disputes?${params.toString()}`
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
  async exportDisputes(status?: string): Promise<Blob> {
    const params = new URLSearchParams();
    if (status && status !== "all") params.set("status", status);

    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("accessToken") ||
          localStorage.getItem("trustsim_token")
        : null;

    const baseUrl =
      process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, "") ||
      "http://localhost:5130";

    const response = await fetch(
      `${baseUrl}/api/Disputes/export?${params.toString()}`,
      {
        headers: { Authorization: token ? `Bearer ${token}` : "" },
      }
    );

    if (!response.ok) {
      throw new Error("Không thể tải file xuất Excel khiếu nại.");
    }
    return response.blob();
  },
};
