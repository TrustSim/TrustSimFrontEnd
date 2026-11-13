"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { AiConsultantChatWidget } from "@/components/ai/AiConsultantChatWidget";
import { HumanSupportChatWidget } from "@/components/chat/HumanSupportChatWidget";
import { ToastContainer, ToastMessage } from "@/components/ui/Toast";

export function showToast(toast: Omit<ToastMessage, "id">) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("trustsim_toast", { detail: toast }));
  }
}

interface AppShellProps {
  children: React.ReactNode;
}

/**
 * AppShell handles top-level Layout logic:
 * - Automatically renders public Navbar & Footer for storefront pages, including Login & Register
 * - Bypasses storefront Navbar & Footer only on Admin pages (/admin) which manage their own dedicated sidebar layouts.
 * - Hosts the global Toast notification container for instant UI feedback across all storefront flows.
 */
export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const pathname = usePathname();
  useEffect(() => {
    if (pathname !== "/login" && pathname !== "/register") return;
    const onFocus = (event: FocusEvent) => {
      const target = event.target;
      if (!(target instanceof HTMLInputElement) || !target.closest(".auth-page")) return;
      window.setTimeout(() => target.scrollIntoView({ block: "center", behavior: "smooth" }), 180);
    };
    document.addEventListener("focusin", onFocus);
    return () => document.removeEventListener("focusin", onFocus);
  }, [pathname]);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const handleGlobalToast = (e: any) => {
      if (e?.detail) {
        const id = Date.now().toString() + Math.random().toString(36).substring(2, 5);
        setToasts((prev) => [...prev, { ...e.detail, id }]);
      }
    };
    window.addEventListener("trustsim_toast" as any, handleGlobalToast);
    return () => {
      window.removeEventListener("trustsim_toast" as any, handleGlobalToast);
    };
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const isExcludedRoute = pathname?.startsWith("/admin");

  if (isExcludedRoute) {
    return <>{children}</>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <ToastContainer toasts={toasts} onClose={removeToast} />
      <Navbar />
      <main style={{ flex: 1 }}>{children}</main>
      <Footer />
      <HumanSupportChatWidget />
      <AiConsultantChatWidget />
    </div>
  );
};

export default AppShell;
