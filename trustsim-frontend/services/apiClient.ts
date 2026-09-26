import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { ApiResponse } from "@/types/auth";

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

// Xác định Base URL linh hoạt: ưu tiên NEXT_PUBLIC_API_URL trong môi trường dev/production
const getBaseUrl = () => {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  if (envUrl) {
    return envUrl.replace(/\/api\/?$/, "");
  }
  return typeof window !== "undefined" && window.location.protocol === "https:"
    ? "https://localhost:7120"
    : "http://localhost:5130";
};

export const apiClient = axios.create({
  baseURL: getBaseUrl(),
  withCredentials: true, // BẮT BUỘC: để tự động gửi HttpOnly Cookie chứa refreshToken
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });
  failedQueue = [];
};

// 1. Request Interceptor: Tự động đính kèm Access Token vào Header
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (typeof window !== "undefined") {
    const token =
      localStorage.getItem("accessToken") || localStorage.getItem("trustsim_token");
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
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

    // Nếu gặp lỗi 401 và không phải là request đăng nhập/refresh-token
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry && !isAuthEndpoint) {
      if (isRefreshing) {
        // Nếu đang có 1 tiến trình refresh token khác đang chạy, đưa request này vào hàng đợi chờ
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Gọi API refresh token của backend (BE tự lấy từ HttpOnly Cookie)
        const response = await apiClient.post("/api/Auth/refresh-token", {});
        const newAccessToken =
          response.data?.data?.token || response.data?.token;

        if (!newAccessToken) {
          throw new Error("Không nhận được token mới từ máy chủ");
        }

        if (typeof window !== "undefined") {
          localStorage.setItem("accessToken", newAccessToken);
          localStorage.setItem("trustsim_token", newAccessToken);
        }

        apiClient.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;

        // Xử lý lại toàn bộ các request bị nghẽn trong hàng đợi
        processQueue(null, newAccessToken);

        // Gọi lại request ban đầu với token mới
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Khi Refresh Token cũng đã hết hạn (ví dụ quá 7 ngày) -> Lúc này mới buộc điều hướng về Login
        processQueue(refreshError, null);

        if (typeof window !== "undefined") {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("trustsim_token");
          localStorage.removeItem("trustsim_user");

          window.dispatchEvent(new Event("trustsim_auth_change"));
          window.dispatchEvent(
            new CustomEvent("trustsim_session_expired", {
              detail: { message: "Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại." },
            })
          );

          if (
            !window.location.pathname.startsWith("/login") &&
            !window.location.pathname.startsWith("/register")
          ) {
            window.location.href = "/login?session_expired=true";
          }
        }

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
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
