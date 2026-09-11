import { apiFetch } from "./apiClient";
import {
  AuthResponseDto,
  LoginRequest,
  RegisterRequest,
  UserProfileDto,
} from "@/types/auth";

const TOKEN_KEY = "trustsim_token";
const USER_KEY = "trustsim_user";

export const authService = {
  /**
   * Đăng ký tài khoản người dùng mới (Backend tự động ghi HttpOnly Cookies)
   */
  async register(data: RegisterRequest): Promise<AuthResponseDto> {
    const res = await apiFetch<AuthResponseDto>("/Auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    });

    if (res.data) {
      this.saveSession(res.data);
      return res.data;
    }
    throw new Error(res.message || "Đăng ký không thành công");
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
    return localStorage.getItem(TOKEN_KEY);
  },

  /**
   * Kiểm tra xem người dùng đã đăng nhập chưa
   */
  isAuthenticated(): boolean {
    return !!this.getUser();
  },

  /**
   * Kiểm tra vai trò Admin
   */
  isAdmin(): boolean {
    const user = this.getUser();
    return user?.role?.toUpperCase() === "ADMIN";
  },
};
