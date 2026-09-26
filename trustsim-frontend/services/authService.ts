import { apiFetch } from "./apiClient";
import {
  AuthResponseDto,
  LoginRequest,
  RegisterRequest,
  RegisterInitiatedDto,
  VerifyEmailRequest,
  UserProfileDto,
} from "@/types/auth";
import type { SendOtpResponseDto, VerifyOtpResponseDto } from "@/types/common";

const TOKEN_KEY = "trustsim_token";
const USER_KEY = "trustsim_user";

export const authService = {
  /**
   * Bước 1 Đăng ký: Gửi thông tin (userName, email, password), hệ thống lưu tạm và gửi Email OTP.
   * Chưa tạo tài khoản vào DB ở bước này.
   */
  async register(data: RegisterRequest): Promise<RegisterInitiatedDto> {
    const res = await apiFetch<RegisterInitiatedDto>("/Auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    });

    if (res.data) return res.data;
    throw new Error(res.message || "Đăng ký không thành công");
  },

  /**
   * Bước 2 Đăng ký: Xác thực Email OTP. Hệ thống tạo tài khoản, Wallet, thiết lập HttpOnly Cookies và tự động đăng nhập.
   */
  async verifyEmail(data: VerifyEmailRequest): Promise<AuthResponseDto> {
    const res = await apiFetch<AuthResponseDto>("/Auth/verify-email", {
      method: "POST",
      body: JSON.stringify(data),
    });

    if (res.data) {
      this.saveSession(res.data);
      return res.data;
    }
    throw new Error(res.message || "Xác thực email không thành công");
  },

  /**
   * Đăng nhập hệ thống (Backend tự động ghi HttpOnly Cookies accessToken & refreshToken)
   */
  async login(data: LoginRequest): Promise<AuthResponseDto> {
    const res = await apiFetch<AuthResponseDto>("/Auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    });

    if (res.data) {
      this.saveSession(res.data);
      return res.data;
    }
    throw new Error(res.message || "Đăng nhập không thành công");
  },

  /**
   * Làm mới Access Token thủ công qua Refresh Token Cookie
   */
  async refreshToken(): Promise<AuthResponseDto> {
    const res = await apiFetch<AuthResponseDto>("/Auth/refresh-token", {
      method: "POST",
      body: JSON.stringify({}),
    });

    if (res.data) {
      this.saveSession(res.data);
      return res.data;
    }
    throw new Error(res.message || "Làm mới phiên đăng nhập thất bại");
  },

  /**
   * Đăng xuất khỏi hệ thống (Gọi API Backend để xóa HttpOnly Cookies và thu hồi Refresh Token)
   */
  async logout(): Promise<void> {
    try {
      await apiFetch("/Auth/logout", {
        method: "POST",
        body: JSON.stringify({}),
      });
    } catch {
      // Vẫn tiếp tục xóa phiên ở client nếu API gặp lỗi mạng
    } finally {
      this.clearSession();
    }
  },

  /**
   * Lấy thông tin hồ sơ của người dùng đang đăng nhập qua HttpOnly Cookie
   */
  async getProfile(): Promise<UserProfileDto> {
    const res = await apiFetch<UserProfileDto>("/Auth/profile", {
      method: "GET",
    });

    if (res.data) {
      return res.data;
    }
    throw new Error(res.message || "Không thể tải thông tin hồ sơ");
  },

  /**
   * Cập nhật hồ sơ cá nhân
   */
  async updateProfile(data: {
    fullName: string;
    dateOfBirth?: string;
    address?: string;
    identityNumber: string;
    phoneNumber: string;
  }): Promise<UserProfileDto> {
    const res = await apiFetch<UserProfileDto>("/Auth/profile", {
      method: "PUT",
      body: JSON.stringify(data),
    });

    if (res.data) {
      const current = this.getUser();
      if (current) {
        this.saveSession({
          ...current,
          fullName: res.data.fullName,
          phoneNumber: res.data.phoneNumber,
        });
      }
      return res.data;
    }
    throw new Error(res.message || "Cập nhật hồ sơ không thành công");
  },

  /**
   * Cập nhật ảnh đại diện Avatar qua Backend API và đồng bộ session
   */
  async updateAvatar(avatarUrl: string): Promise<string> {
    const res = await apiFetch<string>("/Auth/avatar", {
      method: "PUT",
      body: JSON.stringify({ avatarUrl }),
    });

    if (res.data !== undefined) {
      const current = this.getUser();
      if (current) {
        this.saveSession({
          ...current,
          avatarImg: res.data,
        });
      }
      return res.data;
    }
    throw new Error(res.message || "Cập nhật ảnh đại diện không thành công");
  },

  /**
   * Đổi mật khẩu
   */
  async changePassword(data: {
    currentPassword: string;
    newPassword: string;
    confirmNewPassword: string;
  }): Promise<boolean> {
    const res = await apiFetch<boolean>("/Auth/change-password", {
      method: "PUT",
      body: JSON.stringify(data),
    });
    return res.success;
  },

  /**
   * Lưu phiên đăng nhập người dùng vào LocalStorage (Token dự phòng + Thông tin hiển thị)
   */
  saveSession(authData: AuthResponseDto) {
    if (typeof window === "undefined") return;
    if (authData.token) {
      localStorage.setItem(TOKEN_KEY, authData.token);
      localStorage.setItem("accessToken", authData.token);
    }
    localStorage.setItem(USER_KEY, JSON.stringify(authData));

    // Bắn sự kiện để Navbar và các component đồng bộ giao diện
    window.dispatchEvent(new Event("trustsim_auth_change"));
  },

  /**
   * Xóa phiên đăng nhập ở LocalStorage
   */
  clearSession() {
    if (typeof window === "undefined") return;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem("accessToken");
    localStorage.removeItem(USER_KEY);

    window.dispatchEvent(new Event("trustsim_auth_change"));
  },

  /**
   * Lấy User hiện tại đang đăng nhập từ LocalStorage
   */
  getUser(): AuthResponseDto | null {
    if (typeof window === "undefined") return null;
    const json = localStorage.getItem(USER_KEY);
    if (!json) return null;
    try {
      return JSON.parse(json) as AuthResponseDto;
    } catch {
      return null;
    }
  },

  /**
   * Lấy JWT Token dự phòng
   */
  getToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("accessToken") || localStorage.getItem(TOKEN_KEY);
  },

  /**
   * Giải mã JWT payload an toàn (hỗ trợ đầy đủ Unicode UTF-8)
   */
  parseJwt(token?: string): any {
    const rawToken = token || this.getToken();
    if (!rawToken) return null;
    try {
      const parts = rawToken.split(".");
      if (parts.length < 2) return null;
      const base64Url = parts[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const binaryStr = atob(base64);
      const bytes = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
      }
      const jsonPayload = new TextDecoder().decode(bytes);
      return JSON.parse(jsonPayload);
    } catch {
      return null;
    }
  },

  /**
   * Kiểm tra xem JWT Token đã hết hạn chưa
   */
  isTokenExpired(token?: string): boolean {
    const payload = this.parseJwt(token);
    if (!payload || !payload.exp) {
      const user = this.getUser();
      return !user;
    }
    // exp tính bằng giây, so sánh với thời gian thực (trừ hao 5 giây để tránh lệch đồng hồ)
    return Date.now() >= (payload.exp - 5) * 1000;
  },

  /**
   * Lấy số giây còn lại của phiên làm việc
   */
  getTokenRemainingSeconds(token?: string): number {
    const payload = this.parseJwt(token);
    if (!payload || !payload.exp) return 0;
    const remaining = payload.exp - Math.floor(Date.now() / 1000);
    return Math.max(0, remaining);
  },

  /**
   * Kiểm tra phiên đăng nhập hiện tại; nếu hết hạn thì tự động xóa và logout
   */
  checkSessionAndAutoLogout(autoRedirect: boolean = true): boolean {
    if (typeof window === "undefined") return true;

    const token = this.getToken();
    const user = this.getUser();

    // Không có user đăng nhập
    if (!token && !user) return false;

    // Token đã hết hạn và không có user hợp lệ
    if (this.isTokenExpired(token || undefined)) {
      this.clearSession();

      // Bắn event chuyên biệt cho toàn ứng dụng
      window.dispatchEvent(
        new CustomEvent("trustsim_session_expired", {
          detail: { message: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại." },
        })
      );

      if (
        autoRedirect &&
        !window.location.pathname.startsWith("/login") &&
        !window.location.pathname.startsWith("/register")
      ) {
        const currentPath = window.location.pathname + window.location.search;
        window.location.href = `/login?expired=1&redirect=${encodeURIComponent(currentPath)}`;
      }
      return false;
    }

    return true;
  },

  /**
   * Kiểm tra xem người dùng đã đăng nhập không
   * Nếu có thông tin user trong LocalStorage, client coi là đã đăng nhập.
   * (apiClient sẽ tự động refresh token trong nền qua HttpOnly cookie nếu cần)
   */
  isAuthenticated(): boolean {
    if (typeof window === "undefined") return false;
    const user = this.getUser();
    return Boolean(user && user.userId);
  },

  /**
   * Kiểm tra vai trò Admin
   */
  isAdmin(): boolean {
    const user = this.getUser();
    if (!user) return false;
    return user?.role?.toUpperCase() === "ADMIN";
  },

  /**
   * Gửi OTP xác thực tới email (dùng trước bước đăng ký)
   */
  async sendEmailOtp(
    email: string,
    purpose: string = "đăng ký tài khoản"
  ): Promise<SendOtpResponseDto> {
    const res = await apiFetch<SendOtpResponseDto>("/Auth/send-email-otp", {
      method: "POST",
      body: JSON.stringify({ email, purpose }),
    });
    if (res.data) return res.data;
    throw new Error(res.message || "Không thể gửi mã OTP");
  },

  /**
   * Gửi mã OTP xác thực qua SMS tới số điện thoại (SpeedSMS Gateway)
   * @param phoneNumber Số điện thoại định dạng 10 chữ số VN
   * @param purpose Mục đích xác thực (mặc định 2 = Registration)
   */
  async sendPhoneOtp(
    phoneNumber: string,
    purpose: number | string = "Registration"
  ): Promise<SendOtpResponseDto> {
    const purposeStr = typeof purpose === "number" ? (purpose === 2 ? "Registration" : "PhoneVerification") : purpose;
    const res = await apiFetch<SendOtpResponseDto>("/Otp/send-phone-otp", {
      method: "POST",
      body: JSON.stringify({ phoneNumber, purpose: purposeStr }),
    });
    if (res.data) return res.data;
    throw new Error(res.message || "Không thể gửi mã OTP qua SMS");
  },

  /**
   * Xác thực mã OTP 6 chữ số gửi qua số điện thoại (SpeedSMS)
   * @param phoneNumber Số điện thoại đã nhận mã
   * @param otpCode Mã OTP 6 chữ số
   * @param purpose Mục đích xác thực (mặc định "Registration")
   */
  async verifyPhoneOtp(
    phoneNumber: string,
    otpCode: string,
    purpose: number | string = "Registration"
  ): Promise<VerifyOtpResponseDto> {
    const purposeStr = typeof purpose === "number" ? (purpose === 2 ? "Registration" : "PhoneVerification") : purpose;
    const res = await apiFetch<VerifyOtpResponseDto>("/Otp/verify-phone-otp", {
      method: "POST",
      body: JSON.stringify({ phoneNumber, otpCode, purpose: purposeStr }),
    });
    if (res.data) return res.data;
    throw new Error(res.message || "Xác thực mã OTP thất bại");
  },
};

