"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { authService } from "@/services/authService";
import { walletService } from "@/services/walletService";
import { tradeService } from "@/services/tradeService";
import { AuthResponseDto, UserProfileDto } from "@/types/auth";
import { WalletDto, WalletTransactionDto, WalletTransactionType, TransactionStatus } from "@/types/wallet";
import { TradeTransactionDto } from "@/types/trade";
import { ToastContainer, ToastMessage } from "@/components/ui/Toast";
import { DepositModal } from "@/components/wallet/DepositModal";
import { WithdrawModal } from "@/components/wallet/WithdrawModal";

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
  CreditCard: ({ size = 18 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <line x1="2" y1="10" x2="22" y2="10" />
    </svg>
  ),
  Inbox: ({ size = 18 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
      <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
    </svg>
  ),
  FileText: ({ size = 18 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
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
  Plus: ({ size = 16 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  ArrowUpRight: ({ size = 16 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="7" y1="17" x2="17" y2="7" />
      <polyline points="7 7 17 7 17 17" />
    </svg>
  ),
  ArrowDownLeft: ({ size = 16 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="17" y1="7" x2="7" y2="17" />
      <polyline points="17 17 7 17 7 7" />
    </svg>
  ),
  ArrowRight: ({ size = 16 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
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
  Refresh: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
    </svg>
  ),
  Lock: ({ size = 18 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  ),
  Clock: ({ size = 14 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
};

type ProfileTab = "overview" | "bids" | "auctions" | "transactions" | "contracts" | "settings";

const TABS: { key: ProfileTab; icon: React.FC; label: string }[] = [
  { key: "overview", icon: Icons.User, label: "Tổng quan" },
  { key: "bids", icon: Icons.Gavel, label: "Đấu giá của tôi" },
  { key: "auctions", icon: Icons.SimCard, label: "SIM sở hữu" },
  { key: "transactions", icon: Icons.Wallet, label: "Biến động số dư" },
  { key: "contracts", icon: Icons.FileText, label: "Hợp đồng & Ký quỹ" },
  { key: "settings", icon: Icons.Settings, label: "Cài đặt & Bảo mật" },
];

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<ProfileTab>("overview");
  const [user, setUser] = useState<AuthResponseDto | null>(null);
  const [profile, setProfile] = useState<UserProfileDto | null>(null);
  const [wallet, setWallet] = useState<WalletDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Modals state
  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);

  const addToast = (toast: Omit<ToastMessage, "id">) => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 5);
    setToasts((prev) => [...prev, { ...toast, id }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const fetchWallet = () => {
    if (authService.isAuthenticated()) {
      walletService
        .getMyWallet()
        .then((data) => setWallet(data))
        .catch(() => { });
    }
  };

  useEffect(() => {
    const currentUser = authService.getUser();
    setUser(currentUser);

    if (authService.isAuthenticated()) {
      Promise.all([
        authService.getProfile().then((data) => setProfile(data)).catch(() => { }),
        walletService.getMyWallet().then((data) => setWallet(data)).catch(() => { }),
      ]).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const displayName = profile?.fullName || user?.fullName || "Nguyễn Văn An";
  const displayEmail = profile?.email || user?.email || "customer@trustsim.vn";
  const displayPhone = profile?.phoneNumber || user?.phoneNumber || "0901 234 567";
  const displayIdentity = profile?.identityNumber || "001201012345";
  const initialChar = displayName.charAt(0).toUpperCase();

  const availableBalance = wallet?.availableBalance ?? profile?.wallet?.availableBalance ?? 0;
  const lockedBalance = wallet?.lockedBalance ?? profile?.wallet?.lockedBalance ?? 0;

  return (
    <div style={{ minHeight: "100vh", background: "#F8F9FA", paddingTop: 64 }}>
      <ToastContainer toasts={toasts} onClose={removeToast} />

      {/* Modals */}
      <DepositModal
        isOpen={depositModalOpen}
        onClose={() => setDepositModalOpen(false)}
        onSuccess={() => {
          fetchWallet();
          addToast({
            type: "success",
            title: "Yêu cầu nạp tiền",
            message: "Hệ thống sẽ tự động cập nhật số dư khi nhận được thanh toán.",
          });
        }}
      />

      <WithdrawModal
        isOpen={withdrawModalOpen}
        onClose={() => setWithdrawModalOpen(false)}
        availableBalance={availableBalance}
        onSuccess={(tx) => {
          fetchWallet();
          addToast({
            type: "success",
            title: "Rút tiền thành công",
            message: `Đã tạo lệnh rút ${tx.amount.toLocaleString("vi-VN")} ₫ về ${tx.destinationBankName || "ngân hàng"}.`,
          });
        }}
      />

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
        <div className="container" style={{ maxWidth: 1180, margin: "0 auto", padding: "0 20px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 32, alignItems: "center" }}>
            {/* Left Column: Avatar & Personal Credentials */}
            <div style={{ display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap" }}>
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

                <div style={{ display: "flex", gap: 20, fontSize: 12, color: "rgba(255, 255, 255, 0.55)" }}>
                  <span>Thành viên từ: <strong>01/2025</strong></span>
                  <span>·</span>
                  <span>Hạng thành viên: <strong style={{ color: "#FDE047" }}>VIP Gold</strong></span>
                </div>
              </div>
            </div>

            {/* Right Column: Real-time Wallet Card */}
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
                  {availableBalance.toLocaleString("vi-VN")} <span style={{ fontSize: 15, fontWeight: 700 }}>₫</span>
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
                  onClick={() => setDepositModalOpen(true)}
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
                  onClick={() => setWithdrawModalOpen(true)}
                  style={{
                    padding: "8px 12px",
                    borderRadius: 6,
                    background: "#F3F4F6",
                    color: "#001743",
                    border: "1px solid #D1D5DB",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 4,
                  }}
                >
                  <Icons.ArrowUpRight /> Rút tiền
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
        {activeTab === "overview" && (
          <OverviewWidgetTab
            user={user}
            profile={profile}
            walletBalance={availableBalance}
            onNavigateTab={setActiveTab}
            addToast={addToast}
          />
        )}
        {activeTab === "bids" && <BidsWidgetTab addToast={addToast} />}
        {activeTab === "auctions" && <AuctionsWidgetTab addToast={addToast} />}
        {activeTab === "transactions" && (
          <TransactionsWidgetTab
            onOpenDeposit={() => setDepositModalOpen(true)}
            onOpenWithdraw={() => setWithdrawModalOpen(true)}
            addToast={addToast}
          />
        )}
        {activeTab === "contracts" && <ContractsWidgetTab addToast={addToast} />}
        {activeTab === "settings" && <SettingsWidgetTab user={user} profile={profile} addToast={addToast} />}
      </main>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TAB 1: TỔNG QUAN
═══════════════════════════════════════════════════════════════ */
function OverviewWidgetTab({
  user,
  profile,
  walletBalance,
  onNavigateTab,
  addToast,
}: {
  user: AuthResponseDto | null;
  profile: UserProfileDto | null;
  walletBalance: number;
  onNavigateTab: (tab: ProfileTab) => void;
  addToast: (t: Omit<ToastMessage, "id">) => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Mini-stats Bar */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
        {[
          { icon: <Icons.Gavel />, label: "Tổng lượt đặt giá", value: "47 lượt", note: "+12 lượt trong tuần", color: "#2563EB" },
          { icon: <Icons.Trophy />, label: "SIM đấu giá thành công", value: "8 SIM", note: "Đã hoàn tất hợp đồng", color: "#16A34A" },
          { icon: <Icons.TrendingUp />, label: "Tỷ lệ thắng đấu giá", value: "82.4%", note: "Cao hơn 88% thành viên", color: "#D97706" },
          { icon: <Icons.Wallet />, label: "Số dư ví hiện tại", value: `${walletBalance.toLocaleString("vi-VN")} ₫`, note: "Bảo hiểm giao dịch 100%", color: "#E4011E" },
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

      {/* 2-Column Grid: eKYC Stepper & Activity Timeline */}
      <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: 24 }}>
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

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {[
              { title: "Khởi tạo tài khoản", desc: "Đã hoàn thành đăng ký và tạo hồ sơ thành viên", done: true, current: false },
              { title: "Xác thực Số điện thoại qua OTP", desc: "Đã kích hoạt số điện thoại chính chủ", done: true, current: false },
              { title: "Khai báo số CCCD/CMND 12 số", desc: "Đã cung cấp số căn cước để lập hợp đồng điện tử", done: true, current: false },
              { title: "Xác minh quyền sở hữu SIM (Ký quỹ)", desc: "Cần thiết khi bạn muốn đăng bán SIM của mình lên sàn đấu giá", done: false, current: true },
            ].map((step, idx) => (
              <div key={idx} style={{ display: "flex", gap: 14, alignItems: "flex-start", position: "relative" }}>
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

        <div style={{ background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: 8, padding: 22 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
            <h3 style={{ fontSize: 15, fontWeight: 800, color: "#001743", margin: 0 }}>Lịch sử hoạt động gần đây</h3>
            <button onClick={() => onNavigateTab("bids")} style={{ background: "none", border: "none", color: "#E4011E", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
              Xem tất cả →
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {[
              { title: "Đặt giá thành công 14.500.000 ₫", sim: "0901 234 567", time: "15 phút trước", icon: <Icons.Gavel />, tag: "Đấu giá Anh" },
              { title: "Thắng phiên đấu giá SIM VIP", sim: "0352 468 024", time: "Hôm qua, 14:20", icon: <Icons.Trophy />, tag: "8.500.000 ₫" },
              { title: "Ký hợp đồng chuyển nhượng số #CT-889", sim: "0352 468 024", time: "Hôm qua, 16:00", icon: <Icons.FileText />, tag: "Đã ký số" },
              { title: "Nạp tiền ví thành công qua VietQR", sim: "SePay Banking", time: "Hôm nay", icon: <Icons.Wallet />, tag: "Thành công" },
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
                  <div
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: 6,
                      background: "#FFFFFF",
                      border: "1px solid #E5E7EB",
                      color: "#001743",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    {item.icon}
                  </div>
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
    { auctionId: "2", simNumber: "0777 777 777", carrier: "Mobifone", myBid: 42_000_000, currentPrice: 42_000_000, status: "winning", statusText: "Đang dẫn đầu", endTime: "Còn 04:12:00" },
    { auctionId: "8", simNumber: "0352 468 024", carrier: "Viettel", myBid: 8_500_000, currentPrice: 8_500_000, status: "won", statusText: "Đã thắng đấu giá", endTime: "Đã kết thúc" },
    { auctionId: "9", simNumber: "0987 654 321", carrier: "Mobifone", myBid: 32_000_000, currentPrice: 35_000_000, status: "lost", statusText: "Không trúng", endTime: "Đã kết thúc" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ fontSize: 18, fontWeight: 800, color: "#001743", margin: 0 }}>Các phiên bạn đang tham gia trả giá</h2>
        <Link href="/auctions" className="btn-red" style={{ padding: "7px 14px", fontSize: 13, borderRadius: 6 }}>
          Tìm thêm SIM đấu giá →
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
              flexWrap: "wrap",
              gap: 16,
            }}
          >
            <div>
              <div style={{ fontSize: 17, fontWeight: 900, color: "#001743", fontVariantNumeric: "tabular-nums" }}>
                {b.simNumber}
              </div>
              <div style={{ fontSize: 12, color: "#6B7280", marginTop: 2 }}>
                Nhà mạng: <strong>{b.carrier}</strong> · {b.endTime}
              </div>
            </div>

            <div>
              <div style={{ fontSize: 11, color: "#6B7280", fontWeight: 600 }}>Giá bạn trả:</div>
              <div style={{ fontSize: 16, fontWeight: 900, color: "#001743", fontVariantNumeric: "tabular-nums" }}>
                {b.myBid.toLocaleString("vi-VN")} ₫
              </div>
            </div>

            <div>
              <div style={{ fontSize: 11, color: "#6B7280", fontWeight: 600 }}>Giá hiện tại:</div>
              <div style={{ fontSize: 16, fontWeight: 900, color: "#E4011E", fontVariantNumeric: "tabular-nums" }}>
                {b.currentPrice.toLocaleString("vi-VN")} ₫
              </div>
            </div>

            <div>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  padding: "4px 10px",
                  borderRadius: 6,
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
          style={{ padding: "7px 14px", fontSize: 13, borderRadius: 6, display: "flex", alignItems: "center", gap: 6 }}
        >
          <Icons.Plus /> Đăng bán SIM mới
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
   TAB 4: BIẾN ĐỘNG SỐ DƯ & VÍ (Kết nối API thật)
═══════════════════════════════════════════════════════════════ */
function TransactionsWidgetTab({
  onOpenDeposit,
  onOpenWithdraw,
  addToast,
}: {
  onOpenDeposit: () => void;
  onOpenWithdraw: () => void;
  addToast: (t: Omit<ToastMessage, "id">) => void;
}) {
  const [transactions, setTransactions] = useState<WalletTransactionDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [pageIndex, setPageIndex] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [filterType, setFilterType] = useState<string>("ALL");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");

  const loadTransactions = async () => {
    setLoading(true);
    try {
      const typeParam = filterType !== "ALL" ? (filterType as WalletTransactionType) : undefined;
      const statusParam = filterStatus !== "ALL" ? (filterStatus as TransactionStatus) : undefined;
      const res = await walletService.getTransactions({
        pageIndex,
        pageSize: 15,
        type: typeParam,
        status: statusParam,
      });
      setTransactions(res.items || []);
      setTotalPages(res.totalPages || 1);
    } catch (err: any) {
      addToast({
        type: "error",
        title: "Tải lịch sử giao dịch thất bại",
        message: err.message || "Vui lòng thử lại sau.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, [pageIndex, filterType, filterStatus]);

  const getStatusBadge = (status: TransactionStatus) => {
    switch (status) {
      case "COMPLETED":
        return { text: "Hoàn tất", bg: "#F0FDF4", color: "#16A34A", border: "#BBF7D0" };
      case "PENDING":
        return { text: "Đang xử lý", bg: "#FEF9C3", color: "#A16207", border: "#FEF08A" };
      case "FAILED":
        return { text: "Thất bại", bg: "#FEF2F2", color: "#DC2626", border: "#FECACA" };
      case "CANCELLED":
        return { text: "Đã hủy", bg: "#F3F4F6", color: "#6B7280", border: "#E5E7EB" };
      default:
        return { text: status, bg: "#F3F4F6", color: "#6B7280", border: "#E5E7EB" };
    }
  };

  const getTypeLabel = (type: WalletTransactionType) => {
    switch (type) {
      case "TOP_UP":
        return "Nạp tiền VietQR SePay";
      case "WITHDRAW":
        return "Rút tiền về ngân hàng";
      default:
        return type;
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Action Header & Filters */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: "#001743", margin: 0 }}>
            Lịch sử biến động số dư ví
          </h2>
          <p style={{ fontSize: 12, color: "#6B7280", margin: 0, marginTop: 2 }}>
            Toàn bộ các giao dịch nạp, rút và biến động số dư tài khoản của bạn
          </p>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {/* Filter Type */}
          <select
            value={filterType}
            onChange={(e) => {
              setFilterType(e.target.value);
              setPageIndex(1);
            }}
            style={{
              padding: "7px 12px",
              fontSize: 12.5,
              fontWeight: 600,
              borderRadius: 6,
              border: "1px solid #D1D5DB",
              background: "#FFFFFF",
              color: "#374151",
              outline: "none",
            }}
          >
            <option value="ALL">Tất cả loại giao dịch</option>
            <option value="TOP_UP">Nạp tiền</option>
            <option value="WITHDRAW">Rút tiền</option>
          </select>

          {/* Filter Status */}
          <select
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value);
              setPageIndex(1);
            }}
            style={{
              padding: "7px 12px",
              fontSize: 12.5,
              fontWeight: 600,
              borderRadius: 6,
              border: "1px solid #D1D5DB",
              background: "#FFFFFF",
              color: "#374151",
              outline: "none",
            }}
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="COMPLETED">Hoàn tất</option>
            <option value="PENDING">Đang chờ xử lý</option>
            <option value="FAILED">Thất bại</option>
          </select>

          <button
            type="button"
            onClick={loadTransactions}
            title="Làm mới dữ liệu"
            style={{
              padding: "7px 10px",
              borderRadius: 6,
              border: "1px solid #D1D5DB",
              background: "#FFFFFF",
              color: "#4B5563",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 4,
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            <Icons.Refresh /> Làm mới
          </button>
        </div>
      </div>

      {/* Transactions List */}
      <div style={{ background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: 8, overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: "48px 20px", textAlign: "center", color: "#6B7280", fontSize: 13 }}>
            <div style={{ width: 28, height: 28, border: "2.5px solid #001743", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 10px" }} />
            Đang tải dữ liệu giao dịch...
          </div>
        ) : transactions.length === 0 ? (
          <div style={{ padding: "48px 20px", textAlign: "center", color: "#6B7280" }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 12, color: "#9CA3AF" }}>
              <Icons.CreditCard size={36} />
            </div>
            <h4 style={{ fontSize: 15, fontWeight: 700, color: "#001743", margin: "0 0 4px" }}>
              Chưa có giao dịch nào
            </h4>
            <p style={{ fontSize: 12.5, color: "#9CA3AF", margin: "0 0 16px" }}>
              Bạn chưa thực hiện giao dịch nạp hoặc rút tiền nào trên hệ thống.
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <button
                type="button"
                onClick={onOpenDeposit}
                style={{
                  padding: "8px 16px",
                  borderRadius: 6,
                  background: "#E4011E",
                  color: "#FFFFFF",
                  border: "none",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                + Nạp tiền vào ví
              </button>
              <button
                type="button"
                onClick={onOpenWithdraw}
                style={{
                  padding: "8px 16px",
                  borderRadius: 6,
                  background: "#F3F4F6",
                  color: "#001743",
                  border: "1px solid #D1D5DB",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Rút tiền
              </button>
            </div>
          </div>
        ) : (
          <div>
            {transactions.map((tx) => {
              const isPlus = tx.walletTransactionType === "TOP_UP";
              const badge = getStatusBadge(tx.transactionStatus);
              const formattedDate = new Date(tx.createdAt).toLocaleString("vi-VN", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              });

              return (
                <div
                  key={tx.id}
                  style={{
                    padding: "16px 20px",
                    borderBottom: "1px solid #F3F4F6",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: 12,
                    transition: "background 0.15s ease",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "#F8FAFC"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "#FFFFFF"; }}
                >
                  {/* Left: Transaction Code & Description */}
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                    <div
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 8,
                        background: isPlus ? "#F0FDF4" : "#EFF6FF",
                        color: isPlus ? "#16A34A" : "#2563EB",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        marginTop: 2,
                      }}
                    >
                      {isPlus ? <Icons.Plus /> : <Icons.ArrowUpRight />}
                    </div>

                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 14, fontWeight: 800, color: "#001743" }}>
                          {getTypeLabel(tx.walletTransactionType)}
                        </span>
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            padding: "2px 6px",
                            borderRadius: 4,
                            background: badge.bg,
                            color: badge.color,
                            border: `1px solid ${badge.border}`,
                          }}
                        >
                          {badge.text}
                        </span>
                      </div>

                      <div style={{ fontSize: 12, color: "#6B7280", marginTop: 3 }}>
                        {tx.description || `Mã giao dịch: ${tx.transactionCode}`}
                      </div>

                      {tx.destinationBankName && (
                        <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 2 }}>
                          Ngân hàng: <strong>{tx.destinationBankName}</strong> · Số TK: <strong>{tx.destinationAccountNumberMasked}</strong> ({tx.destinationAccountHolderName})
                        </div>
                      )}

                      <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 2 }}>
                        Mã: <strong style={{ fontFamily: "monospace" }}>{tx.transactionCode}</strong> · {formattedDate}
                      </div>
                    </div>
                  </div>

                  {/* Right: Amount & Balance Changes */}
                  <div style={{ textAlign: "right" }}>
                    <div
                      style={{
                        fontSize: 17,
                        fontWeight: 900,
                        color: isPlus ? "#16A34A" : "#DC2626",
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {isPlus ? "+" : "-"}{tx.amount.toLocaleString("vi-VN")} ₫
                    </div>

                    {tx.balanceAfter !== undefined && (
                      <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 3 }}>
                        Số dư sau GD: <strong style={{ color: "#374151" }}>{tx.balanceAfter.toLocaleString("vi-VN")} ₫</strong>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div
                style={{
                  padding: "12px 20px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  background: "#F8F9FA",
                  borderTop: "1px solid #E5E7EB",
                  fontSize: 13,
                }}
              >
                <span style={{ color: "#6B7280" }}>
                  Trang <strong>{pageIndex}</strong> / {totalPages}
                </span>

                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    type="button"
                    disabled={pageIndex <= 1}
                    onClick={() => setPageIndex((p) => Math.max(1, p - 1))}
                    style={{
                      padding: "5px 12px",
                      borderRadius: 4,
                      border: "1px solid #D1D5DB",
                      background: pageIndex <= 1 ? "#E5E7EB" : "#FFFFFF",
                      color: pageIndex <= 1 ? "#9CA3AF" : "#374151",
                      cursor: pageIndex <= 1 ? "not-allowed" : "pointer",
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  >
                    ← Trước
                  </button>
                  <button
                    type="button"
                    disabled={pageIndex >= totalPages}
                    onClick={() => setPageIndex((p) => Math.min(totalPages, p + 1))}
                    style={{
                      padding: "5px 12px",
                      borderRadius: 4,
                      border: "1px solid #D1D5DB",
                      background: pageIndex >= totalPages ? "#E5E7EB" : "#FFFFFF",
                      color: pageIndex >= totalPages ? "#9CA3AF" : "#374151",
                      cursor: pageIndex >= totalPages ? "not-allowed" : "pointer",
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  >
                    Sau →
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TAB 5: HỢP ĐỒNG ĐIỆN TỬ & KÝ QUỸ ESCROW (Kết nối API thật)
═══════════════════════════════════════════════════════════════ */
function ContractsWidgetTab({ addToast }: { addToast: (t: Omit<ToastMessage, "id">) => void }) {
  const [trades, setTrades] = useState<TradeTransactionDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    tradeService
      .getMyTrades()
      .then((res) => setTrades(res.items || []))
      .catch(() => { })
      .finally(() => setLoading(false));
  }, []);

  const getEscrowBadge = (status: string) => {
    switch (status) {
      case "HELD":
        return { text: "Đã giữ tiền Escrow", bg: "#EFF6FF", color: "#2563EB", border: "#BFDBFE" };
      case "RELEASED_TO_SELLER":
        return { text: "Đã giải ngân cho người bán", bg: "#F0FDF4", color: "#16A34A", border: "#BBF7D0" };
      case "REFUNDED_TO_BUYER":
        return { text: "Đã hoàn tiền cho người mua", bg: "#FEF2F2", color: "#DC2626", border: "#FECACA" };
      case "PENDING_FUNDING":
      default:
        return { text: "Chờ nộp tiền ký quỹ", bg: "#FEF9C3", color: "#854D0E", border: "#FEF08A" };
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: "#001743", margin: 0 }}>
            Hợp đồng chuyển nhượng & Ký quỹ bảo đảm (Escrow)
          </h2>
          <p style={{ fontSize: 12, color: "#6B7280", margin: 0, marginTop: 2 }}>
            Hệ thống tài khoản ký quỹ trung gian bảo đảm an toàn 100% cho cả bên mua và bên bán
          </p>
        </div>
      </div>

      {loading ? (
        <div style={{ background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: 8, padding: 36, textAlign: "center", color: "#6B7280" }}>
          Đang tải dữ liệu hợp đồng ký quỹ...
        </div>
      ) : trades.length === 0 ? (
        <div style={{ background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: 8, padding: 36, textAlign: "center", color: "#6B7280" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 12, color: "#9CA3AF" }}>
            <Icons.FileText size={36} />
          </div>
          <h4 style={{ fontSize: 15, fontWeight: 700, color: "#001743", margin: "0 0 4px" }}>
            Chưa có giao dịch ký quỹ nào
          </h4>
          <p style={{ fontSize: 12.5, color: "#9CA3AF", margin: "0 0 16px" }}>
            Khi bạn trúng đấu giá hoặc hoàn tất chuyển nhượng SIM, hợp đồng và tiến trình ký quỹ sẽ hiển thị tại đây.
          </p>
          <Link href="/auctions" className="btn-red" style={{ padding: "8px 16px", fontSize: 13, borderRadius: 6, display: "inline-block" }}>
            Khám phá phòng đấu giá →
          </Link>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {trades.map((trade) => {
            const escrowBadge = getEscrowBadge(trade.escrowStatus);
            return (
              <div
                key={trade.id}
                style={{
                  background: "#FFFFFF",
                  border: "1px solid #E5E7EB",
                  borderRadius: 8,
                  padding: 20,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: 16,
                }}
              >
                <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 8,
                      background: "#EFF6FF",
                      color: "#2563EB",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Icons.FileText />
                  </div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: "#001743" }}>
                      Hợp đồng chuyển nhượng #{trade.tradeTransactionCode}
                    </div>
                    <div style={{ fontSize: 12.5, color: "#4B5563", marginTop: 2 }}>
                      SIM: <strong style={{ color: "#001743", fontVariantNumeric: "tabular-nums" }}>{trade.simPhoneNumber}</strong>
                      &nbsp;·&nbsp;
                      Tiền ký quỹ: <strong style={{ color: "#E4011E" }}>{trade.escrowAmount.toLocaleString("vi-VN")} ₫</strong>
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span
                    style={{
                      background: escrowBadge.bg,
                      color: escrowBadge.color,
                      border: `1px solid ${escrowBadge.border}`,
                      fontSize: 11.5,
                      fontWeight: 700,
                      padding: "4px 10px",
                      borderRadius: 4,
                    }}
                  >
                    {escrowBadge.text}
                  </span>

                  <button
                    type="button"
                    onClick={() => addToast({ type: "info", title: "Chi tiết ký quỹ", message: `Hợp đồng #${trade.tradeTransactionCode} đang được giám sát bởi hệ thống Escrow tự động.` })}
                    className="btn-outline"
                    style={{ padding: "6px 14px", fontSize: 12 }}
                  >
                    Xem tiến trình →
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TAB 6: CÀI ĐẶT & BẢO MẬT
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
      <div style={{ background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: 8, padding: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 800, color: "#001743", margin: "0 0 16px", display: "flex", alignItems: "center", gap: 8 }}>
          <Icons.User /> Thông tin cá nhân
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

      <div style={{ background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: 8, padding: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 800, color: "#001743", margin: "0 0 16px", display: "flex", alignItems: "center", gap: 8 }}>
          <Icons.Lock /> Đổi mật khẩu tài khoản
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
