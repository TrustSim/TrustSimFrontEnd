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
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  ),
  ShieldCheck: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <polyline points="9 12 11 14 15 10" />
    </svg>
  ),
  Check: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  ArrowLeft: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
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
};

type Step = "account_info" | "phone_verification";

export default function RegisterPage() {
  const [currentStep, setCurrentStep] = useState<Step>("account_info");
  const [loading, setLoading] = useState(false);

  // Form State
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [identityNumber, setIdentityNumber] = useState("");

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
    if (password !== confirmPassword) {
      alert("Mật khẩu xác nhận không khớp!");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setCurrentStep("phone_verification");
    }, 600);
  };

  const handleSendOtp = () => {
    if (!phoneNumber) {
      alert("Vui lòng nhập số điện thoại hợp lệ");
      return;
    }
    setOtpSent(true);
    setCountdown(60);
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

  const handleFinalRegister = (e: React.FormEvent) => {
    e.preventDefault();
    const otpCode = otp.join("");
    if (otpCode.length < 6) {
      alert("Vui lòng nhập đủ 6 chữ số OTP xác thực!");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      alert("Đăng ký tài khoản TrustSim thành công! Vui lòng đăng nhập.");
      window.location.href = "/login";
    }, 1000);
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
    <div style={{ minHeight: "calc(100vh - 64px)", paddingTop: 84, paddingBottom: 64, background: "#F8F9FA" }}>
      <div className="container" style={{ maxWidth: 1080, margin: "0 auto", padding: "0 16px" }}>
        {/* Main Split Grid Card */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1.5fr",
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
                Đăng Ký Tài Khoản Mới
              </div>
              <h2 style={{ fontSize: 24, fontWeight: 900, lineHeight: 1.25, color: "#FFFFFF", letterSpacing: "-0.02em", margin: "0 0 12px" }}>
                Gia nhập sàn đấu giá SIM số uy tín cùng <span style={{ color: "#E4011E" }}>TrustSim</span>
              </h2>
              <p style={{ fontSize: 13, color: "rgba(255, 255, 255, 0.78)", lineHeight: 1.6, marginBottom: 28 }}>
                Chỉ 2 bước đơn giản để kích hoạt tài khoản định danh, sẵn sàng tham gia các phiên đấu giá trực tuyến.
              </p>

              {/* Stepper Display */}
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
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
                      padding: "12px 14px",
                      display: "flex",
                      gap: 12,
                      alignItems: "center",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 4,
                        background: s.done ? "#16A34A" : s.active ? "#E4011E" : "rgba(255,255,255,0.15)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 13,
                        fontWeight: 800,
                        color: "#FFFFFF",
                        flexShrink: 0,
                      }}
                    >
                      {s.done ? <Icons.Check /> : s.number}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: s.active ? "#FFFFFF" : s.done ? "#86EFAC" : "rgba(255,255,255,0.7)" }}>
                        {s.title}
                      </div>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", marginTop: 2 }}>{s.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Assurance */}
            <div style={{ position: "relative", zIndex: 2, paddingTop: 24, fontSize: 12, color: "rgba(255, 255, 255, 0.6)", display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ color: "#10B981" }}><Icons.ShieldCheck /></span>
              <span>Dữ liệu được mã hóa và bảo mật đa tầng</span>
            </div>
          </div>

          {/* ─── RIGHT FORM PANEL ─── */}
          <div style={{ padding: "40px 36px", maxHeight: "88vh", overflowY: "auto" }}>
            {currentStep === "account_info" ? (
              <div>
                <div style={{ marginBottom: 24 }}>
                  <h1 style={{ fontSize: 24, fontWeight: 900, color: "#001743", letterSpacing: "-0.02em", margin: "0 0 6px" }}>
                    Tạo tài khoản thành viên
                  </h1>
                  <p style={{ color: "#6B7280", fontSize: 13, margin: 0 }}>
                    Vui lòng điền đầy đủ các thông tin bên dưới để khởi tạo hồ sơ đấu giá
                  </p>
                </div>

                <form onSubmit={handleStep1Submit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {/* Group 1: Họ tên (First + Last Name -> FullName) */}
                  <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#001743", marginBottom: 6 }}>
                      Họ và Tên đầy đủ <span style={{ color: "#E4011E" }}>*</span>
                    </label>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                      <input
                        type="text"
                        placeholder="Họ & Tên đệm (ví dụ: Nguyễn Văn)"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        required
                        className="form-input"
                      />
                      <input
                        type="text"
                        placeholder="Tên chính (ví dụ: An)"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        required
                        className="form-input"
                      />
                    </div>
                  </div>

                  {/* Group 2: Username & Email */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <div>
                      <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#001743", marginBottom: 6 }}>
                        Tên đăng nhập (Username) <span style={{ color: "#E4011E" }}>*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="ví dụ: nguyenan99"
                        value={userName}
                        onChange={(e) => setUserName(e.target.value.toLowerCase().replace(/\s/g, ""))}
                        required
                        className="form-input"
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#001743", marginBottom: 6 }}>
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

                  {/* Group 3: Password & Confirm Password */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <div>
                      <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#001743", marginBottom: 6 }}>
                        Mật khẩu <span style={{ color: "#E4011E" }}>*</span>
                      </label>
                      <input
                        type="password"
                        placeholder="Tối thiểu 8 ký tự"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={8}
                        className="form-input"
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#001743", marginBottom: 6 }}>
                        Xác nhận mật khẩu <span style={{ color: "#E4011E" }}>*</span>
                      </label>
                      <input
                        type="password"
                        placeholder="Nhập lại mật khẩu"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        minLength={8}
                        className="form-input"
                      />
                    </div>
                  </div>

                  {/* Group 4: Identity Number (CCCD) */}
                  <div style={{ background: "#F8F9FA", padding: 14, borderRadius: 6, border: "1px solid #E5E7EB" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <label style={{ fontSize: 13, fontWeight: 700, color: "#001743", margin: 0 }}>
                        Số CCCD / CMND <span style={{ color: "#E4011E" }}>*</span>
                      </label>
                      <span style={{ fontSize: 11, background: "#EFF6FF", color: "#2563EB", padding: "2px 8px", borderRadius: 4, fontWeight: 600 }}>
                        Chưa cần xác thực ảnh ngay
                      </span>
                    </div>
                    <input
                      type="text"
                      placeholder="Nhập 12 số CCCD (ví dụ: 001201012345)"
                      value={identityNumber}
                      onChange={(e) => setIdentityNumber(e.target.value.replace(/\D/g, "").slice(0, 12))}
                      maxLength={12}
                      required
                      className="form-input"
                      style={{ background: "#FFFFFF" }}
                    />
                    <div style={{ fontSize: 11, color: "#6B7280", marginTop: 4 }}>
                      Dùng để lập hợp đồng điện tử khi trúng đấu giá SIM. Ảnh CCCD sẽ được bổ sung khi KYC.
                    </div>
                  </div>

                  {/* Group 5: Vietnam Address (Cascading Dropdowns via Open API) */}
                  <div style={{ background: "#F8F9FA", padding: 14, borderRadius: 6, border: "1px solid #E5E7EB" }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#001743", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                      <Icons.MapPin /> Địa chỉ liên hệ & nhận SIM
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 8 }}>
                      {/* Tỉnh / Thành phố */}
                      <div>
                        <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#4B5563", marginBottom: 3 }}>
                          Tỉnh / Thành phố
                        </label>
                        <select
                          className="form-select"
                          value={selectedProvince}
                          onChange={(e) => setSelectedProvince(Number(e.target.value) || "")}
                          required
                        >
                          <option value="">-- Chọn Tỉnh/Thành --</option>
                          {provinces.map((p) => (
                            <option key={p.code} value={p.code}>
                              {p.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Quận / Huyện */}
                      <div>
                        <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#4B5563", marginBottom: 3 }}>
                          Quận / Huyện
                        </label>
                        <select
                          className="form-select"
                          value={selectedDistrict}
                          onChange={(e) => setSelectedDistrict(Number(e.target.value) || "")}
                          disabled={!selectedProvince}
                          required
                        >
                          <option value="">-- Chọn Quận/Huyện --</option>
                          {districts.map((d) => (
                            <option key={d.code} value={d.code}>
                              {d.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Phường / Xã */}
                      <div>
                        <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#4B5563", marginBottom: 3 }}>
                          Phường / Xã
                        </label>
                        <select
                          className="form-select"
                          value={selectedWard}
                          onChange={(e) => setSelectedWard(Number(e.target.value) || "")}
                          disabled={!selectedDistrict}
                          required
                        >
                          <option value="">-- Chọn Phường/Xã --</option>
                          {wards.map((w) => (
                            <option key={w.code} value={w.code}>
                              {w.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Số nhà, Tên đường */}
                    <div>
                      <input
                        type="text"
                        placeholder="Số nhà, ngõ, tên đường / thôn xóm cụ thể..."
                        value={streetAddress}
                        onChange={(e) => setStreetAddress(e.target.value)}
                        required
                        className="form-input"
                        style={{ background: "#FFFFFF" }}
                      />
                    </div>
                  </div>

                  {/* Submit to Step 2 */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-red"
                    style={{
                      width: "100%",
                      padding: "13px 20px",
                      fontSize: 15,
                      fontWeight: 700,
                      borderRadius: 6,
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    {loading ? "Đang xử lý..." : "Tiếp tục: Xác minh Số điện thoại (Bước cuối) →"}
                  </button>
                </form>

                <p style={{ textAlign: "center", fontSize: 13, color: "#6B7280", marginTop: 16 }}>
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
                  onClick={() => setCurrentStep("account_info")}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#6B7280",
                    cursor: "pointer",
                    fontSize: 13,
                    fontWeight: 600,
                    marginBottom: 16,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: 0,
                  }}
                >
                  <Icons.ArrowLeft /> Quay lại sửa thông tin
                </button>

                <div style={{ marginBottom: 20 }}>
                  <h1 style={{ fontSize: 24, fontWeight: 900, color: "#001743", letterSpacing: "-0.02em", margin: "0 0 6px" }}>
                    Xác thực số điện thoại
                  </h1>
                  <p style={{ color: "#6B7280", fontSize: 13, margin: 0 }}>
                    Bước cuối cùng: Nhập số điện thoại của bạn và mã OTP 6 số để kích hoạt tài khoản chính chủ.
                  </p>
                </div>

                {/* Summary Box */}
                <div style={{ background: "#F8F9FA", padding: 14, borderRadius: 6, border: "1px solid #E5E7EB", marginBottom: 18, fontSize: 13 }}>
                  <div style={{ color: "#001743", fontWeight: 700, marginBottom: 4 }}>
                    Hồ sơ đăng ký: {firstName} {lastName} ({userName})
                  </div>
                  <div style={{ color: "#6B7280", fontSize: 12 }}>
                    Email: {email} · CCCD: {identityNumber || "—"}
                  </div>
                  {fullAddress && (
                    <div style={{ color: "#6B7280", fontSize: 12, marginTop: 2 }}>
                      Địa chỉ: {fullAddress}
                    </div>
                  )}
                </div>

                <form onSubmit={handleFinalRegister} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {/* Phone Input & Send OTP Button */}
                  <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#001743", marginBottom: 6 }}>
                      Số điện thoại nhận mã OTP <span style={{ color: "#E4011E" }}>*</span>
                    </label>
                    <div style={{ display: "flex", gap: 8 }}>
                      <input
                        type="tel"
                        placeholder="Nhập số điện thoại (ví dụ: 0988 123 456)"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ""))}
                        required
                        className="form-input"
                        style={{ flex: 1 }}
                      />
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        disabled={otpSent && countdown > 0}
                        style={{
                          padding: "10px 16px",
                          borderRadius: 6,
                          border: "1px solid #E4011E",
                          background: otpSent && countdown > 0 ? "#F3F4F6" : "#E4011E",
                          color: otpSent && countdown > 0 ? "#9CA3AF" : "#FFFFFF",
                          fontSize: 13,
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
                    <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#001743", marginBottom: 6 }}>
                      Mã xác thực OTP (6 chữ số)
                    </label>
                    <div style={{ display: "flex", gap: 8, justifyContent: "center", margin: "6px 0 12px" }}>
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
                            width: 44,
                            height: 52,
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
                  </div>

                  {/* Submit Final Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-red"
                    style={{
                      width: "100%",
                      padding: "13px 20px",
                      fontSize: 15,
                      fontWeight: 700,
                      borderRadius: 6,
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      gap: 8,
                      marginTop: 8,
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
          padding: 10px 12px;
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
          padding: 9px 10px;
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
