"use client";

import React, { Suspense, useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { authService } from "@/services/authService";
import { walletService } from "@/services/walletService";
import { ekycService, IdentityVerificationDto } from "@/services/ekycService";
import { AuthResponseDto, UserProfileDto } from "@/types/auth";
import { WalletDto } from "@/types/wallet";
import { ToastMessage } from "@/components/ui/Toast";
import { showToast } from "@/components/layout/AppShell";
import { DepositModal } from "@/components/wallet/DepositModal";
import { WithdrawModal } from "@/components/wallet/WithdrawModal";

import { ProfileIcons as Icons } from "@/components/profile/ProfileIcons";
import { ProfileTab } from "@/types/types";
import { Camera, Loader2, Sparkles, Check, Clock, Plus, ArrowUpRight, ShieldCheck, Wallet } from "lucide-react";
import { uploadImageToCloudinary } from "@/services/cloudinaryService";

// Modular Tab Components
import OverviewTab from "@/components/profile/OverviewTab";
import EkycTab from "@/components/profile/EkycTab";
import OwnedSimsTab from "@/components/profile/OwnedSimsTab";
import BidsTab from "@/components/profile/BidsTab";
import SettlementsTab from "@/components/profile/SettlementsTab";
import TransactionsTab from "@/components/profile/TransactionsTab";
import ContractsTab from "@/components/profile/ContractsTab";
import SettingsTab from "@/components/profile/SettingsTab";

const TABS: { key: ProfileTab; icon: React.ComponentType<{ size?: number }>; label: string }[] = [
  { key: "overview", icon: Icons.User, label: "Tổng quan" },
  { key: "ekyc", icon: Icons.ShieldCheck, label: "Xác thực eKYC" },
  { key: "auctions", icon: Icons.Inbox, label: "SIM sở hữu" },
  { key: "bids", icon: Icons.Gavel, label: "Đang đấu giá" },
  { key: "settlements", icon: Icons.FileCheck, label: "Hoàn tất giao dịch" },
  { key: "transactions", icon: Icons.Wallet, label: "Giao dịch ví" },
  { key: "contracts", icon: Icons.FileText, label: "Hợp đồng" },
  { key: "settings", icon: Icons.Settings, label: "Cài đặt & Bảo mật" },
];

const PROFILE_TAB_KEYS = new Set<ProfileTab>(TABS.map((tab) => tab.key));

function getProfileTab(value: string | null): ProfileTab {
  if (value === "trades") return "contracts";
  return value && PROFILE_TAB_KEYS.has(value as ProfileTab) ? (value as ProfileTab) : "overview";
}

function ProfilePageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<ProfileTab>(() => getProfileTab(searchParams.get("tab")));
  const [user, setUser] = useState<AuthResponseDto | null>(null);
  const [profile, setProfile] = useState<UserProfileDto | null>(null);
  const [wallet, setWallet] = useState<WalletDto | null>(null);
  const [loading, setLoading] = useState(true);

  // eKYC State
  const [kycStatus, setKycStatus] = useState<IdentityVerificationDto | null>(null);
  const [kycHistory, setKycHistory] = useState<IdentityVerificationDto[]>([]);
  const [loadingKyc, setLoadingKyc] = useState(false);

  // Modals state
  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [walletRefreshKey, setWalletRefreshKey] = useState(0);

  const handleTabChange = useCallback(
    (tab: ProfileTab) => {
      setActiveTab(tab);
      router.replace(`/profile?tab=${tab}`, { scroll: false });
    },
    [router]
  );

  const addToast = (toast: Omit<ToastMessage, "id">) => {
    showToast(toast);
  };

  const fetchWallet = () => {
    if (authService.isAuthenticated()) {
      walletService
        .getMyWallet()
        .then((data) => setWallet(data))
        .catch(() => {});
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

    setActiveTab(getProfileTab(searchParams.get("tab")));

    if (authService.isAuthenticated()) {
      Promise.all([
        authService
          .getProfile()
          .then((data) => setProfile(data))
          .catch(() => {}),
        walletService
          .getMyWallet()
          .then((data) => setWallet(data))
          .catch(() => {}),
        fetchKyc(),
      ]).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [searchParams]);

  // Người dùng được xem là ĐÃ XÁC THỰC nếu có bất kỳ hồ sơ eKYC nào hợp lệ (VERIFIED)
  const isEkycVerified =
    ekycService.isVerified(kycStatus) || kycHistory.some((h) => ekycService.isVerified(h));

  const displayName = profile?.fullName || user?.fullName || "Thành viên TrustSim";
  const displayEmail = profile?.email || user?.email || "customer@trustsim.vn";
  const displayPhone = profile?.phoneNumber || user?.phoneNumber || "";
  const displayIdentity = profile?.identityNumber || "";
  const rawAvatar = profile?.avatarImg || user?.avatarImg || "";
  const displayAvatar = rawAvatar && !rawAvatar.includes("trustsim.vn") ? rawAvatar : "";
  const initialChar = (displayName || user?.userName || "T").charAt(0).toUpperCase();

  // Cloudinary Avatar upload state
  const avatarInputRef = useRef<HTMLInputElement>(null);
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
          message: "Đã cập nhật ảnh đại diện mới thành công!",
        });
      } else {
        addToast({
          type: "error",
          title: "Lỗi tải ảnh",
          message: res.error || "Không thể tải ảnh đại diện lên máy chủ.",
        });
      }
    } catch (err: any) {
      addToast({
        type: "error",
        title: "Lỗi tải ảnh",
        message: err.message || "Không thể tải ảnh đại diện.",
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
    <div className="min-h-screen bg-[#F7F8FD] text-[#0B1630] font-sans flex flex-col pt-16">
      <Navbar />

      {/* Modals */}
      <DepositModal
        isOpen={depositModalOpen}
        onClose={() => setDepositModalOpen(false)}
        onSuccess={() => {
          fetchWallet();
          setWalletRefreshKey((k) => k + 1);
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
            message: `Đã tạo lệnh rút ${tx.amount.toLocaleString("vi-VN")} ₫ về ${
              tx.destinationBankName || "ngân hàng"
            }.`,
          });
        }}
      />

      {/* ═══ 1. PROFILE SHOWCASE HERO: SOFT-CLOUD NAVY ═══════ */}
      <div className="px-3 sm:px-6 pt-5 pb-3">
        <section className="relative mx-auto max-w-[1180px] overflow-hidden rounded-[32px] border border-white bg-gradient-to-b from-[#f1f3ff] via-[#e4e9ff] to-[#d3dbff] p-6 sm:p-8 shadow-[0_16px_50px_rgba(0,23,67,0.08)]">
          {/* Ambient Glow Orbs */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-24 -left-20 h-72 w-72 rounded-full bg-white/70 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute top-10 -right-20 h-72 w-72 rounded-full bg-[#8c9cff]/30 blur-3xl"
          />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-6 items-center">
            {/* Left Column: Avatar & User Identity */}
            <div className="flex flex-wrap items-center gap-5">
              {/* Avatar with Camera upload */}
              <div className="relative shrink-0">
                <input
                  type="file"
                  ref={avatarInputRef}
                  onChange={handleAvatarChange}
                  accept="image/*"
                  className="hidden"
                />
                <div
                  onClick={() => avatarInputRef.current?.click()}
                  className="relative h-20 w-20 cursor-pointer overflow-hidden rounded-full border-3 border-white bg-gradient-to-br from-[#0B2A6B] to-[#001743] shadow-[0_8px_24px_rgba(0,23,67,0.22)] flex items-center justify-center font-bold text-2xl text-white select-none transition-transform hover:scale-102"
                  title="Nhấn để đổi ảnh đại diện"
                >
                  {displayAvatar ? (
                    <img
                      src={displayAvatar}
                      alt={displayName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    initialChar
                  )}
                  {avatarUploading && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <Loader2 size={22} className="animate-spin text-white" />
                    </div>
                  )}
                </div>

                {/* Cloudinary Camera Upload Button */}
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={avatarUploading}
                  className="absolute -bottom-1 -left-1 grid h-7 w-7 cursor-pointer place-items-center rounded-full border-2 border-white bg-[#001743] text-white shadow-xs transition-transform hover:scale-110"
                  title="Tải ảnh đại diện"
                  aria-label="Tải ảnh đại diện"
                >
                  {avatarUploading ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <Camera size={12} />
                  )}
                </button>

                {/* Status Indicator Dot */}
                <div
                  className={`absolute -bottom-1 -right-1 grid h-6 w-6 place-items-center rounded-full border-2 border-white text-white ${
                    isEkycVerified ? "bg-emerald-600" : "bg-amber-500"
                  }`}
                  title={isEkycVerified ? "Tài khoản đã xác minh eKYC" : "Tài khoản chưa hoàn tất eKYC"}
                >
                  {isEkycVerified ? <Check size={13} strokeWidth={2.5} /> : <Clock size={11} />}
                </div>
              </div>

              {/* Identity details */}
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="text-2xl font-bold tracking-tight text-[#001743] leading-tight">
                    {displayName}
                  </h1>

                  {isEkycVerified ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-0.5 text-xs font-bold text-emerald-700 shadow-2xs">
                      <ShieldCheck size={13} /> Đã xác thực eKYC
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleTabChange("ekyc")}
                      className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-3 py-0.5 text-xs font-bold text-amber-800 shadow-2xs hover:bg-amber-100 transition-colors"
                      title="Nhấn để hoàn tất xác thực danh tính"
                    >
                      <Clock size={12} /> Chưa eKYC (Nhấn để nộp)
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2.5 text-xs text-slate-600">
                  <span>{displayEmail}</span>
                  {displayPhone && (
                    <>
                      <span className="text-slate-300">•</span>
                      <span className="font-mono">{displayPhone}</span>
                    </>
                  )}
                  {displayIdentity && (
                    <>
                      <span className="text-slate-300">•</span>
                      <span>CCCD: <strong className="font-mono">{displayIdentity}</strong></span>
                    </>
                  )}
                </div>

                <div className="text-[11.5px] text-slate-500 flex items-center gap-2">
                  <span>Thành viên TrustSim</span>
                  <span className="text-slate-300">•</span>
                  <span>Bảo chứng định danh đa tầng</span>
                </div>
              </div>
            </div>

            {/* Right Column: Real-time Wallet Card */}
            <div className="rounded-[24px] border border-white/95 bg-white/85 p-5 shadow-[0_10px_30px_rgba(0,23,67,0.06)] backdrop-blur-xl min-w-[280px] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Số Dư Khả Dụng
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Hoạt động
                </span>
              </div>

              <div>
                <div className="font-mono text-2xl font-bold text-[#001743] tabular-nums leading-none">
                  {availableBalance.toLocaleString("vi-VN")}{" "}
                  <span className="text-sm font-semibold text-slate-500">₫</span>
                </div>
                {lockedBalance > 0 && (
                  <div className="mt-1 text-[11.5px] font-medium text-slate-500">
                    Ký quỹ giữ cọc: <strong className="font-mono">{lockedBalance.toLocaleString("vi-VN")} ₫</strong>
                  </div>
                )}
              </div>

              {/* Action Buttons: Pill shapes */}
              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setDepositModalOpen(true)}
                  className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-full bg-gradient-to-b from-[#0B2A6B] to-[#001743] px-3.5 py-2 text-xs font-bold text-white shadow-xs transition-transform hover:-translate-y-0.5 active:scale-95"
                >
                  <Plus size={14} /> Nạp tiền
                </button>
                <button
                  type="button"
                  onClick={() => setWithdrawModalOpen(true)}
                  className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-full border border-slate-200 bg-white hover:bg-slate-50 px-3.5 py-2 text-xs font-bold text-[#001743] shadow-xs transition-colors active:scale-95"
                >
                  <ArrowUpRight size={14} /> Rút tiền
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* ═══ 2. PROFILE WORKSPACE: SIDEBAR & ACTIVE TAB ═════ */}
      <div className="mx-auto max-w-[1180px] w-full px-3 sm:px-6 py-6 flex-1">
        <div className="grid grid-cols-1 md:grid-cols-[230px_minmax(0,1fr)] gap-7 items-start">
          {/* Floating Sidebar Navigation Pill Card */}
          <aside className="rounded-[28px] border border-[rgba(0,23,67,0.08)] bg-white p-3 shadow-xs sticky top-24 backdrop-blur-sm space-y-1">
            <div className="px-3 py-2 border-b border-slate-100 mb-1.5">
              <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400">
                Tài khoản
              </span>
              <div className="text-sm font-bold text-[#001743]">Không gian cá nhân</div>
            </div>

            <nav className="space-y-1" aria-label="Điều hướng tài khoản">
              {TABS.map((tab) => {
                const isActive = activeTab === tab.key;
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => handleTabChange(tab.key)}
                    aria-current={isActive ? "page" : undefined}
                    className={`w-full flex items-center gap-2.5 rounded-full px-3.5 py-2.5 text-xs transition-all duration-150 cursor-pointer ${
                      isActive
                        ? "bg-[#001743] text-white font-bold shadow-xs"
                        : "text-slate-600 hover:text-[#001743] hover:bg-slate-100 font-semibold"
                    }`}
                  >
                    <Icon size={15} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </aside>

          {/* Active Tab Main Content */}
          <main className="min-w-0 space-y-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(0,23,67,0.08)] bg-white px-3 py-1 text-xs font-semibold text-slate-600 shadow-2xs mb-1">
                  <span>Hồ sơ</span>
                  <span className="text-slate-300">•</span>
                  <span className="text-[#001743] font-bold">
                    {TABS.find((tab) => tab.key === activeTab)?.label}
                  </span>
                </span>
                <h2 className="text-2xl font-bold tracking-tight text-[#001743] mt-1 m-0">
                  {TABS.find((tab) => tab.key === activeTab)?.label}
                </h2>
              </div>
            </div>

            {/* Tab Body Render */}
            <div className="rounded-[28px] border border-[rgba(0,23,67,0.08)] bg-white p-5 sm:p-7 shadow-xs">
              {activeTab === "overview" && (
                <OverviewTab
                  user={user}
                  profile={profile}
                  walletBalance={availableBalance}
                  isEkycVerified={isEkycVerified}
                  onNavigateTab={handleTabChange}
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
                  onNavigateToEkyc={() => handleTabChange("ekyc")}
                />
              )}
              {activeTab === "bids" && (
                <BidsTab addToast={addToast} onNavigateTab={handleTabChange} />
              )}
              {activeTab === "settlements" && (
                <SettlementsTab
                  addToast={addToast}
                  onOpenDeposit={() => setDepositModalOpen(true)}
                />
              )}
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
            </div>
          </main>
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F7F8FD] flex items-center justify-center text-sm text-slate-500">
          Đang tải hồ sơ tài khoản...
        </div>
      }
    >
      <ProfilePageInner />
    </Suspense>
  );
}
