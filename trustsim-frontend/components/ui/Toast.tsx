"use client";

import React, { useEffect, useRef, useState } from "react";

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastMessage {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

interface ToastProps {
  toasts: ToastMessage[];
  onClose: (id: string) => void;
}

const Icons = {
  success: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
  error: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  ),
  warning: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  info: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  ),
  close: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
};

const TOAST_STYLES: Record<ToastType, { bg: string; border: string; bar: string; title: string }> = {
  success: {
    bg: "#FFFFFF",
    border: "#BBF7D0",
    bar: "#16A34A",
    title: "Thành công",
  },
  error: {
    bg: "#FFFFFF",
    border: "#FECACA",
    bar: "#DC2626",
    title: "Đã xảy ra lỗi",
  },
  warning: {
    bg: "#FFFFFF",
    border: "#FDE68A",
    bar: "#D97706",
    title: "Cảnh báo",
  },
  info: {
    bg: "#FFFFFF",
    border: "#BAE6FD",
    bar: "#2563EB",
    title: "Thông báo",
  },
};

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onClose }) => {
  return (
    <div
      style={{
        position: "fixed",
        top: 24,
        right: 24,
        zIndex: 99999,
        display: "flex",
        flexDirection: "column",
        gap: 10,
        pointerEvents: "none",
        maxWidth: "calc(100vw - 48px)",
      }}
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onClose={() => onClose(toast.id)} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{ toast: ToastMessage; onClose: () => void }> = ({ toast, onClose }) => {
  const [exiting, setExiting] = useState(false);
  const onCloseRef = useRef(onClose);
  const style = TOAST_STYLES[toast.type] || TOAST_STYLES.info;
  const duration = toast.duration || 4000;

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setExiting(true);
      setTimeout(() => onCloseRef.current(), 250);
    }, duration);
    return () => clearTimeout(timer);
  }, [duration]);

  const handleManualClose = () => {
    setExiting(true);
    setTimeout(() => onCloseRef.current(), 250);
  };

  const IconComponent = Icons[toast.type] || Icons.info;

  return (
    <div
      style={{
        pointerEvents: "auto",
        minWidth: 320,
        maxWidth: 420,
        background: style.bg,
        border: `1px solid ${style.border}`,
        borderRadius: 8,
        boxShadow: "0 10px 30px rgba(0, 23, 67, 0.12), 0 2px 8px rgba(0,0,0,0.04)",
        overflow: "hidden",
        position: "relative",
        animation: exiting ? "toast-slide-out 0.25s ease forwards" : "toast-slide-in 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        display: "flex",
        alignItems: "flex-start",
        padding: "14px 16px",
        gap: 12,
      }}
    >
      {/* Left accent color stripe */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          bottom: 0,
          width: 4,
          background: style.bar,
        }}
      />

      <div style={{ flexShrink: 0, marginTop: 1 }}>
        <IconComponent />
      </div>

      <div style={{ flex: 1, paddingRight: 4 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#001743", marginBottom: 2 }}>
          {toast.title || style.title}
        </div>
        <div style={{ fontSize: 12.5, color: "#4B5563", lineHeight: 1.45 }}>
          {toast.message}
        </div>
      </div>

      <button
        onClick={handleManualClose}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
        aria-label="Đóng thông báo"
      >
        <Icons.close />
      </button>

      {/* Progress Bar Animation */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 4,
          right: 0,
          height: 2.5,
          background: "rgba(0,0,0,0.05)",
        }}
      >
        <div
          style={{
            height: "100%",
            background: style.bar,
            animation: `toast-progress ${duration}ms linear forwards`,
          }}
        />
      </div>

      <style>{`
        @keyframes toast-slide-in {
          from { transform: translateX(120%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes toast-slide-out {
          from { transform: translateX(0); opacity: 1; }
          to { transform: translateX(120%); opacity: 0; }
        }
        @keyframes toast-progress {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
};

export default ToastContainer;
