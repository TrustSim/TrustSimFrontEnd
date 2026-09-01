"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  getProvinces,
  getDistricts,
  getWards,
  Province,
  District,
  Ward,
} from "@/services/vietnamAddressService";
import { authService } from "@/services/authService";

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
  MapPin: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  ),
  ShieldCheck: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <polyline points="9 12 11 14 15 10" />
    </svg>
  ),
  Check: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  ArrowLeft: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  ),
  AlertCircle: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  ),
};

type Step = "account_info" | "phone_verification";

export default function RegisterPage() {
  const [currentStep, setCurrentStep] = useState<Step>("account_info");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form State
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [identityNumber, setIdentityNumber] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");

  // Address State
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);

  const [selectedProvince, setSelectedProvince] = useState<number | "">("");
  const [selectedDistrict, setSelectedDistrict] = useState<number | "">("");
  const [selectedWard, setSelectedWard] = useState<number | "">("");
  const [streetAddress, setStreetAddress] = useState("");

  // Phone & OTP State (Final Step)
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Load Provinces on mount
  useEffect(() => {
    getProvinces().then((data) => setProvinces(data));
  }, []);

  // When province changes, load districts
  useEffect(() => {
    if (typeof selectedProvince === "number") {
      getDistricts(selectedProvince).then((data) => {
        setDistricts(data);
        setSelectedDistrict("");
        setWards([]);
        setSelectedWard("");
      });
    } else {
      setDistricts([]);
      setWards([]);
    }
  }, [selectedProvince]);

  // When district changes, load wards
  useEffect(() => {
    if (typeof selectedDistrict === "number") {
      getWards(selectedDistrict).then((data) => {
        setWards(data);
        setSelectedWard("");
      });
    } else {
      setWards([]);
    }
  }, [selectedDistrict]);

  // OTP Countdown timer
  useEffect(() => {
    if (!otpSent || countdown <= 0) return;
    const timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [otpSent, countdown]);

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validation cơ bản ở frontend
    if (password !== confirmPassword) {
      setErrorMessage("Mật khẩu xác nhận không trùng khớp!");
      return;
    }
    if (password.length < 6) {
      setErrorMessage("Mật khẩu phải có ít nhất 6 ký tự!");
      return;
    }
    if (!/^[0-9]{12}$/.test(identityNumber)) {
      setErrorMessage("Số CCCD/CMND phải bao gồm chính xác 12 chữ số!");
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setCurrentStep("phone_verification");
    }, 400);
  };

  const handleSendOtp = () => {
    setErrorMessage(null);
    const cleanPhone = phoneNumber.replace(/\s/g, "");
    if (!/^(0[3|5|7|8|9])[0-9]{8}$/.test(cleanPhone)) {
      setErrorMessage("Số điện thoại không đúng định dạng di động Việt Nam (10 chữ số, bắt đầu bằng 03, 05, 07, 08, 09).");
      return;
    }
    setOtpSent(true);
    setCountdown(60);
    // Tự động điền 6 số mô phỏng để test thuận tiện
    setOtp(["1", "2", "3", "4", "5", "6"]);
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

  const handleFinalRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const otpCode = otp.join("");
    if (otpCode.length < 6) {
      setErrorMessage("Vui lòng nhập đầy đủ 6 chữ số mã xác thực OTP.");
      return;
    }

    const cleanPhone = phoneNumber.replace(/\s/g, "");
    if (!/^(0[3|5|7|8|9])[0-9]{8}$/.test(cleanPhone)) {
      setErrorMessage("Số điện thoại không hợp lệ.");
      return;
    }

    const fullFullName = `${firstName.trim()} ${lastName.trim()}`.trim();
    const addressStr = fullAddress || "";

    setLoading(true);

    try {
      // Gọi trực tiếp AuthController.cs (/api/Auth/register)
      const authData = await authService.register({
        userName: userName.trim(),
        email: email.trim(),
        password: password,
        fullName: fullFullName,
        phoneNumber: cleanPhone,
        identityNumber: identityNumber.trim(),
        address: addressStr,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth).toISOString() : undefined,
      });

      setSuccessMessage(`Đăng ký tài khoản thành công! Xin chào ${authData.fullName}.`);

      setTimeout(() => {
        window.location.href = "/";
      }, 900);
    } catch (err: any) {
      setErrorMessage(err.message || "Đăng ký không thành công. Vui lòng kiểm tra lại thông tin.");
      setLoading(false);
    }
  };

  const fullAddress = [
    streetAddress,
    wards.find((w) => w.code === selectedWard)?.name,
    districts.find((d) => d.code === selectedDistrict)?.name,
    provinces.find((p) => p.code === selectedProvince)?.name,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <div style={{ minHeight: "calc(100vh - 64px)", paddingTop: 76, paddingBottom: 40, background: "#F8F9FA", display: "flex", alignItems: "center" }}>
      <div className="container" style={{ maxWidth: 1040, margin: "0 auto", padding: "0 16px" }}>
        {/* Main Split Grid Card */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "0.9fr 1.35fr",
            background: "#FFFFFF",
            borderRadius: 8,
            border: "1px solid #E5E7EB",
            boxShadow: "0 4px 24px rgba(0, 23, 67, 0.06)",
            overflow: "hidden",
          }}
        >
          {/* ─── LEFT BRAND & STEPPER PANEL ─── */}
          <div
            className="auth-brand-panel"
            style={{
              padding: "36px 30px",
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
                  padding: "3px 9px",
                  borderRadius: 4,
                  background: "rgba(228, 1, 30, 0.18)",
                  border: "1px solid rgba(228, 1, 30, 0.4)",
                  color: "#FF4D6D",
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  marginBottom: 14,
                }}
              >
                Đăng Ký Tài Khoản Mới
              </div>
              <h2 style={{ fontSize: 22, fontWeight: 900, lineHeight: 1.3, color: "#FFFFFF", letterSpacing: "-0.02em", margin: "0 0 10px" }}>
                Gia nhập sàn đấu giá SIM số uy tín cùng <span style={{ color: "#E4011E" }}>TrustSim</span>
              </h2>
              <p style={{ fontSize: 13, color: "rgba(255, 255, 255, 0.78)", lineHeight: 1.55, marginBottom: 24 }}>
                Chỉ 2 bước đơn giản để kích hoạt tài khoản định danh, sẵn sàng tham gia các phiên đấu giá trực tuyến.
              </p>

              {/* Stepper Display */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  {
                    stepKey: "account_info",
                    number: "1",
                    title: "Thông tin tài khoản & Địa chỉ",
                    desc: "Họ tên, Username, Email, Mật khẩu, CCCD & Địa chỉ",
                    active: currentStep === "account_info",
                    done: currentStep === "phone_verification",
                  },
                  {
                    stepKey: "phone_verification",
                    number: "2",
                    title: "Xác thực SĐT qua OTP (Bước cuối)",
                    desc: "Nhập số điện thoại và mã OTP để kích hoạt tài khoản",
                    active: currentStep === "phone_verification",
                    done: false,
                  },
                ].map((s) => (
                  <div
                    key={s.stepKey}
                    style={{
                      background: s.active ? "rgba(255, 255, 255, 0.12)" : "rgba(255, 255, 255, 0.05)",
                      border: `1px solid ${s.active ? "rgba(228, 1, 30, 0.5)" : s.done ? "rgba(22, 163, 74, 0.4)" : "rgba(255, 255, 255, 0.1)"}`,
                      borderRadius: 6,
                      padding: "10px 12px",
                      display: "flex",
                      gap: 10,
                      alignItems: "center",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <div
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: 4,
                        background: s.done ? "#16A34A" : s.active ? "#E4011E" : "rgba(255,255,255,0.15)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 12,
                        fontWeight: 800,
                        color: "#FFFFFF",
                        flexShrink: 0,
                      }}
                    >
                      {s.done ? <Icons.Check /> : s.number}
                    </div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: s.active ? "#FFFFFF" : s.done ? "#86EFAC" : "rgba(255,255,255,0.7)" }}>
                        {s.title}
                      </div>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", marginTop: 1 }}>{s.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Assurance */}
            <div style={{ position: "relative", zIndex: 2, paddingTop: 18, fontSize: 12, color: "rgba(255, 255, 255, 0.6)", display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ color: "#10B981" }}><Icons.ShieldCheck /></span>
              <span>Dữ liệu được mã hóa và bảo mật đa tầng</span>
            </div>
          </div>

          {/* ─── RIGHT FORM PANEL (Optimized Zero-Overflow Layout) ─── */}
          <div style={{ padding: "28px 32px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
            {/* Error Message Alert */}
            {errorMessage && (
              <div
                style={{
                  background: "#FEF2F2",
                  border: "1px solid #FECACA",
                  borderRadius: 6,
                  padding: "9px 12px",
                  color: "#DC2626",
                  fontSize: 12,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 12,
                }}
              >
                <Icons.AlertCircle />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Success Message Alert */}
            {successMessage && (
              <div
                style={{
                  background: "#F0FDF4",
                  border: "1px solid #BBF7D0",
                  borderRadius: 6,
                  padding: "9px 12px",
                  color: "#16A34A",
                  fontSize: 12,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 12,
                }}
              >
                <Icons.ShieldCheck />
                <span>{successMessage}</span>
              </div>
            )}

            {currentStep === "account_info" ? (
              <div>
                <div style={{ marginBottom: 12 }}>
                  <h1 style={{ fontSize: 21, fontWeight: 900, color: "#001743", letterSpacing: "-0.02em", margin: "0 0 4px" }}>
                    Tạo tài khoản thành viên
                  </h1>
                  <p style={{ color: "#6B7280", fontSize: 12, margin: 0 }}>
                    Vui lòng điền đầy đủ các thông tin bên dưới để khởi tạo hồ sơ đấu giá
                  </p>
                </div>

                <form onSubmit={handleStep1Submit} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {/* Row 1: Full Name */}
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#001743", marginBottom: 3 }}>
                      Họ và Tên đầy đủ <span style={{ color: "#E4011E" }}>*</span>
                    </label>
                    <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: 8 }}>
                      <input
                        type="text"
                        placeholder="Họ & Tên đệm (VD: Nguyễn Văn)"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        required
                        className="form-input"
                      />
                      <input
                        type="text"
                        placeholder="Tên chính (VD: An)"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        required
                        className="form-input"
                      />
                    </div>
                  </div>

                  {/* Row 2: Username & Email */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    <div>
                      <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#001743", marginBottom: 3 }}>
                        Tên đăng nhập (Username) <span style={{ color: "#E4011E" }}>*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="VD: nguyenan99"
                        value={userName}
                        onChange={(e) => setUserName(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                        required
                        className="form-input"
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#001743", marginBottom: 3 }}>
                        Địa chỉ Email <span style={{ color: "#E4011E" }}>*</span>
                      </label>
                      <input
                        type="email"
                        placeholder="name@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="form-input"
                      />
                    </div>
                  </div>

                  {/* Row 3: Password & Confirm Password */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    <div>
                      <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#001743", marginBottom: 3 }}>
                        Mật khẩu <span style={{ color: "#E4011E" }}>*</span>
                      </label>
                      <input
                        type="password"
                        placeholder="Tối thiểu 6 ký tự"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                        className="form-input"
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#001743", marginBottom: 3 }}>
                        Xác nhận mật khẩu <span style={{ color: "#E4011E" }}>*</span>
                      </label>
                      <input
                        type="password"
                        placeholder="Nhập lại mật khẩu"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        minLength={6}
                        className="form-input"
                      />
                    </div>
                  </div>

                  {/* Row 4: Identity Number (CCCD) & Date of Birth */}
                  <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: 8 }}>
                    <div>
                      <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#001743", marginBottom: 3 }}>
                        Số CCCD / CMND <span style={{ color: "#E4011E" }}>*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="12 số (VD: 001098012345)"
                        value={identityNumber}
                        onChange={(e) => setIdentityNumber(e.target.value.replace(/\D/g, "").slice(0, 12))}
                        maxLength={12}
                        required
                        className="form-input"
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#001743", marginBottom: 3 }}>
                        Ngày sinh <span style={{ color: "#E4011E" }}>*</span>
                      </label>
                      <input
                        type="date"
                        value={dateOfBirth}
                        onChange={(e) => setDateOfBirth(e.target.value)}
                        required
                        max={new Date().toISOString().split("T")[0]}
                        className="form-input"
                        style={{ padding: "7px 10px" }}
                      />
                    </div>
                  </div>

                  {/* Row 5: Vietnam Address (Cascading Dropdowns in 1 Compact Row) */}
                  <div>
                    <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 700, color: "#001743", marginBottom: 3 }}>
                      <Icons.MapPin /> Địa chỉ liên hệ
                    </label>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginBottom: 5 }}>
                      {/* Tỉnh / Thành phố */}
                      <select
                        className="form-select"
                        value={selectedProvince}
                        onChange={(e) => setSelectedProvince(Number(e.target.value) || "")}
                      >
                        <option value="">-- Tỉnh / Thành --</option>
                        {provinces.map((p) => (
                          <option key={p.code} value={p.code}>
                            {p.name}
                          </option>
                        ))}
                      </select>

                      {/* Quận / Huyện */}
                      <select
                        className="form-select"
                        value={selectedDistrict}
                        onChange={(e) => setSelectedDistrict(Number(e.target.value) || "")}
                        disabled={!selectedProvince}
                      >
                        <option value="">-- Quận / Huyện --</option>
                        {districts.map((d) => (
                          <option key={d.code} value={d.code}>
                            {d.name}
                          </option>
                        ))}
                      </select>

                      {/* Phường / Xã */}
                      <select
                        className="form-select"
                        value={selectedWard}
                        onChange={(e) => setSelectedWard(Number(e.target.value) || "")}
                        disabled={!selectedDistrict}
                      >
                        <option value="">-- Phường / Xã --</option>
                        {wards.map((w) => (
                          <option key={w.code} value={w.code}>
                            {w.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Số nhà, Tên đường */}
                    <input
                      type="text"
                      placeholder="Số nhà, ngõ ngách, tên đường cụ thể..."
                      value={streetAddress}
                      onChange={(e) => setStreetAddress(e.target.value)}
                      className="form-input"
                    />
                  </div>

                  {/* Submit to Step 2 */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-red"
                    style={{
                      width: "100%",
                      padding: "11px 18px",
                      fontSize: 14,
                      fontWeight: 700,
                      borderRadius: 6,
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      gap: 6,
                      marginTop: 2,
                    }}
                  >
                    {loading ? "Đang xử lý..." : "Tiếp tục: Xác minh Số điện thoại (Bước cuối) →"}
                  </button>
                </form>

                <p style={{ textAlign: "center", fontSize: 12, color: "#6B7280", marginTop: 8, marginBottom: 0 }}>
                  Đã có tài khoản?{" "}
                  <Link href="/login" style={{ color: "#E4011E", fontWeight: 700, textDecoration: "none" }}>
                    Đăng nhập ngay
                  </Link>
                </p>
              </div>
            ) : (
              /* ─── STEP 2: PHONE & OTP VERIFICATION (FINAL STEP) ─── */
              <div>
                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage(null);
                    setCurrentStep("account_info");
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#6B7280",
                    cursor: "pointer",
                    fontSize: 12,
                    fontWeight: 600,
                    marginBottom: 10,
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    padding: 0,
                  }}
                >
                  <Icons.ArrowLeft /> Quay lại sửa thông tin
                </button>

                <div style={{ marginBottom: 14 }}>
                  <h1 style={{ fontSize: 21, fontWeight: 900, color: "#001743", letterSpacing: "-0.02em", margin: "0 0 4px" }}>
                    Xác thực số điện thoại
                  </h1>
                  <p style={{ color: "#6B7280", fontSize: 12, margin: 0 }}>
                    Bước cuối cùng: Nhập số điện thoại của bạn và mã OTP 6 số để kích hoạt tài khoản chính chủ.
                  </p>
                </div>

                {/* Summary Box */}
                <div style={{ background: "#F8F9FA", padding: 10, borderRadius: 6, border: "1px solid #E5E7EB", marginBottom: 12, fontSize: 12 }}>
                  <div style={{ color: "#001743", fontWeight: 700, marginBottom: 2 }}>
                    Hồ sơ đăng ký: {firstName} {lastName} ({userName})
                  </div>
                  <div style={{ color: "#6B7280", fontSize: 11 }}>
                    Email: {email} · CCCD: {identityNumber || "—"}{dateOfBirth ? ` · NS: ${new Date(dateOfBirth).toLocaleDateString("vi-VN")}` : ""}
                  </div>
                  {fullAddress && (
                    <div style={{ color: "#6B7280", fontSize: 11, marginTop: 2 }}>
                      Địa chỉ: {fullAddress}
                    </div>
                  )}
                </div>

                <form onSubmit={handleFinalRegister} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {/* Phone Input & Send OTP Button */}
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#001743", marginBottom: 4 }}>
                      Số điện thoại nhận mã OTP <span style={{ color: "#E4011E" }}>*</span>
                    </label>
                    <div style={{ display: "flex", gap: 8 }}>
                      <input
                        type="tel"
                        placeholder="Nhập số điện thoại (ví dụ: 0988 123 456)"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
                        required
                        maxLength={10}
                        className="form-input"
                        style={{ flex: 1 }}
                      />
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        disabled={otpSent && countdown > 0}
                        style={{
                          padding: "8px 14px",
                          borderRadius: 6,
                          border: "1px solid #E4011E",
                          background: otpSent && countdown > 0 ? "#F3F4F6" : "#E4011E",
                          color: otpSent && countdown > 0 ? "#9CA3AF" : "#FFFFFF",
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: otpSent && countdown > 0 ? "not-allowed" : "pointer",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {otpSent && countdown > 0 ? `Gửi lại (${countdown}s)` : "Gửi mã OTP"}
                      </button>
                    </div>
                  </div>

                  {/* 6 OTP Input Boxes */}
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#001743", marginBottom: 4 }}>
                      Mã xác thực OTP (6 chữ số) <span style={{ color: "#E4011E" }}>*</span>
                    </label>
                    <div style={{ display: "flex", gap: 6, justifyContent: "center", margin: "4px 0 8px" }}>
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
                            width: 38,
                            height: 44,
                            textAlign: "center",
                            fontSize: 18,
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
                  </div>

                  {/* Submit Final Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-red"
                    style={{
                      width: "100%",
                      padding: "11px 18px",
                      fontSize: 14,
                      fontWeight: 700,
                      borderRadius: 6,
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      gap: 6,
                      marginTop: 2,
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
                        <span>Đang kích hoạt tài khoản...</span>
                      </>
                    ) : (
                      "Hoàn tất đăng ký & Kích hoạt tài khoản"
                    )}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .form-input {
          width: 100%;
          padding: 8px 11px;
          font-size: 13px;
          border-radius: 6px;
          border: 1px solid #D1D5DB;
          outline: none;
          color: #001743;
          background: #FFFFFF;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .form-input:focus {
          border-color: #001743;
          box-shadow: 0 0 0 3px rgba(0, 23, 67, 0.08);
        }
        .form-select {
          width: 100%;
          padding: 7px 8px;
          font-size: 12px;
          border-radius: 6px;
          border: 1px solid #D1D5DB;
          outline: none;
          color: #001743;
          background: #FFFFFF;
          transition: border-color 0.2s;
        }
        .form-select:focus {
          border-color: #001743;
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
