/* Hallmark · genre: modern-minimal · style: Clean High-Trust Banking · macrostructure: Workbench · role: user-auction-escrow-portfolio */
"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  Gavel,
  Clock,
  ArrowRight,
  Search,
  Sparkles,
  ShieldCheck,
  RefreshCw,
  Wallet,
  ChevronRight,
  Plus,
  X,
  ShoppingBag,
  Tag,
  CheckCircle2,
  SlidersHorizontal,
  LayoutGrid,
  List,
  Lock,
  ArrowUpRight,
  TrendingUp,
  BadgeCheck,
  Building2,
  Calendar,
  Layers,
} from "lucide-react";
import { ToastMessage } from "@/components/ui/Toast";
import {
  auctionService,
  AuctionDto,
} from "@/services/auctionService";
import { formatPhoneNumber, getCarrierColor } from "@/services/simService";

interface BidsTabProps {
  addToast: (t: Omit<ToastMessage, "id">) => void;
  onNavigateTab?: (tab: any) => void;
}

type TabRole = "buyer" | "seller";
type StatusFilter = "ALL" | "ACTIVE" | "SCHEDULE" | "END";
type ViewMode = "cards" | "table";

/* ─── Currency Formatter ─────────────────────────────────────────────────── */
function formatVND(val?: number): string {
  if (val === undefined || val === null || isNaN(val)) return "0 ₫";
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(val);
}

/* ─── Date Formatter ─────────────────────────────────────────────────────── */
function formatDate(iso?: string): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return new Intl.DateTimeFormat("vi-VN", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(d);
  } catch {
    return iso;
  }
}

/* ─── Time Remaining Formatter with Precision ───────────────────────────── */
function formatRemaining(isoEnd?: string): { text: string; isEnded: boolean; urgent: boolean } {
  if (!isoEnd) return { text: "—", isEnded: false, urgent: false };
  const diff = new Date(isoEnd).getTime() - Date.now();
  if (diff <= 0) return { text: "Đã kết thúc", isEnded: true, urgent: false };

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const secs = Math.floor((diff % (1000 * 60)) / 1000);

  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return { text: `Còn ${days} ngày ${hours % 24}h`, isEnded: false, urgent: false };
  }
  return {
    text: `Còn ${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`,
    isEnded: false,
    urgent: hours < 2,
  };
}

/* ─── High-Trust Carrier Badge ───────────────────────────────────────────── */
function CarrierBadge({ carrier }: { carrier?: string }) {
  const name = carrier || "SIM";
  const color = getCarrierColor(name);

  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-slate-50 border border-slate-200/80 text-[11px] font-semibold text-slate-700 shadow-2xs">
      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
      <span>{name}</span>
    </div>
  );
}

export default function BidsTab({
  addToast,
  onNavigateTab,
}: BidsTabProps) {
  // ─── State ───────────────────────────────────────────────────────────────
  const [role, setRole] = useState<TabRole>("buyer");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [viewMode, setViewMode] = useState<ViewMode>("cards");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Data
  const [buyerAuctions, setBuyerAuctions] = useState<AuctionDto[]>([]);
  const [sellerAuctions, setSellerAuctions] = useState<AuctionDto[]>([]);
  // ─── Fetch Data ──────────────────────────────────────────────────────────
  const fetchData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    try {
      const [buyerRes, sellerRes] = await Promise.allSettled([
        auctionService.getAuctions({ myParticipations: true, pageSize: 50 }),
        auctionService.getAuctions({ myAuctions: true, pageSize: 50 }),
      ]);

      if (buyerRes.status === "fulfilled") {
        setBuyerAuctions(buyerRes.value.items || []);
      }
      if (sellerRes.status === "fulfilled") {
        setSellerAuctions(sellerRes.value.items || []);
      }
    } catch (err: any) {
      console.warn("Lỗi tải danh sách phiên đấu giá:", err);
      addToast({
        type: "error",
        title: "Không thể tải dữ liệu đấu giá",
        message: err.message || "Vui lòng kiểm tra lại kết nối mạng.",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Tick interval for live countdown
  const [, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  // ─── Filtering ───────────────────────────────────────────────────────────
  const activeList = useMemo(() => {
    const source = role === "buyer" ? buyerAuctions : sellerAuctions;
    return source.filter((item) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const codeMatch = item.auctionCode?.toLowerCase().includes(q);
        const phoneMatch = item.simPhoneNumber?.replace(/\D/g, "").includes(q.replace(/\D/g, ""));
        const carrierMatch = item.carrierName?.toLowerCase().includes(q);
        if (!codeMatch && !phoneMatch && !carrierMatch) return false;
      }

      // Status
      if (statusFilter === "ACTIVE") {
        return item.auctionStatus === "ACTIVE" || String(item.auctionStatus) === "2";
      }
      if (statusFilter === "SCHEDULE") {
        return item.auctionStatus === "SCHEDULE" || String(item.auctionStatus) === "1";
      }
      if (statusFilter === "END") {
        return (
          item.auctionStatus === "END" ||
          String(item.auctionStatus) === "3" ||
          item.auctionStatus === "CANCELLED" ||
          String(item.auctionStatus) === "4"
        );
      }
      return true;
    });
  }, [role, buyerAuctions, sellerAuctions, searchQuery, statusFilter]);

  // ─── Financial Portfolio Metrics ─────────────────────────────────────────
  const portfolioMetrics = useMemo(() => {
    const currentList = role === "buyer" ? buyerAuctions : sellerAuctions;
    const activeCount = currentList.filter(
      (a) => a.auctionStatus === "ACTIVE" || String(a.auctionStatus) === "2"
    ).length;
    const totalDepositLocked = currentList.reduce((sum, a) => sum + (Number(a.depositAmount) || 0), 0);
    const completedCount = currentList.filter(
      (a) =>
        a.auctionStatus === "END" ||
        String(a.auctionStatus) === "3" ||
        a.auctionStatus === "CANCELLED" ||
        String(a.auctionStatus) === "4"
    ).length;

    return {
      total: currentList.length,
      activeCount,
      totalDepositLocked,
      completedCount,
    };
  }, [role, buyerAuctions, sellerAuctions]);

  return (
    <div className="space-y-3.5">
      {/* ── Top Bar: Dual-Role Switcher & Master Action Controls ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-slate-100">
        {/* Dual Role Segmented Switcher */}
        <div className="inline-flex p-1 bg-slate-100 rounded-full border border-slate-200/80 self-start">
          <button
            type="button"
            onClick={() => {
              setRole("buyer");
              setStatusFilter("ALL");
            }}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full transition-all cursor-pointer ${
              role === "buyer"
                ? "bg-white text-[#001743] shadow-xs font-bold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <ShoppingBag size={13} className={role === "buyer" ? "text-[#001743]" : "text-slate-400"} />
            <span>Tôi đặt cọc (Mua)</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono tabular-nums ${
                role === "buyer" ? "bg-[#001743] text-white font-bold" : "bg-slate-200 text-slate-700"
              }`}
            >
              {buyerAuctions.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setRole("seller");
              setStatusFilter("ALL");
            }}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full transition-all cursor-pointer ${
              role === "seller"
                ? "bg-white text-[#001743] shadow-xs font-bold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Tag size={13} className={role === "seller" ? "text-emerald-600" : "text-slate-400"} />
            <span>Tôi tạo phiên (Bán)</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono tabular-nums ${
                role === "seller" ? "bg-[#001743] text-white font-bold" : "bg-slate-200 text-slate-700"
              }`}
            >
              {sellerAuctions.length}
            </span>
          </button>
        </div>

        {/* Action Controls & View Mode */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="inline-flex p-0.5 bg-slate-100 rounded-full border border-slate-200/70">
            <button
              type="button"
              onClick={() => setViewMode("cards")}
              className={`p-1 px-2 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                viewMode === "cards" ? "bg-white text-[#001743] shadow-2xs font-bold" : "text-slate-500 hover:text-slate-800"
              }`}
              title="Dạng thẻ"
            >
              <LayoutGrid size={13} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`p-1 px-2 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                viewMode === "table" ? "bg-white text-[#001743] shadow-2xs font-bold" : "text-slate-500 hover:text-slate-800"
              }`}
              title="Dạng bảng"
            >
              <List size={13} />
            </button>
          </div>

          <button
            type="button"
            onClick={() => fetchData(true)}
            disabled={loading || refreshing}
            className="inline-flex items-center gap-1 px-3 py-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-full text-xs font-bold transition-all disabled:opacity-50 shadow-2xs cursor-pointer active:scale-95"
            title="Đồng bộ lại từ máy chủ"
          >
            <RefreshCw size={11} className={refreshing ? "animate-spin text-[#001743]" : ""} />
            <span>{refreshing ? "Đang đồng bộ…" : "Đồng bộ"}</span>
          </button>

          {role === "seller" ? (
            <button
              type="button"
              onClick={() => (onNavigateTab ? onNavigateTab("auctions") : null)}
              className="inline-flex items-center gap-1 px-3.5 py-1 bg-[#001743] hover:bg-[#0A2558] text-white rounded-full text-xs font-bold transition-all shadow-2xs cursor-pointer active:scale-95"
            >
              <Plus size={13} strokeWidth={2.5} />
              <span>Khởi tạo phiên</span>
            </button>
          ) : (
            <Link
              href="/auctions"
              className="inline-flex items-center gap-1 px-3.5 py-1 bg-[#001743] hover:bg-[#0A2558] text-white rounded-full text-xs font-bold transition-all shadow-2xs cursor-pointer active:scale-95"
            >
              <Sparkles size={12} className="text-amber-400" />
              <span>Sàn đấu giá</span>
            </Link>
          )}
        </div>
      </div>

      {/* ── Metrics Ribbon (Compact) ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
        <div className="p-2.5 bg-slate-50/70 border border-slate-200/80 rounded-xl flex items-center justify-between shadow-2xs">
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              {role === "buyer" ? "Đã tham gia" : "Đang quản lý"}
            </div>
            <div className="text-base font-bold text-[#001743] font-mono tabular-nums">
              {portfolioMetrics.total} <span className="text-[10px] text-slate-400 font-medium">phiên</span>
            </div>
          </div>
          <div className="w-7 h-7 rounded-lg bg-white border border-slate-200 text-slate-700 flex items-center justify-center">
            {role === "buyer" ? <ShoppingBag size={13} /> : <Tag size={13} />}
          </div>
        </div>

        <div className="p-2.5 bg-slate-50/70 border border-slate-200/80 rounded-xl flex items-center justify-between shadow-2xs">
          <div>
            <div className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Đang diễn ra</div>
            <div className="text-base font-bold text-emerald-950 font-mono tabular-nums flex items-center gap-1">
              <span>{portfolioMetrics.activeCount}</span>
              {portfolioMetrics.activeCount > 0 && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              )}
            </div>
          </div>
          <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center">
            <TrendingUp size={13} />
          </div>
        </div>

        <div className="p-2.5 bg-slate-50/70 border border-slate-200/80 rounded-xl flex items-center justify-between shadow-2xs">
          <div>
            <div className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">
              {role === "buyer" ? "Cọc bảo đảm" : "Tổng cọc người mua"}
            </div>
            <div className="text-xs font-bold text-blue-950 font-mono tabular-nums">
              {formatVND(portfolioMetrics.totalDepositLocked)}
            </div>
          </div>
          <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center">
            <Lock size={13} />
          </div>
        </div>

        <div className="p-2.5 bg-slate-50/70 border border-slate-200/80 rounded-xl flex items-center justify-between shadow-2xs">
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Đã kết thúc</div>
            <div className="text-base font-bold text-slate-900 font-mono tabular-nums">
              {portfolioMetrics.completedCount} <span className="text-[10px] text-slate-400 font-medium">phiên</span>
            </div>
          </div>
          <div className="w-7 h-7 rounded-lg bg-white border border-slate-200 text-slate-600 flex items-center justify-center">
            <CheckCircle2 size={13} />
          </div>
        </div>
      </div>

      {/* ── Status Filter Chips & Search Bar (Compact) ── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 p-2 bg-slate-50/70 border border-slate-200/80 rounded-xl shadow-2xs">
        <div className="flex items-center gap-1 flex-wrap w-full sm:w-auto">
          {[
            { id: "ALL", label: "Tất cả" },
            { id: "ACTIVE", label: "Đang diễn ra" },
            { id: "SCHEDULE", label: "Sắp mở" },
            { id: "END", label: "Đã chốt" },
          ].map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setStatusFilter(f.id as StatusFilter)}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                statusFilter === f.id
                  ? "bg-[#001743] text-white shadow-2xs"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm số SIM, mã phiên…"
            className="w-full text-xs pl-8 pr-7 py-1 bg-white border border-slate-200 rounded-full font-medium text-[#001743] focus:border-[#001743] focus:outline-none transition-all placeholder:text-slate-400 shadow-2xs"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X size={11} />
            </button>
          )}
        </div>
      </div>

      {/* ── SECTION 5: Main Portfolio Content (Interactive Cards or Ledger Table) ── */}
      {loading ? (
        <div className="p-16 text-center bg-white border border-slate-100/90 rounded-[28px] space-y-3 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <RefreshCw size={24} className="animate-spin text-[#001743] mx-auto" />
          <p className="text-xs font-semibold text-slate-500">Đang đồng bộ dữ liệu danh mục đấu giá từ hệ thống…</p>
        </div>
      ) : activeList.length === 0 ? (
        <div className="p-16 text-center bg-white border border-slate-100/90 rounded-[28px] space-y-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto shadow-2xs">
            {role === "buyer" ? <ShoppingBag size={28} /> : <Tag size={28} />}
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-base font-bold text-[#001743]">
              {role === "buyer"
                ? "Chưa có phiên đấu giá nào bạn đã tham gia đặt cọc"
                : "Chưa có phiên đấu giá nào do bạn khởi tạo"}
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              {role === "buyer"
                ? "Khám phá ngay danh mục SIM số đẹp đang mở đấu giá công khai để tham gia đặt cọc và săn SIM giá tốt."
                : "Đăng ký niêm yết các số SIM đã xác thực chính chủ lên sàn để tạo phiên đấu giá công khai hoặc phiên đấu giá kín."}
            </p>
          </div>
          <div>
            {role === "buyer" ? (
              <Link
                href="/auctions"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#001743] hover:bg-[#002875] text-white rounded-full text-xs font-bold shadow-md shadow-navy-950/15 transition-all active:scale-95 cursor-pointer"
              >
                <span>Khám phá phòng đấu giá</span>
                <ArrowRight size={14} />
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => (onNavigateTab ? onNavigateTab("auctions") : null)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#001743] hover:bg-[#002875] text-white rounded-full text-xs font-bold shadow-md shadow-navy-950/15 transition-all cursor-pointer active:scale-95"
              >
                <Plus size={15} />
                <span>Khởi tạo phiên mới ngay</span>
              </button>
            )}
          </div>
        </div>
      ) : viewMode === "cards" ? (
        /* ── View Mode A: High-Trust Interactive Cards ── */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {activeList.map((item) => {
            const isDutch = item.auctionType === "DUTCH" || String(item.auctionType) === "1";
            const isActive = item.auctionStatus === "ACTIVE" || String(item.auctionStatus) === "2";
            const isSchedule = item.auctionStatus === "SCHEDULE" || String(item.auctionStatus) === "1";
            const isEnded =
              item.auctionStatus === "END" ||
              String(item.auctionStatus) === "3" ||
              item.auctionStatus === "CANCELLED" ||
              String(item.auctionStatus) === "4";
            const timeInfo = formatRemaining(item.endAt);

            return (
              <div
                key={item.id}
                className="bg-white border border-slate-100/90 hover:border-[#001743]/30 rounded-[24px] p-5 sm:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-lg transition-all duration-200 flex flex-col justify-between group space-y-4"
              >
                <div className="space-y-3.5">
                  {/* Top Bar: Code, Type, Carrier, Status */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold text-[#001743] bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200/60 tabular-nums">
                        {item.auctionCode}
                      </span>
                      <CarrierBadge carrier={item.carrierName} />
                      <span
                        className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${
                          isDutch
                            ? "bg-amber-50 text-amber-800 border-amber-200"
                            : "bg-slate-100 text-slate-700 border-slate-200"
                        }`}
                      >
                        {isDutch ? "Hà Lan (Giảm dần)" : "Kiểu Anh (Tăng dần)"}
                      </span>
                    </div>

                    {/* Status Indicator */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {isActive && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                          <span>Đang diễn ra</span>
                        </span>
                      )}
                      {isSchedule && (
                        <span className="px-3 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                          Sắp mở sàn
                        </span>
                      )}
                      {isEnded && (
                        <span className="px-3 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                          Đã chốt phiên
                        </span>
                      )}
                    </div>
                  </div>

                  {/* SIM Number Headline */}
                  <div>
                    <Link
                      href={`/auctions/${item.id}`}
                      className="font-mono text-2xl font-black text-[#001743] hover:text-[#002875] transition-colors tracking-tight tabular-nums inline-block"
                    >
                      {formatPhoneNumber(item.simPhoneNumber)}
                    </Link>
                    {item.formatRhythmName && (
                      <span className="text-[11px] text-slate-400 block mt-0.5 font-medium">
                        Thế số: {item.formatRhythmName}
                      </span>
                    )}
                  </div>

                  {/* Financial Metrics Strip */}
                  <div className="grid grid-cols-2 gap-2.5 p-3.5 bg-slate-50/70 rounded-[18px] text-xs border border-slate-100">
                    <div>
                      <span className="text-[11px] text-slate-500 block">
                        {isEnded ? "Giá chốt phiên:" : "Giá hiện tại:"}
                      </span>
                      <span className="font-mono text-base font-bold text-[#001743] tabular-nums block mt-0.5">
                        {formatVND(item.currentPrice || item.startingPrice)}
                      </span>
                    </div>

                    <div>
                      <span className="text-[11px] text-slate-500 block">Giá khởi điểm:</span>
                      <span className="font-mono text-xs font-semibold text-slate-600 tabular-nums block mt-0.5">
                        {formatVND(item.startingPrice)}
                      </span>
                    </div>

                    <div className="pt-2 border-t border-slate-200/60 flex items-center gap-1.5 text-[11px] text-slate-600">
                      <Gavel size={13} className="text-slate-400" />
                      <span>
                        Tổng: <strong className="text-slate-900 tabular-nums">{item.totalBids || 0}</strong> lượt trả
                      </span>
                    </div>

                    <div className="pt-2 border-t border-slate-200/60 flex items-center gap-1.5 text-[11px] text-slate-600">
                      <ShieldCheck size={13} className="text-emerald-600" />
                      <span>
                        Cọc: <strong className="text-slate-900 tabular-nums">{formatVND(item.depositAmount)}</strong>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Footer: Time Countdown & Enter Button */}
                <div className="pt-3.5 border-t border-slate-100 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono tabular-nums">
                    <Clock size={13} className={isActive ? "text-amber-500" : "text-slate-400"} />
                    <span className="font-medium text-[11px]">
                      {isActive
                        ? timeInfo.text
                        : isSchedule
                        ? `Mở: ${formatDate(item.startAt)}`
                        : `Đóng: ${formatDate(item.endAt)}`}
                    </span>
                  </div>

                  <Link
                    href={`/auctions/${item.id}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#001743] hover:bg-[#002875] text-white rounded-full text-xs font-bold shadow-2xs transition-all active:scale-95"
                  >
                    <span>{role === "buyer" ? "Vào sàn đấu giá" : "Giám sát phiên"}</span>
                    <ChevronRight size={14} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ── View Mode B: High-Trust Audit Table / Ledger View ── */
        <div className="bg-white border border-slate-100/90 rounded-[28px] overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80 text-slate-500 font-bold uppercase text-[10px] tracking-wider h-11">
                  <th className="py-3 px-5">Số SIM &amp; Mã Phiên</th>
                  <th className="py-3 px-4">Nhà Mạng / Kiểu</th>
                  <th className="py-3 px-4 text-right">Giá Hiện Tại</th>
                  <th className="py-3 px-4 text-right">Tiền Cọc Ký Quỹ</th>
                  <th className="py-3 px-4 text-center">Lượt Đấu Giá</th>
                  <th className="py-3 px-4 text-center">Thời Gian / Hạn Chót</th>
                  <th className="py-3 px-4 text-center">Trạng Thái</th>
                  <th className="py-3 px-5 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activeList.map((item) => {
                  const isDutch = item.auctionType === "DUTCH" || String(item.auctionType) === "1";
                  const isActive = item.auctionStatus === "ACTIVE" || String(item.auctionStatus) === "2";
                  const isSchedule = item.auctionStatus === "SCHEDULE" || String(item.auctionStatus) === "1";
                  const isEnded =
                    item.auctionStatus === "END" ||
                    String(item.auctionStatus) === "3" ||
                    item.auctionStatus === "CANCELLED" ||
                    String(item.auctionStatus) === "4";
                  const timeInfo = formatRemaining(item.endAt);

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-5">
                        <Link
                          href={`/auctions/${item.id}`}
                          className="font-mono text-sm font-bold text-[#001743] hover:text-[#002875] transition-colors tabular-nums block"
                        >
                          {formatPhoneNumber(item.simPhoneNumber)}
                        </Link>
                        <span className="font-mono text-[11px] text-slate-400">{item.auctionCode}</span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <CarrierBadge carrier={item.carrierName} />
                          <span className="text-[10px] font-semibold text-slate-500">
                            {isDutch ? "Hà Lan" : "Anh"}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <span className="font-mono font-bold text-xs text-[#001743] tabular-nums">
                          {formatVND(item.currentPrice || item.startingPrice)}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <span className="font-mono font-semibold text-xs text-slate-700 tabular-nums">
                          {formatVND(item.depositAmount)}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center font-mono font-semibold text-xs text-slate-700 tabular-nums">
                        {item.totalBids || 0}
                      </td>

                      <td className="py-3.5 px-4 text-center font-mono text-[11px] text-slate-600 tabular-nums">
                        {isActive ? timeInfo.text : isSchedule ? formatDate(item.startAt) : formatDate(item.endAt)}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        {isActive && (
                          <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                            <span>Diễn ra</span>
                          </span>
                        )}
                        {isSchedule && (
                          <span className="px-3 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                            Sắp mở
                          </span>
                        )}
                        {isEnded && (
                          <span className="px-3 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                            Đã chốt
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-5 text-right">
                        <Link
                          href={`/auctions/${item.id}`}
                          className="inline-flex items-center gap-1 px-3.5 py-1.5 bg-[#001743] hover:bg-[#002875] text-white rounded-full text-xs font-bold transition-colors shadow-2xs"
                        >
                          <span>Xem</span>
                          <ArrowUpRight size={13} />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
