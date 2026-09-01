"use client";
import React, { useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";

/* ─── Line SVG Icons ──────────────────────────────────────── */
const Icons = {
  User: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  IdCard: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="9" cy="10" r="2" />
      <line x1="15" y1="8" x2="17" y2="8" />
      <line x1="15" y1="12" x2="17" y2="12" />
      <line x1="7" y1="16" x2="17" y2="16" />
    </svg>
  ),
  Phone: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
      <line x1="12" y1="18" x2="12.01" y2="18" />
    </svg>
  ),
  Camera: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
      <circle cx="12" cy="13" r="3" />
    </svg>
  ),
  Check: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  CheckCircle: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
  ArrowLeft: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  ),
  Shield: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
};

type Step = "account" | "identity" | "sim";

const STEPS: { key: Step; icon: React.ReactNode; label: string; desc: string }[] = [
  { key: "account", icon: <Icons.User />, label: "Thông tin tài khoản", desc: "Họ tên, SĐT, Email và Mật khẩu" },
  { key: "identity", icon: <Icons.IdCard />, label: "Định danh chính chủ", desc: "Xác thực ảnh CCCD 2 mặt" },
  { key: "sim", icon: <Icons.Phone />, label: "Xác minh số điện thoại", desc: "Nhập mã OTP kích hoạt" },
];

export default function RegisterPage() {
  const [currentStep, setCurrentStep] = useState<Step>("account");
  const [loading, setLoading] = useState(false);

  const stepIndex = STEPS.findIndex((s) => s.key === currentStep);

  const handleNext = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      if (currentStep === "account") setCurrentStep("identity");
      else if (currentStep === "identity") setCurrentStep("sim");
      else window.location.href = "/";
    }, 700);
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", background: "#FFFFFF" }}>
      {/* ─── LEFT BRAND PANEL (Banner Background & 3-Step Timeline) ─── */}
      <div
        className="auth-brand-panel"
        style={{
          flex: "0 0 42%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "56px 52px",
          background: "#001743 url('/banner.png') no-repeat center right / cover",
          position: "relative",
          overflow: "hidden",
          borderRight: "1px solid rgba(255, 255, 255, 0.1)",
        }}
      >
        {/* Deep Navy Gradient Overlay */}
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

        {/* Center: Stepper & Value Props */}
        <div style={{ position: "relative", zIndex: 2, margin: "32px 0" }}>
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
            Đăng ký thành viên
          </div>
          <h2 style={{ fontSize: 32, fontWeight: 900, lineHeight: 1.2, color: "#FFFFFF", letterSpacing: "-0.02em", margin: "0 0 12px" }}>
            Bắt đầu hành trình với <span style={{ color: "#E4011E" }}>TrustSim</span>
          </h2>
          <p style={{ fontSize: 14, color: "rgba(255, 255, 255, 0.8)", lineHeight: 1.7, marginBottom: 32 }}>
            Chỉ 3 bước đơn giản để sở hữu tài khoản đấu giá SIM chính chủ, an toàn tuyệt đối.
          </p>

          {/* Stepper Vertical List */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {STEPS.map((step, i) => {
              const isDone = i < stepIndex;
              const isActive = step.key === currentStep;
              return (
                <div
                  key={step.key}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 14,
                    padding: "12px 14px",
                    borderRadius: 6,
                    background: isActive ? "rgba(255, 255, 255, 0.12)" : "rgba(255, 255, 255, 0.04)",
                    border: `1px solid ${isActive ? "rgba(228, 1, 30, 0.4)" : isDone ? "rgba(22, 163, 74, 0.3)" : "rgba(255, 255, 255, 0.1)"}`,
                    backdropFilter: "blur(12px)",
                    WebkitBackdropFilter: "blur(12px)",
                    transition: "all 0.25s ease",
                  }}
                >
                  <div
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 4,
                      flexShrink: 0,
                      background: isDone ? "#16A34A" : isActive ? "#E4011E" : "rgba(255,255,255,0.1)",
                      color: "#FFFFFF",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 14,
                      fontWeight: 800,
                    }}
                  >
                    {isDone ? <Icons.Check /> : step.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: isActive ? "#FFFFFF" : isDone ? "#BBF7D0" : "rgba(255,255,255,0.6)", marginBottom: 2 }}>
                      {step.label}
                    </div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)" }}>{step.desc}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom Safety Assurance */}
        <div style={{ position: "relative", zIndex: 2, display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "rgba(255, 255, 255, 0.6)" }}>
          <span style={{ color: "#16A34A" }}><Icons.Shield /></span>
          <span>Bảo mật dữ liệu cá nhân theo tiêu chuẩn an toàn cao nhất</span>
        </div>
      </div>

      {/* ─── RIGHT FORM PANEL (Grouped Inputs, Slide Flow) ─── */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "48px 36px",
          background: "#FFFFFF",
        }}
      >
        <div style={{ width: "100%", maxWidth: 460 }}>
          {/* Top Step Progress Indicator */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: "#E4011E", letterSpacing: "0.04em", textTransform: "uppercase" }}>
                Bước {stepIndex + 1} / {STEPS.length}
              </span>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#001743" }}>
                {STEPS[stepIndex].label}
              </span>
            </div>
            {/* Clean Progress Track */}
            <div style={{ height: 4, background: "#E5E7EB", borderRadius: 2, overflow: "hidden" }}>
              <div
                style={{
                  height: "100%",
                  width: `${((stepIndex + 1) / STEPS.length) * 100}%`,
                  background: "#E4011E",
                  borderRadius: 2,
                  transition: "width 0.35s ease",
                }}
              />
            </div>
          </div>

          {/* Progressive Step Views */}
          {currentStep === "account" && <AccountStep onNext={handleNext} loading={loading} />}
          {currentStep === "identity" && (
            <IdentityStep
              onNext={handleNext}
              onBack={() => setCurrentStep("account")}
              loading={loading}
            />
          )}
          {currentStep === "sim" && (
            <SimStep
              onNext={handleNext}
              onBack={() => setCurrentStep("identity")}
              loading={loading}
            />
          )}

          {/* Footer Link */}
          <p style={{ textAlign: "center", fontSize: 13, color: "#6B7280", marginTop: 24 }}>
            Đã có tài khoản?{" "}
            <Link href="/login" style={{ color: "#E4011E", fontWeight: 700, textDecoration: "none" }}>
              Đăng nhập ngay
            </Link>
          </p>
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

/* ─── STEP 1: ACCOUNT & PERSONAL INFO (Clear Grouping) ─────── */
function AccountStep({ onNext, loading }: { onNext: () => void; loading: boolean }) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  return (
    <form onSubmit={(e) => { e.preventDefault(); onNext(); }} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <h1 style={{ fontSize: 26, fontWeight: 900, color: "#001743", letterSpacing: "-0.02em", margin: "0 0 6px" }}>
          Tạo tài khoản mới
        </h1>
        <p style={{ color: "#6B7280", fontSize: 14, margin: 0 }}>
          Điền các thông tin để tạo hồ sơ đấu giá của bạn
        </p>
      </div>

      {/* Group 1: Personal Info */}
      <div style={{ background: "#F8F9FA", padding: "16px", borderRadius: 6, border: "1px solid #E5E7EB" }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: "#001743", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 12 }}>
          1. Thông tin cá nhân
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#001743", marginBottom: 4 }}>Họ & đệm</label>
            <input
              className="input-field"
              placeholder="Nguyễn Văn"
              required
              style={{
                width: "100%",
                padding: "10px 12px",
                fontSize: 13,
                borderRadius: 4,
                border: "1px solid #D1D5DB",
                outline: "none",
                background: "#FFFFFF",
              }}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#001743", marginBottom: 4 }}>Tên</label>
            <input
              className="input-field"
              placeholder="An"
              required
              style={{
                width: "100%",
                padding: "10px 12px",
                fontSize: 13,
                borderRadius: 4,
                border: "1px solid #D1D5DB",
                outline: "none",
                background: "#FFFFFF",
              }}
            />
          </div>
        </div>
        <div>
          <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#001743", marginBottom: 4 }}>Số điện thoại liên hệ</label>
          <input
            type="tel"
            className="input-field"
            placeholder="0988 xxx xxx"
            required
            style={{
              width: "100%",
              padding: "10px 12px",
              fontSize: 13,
              borderRadius: 4,
              border: "1px solid #D1D5DB",
              outline: "none",
              background: "#FFFFFF",
            }}
          />
        </div>
      </div>

      {/* Group 2: Account Security */}
      <div style={{ background: "#F8F9FA", padding: "16px", borderRadius: 6, border: "1px solid #E5E7EB" }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: "#001743", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 12 }}>
          2. Bảo mật & Đăng nhập
        </div>
        <div style={{ marginBottom: 10 }}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#001743", marginBottom: 4 }}>Địa chỉ Email</label>
          <input
            type="email"
            className="input-field"
            placeholder="example@gmail.com"
            required
            style={{
              width: "100%",
              padding: "10px 12px",
              fontSize: 13,
              borderRadius: 4,
              border: "1px solid #D1D5DB",
              outline: "none",
              background: "#FFFFFF",
            }}
          />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#001743", marginBottom: 4 }}>Mật khẩu</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Tối thiểu 8 ký tự"
              required
              style={{
                width: "100%",
                padding: "10px 12px",
                fontSize: 13,
                borderRadius: 4,
                border: "1px solid #D1D5DB",
                outline: "none",
                background: "#FFFFFF",
              }}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#001743", marginBottom: 4 }}>Xác nhận mật khẩu</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Nhập lại mật khẩu"
              required
              style={{
                width: "100%",
                padding: "10px 12px",
                fontSize: 13,
                borderRadius: 4,
                border: "1px solid #D1D5DB",
                outline: "none",
                background: "#FFFFFF",
              }}
            />
          </div>
        </div>
      </div>

      {/* Agreement checkbox */}
      <label style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 12, color: "#6B7280", cursor: "pointer" }}>
        <input type="checkbox" required style={{ accentColor: "#E4011E", marginTop: 2 }} />
        <span>
          Tôi cam kết thông tin cung cấp là chính xác và đồng ý với{" "}
          <Link href="/terms" style={{ color: "#E4011E", fontWeight: 600, textDecoration: "none" }}>Điều khoản dịch vụ</Link>
          {" "}và{" "}
          <Link href="/privacy" style={{ color: "#E4011E", fontWeight: 600, textDecoration: "none" }}>Chính sách bảo mật</Link>
        </span>
      </label>

      {/* Solid Red CTA Button */}
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
          transition: "background 0.2s ease",
        }}
      >
        {loading ? (
          <>
            <span style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "#FFFFFF", borderRadius: "50%", animation: "spin 0.8s linear infinite", display: "inline-block" }} />
            <span>Đang khởi tạo...</span>
          </>
        ) : (
          "Tiếp tục xác thực →"
        )}
      </button>
    </form>
  );
}

/* ─── STEP 2: IDENTITY VERIFICATION (CCCD Upload) ──────────── */
function IdentityStep({ onNext, onBack, loading }: { onNext: () => void; onBack: () => void; loading: boolean }) {
  const [frontUploaded, setFrontUploaded] = useState(false);
  const [backUploaded, setBackUploaded] = useState(false);
  const [idNumber, setIdNumber] = useState("");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <button
          type="button"
          onClick={onBack}
          style={{ background: "none", border: "none", color: "#6B7280", cursor: "pointer", fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 6, padding: 0, marginBottom: 12 }}
        >
          <Icons.ArrowLeft /> Quay lại bước 1
        </button>
        <h1 style={{ fontSize: 26, fontWeight: 900, color: "#001743", letterSpacing: "-0.02em", margin: "0 0 6px" }}>
          Định danh tài khoản
        </h1>
        <p style={{ color: "#6B7280", fontSize: 14, margin: 0 }}>
          Tải ảnh CCCD để bảo đảm quyền sở hữu hợp pháp khi đấu giá SIM
        </p>
      </div>

      {/* Guide Note */}
      <div style={{ padding: "12px 14px", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 6, fontSize: 12, color: "#991B1B", lineHeight: 1.5, display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ color: "#E4011E" }}><Icons.Shield /></span>
        <span>Ảnh chụp cần rõ nét, không bị chói sáng hoặc che khuất góc.</span>
      </div>

      {/* 2 Upload Boxes */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {[
          { label: "Mặt trước CCCD", key: "front", uploaded: frontUploaded, setUploaded: setFrontUploaded },
          { label: "Mặt sau CCCD", key: "back", uploaded: backUploaded, setUploaded: setBackUploaded },
        ].map(({ label, key, uploaded, setUploaded }) => (
          <div key={key}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#001743", marginBottom: 6 }}>{label}</label>
            <div
              onClick={() => setUploaded(true)}
              style={{
                height: 120,
                border: `2px dashed ${uploaded ? "#16A34A" : "#D1D5DB"}`,
                borderRadius: 6,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                cursor: "pointer",
                background: uploaded ? "#F0FDF4" : "#F8F9FA",
                transition: "all 0.2s ease",
              }}
            >
              <div style={{ color: uploaded ? "#16A34A" : "#9CA3AF" }}>
                {uploaded ? <Icons.CheckCircle /> : <Icons.Camera />}
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, color: uploaded ? "#16A34A" : "#4B5563" }}>
                {uploaded ? "Đã tải lên ảnh" : "Nhấp để chọn ảnh"}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div>
        <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#001743", marginBottom: 6 }}>
          Số Căn cước công dân (12 số)
        </label>
        <input
          type="text"
          value={idNumber}
          onChange={(e) => setIdNumber(e.target.value)}
          placeholder="0012010xxxxx"
          maxLength={12}
          required
          style={{
            width: "100%",
            padding: "11px 14px",
            fontSize: 14,
            borderRadius: 6,
            border: "1px solid #D1D5DB",
            outline: "none",
            background: "#FFFFFF",
          }}
        />
      </div>

      <button
        type="button"
        disabled={loading || !frontUploaded || !backUploaded}
        onClick={onNext}
        style={{
          width: "100%",
          padding: "13px 20px",
          fontSize: 15,
          fontWeight: 700,
          borderRadius: 6,
          border: "none",
          background: frontUploaded && backUploaded ? "#E4011E" : "#9CA3AF",
          color: "#FFFFFF",
          cursor: frontUploaded && backUploaded ? "pointer" : "not-allowed",
          boxShadow: frontUploaded && backUploaded ? "0 4px 14px rgba(228, 1, 30, 0.28)" : "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
        }}
      >
        {loading ? "Đang xác thực hồ sơ..." : "Tiếp tục sang Bước 3 →"}
      </button>
    </div>
  );
}

/* ─── STEP 3: PHONE & OTP ACTIVATION ──────────────────────── */
function SimStep({ onNext, onBack, loading }: { onNext: () => void; onBack: () => void; loading: boolean }) {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  const handleOtp = (i: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...otp];
    next[i] = val.slice(-1);
    setOtp(next);
    if (val && i < 5) refs.current[i + 1]?.focus();
  };

  const handleOtpKey = (i: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[i] && i > 0) refs.current[i - 1]?.focus();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <button
          type="button"
          onClick={onBack}
          style={{ background: "none", border: "none", color: "#6B7280", cursor: "pointer", fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 6, padding: 0, marginBottom: 12 }}
        >
          <Icons.ArrowLeft /> Quay lại bước 2
        </button>
        <h1 style={{ fontSize: 26, fontWeight: 900, color: "#001743", letterSpacing: "-0.02em", margin: "0 0 6px" }}>
          Kích hoạt tài khoản
        </h1>
        <p style={{ color: "#6B7280", fontSize: 14, margin: 0 }}>
          Nhập mã OTP 6 số đã được gửi đến số điện thoại của bạn
        </p>
      </div>

      <div style={{ display: "flex", gap: 8, margin: "16px 0", justifyContent: "center" }}>
        {otp.map((digit, i) => (
          <input
            key={i}
            ref={(el) => { refs.current[i] = el; }}
            type="text"
            inputMode="numeric"
            value={digit}
            onChange={(e) => handleOtp(i, e.target.value)}
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
            }}
          />
        ))}
      </div>

      <button
        type="button"
        disabled={loading}
        onClick={onNext}
        style={{
          width: "100%",
          padding: "13px 20px",
          fontSize: 15,
          fontWeight: 700,
          borderRadius: 6,
          border: "none",
          background: "#E4011E",
          color: "#FFFFFF",
          cursor: "pointer",
          boxShadow: "0 4px 14px rgba(228, 1, 30, 0.28)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
        }}
      >
        {loading ? "Đang kích hoạt..." : "Hoàn tất đăng ký & Bắt đầu"}
      </button>

      <p style={{ textAlign: "center", fontSize: 13, color: "#6B7280", margin: 0 }}>
        Chưa nhận được mã?{" "}
        <button
          type="button"
          style={{ background: "none", border: "none", color: "#E4011E", fontWeight: 700, cursor: "pointer", fontSize: 13, padding: 0 }}
        >
          Gửi lại mã OTP
        </button>
      </p>
    </div>
  );
}
