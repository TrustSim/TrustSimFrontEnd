// Kết quả phân trang chuẩn từ backend (PagedResult<T>)
export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  pageIndex: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

// Phản hồi chung từ API
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  errors?: string[];
}

// DTO gửi OTP
export interface SendOtpResponseDto {
  isSuccess: boolean;
  message: string;
  cooldownSeconds: number;
  expiryMinutes: number;
}

// DTO xác thực OTP
export interface VerifyOtpResponseDto {
  isValid: boolean;
  message: string;
  phoneNumber?: string;
  email?: string;
}
