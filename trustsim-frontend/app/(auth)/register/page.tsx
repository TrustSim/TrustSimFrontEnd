"use client";
import React from "react";
import Link from "next/link";

type Step = "account" | "identity" | "sim";

const STEPS: { key: Step; icon: string; label: string; desc: string }[] = [
  { key: "account", icon: "👤", label: "Thông tin tài khoản", desc: "Email, mật khẩu, số điện thoại" },
  { key: "identity", icon: "🪪", label: "Xác minh danh tính", desc: "Chụp ảnh CCCD 2 mặt" },
  { key: "sim", icon: "📱", label: "Xác minh số SIM", desc: "Nhận OTP trên số điện thoại" },
];

export default function RegisterPage() {
  const [currentStep, setCurrentStep] = React.useState<Step>("account");
  const [loading, setLoading] = React.useState(false);

  const stepIndex = STEPS.findIndex((s) => s.key === currentStep);

  const handleNext = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      if (currentStep === "account") setCurrentStep("identity");
      else if (currentStep === "identity") setCurrentStep("sim");
      else window.location.href = "/";
    }, 800);
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex" }}>
      <div className="mesh-bg" />

      {/* Left brand panel */}
      <div
        className="auth-brand-panel"
        style={{
          flex: "0 0 40%",
          padding: "48px 48px",
          background: "linear-gradient(150deg, rgba(49,46,129,0.8), rgba(79,70,229,0.5), rgba(6,182,212,0.3))",
          borderRight: "1px solid rgba(255,255,255,0.08)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div style={{ position: "absolute", top: -80, right: -80, width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, rgba(79,70,229,0.35), transparent 70%)", pointerEvents: "none" }} />

        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", position: "relative" }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: "linear-gradient(135deg, #312E81, #4F46E5, #06B6D4)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, color: "#fff", fontSize: 16 }}>TS</div>
          <span style={{ fontSize: 22, fontWeight: 800, color: "#fff" }}>TrustSim</span>
        </Link>

        {/* Step progress sidebar */}
        <div style={{ position: "relative", zIndex: 1 }}>
          <h2 style={{ fontSize: "1.8rem", fontWeight: 900, color: "#fff", marginBottom: 12 }}>Đăng ký tài khoản</h2>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 14, marginBottom: 40 }}>3 bước đơn giản để bắt đầu tham gia đấu giá</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {STEPS.map((step, i) => {
              const done = i < stepIndex;
              const active = step.key === currentStep;
              return (
                <div key={step.key} style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                  <div style={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    flexShrink: 0,
                    background: done ? "rgba(34,197,94,0.3)" : active ? "rgba(79,70,229,0.5)" : "rgba(255,255,255,0.08)",
                    border: `2px solid ${done ? "rgba(34,197,94,0.7)" : active ? "rgba(79,70,229,0.8)" : "rgba(255,255,255,0.15)"}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 16,
                    transition: "all 0.3s",
                  }}>
                    {done ? "✓" : step.icon}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14, color: active ? "#fff" : "rgba(255,255,255,0.6)", marginBottom: 2 }}>{step.label}</div>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>{step.desc}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", position: "relative" }}>
          Dữ liệu của bạn được bảo vệ theo chính sách bảo mật TrustSim
        </p>
      </div>

      {/* Right form */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 32, position: "relative", zIndex: 1 }}>
        <div style={{ width: "100%", maxWidth: 440 }}>
          {/* Progress bar */}
          <div style={{ marginBottom: 32 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>Bước {stepIndex + 1} / {STEPS.length}</span>
              <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
                {STEPS[stepIndex].label}
              </span>
            </div>
            <div style={{ height: 4, background: "rgba(255,255,255,0.08)", borderRadius: 2, overflow: "hidden" }}>
              <div style={{
                height: "100%",
                width: `${((stepIndex + 1) / STEPS.length) * 100}%`,
                background: "linear-gradient(90deg, #4F46E5, #06B6D4)",
                borderRadius: 2,
                transition: "width 0.4s ease",
              }} />
            </div>
          </div>

          {currentStep === "account" && <AccountStep onNext={handleNext} loading={loading} />}
          {currentStep === "identity" && <IdentityStep onNext={handleNext} loading={loading} />}
          {currentStep === "sim" && <SimStep onNext={handleNext} loading={loading} />}

          <p style={{ textAlign: "center", fontSize: 13, color: "var(--text-muted)", marginTop: 24 }}>
            Đã có tài khoản?{" "}
            <Link href="/login" style={{ color: "var(--indigo-light)", fontWeight: 600, textDecoration: "none" }}>
              Đăng nhập
            </Link>
          </p>
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

function AccountStep({ onNext, loading }: { onNext: () => void; loading: boolean }) {
  return (
    <form onSubmit={(e) => { e.preventDefault(); onNext(); }} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div>
        <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>Tạo tài khoản</h1>
        <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>Nhập thông tin cơ bản của bạn</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <label className="label">Họ</label>
          <input className="input-field" placeholder="Nguyễn" required />
        </div>
        <div>
          <label className="label">Tên</label>
          <input className="input-field" placeholder="Văn An" required />
        </div>
      </div>
      <div>
        <label className="label">Email</label>
        <input type="email" className="input-field" placeholder="example@gmail.com" required />
      </div>
      <div>
        <label className="label">Số điện thoại</label>
        <input type="tel" className="input-field" placeholder="09xxxxxxxx" required />
      </div>
      <div>
        <label className="label">Mật khẩu</label>
        <input type="password" className="input-field" placeholder="Tối thiểu 8 ký tự" required />
      </div>
      <div>
        <label className="label">Xác nhận mật khẩu</label>
        <input type="password" className="input-field" placeholder="Nhập lại mật khẩu" required />
      </div>
      <label style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 12, color: "var(--text-muted)", cursor: "pointer" }}>
        <input type="checkbox" required style={{ accentColor: "var(--indigo-mid)", marginTop: 2 }} />
        Tôi đồng ý với{" "}
        <Link href="/terms" style={{ color: "var(--indigo-light)", textDecoration: "none" }}>Điều khoản dịch vụ</Link>
        {" "}và{" "}
        <Link href="/privacy" style={{ color: "var(--indigo-light)", textDecoration: "none" }}>Chính sách bảo mật</Link>
      </label>
      <SubmitButton loading={loading}>Tiếp tục →</SubmitButton>
    </form>
  );
}

function IdentityStep({ onNext, loading }: { onNext: () => void; loading: boolean }) {
  const [frontUploaded, setFrontUploaded] = React.useState(false);
  const [backUploaded, setBackUploaded] = React.useState(false);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>Xác minh danh tính</h1>
        <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>Chụp ảnh CCCD để xác minh eKYC</p>
      </div>

      <div style={{ padding: 16, background: "rgba(234,179,8,0.08)", border: "1px solid rgba(234,179,8,0.3)", borderRadius: 12, fontSize: 13, color: "#fde047" }}>
        ⚠️ Ảnh CCCD phải rõ ràng, không bị lóa, không che khuất thông tin
      </div>

      {[
        { label: "Mặt trước CCCD", key: "front", uploaded: frontUploaded, setUploaded: setFrontUploaded },
        { label: "Mặt sau CCCD", key: "back", uploaded: backUploaded, setUploaded: setBackUploaded },
      ].map(({ label, key, uploaded, setUploaded }) => (
        <div key={key}>
          <label className="label">{label}</label>
          <div
            onClick={() => setUploaded(true)}
            style={{
              height: 120,
              border: `2px dashed ${uploaded ? "rgba(34,197,94,0.5)" : "rgba(255,255,255,0.15)"}`,
              borderRadius: 12,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              cursor: "pointer",
              background: uploaded ? "rgba(34,197,94,0.06)" : "rgba(255,255,255,0.02)",
              transition: "all 0.2s",
            }}
          >
            <span style={{ fontSize: 28 }}>{uploaded ? "✅" : "📷"}</span>
            <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
              {uploaded ? "Đã tải lên" : "Nhấp để chụp ảnh"}
            </span>
          </div>
        </div>
      ))}

      <div>
        <label className="label">Số CCCD</label>
        <input className="input-field" placeholder="0xxxxxxxxx" maxLength={12} />
      </div>

      <SubmitButton loading={loading} disabled={!frontUploaded || !backUploaded}>Tiếp tục →</SubmitButton>
    </div>
  );
}

function SimStep({ onNext, loading }: { onNext: () => void; loading: boolean }) {
  const [otpSent, setOtpSent] = React.useState(false);
  const [otp, setOtp] = React.useState(["", "", "", "", "", ""]);
  const refs = React.useRef<(HTMLInputElement | null)[]>([]);

  const handleOtp = (i: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...otp];
    next[i] = val.slice(-1);
    setOtp(next);
    if (val && i < 5) refs.current[i + 1]?.focus();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>Xác minh số SIM</h1>
        <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>Xác nhận bạn đang sở hữu số điện thoại đăng ký</p>
      </div>

      <div style={{ padding: 16, background: "rgba(79,70,229,0.08)", border: "1px solid rgba(79,70,229,0.2)", borderRadius: 12, fontSize: 13, color: "var(--text-accent)" }}>
        📱 Mã OTP sẽ được gửi đến <strong>09xxxxxxxx</strong>
      </div>

      {!otpSent ? (
        <button
          onClick={() => setOtpSent(true)}
          className="btn-primary"
          style={{ padding: "13px", fontSize: 15 }}
        >
          📩 Gửi mã OTP
        </button>
      ) : (
        <>
          <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>Nhập mã OTP 6 chữ số:</p>
          <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
            {otp.map((d, i) => (
              <input
                key={i}
                ref={(el) => { refs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                value={d}
                onChange={(e) => handleOtp(i, e.target.value)}
                maxLength={1}
                style={{
                  width: 52,
                  height: 60,
                  textAlign: "center",
                  fontSize: 22,
                  fontWeight: 800,
                  background: "rgba(255,255,255,0.05)",
                  border: `2px solid ${d ? "rgba(79,70,229,0.6)" : "rgba(255,255,255,0.1)"}`,
                  borderRadius: 12,
                  color: "var(--text-primary)",
                  outline: "none",
                  fontFamily: "Inter, sans-serif",
                }}
              />
            ))}
          </div>
          <SubmitButton loading={loading} onClick={onNext}>
            🎉 Hoàn tất đăng ký
          </SubmitButton>
        </>
      )}
    </div>
  );
}

function SubmitButton({ children, loading, disabled, onClick }: { children: React.ReactNode; loading: boolean; disabled?: boolean; onClick?: () => void }) {
  return (
    <button
      type={onClick ? "button" : "submit"}
      onClick={onClick}
      className="btn-primary"
      style={{ padding: "13px", fontSize: 15, width: "100%", opacity: loading || disabled ? 0.6 : 1, cursor: disabled ? "not-allowed" : undefined }}
      disabled={loading || disabled}
    >
      {loading ? (
        <span style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center" }}>
          <span style={{ width: 14, height: 14, border: "2px solid #fff4", borderTopColor: "#fff", borderRadius: "50%", animation: "spin-slow 0.8s linear infinite", display: "inline-block" }} />
          Đang xử lý...
        </span>
      ) : children}
    </button>
  );
}
