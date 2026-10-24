"use client";
import React, { useEffect, useState } from "react";
import { ToastContainer, ToastMessage } from "@/components/ui/Toast";

export function AuthSessionGuard({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (toast: Omit<ToastMessage, "id">) => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 5);
    setToasts((prev) => [...prev, { ...toast, id }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  useEffect(() => {
    // SessionRefreshManager chịu trách nhiệm refresh và điều hướng toàn cục.
    // Guard của admin chỉ hiển thị thông báo khi refresh token thực sự hết hạn.
    const handleExpiredEvent = (event: Event) => {
      const customEvent = event as CustomEvent<{ message?: string }>;
      const msg = customEvent.detail?.message || "Phiên đăng nhập đã hết hạn.";
      addToast({
        type: "error",
        title: "Hết phiên đăng nhập",
        message: msg,
        duration: 3500,
      });
    };
    window.addEventListener("trustsim_session_expired", handleExpiredEvent);

    return () => {
      window.removeEventListener("trustsim_session_expired", handleExpiredEvent);
    };
  }, []);

  return (
    <>
      <ToastContainer toasts={toasts} onClose={removeToast} />
      {children}
    </>
  );
}
