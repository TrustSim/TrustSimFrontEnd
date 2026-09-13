import { apiFetch } from "./apiClient";

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
  verificationId?: string;
  status?: string;
  message?: string;
  faceSimilarityScore?: number;
  fullName?: string;
  identityNumber?: string;
  dateOfBirth?: string;
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
  async getMyKycHistory(): Promise<IdentityVerificationDto[]> {
    try {
      const res = await apiFetch<IdentityVerificationDto[]>("/Users/kyc/history", {
        method: "GET",
      });
      return res.data || [];
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
      val === 2 || // Sometimes 2 in UI enums
      val === "VERIFIED" ||
      val === "Verified" ||
      val === "verified"
    );
  },
};
