import { apiFetch } from "./apiClient";
import { withQuery } from "./queryParams";
import type { BaseQueryFilter, UserAccountSortBy } from "@/types/common";

export enum UserRoleEnum {
  USER = 0,
  ADMIN = 1,
  CONSULTANT = 2,
}

export enum VerificationStatusEnum {
  UNVERIFIED = 0,
  PENDING_VERIFICATION = 1,
  VERIFIED = 2,
  REJECTED = 3,
}

export interface PagedResult<T> {
  items: T[];
  pageIndex: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface AdminUserDetailDto {
  id: string;
  userName: string;
  email: string;
  role: number | UserRoleEnum | string;
  isActive: boolean;
  fullName: string;
  phoneNumber: string;
  address: string;
  identityNumber: string;
  dateOfBirth?: string | null;
  avatarImg?: string;
  verificationStatus: number | VerificationStatusEnum | string;
  availableBalance: number;
  lockedBalance: number;
  hasPkiKeys: boolean;
  createdDate: string;
}

export interface AdminCreateUserPayload {
  userName: string;
  email: string;
  password: string;
  role: number | UserRoleEnum;
  fullName: string;
  phoneNumber: string;
  identityNumber?: string;
  dateOfBirth?: string | null;
  address?: string;
}

export interface AdminUpdateUserPayload {
  email: string;
  role: number | UserRoleEnum;
  fullName: string;
  phoneNumber: string;
  identityNumber?: string;
  dateOfBirth?: string | null;
  address?: string;
}

export interface GetAdminUsersParams extends BaseQueryFilter<UserAccountSortBy> {
  role?: number | UserRoleEnum | string;
  isActive?: boolean;
  kycStatus?: number | VerificationStatusEnum | string;
  minWalletBalance?: number;
  maxWalletBalance?: number;
}

export const userService = {
  /**
   * Lấy danh sách tài khoản thành viên hệ thống (có phân trang, tìm kiếm, lọc)
   */
  async getAdminUsers(params: GetAdminUsersParams = {}): Promise<PagedResult<AdminUserDetailDto>> {
    const res = await apiFetch<PagedResult<AdminUserDetailDto>>(withQuery("/Users/admin", {
      ...params,
      pageIndex: params.pageIndex ?? 1,
      pageSize: params.pageSize ?? 10,
    }));
    return (
      res.data || {
        items: [],
        pageIndex: 1,
        pageSize: params.pageSize || 10,
        totalCount: 0,
        totalPages: 0,
        hasPreviousPage: false,
        hasNextPage: false,
      }
    );
  },

  /**
   * Lấy thông tin chi tiết một người dùng
   */
  async getAdminUserById(id: string): Promise<AdminUserDetailDto> {
    const res = await apiFetch<AdminUserDetailDto>(`/Users/admin/${id}`);
    if (!res.data) throw new Error(res.message || "Không thể lấy thông tin người dùng.");
    return res.data;
  },

  /**
   * Tạo mới tài khoản nội bộ (Admin, Consultant, User)
   */
  async createAdminUser(payload: AdminCreateUserPayload): Promise<AdminUserDetailDto> {
    const res = await apiFetch<AdminUserDetailDto>("/Users/admin", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (!res.data) throw new Error(res.message || "Tạo tài khoản thất bại.");
    return res.data;
  },

  /**
   * Cập nhật thông tin tài khoản người dùng
   */
  async updateAdminUser(id: string, payload: AdminUpdateUserPayload): Promise<AdminUserDetailDto> {
    const res = await apiFetch<AdminUserDetailDto>(`/Users/admin/${id}`, {
      method: "PUT",
      body: JSON.stringify({ ...payload, id }),
    });
    if (!res.data) throw new Error(res.message || "Cập nhật tài khoản thất bại.");
    return res.data;
  },

  /**
   * Khóa hoặc mở khóa tài khoản người dùng
   */
  async toggleUserStatus(id: string, isActive: boolean): Promise<boolean> {
    const res = await apiFetch<boolean>(`/Users/admin/${id}/status?isActive=${isActive}`, {
      method: "PATCH",
    });
    return res.data ?? true;
  },
};
