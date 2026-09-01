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

export async function apiFetch<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const url = `${API_BASE_URL}${cleanEndpoint}`;

  // Chuẩn bị headers
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  // Tự động đính kèm Token nếu có trong localStorage
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("trustsim_token");
    if (token && !headers["Authorization"]) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  try {
    const res = await fetch(url, {
      ...options,
      headers,
    });

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
        // FluentValidation object style: { field: ["error1", "error2"] }
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
