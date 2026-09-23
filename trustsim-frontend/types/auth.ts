export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: string[];
  timestamp?: string;
}

export interface LoginRequest {
  userNameOrEmail: string;
  password: string;
}

export interface RegisterRequest {
  userName: string;
  email: string;
  password: string;
}

export interface RegisterInitiatedDto {
  email: string;
  message: string;
  cooldownSeconds: number;
  expiryMinutes: number;
}

export interface VerifyEmailRequest {
  email: string;
  otpCode: string;
}

export interface AuthResponseDto {
  userId: string;
  userName: string;
  email: string;
  fullName: string;
  phoneNumber: string;
  role: "ADMIN" | "STAFF" | "USER" | string;
  avatarImg?: string;
  token: string;
  expiresAt: string;
}

export interface WalletDto {
  id: string;
  availableBalance: number;
  lockedBalance: number;
  walletStatus: string;
}

export interface UserProfileDto {
  id: string;
  userAccountId: string;
  userName: string;
  email: string;
  fullName: string;
  phoneNumber: string;
  identityNumber: string;
  dateOfBirth?: string;
  address?: string;
  avatarImg?: string;
  role: string;
  verificationStatus: "UNVERIFIED" | "PENDING_VERIFICATION" | "VERIFIED" | "REJECTED" | string;
  wallet?: WalletDto;
}
