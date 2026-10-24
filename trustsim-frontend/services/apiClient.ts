import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { ApiResponse } from "@/types/auth";
import { getApiBaseUrl } from "./apiConfig";
import {
  expireStoredSession,
  getStoredAccessToken,
  isTerminalRefreshError,
  refreshAuthSession,
} from "./authSession";

export class ApiError extends Error {
  public status: number;
  public errors?: string[];

  constructor(message: string, status: number = 400, errors?: string[]) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errors = errors;
  }
}

export const apiClient = axios.create({
  baseURL: getApiBaseUrl(),
  withCredentials: true, // BẮT BUỘC: để tự động gửi HttpOnly Cookie chứa refreshToken
});

// 1. Request Interceptor: Tự động đính kèm Access Token vào Header
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getStoredAccessToken();
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 2. Response Interceptor: Bắt lỗi 401 và tự động gọi Refresh Token ngầm
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    const requestUrl = (originalRequest?.url || "").toLowerCase();
    const isAuthEndpoint =
      requestUrl.includes("/auth/refresh-token") ||
      requestUrl.includes("/auth/login") ||
      requestUrl.includes("/auth/register") ||
      requestUrl.includes("/auth/logout");

    // Mọi request 401 trong cùng tab cùng chờ một refresh Promise trong authSession.
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true;

      try {
        const refreshedSession = await refreshAuthSession();
        originalRequest.headers.Authorization = `Bearer ${refreshedSession.token}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Lỗi mạng chỉ làm request thất bại; chỉ logout khi refresh token thực sự vô hiệu.
        if (isTerminalRefreshError(refreshError)) {
          expireStoredSession(
            refreshError instanceof Error ? refreshError.message : undefined
          );
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

/**
 * Adapter hàm apiFetch để tương thích hoàn toàn với toàn bộ services hiện tại
 * nhưng được quản lý bởi Axios Interceptor và Retry Queue chuẩn production.
 */
export async function apiFetch<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const normalizedEndpoint = endpoint.startsWith("/api/")
    ? endpoint
    : `/api${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  const method = (options.method || "GET").toUpperCase();
  let data: any = undefined;

  if (options.body) {
    if (typeof options.body === "string") {
      try {
        data = JSON.parse(options.body);
      } catch {
        data = options.body;
      }
    } else {
      data = options.body;
    }
  }

  const isFormData = typeof FormData !== "undefined" && data instanceof FormData;
  const headers: Record<string, string> = {
    ...(!isFormData && { "Content-Type": "application/json" }),
    ...(options.headers as Record<string, string>),
  };

  try {
    const response = await apiClient.request<ApiResponse<T>>({
      url: normalizedEndpoint,
      method: method as any,
      data,
      headers,
    });

    return response.data;
  } catch (err: any) {
    if (err instanceof ApiError) {
      throw err;
    }

    if (axios.isAxiosError(err) && err.response) {
      const respData: any = err.response.data;
      let errorMessage = "";
      let errors: string[] | undefined = undefined;

      if (Array.isArray(respData?.errors) && respData.errors.length > 0) {
        errors = respData.errors as string[];
        errorMessage = errors.join(". ");
      } else if (
        typeof respData?.errors === "object" &&
        respData?.errors !== null &&
        !Array.isArray(respData.errors)
      ) {
        const fieldErrors = Object.values(respData.errors).flat() as string[];
        if (fieldErrors.length > 0) {
          errors = fieldErrors;
          errorMessage = fieldErrors.join(". ");
        }
      }

      if (!errorMessage) {
        if (typeof respData?.message === "string" && respData.message.trim().length > 0) {
          errorMessage = respData.message.trim();
        } else if (typeof respData?.title === "string" && respData.title.trim().length > 0) {
          errorMessage = respData.title.trim();
        } else {
          errorMessage = `Yêu cầu thất bại (${err.response.status}). Vui lòng thử lại.`;
        }
      }

      throw new ApiError(errorMessage, err.response.status, errors);
    }

    throw new ApiError(
      err?.message || "Không thể kết nối đến máy chủ Backend. Vui lòng kiểm tra lại kết nối mạng.",
      0
    );
  }
}

export default apiClient;
