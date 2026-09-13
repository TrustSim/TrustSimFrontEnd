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
    itelecom: "#E4011E",
  };
  return map[carrierName.toLowerCase()] ?? "#001743";
}

// ─── My SIMs (Kho SIM sở hữu của tôi) ──────────────────────────────────────────

export interface MySimItemDto {
  id: string;
  phoneNumber: string;
  simStatus: SimStatus;
  carrierName: string;
  carrierCode: string;
  carrierLogo: string;
  prefixValue: string;
  formatRhythmName: string;
  categoryNames: string[];
  ownerId?: string;
  verificationStatus?: number | string;
  createdDate: string;
}

export interface RegisterSimPayload {
  phoneNumber: string;
  formatRhythmId: string;
  phonePrefixId?: string;
  categoryIds?: string[];
}

export interface FormatRhythmItemDto {
  id: string;
  formatRhythmName: string;
  value?: string;
  description?: string;
}

/**
 * Lấy danh sách SIM thuộc quyền sở hữu của người dùng hiện tại từ Database
 */
export async function getMySims(params: {
  pageIndex?: number;
  pageSize?: number;
  status?: SimStatus;
  search?: string;
} = {}): Promise<PagedResult<MySimItemDto>> {
  const query = new URLSearchParams();
  if (params.pageIndex) query.set("pageIndex", String(params.pageIndex));
  if (params.pageSize) query.set("pageSize", String(params.pageSize));
  if (params.status) query.set("status", params.status);
  if (params.search) query.set("search", params.search);

  const res = await apiFetch<PagedResult<MySimItemDto>>(`/sims/my-sims?${query.toString()}`);
  if (!res.data) {
    return {
      items: [],
      totalCount: 0,
      pageIndex: 1,
      pageSize: params.pageSize || 10,
      totalPages: 0,
      hasPreviousPage: false,
      hasNextPage: false,
    };
  }
  return res.data;
}

/**
 * Đăng ký số SIM cá nhân mới vào kho của người dùng
 */
export async function registerSim(payload: RegisterSimPayload): Promise<any> {
  const res = await apiFetch<any>("/sims/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (!res.data && !res.success) {
    throw new Error(res.message || "Đăng ký SIM không thành công.");
  }
  return res.data;
}

/**
 * Lấy danh sách các kiểu nhịp định dạng số SIM từ MasterData
 */
export async function getFormatRhythms(): Promise<FormatRhythmItemDto[]> {
  try {
    const res = await apiFetch<FormatRhythmItemDto[]>("/FormatRhythms");
    return res.data ?? [];
  } catch {
    return [];
  }
}

// ─── Admin SIM Management ───────────────────────────────────────────────────

export interface AdminSimItemDto {
  id: string;
  phoneNumber: string;
  simStatus: SimStatus;
  carrierName: string;
  carrierCode: string;
  carrierLogo: string;
  prefixValue: string;
  formatRhythmName: string;
  categoryNames: string[];
  ownerId?: string;
  ownerFullName?: string;
  ownerPhoneNumber?: string;
  verificationStatus?: number | string;
  createdDate: string;
}

export interface GetAdminSimsParams {
  pageIndex?: number;
  pageSize?: number;
  status?: SimStatus;
  carrierId?: string;
  categoryId?: string;
  search?: string;
}

export interface CreateAdminSimPayload {
  phoneNumber: string;
  phonePrefixId: string;
  formatRhythmId?: string;
  categoryIds?: string[];
}

export interface UpdateAdminSimPayload {
  simStatus: SimStatus;
  phonePrefixId: string;
  formatRhythmId?: string;
  categoryIds?: string[];
}

/**
 * Lấy danh sách toàn bộ kho SIM hệ thống dành cho Admin
 */
export async function getAdminSims(
  params: GetAdminSimsParams = {}
): Promise<PagedResult<AdminSimItemDto>> {
  const query = new URLSearchParams();
  if (params.pageIndex) query.set("pageIndex", String(params.pageIndex));
  if (params.pageSize) query.set("pageSize", String(params.pageSize));
  if (params.status) query.set("status", params.status);
  if (params.carrierId) query.set("carrierId", params.carrierId);
  if (params.categoryId) query.set("categoryId", params.categoryId);
  if (params.search) query.set("search", params.search);

  const res = await apiFetch<PagedResult<AdminSimItemDto>>(
    `/admin/sims?${query.toString()}`
  );
  if (!res.data) {
    return {
      items: [],
      totalCount: 0,
      pageIndex: 1,
      pageSize: params.pageSize || 10,
      totalPages: 0,
      hasPreviousPage: false,
      hasNextPage: false,
    };
  }
  return res.data;
}

/**
 * Tạo mới SIM trong kho hệ thống
 */
export async function createAdminSim(
  payload: CreateAdminSimPayload
): Promise<SimNumberDto> {
  const res = await apiFetch<SimNumberDto>("/admin/sims", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (!res.data) {
    throw new Error(res.message || "Không thể tạo SIM mới.");
  }
  return res.data;
}

/**
 * Cập nhật thông tin SIM
 */
export async function updateAdminSim(
  id: string,
  payload: UpdateAdminSimPayload
): Promise<SimNumberDto> {
  const res = await apiFetch<SimNumberDto>(`/admin/sims/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  if (!res.data) {
    throw new Error(res.message || "Không thể cập nhật SIM.");
  }
  return res.data;
}

/**
 * Xóa SIM khỏi hệ thống
 */
export async function deleteAdminSim(id: string): Promise<boolean> {
  const res = await apiFetch<boolean>(`/admin/sims/${id}`, {
    method: "DELETE",
  });
  return res.data ?? res.success ?? false;
}

/**
 * Nhập danh sách SIM từ tệp tin Excel
 */
export async function importAdminSims(
  file: File,
  autoVerify: boolean = false
): Promise<any> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("autoVerify", String(autoVerify));

  const res = await apiFetch<any>("/admin/sims/import", {
    method: "POST",
    body: formData,
  });
  return res.data;
}

