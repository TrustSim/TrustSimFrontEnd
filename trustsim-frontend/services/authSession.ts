import axios from "axios";
import type { ApiResponse, AuthResponseDto } from "@/types/auth";
import { getApiBaseUrl } from "./apiConfig";

export const ACCESS_TOKEN_KEY = "accessToken";
export const LEGACY_ACCESS_TOKEN_KEY = "trustsim_token";
export const USER_SESSION_KEY = "trustsim_user";

const REFRESH_ENDPOINT = "/api/auth/refresh-token";
const REFRESH_LOCK_NAME = "trustsim-auth-refresh";

const refreshClient = axios.create({
  baseURL: getApiBaseUrl(),
  withCredentials: true,
});

let refreshPromise: Promise<AuthResponseDto> | null = null;
let hasDispatchedExpiration = false;

export class SessionExpiredError extends Error {
  constructor(message = "Phiên đăng nhập đã hết hạn.") {
    super(message);
    this.name = "SessionExpiredError";
  }
}

const decodeJwtPayload = (token: string): { exp?: number } | null => {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;

    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    return JSON.parse(atob(padded)) as { exp?: number };
  } catch {
    return null;
  }
};

export const getStoredAccessToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return (
    localStorage.getItem(ACCESS_TOKEN_KEY) ||
    localStorage.getItem(LEGACY_ACCESS_TOKEN_KEY)
  );
};

export const getAccessTokenRemainingSeconds = (token = getStoredAccessToken()): number => {
  if (!token) return 0;
  const payload = decodeJwtPayload(token);
  if (!payload?.exp) return 0;
  return Math.max(0, payload.exp - Math.floor(Date.now() / 1000));
};

export const isAccessTokenExpiring = (
  token = getStoredAccessToken(),
  withinSeconds = 60
): boolean => !token || getAccessTokenRemainingSeconds(token) <= withinSeconds;

export const persistAuthSession = (authData: AuthResponseDto): void => {
  if (typeof window === "undefined") return;

  localStorage.setItem(ACCESS_TOKEN_KEY, authData.token);
  localStorage.setItem(LEGACY_ACCESS_TOKEN_KEY, authData.token);

  let currentUser: Partial<AuthResponseDto> = {};
  const rawCurrentUser = localStorage.getItem(USER_SESSION_KEY);
  if (rawCurrentUser) {
    try {
      currentUser = JSON.parse(rawCurrentUser) as Partial<AuthResponseDto>;
    } catch {
      currentUser = {};
    }
  }

  localStorage.setItem(
    USER_SESSION_KEY,
    JSON.stringify({ ...currentUser, ...authData })
  );

  hasDispatchedExpiration = false;
  window.dispatchEvent(new Event("trustsim_auth_change"));
  window.dispatchEvent(
    new CustomEvent("trustsim_token_refreshed", { detail: { token: authData.token } })
  );
};

export const clearStoredSession = (): void => {
  if (typeof window === "undefined") return;

  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(LEGACY_ACCESS_TOKEN_KEY);
  localStorage.removeItem(USER_SESSION_KEY);
  window.dispatchEvent(new Event("trustsim_auth_change"));
};

export const expireStoredSession = (message?: string): void => {
  if (typeof window === "undefined" || hasDispatchedExpiration) return;

  hasDispatchedExpiration = true;
  clearStoredSession();

  const expirationMessage =
    message || "Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.";

  window.dispatchEvent(
    new CustomEvent("trustsim_toast", {
      detail: {
        type: "warning",
        title: "Phiên đăng nhập đã hết hạn",
        message: expirationMessage,
        duration: 3500,
      },
    })
  );
  window.dispatchEvent(
    new CustomEvent("trustsim_session_expired", {
      detail: { message: expirationMessage },
    })
  );
};

export const isTerminalRefreshError = (error: unknown): boolean => {
  if (error instanceof SessionExpiredError) return true;
  return axios.isAxiosError(error) && [401, 403].includes(error.response?.status ?? 0);
};

const requestNewSession = async (): Promise<AuthResponseDto> => {
  try {
    const response = await refreshClient.post<ApiResponse<AuthResponseDto>>(
      REFRESH_ENDPOINT,
      {}
    );
    const authData = response.data?.data;

    if (!authData?.token) {
      throw new SessionExpiredError("Máy chủ không trả về access token mới.");
    }

    persistAuthSession(authData);
    return authData;
  } catch (error) {
    if (isTerminalRefreshError(error)) {
      throw new SessionExpiredError(
        axios.isAxiosError(error)
          ? error.response?.data?.message || "Refresh token đã hết hạn hoặc bị thu hồi."
          : error instanceof Error
            ? error.message
            : undefined
      );
    }
    throw error;
  }
};

const refreshWithCrossTabLock = async (
  tokenBeforeRefresh: string | null
): Promise<AuthResponseDto> => {
  const execute = async () => {
    const currentToken = getStoredAccessToken();

    // Tab khác đã refresh trong lúc tab hiện tại chờ khóa.
    if (
      currentToken &&
      currentToken !== tokenBeforeRefresh &&
      !isAccessTokenExpiring(currentToken, 10)
    ) {
      const rawUser = localStorage.getItem(USER_SESSION_KEY);
      if (rawUser) {
        try {
          return JSON.parse(rawUser) as AuthResponseDto;
        } catch {
          // Session hỏng sẽ được thay thế bởi response refresh bên dưới.
        }
      }
    }

    return requestNewSession();
  };

  if (typeof navigator !== "undefined" && navigator.locks) {
    return navigator.locks.request(REFRESH_LOCK_NAME, execute);
  }

  return execute();
};

/**
 * Một Promise duy nhất đóng vai trò hàng đợi cho mọi request 401 trong cùng tab.
 * Web Locks ngăn nhiều tab cùng rotation một refresh token.
 */
export const refreshAuthSession = (): Promise<AuthResponseDto> => {
  if (refreshPromise) return refreshPromise;

  const tokenBeforeRefresh = getStoredAccessToken();
  refreshPromise = refreshWithCrossTabLock(tokenBeforeRefresh).finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
};

export const ensureFreshAccessToken = async (
  minimumValiditySeconds = 60
): Promise<string | null> => {
  const token = getStoredAccessToken();
  const hasStoredUser =
    typeof window !== "undefined" && Boolean(localStorage.getItem(USER_SESSION_KEY));

  if (token && !isAccessTokenExpiring(token, minimumValiditySeconds)) {
    return token;
  }

  if (!token && !hasStoredUser) return null;

  try {
    return (await refreshAuthSession()).token;
  } catch (error) {
    if (isTerminalRefreshError(error)) {
      expireStoredSession(error instanceof Error ? error.message : undefined);
    }
    throw error;
  }
};

