"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authService } from "@/services/authService";
import { ToastContainer, ToastMessage } from "@/components/ui/Toast";
import { identityValidators } from "@/utils/validators";

/* --- Inline SVG Icons ---------------------------------------- */
const Icons = {
  Check: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  ArrowLeft: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
    </svg>
  ),
  ShieldCheck: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><polyline points="9 12 11 14 15 10" />
    </svg>
  ),
  Eye: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
    </svg>
  ),
  EyeOff: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  ),
  Mail: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  ),
};

/* --- Password Strength Utility ------------------------------- */
function getPasswordStrength(pwd: string): { score: number; label: string; color: string } {
  if (!pwd) return { score: 0, label: "", color: "#E5E7EB" };
  let score = 0;
  if (pwd.length >= 8) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[a-z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[!?*@#$%^&+=]/.test(pwd)) score++;
  if (score <= 2) return { score, label: "Yếu", color: "#EF4444" };
  if (score === 3) return { score, label: "Trung bình", color: "#F59E0B" };
  if (score === 4) return { score, label: "Khá", color: "#3B82F6" };
  return { score, label: "Mạnh", color: "#16A34A" };
}

type Step = "form" | "otp";

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("form");
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [otpCountdown, setOtpCountdown] = useState(0);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (otpCountdown <= 0) return;
    const t = setInterval(() => setOtpCountdown((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, [otpCountdown]);

  const addToast = (toast: Omit<ToastMessage, "id">) => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 5);
    setToasts((prev) => [...prev, { ...toast, id }]);
  };
  const removeToast = (id: string) => setToasts((prev) => prev.filter((t) => t.id !== id));

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const valRes = identityValidators.validateRegister({
      userName,
      email,
      password,
    });
    if (!valRes.isValid) {
      addToast({
        type: "error",
        title: "Thông tin đăng ký chưa hợp lệ",
        message: valRes.error || "Vui lòng kiểm tra lại thông tin đăng ký.",
      });
      return;
    }

    if (password !== confirmPassword) {
      addToast({ type: "error", title: "Mật khẩu không khớp", message: "Mật khẩu xác nhận không trùng khớp." });
      return;
    }

    setLoading(true);
    try {
      const result = await authService.register({
        userName: userName.trim(),
        email: email.trim().toLowerCase(),
        password,
      });
      setOtpCountdown(result.cooldownSeconds || 60);
      setOtp(["", "", "", "", "", ""]);
      setStep("otp");
      addToast({ type: "success", title: "Đã gửi mã OTP", message: `Mã xác thực 6 chữ số đã gửi tới ${email.trim()}. Kiểm tra hộp thư (kể cả Spam).`, duration: 6000 });
      setTimeout(() => otpRefs.current[0]?.focus(), 150);
    } catch (err: any) {
      addToast({ type: "error", title: "Đăng ký thất bại", message: err.message || "Không thể gửi mã xác thực." });
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (otpCountdown > 0) return;
    setLoading(true);
    try {
      const result = await authService.register({ userName: userName.trim(), email: email.trim().toLowerCase(), password });
      setOtpCountdown(result.cooldownSeconds || 60);
      setOtp(["", "", "", "", "", ""]);
      addToast({ type: "info", title: "Đã gửi lại OTP", message: `Mã mới đã gửi tới ${email}.`, duration: 4000 });
      setTimeout(() => otpRefs.current[0]?.focus(), 150);
    } catch (err: any) {
      addToast({ type: "error", title: "Gửi lại thất bại", message: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    const digits = value.replace(/\D/g, "");
    if (!digits && value) return;
    if (digits.length > 1) {
      const next = [...otp];
      for (let i = 0; i < digits.length && index + i < 6; i++) next[index + i] = digits[i];
      setOtp(next);
      otpRefs.current[Math.min(index + digits.length, 5)]?.focus();
      return;
    }
    const next = [...otp];
    next[index] = digits;
    setOtp(next);
    if (digits && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKey = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) otpRefs.current[index - 1]?.focus();
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join("");
    if (code.length < 6) {
      addToast({ type: "error", title: "Thiếu mã OTP", message: "Vui lòng nhập đầy đủ 6 chữ số." });
      return;
    }
    setLoading(true);
    try {
      const authData = await authService.verifyEmail({ email: email.trim().toLowerCase(), otpCode: code });
      addToast({ type: "success", title: "Đăng ký thành công! 🎉", message: `Chào mừng ${authData.userName} đến với TrustSim! Đang chuyển hướng...`, duration: 3000 });
      setTimeout(() => router.push("/profile"), 1200);
    } catch (err: any) {
      addToast({ type: "error", title: "Mã OTP không hợp lệ", message: err.message || "Mã OTP không đúng hoặc đã hết hạn." });
    } finally {
      setLoading(false);
    }
  };

  const pwdStrength = getPasswordStrength(password);
  const stepsMeta = [
    { label: "Thông tin tài khoản", desc: "Username, Email & Mật khẩu" },
    { label: "Xác thực Email OTP", desc: "Mã 6 số gửi tới hộp thư" },
  ];

  return (
    <div style={{ minHeight: "calc(100vh - 64px)", paddingTop: 76, paddingBottom: 40, background: "#F8F9FA", display: "flex", alignItems: "center" }}>
      <ToastContainer toasts={toasts} onClose={removeToast} />
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "0 16px", width: "100%" }}>
        <div style={{ display: "grid", gridTemplateColumns: "0.85fr 1.35fr", background: "#FFFFFF", borderRadius: 10, border: "1px solid #E5E7EB", boxShadow: "0 4px 28px rgba(0,23,67,0.07)", overflow: "hidden" }}>
          {/* LEFT PANEL */}
          <div className="auth-brand-panel" style={{ padding: "40px 28px", background: "#001743 url('/banner.png') no-repeat center right / cover", position: "relative", display: "flex", flexDirection: "column", justifyContent: "space-between", color: "#FFFFFF" }}>
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg,rgba(0,23,67,0.97) 0%,rgba(0,23,67,0.88) 60%,rgba(0,23,67,0.72) 100%)", pointerEvents: "none" }} />
            <div style={{ position: "relative", zIndex: 2 }}>
              <div style={{ display: "inline-block", padding: "3px 9px", borderRadius: 4, background: "rgba(228,1,30,0.18)", border: "1px solid rgba(228,1,30,0.4)", color: "#FF4D6D", fontSize: 11, fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: 16 }}>Đăng ký tài khoản</div>
              <h2 style={{ fontSize: 21, fontWeight: 900, lineHeight: 1.3, color: "#FFFFFF", letterSpacing: "-0.02em", margin: "0 0 10px" }}>Gia nhập sàn đấu giá SIM uy tín cùng <span style={{ color: "#E4011E" }}>TrustSim</span></h2>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.75)", lineHeight: 1.6, marginBottom: 28 }}>Chỉ 2 bước đơn giản để tạo tài khoản và bắt đầu tham gia các phiên đấu giá trực tuyến.</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {stepsMeta.map((s, idx) => {
                  const isDone = step === "otp" && idx === 0;
                  const isActive = (step === "form" && idx === 0) || (step === "otp" && idx === 1);
                  return (
                    <div key={idx} style={{ background: isActive ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.05)", border: `1px solid ${isDone ? "rgba(22,163,74,0.45)" : isActive ? "rgba(228,1,30,0.5)" : "rgba(255,255,255,0.1)"}`, borderRadius: 7, padding: "10px 12px", display: "flex", gap: 10, alignItems: "center" }}>
                      <div style={{ width: 26, height: 26, borderRadius: 4, background: isDone ? "#16A34A" : isActive ? "#E4011E" : "rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: "#FFFFFF", flexShrink: 0 }}>
                        {isDone ? <Icons.Check /> : idx + 1}
                      </div>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: isActive ? "#FFFFFF" : isDone ? "#86EFAC" : "rgba(255,255,255,0.65)" }}>{s.label}</div>
                        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: 1 }}>{s.desc}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div style={{ position: "relative", zIndex: 2, paddingTop: 18, fontSize: 12, color: "rgba(255,255,255,0.55)", display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ color: "#10B981" }}><Icons.ShieldCheck /></span>
              <span>Dữ liệu được mã hóa và bảo mật đa tầng</span>
            </div>
          </div>

          {/* RIGHT FORM PANEL */}
          <div style={{ padding: "36px 36px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
            {step === "form" && (
              <div>
                <div style={{ marginBottom: 24 }}>
                  <h1 style={{ fontSize: 22, fontWeight: 900, color: "#001743", letterSpacing: "-0.02em", margin: "0 0 6px" }}>Tạo tài khoản thành viên</h1>
                  <p style={{ color: "#6B7280", fontSize: 13, margin: 0 }}>Điền thông tin bên dưới để khởi tạo tài khoản đấu giá</p>
                </div>
                <form onSubmit={handleFormSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#001743", marginBottom: 5 }}>Tên đăng nhập (Username) <span style={{ color: "#E4011E" }}>*</span></label>
                    <input type="text" placeholder="VD: Nguyễn An 99" value={userName} onChange={(e) => setUserName(e.target.value)} required autoComplete="username" className="form-input" />
                    <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 3 }}>Hỗ trợ chữ tiếng Việt, số, khoảng trắng, dấu chấm và gạch dưới. Từ 3–50 ký tự.</div>
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#001743", marginBottom: 5 }}>Địa chỉ Email <span style={{ color: "#E4011E" }}>*</span></label>
                    <div style={{ position: "relative" }}>
                      <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#9CA3AF", display: "flex" }}><Icons.Mail /></span>
                      <input type="email" placeholder="name@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" className="form-input" style={{ paddingLeft: 34 }} />
                    </div>
                    <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 3 }}>Mã xác thực OTP sẽ gửi tới địa chỉ này.</div>
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#001743", marginBottom: 5 }}>Mật khẩu <span style={{ color: "#E4011E" }}>*</span></label>
                    <div style={{ position: "relative" }}>
                      <input type={showPwd ? "text" : "password"} placeholder="Tối thiểu 8 ký tự" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="new-password" className="form-input" style={{ paddingRight: 38 }} />
                      <button type="button" onClick={() => setShowPwd((v) => !v)} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#9CA3AF", padding: 0, display: "flex" }} tabIndex={-1}>{showPwd ? <Icons.EyeOff /> : <Icons.Eye />}</button>
                    </div>
                    {password && (
                      <div style={{ marginTop: 6 }}>
                        <div style={{ display: "flex", gap: 4, marginBottom: 3 }}>
                          {[1, 2, 3, 4, 5].map((n) => (<div key={n} style={{ flex: 1, height: 3, borderRadius: 2, background: n <= pwdStrength.score ? pwdStrength.color : "#E5E7EB", transition: "background 0.2s" }} />))}
                        </div>
                        <div style={{ fontSize: 11, color: pwdStrength.color, fontWeight: 600 }}>Độ mạnh: {pwdStrength.label}</div>
                      </div>
                    )}
                    <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 3 }}>Yêu cầu: ≥8 ký tự, ít nhất 1 chữ HOA, 1 số và 1 ký tự đặc biệt (!?*@#$%^&+=).</div>
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#001743", marginBottom: 5 }}>Xác nhận mật khẩu <span style={{ color: "#E4011E" }}>*</span></label>
                    <div style={{ position: "relative" }}>
                      <input type={showConfirmPwd ? "text" : "password"} placeholder="Nhập lại mật khẩu" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required autoComplete="new-password" className="form-input" style={{ paddingRight: 38, borderColor: confirmPassword && confirmPassword !== password ? "#EF4444" : undefined }} />
                      <button type="button" onClick={() => setShowConfirmPwd((v) => !v)} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#9CA3AF", padding: 0, display: "flex" }} tabIndex={-1}>{showConfirmPwd ? <Icons.EyeOff /> : <Icons.Eye />}</button>
                    </div>
                    {confirmPassword && confirmPassword !== password && (<div style={{ fontSize: 11, color: "#EF4444", marginTop: 3 }}>Mật khẩu không khớp.</div>)}
                  </div>
                  <button type="submit" disabled={loading} className="btn-red" style={{ width: "100%", padding: "12px 18px", fontSize: 14, fontWeight: 700, borderRadius: 7, display: "flex", justifyContent: "center", alignItems: "center", gap: 7, marginTop: 4 }}>
                    {loading ? (<><span style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "#FFF", borderRadius: "50%", animation: "spin 0.8s linear infinite", display: "inline-block" }} />Đang xử lý...</>) : ("Tiếp tục →")}
                  </button>
                </form>
                <p style={{ textAlign: "center", fontSize: 12.5, color: "#6B7280", marginTop: 14, marginBottom: 0 }}>
                  Da co tai khoan? <Link href="/login" style={{ color: "#E4011E", fontWeight: 700, textDecoration: "none" }}>Đăng nhập ngay</Link>
                </p>
              </div>
            )}

            {step === "otp" && (
              <div>
                <button type="button" onClick={() => setStep("form")} style={{ background: "none", border: "none", color: "#6B7280", cursor: "pointer", fontSize: 12.5, fontWeight: 600, marginBottom: 20, display: "flex", alignItems: "center", gap: 5, padding: 0 }}>
                  <Icons.ArrowLeft /> Quay lại sửa thông tin
                </button>
                <div style={{ textAlign: "center", marginBottom: 28 }}>
                  <div style={{ width: 62, height: 62, borderRadius: "50%", background: "linear-gradient(135deg,#001743 0%,#002266 100%)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px", boxShadow: "0 8px 24px rgba(0,23,67,0.2)", color: "#FFFFFF" }}><Icons.Mail /></div>
                  <h1 style={{ fontSize: 21, fontWeight: 900, color: "#001743", letterSpacing: "-0.02em", margin: "0 0 8px" }}>Xác thực địa chỉ Email</h1>
                  <p style={{ color: "#6B7280", fontSize: 13, margin: 0, lineHeight: 1.6 }}>Chúng tôi đã gửi mã OTP 6 chữ số tới <strong style={{ color: "#001743" }}>{email}</strong>.<br />Kiểm tra hộp thư đến (kể cả thư mục <strong>Spam</strong>).</p>
                </div>
                <form onSubmit={handleVerifyOtp} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#001743", marginBottom: 12, textAlign: "center" }}>Mã xác thực OTP <span style={{ color: "#E4011E" }}>*</span></label>
                    <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
                      {otp.map((digit, i) => (
                        <input key={i} ref={(el) => { otpRefs.current[i] = el; }} type="text" inputMode="numeric" value={digit}
                          onChange={(e) => handleOtpChange(i, e.target.value)} onKeyDown={(e) => handleOtpKey(i, e)} maxLength={6}
                          style={{ width: 48, height: 56, textAlign: "center", fontSize: 24, fontWeight: 800, border: `2px solid ${digit ? "#001743" : "#E5E7EB"}`, borderRadius: 9, outline: "none", color: "#001743", background: digit ? "#F0F4FF" : "#FAFAFA", transition: "all 0.15s", fontVariantNumeric: "tabular-nums" }}
                          onFocus={(e) => { e.target.style.borderColor = "#001743"; e.target.style.boxShadow = "0 0 0 3px rgba(0,23,67,0.1)"; }}
                          onBlur={(e) => { e.target.style.borderColor = otp[i] ? "#001743" : "#E5E7EB"; e.target.style.boxShadow = "none"; }}
                        />
                      ))}
                    </div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <span style={{ fontSize: 13, color: "#6B7280" }}>Không nhận được mã? </span>
                    <button type="button" onClick={handleResend} disabled={otpCountdown > 0 || loading} style={{ background: "none", border: "none", color: otpCountdown > 0 ? "#9CA3AF" : "#E4011E", fontSize: 13, fontWeight: 700, cursor: otpCountdown > 0 ? "not-allowed" : "pointer", padding: 0 }}>
                      {otpCountdown > 0 ? `Gửi lại (${otpCountdown}s)` : "Gửi lại mã"}
                    </button>
                  </div>
                  <button type="submit" disabled={otp.join("").length < 6 || loading} style={{ width: "100%", padding: "13px", background: otp.join("").length >= 6 ? "#001743" : "#9CA3AF", color: "#FFFFFF", fontSize: 14, fontWeight: 700, border: "none", borderRadius: 7, cursor: otp.join("").length >= 6 ? "pointer" : "not-allowed", transition: "background 0.15s", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                    {loading ? (<><span style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "#FFF", borderRadius: "50%", animation: "spin 0.8s linear infinite", display: "inline-block" }} />Đang tạo tài khoản...</>) : ("Xác nhận & Hoàn tất đăng ký ✓")}
                  </button>
                </form>
                <div style={{ marginTop: 16, padding: "10px 14px", background: "#F0F4FF", border: "1px solid #C7D7FD", borderRadius: 7, fontSize: 12, color: "#3730A3", lineHeight: 1.5 }}>
                  <strong>Lưu ý:</strong> Mã OTP có hiệu lực trong <strong>10 phút</strong>. Sau khi xác thực, tài khoản sẽ được tạo và bạn sẽ được đăng nhập tự động.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .form-input { width: 100%; padding: 9px 12px; font-size: 13px; border-radius: 7px; border: 1px solid #D1D5DB; outline: none; color: #001743; background: #FFFFFF; transition: border-color 0.2s, box-shadow 0.2s; box-sizing: border-box; }
        .form-input:focus { border-color: #001743; box-shadow: 0 0 0 3px rgba(0,23,67,0.08); }
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 820px) { .auth-brand-panel { display: none !important; } }
      `}</style>
    </div>
  );
}
