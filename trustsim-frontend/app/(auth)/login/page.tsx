"use client";

import React, { useState } from "react";
import Link from "next/link";
import { authService } from "@/services/authService";
import { ToastContainer, ToastMessage } from "@/components/ui/Toast";

/* ─── Clean Line SVG Icons ────────────────────────────────── */
const Icons = {
  ShieldCheck: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <polyline points="9 12 11 14 15 10" />
    </svg>
  ),
  Zap: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  ),
  FileText: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  ),
  Eye: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  EyeOff: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
      <line x1="2" y1="2" x2="22" y2="22" />
    </svg>
  ),
  Google: () => (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.29 21.43 7.37 24 12 24Z" />
      <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.17 0 9.97 0 12s.46 3.83 1.26 5.42l4.02-3.15Z" />
      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.37 0 3.29 2.57 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98Z" />
    </svg>
  ),
};

export default function LoginPage() {
  const [userNameOrEmail, setUserNameOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (toast: Omit<ToastMessage, "id">) => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 5);
    setToasts((prev) => [...prev, { ...toast, id }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const authData = await authService.login({
        userNameOrEmail: userNameOrEmail.trim(),
        password: password,
      });

      addToast({
        type: "success",
        title: "Đăng nhập thành công",
        message: `Xin chào ${authData.fullName || authData.userName}! Đang chuyển hướng...`,
        duration: 2500,
      });

      // Điều hướng tùy theo Role
      setTimeout(() => {
        if (authData.role?.toUpperCase() === "ADMIN") {
          window.location.href = "/admin";
        } else {
          window.location.href = "/";
        }
      }, 800);
    } catch (err: any) {
      addToast({
        type: "error",
        title: "Đăng nhập thất bại",
        message: err.message || "Tên đăng nhập hoặc mật khẩu không chính xác.",
        duration: 4000,
      });
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "calc(100vh - 64px)", paddingTop: 84, paddingBottom: 64, background: "#F8F9FA", display: "flex", alignItems: "center" }}>
      {/* Toast Notification Container */}
      <ToastContainer toasts={toasts} onClose={removeToast} />

      <div className="container" style={{ maxWidth: 1040, margin: "0 auto", padding: "0 16px" }}>
        {/* Main Card Container */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1.15fr",
            background: "#FFFFFF",
            borderRadius: 8,
            border: "1px solid #E5E7EB",
            boxShadow: "0 4px 24px rgba(0, 23, 67, 0.06)",
            overflow: "hidden",
          }}
        >
          {/* ─── LEFT BRAND PANEL (Fintech Highlights) ─── */}
          <div
            className="auth-brand-panel"
            style={{
              padding: "44px 36px",
              background: "#001743 url('/banner.png') no-repeat center right / cover",
              position: "relative",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              color: "#FFFFFF",
            }}
          >
            {/* Deep Navy Overlay */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "linear-gradient(135deg, rgba(0, 23, 67, 0.96) 0%, rgba(0, 23, 67, 0.88) 60%, rgba(0, 23, 67, 0.72) 100%)",
                pointerEvents: "none",
              }}
            />

            <div style={{ position: "relative", zIndex: 2 }}>
              <div
                style={{
                  display: "inline-block",
                  padding: "4px 10px",
                  borderRadius: 4,
                  background: "rgba(228, 1, 30, 0.18)",
                  border: "1px solid rgba(228, 1, 30, 0.4)",
                  color: "#FF4D6D",
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  marginBottom: 16,
                }}
              >
                Cổng Đăng Nhập An Toàn
              </div>
              <h2 style={{ fontSize: 24, fontWeight: 900, lineHeight: 1.3, color: "#FFFFFF", letterSpacing: "-0.02em", margin: "0 0 12px" }}>
                Đấu giá SIM số đẹp đỉnh cao cùng <span style={{ color: "#E4011E" }}>TrustSim</span>
              </h2>
              <p style={{ fontSize: 13, color: "rgba(255, 255, 255, 0.78)", lineHeight: 1.6, marginBottom: 24 }}>
                Nền tảng giao dịch và đấu giá SIM số minh bạch với cơ chế bảo vệ ký quỹ đa tầng.
              </p>

              {/* Feature Points */}
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {[
                  {
                    icon: <Icons.ShieldCheck />,
                    title: "Bảo vệ ký quỹ minh bạch",
                    desc: "Tiền cọc và thanh toán được lưu trữ an toàn trong tài khoản trung gian.",
                  },
                  {
                    icon: <Icons.Zap />,
                    title: "Đấu giá trực tiếp Real-time",
                    desc: "Cập nhật lệnh trả giá tức thì với độ trễ siêu thấp.",
                  },
                  {
                    icon: <Icons.FileText />,
                    title: "Hợp đồng chuyển nhượng điện tử",
                    desc: "Ký kết văn bản pháp lý đầy đủ đảm bảo quyền sở hữu thuê bao.",
                  },
                ].map(({ icon, title, desc }) => (
                  <div
                    key={title}
                    style={{
                      background: "rgba(255, 255, 255, 0.07)",
                      border: "1px solid rgba(255, 255, 255, 0.12)",
                      borderRadius: 6,
                      padding: "10px 12px",
                      display: "flex",
                      gap: 10,
                      alignItems: "flex-start",
                    }}
                  >
                    <span style={{ color: "#FF4D6D", marginTop: 2, flexShrink: 0 }}>{icon}</span>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#FFFFFF", marginBottom: 1 }}>{title}</div>
                      <div style={{ fontSize: 11, color: "rgba(255, 255, 255, 0.65)", lineHeight: 1.4 }}>{desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ position: "relative", zIndex: 2, paddingTop: 18, fontSize: 12, color: "rgba(255, 255, 255, 0.55)", display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ color: "#10B981" }}><Icons.ShieldCheck /></span>
              <span>Hệ thống giám sát giao dịch bảo mật 24/7</span>
            </div>
          </div>

          {/* ─── RIGHT FORM PANEL ─── */}
          <div style={{ padding: "40px 38px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <div style={{ marginBottom: 20 }}>
              <h1 style={{ fontSize: 24, fontWeight: 900, color: "#001743", letterSpacing: "-0.02em", margin: "0 0 6px" }}>
                Đăng nhập tài khoản
              </h1>
              <p style={{ color: "#6B7280", fontSize: 13, margin: 0 }}>
                Chưa có tài khoản?{" "}
                <Link href="/register" style={{ color: "#E4011E", fontWeight: 700, textDecoration: "none" }}>
                  Đăng ký ngay
                </Link>
              </p>
            </div>

            <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {/* Field: UsernameOrEmail */}
              <div>
                <label htmlFor="login-username" style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#001743", marginBottom: 5 }}>
                  Tên đăng nhập hoặc Email <span style={{ color: "#E4011E" }}>*</span>
                </label>
                <input
                  id="login-username"
                  type="text"
                  value={userNameOrEmail}
                  onChange={(e) => setUserNameOrEmail(e.target.value)}
                  placeholder="Nhập username hoặc email của bạn"
                  required
                  className="auth-input"
                />
              </div>

              {/* Field: Password */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                  <label htmlFor="login-password" style={{ fontSize: 13, fontWeight: 700, color: "#001743", margin: 0 }}>
                    Mật khẩu <span style={{ color: "#E4011E" }}>*</span>
                  </label>
                  <Link href="/forgot-password" style={{ fontSize: 12, color: "#E4011E", fontWeight: 600, textDecoration: "none" }}>
                    Quên mật khẩu?
                  </Link>
                </div>
                <div style={{ position: "relative" }}>
                  <input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Nhập mật khẩu"
                    required
                    className="auth-input"
                    style={{ paddingRight: 40 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: "absolute",
                      right: 12,
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "#6B7280",
                      display: "flex",
                      alignItems: "center",
                      padding: 2,
                    }}
                    title={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  >
                    {showPassword ? <Icons.EyeOff /> : <Icons.Eye />}
                  </button>
                </div>
              </div>

              {/* Remember Me checkbox */}
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#4B5563", cursor: "pointer", userSelect: "none" }}>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  style={{ accentColor: "#E4011E", width: 16, height: 16 }}
                />
                <span>Ghi nhớ phiên đăng nhập</span>
              </label>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="btn-red"
                style={{
                  width: "100%",
                  padding: "11px 20px",
                  fontSize: 14,
                  fontWeight: 700,
                  borderRadius: 6,
                  marginTop: 4,
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                {loading ? (
                  <>
                    <span
                      style={{
                        width: 14,
                        height: 14,
                        border: "2px solid rgba(255,255,255,0.4)",
                        borderTopColor: "#FFFFFF",
                        borderRadius: "50%",
                        animation: "spin 0.8s linear infinite",
                        display: "inline-block",
                      }}
                    />
                    <span>Đang xác thực...</span>
                  </>
                ) : (
                  "Đăng nhập ngay"
                )}
              </button>

              {/* Divider */}
              <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "2px 0" }}>
                <div style={{ flex: 1, height: 1, background: "#E5E7EB" }} />
                <span style={{ fontSize: 11, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.04em" }}>hoặc</span>
                <div style={{ flex: 1, height: 1, background: "#E5E7EB" }} />
              </div>

              {/* Google Login Button */}
              <button
                type="button"
                style={{
                  width: "100%",
                  padding: "9px 16px",
                  fontSize: 13,
                  fontWeight: 600,
                  borderRadius: 6,
                  border: "1px solid #D1D5DB",
                  background: "#FFFFFF",
                  color: "#001743",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 10,
                  transition: "background 0.2s, border-color 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#F9FAFB";
                  e.currentTarget.style.borderColor = "#9CA3AF";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#FFFFFF";
                  e.currentTarget.style.borderColor = "#D1D5DB";
                }}
              >
                <Icons.Google />
                <span>Tiếp tục với Google</span>
              </button>
            </form>
          </div>
        </div>
      </div>

      <style>{`
        .auth-input {
          width: 100%;
          padding: 9px 12px;
          font-size: 13px;
          border-radius: 6px;
          border: 1px solid #D1D5DB;
          outline: none;
          color: #001743;
          background: #FFFFFF;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .auth-input:focus {
          border-color: #001743;
          box-shadow: 0 0 0 3px rgba(0, 23, 67, 0.08);
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @media (max-width: 860px) {
          .auth-brand-panel { display: none !important; }
        }
      `}</style>
    </div>
  );
}
