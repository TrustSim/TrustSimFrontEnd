"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { authService } from "@/services/authService";
import { AuthResponseDto } from "@/types/auth";
import {
  getMyNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  getNotificationVisualMeta,
  NotificationItemDto,
} from "@/services/notificationService";
import { notificationHubService } from "@/services/notificationHubService";
import {
  Bell,
  CheckCheck,
  Check,
  Search,
  RefreshCw,
  Clock,
  Gavel,
  Wallet as WalletIcon,
  FileText,
  Sparkles,
  ArrowRight,
  Inbox,
  Filter,
  ChevronLeft,
  ChevronRight,
  Lock,
} from "lucide-react";

/* ─── Helpers ────────────────────────────────────────────── */
function formatRelativeTime(dateStr: string): string {
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
    return d.toLocaleDateString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

type CategoryFilter = "all" | "auction" | "wallet" | "contract" | "system";
type StatusFilter = "all" | "unread" | "read";

export default function NotificationsPage() {
  const [currentUser, setCurrentUser] = useState<AuthResponseDto | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const [notifications, setNotifications] = useState<NotificationItemDto[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [pageIndex, setPageIndex] = useState(1);
  const pageSize = 15;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
      setPageIndex(1);
    }, 350);
    return () => window.clearTimeout(timer);
  }, [searchQuery]);

  // Sync Auth
  useEffect(() => {
    const syncAuth = () => {
      const user = authService.getUser();
      setCurrentUser(user);
      setIsLoggedIn(Boolean(user && user.userId));
    };
    syncAuth();
    window.addEventListener("trustsim_auth_change", syncAuth);
    window.addEventListener("storage", syncAuth);
    return () => {
      window.removeEventListener("trustsim_auth_change", syncAuth);
      window.removeEventListener("storage", syncAuth);
    };
  }, []);

  // Fetch Notifications
  const fetchNotifications = useCallback(
    async (isBackground = false) => {
      if (!authService.isAuthenticated()) {
        setLoading(false);
        return;
      }

      if (!isBackground) setLoading(true);
      else setRefreshing(true);

      try {
        const isReadParam =
          statusFilter === "unread"
            ? false
            : statusFilter === "read"
            ? true
            : undefined;

        const [res, unread] = await Promise.all([
          getMyNotifications({
            isRead: isReadParam,
            keyword: debouncedSearch || undefined,
            pageIndex,
            pageSize,
          }),
          getUnreadNotificationCount().catch(() => 0),
        ]);

        setNotifications(res.items || []);
        setTotalCount(res.totalCount || 0);
        setTotalPages(res.totalPages || 1);
        setUnreadCount(unread);
      } catch (err) {
        console.error("Lỗi khi tải thông báo:", err);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [pageIndex, statusFilter, debouncedSearch]
  );

  useEffect(() => {
    fetchNotifications(false);
  }, [fetchNotifications]);

  // Real-time Push Listener
  useEffect(() => {
    if (!authService.isAuthenticated()) return;

    const unsubNotif = notificationHubService.subscribeNotification((newNotif) => {
      setNotifications((prev) => [newNotif, ...prev.filter((n) => n.id !== newNotif.id)]);
      setUnreadCount((prev) => prev + 1);
      setTotalCount((prev) => prev + 1);
    });

    const unsubCount = notificationHubService.subscribeUnreadCount((count) => {
      setUnreadCount(count);
    });

    return () => {
      unsubNotif();
      unsubCount();
    };
  }, []);

  // Mark All Read
  const handleMarkAllRead = async () => {
    const unreadItems = notifications.filter((n) => !n.isRead);
    if (unreadItems.length === 0) return;

    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);

    await Promise.allSettled(unreadItems.map((n) => markNotificationAsRead(n.id)));
  };

  // Mark Single Read
  const handleMarkSingleRead = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
    await markNotificationAsRead(id).catch(() => {});
  };

  const displayedNotifications = useMemo(() => {
    return notifications.filter((n) => {
      if (categoryFilter !== "all") {
        const meta = getNotificationVisualMeta(n.notificationType);
        if (meta.category !== categoryFilter) return false;
      }
      return true;
    });
  }, [notifications, categoryFilter]);

  return (
    <div className="min-h-screen bg-[#F7F8FD] text-[#0B1630] flex flex-col font-sans pt-16">
      <Navbar />

      <main className="flex-1 py-8">
        <div className="mx-auto max-w-[1180px] px-3 sm:px-6 space-y-6">
          {/* Breadcrumb & Realtime Status */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <Link href="/" className="hover:text-[#001743] transition-colors">
                Trang chủ
              </Link>
              <span className="text-slate-300">/</span>
              <span className="text-[#001743] font-semibold">Trung tâm thông báo</span>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Trực tuyến (SignalR)</span>
              </div>
              <button
                type="button"
                onClick={() => fetchNotifications(true)}
                disabled={refreshing}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-[rgba(0,23,67,0.08)] bg-white px-3.5 py-1 text-xs font-semibold text-slate-700 shadow-xs transition-colors hover:bg-slate-50 disabled:opacity-60"
              >
                <RefreshCw size={12} className={refreshing ? "animate-spin text-[#4C5FD5]" : ""} />
                <span>Làm mới</span>
              </button>
            </div>
          </div>

          {!isLoggedIn ? (
            /* Unauthenticated View */
            <div className="mx-auto max-w-md rounded-[32px] border border-[rgba(0,23,67,0.08)] bg-white p-12 text-center shadow-[0_12px_40px_rgba(0,23,67,0.06)] space-y-4">
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#F1F3FF] text-[#001743]">
                <Lock size={26} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-[#001743]">Vui lòng đăng nhập</h2>
                <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                  Đăng nhập vào tài khoản TrustSim để theo dõi kết quả đấu giá, giải ngân ví và tiến độ hợp đồng của bạn.
                </p>
              </div>
              <Link
                href="/login?redirect=/notifications"
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-b from-[#0B2A6B] to-[#001743] px-6 py-2.5 text-xs font-bold text-white shadow-xs transition-transform hover:-translate-y-0.5"
              >
                <span>Đăng nhập ngay</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          ) : (
            <>
              {/* Header Showcase Banner: Soft-Cloud Navy */}
              <div className="relative overflow-hidden rounded-[32px] border border-white bg-gradient-to-b from-[#f1f3ff] via-[#e4e9ff] to-[#d3dbff] p-6 sm:p-8 shadow-[0_16px_50px_rgba(0,23,67,0.08)]">
                {/* Soft glow orbs */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute -top-20 -left-20 h-64 w-64 rounded-full bg-white/70 blur-3xl"
                />
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute top-10 -right-20 h-64 w-64 rounded-full bg-[#8c9cff]/30 blur-3xl"
                />

                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="space-y-1.5">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(0,23,67,0.08)] bg-white/85 px-3 py-1 text-xs font-bold text-[#001743] shadow-xs mb-1">
                      <Sparkles size={13} className="text-[#4C5FD5]" /> HÒM THƯ BẢO MẬT
                    </span>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#001743]">
                      Trung Tâm Thông Báo
                    </h1>
                    <p className="text-xs text-slate-600">
                      Giao dịch đấu giá, bảo chứng ký quỹ và tiến độ chuyển nhượng SIM chính chủ.
                    </p>
                  </div>

                  {/* Mark All As Read Button */}
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={handleMarkAllRead}
                      className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-gradient-to-b from-[#0B2A6B] to-[#001743] px-5 py-2.5 text-xs font-bold text-white shadow-[0_6px_16px_rgba(0,23,67,0.25)] transition-all hover:-translate-y-0.5 active:scale-95"
                    >
                      <CheckCheck size={16} />
                      <span>Đánh dấu đã đọc ({unreadCount})</span>
                    </button>
                  )}
                </div>

                {/* Metric Summary Cards */}
                <div className="relative z-10 grid grid-cols-2 sm:grid-cols-3 gap-3.5 pt-6 mt-6 border-t border-[rgba(0,23,67,0.08)]">
                  <div className="rounded-2xl border border-white/90 bg-white/80 p-3.5 shadow-xs backdrop-blur-sm">
                    <span className="text-[11px] font-bold text-slate-400 block uppercase tracking-wider">
                      Tổng thông báo
                    </span>
                    <span className="text-2xl font-mono font-bold text-[#001743] tabular-nums mt-0.5 block">
                      {totalCount}
                    </span>
                  </div>
                  <div className="rounded-2xl border border-white/90 bg-white/80 p-3.5 shadow-xs backdrop-blur-sm">
                    <span className="text-[11px] font-bold text-slate-400 block uppercase tracking-wider">
                      Chưa đọc
                    </span>
                    <span className="text-2xl font-mono font-bold text-[#0B2A6B] tabular-nums mt-0.5 block">
                      {unreadCount}
                    </span>
                  </div>
                  <div className="rounded-2xl border border-white/90 bg-white/80 p-3.5 shadow-xs backdrop-blur-sm col-span-2 sm:col-span-1">
                    <span className="text-[11px] font-bold text-slate-400 block uppercase tracking-wider">
                      Đã xử lý
                    </span>
                    <span className="text-2xl font-mono font-bold text-emerald-700 tabular-nums mt-0.5 block">
                      {Math.max(0, totalCount - unreadCount)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Filter Toolbar: Soft-Cloud Pill Tabs */}
              <div className="rounded-[24px] border border-[rgba(0,23,67,0.08)] bg-white p-4 shadow-xs space-y-3.5">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Status Pills */}
                  <div className="flex flex-wrap items-center gap-1 self-start">
                    {[
                      { key: "all", label: `Tất cả (${totalCount})` },
                      { key: "unread", label: `Chưa đọc (${unreadCount})` },
                      { key: "read", label: "Đã đọc" },
                    ].map((tab) => {
                      const isActive = statusFilter === tab.key;
                      return (
                        <button
                          key={tab.key}
                          type="button"
                          onClick={() => {
                            setStatusFilter(tab.key as StatusFilter);
                            setPageIndex(1);
                          }}
                          className={`cursor-pointer rounded-full px-4 py-1.5 text-xs font-semibold transition-all duration-150 ${
                            isActive
                              ? "bg-[#001743] text-white shadow-xs"
                              : "text-slate-600 hover:bg-slate-100"
                          }`}
                        >
                          {tab.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Search Input Pill */}
                  <div className="relative flex-1 max-w-md">
                    <Search
                      size={15}
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Tìm theo tiêu đề hoặc nội dung thông báo..."
                      className="h-[38px] w-full rounded-full border border-slate-200 bg-slate-50/80 pl-9 pr-4 text-xs font-medium text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-[#4C5FD5] focus:bg-white focus:ring-2 focus:ring-[#4C5FD5]/15"
                    />
                  </div>
                </div>

                {/* Category Pills */}
                <div className="flex items-center gap-2 overflow-x-auto pt-2.5 border-t border-slate-100 no-scrollbar">
                  {[
                    { key: "all", label: "Tất cả chuyên mục", icon: <Filter size={12} /> },
                    { key: "auction", label: "Đấu giá & Trả giá", icon: <Gavel size={12} /> },
                    { key: "wallet", label: "Ví & Ký quỹ", icon: <WalletIcon size={12} /> },
                    { key: "contract", label: "Hợp đồng & Sang tên", icon: <FileText size={12} /> },
                    { key: "system", label: "Hệ thống sàn", icon: <Sparkles size={12} /> },
                  ].map((cat) => {
                    const isSelected = categoryFilter === cat.key;
                    return (
                      <button
                        key={cat.key}
                        type="button"
                        onClick={() => setCategoryFilter(cat.key as CategoryFilter)}
                        className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap transition-all border ${
                          isSelected
                            ? "border-[#001743] bg-[#001743] text-white shadow-xs"
                            : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        <span>{cat.icon}</span>
                        <span>{cat.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Notification Cards List */}
              <div className="rounded-[24px] border border-[rgba(0,23,67,0.08)] bg-white shadow-xs overflow-hidden">
                {loading ? (
                  <div className="py-20 text-center text-slate-400 space-y-3">
                    <div className="mx-auto h-7 w-7 rounded-full border-2 border-slate-200 border-t-[#001743] animate-spin" />
                    <p className="text-xs font-medium">Đang tải danh sách thông báo...</p>
                  </div>
                ) : displayedNotifications.length === 0 ? (
                  <div className="py-24 px-6 text-center space-y-3">
                    <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#F1F3FF] text-slate-400">
                      <Inbox size={28} />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-base font-bold text-[#001743]">Không có thông báo nào</h3>
                      <p className="mx-auto max-w-sm text-xs text-slate-500 leading-relaxed">
                        {statusFilter === "unread"
                          ? "Bạn đã đọc hết mọi thông báo trong hòm thư."
                          : searchQuery
                          ? "Không có thông báo nào khớp với từ khóa tìm kiếm."
                          : "Khi bạn tham gia đấu giá hoặc thực hiện giao dịch, thông báo bảo chứng sẽ hiển thị ở đây."}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {displayedNotifications.map((n) => {
                      const meta = getNotificationVisualMeta(n.notificationType);
                      return (
                        <div
                          key={n.id}
                          className={`p-4 sm:p-5 transition-colors relative flex flex-col sm:flex-row sm:items-start justify-between gap-4 ${
                            !n.isRead
                              ? "bg-[#F4F7FF] hover:bg-[#EEF3FF]"
                              : "hover:bg-slate-50/80"
                          }`}
                        >
                          <div className="flex items-start gap-3.5 min-w-0 flex-1">
                            {/* Category Icon */}
                            <div
                              className={`h-10 w-10 rounded-2xl flex items-center justify-center shrink-0 border mt-0.5 ${meta.iconBg}`}
                            >
                              {meta.category === "auction" ? (
                                <Gavel size={18} />
                              ) : meta.category === "wallet" ? (
                                <WalletIcon size={18} />
                              ) : meta.category === "contract" ? (
                                <FileText size={18} />
                              ) : (
                                <Sparkles size={18} />
                              )}
                            </div>

                            {/* Details */}
                            <div className="space-y-1.5 min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span
                                  className={`rounded-full px-2.5 py-0.5 text-[10.5px] font-bold border ${meta.badgeBg} ${meta.badgeText} ${meta.badgeBorder}`}
                                >
                                  {meta.label}
                                </span>
                                {!n.isRead && (
                                  <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10.5px] font-bold text-[#0B2A6B]">
                                    <span className="h-1.5 w-1.5 rounded-full bg-[#4C5FD5] animate-pulse" />
                                    Mới
                                  </span>
                                )}
                                <span className="font-mono text-[11px] text-slate-400 flex items-center gap-1 ml-auto sm:ml-0">
                                  <Clock size={12} />
                                  <span>{formatRelativeTime(n.createdDate)}</span>
                                </span>
                              </div>

                              <h4
                                className={`text-sm ${
                                  !n.isRead
                                    ? "font-bold text-[#001743]"
                                    : "font-semibold text-slate-800"
                                }`}
                              >
                                {n.title}
                              </h4>

                              {n.content && (
                                <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
                                  {n.content}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-2 self-end sm:self-center shrink-0 pt-2 sm:pt-0">
                            {!n.isRead && (
                              <button
                                type="button"
                                onClick={(e) => handleMarkSingleRead(n.id, e)}
                                title="Đánh dấu đã đọc"
                                className="p-2 text-slate-400 hover:text-[#001743] hover:bg-white rounded-full border border-transparent hover:border-slate-200 transition-colors cursor-pointer"
                              >
                                <Check size={15} />
                              </button>
                            )}

                            {n.actionUrl && (
                              <Link
                                href={n.actionUrl}
                                onClick={() => handleMarkSingleRead(n.id)}
                                className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-b from-[#0B2A6B] to-[#001743] px-3.5 py-1.5 text-xs font-bold text-white shadow-xs transition-transform hover:-translate-y-0.5"
                              >
                                <span>Chi tiết</span>
                                <ArrowRight size={13} />
                              </Link>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Pagination Footer */}
                {totalPages > 1 && (
                  <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                    <span className="font-mono">
                      Trang <strong>{pageIndex}</strong> / {totalPages}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setPageIndex((p) => Math.max(1, p - 1))}
                        disabled={pageIndex <= 1}
                        className="rounded-full border border-slate-200 px-3 py-1.5 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer font-bold"
                      >
                        <ChevronLeft size={14} className="inline mr-1" />
                        Trước
                      </button>
                      <button
                        type="button"
                        onClick={() => setPageIndex((p) => Math.min(totalPages, p + 1))}
                        disabled={pageIndex >= totalPages}
                        className="rounded-full border border-slate-200 px-3 py-1.5 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer font-bold"
                      >
                        Sau
                        <ChevronRight size={14} className="inline ml-1" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
