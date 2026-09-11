"use client";
import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { authService } from "@/services/authService";
import { ToastContainer, ToastMessage } from "@/components/ui/Toast";

export function AuthSessionGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (toast: Omit<ToastMessage, "id">) => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 5);
    setToasts((prev) => [...prev, { ...toast, id }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  useEffect(() => {
    // 1. Hàm kiểm tra hạn phiên làm việc
    const checkExpiration = () => {
      const token = authService.getToken();
      if (!token) return;

      if (authService.isTokenExpired(token)) {
        authService.clearSession();
        addToast({
          type: "warning",
          title: "Phiên làm việc hết hạn",
          message: "Phiên đăng nhập đã hết hạn. Đang chuyển hướng về trang đăng nhập...",
          duration: 3000,
        });

        const redirectUrl = encodeURIComponent(window.location.pathname + window.location.search);
        setTimeout(() => {
          router.push(`/login?expired=1&redirect=${redirectUrl}`);
        }, 1200);
      }
    };

    // Kiểm tra ngay khi mount và khi pathname thay đổi
    checkExpiration();

    // 2. Chạy chu kỳ kiểm tra mỗi 30 giây
    const interval = setInterval(checkExpiration, 30000);

    // 3. Kiểm tra khi người dùng quay lại tab (window focus)
    const handleFocus = () => checkExpiration();
    window.addEventListener("focus", handleFocus);

    // 4. Lắng nghe sự kiện session expired từ apiClient
    const handleExpiredEvent = (e: any) => {
      const msg = e?.detail?.message || "Phiên đăng nhập đã hết hạn.";
      addToast({
        type: "error",
        title: "Hết phiên đăng nhập",
        message: msg,
        duration: 3500,
      });

      const redirectUrl = encodeURIComponent(window.location.pathname + window.location.search);
      setTimeout(() => {
        router.push(`/login?expired=1&redirect=${redirectUrl}`);
      }, 1200);
    };
    window.addEventListener("trustsim_session_expired" as any, handleExpiredEvent);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("trustsim_session_expired" as any, handleExpiredEvent);
    };
  }, [pathname, router]);

  return (
    <>
      <ToastContainer toasts={toasts} onClose={removeToast} />
      {children}
    </>
  );
}
