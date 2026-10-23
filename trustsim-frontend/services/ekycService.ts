import { apiFetch } from "./apiClient";
import { withQuery } from "./queryParams";
import type { BaseQueryFilter, KycSortBy, PagedResult } from "@/types/common";

export type VerificationStatus =
  | "PENDING_VERIFICATION"
  | "VERIFIED"
  | "REJECTED"
  | "EXPIRED"
  | number;

export interface IdentityVerificationDto {
  id: string;
  userProfileId: string;
  userAccountId: string;
  userName: string;
  fullName: string;
  identityNumber: string;
  frontIdCardUrl: string;
  backIdCardUrl: string;
  faceSelfieUrl: string;
  faceSimilarityScore?: number;
  verificationMethod?: string;
  verificationStatus: VerificationStatus;
  rejectionReason?: string;
  submittedAt: string;
  verifiedAt?: string;
  verifiedByUserName?: string;
}

export interface EkycVerificationResultDto {
  verificationId: string;
  userProfileId: string;
  verificationStatus: VerificationStatus;
  isAutoApproved: boolean;
  faceSimilarityScore: number;
  extractedFullName: string;
  extractedIdentityNumber: string;
  extractedDateOfBirth?: string;
  extractedAddress: string;
  frontCardUrl: string;
  backCardUrl: string;
  selfieUrl: string;
  message: string;
  submittedAt: string;
}

export const ekycService = {
  /**
   * Người dùng gửi hồ sơ eKYC tự động tích hợp AI AWS Rekognition (CCCD trước, CCCD sau, Selfie)
   */
  async submitEkyc(formData: FormData): Promise<EkycVerificationResultDto> {
    const res = await apiFetch<EkycVerificationResultDto>("/Users/kyc/submit-ekyc", {
      method: "POST",
      body: formData,
    });

    if (res.data) {
      return res.data;
    }
    throw new Error(res.message || "Gửi hồ sơ eKYC không thành công.");
  },

  /** Pha 2: chỉ gửi intent key, backend tự đọc dữ liệu OCR đã lưu để cập nhật hồ sơ. */
  async confirmEkyc(verificationId: string): Promise<boolean> {
    const res = await apiFetch<boolean>("/Users/kyc/confirm-ekyc", {
      method: "POST",
      body: JSON.stringify({ verificationId }),
    });
    if (res.success) return res.data ?? true;
    throw new Error(res.message || "Không thể xác nhận hồ sơ eKYC.");
  },

  /**
   * Lấy trạng thái hồ sơ KYC gần nhất của người dùng hiện tại
   */
  async getMyKycStatus(): Promise<IdentityVerificationDto | null> {
    try {
      const res = await apiFetch<IdentityVerificationDto>("/Users/kyc/status", {
        method: "GET",
      });
      return res.data || null;
    } catch {
      return null;
    }
  },

  /**
   * Lấy danh sách lịch sử tất cả các lần nộp hồ sơ KYC
   */
  async getMyKycHistoryPaged(
    filter: BaseQueryFilter<KycSortBy> = {}
  ): Promise<PagedResult<IdentityVerificationDto>> {
    const res = await apiFetch<PagedResult<IdentityVerificationDto>>(
      withQuery("/Users/kyc/history", {
        ...filter,
        pageIndex: filter.pageIndex ?? 1,
        pageSize: filter.pageSize ?? 20,
      }),
      { method: "GET" }
    );
    if (res.data) return res.data;
    return {
      items: [],
      pageIndex: filter.pageIndex ?? 1,
      pageSize: filter.pageSize ?? 20,
      totalCount: 0,
      totalPages: 0,
      hasPreviousPage: false,
      hasNextPage: false,
    };
  },

  async getMyKycHistory(): Promise<IdentityVerificationDto[]> {
    try {
      const res = await this.getMyKycHistoryPaged();
      return res.items;
    } catch {
      return [];
    }
  },

  /**
   * Kiểm tra xem hồ sơ eKYC hoặc mã trạng thái có phải là đã xác thực thành công không
   */
  isVerified(itemOrStatus?: IdentityVerificationDto | VerificationStatus | string | number | null): boolean {
    if (!itemOrStatus) return false;
    const val =
      typeof itemOrStatus === "object" && "verificationStatus" in itemOrStatus
        ? itemOrStatus.verificationStatus
        : itemOrStatus;

    if (val === undefined || val === null) return false;

    return (
      val === 1 || // Domain Enum VerificationStatus.VERIFIED = 1
      val === "VERIFIED" ||
      val === "Verified" ||
      val === "verified"
    );
  },
};
