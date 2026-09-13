"use client";

import React, { useState, useEffect } from "react";
import { authService } from "@/services/authService";
import { walletService } from "@/services/walletService";
import { ekycService, IdentityVerificationDto } from "@/services/ekycService";
import { AuthResponseDto, UserProfileDto } from "@/types/auth";
import { WalletDto } from "@/types/wallet";
import { ToastContainer, ToastMessage } from "@/components/ui/Toast";
import { DepositModal } from "@/components/wallet/DepositModal";
import { WithdrawModal } from "@/components/wallet/WithdrawModal";

import { ProfileIcons as Icons } from "@/components/profile/ProfileIcons";
import { ProfileTab } from "@/components/profile/types";
import { Camera, Loader2 } from "lucide-react";
import { uploadImageToCloudinary } from "@/services/cloudinaryService";

// Modular Tab Components
import OverviewTab from "@/components/profile/OverviewTab";
import EkycTab from "@/components/profile/EkycTab";
import OwnedSimsTab from "@/components/profile/OwnedSimsTab";
import BidsTab from "@/components/profile/BidsTab";
import TransactionsTab from "@/components/profile/TransactionsTab";
import ContractsTab from "@/components/profile/ContractsTab";
import SettingsTab from "@/components/profile/SettingsTab";

const TABS: { key: ProfileTab; icon: React.ComponentType<{ size?: number }>; label: string }[] = [
  { key: "overview", icon: Icons.User, label: "Tổng quan" },
  { key: "ekyc", icon: Icons.ShieldCheck, label: "Xác thực eKYC" },
  { key: "auctions", icon: Icons.Inbox, label: "SIM sở hữu" },
  { key: "bids", icon: Icons.Gavel, label: "Đang đấu giá" },
  { key: "transactions", icon: Icons.Wallet, label: "Giao dịch Ví" },
  { key: "contracts", icon: Icons.FileText, label: "Hợp đồng" },
  { key: "settings", icon: Icons.Settings, label: "Cài đặt & Bảo mật" },
];

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<ProfileTab>("overview");
  const [user, setUser] = useState<AuthResponseDto | null>(null);
  const [profile, setProfile] = useState<UserProfileDto | null>(null);
  const [wallet, setWallet] = useState<WalletDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // eKYC State
  const [kycStatus, setKycStatus] = useState<IdentityVerificationDto | null>(null);
  const [kycHistory, setKycHistory] = useState<IdentityVerificationDto[]>([]);
  const [loadingKyc, setLoadingKyc] = useState(false);

  // Modals state
  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [walletRefreshKey, setWalletRefreshKey] = useState(0);

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

  const fetchKyc = async () => {
    if (!authService.isAuthenticated()) return;
    setLoadingKyc(true);
    try {
      const [status, history] = await Promise.all([
        ekycService.getMyKycStatus(),
        ekycService.getMyKycHistory(),
      ]);
      setKycStatus(status);
      setKycHistory(history);
    } catch {
      // silently handle
    } finally {
      setLoadingKyc(false);
    }
  };

  useEffect(() => {
    const currentUser = authService.getUser();
    setUser(currentUser);

    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab") as ProfileTab;
      if (tabParam && ["overview", "ekyc", "auctions", "bids", "transactions", "contracts", "settings"].includes(tabParam)) {
        setActiveTab(tabParam);
      }
    }

    if (authService.isAuthenticated()) {
      Promise.all([
        authService.getProfile().then((data) => setProfile(data)).catch(() => { }),
        walletService.getMyWallet().then((data) => setWallet(data)).catch(() => { }),
        fetchKyc(),
      ]).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  // Người dùng được xem là ĐÃ XÁC THỰC nếu có bất kỳ hồ sơ eKYC nào hợp lệ (VERIFIED)
  const isEkycVerified =
    ekycService.isVerified(kycStatus) ||
    kycHistory.some((h) => ekycService.isVerified(h));

  const displayName = profile?.fullName || user?.fullName || "Nguyễn Văn An";
  const displayEmail = profile?.email || user?.email || "customer@trustsim.vn";
  const displayPhone = profile?.phoneNumber || user?.phoneNumber || "0901 234 567";
  const displayIdentity = profile?.identityNumber || "001201012345";
  const rawAvatar = profile?.avatarImg || user?.avatarImg || "";
  const displayAvatar = rawAvatar && !rawAvatar.includes("trustsim.vn") ? rawAvatar : "";
  const initialChar = displayName.charAt(0).toUpperCase();

  // Cloudinary Avatar upload state
  const avatarInputRef = React.useRef<HTMLInputElement>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      addToast({
        type: "error",
        title: "Tệp không hợp lệ",
        message: "Vui lòng chọn tệp hình ảnh (PNG, JPG, WEBP, JPEG).",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      addToast({
        type: "error",
        title: "Tệp quá lớn",
        message: "Kích thước ảnh đại diện không được vượt quá 5MB.",
      });
      return;
    }

    setAvatarUploading(true);
    try {
      const res = await uploadImageToCloudinary(file, "avatars");
      if (res.success && res.url) {
        await authService.updateAvatar(res.url);
        setProfile((prev) => (prev ? { ...prev, avatarImg: res.url } : prev));
        setUser((prev) => (prev ? { ...prev, avatarImg: res.url } : prev));
        addToast({
          type: "success",
          title: "Thành công",
          message: "Đã cập nhật ảnh đại diện lên Cloudinary thành công!",
        });
      } else {
        addToast({
          type: "error",
          title: "Lỗi tải ảnh",
          message: res.error || "Không thể tải ảnh đại diện lên Cloudinary.",
        });
      }
    } catch (err: any) {
      addToast({
        type: "error",
        title: "Lỗi tải ảnh",
        message: err.message || "Không thể tải ảnh đại diện lên Cloudinary.",
      });
    } finally {
      setAvatarUploading(false);
      if (avatarInputRef.current) {
        avatarInputRef.current.value = "";
      }
    }
  };

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
          setWalletRefreshKey((k) => k + 1);
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
          setWalletRefreshKey((k) => k + 1);
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
                <input
                  type="file"
                  ref={avatarInputRef}
                  onChange={handleAvatarChange}
                  accept="image/*"
                  style={{ display: "none" }}
                />
                <div
                  onClick={() => avatarInputRef.current?.click()}
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
                    overflow: "hidden",
                    cursor: "pointer",
                    position: "relative",
                  }}
                  title="Nhấn để đổi ảnh đại diện (Cloudinary)"
                >
                  {displayAvatar ? (
                    <img
                      src={displayAvatar}
                      alt={displayName}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    initialChar
                  )}
                  {avatarUploading && (
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        backgroundColor: "rgba(0, 0, 0, 0.6)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Loader2 size={24} className="animate-spin text-white" />
                    </div>
                  )}
                </div>

                {/* Cloudinary Camera Upload Button */}
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={avatarUploading}
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: -2,
                    width: 26,
                    height: 26,
                    borderRadius: "50%",
                    background: "#001743",
                    border: "2px solid #FFFFFF",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#FFFFFF",
                    cursor: "pointer",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
                    transition: "transform 0.15s ease",
                  }}
                  title="Tải ảnh đại diện lên Cloudinary"
                >
                  {avatarUploading ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <Camera size={12} />
                  )}
                </button>

                <div
                  style={{
                    position: "absolute",
                    bottom: 2,
                    right: 2,
                    width: 22,
                    height: 22,
                    borderRadius: "50%",
                    background: isEkycVerified ? "#16A34A" : "#D97706",
                    border: "2.5px solid #001743",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#FFFFFF",
                  }}
                  title={isEkycVerified ? "Tài khoản đã xác minh eKYC" : "Tài khoản chưa hoàn tất eKYC"}
                >
                  {isEkycVerified ? <Icons.Check size={13} /> : <Icons.Clock size={11} />}
                </div>
              </div>

              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6, flexWrap: "wrap" }}>
                  <h1 style={{ fontSize: 22, fontWeight: 900, color: "#FFFFFF", margin: 0, letterSpacing: "-0.01em" }}>
                    {displayName}
                  </h1>
                  {isEkycVerified ? (
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        fontSize: 11,
                        fontWeight: 700,
                        color: "#86EFAC",
                        background: "rgba(22, 163, 74, 0.22)",
                        border: "1px solid rgba(134, 239, 172, 0.35)",
                        padding: "3px 10px",
                        borderRadius: 9999,
                      }}
                    >
                      <Icons.Check size={12} /> Đã xác thực eKYC
                    </span>
                  ) : (
                    <button
                      onClick={() => setActiveTab("ekyc")}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 5,
                        fontSize: 11,
                        fontWeight: 700,
                        color: "#FDE047",
                        background: "rgba(245, 158, 11, 0.25)",
                        border: "1px solid rgba(253, 224, 71, 0.4)",
                        padding: "3px 10px",
                        borderRadius: 9999,
                        cursor: "pointer",
                      }}
                      title="Bấm để chuyển tới tab xác thực eKYC"
                    >
                      <Icons.Clock size={11} /> Chưa xác thực eKYC (Bấm để nộp)
                    </button>
                  )}
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 14, color: "rgba(255, 255, 255, 0.72)", fontSize: 13, flexWrap: "wrap", marginBottom: 10 }}>
                  <span>{displayEmail}</span>
                  <span>·</span>
                  <span>{displayPhone}</span>
                  <span>·</span>
                  <span>CCCD: {displayIdentity}</span>
                </div>

                <div style={{ display: "flex", gap: 20, fontSize: 12, color: "rgba(255, 255, 255, 0.65)" }}>
                  <span>Thành viên từ: <strong style={{ color: "#FFFFFF" }}>01/2025</strong></span>
                  <span>·</span>
                  <span>
                    Trạng thái định danh:{" "}
                    <strong style={{ color: isEkycVerified ? "#86EFAC" : "#FDE047" }}>
                      {isEkycVerified ? "Đã đối soát CCCD" : "Chờ nộp hồ sơ eKYC"}
                    </strong>
                  </span>
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
          3. MAIN CONTENT CONTAINER (Modular Tab Routing)
      ═══════════════════════════════════════════════════════════ */}
      <main className="container" style={{ maxWidth: 1180, margin: "0 auto", padding: "28px 20px 60px" }}>
        {activeTab === "overview" && (
          <OverviewTab
            user={user}
            profile={profile}
            walletBalance={availableBalance}
            isEkycVerified={isEkycVerified}
            onNavigateTab={setActiveTab}
            addToast={addToast}
          />
        )}
        {activeTab === "ekyc" && (
          <EkycTab
            kycStatus={kycStatus}
            kycHistory={kycHistory}
            isVerified={isEkycVerified}
            loading={loadingKyc}
            onRefresh={fetchKyc}
            addToast={addToast}
          />
        )}
        {activeTab === "auctions" && (
          <OwnedSimsTab
            isEkycVerified={isEkycVerified}
            addToast={addToast}
            onNavigateToEkyc={() => setActiveTab("ekyc")}
          />
        )}
        {activeTab === "bids" && <BidsTab addToast={addToast} />}
        {activeTab === "transactions" && (
          <TransactionsTab
            onOpenDeposit={() => setDepositModalOpen(true)}
            onOpenWithdraw={() => setWithdrawModalOpen(true)}
            addToast={addToast}
            refreshTrigger={walletRefreshKey}
          />
        )}
        {activeTab === "contracts" && <ContractsTab addToast={addToast} />}
        {activeTab === "settings" && (
          <SettingsTab user={user} profile={profile} addToast={addToast} />
        )}
      </main>
    </div>
  );
}
