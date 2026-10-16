import { apiFetch } from "./apiClient";

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
  price?: number;
  carrierName: string;
  carrierCode: string;
  carrierLogo: string;
  phonePrefixId?: string;
  prefixValue: string;
  formatRhythmId?: string;
  formatRhythmName: string;
  categoryNames: string[];
  ownerId?: string;
  verificationStatus?: number | string;
  activeAuctionId?: string;
  createdDate: string;
}

export interface RegisterSimPayload {
  phoneNumber: string;
  formatRhythmId: string;
  phonePrefixId?: string;
  categoryIds?: string[];
  price?: number;
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
 * Đăng ký số SIM cá nhân mới vào kho:
 * Thay vì lưu SIM chưa kiểm soát (/sims/register), hệ thống kích hoạt quy trình xác thực chính chủ OTP 2 bước:
 * - Bước 1: Gửi mã OTP xác thực qua SMS (/Sims/ownership-verification/send-otp)
 * - Bước 2: Xác nhận OTP và đối soát nhà mạng qua verifySimOwnership(phoneNumber, otpCode)
 */
export async function registerSim(payload: RegisterSimPayload): Promise<SendOtpResponseDto> {
  return sendSimOwnershipOtp(payload.phoneNumber);
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
  price?: number;
  carrierName: string;
  carrierCode: string;
  carrierLogo: string;
  prefixValue: string;
  formatRhythmId?: string;
  formatRhythmName: string;
  categoryNames: string[];
  ownerId?: string;
  ownerFullName?: string;
  ownerPhoneNumber?: string;
  verificationStatus?: number | string;
  activeAuctionId?: string;
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
    `/sims/admin?${query.toString()}`
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
  const res = await apiFetch<SimNumberDto>("/sims", {
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
  const res = await apiFetch<SimNumberDto>(`/sims/${id}`, {
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
  const res = await apiFetch<boolean>(`/sims/${id}`, {
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

  const res = await apiFetch<any>("/sims/import", {
    method: "POST",
    body: formData,
  });
  return res.data;
}

// ─── Ownership Verification & User SIM Management ────────────────────────────

export interface SendOtpResponseDto {
  isSuccess: boolean;
  message: string;
  cooldownSeconds: number;
  expiryMinutes: number;
}

export interface SimOwnershipVerificationResultDto {
  isSuccess: boolean;
  simNumberId: string;
  simOwnershipId: string;
  simVerificationId: string;
  phoneNumber: string;
  price: number;
  formatRhythmId?: string;
  carrierName: string;
  carrierCode: string;
  simStatus: SimStatus;
  ownershipStatus: number | string;
  verificationStatus: number | string;
  verifiedAt: string;
  message: string;
}

export interface SimOwnershipDto {
  id: string;
  simNumberId: string;
  phoneNumber: string;
  price: number;
  formatRhythmId?: string;
  formatRhythmName?: string;
  simStatus: SimStatus;
  carrierName: string;
  carrierCode: string;
  carrierLogo: string;
  ownershipStatus: number | string;
  verificationStatus: number | string;
  verifiedAt?: string;
  createdDate: string;
}

export interface SimDetailDto {
  id: string;
  phoneNumber: string;
  simStatus: SimStatus;
  simStatusName?: string;
  price: number;
  phonePrefixId?: string;
  prefixValue?: string;
  carrierId?: string;
  carrierName: string;
  carrierCode: string;
  carrierLogo: string;
  formatRhythmId?: string;
  formatRhythmName?: string;
  formatRhythmValue?: string;
  categories?: { id: string; categoryName: string; description?: string }[];
  ownerId?: string;
  ownerUserName?: string;
  ownerFullName?: string;
  ownerEmail?: string;
  ownerPhoneNumber?: string;
  ownershipStatus?: number | string;
  verificationStatus?: number | string;
  rejectionReason?: string;
  createdDate: string;
  updatedDate?: string;
}

export interface UpdateSimPayload {
  simStatus?: SimStatus;
  phonePrefixId?: string;
  formatRhythmId?: string;
  categoryIds?: string[];
  price?: number;
}

/**
 * [API 1: Proof of Possession] Gửi mã xác thực OTP qua SMS tới số SIM người dùng muốn xác thực quyền sở hữu.
 */
export async function sendSimOwnershipOtp(phoneNumber: string): Promise<SendOtpResponseDto> {
  const cleanPhone = phoneNumber.replace(/\D/g, "");
  const res = await apiFetch<SendOtpResponseDto>("/Sims/ownership-verification/send-otp", {
    method: "POST",
    body: JSON.stringify({ phoneNumber: cleanPhone }),
  });
  if (!res.data && !res.success) {
    throw new Error(res.message || "Không thể gửi mã xác thực OTP. Vui lòng thử lại sau.");
  }
  return res.data || { isSuccess: true, message: res.message || "Đã gửi mã OTP", cooldownSeconds: 60, expiryMinutes: 5 };
}

/**
 * [API 2: Proof of Legal Ownership] Xác thực mã OTP SMS và đối soát quyền sở hữu chính chủ với Cổng viễn thông Nhà mạng.
 */
export async function verifySimOwnership(phoneNumber: string, otpCode: string): Promise<SimOwnershipVerificationResultDto> {
  const cleanPhone = phoneNumber.replace(/\D/g, "");
  const cleanOtp = otpCode.trim();
  const res = await apiFetch<SimOwnershipVerificationResultDto>("/Sims/ownership-verification/verify", {
    method: "POST",
    body: JSON.stringify({ phoneNumber: cleanPhone, otpCode: cleanOtp }),
  });
  if (!res.data) {
    throw new Error(res.message || "Xác thực quyền sở hữu SIM không thành công.");
  }
  return res.data;
}

/**
 * Lấy danh sách các số SIM đang thuộc quyền sở hữu của người dùng hiện tại kèm trạng thái xác minh.
 */
export async function getMyOwnerships(): Promise<SimOwnershipDto[]> {
  const res = await apiFetch<SimOwnershipDto[]>("/Sims/my-ownerships");
  return res.data || [];
}

/**
 * Xem thông tin chi tiết một số SIM theo ID
 */
export async function getSimDetail(id: string): Promise<SimDetailDto> {
  const res = await apiFetch<SimDetailDto>(`/Sims/${id}`);
  if (!res.data) {
    throw new Error(res.message || "Không tìm thấy thông tin chi tiết số SIM.");
  }
  return res.data;
}

/**
 * Cập nhật số SIM (Chủ sở hữu hoặc Admin)
 */
export async function updateSim(id: string, payload: UpdateSimPayload): Promise<SimNumberDto> {
  const res = await apiFetch<SimNumberDto>(`/Sims/${id}`, {
    method: "PUT",
    body: JSON.stringify({ id, ...payload }),
  });
  if (!res.data) {
    throw new Error(res.message || "Không thể cập nhật số SIM.");
  }
  return res.data;
}

/**
 * Xóa số SIM khỏi kho của người dùng
 */
export async function deleteSim(id: string): Promise<boolean> {
  const res = await apiFetch<boolean>(`/Sims/${id}`, {
    method: "DELETE",
  });
  return res.data ?? res.success ?? false;
}


