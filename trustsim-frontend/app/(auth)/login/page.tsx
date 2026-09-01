"use client";
import React, { useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";

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
  ArrowLeft: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  ),
  Google: () => (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"/>
      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.29 21.43 7.37 24 12 24Z"/>
      <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.17 0 9.97 0 12s.46 3.83 1.26 5.42l4.02-3.15Z"/>
      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.37 0 3.29 2.57 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98Z"/>
    </svg>
  ),
};

export default function LoginPage() {
  const [step, setStep] = useState<"credentials" | "otp">("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep("otp");
    }, 900);
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...otp];
    next[index] = value.slice(-1);
    setOtp(next);
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKey = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", background: "#FFFFFF" }}>
      {/* ─── LEFT BRAND PANEL (Banner Background & Glassmorphism Cards) ─── */}
      <div
        className="auth-brand-panel"
        style={{
          flex: "0 0 45%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "56px 60px",
          background: "#001743 url('/banner.png') no-repeat center right / cover",
          position: "relative",
          overflow: "hidden",
          borderRight: "1px solid rgba(255, 255, 255, 0.1)",
        }}
      >
        {/* Deep Navy Gradient Overlay for crystal-clear readability */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(135deg, rgba(0, 23, 67, 0.96) 0%, rgba(0, 23, 67, 0.88) 55%, rgba(0, 23, 67, 0.7) 100%)",
            pointerEvents: "none",
          }}
        />

        {/* Top Logo */}
        <div style={{ position: "relative", zIndex: 2 }}>
          <Link href="/" style={{ display: "inline-flex", alignItems: "center", textDecoration: "none" }}>
            <Image
              src="/logo/S-White-Logo.png"
              alt="TrustSim Logo"
              width={140}
              height={38}
              priority
              style={{ height: 36, width: "auto", objectFit: "contain" }}
            />
          </Link>
        </div>

        {/* Center Content & Glassmorphism Cards */}
        <div style={{ position: "relative", zIndex: 2, margin: "40px 0" }}>
          <div
            style={{
              display: "inline-block",
              padding: "4px 12px",
              borderRadius: 4,
              background: "rgba(228, 1, 30, 0.15)",
              border: "1px solid rgba(228, 1, 30, 0.4)",
              color: "#FF4D6D",
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              marginBottom: 16,
            }}
          >
            Đăng nhập hệ thống
          </div>
          <h2 style={{ fontSize: 34, fontWeight: 900, lineHeight: 1.2, color: "#FFFFFF", letterSpacing: "-0.02em", margin: "0 0 14px" }}>
            Chào mừng trở lại với <span style={{ color: "#E4011E" }}>TrustSim</span>
          </h2>
          <p style={{ fontSize: 15, color: "rgba(255, 255, 255, 0.8)", lineHeight: 1.7, marginBottom: 36, maxWidth: 440 }}>
            Tham gia các phiên đấu giá SIM số đẹp đỉnh cao, quản lý lệnh trả giá trực tiếp và ký hợp đồng chuyển nhượng an toàn.
          </p>

          {/* Staggered Glassmorphism Feature Cards */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {[
              {
                icon: <Icons.ShieldCheck />,
                title: "Bảo mật đa tầng & Ký quỹ an toàn",
                desc: "Tiền cọc và thanh toán được bảo lưu tại tài khoản ký quỹ trung gian.",
              },
              {
                icon: <Icons.Zap />,
                title: "Đấu giá trực tiếp thời gian thực",
                desc: "Hệ thống cập nhật từng lượt trả giá không độ trễ, minh bạch tuyệt đối.",
              },
              {
                icon: <Icons.FileText />,
                title: "Hợp đồng điện tử ký số pháp lý",
                desc: "Xác thực pháp lý đầy đủ, bảo vệ quyền lợi hợp pháp của người mua.",
              },
            ].map(({ icon, title, desc }, idx) => (
              <div
                key={title}
                style={{
                  background: "rgba(255, 255, 255, 0.07)",
                  backdropFilter: "blur(16px)",
                  WebkitBackdropFilter: "blur(16px)",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  borderRadius: 6,
                  padding: "14px 16px",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 12,
                  transform: idx === 1 ? "translateX(10px)" : "none",
                  transition: "transform 0.3s ease",
                  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)",
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 4,
                    background: "rgba(228, 1, 30, 0.2)",
                    color: "#FF4D6D",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    border: "1px solid rgba(228, 1, 30, 0.3)",
                  }}
                >
                  {icon}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "#FFFFFF", marginBottom: 2 }}>{title}</div>
                  <div style={{ fontSize: 12, color: "rgba(255, 255, 255, 0.7)", lineHeight: 1.5 }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Footer Note */}
        <div style={{ position: "relative", zIndex: 2, fontSize: 12, color: "rgba(255, 255, 255, 0.5)" }}>
          © 2026 TrustSim Platform · Nền tảng đấu giá số hàng đầu
        </div>
      </div>

      {/* ─── RIGHT FORM PANEL (Crisp Inputs, Solid CTA Button) ─── */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "48px 32px",
          background: "#FFFFFF",
        }}
      >
        <div style={{ width: "100%", maxWidth: 420 }}>
          {step === "credentials" ? (
            <>
              {/* Header */}
              <div style={{ marginBottom: 32 }}>
                <h1 style={{ fontSize: 28, fontWeight: 900, color: "#001743", letterSpacing: "-0.02em", margin: "0 0 8px" }}>
                  Đăng nhập tài khoản
                </h1>
                <p style={{ color: "#6B7280", fontSize: 14, margin: 0 }}>
                  Chưa có tài khoản?{" "}
                  <Link href="/register" style={{ color: "#E4011E", fontWeight: 700, textDecoration: "none" }}>
                    Đăng ký ngay
                  </Link>
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                {/* Email / Phone Field */}
                <div>
                  <label htmlFor="login-email" style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#001743", marginBottom: 6 }}>
                    Email hoặc số điện thoại
                  </label>
                  <input
                    id="login-email"
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com hoặc 0988..."
                    required
                    style={{
                      width: "100%",
                      padding: "12px 14px",
                      fontSize: 14,
                      borderRadius: 6,
                      border: "1px solid #D1D5DB",
                      outline: "none",
                      color: "#001743",
                      background: "#FFFFFF",
                      transition: "border-color 0.2s, box-shadow 0.2s",
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = "#001743";
                      e.target.style.boxShadow = "0 0 0 3px rgba(0, 23, 67, 0.08)";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "#D1D5DB";
                      e.target.style.boxShadow = "none";
                    }}
                  />
                </div>

                {/* Password Field */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <label htmlFor="login-password" style={{ fontSize: 13, fontWeight: 700, color: "#001743", margin: 0 }}>
                      Mật khẩu
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
                      placeholder="Nhập mật khẩu của bạn"
                      required
                      style={{
                        width: "100%",
                        padding: "12px 42px 12px 14px",
                        fontSize: 14,
                        borderRadius: 6,
                        border: "1px solid #D1D5DB",
                        outline: "none",
                        color: "#001743",
                        background: "#FFFFFF",
                        transition: "border-color 0.2s, box-shadow 0.2s",
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = "#001743";
                        e.target.style.boxShadow = "0 0 0 3px rgba(0, 23, 67, 0.08)";
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = "#D1D5DB";
                        e.target.style.boxShadow = "none";
                      }}
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
                      }}
                      title={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                    >
                      {showPassword ? <Icons.EyeOff /> : <Icons.Eye />}
                    </button>
                  </div>
                </div>

                {/* Solid Primary CTA Button */}
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: "100%",
                    padding: "13px 20px",
                    fontSize: 15,
                    fontWeight: 700,
                    borderRadius: 6,
                    border: "none",
                    background: "#E4011E",
                    color: "#FFFFFF",
                    cursor: loading ? "not-allowed" : "pointer",
                    boxShadow: "0 4px 14px rgba(228, 1, 30, 0.28)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    transition: "all 0.2s ease",
                    marginTop: 4,
                  }}
                  onMouseEnter={(e) => {
                    if (!loading) e.currentTarget.style.background = "#c50019";
                  }}
                  onMouseLeave={(e) => {
                    if (!loading) e.currentTarget.style.background = "#E4011E";
                  }}
                >
                  {loading ? (
                    <>
                      <span
                        style={{
                          width: 16,
                          height: 16,
                          border: "2px solid rgba(255,255,255,0.4)",
                          borderTopColor: "#FFFFFF",
                          borderRadius: "50%",
                          animation: "spin 0.8s linear infinite",
                          display: "inline-block",
                        }}
                      />
                      <span>Đang đăng nhập...</span>
                    </>
                  ) : (
                    "Đăng nhập"
                  )}
                </button>

                {/* Divider */}
                <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "4px 0" }}>
                  <div style={{ flex: 1, height: 1, background: "#E5E7EB" }} />
                  <span style={{ fontSize: 12, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.04em" }}>hoặc</span>
                  <div style={{ flex: 1, height: 1, background: "#E5E7EB" }} />
                </div>

                {/* Google Button */}
                <button
                  type="button"
                  style={{
                    width: "100%",
                    padding: "11px 16px",
                    fontSize: 14,
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
                  <span>Đăng nhập với Google</span>
                </button>
              </form>
            </>
          ) : (
            /* OTP Verification Step */
            <>
              <button
                onClick={() => setStep("credentials")}
                style={{
                  background: "none",
                  border: "none",
                  color: "#6B7280",
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 600,
                  marginBottom: 20,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: 0,
                }}
              >
                <Icons.ArrowLeft /> Quay lại đăng nhập
              </button>

              <h1 style={{ fontSize: 26, fontWeight: 900, color: "#001743", letterSpacing: "-0.02em", margin: "0 0 8px" }}>
                Xác thực mã OTP
              </h1>
              <p style={{ color: "#6B7280", fontSize: 14, lineHeight: 1.6, marginBottom: 28 }}>
                Mã bảo mật gồm 6 chữ số đã được gửi tới <strong>{email || "tài khoản của bạn"}</strong>
              </p>

              <div style={{ display: "flex", gap: 8, marginBottom: 28, justifyContent: "center" }}>
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => { otpRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKey(i, e)}
                    maxLength={1}
                    style={{
                      width: 48,
                      height: 56,
                      textAlign: "center",
                      fontSize: 20,
                      fontWeight: 800,
                      background: "#F9FAFB",
                      border: `1.5px solid ${digit ? "#001743" : "#D1D5DB"}`,
                      borderRadius: 6,
                      color: "#001743",
                      outline: "none",
                      fontVariantNumeric: "tabular-nums",
                      transition: "border-color 0.2s",
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = "#001743";
                      e.target.style.boxShadow = "0 0 0 3px rgba(0, 23, 67, 0.08)";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = digit ? "#001743" : "#D1D5DB";
                      e.target.style.boxShadow = "none";
                    }}
                  />
                ))}
              </div>

              <button
                style={{
                  width: "100%",
                  padding: "13px",
                  fontSize: 15,
                  fontWeight: 700,
                  borderRadius: 6,
                  border: "none",
                  background: "#E4011E",
                  color: "#FFFFFF",
                  cursor: "pointer",
                  boxShadow: "0 4px 14px rgba(228, 1, 30, 0.28)",
                }}
                onClick={() => { window.location.href = "/"; }}
              >
                Xác nhận & Đăng nhập
              </button>

              <p style={{ textAlign: "center", fontSize: 13, color: "#6B7280", marginTop: 20 }}>
                Không nhận được mã?{" "}
                <button
                  type="button"
                  style={{ background: "none", border: "none", color: "#E4011E", fontWeight: 700, cursor: "pointer", fontSize: 13, padding: 0 }}
                >
                  Gửi lại mã (59s)
                </button>
              </p>
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @media (max-width: 900px) {
          .auth-brand-panel { display: none !important; }
        }
      `}</style>
    </div>
  );
}
