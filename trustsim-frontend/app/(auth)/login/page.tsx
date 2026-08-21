"use client";
import React from "react";
import Link from "next/link";

export default function LoginPage() {
  const [step, setStep] = React.useState<"credentials" | "otp">("credentials");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [otp, setOtp] = React.useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const otpRefs = React.useRef<(HTMLInputElement | null)[]>([]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep("otp");
    }, 1200);
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
    <div style={{ minHeight: "100vh", display: "flex" }}>
      <div className="mesh-bg" />

      {/* Left brand panel */}
      <div style={{
        flex: "0 0 45%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "60px 64px",
        background: "linear-gradient(150deg, rgba(49,46,129,0.8) 0%, rgba(79,70,229,0.6) 50%, rgba(6,182,212,0.3) 100%)",
        borderRight: "1px solid rgba(255,255,255,0.08)",
        position: "relative",
        overflow: "hidden",
      }}
      className="auth-brand-panel"
      >
        {/* Decorative circles */}
        <div style={{ position: "absolute", top: -100, right: -100, width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(79,70,229,0.3), transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: -80, left: -80, width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, rgba(6,182,212,0.2), transparent 70%)", pointerEvents: "none" }} />

        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", marginBottom: 60, position: "relative" }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: "linear-gradient(135deg, #312E81, #4F46E5, #06B6D4)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, color: "#fff", fontSize: 16, boxShadow: "0 4px 16px rgba(79,70,229,0.5)" }}>
            TS
          </div>
          <span style={{ fontSize: 22, fontWeight: 800, color: "#fff" }}>TrustSim</span>
        </Link>

        <div style={{ position: "relative", zIndex: 1 }}>
          <h2 style={{ fontSize: "2.2rem", fontWeight: 900, lineHeight: 1.2, marginBottom: 20, color: "#fff" }}>
            Chào mừng<br />
            <span style={{ background: "linear-gradient(135deg, #a5b4fc, #67e8f9)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              trở lại!
            </span>
          </h2>
          <p style={{ fontSize: 15, color: "rgba(255,255,255,0.65)", lineHeight: 1.7, marginBottom: 48 }}>
            Đăng nhập để tham gia đấu giá sim số đẹp, quản lý giao dịch và theo dõi hợp đồng của bạn.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {[
              { icon: "🔐", text: "Xác thực 2 lớp OTP bảo mật cao" },
              { icon: "⚡", text: "Cập nhật đấu giá theo thời gian thực" },
              { icon: "📄", text: "Hợp đồng điện tử & chữ ký số" },
            ].map(({ icon, text }) => (
              <div key={text} style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 14, color: "rgba(255,255,255,0.7)" }}>
                <span style={{ fontSize: 18 }}>{icon}</span>
                {text}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 32,
        position: "relative",
        zIndex: 1,
      }}>
        <div style={{ width: "100%", maxWidth: 420 }}>
          {step === "credentials" ? (
            <>
              <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 6 }}>Đăng nhập</h1>
              <p style={{ color: "var(--text-secondary)", fontSize: 14, marginBottom: 32 }}>
                Chưa có tài khoản?{" "}
                <Link href="/register" style={{ color: "var(--indigo-light)", fontWeight: 600, textDecoration: "none" }}>
                  Đăng ký ngay
                </Link>
              </p>

              <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <div>
                  <label className="label">Email hoặc số điện thoại</label>
                  <input
                    id="login-email"
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-field"
                    placeholder="example@email.com"
                    required
                  />
                </div>

                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <label className="label" style={{ margin: 0 }}>Mật khẩu</label>
                    <Link href="/forgot-password" style={{ fontSize: 12, color: "var(--text-muted)", textDecoration: "none" }}>
                      Quên mật khẩu?
                    </Link>
                  </div>
                  <div style={{ position: "relative" }}>
                    <input
                      id="login-password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="input-field"
                      placeholder="••••••••"
                      required
                      style={{ paddingRight: 44 }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: 16 }}
                    >
                      {showPassword ? "🙈" : "👁️"}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn-primary"
                  style={{ padding: "13px", fontSize: 15, width: "100%", opacity: loading ? 0.7 : 1 }}
                  disabled={loading}
                >
                  {loading ? (
                    <span style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center" }}>
                      <span style={{ width: 14, height: 14, border: "2px solid #fff4", borderTopColor: "#fff", borderRadius: "50%", animation: "spin-slow 0.8s linear infinite", display: "inline-block" }} />
                      Đang xử lý...
                    </span>
                  ) : "Đăng nhập"}
                </button>

                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ flex: 1, height: 1, background: "var(--border-subtle)" }} />
                  <span style={{ fontSize: 12, color: "var(--text-muted)" }}>hoặc</span>
                  <div style={{ flex: 1, height: 1, background: "var(--border-subtle)" }} />
                </div>

                <button
                  type="button"
                  className="btn-secondary"
                  style={{ padding: "12px", fontSize: 14, display: "flex", alignItems: "center", gap: 8, justifyContent: "center" }}
                >
                  <span style={{ fontSize: 18 }}>G</span> Đăng nhập với Google
                </button>
              </form>
            </>
          ) : (
            <>
              <button
                onClick={() => setStep("credentials")}
                style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 14, marginBottom: 24, display: "flex", alignItems: "center", gap: 6, fontFamily: "Inter, sans-serif" }}
              >
                ← Quay lại
              </button>

              <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 6 }}>Xác thực OTP</h1>
              <p style={{ color: "var(--text-secondary)", fontSize: 14, marginBottom: 32 }}>
                Nhập mã 6 số đã được gửi đến <strong>{email}</strong>
              </p>

              <div style={{ display: "flex", gap: 10, marginBottom: 32, justifyContent: "center" }}>
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
                      width: 52,
                      height: 60,
                      textAlign: "center",
                      fontSize: 22,
                      fontWeight: 800,
                      background: "rgba(255,255,255,0.05)",
                      border: `2px solid ${digit ? "rgba(79,70,229,0.6)" : "rgba(255,255,255,0.1)"}`,
                      borderRadius: 12,
                      color: "var(--text-primary)",
                      outline: "none",
                      fontFamily: "Inter, sans-serif",
                      transition: "border-color 0.2s",
                    }}
                  />
                ))}
              </div>

              <button
                className="btn-primary"
                style={{ padding: "13px", fontSize: 15, width: "100%" }}
                onClick={() => { window.location.href = "/"; }}
              >
                Xác nhận & Đăng nhập
              </button>

              <p style={{ textAlign: "center", fontSize: 13, color: "var(--text-muted)", marginTop: 20 }}>
                Không nhận được mã?{" "}
                <button style={{ background: "none", border: "none", color: "var(--indigo-light)", cursor: "pointer", fontSize: 13, fontFamily: "Inter, sans-serif" }}>
                  Gửi lại (59s)
                </button>
              </p>
            </>
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .auth-brand-panel { display: none !important; }
        }
      `}</style>
    </div>
  );
}
