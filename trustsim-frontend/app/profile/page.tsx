"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { authService } from "@/services/authService";
import { AuthResponseDto, UserProfileDto } from "@/types/auth";
import { ToastContainer, ToastMessage } from "@/components/ui/Toast";

/* ─── 100% Crisp Line SVG Icons (No Emojis) ──────────────── */
const Icons = {
  User: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  Gavel: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="m14 13-7.5 7.5c-.83.83-2.17.83-3 0 0 0 0 0 0 0a2.12 2.12 0 0 1 0-3L11 10" />
      <path d="m16 16 6-6" />
      <path d="m8 8 6-6" />
      <path d="m9 7 8 8" />
      <path d="m21 11-8-8" />
    </svg>
  ),
  Trophy: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.45 1-1 1H8c-.55 0-1 .45-1 1v1c0 .55.45 1 1 1h8c.55 0 1-.45 1-1v-1c0-.55-.45-1-1-1h-1c-.55 0-1-.45-1-1v-2.34" />
      <path d="M6 4h12v5a6 6 0 0 1-12 0V4Z" />
    </svg>
  ),
  Wallet: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
      <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
      <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
    </svg>
  ),
  FileText: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  ),
  Settings: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  ),
  ShieldCheck: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <polyline points="9 12 11 14 15 10" />
    </svg>
  ),
  TrendingUp: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  ),
  Plus: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  ArrowUpRight: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="7" y1="17" x2="17" y2="7" />
      <polyline points="7 7 17 7 17 17" />
    </svg>
  ),
  SimCard: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2h9l5 5v15H6V2z" />
      <rect x="9" y="9" width="6" height="8" rx="1" />
      <line x1="9" y1="13" x2="15" y2="13" />
    </svg>
  ),
  Check: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
};

type ProfileTab = "overview" | "bids" | "auctions" | "transactions" | "contracts" | "settings";

const TABS: { key: ProfileTab; icon: React.FC; label: string }[] = [
  { key: "overview", icon: Icons.User, label: "Tổng quan" },
  { key: "bids", icon: Icons.Gavel, label: "Đấu giá của tôi" },
  { key: "auctions", icon: Icons.SimCard, label: "SIM sở hữu" },
  { key: "transactions", icon: Icons.Wallet, label: "Biến động số dư" },
  { key: "contracts", icon: Icons.FileText, label: "Hợp đồng" },
  { key: "settings", icon: Icons.Settings, label: "Cài đặt & Bảo mật" },
];

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<ProfileTab>("overview");
  const [user, setUser] = useState<AuthResponseDto | null>(null);
  const [profile, setProfile] = useState<UserProfileDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (toast: Omit<ToastMessage, "id">) => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 5);
    setToasts((prev) => [...prev, { ...toast, id }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  useEffect(() => {
    // 1. Lấy thông tin local
    const currentUser = authService.getUser();
    setUser(currentUser);

    // 2. Tải profile từ API
    if (authService.isAuthenticated()) {
      authService
        .getProfile()
        .then((data) => setProfile(data))
        .catch(() => {
          // fallback data nếu chưa kết nối backend
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const displayName = profile?.fullName || user?.fullName || "Nguyễn Văn An";
  const displayEmail = profile?.email || user?.email || "customer@trustsim.vn";
  const displayPhone = profile?.phoneNumber || user?.phoneNumber || "0901 234 567";
  const displayIdentity = profile?.identityNumber || "001201012345";
  const displayAddress = profile?.address || "Hà Nội, Việt Nam";
  const initialChar = displayName.charAt(0).toUpperCase();

  // Mock stats
  const walletBalance = profile?.wallet?.availableBalance ?? 25_000_000;
  const lockedBalance = profile?.wallet?.lockedBalance ?? 2_000_000;

  return (
    <div style={{ minHeight: "100vh", background: "#F8F9FA", paddingTop: 64 }}>
      {/* Toast Notification Container */}
      <ToastContainer toasts={toasts} onClose={removeToast} />

      {/* ═══════════════════════════════════════════════════════════
          1. HERO HEADER: Glassmorphism / Deep Navy Signature Section
      ═══════════════════════════════════════════════════════════ */}
      <section
        style={{
          background: "linear-gradient(135deg, #001743 0%, #002266 60%, #0A1931 100%)",
          color: "#FFFFFF",
          padding: "36px 0 28px",
          position: "relative",
          overflow: "hidden",
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
        }}
      >
        {/* Background Subtle Watermark Circuit Vector */}
        <div
          style={{
            position: "absolute",
            right: "-40px",
            top: "-40px",
            width: 320,
            height: 320,
            opacity: 0.04,
            backgroundImage: "radial-gradient(#FFFFFF 1.5px, transparent 1.5px)",
            backgroundSize: "20px 20px",
            pointerEvents: "none",
          }}
        />

        <div className="container" style={{ maxWidth: 1180, margin: "0 auto", padding: "0 20px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 32, alignItems: "center" }}>
            {/* Left Column: Avatar & Personal Credentials */}
            <div style={{ display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap" }}>
              {/* Avatar Circle */}
              <div style={{ position: "relative" }}>
                <div
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #E4011E 0%, #B91C1C 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 32,
                    fontWeight: 900,
                    color: "#FFFFFF",
                    boxShadow: "0 8px 24px rgba(228, 1, 30, 0.35)",
                    border: "3px solid rgba(255, 255, 255, 0.2)",
                  }}
                >
                  {initialChar}
                </div>
                {/* Online / Verified status badge */}
                <div
                  style={{
                    position: "absolute",
                    bottom: 2,
                    right: 2,
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    background: "#16A34A",
                    border: "2.5px solid #001743",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#FFFFFF",
                  }}
                  title="Tài khoản đã xác minh eKYC"
                >
                  <Icons.Check />
                </div>
              </div>

              {/* Info Text */}
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                  <h1 style={{ fontSize: 22, fontWeight: 900, color: "#FFFFFF", margin: 0, letterSpacing: "-0.01em" }}>
                    {displayName}
                  </h1>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: "#86EFAC",
                      background: "rgba(22, 163, 74, 0.18)",
                      border: "1px solid rgba(134, 239, 172, 0.3)",
                      padding: "2px 8px",
                      borderRadius: 4,
                    }}
                  >
                    Đã định danh eKYC
                  </span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 14, color: "rgba(255, 255, 255, 0.72)", fontSize: 13, flexWrap: "wrap", marginBottom: 12 }}>
                  <span>{displayEmail}</span>
                  <span>·</span>
                  <span>{displayPhone}</span>
                  <span>·</span>
                  <span>CCCD: {displayIdentity}</span>
                </div>

                {/* Subtitle meta */}
                <div style={{ display: "flex", gap: 20, fontSize: 12, color: "rgba(255, 255, 255, 0.55)" }}>
                  <span>Thành viên từ: <strong>01/2025</strong></span>
                  <span>·</span>
                  <span>Hạng thành viên: <strong style={{ color: "#FDE047" }}>VIP Gold</strong></span>
                </div>
              </div>
            </div>

            {/* Right Column: Claymorphism 3D Wallet Card */}
            <div
              style={{
                background: "#FFFFFF",
                borderRadius: 12,
                padding: "20px 24px",
                minWidth: 290,
                color: "#001743",
                boxShadow: "0 14px 34px rgba(0, 0, 0, 0.18), 0 2px 6px rgba(0, 0, 0, 0.08)",
                border: "1px solid rgba(255, 255, 255, 0.8)",
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: "#6B7280", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                  Số Dư Khả Dụng
                </span>
                <span style={{ fontSize: 11, color: "#16A34A", fontWeight: 700, background: "#F0FDF4", padding: "2px 6px", borderRadius: 4 }}>
                  Hoạt động
                </span>
              </div>

              <div>
                <div style={{ fontSize: 24, fontWeight: 900, color: "#E4011E", fontVariantNumeric: "tabular-nums", letterSpacing: "-0.02em", lineHeight: 1 }}>
                  {walletBalance.toLocaleString("vi-VN")} <span style={{ fontSize: 15, fontWeight: 700 }}>₫</span>
                </div>
                {lockedBalance > 0 && (
                  <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 4 }}>
                    Tạm giữ cọc: {lockedBalance.toLocaleString("vi-VN")} ₫
                  </div>
                )}
              </div>

              {/* Action Buttons Solid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, paddingTop: 4 }}>
                <button
                  onClick={() => addToast({ type: "info", title: "Cổng thanh toán", message: "Chức năng nạp tiền qua VNPay/VietQR đang được kết nối." })}
                  style={{
                    padding: "8px 12px",
                    borderRadius: 6,
                    background: "#E4011E",
                    color: "#FFFFFF",
                    border: "none",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 4,
                  }}
                >
                  <Icons.Plus /> Nạp tiền
                </button>
                <button
                  onClick={() => addToast({ type: "info", title: "Rút tiền về tài khoản", message: "Yêu cầu rút tiền cần tài khoản ngân hàng chính chủ." })}
                  style={{
                    padding: "8px 12px",
                    borderRadius: 6,
                    background: "#F3F4F6",
                    color: "#001743",
                    border: "1px solid #D1D5DB",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Rút tiền
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          2. NAVIGATION: Modern Underline Tabs Bar (Sticky Top)
      ═══════════════════════════════════════════════════════════ */}
      <div
        style={{
          background: "#FFFFFF",
          borderBottom: "1px solid #E5E7EB",
          position: "sticky",
          top: 64,
          zIndex: 40,
          boxShadow: "0 2px 4px rgba(0, 0, 0, 0.02)",
        }}
      >
        <div className="container" style={{ maxWidth: 1180, margin: "0 auto", padding: "0 20px" }}>
          <div style={{ display: "flex", gap: 8, overflowX: "auto", scrollbarWidth: "none" }}>
            {TABS.map((tab) => {
              const isActive = activeTab === tab.key;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  style={{
                    padding: "14px 18px",
                    background: "none",
                    border: "none",
                    borderBottom: `3px solid ${isActive ? "#E4011E" : "transparent"}`,
                    color: isActive ? "#E4011E" : "#4B5563",
                    fontSize: 13.5,
                    fontWeight: isActive ? 700 : 500,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    whiteSpace: "nowrap",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.color = "#001743";
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.color = "#4B5563";
                  }}
                >
                  <Icon />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          3. MAIN CONTENT CONTAINER
      ═══════════════════════════════════════════════════════════ */}
      <main className="container" style={{ maxWidth: 1180, margin: "0 auto", padding: "28px 20px 60px" }}>
        {activeTab === "overview" && <OverviewWidgetTab user={user} profile={profile} onNavigateTab={setActiveTab} addToast={addToast} />}
        {activeTab === "bids" && <BidsWidgetTab addToast={addToast} />}
        {activeTab === "auctions" && <AuctionsWidgetTab addToast={addToast} />}
        {activeTab === "transactions" && <TransactionsWidgetTab addToast={addToast} />}
        {activeTab === "contracts" && <ContractsWidgetTab addToast={addToast} />}
        {activeTab === "settings" && <SettingsWidgetTab user={user} profile={profile} addToast={addToast} />}
      </main>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TAB 1: TỔNG QUAN (Minimalist Dashboard with Stepper & Timeline)
═══════════════════════════════════════════════════════════════ */
function OverviewWidgetTab({
  user,
  profile,
  onNavigateTab,
  addToast,
}: {
  user: AuthResponseDto | null;
  profile: UserProfileDto | null;
  onNavigateTab: (tab: ProfileTab) => void;
  addToast: (t: Omit<ToastMessage, "id">) => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* ═══ Mini-stats Bar (4 Horizontal Clean Cards) ═══ */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
        {[
          { icon: <Icons.Gavel />, label: "Tổng lượt đặt giá", value: "47 lượt", note: "+12 lượt trong tuần", color: "#2563EB" },
          { icon: <Icons.Trophy />, label: "SIM đấu giá thành công", value: "8 SIM", note: "Đã hoàn tất hợp đồng", color: "#16A34A" },
          { icon: <Icons.TrendingUp />, label: "Tỷ lệ thắng đấu giá", value: "82.4%", note: "Cao hơn 88% thành viên", color: "#D97706" },
          { icon: <Icons.Wallet />, label: "Tổng chi tiêu trên sàn", value: "128.500.000 ₫", note: "Bảo hiểm giao dịch 100%", color: "#E4011E" },
        ].map((stat, i) => (
          <div
            key={i}
            style={{
              background: "#FFFFFF",
              border: "1px solid #E5E7EB",
              borderRadius: 8,
              padding: "16px 20px",
              boxShadow: "0 2px 6px rgba(0, 23, 67, 0.03)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}
          >
            <div>
              <div style={{ fontSize: 12, color: "#6B7280", fontWeight: 600, marginBottom: 4 }}>{stat.label}</div>
              <div style={{ fontSize: 19, fontWeight: 900, color: "#001743", fontVariantNumeric: "tabular-nums" }}>{stat.value}</div>
              <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 4 }}>{stat.note}</div>
            </div>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 6,
                background: "#F8F9FA",
                color: stat.color,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {stat.icon}
            </div>
          </div>
        ))}
      </div>

      {/* ═══ 2-Column Grid: eKYC Stepper & Activity Timeline ═══ */}
      <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: 24 }}>
        {/* Widget 1: Tiến trình eKYC Định danh (Stepper) */}
        <div style={{ background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: 8, padding: 22 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ color: "#16A34A" }}><Icons.ShieldCheck /></span>
              <h3 style={{ fontSize: 15, fontWeight: 800, color: "#001743", margin: 0 }}>Tiến trình xác thực định danh (eKYC)</h3>
            </div>
            <span style={{ fontSize: 11, background: "#F0FDF4", color: "#16A34A", padding: "2px 8px", borderRadius: 4, fontWeight: 700 }}>
              Cấp độ 3/4
            </span>
          </div>

          {/* Stepper Node List */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {[
              { title: "Khởi tạo tài khoản", desc: "Đã hoàn thành đăng ký và tạo hồ sơ thành viên", done: true, current: false },
              { title: "Xác thực Số điện thoại qua OTP", desc: "Đã kích hoạt số điện thoại chính chủ", done: true, current: false },
              { title: "Khai báo số CCCD/CMND 12 số", desc: "Đã cung cấp số căn cước để lập hợp đồng điện tử", done: true, current: false },
              { title: "Xác minh quyền sở hữu SIM (Ký quỹ)", desc: "Cần thiết khi bạn muốn đăng bán SIM của mình lên sàn đấu giá", done: false, current: true },
            ].map((step, idx) => (
              <div key={idx} style={{ display: "flex", gap: 14, alignItems: "flex-start", position: "relative" }}>
                {/* Node circle */}
                <div
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: "50%",
                    background: step.done ? "#16A34A" : step.current ? "#E4011E" : "#E5E7EB",
                    color: "#FFFFFF",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 12,
                    fontWeight: 800,
                    flexShrink: 0,
                    zIndex: 2,
                  }}
                >
                  {step.done ? <Icons.Check /> : idx + 1}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: step.done || step.current ? "#001743" : "#9CA3AF" }}>
                    {step.title}
                  </div>
                  <div style={{ fontSize: 11.5, color: "#6B7280", marginTop: 2, lineHeight: 1.4 }}>
                    {step.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => addToast({ type: "info", title: "Xác minh quyền kiểm soát SIM", message: "Vui lòng soạn tin nhắn TTTB gửi 1414 để nhận mã xác nhận quyền sở hữu thuê bao." })}
            className="btn-outline"
            style={{ width: "100%", marginTop: 20, padding: "9px 16px", fontSize: 13, justifyContent: "center" }}
          >
            Tiến hành xác minh SIM để đăng bán →
          </button>
        </div>

        {/* Widget 2: Dòng thời gian hoạt động (Recent Activity Timeline) */}
        <div style={{ background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: 8, padding: 22 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
            <h3 style={{ fontSize: 15, fontWeight: 800, color: "#001743", margin: 0 }}>Lịch sử hoạt động gần đây</h3>
            <button onClick={() => onNavigateTab("bids")} style={{ background: "none", border: "none", color: "#E4011E", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
              Xem tất cả →
            </button>
          </div>

          {/* Timeline items */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {[
              { title: "Đặt giá thành công 14.500.000 ₫", sim: "0901 234 567", time: "15 phút trước", color: "#2563EB", tag: "Đấu giá Anh" },
              { title: "Thắng phiên đấu giá SIM VIP", sim: "0352 468 024", time: "Hôm qua, 14:20", color: "#16A34A", tag: "8.500.000 ₫" },
              { title: "Ký hợp đồng chuyển nhượng số #CT-889", sim: "0352 468 024", time: "Hôm qua, 16:00", color: "#001743", tag: "Đã ký số" },
              { title: "Nạp tiền ví thành công +5.000.000 ₫", sim: "VietQR Banking", time: "21/08/2026", color: "#16A34A", tag: "Thành công" },
            ].map((item, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 12px",
                  background: "#F8F9FA",
                  borderRadius: 6,
                  border: "1px solid #F3F4F6",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: item.color }} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#001743" }}>{item.title}</div>
                    <div style={{ fontSize: 11, color: "#6B7280", marginTop: 1 }}>{item.sim} · {item.time}</div>
                  </div>
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, color: "#4B5563", background: "#FFFFFF", padding: "2px 8px", borderRadius: 4, border: "1px solid #E5E7EB" }}>
                  {item.tag}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TAB 2: ĐẤU GIÁ CỦA TÔI
═══════════════════════════════════════════════════════════════ */
function BidsWidgetTab({ addToast }: { addToast: (t: Omit<ToastMessage, "id">) => void }) {
  const bids = [
    { auctionId: "1", simNumber: "0901 234 567", carrier: "Viettel", myBid: 14_500_000, currentPrice: 15_000_000, status: "losing", statusText: "Bị vượt giá", endTime: "Còn 02:35:40" },
    { auctionId: "2", simNumber: "0777 777 777", carrier: "Mobifone", myBid: 42_000_000, currentPrice: 42_000_000, status: "winning", statusText: "Đang dẫn đầu 👑", endTime: "Còn 04:12:00" },
    { auctionId: "8", simNumber: "0352 468 024", carrier: "Viettel", myBid: 8_500_000, currentPrice: 8_500_000, status: "won", statusText: "Đã thắng đấu giá 🎉", endTime: "Đã kết thúc" },
    { auctionId: "9", simNumber: "0987 654 321", carrier: "Mobifone", myBid: 32_000_000, currentPrice: 35_000_000, status: "lost", statusText: "Không trúng", endTime: "Đã kết thúc" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ fontSize: 18, fontWeight: 800, color: "#001743", margin: 0 }}>Các phiên bạn đang tham gia trả giá</h2>
        <Link href="/auctions" className="btn-red" style={{ padding: "7px 14px", fontSize: 13, borderRadius: 6 }}>
          Tìm thêm SIM đấu giá +
        </Link>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {bids.map((b) => (
          <div
            key={b.auctionId}
            style={{
              background: "#FFFFFF",
              border: "1px solid #E5E7EB",
              borderRadius: 8,
              padding: "16px 20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 16,
              flexWrap: "wrap",
            }}
          >
            <div>
              <div style={{ fontSize: 11, color: "#6B7280", fontWeight: 700, marginBottom: 2 }}>{b.carrier}</div>
              <div style={{ fontSize: 18, fontWeight: 900, color: "#001743", letterSpacing: "0.05em", fontVariantNumeric: "tabular-nums" }}>
                {b.simNumber}
              </div>
              <div style={{ fontSize: 11.5, color: "#9CA3AF", marginTop: 2 }}>{b.endTime}</div>
            </div>

            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 600 }}>Giá bạn đã đặt</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#001743", fontVariantNumeric: "tabular-nums" }}>
                {b.myBid.toLocaleString("vi-VN")} ₫
              </div>
            </div>

            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 600 }}>Giá cao nhất hiện tại</div>
              <div style={{ fontSize: 16, fontWeight: 900, color: "#E4011E", fontVariantNumeric: "tabular-nums" }}>
                {b.currentPrice.toLocaleString("vi-VN")} ₫
              </div>
            </div>

            <div>
              <span
                style={{
                  padding: "4px 10px",
                  borderRadius: 4,
                  fontSize: 12,
                  fontWeight: 700,
                  background: b.status === "winning" ? "#F0FDF4" : b.status === "won" ? "#EFF6FF" : "#FEF2F2",
                  color: b.status === "winning" ? "#16A34A" : b.status === "won" ? "#2563EB" : "#DC2626",
                  border: `1px solid ${b.status === "winning" ? "#BBF7D0" : b.status === "won" ? "#BFDBFE" : "#FECACA"}`,
                }}
              >
                {b.statusText}
              </span>
            </div>

            <div>
              <Link
                href={`/auctions/${b.auctionId}`}
                className="btn-outline"
                style={{ padding: "6px 14px", fontSize: 12, borderRadius: 4 }}
              >
                Vào phòng đấu giá →
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TAB 3: SIM SỞ HỮU
═══════════════════════════════════════════════════════════════ */
function AuctionsWidgetTab({ addToast }: { addToast: (t: Omit<ToastMessage, "id">) => void }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ fontSize: 18, fontWeight: 800, color: "#001743", margin: 0 }}>Kho SIM của bạn</h2>
        <button
          onClick={() => addToast({ type: "info", title: "Đăng SIM mới", message: "Vui lòng hoàn tất xác thực quyền sở hữu SIM để đưa lên sàn đấu giá." })}
          className="btn-red"
          style={{ padding: "7px 14px", fontSize: 13, borderRadius: 6 }}
        >
          + Đăng bán SIM mới
        </button>
      </div>

      <div style={{ background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: 8, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "#F8F9FA", borderBottom: "1px solid #E5E7EB", color: "#4B5563", fontWeight: 700 }}>
              <th style={{ padding: "12px 16px" }}>Số SIM</th>
              <th style={{ padding: "12px 16px" }}>Nhà mạng</th>
              <th style={{ padding: "12px 16px" }}>Trạng thái</th>
              <th style={{ padding: "12px 16px" }}>Định giá</th>
              <th style={{ padding: "12px 16px", textAlign: "right" }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {[
              { sim: "0352 468 024", carrier: "Viettel", status: "Đã trúng đấu giá", statusColor: "#16A34A", price: "8.500.000 ₫" },
              { sim: "0901 888 999", carrier: "Mobifone", status: "Đang lưu kho", statusColor: "#4B5563", price: "35.000.000 ₫" },
              { sim: "0888 555 666", carrier: "Vinaphone", status: "Chờ duyệt mở phiên", statusColor: "#D97706", price: "18.000.000 ₫" },
            ].map((row, i) => (
              <tr key={i} style={{ borderBottom: "1px solid #F3F4F6" }}>
                <td style={{ padding: "14px 16px", fontWeight: 800, color: "#001743", fontVariantNumeric: "tabular-nums" }}>{row.sim}</td>
                <td style={{ padding: "14px 16px", color: "#4B5563" }}>{row.carrier}</td>
                <td style={{ padding: "14px 16px" }}>
                  <span style={{ fontSize: 11.5, fontWeight: 700, color: row.statusColor }}>● {row.status}</span>
                </td>
                <td style={{ padding: "14px 16px", fontWeight: 700, color: "#E4011E", fontVariantNumeric: "tabular-nums" }}>{row.price}</td>
                <td style={{ padding: "14px 16px", textAlign: "right" }}>
                  <button className="btn-outline" style={{ padding: "4px 10px", fontSize: 11 }}>Quản lý</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TAB 4: BIẾN ĐỘNG SỐ DƯ & VÍ
═══════════════════════════════════════════════════════════════ */
function TransactionsWidgetTab({ addToast }: { addToast: (t: Omit<ToastMessage, "id">) => void }) {
  const txs = [
    { id: "TX-9901", desc: "Nạp tiền qua VietQR Banking", date: "21/08/2026 09:30", amount: 5_000_000, type: "deposit", status: "Hoàn tất" },
    { id: "TX-9902", desc: "Tạm giữ tiền cọc phiên #1 (SIM 0901 234 567)", date: "22/08/2026 14:00", amount: -2_000_000, type: "hold", status: "Tạm giữ" },
    { id: "TX-9903", desc: "Thanh toán trúng đấu giá SIM 0352 468 024", date: "19/08/2026 10:15", amount: -8_500_000, type: "payment", status: "Hoàn tất" },
    { id: "TX-9904", desc: "Hoàn tiền cọc phiên #9 (Không trúng)", date: "18/08/2026 16:45", amount: 2_000_000, type: "refund", status: "Hoàn tất" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ fontSize: 18, fontWeight: 800, color: "#001743", margin: 0 }}>Lịch sử biến động số dư ví</h2>
        <button onClick={() => addToast({ type: "success", title: "Xuất dữ liệu", message: "Đã xuất file sao kê giao dịch (.CSV) thành công." })} className="btn-outline" style={{ padding: "6px 12px", fontSize: 12 }}>
          Xuất sao kê CSV
        </button>
      </div>

      <div style={{ background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: 8, overflow: "hidden" }}>
        {txs.map((tx) => (
          <div
            key={tx.id}
            style={{
              padding: "14px 20px",
              borderBottom: "1px solid #F3F4F6",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: "#001743" }}>{tx.desc}</div>
              <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 2 }}>Mã GD: {tx.id} · {tx.date}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 900,
                  color: tx.amount > 0 ? "#16A34A" : "#DC2626",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {tx.amount > 0 ? "+" : ""}{tx.amount.toLocaleString("vi-VN")} ₫
              </div>
              <span style={{ fontSize: 10.5, color: "#6B7280", fontWeight: 600 }}>{tx.status}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TAB 5: HỢP ĐỒNG ĐIỆN TỬ
═══════════════════════════════════════════════════════════════ */
function ContractsWidgetTab({ addToast }: { addToast: (t: Omit<ToastMessage, "id">) => void }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <h2 style={{ fontSize: 18, fontWeight: 800, color: "#001743", margin: 0 }}>Hợp đồng chuyển nhượng quyền sở hữu SIM</h2>
      <div style={{ background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: 8, padding: 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #F3F4F6", paddingBottom: 16 }}>
          <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
            <span style={{ color: "#2563EB" }}><Icons.FileText /></span>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#001743" }}>Hợp đồng chuyển nhượng SIM #CT-88901</div>
              <div style={{ fontSize: 12, color: "#6B7280", marginTop: 2 }}>SIM số đẹp: 0352 468 024 · Ký kết: 21/08/2026</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ background: "#F0FDF4", color: "#16A34A", fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 4 }}>
              Đã ký số thành công
            </span>
            <button onClick={() => addToast({ type: "success", title: "Tải hợp đồng", message: "Đang tải xuống file PDF hợp đồng có chữ ký số điện tử." })} className="btn-outline" style={{ padding: "6px 12px", fontSize: 12 }}>
              Tải PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TAB 6: CÀI ĐẶT & BẢO MẬT (Đổi mật khẩu & Cập nhật hồ sơ thật)
═══════════════════════════════════════════════════════════════ */
function SettingsWidgetTab({
  user,
  profile,
  addToast,
}: {
  user: AuthResponseDto | null;
  profile: UserProfileDto | null;
  addToast: (t: Omit<ToastMessage, "id">) => void;
}) {
  const [fullName, setFullName] = useState(profile?.fullName || user?.fullName || "");
  const [phoneNumber, setPhoneNumber] = useState(profile?.phoneNumber || user?.phoneNumber || "");
  const [identityNumber, setIdentityNumber] = useState(profile?.identityNumber || "");
  const [address, setAddress] = useState(profile?.address || "");
  const [loadingProfile, setLoadingProfile] = useState(false);

  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [loadingPassword, setLoadingPassword] = useState(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingProfile(true);
    try {
      await authService.updateProfile({
        fullName: fullName.trim(),
        phoneNumber: phoneNumber.trim(),
        identityNumber: identityNumber.trim(),
        address: address.trim(),
      });
      addToast({
        type: "success",
        title: "Cập nhật thành công",
        message: "Thông tin hồ sơ cá nhân của bạn đã được lưu lại.",
      });
    } catch (err: any) {
      addToast({
        type: "error",
        title: "Cập nhật thất bại",
        message: err.message || "Không thể cập nhật hồ sơ.",
      });
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) {
      addToast({
        type: "error",
        title: "Mật khẩu không khớp",
        message: "Xác nhận mật khẩu mới không trùng khớp.",
      });
      return;
    }
    setLoadingPassword(true);
    try {
      await authService.changePassword({
        currentPassword,
        newPassword,
        confirmNewPassword,
      });
      addToast({
        type: "success",
        title: "Đổi mật khẩu thành công",
        message: "Mật khẩu của bạn đã được thay đổi an toàn.",
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (err: any) {
      addToast({
        type: "error",
        title: "Đổi mật khẩu thất bại",
        message: err.message || "Mật khẩu hiện tại không chính xác.",
      });
    } finally {
      setLoadingPassword(false);
    }
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, maxWidth: 960 }}>
      {/* Profile Update Form */}
      <div style={{ background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: 8, padding: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 800, color: "#001743", margin: "0 0 16px" }}>
          Thông tin cá nhân
        </h3>
        <form onSubmit={handleUpdateProfile} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#001743", marginBottom: 4 }}>
              Họ và tên
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="profile-input"
              required
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#001743", marginBottom: 4 }}>
              Số điện thoại
            </label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="profile-input"
              required
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#001743", marginBottom: 4 }}>
              Số CCCD / CMND
            </label>
            <input
              type="text"
              value={identityNumber}
              onChange={(e) => setIdentityNumber(e.target.value)}
              className="profile-input"
              required
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#001743", marginBottom: 4 }}>
              Địa chỉ liên hệ
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="profile-input"
            />
          </div>
          <button
            type="submit"
            disabled={loadingProfile}
            className="btn-red"
            style={{ marginTop: 8, padding: "10px 18px", fontSize: 13, borderRadius: 6 }}
          >
            {loadingProfile ? "Đang lưu..." : "Lưu thay đổi"}
          </button>
        </form>
      </div>

      {/* Password Change Form */}
      <div style={{ background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: 8, padding: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 800, color: "#001743", margin: "0 0 16px" }}>
          Đổi mật khẩu tài khoản
        </h3>
        <form onSubmit={handleChangePassword} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#001743", marginBottom: 4 }}>
              Mật khẩu hiện tại
            </label>
            <input
              type="password"
              placeholder="Nhập mật khẩu cũ"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="profile-input"
              required
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#001743", marginBottom: 4 }}>
              Mật khẩu mới
            </label>
            <input
              type="password"
              placeholder="Tối thiểu 6 ký tự"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="profile-input"
              required
              minLength={6}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#001743", marginBottom: 4 }}>
              Xác nhận mật khẩu mới
            </label>
            <input
              type="password"
              placeholder="Nhập lại mật khẩu mới"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              className="profile-input"
              required
              minLength={6}
            />
          </div>
          <button
            type="submit"
            disabled={loadingPassword}
            className="btn-outline"
            style={{ marginTop: 8, padding: "10px 18px", fontSize: 13, borderRadius: 6 }}
          >
            {loadingPassword ? "Đang xử lý..." : "Cập nhật mật khẩu"}
          </button>
        </form>
      </div>

      <style>{`
        .profile-input {
          width: 100%;
          padding: 8px 12px;
          font-size: 13px;
          border-radius: 6px;
          border: 1px solid #D1D5DB;
          outline: none;
          color: #001743;
          background: #FFFFFF;
          transition: border-color 0.2s;
        }
        .profile-input:focus {
          border-color: #001743;
        }
      `}</style>
    </div>
  );
}
