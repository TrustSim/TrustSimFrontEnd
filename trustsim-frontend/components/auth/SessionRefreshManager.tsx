"use client";

import { useEffect } from "react";
import {
  ACCESS_TOKEN_KEY,
  LEGACY_ACCESS_TOKEN_KEY,
  USER_SESSION_KEY,
  expireStoredSession,
  getAccessTokenRemainingSeconds,
  getStoredAccessToken,
  isTerminalRefreshError,
  refreshAuthSession,
} from "@/services/authSession";

const REFRESH_EARLY_SECONDS = 60;
const NETWORK_RETRY_DELAY_MS = 30_000;

export function SessionRefreshManager() {
  useEffect(() => {
    let refreshTimer: ReturnType<typeof setTimeout> | null = null;
    let redirectTimer: ReturnType<typeof setTimeout> | null = null;

    const clearRefreshTimer = () => {
      if (refreshTimer) clearTimeout(refreshTimer);
      refreshTimer = null;
    };

    const scheduleRefresh = () => {
      clearRefreshTimer();

      const token = getStoredAccessToken();
      if (!token || !localStorage.getItem(USER_SESSION_KEY)) return;

      const remainingSeconds = getAccessTokenRemainingSeconds(token);
      const delayMs = Math.max(0, remainingSeconds - REFRESH_EARLY_SECONDS) * 1000;

      refreshTimer = setTimeout(async () => {
        try {
          await refreshAuthSession();
          scheduleRefresh();
        } catch (error) {
          if (isTerminalRefreshError(error)) {
            expireStoredSession(error instanceof Error ? error.message : undefined);
            return;
          }

          // Mất mạng không đồng nghĩa hết phiên; thử lại thay vì logout người dùng.
          refreshTimer = setTimeout(scheduleRefresh, NETWORK_RETRY_DELAY_MS);
        }
      }, delayMs);
    };

    const handleStorage = (event: StorageEvent) => {
      if (
        event.key === ACCESS_TOKEN_KEY ||
        event.key === LEGACY_ACCESS_TOKEN_KEY ||
        event.key === USER_SESSION_KEY
      ) {
        scheduleRefresh();
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") scheduleRefresh();
    };

    const handleSessionExpired = () => {
      if (redirectTimer) return;

      const currentPath = window.location.pathname + window.location.search;
      if (
        window.location.pathname.startsWith("/login") ||
        window.location.pathname.startsWith("/register")
      ) {
        return;
      }

      redirectTimer = setTimeout(() => {
        window.location.assign(
          `/login?expired=1&redirect=${encodeURIComponent(currentPath)}`
        );
      }, 1200);
    };

    scheduleRefresh();
    window.addEventListener("trustsim_auth_change", scheduleRefresh);
    window.addEventListener("storage", handleStorage);
    window.addEventListener("focus", scheduleRefresh);
    window.addEventListener("trustsim_session_expired", handleSessionExpired);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearRefreshTimer();
      if (redirectTimer) clearTimeout(redirectTimer);
      window.removeEventListener("trustsim_auth_change", scheduleRefresh);
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("focus", scheduleRefresh);
      window.removeEventListener("trustsim_session_expired", handleSessionExpired);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return null;
}

