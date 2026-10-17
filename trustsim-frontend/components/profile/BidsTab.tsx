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
    <div className="space-y-6">
      {/* ── SECTION 1: Institutional Header & Master Actions ── */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-full opacity-[0.03] pointer-events-none bg-[radial-gradient(#001743_1px,transparent_1px)] [background-size:12px_12px]" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase bg-slate-100 text-[#001743] border border-slate-200">
                <Gavel size={12} className="text-[#001743]" />
                <span>Danh sách phiên đấu giá</span>
              </span>
            </div>

            <h1 className="text-xl font-bold tracking-tight text-[#001743] mt-2">
              Quản lý các phiên đấu giá
            </h1>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
              Theo dõi các phiên bạn đang tham gia hoặc đang quản lý. Những phiên cần thanh toán hay xác nhận đã được chuyển sang tab Hoàn tất giao dịch.
            </p>
          </div>

          {/* Action Hub */}
          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            <button
              type="button"
              onClick={() => fetchData(true)}
              disabled={loading || refreshing}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition-colors duration-150 disabled:opacity-50 shadow-2xs"
              title="Đồng bộ lại từ máy chủ"
            >
              <RefreshCw size={13} className={refreshing ? "animate-spin text-[#001743]" : ""} />
              <span>{refreshing ? "Đang đồng bộ…" : "Đồng bộ"}</span>
            </button>

            {role === "seller" ? (
              <button
                type="button"
                onClick={() => (onNavigateTab ? onNavigateTab("auctions") : null)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#E4011E] hover:bg-[#C00119] active:scale-[0.99] text-white rounded-xl text-xs font-bold transition-all shadow-xs"
              >
                <Plus size={15} strokeWidth={2.5} />
                <span>Khởi tạo phiên đấu giá</span>
              </button>
            ) : (
              <Link
                href="/auctions"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#001743] hover:bg-[#00266B] active:scale-[0.99] text-white rounded-xl text-xs font-bold transition-all shadow-xs"
              >
                <Sparkles size={14} className="text-amber-400" />
                <span>Sàn SIM đang đấu giá</span>
              </Link>
            )}
          </div>
        </div>

        {/* ── SECTION 2: Clean High-Trust Financial Metrics Ribbon ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-6 mt-6 border-t border-slate-100">
          <div className="p-3.5 bg-slate-50/70 border border-slate-200/80 rounded-xl flex items-center justify-between">
            <div>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                {role === "buyer" ? "Phiên đã tham gia" : "Phiên đang quản lý"}
              </div>
              <div className="text-lg font-bold text-[#001743] font-mono tabular-nums mt-0.5">
                {portfolioMetrics.total}
              </div>
            </div>
            <div className="w-8 h-8 rounded-lg bg-white border border-slate-200/70 flex items-center justify-center text-slate-700 shadow-2xs">
              {role === "buyer" ? <ShoppingBag size={16} /> : <Tag size={16} />}
            </div>
          </div>

          <div className="p-3.5 bg-slate-50/70 border border-slate-200/80 rounded-xl flex items-center justify-between">
            <div>
              <div className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Đang diễn ra trực tiếp</div>
              <div className="text-lg font-bold text-emerald-950 font-mono tabular-nums mt-0.5 flex items-center gap-1.5">
                <span>{portfolioMetrics.activeCount} phiên</span>
                {portfolioMetrics.activeCount > 0 && (
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                )}
              </div>
            </div>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200/70 flex items-center justify-center text-emerald-700 shadow-2xs">
              <TrendingUp size={16} />
            </div>
          </div>

          <div className="p-3.5 bg-slate-50/70 border border-slate-200/80 rounded-xl flex items-center justify-between">
            <div>
              <div className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">
                {role === "buyer" ? "Cọc đang bảo đảm" : "Tổng cọc người mua"}
              </div>
              <div className="text-sm font-bold text-blue-950 font-mono tabular-nums mt-0.5">
                {formatVND(portfolioMetrics.totalDepositLocked)}
              </div>
            </div>
            <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200/70 flex items-center justify-center text-blue-700 shadow-2xs">
              <Lock size={16} />
            </div>
          </div>

          <div className="p-3.5 bg-slate-50/70 border border-slate-200/80 rounded-xl flex items-center justify-between">
            <div>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Đã kết thúc</div>
              <div className="text-lg font-bold text-slate-900 font-mono tabular-nums mt-0.5 flex items-center gap-1.5">
                <span>{portfolioMetrics.completedCount} phiên</span>
              </div>
            </div>
            <div className="w-8 h-8 rounded-lg bg-white border border-slate-200/70 flex items-center justify-center text-slate-600 shadow-2xs">
              <CheckCircle2 size={16} />
            </div>
          </div>
        </div>
      </div>

      {/* ── SECTION 4: Dual-Role Switcher & Interactive Control Console ── */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Dual Role Segmented Switcher */}
          <div className="inline-flex p-1 bg-slate-100/90 rounded-xl border border-slate-200/80 self-start">
            <button
              type="button"
              onClick={() => {
                setRole("buyer");
                setStatusFilter("ALL");
              }}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all duration-150 ${
                role === "buyer"
                  ? "bg-white text-[#001743] shadow-xs border border-slate-200/60 font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <ShoppingBag size={15} className={role === "buyer" ? "text-[#E4011E]" : "text-slate-400"} />
              <span>Tôi Tham Gia Đặt Cọc (Người Mua)</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono tabular-nums ${
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
              className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all duration-150 ${
                role === "seller"
                  ? "bg-white text-[#001743] shadow-xs border border-slate-200/60 font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Tag size={15} className={role === "seller" ? "text-emerald-600" : "text-slate-400"} />
              <span>Tôi Tạo &amp; Sở Hữu Phiên (Chủ Sàn)</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono tabular-nums ${
                  role === "seller" ? "bg-[#001743] text-white font-bold" : "bg-slate-200 text-slate-700"
                }`}
              >
                {sellerAuctions.length}
              </span>
            </button>
          </div>

          {/* View Mode Toggle: Cards vs Ledger Table */}
          <div className="flex items-center gap-2 self-end md:self-auto">
            <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200/70">
              <button
                type="button"
                onClick={() => setViewMode("cards")}
                className={`p-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  viewMode === "cards" ? "bg-white text-[#001743] shadow-2xs font-bold" : "text-slate-500 hover:text-slate-800"
                }`}
                title="Hiển thị dạng thẻ trực quan"
              >
                <LayoutGrid size={15} />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={`p-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  viewMode === "table" ? "bg-white text-[#001743] shadow-2xs font-bold" : "text-slate-500 hover:text-slate-800"
                }`}
                title="Hiển thị dạng bảng đối soát sổ cái"
              >
                <List size={15} />
              </button>
            </div>
          </div>
        </div>

        {/* Status Filter Chips & Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-1.5 flex-wrap w-full sm:w-auto">
            <span className="text-[11px] font-semibold text-slate-400 mr-1 flex items-center gap-1">
              <SlidersHorizontal size={12} />
              <span>Bộ lọc:</span>
            </span>

            {[
              { id: "ALL", label: "Tất cả phiên" },
              { id: "ACTIVE", label: "Đang diễn ra" },
              { id: "SCHEDULE", label: "Sắp mở" },
              { id: "END", label: "Đã chốt phiên" },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setStatusFilter(f.id as StatusFilter)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
                  statusFilter === f.id
                    ? "bg-[#001743] text-white shadow-2xs font-bold"
                    : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/60"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-80">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo số SIM, mã phiên, nhà mạng…"
              className="w-full text-xs pl-9 pr-8 py-2 bg-slate-50/50 border border-slate-200 rounded-xl font-medium text-[#001743] focus:bg-white focus:border-[#001743] focus:ring-1 focus:ring-[#001743] focus:outline-none transition-all placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── SECTION 5: Main Portfolio Content (Interactive Cards or Ledger Table) ── */}
      {loading ? (
        <div className="p-16 text-center bg-white border border-slate-200/90 rounded-2xl space-y-3 shadow-xs">
          <RefreshCw size={24} className="animate-spin text-[#001743] mx-auto" />
          <p className="text-xs font-semibold text-slate-500">Đang đồng bộ dữ liệu danh mục đấu giá từ hệ thống…</p>
        </div>
      ) : activeList.length === 0 ? (
        <div className="p-16 text-center bg-white border border-slate-200/90 rounded-2xl space-y-4 shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto shadow-2xs">
            {role === "buyer" ? <ShoppingBag size={30} /> : <Tag size={30} />}
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
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#001743] hover:bg-[#00266B] active:scale-[0.99] text-white rounded-xl text-xs font-bold shadow-xs transition-all"
              >
                <span>Khám phá phòng đấu giá</span>
                <ArrowRight size={14} />
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => (onNavigateTab ? onNavigateTab("auctions") : null)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#E4011E] hover:bg-[#C00119] active:scale-[0.99] text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
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
                className="bg-white border border-slate-200/90 hover:border-[#001743]/50 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between group space-y-4"
              >
                <div className="space-y-3.5">
                  {/* Top Bar: Code, Type, Carrier, Status */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-[#001743] bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200/60 tabular-nums">
                        {item.auctionCode}
                      </span>
                      <CarrierBadge carrier={item.carrierName} />
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${
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
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                          <span>Đang diễn ra</span>
                        </span>
                      )}
                      {isSchedule && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                          Sắp mở sàn
                        </span>
                      )}
                      {isEnded && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                          Đã chốt phiên
                        </span>
                      )}
                    </div>
                  </div>

                  {/* SIM Number Headline */}
                  <div>
                    <Link
                      href={`/auctions/${item.id}`}
                      className="font-mono text-2xl font-black text-[#001743] group-hover:text-[#E4011E] transition-colors tracking-tight tabular-nums inline-block"
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
                  <div className="grid grid-cols-2 gap-2.5 p-3.5 bg-slate-50/70 rounded-xl text-xs border border-slate-100">
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
                    className="inline-flex items-center gap-1 px-3.5 py-1.5 bg-[#001743] hover:bg-[#00266B] active:scale-[0.99] text-white rounded-xl text-xs font-bold shadow-2xs transition-all"
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
        <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-500 font-bold uppercase text-[10px] tracking-wider h-11">
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
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-5">
                        <Link
                          href={`/auctions/${item.id}`}
                          className="font-mono text-sm font-bold text-[#001743] hover:text-[#E4011E] transition-colors tabular-nums block"
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
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                            <span>Diễn ra</span>
                          </span>
                        )}
                        {isSchedule && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                            Sắp mở
                          </span>
                        )}
                        {isEnded && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                            Đã chốt
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-5 text-right">
                        <Link
                          href={`/auctions/${item.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#001743] hover:bg-[#00266B] text-white rounded-lg text-xs font-semibold transition-colors"
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
