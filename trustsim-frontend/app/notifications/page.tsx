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
  ShieldCheck,
  ExternalLink,
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
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");

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
    [pageIndex, statusFilter]
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

  // Filtered by Search & Category
  const displayedNotifications = useMemo(() => {
    return notifications.filter((n) => {
      // Category filter
      if (categoryFilter !== "all") {
        const meta = getNotificationVisualMeta(n.notificationType);
        if (meta.category !== categoryFilter) return false;
      }
      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchTitle = n.title?.toLowerCase().includes(query);
        const matchContent = n.content?.toLowerCase().includes(query);
        return matchTitle || matchContent;
      }
      return true;
    });
  }, [notifications, categoryFilter, searchQuery]);

  return (
    <div className="min-h-screen bg-[#F1F5F9] text-slate-900 flex flex-col">
      <Navbar />

      <main className="flex-1 pt-24 pb-16">
        <div className="max-w-[1180px] mx-auto px-4 sm:px-6 space-y-6">
          {/* Breadcrumb & Realtime Status */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <Link href="/" className="hover:text-[#001743] transition-colors">
                Trang chủ
              </Link>
              <span className="text-slate-300">/</span>
              <span className="text-[#001743] font-semibold">Hòm thư &amp; Thông báo</span>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200/60 px-2.5 py-1 rounded-lg">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Trực tuyến (SignalR)</span>
              </div>
              <button
                type="button"
                onClick={() => fetchNotifications(true)}
                disabled={refreshing}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-all shadow-xs cursor-pointer disabled:opacity-60"
              >
                <RefreshCw size={13} className={refreshing ? "animate-spin" : ""} />
                <span>Làm mới</span>
              </button>
            </div>
          </div>

          {!isLoggedIn ? (
            /* Unauthenticated View */
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center max-w-lg mx-auto shadow-sm space-y-4">
              <div className="w-14 h-14 bg-slate-100 text-[#001743] rounded-2xl flex items-center justify-center mx-auto border border-slate-200">
                <Lock size={24} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-[#001743]">Vui lòng đăng nhập</h2>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Đăng nhập vào tài khoản TrustSim để xem các thông báo trúng đấu giá, hoàn cọc và hợp đồng của bạn.
                </p>
              </div>
              <Link
                href="/login?redirect=/notifications"
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#001743] hover:bg-[#00266B] text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
              >
                <span>Đăng nhập ngay</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          ) : (
            <>
              {/* Header Showcase Banner */}
              <div className="bg-[#001743] rounded-2xl border border-[#0D2847] p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none" />
                <div
                  className="absolute -right-20 -top-20 w-[300px] h-[300px] rounded-full opacity-[0.06]"
                  style={{ background: "radial-gradient(circle, #E4011E, transparent 70%)" }}
                />

                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-white/10 text-white flex items-center justify-center border border-white/15">
                        <Bell size={20} />
                      </div>
                      <div>
                        <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                          Trung Tâm Thông Báo
                        </h1>
                        <p className="text-xs text-slate-300">
                          Giao dịch đấu giá, bảo chứng ký quỹ và tiến độ sang tên chính chủ
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Quick Action Buttons */}
                  <div className="flex items-center gap-3">
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={handleMarkAllRead}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 border border-white/20 text-xs font-bold text-white transition-all cursor-pointer shadow-xs"
                      >
                        <CheckCheck size={16} />
                        <span>Đánh dấu đã đọc ({unreadCount})</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Stats Counters */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-6 mt-6 border-t border-white/10 relative z-10">
                  <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                    <span className="text-[11px] font-medium text-slate-400 block">Tổng thông báo</span>
                    <span className="text-xl font-mono font-black text-white tabular-nums mt-0.5 block">
                      {totalCount}
                    </span>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                    <span className="text-[11px] font-medium text-slate-400 block">Chưa đọc</span>
                    <span className="text-xl font-mono font-black text-rose-400 tabular-nums mt-0.5 block">
                      {unreadCount}
                    </span>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-3 col-span-2 sm:col-span-1">
                    <span className="text-[11px] font-medium text-slate-400 block">Đã xử lý</span>
                    <span className="text-xl font-mono font-black text-emerald-400 tabular-nums mt-0.5 block">
                      {Math.max(0, totalCount - unreadCount)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Filter Toolbar */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-4">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Status Tabs */}
                  <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl text-xs font-semibold self-start">
                    {[
                      { key: "all", label: `Tất cả (${totalCount})` },
                      { key: "unread", label: `Chưa đọc (${unreadCount})` },
                      { key: "read", label: "Đã đọc" },
                    ].map((tab) => (
                      <button
                        key={tab.key}
                        type="button"
                        onClick={() => {
                          setStatusFilter(tab.key as StatusFilter);
                          setPageIndex(1);
                        }}
                        className={`py-1.5 px-3.5 rounded-lg transition-all cursor-pointer ${
                          statusFilter === tab.key
                            ? "bg-white text-[#001743] font-bold shadow-xs"
                            : "text-slate-500 hover:text-slate-800"
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* Search Input */}
                  <div className="relative flex-1 max-w-md">
                    <Search
                      size={15}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Tìm theo tiêu đề hoặc nội dung thông báo..."
                      className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-[#001743] focus:bg-white focus:ring-2 focus:ring-[#001743]/10 transition-all placeholder:text-slate-400"
                    />
                  </div>
                </div>

                {/* Category Pills */}
                <div className="flex items-center gap-2 overflow-x-auto pt-2 border-t border-slate-100 no-scrollbar">
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
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer border ${
                          isSelected
                            ? "bg-[#001743] text-white border-[#001743] shadow-xs"
                            : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:border-slate-300"
                        }`}
                      >
                        <span>{cat.icon}</span>
                        <span>{cat.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Notifications Cards Feed */}
              <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
                {loading ? (
                  <div className="py-20 text-center text-slate-400 space-y-3">
                    <div className="w-7 h-7 border-2 border-slate-200 border-t-[#001743] rounded-full animate-spin mx-auto" />
                    <p className="text-xs font-medium">Đang tải danh sách thông báo...</p>
                  </div>
                ) : displayedNotifications.length === 0 ? (
                  <div className="py-24 px-6 text-center space-y-3">
                    <div className="w-14 h-14 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center mx-auto border border-slate-200">
                      <Inbox size={26} />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-sm font-bold text-[#001743]">Không tìm thấy thông báo nào</h3>
                      <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                        {statusFilter === "unread"
                          ? "Bạn đã đọc hết mọi thông báo trong hòm thư."
                          : searchQuery
                          ? "Không có thông báo nào khớp với từ khóa tìm kiếm."
                          : "Khi bạn tham gia đấu giá hoặc thực hiện giao dịch ví, thông báo sẽ hiển thị ở đây."}
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
                              ? "bg-rose-50/15 hover:bg-rose-50/30"
                              : "hover:bg-slate-50/80"
                          }`}
                        >
                          <div className="flex items-start gap-3.5 min-w-0 flex-1">
                            {/* Icon */}
                            <div
                              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border mt-0.5 ${meta.iconBg}`}
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
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${meta.badgeBg} ${meta.badgeText} ${meta.badgeBorder}`}
                                >
                                  {meta.label}
                                </span>
                                {!n.isRead && (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-50 text-rose-600 border border-rose-200">
                                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                                    Chưa đọc
                                  </span>
                                )}
                                <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1 ml-auto sm:ml-0">
                                  <Clock size={12} />
                                  <span>{formatRelativeTime(n.createdDate)}</span>
                                </span>
                              </div>

                              <h4
                                className={`text-sm ${
                                  !n.isRead ? "font-bold text-[#001743]" : "font-semibold text-slate-800"
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
                                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                              >
                                <Check size={16} />
                              </button>
                            )}

                            {n.actionUrl && (
                              <Link
                                href={n.actionUrl}
                                onClick={() => handleMarkSingleRead(n.id)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#001743] hover:bg-[#00266B] text-white text-xs font-bold rounded-lg transition-colors shadow-xs"
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
                        className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setPageIndex((p) => Math.min(totalPages, p + 1))}
                        disabled={pageIndex >= totalPages}
                        className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                      >
                        <ChevronRight size={16} />
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
