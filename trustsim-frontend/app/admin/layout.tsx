/* Hallmark · genre: modern-minimal · macrostructure: Workbench · design-system: design.md · designed-as-app */
"use client";
import React, { Suspense, useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Bell,
  Settings,
  LogOut,
  User,
  ChevronDown,
  Shield,
  ExternalLink,
  CheckCheck,
  Clock,
  Sparkles,
  Wallet,
  FileText,
  Gavel,
  Smartphone,
} from "lucide-react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { AuthSessionGuard } from "@/components/auth/AuthSessionGuard";
import { authService } from "@/services/authService";
import { walletService } from "@/services/walletService";
import {
  getMyNotifications,
  markNotificationAsRead,
  type NotificationItemDto,
} from "@/services/notificationService";
import { notificationHubService } from "@/services/notificationHubService";
import type { WalletDto } from "@/types/wallet";
import type { AuthResponseDto } from "@/types/auth";
import { App as AntApp, ConfigProvider } from "antd";
import viVN from "antd/locale/vi_VN";

const TAB_LABELS: Record<string, string> = {
  dashboard: "Tổng quan hệ thống",
  sims: "Quản lý kho SIM",
  auctions: "Quản lý phiên đấu giá",
  categories: "Danh mục & Định giá SIM",
  carriers: "Nhà mạng & Dải đầu số",
  transactions: "Giao dịch ký quỹ",
  ledger: "Sổ cái kế toán ghi kép",
  customers: "Quản lý Khách hàng & Tài chính Ví",
  staff: "Quản lý Nhân sự & Quản trị viên",
  users: "Quản lý Khách hàng",
  ekyc: "Phê duyệt hồ sơ eKYC",
  disputes: "Giải quyết khiếu nại & Trọng tài",
  documents: "Quản lý Tài liệu & Chính sách",
  "audit-logs": "Nhật ký kiểm toán hệ thống",
  finance: "Dòng tiền & Doanh thu sàn",
  anomalies: "AI Giám sát bất thường & Gian lận",
  settings: "Cài đặt & Cấu hình sàn",
};


function formatRelativeTime(dateStr?: string) {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / (60 * 1000));
    if (diffMin < 1) return "Vừa xong";
    if (diffMin < 60) return `${diffMin} phút trước`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours} giờ trước`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays} ngày trước`;
    return d.toLocaleDateString("vi-VN");
  } catch {
    return dateStr;
  }
}

// ─── Main Inner Component ──────────────────────────────────────────────────
function AdminLayoutInner({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const currentTab = searchParams?.get("tab") || "dashboard";

  useEffect(() => {
    if (window.matchMedia("(max-width: 767px)").matches) {
      setCollapsed(true);
    }
  }, []);

  // User & Wallet from session
  const [user, setUser] = useState<AuthResponseDto | null>(null);
  const [wallet, setWallet] = useState<WalletDto | null>(null);

  // Notification dropdown
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItemDto[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifs, setLoadingNotifs] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  // Avatar dropdown
  const [avatarOpen, setAvatarOpen] = useState(false);
  const avatarRef = useRef<HTMLDivElement>(null);

  // Load User Info & Wallet
  useEffect(() => {
    const initialUser = authService.getUser();
    setUser(initialUser);

    if (authService.isAuthenticated()) {
      authService
        .getProfile()
        .then((prof) => {
          if (prof) {
            const cur = authService.getUser();
            if (cur) {
              const updated = {
                ...cur,
                avatarImg: prof.avatarImg || cur.avatarImg,
                fullName: prof.fullName || cur.fullName,
              };
              authService.saveSession(updated);
              setUser(updated);
            }
          }
        })
        .catch(() => {});

      walletService
        .getMyWallet()
        .then((data) => setWallet(data))
        .catch(() => {});
    }

    const syncUser = () => setUser(authService.getUser());
    window.addEventListener("trustsim_auth_change", syncUser);
    window.addEventListener("storage", syncUser);

    return () => {
      window.removeEventListener("trustsim_auth_change", syncUser);
      window.removeEventListener("storage", syncUser);
    };
  }, []);

  // Load Notifications
  const loadNotifications = async () => {
    if (!authService.isAuthenticated()) return;
    try {
      setLoadingNotifs(true);
      const res = await getMyNotifications({ pageIndex: 1, pageSize: 20 });
      setNotifications(res.items || []);
      const unread = (res.items || []).filter((n) => !n.isRead).length;
      setUnreadCount(unread);
    } catch (err) {
      console.warn("[Admin Notification] Fallback to default:", err);
    } finally {
      setLoadingNotifs(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  // Listen for realtime push notifications via SignalR
  useEffect(() => {
    if (!authService.isAuthenticated()) return;

    const unsubNotif = notificationHubService.subscribeNotification((newNotif) => {
      setNotifications((prev) => [newNotif, ...prev]);
      setUnreadCount((prev) => prev + 1);
    });

    const unsubCount = notificationHubService.subscribeUnreadCount((count) => {
      setUnreadCount(count);
    });

    return () => {
      unsubNotif();
      unsubCount();
    };
  }, []);

  // Click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
      if (avatarRef.current && !avatarRef.current.contains(e.target as Node)) {
        setAvatarOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkAllAsRead = async () => {
    const unreadList = notifications.filter((n) => !n.isRead);
    if (unreadList.length === 0) return;

    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);

    await Promise.allSettled(unreadList.map((n) => markNotificationAsRead(n.id)));
  };

  const handleItemClick = async (n: NotificationItemDto) => {
    if (!n.isRead) {
      setNotifications((prev) =>
        prev.map((item) => (item.id === n.id ? { ...item, isRead: true } : item))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      markNotificationAsRead(n.id).catch(() => {});
    }
    setNotifOpen(false);
  };

  const handleLogout = async () => {
    await authService.logout();
    router.push("/login");
  };

  const displayName = user?.fullName || user?.userName || "Administrator";
  const initials = displayName.slice(0, 2).toUpperCase();
  const availableBalance = wallet?.availableBalance ?? 0;

  return (
    <div className="admin-shell min-h-screen flex bg-[#f8f9fa] text-[#001743] font-sans antialiased">
      {/* Modular Admin Sidebar */}
      <AdminSidebar
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(!collapsed)}
        currentTab={currentTab}
      />

      {/* Main Container */}
      <div
        className={`admin-main flex-1 flex flex-col min-h-screen transition-[margin] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          collapsed ? "ml-[68px]" : "ml-[248px]"
        }`}
      >
        {/* Top Header */}
        <header className="admin-topbar sticky top-0 z-30 h-[60px] bg-white border-b border-[#e4e7ec] px-3 sm:px-6 flex items-center justify-between shadow-xs">
          {/* Breadcrumb / Title */}
          <div className="flex items-center gap-2 text-[13px]">
            <span className="text-slate-400 font-medium">Bàn làm việc</span>
            <span className="text-slate-300">/</span>
            <span className="font-semibold text-[#001743] tracking-tight">
              {TAB_LABELS[currentTab] || "Quản trị"}
            </span>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-3">
            {/* System Health Status */}
            <div className="hidden sm:flex items-center gap-2 pr-4 border-r border-[#e4e7ec] text-slate-500 text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>Hệ thống trực tuyến</span>
            </div>

            {/* ── Notification Bell ── */}
            <div className="relative" ref={notifRef}>
              <button
                type="button"
                onClick={() => {
                  setNotifOpen((v) => !v);
                  setAvatarOpen(false);
                }}
                className="p-2 rounded-lg text-[#667085] hover:text-[#101828] hover:bg-[#f2f4f7] transition-colors relative cursor-pointer"
                aria-label="Thông báo"
              >
                <Bell size={18} strokeWidth={1.75} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 min-w-[15px] h-[15px] px-0.5 rounded-full bg-[#E4011E] text-white text-[9px] font-extrabold flex items-center justify-center ring-2 ring-white leading-none font-mono">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Panel */}
              {notifOpen && (
                <div className="absolute right-0 top-full mt-2 w-[340px] bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                  {/* Header */}
                  <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-white">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-[#001743]">Thông báo</span>
                      {unreadCount > 0 && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-rose-50 text-[#E4011E] border border-rose-100">
                          {unreadCount} mới
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllAsRead}
                        className="flex items-center gap-1 text-xs text-[#E4011E] hover:text-red-700 font-semibold transition-colors cursor-pointer"
                      >
                        <CheckCheck size={13} />
                        Đã đọc tất cả
                      </button>
                    )}
                  </div>

                  {/* Notif List */}
                  <div className="max-h-[340px] overflow-y-auto divide-y divide-slate-50">
                    {loadingNotifs ? (
                      <div className="py-8 text-center text-slate-400 text-xs">
                        Đang tải thông báo…
                      </div>
                    ) : notifications.length === 0 ? (
                      <div className="py-10 text-center text-slate-400 text-xs">
                        <Bell size={26} className="mx-auto text-slate-300 mb-2" />
                        <p className="font-semibold text-slate-600">Không có thông báo mới</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Các thông báo hệ thống và giao dịch sẽ xuất hiện ở đây.
                        </p>
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => handleItemClick(n)}
                          className={`flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-slate-50 ${
                            !n.isRead ? "bg-rose-50/20" : ""
                          }`}
                        >
                          {!n.isRead && (
                            <span className="w-2 h-2 rounded-full bg-[#E4011E] shrink-0 mt-1.5" />
                          )}
                          <div className="flex-1 min-w-0">
                            <div
                              className={`text-xs font-semibold ${
                                n.isRead ? "text-slate-700" : "text-[#001743] font-bold"
                              }`}
                            >
                              {n.title}
                            </div>
                            {n.content && (
                              <div className="text-[11px] text-slate-500 mt-0.5 leading-relaxed line-clamp-2">
                                {n.content}
                              </div>
                            )}
                            <div className="flex items-center gap-1 mt-1.5 text-[10px] text-slate-400">
                              <Clock size={10} />
                              <span>{formatRelativeTime(n.createdDate)}</span>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Footer */}
                  <div className="px-4 py-2 border-t border-slate-100 bg-slate-50/60">
                    <button
                      onClick={() => {
                        setNotifOpen(false);
                        loadNotifications();
                      }}
                      className="w-full text-center text-xs text-[#001743] font-semibold hover:text-[#E4011E] transition-colors py-1 cursor-pointer"
                    >
                      Làm mới thông báo
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* ── Avatar Dropdown ── */}
            <div className="relative pl-3 border-l border-slate-200/60" ref={avatarRef}>
              <button
                type="button"
                onClick={() => {
                  setAvatarOpen((v) => !v);
                  setNotifOpen(false);
                }}
                className="flex items-center gap-2.5 rounded-lg hover:bg-slate-50 px-2 py-1 transition-colors cursor-pointer"
              >
                {/* Avatar Icon */}
                <div className="w-8 h-8 rounded-full bg-[#001743] flex items-center justify-center shrink-0 overflow-hidden border border-slate-200">
                  {user?.avatarImg && !user.avatarImg.includes("trustsim.vn") ? (
                    <img
                      src={user.avatarImg}
                      alt={displayName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-white text-[11px] font-bold tracking-wide select-none">
                      {initials}
                    </span>
                  )}
                </div>
                <div className="hidden md:block text-left leading-none">
                  <div className="text-xs font-bold text-[#001743] truncate max-w-[120px]">
                    {displayName}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5 truncate max-w-[120px]">
                    {user?.email || "admin@trustsim.vn"}
                  </div>
                </div>
                <ChevronDown
                  size={13}
                  className={`hidden md:block text-slate-400 transition-transform duration-200 ${
                    avatarOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {/* Avatar Dropdown Panel */}
              {avatarOpen && (
                <div className="absolute right-0 top-full mt-2 w-[260px] bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                  {/* User info header */}
                  <div className="px-4 py-3.5 border-b border-slate-100 bg-gradient-to-br from-[#001743] to-[#002566] text-white">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center overflow-hidden shrink-0">
                        {user?.avatarImg && !user.avatarImg.includes("trustsim.vn") ? (
                          <img
                            src={user.avatarImg}
                            alt={displayName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-white text-sm font-bold">{initials}</span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold truncate">{displayName}</div>
                        <div className="text-[10px] text-white/70 truncate mt-0.5">
                          {user?.email || "admin@trustsim.vn"}
                        </div>
                        <span className="inline-flex items-center gap-1 mt-1.5 px-1.5 py-0.5 bg-white/15 rounded text-[9px] text-white/90 font-bold uppercase tracking-wider">
                          <Shield size={9} />
                          {user?.role || "ADMINISTRATOR"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Wallet overview banner */}
                  <div className="px-3.5 py-2.5 mx-2.5 my-2 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-slate-500 font-semibold uppercase">Số dư ví sàn</div>
                      <div className="text-xs font-extrabold text-[#E4011E] font-mono mt-0.5">
                        {availableBalance.toLocaleString("vi-VN")} ₫
                      </div>
                    </div>
                    <Link
                      href="/profile?tab=transactions"
                      onClick={() => setAvatarOpen(false)}
                      className="text-[11px] font-bold text-[#001743] hover:underline"
                    >
                      Chi tiết →
                    </Link>
                  </div>

                  {/* Menu items */}
                  <div className="p-1.5 space-y-0.5">
                    <Link
                      href="/profile"
                      onClick={() => setAvatarOpen(false)}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <User size={14} className="text-slate-400" />
                      Hồ sơ cá nhân
                    </Link>
                    <Link
                      href="/auctions"
                      onClick={() => setAvatarOpen(false)}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <Gavel size={14} className="text-slate-400" />
                      Sàn đấu giá công khai
                    </Link>
                    <Link
                      href="/admin?tab=settings"
                      onClick={() => setAvatarOpen(false)}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <Settings size={14} className="text-slate-400" />
                      Cài đặt hệ thống
                    </Link>
                  </div>

                  <div className="p-1.5 border-t border-slate-100">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-rose-600 hover:bg-rose-50 transition-colors text-left font-bold cursor-pointer"
                    >
                      <LogOut size={14} />
                      Đăng xuất
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content View */}
        <main className="admin-content flex-1 px-3 py-4 sm:px-5 sm:py-5 lg:px-7 lg:py-7 max-w-[1680px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center text-xs text-slate-500">
          Đang tải giao diện quản trị…
        </div>
      }
    >
      <AuthSessionGuard>
        <ConfigProvider
          locale={viVN}
          theme={{
            token: {
              colorPrimary: "#001743",
              colorInfo: "#2563EB",
              colorSuccess: "#15803D",
              colorWarning: "#B45309",
              colorError: "#C5162E",
              colorText: "#344054",
              colorTextHeading: "#001743",
              colorTextSecondary: "#667085",
              colorBorder: "#D0D5DD",
              colorBorderSecondary: "#E4E7EC",
              colorBgLayout: "#F6F8FB",
              colorBgContainer: "#FFFFFF",
              borderRadius: 8,
              controlHeight: 40,
              fontFamily: "var(--font-inter), Inter, sans-serif",
              fontSize: 13,
              motionDurationFast: "0.12s",
              motionDurationMid: "0.18s",
            },
            components: {
              Table: {
                headerBg: "#F8FAFC",
                headerColor: "#475467",
                borderColor: "#E4E7EC",
                rowHoverBg: "#F8FAFC",
                cellPaddingBlockSM: 11,
                cellPaddingInlineSM: 14,
              },
              Button: { fontWeight: 600, primaryShadow: "none" },
              Drawer: { paddingLG: 20 },
              Form: { itemMarginBottom: 16, labelColor: "#344054" },
              Pagination: { itemActiveBg: "#001743" },
              Tabs: { itemColor: "#667085", itemSelectedColor: "#001743", inkBarColor: "#E4011E" },
            },
          }}
        >
          <AntApp>
            <AdminLayoutInner>{children}</AdminLayoutInner>
          </AntApp>
        </ConfigProvider>
      </AuthSessionGuard>
    </Suspense>
  );
}
