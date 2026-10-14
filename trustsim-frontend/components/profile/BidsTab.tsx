/* Hallmark · genre: modern-minimal · style: Clean High-Trust Banking · macrostructure: Workbench · role: user-auction-escrow-portfolio */
"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  Gavel,
  Trophy,
  Award,
  Clock,
  AlertTriangle,
  ArrowRight,
  Search,
  Sparkles,
  ShieldCheck,
  RefreshCw,
  Wallet,
  ChevronRight,
  Plus,
  Flame,
  Scale,
  X,
  ShoppingBag,
  Tag,
  AlertCircle,
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
  PendingSettlementDto,
} from "@/services/auctionService";
import { formatPhoneNumber, getCarrierColor } from "@/services/simService";

interface BidsTabProps {
  addToast: (t: Omit<ToastMessage, "id">) => void;
  onNavigateTab?: (tab: any) => void;
  onOpenDeposit?: () => void;
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
  onOpenDeposit,
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
  const [pendingSettlements, setPendingSettlements] = useState<PendingSettlementDto[]>([]);

  // Action Loading
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Modal Action
  const [activeActionModal, setActiveActionModal] = useState<{
    item: PendingSettlementDto;
    type: "PAY" | "FORFEIT" | "ACCEPT_RUNNER_UP" | "REJECT_RUNNER_UP" | "SELLER_APPROVE" | "SELLER_REJECT";
  } | null>(null);

  // ─── Fetch Data ──────────────────────────────────────────────────────────
  const fetchData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    try {
      const [buyerRes, sellerRes, pendingRes] = await Promise.allSettled([
        auctionService.getAuctions({ myParticipations: true, pageSize: 50 }),
        auctionService.getAuctions({ myAuctions: true, pageSize: 50 }),
        auctionService.getPendingSettlements(),
      ]);

      if (buyerRes.status === "fulfilled") {
        setBuyerAuctions(buyerRes.value.items || []);
      }
      if (sellerRes.status === "fulfilled") {
        setSellerAuctions(sellerRes.value.items || []);
      }
      if (pendingRes.status === "fulfilled") {
        setPendingSettlements(pendingRes.value || []);
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

  // ─── Urgent Settlements Filtered by Role ──────────────────────────────────
  const urgentSettlements = useMemo(() => {
    if (role === "buyer") {
      return pendingSettlements.filter((s) => s.role === "WINNER" || s.role === "RUNNER_UP");
    } else {
      return pendingSettlements.filter((s) => s.role === "SELLER");
    }
  }, [pendingSettlements, role]);

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
      urgentCount: urgentSettlements.length,
    };
  }, [role, buyerAuctions, sellerAuctions, urgentSettlements]);

  // ─── Action Handlers ─────────────────────────────────────────────────────
  const handleConfirmAction = async () => {
    if (!activeActionModal) return;
    const { item, type } = activeActionModal;
    setActionLoadingId(item.auctionId);

    try {
      if (type === "PAY") {
        await auctionService.confirmWinnerPayment(item.auctionId);
        addToast({
          type: "success",
          title: "Thanh toán thành công",
          message: `Đã hoàn tất thanh toán số tiền còn lại cho SIM ${formatPhoneNumber(item.simPhoneNumber)}. Hợp đồng điện tử đã được kích hoạt!`,
        });
      } else if (type === "FORFEIT") {
        await auctionService.forfeitWinnerPurchase(item.auctionId);
        addToast({
          type: "warning",
          title: "Đã từ bỏ quyền mua",
          message: `Hệ thống đã ghi nhận việc từ bỏ quyền mua SIM ${formatPhoneNumber(item.simPhoneNumber)} và thực thi chế tài phạt cọc theo quy chế.`,
        });
      } else if (type === "ACCEPT_RUNNER_UP") {
        await auctionService.acceptRunnerUpOffer(item.auctionId);
        addToast({
          type: "success",
          title: "Nhận quyền mua thành công",
          message: `Bạn đã chấp thuận nhận quyền mua SIM ${formatPhoneNumber(item.simPhoneNumber)} với mức giá Á Quân. Vui lòng thanh toán số tiền còn lại!`,
        });
      } else if (type === "REJECT_RUNNER_UP") {
        await auctionService.rejectRunnerUpOffer(item.auctionId);
        addToast({
          type: "info",
          title: "Đã từ chối nhận mua",
          message: `Bạn đã từ chối nhận quyền mua SIM ${formatPhoneNumber(item.simPhoneNumber)}. Tiền cọc đã được hoàn về ví khả dụng.`,
        });
      } else if (type === "SELLER_APPROVE") {
        await auctionService.sellerDecideRunnerUp(item.auctionId, true);
        addToast({
          type: "success",
          title: "Đã phê duyệt bán cho Á Quân",
          message: `Bạn đã chấp thuận bán SIM ${formatPhoneNumber(item.simPhoneNumber)} cho Á Quân. Hệ thống đã phát lệnh thanh toán cho người mua.`,
        });
      } else if (type === "SELLER_REJECT") {
        await auctionService.sellerDecideRunnerUp(item.auctionId, false);
        addToast({
          type: "info",
          title: "Đã từ chối bán cho Á Quân",
          message: `Phiên đấu giá đã kết thúc. Bạn nhận được tiền bồi thường thiệt hại trích từ quỹ phạt cọc của Winner ban đầu.`,
        });
      }

      setActiveActionModal(null);
      await fetchData(true);
    } catch (err: any) {
      addToast({
        type: "error",
        title: "Thao tác không thành công",
        message: err.message || "Đã xảy ra lỗi khi thực thi giao dịch. Vui lòng thử lại sau.",
      });
    } finally {
      setActionLoadingId(null);
    }
  };

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
                <span>Trung tâm đối soát &amp; Danh mục đấu giá</span>
              </span>
              <span className="text-[11px] font-mono text-slate-400">SMART ESCROW GUARANTEED</span>
            </div>

            <h1 className="text-xl font-bold tracking-tight text-[#001743] mt-2">
              Quản Trị Phiên Đấu Giá &amp; Quyết Toán Ký Quỹ
            </h1>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
              Theo dõi danh mục SIM đấu giá bạn tham gia đặt cọc hoặc đứng tên làm chủ phiên. Mọi giao dịch ký quỹ,
              chuyển nhượng và bồi thường đều được bảo chứng tự động qua hợp đồng điện tử TrustSim.
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
              <div className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Lệnh đối soát chờ</div>
              <div className="text-lg font-bold text-amber-950 font-mono tabular-nums mt-0.5 flex items-center gap-1.5">
                <span>{portfolioMetrics.urgentCount} quyết định</span>
                {portfolioMetrics.urgentCount > 0 && (
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                )}
              </div>
            </div>
            <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200/70 flex items-center justify-center text-amber-700 shadow-2xs">
              <Flame size={16} />
            </div>
          </div>
        </div>
      </div>

      {/* ── SECTION 3: Urgent Escrow Settlement Cockpit (Phòng Quyết Định & Đối Soát Khẩn Cấp) ── */}
      {urgentSettlements.length > 0 && (
        <section
          aria-label="Phòng đối soát ký quỹ khẩn cấp"
          className="bg-gradient-to-r from-amber-50/70 via-white to-amber-50/40 border border-amber-300 rounded-2xl p-6 shadow-xs space-y-4"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-amber-200">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold shadow-xs shrink-0">
                <Flame size={18} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-amber-950 uppercase tracking-wider">
                    Phòng Quyết Định Ký Quỹ &amp; Thanh Toán Khẩn Cấp
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-200 text-amber-900 font-mono">
                    {urgentSettlements.length} yêu cầu
                  </span>
                </div>
                <p className="text-xs text-amber-900/80 mt-0.5">
                  {role === "buyer"
                    ? "Bạn có phiên đấu giá đã kết thúc. Vui lòng thanh toán số tiền còn lại hoặc xác nhận quyền mua Á Quân trước hạn chót."
                    : "Người trúng đấu giá ban đầu đã bỏ cọc. Bạn có quyền duyệt bán chuyển nhượng cho Á Quân hoặc nhận bồi thường phạt cọc."}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs font-semibold text-amber-900 font-mono tabular-nums bg-amber-100/80 px-3 py-1.5 rounded-xl border border-amber-300/60 self-start sm:self-auto">
              <Clock size={14} className="text-amber-700 animate-spin" />
              <span>Đếm ngược hiệu lực quyết toán</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {urgentSettlements.map((item) => {
              const isWinner = item.role === "WINNER";
              const isRunnerUp = item.role === "RUNNER_UP";
              const isSeller = item.role === "SELLER";
              const hasDeficit = item.deficitAmount > 0;
              const remainingInfo = formatRemaining(item.deadline);

              return (
                <div
                  key={item.auctionId}
                  className="bg-white rounded-2xl p-5 border border-amber-200/90 shadow-2xs flex flex-col justify-between space-y-4 hover:border-amber-300 transition-colors"
                >
                  <div className="space-y-3.5">
                    {/* Header: SIM, Code, Role Badge */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-lg font-black text-[#001743] tracking-tight tabular-nums block">
                            {formatPhoneNumber(item.simPhoneNumber)}
                          </span>
                          <CarrierBadge carrier={item.carrierName} />
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono mt-1">
                          Mã phiên: <strong className="text-slate-700">{item.auctionCode}</strong>
                        </div>
                      </div>

                      <span
                        className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-md border ${
                          isWinner
                            ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                            : isRunnerUp
                            ? "bg-blue-50 text-blue-800 border-blue-300"
                            : "bg-purple-50 text-purple-800 border-purple-300"
                        }`}
                      >
                        {isWinner && <Trophy size={13} className="text-emerald-700" />}
                        {isRunnerUp && <Award size={13} className="text-blue-700" />}
                        {isSeller && <Scale size={13} className="text-purple-700" />}
                        <span>
                          {isWinner
                            ? "Winner (Trúng Đấu Giá)"
                            : isRunnerUp
                            ? "Á Quân (Được Chuyển Nhượng)"
                            : "Chủ Phiên (Duyệt Á Quân)"}
                        </span>
                      </span>
                    </div>

                    {/* Financial Ledger Breakdown */}
                    <div className="space-y-2 text-xs bg-slate-50/80 p-3.5 rounded-xl border border-slate-100">
                      {isWinner && (
                        <>
                          <div className="flex justify-between text-slate-600">
                            <span>Giá trúng đấu giá chính thức:</span>
                            <span className="font-mono font-bold text-[#001743] tabular-nums">
                              {formatVND(item.finalPrice)}
                            </span>
                          </div>
                          <div className="flex justify-between text-slate-600">
                            <span>Tiền cọc ký quỹ đã cấn trừ:</span>
                            <span className="font-mono font-bold text-emerald-600 tabular-nums">
                              -{formatVND(item.depositLocked)}
                            </span>
                          </div>
                          <div className="flex justify-between pt-1.5 border-t border-slate-200 font-bold text-[#001743]">
                            <span>Số tiền còn lại cần thanh toán:</span>
                            <span className="font-mono text-sm text-[#E4011E] tabular-nums">
                              {formatVND(item.remainingPaymentRequired)}
                            </span>
                          </div>
                        </>
                      )}

                      {isRunnerUp && (
                        <>
                          <div className="flex justify-between text-slate-600">
                            <span>Mức giá chuyển nhượng Á Quân:</span>
                            <span className="font-mono font-bold text-[#001743] tabular-nums">
                              {formatVND(item.finalPrice)}
                            </span>
                          </div>
                          <div className="flex justify-between text-slate-600">
                            <span>Tiền cọc ký quỹ sẵn sàng cấn trừ:</span>
                            <span className="font-mono font-bold text-emerald-600 tabular-nums">
                              -{formatVND(item.depositLocked)}
                            </span>
                          </div>
                          <div className="flex justify-between pt-1.5 border-t border-slate-200 font-bold text-[#001743]">
                            <span>Số tiền bù thêm nếu nhận mua:</span>
                            <span className="font-mono text-sm text-[#001743] tabular-nums">
                              {formatVND(item.remainingPaymentRequired)}
                            </span>
                          </div>
                        </>
                      )}

                      {isSeller && (
                        <>
                          <div className="flex justify-between text-slate-600">
                            <span>Giá chốt ban đầu (Winner đã vi phạm):</span>
                            <span className="font-mono line-through text-slate-400 tabular-nums">
                              {formatVND(item.finalPrice)}
                            </span>
                          </div>
                          <div className="flex justify-between pt-1.5 border-t border-slate-200 font-bold text-[#001743]">
                            <span>Giá Á Quân sẵn sàng mua ngay:</span>
                            <span className="font-mono text-sm text-emerald-700 tabular-nums">
                              {formatVND(item.runnerUpFinalPrice || 0)}
                            </span>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Deficit Warning with Instant Deposit Action */}
                    {hasDeficit && (isWinner || isRunnerUp) && (
                      <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between text-xs text-rose-900">
                        <div className="flex items-center gap-2 font-medium">
                          <AlertTriangle size={15} className="text-rose-600 shrink-0" />
                          <span>
                            Số dư ví thiếu <strong className="tabular-nums font-bold">{formatVND(item.deficitAmount)}</strong>
                          </span>
                        </div>
                        {onOpenDeposit && (
                          <button
                            type="button"
                            onClick={onOpenDeposit}
                            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-2xs transition-colors shrink-0"
                          >
                            Nạp ví ngay
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions & Countdown Footer */}
                  <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-1.5 text-xs font-mono text-amber-900 tabular-nums">
                      <Clock size={13} className="text-amber-600" />
                      <span className="font-semibold">{remainingInfo.text}</span>
                    </div>

                    <div className="flex items-center gap-2 justify-end">
                      {isWinner && (
                        <>
                          <button
                            type="button"
                            disabled={actionLoadingId === item.auctionId}
                            onClick={() => setActiveActionModal({ item, type: "FORFEIT" })}
                            className="px-3 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-semibold transition-colors disabled:opacity-50"
                          >
                            Bỏ quyền mua
                          </button>
                          <button
                            type="button"
                            disabled={actionLoadingId === item.auctionId || hasDeficit}
                            onClick={() => setActiveActionModal({ item, type: "PAY" })}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-2xs transition-all active:scale-[0.99] disabled:opacity-50"
                          >
                            {actionLoadingId === item.auctionId ? "Đang xử lý…" : "Thanh toán ngay"}
                          </button>
                        </>
                      )}

                      {isRunnerUp && (
                        <>
                          <button
                            type="button"
                            disabled={actionLoadingId === item.auctionId}
                            onClick={() => setActiveActionModal({ item, type: "REJECT_RUNNER_UP" })}
                            className="px-3 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-semibold transition-colors disabled:opacity-50"
                          >
                            Từ chối nhận
                          </button>
                          <button
                            type="button"
                            disabled={actionLoadingId === item.auctionId || hasDeficit}
                            onClick={() => setActiveActionModal({ item, type: "ACCEPT_RUNNER_UP" })}
                            className="px-4 py-2 bg-[#001743] hover:bg-[#00266B] text-white rounded-xl text-xs font-bold shadow-2xs transition-all active:scale-[0.99] disabled:opacity-50"
                          >
                            {actionLoadingId === item.auctionId ? "Đang xử lý…" : "Nhận quyền mua"}
                          </button>
                        </>
                      )}

                      {isSeller && (
                        <>
                          <button
                            type="button"
                            disabled={actionLoadingId === item.auctionId}
                            onClick={() => setActiveActionModal({ item, type: "SELLER_REJECT" })}
                            className="px-3 py-2 border border-slate-200 hover:bg-slate-50 text-rose-700 rounded-xl text-xs font-semibold transition-colors disabled:opacity-50"
                          >
                            Từ chối &amp; nhận cọc
                          </button>
                          <button
                            type="button"
                            disabled={actionLoadingId === item.auctionId}
                            onClick={() => setActiveActionModal({ item, type: "SELLER_APPROVE" })}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-2xs transition-all active:scale-[0.99] disabled:opacity-50"
                          >
                            {actionLoadingId === item.auctionId ? "Đang xử lý…" : "Duyệt bán Á Quân"}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

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

      {/* ── SECTION 6: High-Trust Escrow Settlement Action Modal ── */}
      {activeActionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-fade-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <AlertCircle size={18} className="text-[#001743]" />
                <h3 className="font-bold text-[#001743] text-sm">Xác Nhận Quyết Toán Ký Quỹ Đấu Giá</h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveActionModal(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-700 leading-relaxed">
              <p>
                Bạn đang thao tác trên hợp đồng đấu giá SIM{" "}
                <strong className="text-[#001743] font-mono tabular-nums">
                  {formatPhoneNumber(activeActionModal.item.simPhoneNumber)}
                </strong>{" "}
                (Mã phiên: {activeActionModal.item.auctionCode}).
              </p>

              {activeActionModal.type === "PAY" && (
                <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-950 space-y-1.5">
                  <div className="font-bold">Xác nhận thanh toán số tiền còn lại:</div>
                  <div className="font-mono text-lg font-black text-emerald-700 tabular-nums">
                    {formatVND(activeActionModal.item.remainingPaymentRequired)}
                  </div>
                  <p className="text-[11px] text-emerald-800">
                    Số tiền này sẽ được khấu trừ từ ví khả dụng để đưa vào tài khoản ký quỹ bảo đảm. Hợp đồng chuyển nhượng
                    sẽ được khởi tạo ngay lập tức.
                  </p>
                </div>
              )}

              {activeActionModal.type === "FORFEIT" && (
                <div className="p-3.5 bg-rose-50 rounded-xl border border-rose-200 text-rose-950 space-y-1.5">
                  <div className="font-bold text-rose-800">CẢNH BÁO TỊCH THU TIỀN CỌC:</div>
                  <p className="text-[11px] leading-normal">
                    Khi từ bỏ quyền mua, số tiền cọc{" "}
                    <strong className="tabular-nums font-bold font-mono">
                      {formatVND(activeActionModal.item.depositLocked)}
                    </strong>{" "}
                    sẽ bị tịch thu để bồi thường cho bên bán và sàn giao dịch theo Quy chế hoạt động TrustSim.
                  </p>
                </div>
              )}

              {activeActionModal.type === "ACCEPT_RUNNER_UP" && (
                <div className="p-3.5 bg-blue-50 rounded-xl border border-blue-200 text-blue-950 space-y-1.5">
                  <div className="font-bold">Chấp nhận nhận quyền mua Á Quân:</div>
                  <p className="text-[11px]">
                    Bạn sẽ trở thành người trúng đấu giá chính thức với mức giá đề xuất{" "}
                    <strong className="tabular-nums font-bold font-mono">
                      {formatVND(activeActionModal.item.finalPrice)}
                    </strong>
                    .
                  </p>
                </div>
              )}

              {activeActionModal.type === "REJECT_RUNNER_UP" && (
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-slate-800 space-y-1.5">
                  <div className="font-bold">Từ chối nhận mua:</div>
                  <p className="text-[11px]">
                    Hệ thống sẽ hoàn trả 100% tiền cọc về ví khả dụng của bạn ngay sau khi xác nhận thao tác.
                  </p>
                </div>
              )}

              {activeActionModal.type === "SELLER_APPROVE" && (
                <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-950 space-y-1.5">
                  <div className="font-bold">Đồng ý chuyển nhượng cho Á Quân:</div>
                  <p className="text-[11px]">
                    SIM sẽ được chuyển nhượng cho Á Quân với giá{" "}
                    <strong className="tabular-nums font-bold font-mono">
                      {formatVND(activeActionModal.item.runnerUpFinalPrice || 0)}
                    </strong>
                    .
                  </p>
                </div>
              )}

              {activeActionModal.type === "SELLER_REJECT" && (
                <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 text-amber-950 space-y-1.5">
                  <div className="font-bold">Từ chối bán cho Á Quân:</div>
                  <p className="text-[11px]">
                    Phiên đấu giá sẽ kết thúc. Bạn nhận được khoản bồi thường thiệt hại trích từ tiền phạt cọc của Winner ban đầu.
                  </p>
                </div>
              )}
            </div>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setActiveActionModal(null)}
                disabled={actionLoadingId !== null}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmAction}
                disabled={actionLoadingId !== null}
                className={`px-5 py-2 text-white rounded-xl text-xs font-bold transition-all shadow-2xs active:scale-[0.99] ${
                  activeActionModal.type === "FORFEIT" || activeActionModal.type === "SELLER_REJECT"
                    ? "bg-rose-600 hover:bg-rose-700"
                    : "bg-[#001743] hover:bg-[#00266B]"
                }`}
              >
                {actionLoadingId ? "Đang xử lý…" : "Xác nhận thực hiện"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
