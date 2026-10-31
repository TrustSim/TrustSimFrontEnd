"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthResponseDto, UserProfileDto } from "@/types/auth";
import { ToastMessage } from "@/components/ui/Toast";
import { ProfileTab } from "../../types/types";
import { walletService } from "@/services/walletService";
import { tradeService } from "@/services/tradeService";
import { getMySims, formatPhoneNumber } from "@/services/simService";
import {
  Wallet,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  Plus,
  Gavel,
  FileText,
  Smartphone,
  Sparkles,
  ChevronRight,
  RefreshCw,
  AlertTriangle,
  Check,
  CreditCard,
  History,
} from "lucide-react";

interface OverviewTabProps {
  user: AuthResponseDto | null;
  profile: UserProfileDto | null;
  walletBalance: number;
  isEkycVerified: boolean;
  onNavigateTab: (tab: ProfileTab) => void;
  addToast: (t: Omit<ToastMessage, "id">) => void;
}

interface ActivityItem {
  id: string;
  tradeId?: string;
  type: "TRANSACTION" | "TRADE";
  title: string;
  subtitle: string;
  time: string;
  rawDate: number;
  tag: string;
  tagColor: { bg: string; text: string; border: string };
  amount?: string;
  isPositive?: boolean;
}

function formatBigCurrency(val: number) {
  const formatted = (val || 0).toLocaleString("vi-VN");
  let compactSummary = "";
  if (val >= 1_000_000_000_000) {
    compactSummary = `~${(val / 1_000_000_000_000).toLocaleString("vi-VN", { maximumFractionDigits: 2 })} nghìn tỷ ₫`;
  } else if (val >= 1_000_000_000) {
    compactSummary = `~${(val / 1_000_000_000).toLocaleString("vi-VN", { maximumFractionDigits: 2 })} tỷ ₫`;
  } else if (val >= 1_000_000) {
    compactSummary = `~${(val / 1_000_000).toLocaleString("vi-VN", { maximumFractionDigits: 1 })} triệu ₫`;
  }

  let sizeClass = "text-2xl";
  if (formatted.length > 15) {
    sizeClass = "text-base sm:text-lg";
  } else if (formatted.length > 11) {
    sizeClass = "text-lg sm:text-xl";
  } else if (formatted.length > 8) {
    sizeClass = "text-xl sm:text-2xl";
  }

  return { formatted, compactSummary, sizeClass };
}

export default function OverviewTab({
  user,
  profile,
  walletBalance,
  isEkycVerified,
  onNavigateTab,
  addToast,
}: OverviewTabProps) {
  const router = useRouter();
  const [stats, setStats] = useState({
    ownedSimsCount: 0,
    tradesCount: 0,
    activeTradesCount: 0,
    transactionsCount: 0,
  });
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Load real data from DB
  const loadDashboardData = useCallback(async () => {
    try {
      const [simsRes, tradesRes, txRes] = await Promise.allSettled([
        getMySims({ pageIndex: 1, pageSize: 5 }),
        tradeService.getMyTrades({ pageIndex: 1, pageSize: 10 }),
        walletService.getTransactions({ pageIndex: 1, pageSize: 10 }),
      ]);

      let ownedSims = 0;
      if (simsRes.status === "fulfilled" && simsRes.value) {
        ownedSims = simsRes.value.totalCount || simsRes.value.items?.length || 0;
      }

      let totalTrades = 0;
      let activeTrades = 0;
      const tradeItems =
        tradesRes.status === "fulfilled" && tradesRes.value?.items
          ? tradesRes.value.items
          : [];
      if (tradesRes.status === "fulfilled" && tradesRes.value) {
        totalTrades = tradesRes.value.totalCount || tradeItems.length;
        activeTrades = tradeItems.filter(
          (t) =>
            t.status === "PendingEscrow" ||
            t.status === "PendingSignature" ||
            t.status === "PendingTransfer"
        ).length;
      }

      let txCount = 0;
      const txItems =
        txRes.status === "fulfilled" && txRes.value?.items ? txRes.value.items : [];
      if (txRes.status === "fulfilled" && txRes.value) {
        txCount = txRes.value.totalCount || txItems.length;
      }

      setStats({
        ownedSimsCount: ownedSims,
        tradesCount: totalTrades,
        activeTradesCount: activeTrades,
        transactionsCount: txCount,
      });

      // Construct Unified Real Activity Feed
      const feed: ActivityItem[] = [];

      txItems.forEach((tx) => {
        const txType = (tx as any).type || (tx as any).walletTransactionType || "";
        const isDeposit = txType === "DEPOSIT" || txType === "TOP_UP" || txType === 0;
        const txDate = tx.createdAt || (tx as any).createdDate || new Date().toISOString();
        const formattedDate = new Date(txDate).toLocaleDateString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
          day: "2-digit",
          month: "2-digit",
        });

        let tagText = "Thành công";
        let tagColor = { bg: "#F0FDF4", text: "#16A34A", border: "#BBF7D0" };
        const txStatus = (tx as any).status || (tx as any).transactionStatus;
        if (txStatus === "PENDING" || txStatus === 0) {
          tagText = "Đang xử lý";
          tagColor = { bg: "#FFFBEB", text: "#D97706", border: "#FDE68A" };
        } else if (txStatus === "FAILED" || txStatus === 2) {
          tagText = "Thất bại";
          tagColor = { bg: "#FEF2F2", text: "#DC2626", border: "#FECACA" };
        }

        feed.push({
          id: `tx-${tx.id}`,
          type: "TRANSACTION",
          title: isDeposit
            ? `Nạp tiền ví VietQR #${tx.transactionCode}`
            : `Rút tiền ví về ngân hàng #${tx.transactionCode}`,
          subtitle: tx.description || (isDeposit ? "Nạp tiền tự động SePay" : "Rút tiền về tài khoản ngân hàng"),
          time: formattedDate,
          rawDate: new Date(txDate).getTime(),
          tag: tagText,
          tagColor,
          amount: `${isDeposit ? "+" : "-"}${tx.amount.toLocaleString("vi-VN")} ₫`,
          isPositive: isDeposit,
        });
      });

      tradeItems.forEach((tr) => {
        const formattedDate = new Date(tr.createdDate).toLocaleDateString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
          day: "2-digit",
          month: "2-digit",
        });

        let tagText = "Đang giao dịch";
        let tagColor = { bg: "#EFF6FF", text: "#2563EB", border: "#BFDBFE" };
        if (tr.status === "Completed") {
          tagText = "Hoàn tất";
          tagColor = { bg: "#F0FDF4", text: "#16A34A", border: "#BBF7D0" };
        } else if (tr.status.startsWith("Cancelled") || tr.status === "Disputed") {
          tagText = "Đã hủy/Tranh chấp";
          tagColor = { bg: "#FEF2F2", text: "#DC2626", border: "#FECACA" };
        }

        feed.push({
          id: `tr-${tr.id}`,
          tradeId: tr.id,
          type: "TRADE",
          title: `Hợp đồng chuyển nhượng #${tr.tradeTransactionCode}`,
          subtitle: `SIM: ${formatPhoneNumber(tr.simPhoneNumber)}${
            tr.sellerName ? ` · Bên bán: ${tr.sellerName}` : ""
          }`,
          time: formattedDate,
          rawDate: new Date(tr.createdDate).getTime(),
          tag: tagText,
          tagColor,
          amount: `${tr.escrowAmount.toLocaleString("vi-VN")} ₫`,
          isPositive: false,
        });
      });

      feed.sort((a, b) => b.rawDate - a.rawDate);
      setActivities(feed.slice(0, 6));
    } catch {
      // Silently catch errors
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const handleManualRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    addToast({
      type: "success",
      title: "Đã làm mới",
      message: "Dữ liệu tổng quan tài khoản đã được đồng bộ mới nhất.",
    });
  };

  const steps = [
    {
      title: "Khởi tạo tài khoản TrustSim",
      desc: "Đã hoàn tất thiết lập hồ sơ thành viên và bảo mật hệ thống.",
      done: true,
      current: false,
    },
    {
      title: "Định danh điện tử CCCD (eKYC)",
      desc: isEkycVerified
        ? "Đã đối soát căn cước công dân 2 mặt và khuôn mặt sinh trắc học thành công."
        : "Chụp ảnh CCCD 2 mặt và quét khuôn mặt để mở khóa toàn bộ quyền chuyển nhượng & đấu giá.",
      done: isEkycVerified,
      current: !isEkycVerified,
    },
  ];

  return (
    <div className="flex flex-col gap-3.5">
      {/* ── Top Bar with Sync Action ── */}
      <div className="flex items-center justify-between pb-1 border-b border-slate-100">
        <span className="text-xs font-bold text-[#001743]">
          Tổng quan tài khoản & hoạt động
        </span>

        <button
          type="button"
          onClick={handleManualRefresh}
          disabled={refreshing}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-slate-200 bg-white hover:bg-slate-50 px-3 py-1 text-[11px] font-bold text-[#001743] shadow-2xs transition-colors disabled:opacity-60 active:scale-95"
          title="Làm mới dữ liệu từ máy chủ"
        >
          <RefreshCw
            size={11}
            className={`text-[#4C5FD5] ${refreshing ? "animate-spin" : ""}`}
          />
          <span>{refreshing ? "Đang đồng bộ..." : "Đồng bộ dữ liệu"}</span>
        </button>
      </div>

      {/* ── 4 KPI Stats Cards: Soft-Cloud Navy Compact ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        {/* Stat 1: Wallet Balance */}
        {(() => {
          const { formatted, compactSummary, sizeClass } = formatBigCurrency(walletBalance);
          return (
            <div
              onClick={() => onNavigateTab("transactions")}
              className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-3 shadow-2xs flex justify-between items-start gap-2.5 cursor-pointer hover:bg-white hover:border-[#001743]/30 transition-all group overflow-hidden"
              title={`Số dư khả dụng: ${walletBalance.toLocaleString("vi-VN")} ₫`}
            >
              <div className="min-w-0 flex-1 overflow-hidden">
                <span className="text-[11px] text-slate-500 font-semibold block mb-0.5">
                  Số dư khả dụng
                </span>
                <div className={`${sizeClass} font-bold text-[#001743] font-mono tabular-nums leading-tight truncate`}>
                  {formatted}{" "}
                  <span className="text-xs font-semibold text-slate-500">₫</span>
                </div>
                {compactSummary ? (
                  <div className="text-[10px] font-bold text-indigo-600 font-mono mt-0.5 truncate">
                    {compactSummary}
                  </div>
                ) : null}
                <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1 font-medium">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                  Bảo chứng ví 100%
                </div>
              </div>
              <div className="h-8 w-8 rounded-xl bg-white border border-slate-200/70 text-[#001743] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-2xs">
                <Wallet size={15} />
              </div>
            </div>
          );
        })()}

        {/* Stat 2: Owned SIMs */}
        <div
          onClick={() => onNavigateTab("auctions")}
          className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-3 shadow-2xs flex justify-between items-start gap-2.5 cursor-pointer hover:bg-white hover:border-[#001743]/30 transition-all group overflow-hidden"
        >
          <div className="min-w-0 flex-1 overflow-hidden">
            <span className="text-[11px] text-slate-500 font-semibold block mb-0.5">
              Kho SIM sở hữu
            </span>
            <div className="text-lg font-bold text-[#001743] font-mono tabular-nums leading-none truncate mt-0.5">
              {loading ? "..." : `${stats.ownedSimsCount} SIM`}
            </div>
            <div className="text-[10px] text-slate-400 mt-1 font-medium truncate">
              {stats.ownedSimsCount > 0 ? "Sẵn sàng niêm yết đấu giá" : "Chưa nhập số vào kho"}
            </div>
          </div>
          <div className="h-8 w-8 rounded-xl bg-white border border-slate-200/70 text-[#2563EB] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-2xs">
            <Smartphone size={15} />
          </div>
        </div>

        {/* Stat 3: Transfer Contracts */}
        <div
          onClick={() => onNavigateTab("contracts")}
          className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-3 shadow-2xs flex justify-between items-start gap-2.5 cursor-pointer hover:bg-white hover:border-[#001743]/30 transition-all group overflow-hidden"
        >
          <div className="min-w-0 flex-1 overflow-hidden">
            <span className="text-[11px] text-slate-500 font-semibold block mb-0.5">
              Hợp đồng chuyển nhượng
            </span>
            <div className="text-lg font-bold text-[#001743] font-mono tabular-nums leading-none truncate mt-0.5">
              {loading ? "..." : `${stats.tradesCount} HĐ`}
            </div>
            <div className="text-[10px] text-slate-400 mt-1 font-medium truncate">
              {stats.activeTradesCount > 0
                ? `${stats.activeTradesCount} HĐ đang xử lý`
                : "Bảo đảm ký quỹ 100%"}
            </div>
          </div>
          <div className="h-8 w-8 rounded-xl bg-white border border-slate-200/70 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-2xs">
            <FileText size={15} />
          </div>
        </div>

        {/* Stat 4: Transactions */}
        <div
          onClick={() => onNavigateTab("transactions")}
          className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-3 shadow-2xs flex justify-between items-start gap-2.5 cursor-pointer hover:bg-white hover:border-[#001743]/30 transition-all group overflow-hidden"
        >
          <div className="min-w-0 flex-1 overflow-hidden">
            <span className="text-[11px] text-slate-500 font-semibold block mb-0.5">
              Biến động ví
            </span>
            <div className="text-lg font-bold text-[#001743] font-mono tabular-nums leading-none truncate mt-0.5">
              {loading ? "..." : `${stats.transactionsCount} GD`}
            </div>
            <div className="text-[10px] text-slate-400 mt-1 font-medium truncate">
              Nạp/rút &amp; ký quỹ tự động
            </div>
          </div>
          <div className="h-8 w-8 rounded-xl bg-white border border-slate-200/70 text-purple-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-2xs">
            <ArrowUpRight size={15} />
          </div>
        </div>
      </div>

      {/* ── Quick Action Shortcuts (Compact) ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <Link
          href="/auctions"
          className="flex items-center gap-2.5 p-2.5 bg-slate-50/70 border border-slate-200/70 hover:bg-white hover:border-[#001743]/30 rounded-xl shadow-2xs transition-all active:scale-98 group"
        >
          <div className="h-7 w-7 rounded-lg bg-white border border-slate-200 group-hover:bg-[#001743] text-slate-700 group-hover:text-white flex items-center justify-center shrink-0 transition-colors">
            <Gavel size={13} />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-[#001743] truncate">Phòng đấu giá</div>
            <div className="text-[10px] text-slate-400 truncate">Tham gia trả giá</div>
          </div>
        </Link>

        <button
          type="button"
          onClick={() => onNavigateTab("auctions")}
          className="flex items-center gap-2.5 p-2.5 bg-slate-50/70 border border-slate-200/70 hover:bg-white hover:border-[#001743]/30 rounded-xl shadow-2xs transition-all active:scale-98 group text-left cursor-pointer"
        >
          <div className="h-7 w-7 rounded-lg bg-white border border-slate-200 group-hover:bg-[#001743] text-slate-700 group-hover:text-white flex items-center justify-center shrink-0 transition-colors">
            <Plus size={13} />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-[#001743] truncate">Thêm SIM sở hữu</div>
            <div className="text-[10px] text-slate-400 truncate">Mở phiên đấu giá</div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onNavigateTab("contracts")}
          className="flex items-center gap-2.5 p-2.5 bg-slate-50/70 border border-slate-200/70 hover:bg-white hover:border-[#001743]/30 rounded-xl shadow-2xs transition-all active:scale-98 group text-left cursor-pointer"
        >
          <div className="h-7 w-7 rounded-lg bg-white border border-slate-200 group-hover:bg-[#001743] text-slate-700 group-hover:text-white flex items-center justify-center shrink-0 transition-colors">
            <FileText size={13} />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-[#001743] truncate">Hợp đồng ký quỹ</div>
            <div className="text-[10px] text-slate-400 truncate">Theo dõi sang tên</div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onNavigateTab("transactions")}
          className="flex items-center gap-2.5 p-2.5 bg-slate-50/70 border border-slate-200/70 hover:bg-white hover:border-[#001743]/30 rounded-xl shadow-2xs transition-all active:scale-98 group text-left cursor-pointer"
        >
          <div className="h-7 w-7 rounded-lg bg-white border border-slate-200 group-hover:bg-[#001743] text-slate-700 group-hover:text-white flex items-center justify-center shrink-0 transition-colors">
            <CreditCard size={13} />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-[#001743] truncate">Nạp tiền VietQR</div>
            <div className="text-[10px] text-slate-400 truncate">SePay tự động 24/7</div>
          </div>
        </button>
      </div>

      {/* ── 2-Column Grid: eKYC Stepper & Activity Timeline ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-stretch">
        {/* Left Card: 2-step eKYC progress (5 cols) */}
        <div className="lg:col-span-5 rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200/70">
              <div className="flex items-center gap-2">
                <span className={isEkycVerified ? "text-emerald-600" : "text-amber-600"}>
                  {isEkycVerified ? <CheckCircle2 size={16} /> : <ShieldCheck size={16} />}
                </span>
                <h4 className="text-xs font-bold text-[#001743] m-0">
                  Xác Thực Định Danh (eKYC)
                </h4>
              </div>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold border ${
                  isEkycVerified
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-amber-50 text-amber-700 border-amber-200"
                }`}
              >
                {isEkycVerified ? "Đã đối soát" : "Chờ hoàn tất"}
              </span>
            </div>

            <div className="flex flex-col gap-2.5">
              {steps.map((step, idx) => (
                <div key={idx} className="flex gap-2.5 items-start">
                  <div
                    className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0 mt-0.5 ${
                      step.done
                        ? "bg-emerald-600"
                        : step.current
                        ? "bg-[#001743]"
                        : "bg-slate-300"
                    }`}
                  >
                    {step.done ? <Check size={11} strokeWidth={2.5} /> : idx + 1}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div
                      className={`text-[11px] font-bold ${
                        step.done || step.current ? "text-[#001743]" : "text-slate-400"
                      }`}
                    >
                      {step.title}
                    </div>
                    <div className="text-[10.5px] text-slate-500 mt-0.5 leading-relaxed line-clamp-2">
                      {step.desc}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-200/70">
            {!isEkycVerified ? (
              <button
                type="button"
                onClick={() => onNavigateTab("ekyc")}
                className="w-full inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-full bg-[#001743] hover:bg-[#0A2558] py-2 px-3 text-xs font-bold text-white shadow-xs transition-transform active:scale-98"
              >
                <ShieldCheck size={14} />
                <span>Tiến hành xác thực eKYC ngay</span>
                <ChevronRight size={13} />
              </button>
            ) : (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 px-3 py-2 flex items-center justify-between">
                <div className="min-w-0">
                  <div className="text-[11px] font-bold text-emerald-800 flex items-center gap-1.5">
                    <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                    <span>Tài khoản chính chủ hợp lệ</span>
                  </div>
                  {profile?.identityNumber && (
                    <div className="text-[10px] text-emerald-700 font-mono mt-0.5">
                      CCCD: {profile.identityNumber}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => onNavigateTab("ekyc")}
                  className="text-xs font-bold text-emerald-700 hover:text-emerald-900 underline shrink-0 cursor-pointer"
                >
                  Chi tiết
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Card: Activity Feed (7 cols) */}
        <div className="lg:col-span-7 rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200/70">
              <div className="flex items-center gap-2">
                <History size={15} className="text-[#001743]" />
                <h4 className="text-xs font-bold text-[#001743] m-0">
                  Lịch Sử Hoạt Động Gần Đây
                </h4>
              </div>
              <button
                type="button"
                onClick={() => onNavigateTab("transactions")}
                className="text-[11px] font-bold text-[#001743] hover:underline cursor-pointer flex items-center gap-0.5"
              >
                <span>Xem tất cả</span>
                <ChevronRight size={12} />
              </button>
            </div>

            {loading ? (
              <div className="py-6 text-center text-xs text-slate-400">
                Đang tải nhật ký hoạt động…
              </div>
            ) : activities.length === 0 ? (
              <div className="py-6 text-center flex flex-col items-center justify-center">
                <div className="h-10 w-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 mb-2">
                  <History size={18} />
                </div>
                <div className="text-xs font-bold text-slate-700">
                  Chưa có hoạt động giao dịch nào
                </div>
                <p className="text-[11px] text-slate-400 max-w-xs mt-0.5 mb-2.5">
                  Các biến động ví, đặt cọc và ký hợp đồng sẽ hiển thị tại đây.
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => onNavigateTab("transactions")}
                    className="rounded-full px-3 py-1 text-xs font-bold text-white bg-[#001743] hover:bg-[#0A2558] transition-colors"
                  >
                    Nạp tiền ví
                  </button>
                  <Link
                    href="/auctions"
                    className="rounded-full px-3 py-1 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors"
                  >
                    Phòng đấu giá
                  </Link>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                {activities.slice(0, 4).map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      if (item.type === "TRADE" && item.tradeId) {
                        router.push(`/trades/${item.tradeId}`);
                      } else if (item.type === "TRADE") {
                        onNavigateTab("contracts");
                      } else {
                        onNavigateTab("transactions");
                      }
                    }}
                    className="flex items-center justify-between p-2 rounded-xl bg-white hover:bg-slate-100/80 transition-all cursor-pointer group border border-slate-200/70"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="h-7 w-7 rounded-lg bg-slate-50 border border-slate-200 text-[#001743] flex items-center justify-center shrink-0">
                        {item.type === "TRADE" ? (
                          <FileText size={13} className="text-[#2563EB]" />
                        ) : item.isPositive ? (
                          <Plus size={13} className="text-emerald-600" />
                        ) : (
                          <ArrowUpRight size={13} className="text-slate-600" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="text-xs font-bold text-[#001743] truncate">
                          {item.title}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate">
                          {item.subtitle} · {item.time}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0 ml-2">
                      {item.amount && (
                        <div
                          className={`text-xs font-bold font-mono tabular-nums ${
                            item.isPositive ? "text-emerald-600" : "text-[#001743]"
                          }`}
                        >
                          {item.amount}
                        </div>
                      )}
                      <span
                        style={{
                          backgroundColor: item.tagColor.bg,
                          color: item.tagColor.text,
                          borderColor: item.tagColor.border,
                        }}
                        className="inline-block text-[9px] font-bold px-1.5 py-0.2 rounded-full border mt-0.5"
                      >
                        {item.tag}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
