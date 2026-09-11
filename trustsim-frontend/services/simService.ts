import { apiFetch } from "./apiClient";
import { ApiResponse } from "@/types/auth";

// ─── Enums (mirror của SimStatus trong Backend) ───────────────────────────────
export type SimStatus =
  | "AVAILABLE"
  | "LISTED"
  | "IN_AUCTION"
  | "TRANFERING"
  | "TRANFERED"
  | "SUSPENED";

// ─── DTO (mirror của SimNumberDto trong Backend) ──────────────────────────────
export interface SimNumberDto {
  id: string;
  phoneNumber: string;
  simStatus: SimStatus;
  phonePrefixId: string;
  prefixValue: string;
  carrierName: string;
  carrierLogo: string;
  formatRhythmId: string;
  categoryNames: string[];
  createdDate: string;
}

// ─── Paged Result (mirror của PagedResult<T> trong Backend) ───────────────────
export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  pageIndex: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

// ─── Request params ───────────────────────────────────────────────────────────
export interface GetSimsParams {
  keyword?: string;
  carrierId?: string;
  categoryId?: string;
  prefixId?: string;
  status?: SimStatus;
  pageIndex?: number;
  pageSize?: number;
}

// ─── API calls ────────────────────────────────────────────────────────────────
export async function getSims(
  params: GetSimsParams = {}
): Promise<PagedResult<SimNumberDto>> {
  const query = new URLSearchParams();
  if (params.keyword) query.set("keyword", params.keyword);
  if (params.carrierId) query.set("carrierId", params.carrierId);
  if (params.categoryId) query.set("categoryId", params.categoryId);
  if (params.prefixId) query.set("prefixId", params.prefixId);
  if (params.status) query.set("status", params.status);
  query.set("pageIndex", String(params.pageIndex ?? 1));
  query.set("pageSize", String(params.pageSize ?? 20));

  const res = await apiFetch<PagedResult<SimNumberDto>>(
    `/Sims?${query.toString()}`
  );
  if (!res.data) {
    throw new Error(res.message || "Không thể tải danh sách SIM.");
  }
  return res.data;
}

export async function getSimById(id: string): Promise<SimNumberDto> {
  const res = await apiFetch<SimNumberDto>(`/Sims/${id}`);
  if (!res.data) {
    throw new Error(res.message || "Không thể tải thông tin SIM.");
  }
  return res.data;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Format số điện thoại 10 chữ số thành dạng 0XXX XXX XXX
 */
export function formatPhoneNumber(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) {
    return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
  }
  return phone;
}

/**
 * Map SimStatus sang nhãn tiếng Việt
 */
export function getSimStatusLabel(status: SimStatus): string {
  const map: Record<SimStatus, string> = {
    AVAILABLE: "Đang bán",
    LISTED: "Đã niêm yết",
    IN_AUCTION: "Đang đấu giá",
    TRANFERING: "Đang chuyển nhượng",
    TRANFERED: "Đã chuyển nhượng",
    SUSPENED: "Tạm khóa",
  };
  return map[status] ?? status;
}

/**
 * Map tên nhà mạng sang màu thương hiệu
 */
export function getCarrierColor(carrierName: string): string {
  const map: Record<string, string> = {
    viettel: "#E4011E",
    mobifone: "#005BAA",
    vinaphone: "#00A3E0",
    vietnamobile: "#FF6600",
    wintel: "#6B21A8",
  };
  return map[carrierName.toLowerCase()] ?? "#001743";
}
