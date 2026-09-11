import { ApiResponse } from "@/types/auth";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== "undefined" && window.location.protocol === "https:"
    ? "https://localhost:7120/api"
    : "http://localhost:5130/api");

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

// Cờ chống lặp vô hạn khi refresh token
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: any) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(true);
    }
  });
  failedQueue = [];
};

export async function apiFetch<T = any>(
  endpoint: string,
  options: RequestInit = {},
  isRetry: boolean = false
): Promise<ApiResponse<T>> {
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const url = `${API_BASE_URL}${cleanEndpoint}`;

  // Chuẩn bị headers
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  // Tự động đính kèm Token nếu có trong localStorage (Hỗ trợ cơ chế Hybrid: Header + Cookie)
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("trustsim_token");
    if (token && !headers["Authorization"]) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  try {
    const res = await fetch(url, {
      ...options,
      // BẮT BUỘC: credentials: "include" cho phép trình duyệt gửi & lưu trữ HttpOnly Cookies (accessToken, refreshToken)
      credentials: "include",
      headers,
    });

    // Xử lý tự động Refresh Token khi gặp 401 Unauthorized
    const isAuthEndpoint =
      cleanEndpoint.toLowerCase().includes("/auth/login") ||
      cleanEndpoint.toLowerCase().includes("/auth/register") ||
      cleanEndpoint.toLowerCase().includes("/auth/refresh-token") ||
      cleanEndpoint.toLowerCase().includes("/auth/logout");

    if (res.status === 401 && !isAuthEndpoint && !isRetry && typeof window !== "undefined") {
      if (isRefreshing) {
        // Nếu đang trong quá trình refresh token, đưa request vào hàng chờ
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: () => resolve(apiFetch<T>(endpoint, options, true)),
            reject,
          });
        });
      }

      isRefreshing = true;

      try {
        const refreshRes = await fetch(`${API_BASE_URL}/Auth/refresh-token`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });

        if (refreshRes.ok) {
          const refreshData = await refreshRes.json();
          if (refreshData?.data?.token) {
            localStorage.setItem("trustsim_token", refreshData.data.token);
          }
          processQueue(null);
          isRefreshing = false;
          // Thử lại request ban đầu với token mới
          return apiFetch<T>(endpoint, options, true);
        } else {
          // Refresh thất bại -> Phiên đăng nhập đã hết hạn
          processQueue(new Error("Phiên đăng nhập đã hết hạn"));
          isRefreshing = false;
          localStorage.removeItem("trustsim_token");
          localStorage.removeItem("trustsim_user");
          window.dispatchEvent(new Event("trustsim_auth_change"));
        }
      } catch (refreshErr) {
        processQueue(refreshErr);
        isRefreshing = false;
      }
    }

    let data: any;
    const contentType = res.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      data = await res.json();
    } else {
      const text = await res.text();
      data = { message: text };
    }

    if (!res.ok) {
      // Bóc tách message lỗi từ ApiResponse hoặc FluentValidation
      let errorMessage = "Đã có lỗi xảy ra. Vui lòng thử lại.";
      let errors: string[] | undefined = undefined;

      if (data?.message) {
        errorMessage = data.message;
      } else if (data?.title) {
        errorMessage = data.title;
      }

      if (Array.isArray(data?.errors)) {
        errors = data.errors;
        if (!data?.message && errors && errors.length > 0) {
          errorMessage = errors.join(", ");
        }
      } else if (typeof data?.errors === "object" && data?.errors !== null) {
        const fieldErrors = Object.values(data.errors).flat() as string[];
        errors = fieldErrors;
        if (fieldErrors.length > 0) {
          errorMessage = fieldErrors[0];
        }
      }

      throw new ApiError(errorMessage, res.status, errors);
    }

    return data as ApiResponse<T>;
  } catch (err: any) {
    if (err instanceof ApiError) {
      throw err;
    }
    // Lỗi mạng hoặc không kết nối được server
    throw new ApiError(
      err.message || "Không thể kết nối đến máy chủ Backend. Vui lòng kiểm tra lại kết nối mạng.",
      0
    );
  }
}
