"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  Gavel,
  Trophy,
  Clock,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Search,
  Filter,
  Sparkles,
  ShieldCheck,
  DollarSign,
  RefreshCw,
  Layers,
  ExternalLink,
  Wallet,
  ChevronRight,
  Plus,
  Flame,
  Scale,
  X,
  Info,
  Lock,
  Check,
  ShoppingBag,
  Tag,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import { ToastMessage } from "@/components/ui/Toast";
import {
  auctionService,
  AuctionDto,
  PendingSettlementDto,
  AuctionTypeEnum,
  AuctionStatusEnum,
} from "@/services/auctionService";
import { formatPhoneNumber, getCarrierColor } from "@/services/simService";

interface BidsTabProps {
  addToast: (t: Omit<ToastMessage, "id">) => void;
  onNavigateTab?: (tab: any) => void;
  onOpenDeposit?: () => void;
}

type TabRole = "buyer" | "seller";
type StatusFilter = "ALL" | "ACTIVE" | "SCHEDULE" | "END";

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

/* ─── Time Remaining Formatter ──────────────────────────────────────────── */
function formatRemaining(isoEnd?: string): { text: string; isEnded: boolean } {
  if (!isoEnd) return { text: "—", isEnded: false };
  const diff = new Date(isoEnd).getTime() - Date.now();
  if (diff <= 0) return { text: "Đã kết thúc", isEnded: true };

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const secs = Math.floor((diff % (1000 * 60)) / 1000);

  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return { text: `Còn ${days} ngày ${hours % 24}h`, isEnded: false };
  }
  return {
    text: `Còn ${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`,
    isEnded: false,
  };
}

/* ─── Carrier Mini Badge ─────────────────────────────────────────────────── */
function CarrierMiniBadge({ carrier }: { carrier?: string }) {
  const name = carrier || "SIM";
  const color = getCarrierColor(name);
  const abbr = name.substring(0, 2).toUpperCase();

  return (
    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200/80 text-[11px] font-semibold text-slate-700">
      <span
        className="w-2 h-2 rounded-full shrink-0"
        style={{ backgroundColor: color }}
      />
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
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Data
  const [buyerAuctions, setBuyerAuctions] = useState<AuctionDto[]>([]);
  const [sellerAuctions, setSellerAuctions] = useState<AuctionDto[]>([]);
  const [pendingSettlements, setPendingSettlements] = useState<PendingSettlementDto[]>([]);

  // Action Loading
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Modal Xác Nhận Quyết Định / Thanh Toán
  const [activeActionModal, setActiveActionModal] = useState<{
    item: PendingSettlementDto;
    type: "PAY" | "FORFEIT" | "ACCEPT_RUNNER_UP" | "REJECT_RUNNER_UP" | "SELLER_APPROVE" | "SELLER_REJECT";
  } | null>(null);

  // ─── Fetch Data ──────────────────────────────────────────────────────────
  const fetchData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    try {
      // Gọi song song 3 API thật từ AuctionsController
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
        title: "Không thể tải dữ liệu",
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

  // Tick interval để update countdown
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
          message: `Bạn đã hoàn tất thanh toán số tiền còn lại cho SIM ${formatPhoneNumber(item.simPhoneNumber)}. Hợp đồng chuyển nhượng đã được kích hoạt!`,
        });
      } else if (type === "FORFEIT") {
        await auctionService.forfeitWinnerPurchase(item.auctionId);
        addToast({
          type: "warning",
          title: "Đã hủy quyền mua SIM",
          message: `Hệ thống đã ghi nhận việc từ bỏ quyền mua cho SIM ${formatPhoneNumber(item.simPhoneNumber)} và xử phạt cọc theo quy chế.`,
        });
      } else if (type === "ACCEPT_RUNNER_UP") {
        await auctionService.acceptRunnerUpOffer(item.auctionId);
        addToast({
          type: "success",
          title: "Nhận quyền mua thành công",
          message: `Bạn đã chấp thuận nhận quyền mua SIM ${formatPhoneNumber(item.simPhoneNumber)} với mức giá Á Quân. Vui lòng hoàn tất thanh toán!`,
        });
      } else if (type === "REJECT_RUNNER_UP") {
        await auctionService.rejectRunnerUpOffer(item.auctionId);
        addToast({
          type: "info",
          title: "Đã từ chối nhận mua",
          message: `Bạn đã từ chối nhận quyền mua SIM ${formatPhoneNumber(item.simPhoneNumber)}. Tiền cọc sẽ được hoàn trả đầy đủ.`,
        });
      } else if (type === "SELLER_APPROVE") {
        await auctionService.sellerDecideRunnerUp(item.auctionId, true);
        addToast({
          type: "success",
          title: "Đã phê duyệt bán cho Á Quân",
          message: `Bạn đã chấp thuận bán SIM ${formatPhoneNumber(item.simPhoneNumber)} cho Á Quân. Hệ thống đang cấp thời hạn thanh toán cho người mua.`,
        });
      } else if (type === "SELLER_REJECT") {
        await auctionService.sellerDecideRunnerUp(item.auctionId, false);
        addToast({
          type: "info",
          title: "Đã từ chối bán cho Á Quân",
          message: `Phiên đấu giá được kết thúc. Bạn nhận được tiền bồi thường từ quỹ phạt cọc của Winner ban đầu.`,
        });
      }

      // Refresh data
      setActiveActionModal(null);
      await fetchData(true);
    } catch (err: any) {
      addToast({
        type: "error",
        title: "Thao tác không thành công",
        message: err.message || "Đã xảy ra lỗi khi xử lý. Vui lòng thử lại sau.",
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  // ─── Urgent Settlements Filtered by Role ──────────────────────────────────
  const urgentSettlements = useMemo(() => {
    if (role === "buyer") {
      return pendingSettlements.filter((s) => s.role === "WINNER" || s.role === "RUNNER_UP");
    } else {
      return pendingSettlements.filter((s) => s.role === "SELLER");
    }
  }, [pendingSettlements, role]);

  return (
    <div className="space-y-6">
      {/* ── 1. Header Toolbar & Context Summary ── */}
      <div className="bg-white border border-slate-200/90 rounded-[20px] p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-[#001743] text-white flex items-center justify-center shadow-xs">
                <Gavel size={20} />
              </div>
              <div>
                <h1 className="text-lg font-black text-[#001743] tracking-tight">
                  Quản lý Phiên Đấu Giá
                </h1>
                <p className="text-xs text-slate-500">
                  Đối soát và giám sát hoạt động đấu giá SIM với 2 vai trò: Người mua trả giá & Người bán chủ phiên
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            <button
              type="button"
              onClick={() => fetchData(true)}
              disabled={loading || refreshing}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/90 rounded-[10px] text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
              title="Làm mới dữ liệu từ máy chủ"
            >
              <RefreshCw size={13} className={refreshing ? "animate-spin text-[#001743]" : ""} />
              <span>{refreshing ? "Đang đồng bộ..." : "Làm mới"}</span>
            </button>

            {role === "seller" ? (
              <button
                type="button"
                onClick={() => onNavigateTab ? onNavigateTab("auctions") : null}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#E4011E] hover:bg-[#C00119] text-white rounded-[10px] text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-98"
              >
                <Plus size={15} strokeWidth={2.5} />
                <span>Tạo phiên mới</span>
              </button>
            ) : (
              <Link
                href="/auctions"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#001743] hover:bg-[#00266B] text-white rounded-[10px] text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-98"
              >
                <Sparkles size={14} className="text-amber-400" />
                <span>Khám phá SIM đấu giá</span>
              </Link>
            )}
          </div>
        </div>

        {/* ── 2. Tactile Dual-Role Switcher ── */}
        <div className="grid grid-cols-2 p-1.5 bg-slate-100/90 rounded-[14px] border border-slate-200/80 gap-1.5">
          {/* Nút Người Mua */}
          <button
            type="button"
            onClick={() => setRole("buyer")}
            className={`flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-[10px] text-xs font-extrabold transition-all cursor-pointer ${
              role === "buyer"
                ? "bg-white text-[#001743] shadow-xs border border-slate-200/60"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
            }`}
          >
            <ShoppingBag size={16} className={role === "buyer" ? "text-[#E4011E]" : "text-slate-400"} />
            <span>Tôi Tham Gia Trả Giá (Người Mua)</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
                role === "buyer"
                  ? "bg-[#001743] text-white"
                  : "bg-slate-200 text-slate-700"
              }`}
            >
              {buyerAuctions.length}
            </span>
            {pendingSettlements.some((s) => s.role === "WINNER" || s.role === "RUNNER_UP") && (
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping shrink-0" />
            )}
          </button>

          {/* Nút Người Bán */}
          <button
            type="button"
            onClick={() => setRole("seller")}
            className={`flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-[10px] text-xs font-extrabold transition-all cursor-pointer ${
              role === "seller"
                ? "bg-white text-[#001743] shadow-xs border border-slate-200/60"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
            }`}
          >
            <Tag size={16} className={role === "seller" ? "text-emerald-600" : "text-slate-400"} />
            <span>Tôi Tạo Đấu Giá (Chủ Phiên)</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
                role === "seller"
                  ? "bg-[#001743] text-white"
                  : "bg-slate-200 text-slate-700"
              }`}
            >
              {sellerAuctions.length}
            </span>
            {pendingSettlements.some((s) => s.role === "SELLER") && (
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping shrink-0" />
            )}
          </button>
        </div>
      </div>

      {/* ── 3. Urgent Action Callout: Cần bạn xử lý quyết định / Thanh toán ── */}
      {urgentSettlements.length > 0 && (
        <div className="p-5 bg-gradient-to-r from-amber-500/10 via-amber-50 to-orange-50 border-2 border-amber-300 rounded-[20px] shadow-sm space-y-4 animate-fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-amber-200/80">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center font-bold shadow-xs">
                <Flame size={18} className="animate-pulse" />
              </div>
              <div>
                <h3 className="text-xs font-black text-amber-950 uppercase tracking-wider">
                  Yêu Cầu Hành Động Khẩn Cấp ({urgentSettlements.length})
                </h3>
                <p className="text-[11px] text-amber-800">
                  {role === "buyer"
                    ? "Bạn đang có phiên đấu giá cần hoàn tất thanh toán hoặc quyết định nhận mua Á Quân trước hạn chót."
                    : "Người thắng cuộc đã bỏ cọc. Bạn cần xác nhận có đồng ý chuyển nhượng sang Á Quân hay không."}
                </p>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-200 text-amber-900 font-mono">
              Hạn chót đang đếm ngược
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {urgentSettlements.map((item) => {
              const isWinner = item.role === "WINNER";
              const isRunnerUp = item.role === "RUNNER_UP";
              const isSeller = item.role === "SELLER";
              const hasDeficit = item.deficitAmount > 0;

              return (
                <div
                  key={item.auctionId}
                  className="p-4 bg-white rounded-[16px] border border-amber-200 shadow-2xs space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2.5">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-mono text-base font-black text-[#001743] block">
                          {formatPhoneNumber(item.simPhoneNumber)}
                        </span>
                        <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-slate-500 font-medium">
                          <span>Mã: <strong>{item.auctionCode}</strong></span>
                          <span>&bull;</span>
                          <span>{item.carrierName}</span>
                        </div>
                      </div>

                      <span
                        className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                          isWinner
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                            : isRunnerUp
                            ? "bg-blue-100 text-blue-800 border border-blue-300"
                            : "bg-purple-100 text-purple-800 border border-purple-300"
                        }`}
                      >
                        {isWinner
                          ? "🏆 Người Thắng Cuộc"
                          : isRunnerUp
                          ? "🥈 Á Quân Được Mua"
                          : "⚖️ Chủ Phiên Duyệt Á Quân"}
                      </span>
                    </div>

                    {/* Breakdown Chi Tiết Tiền Tệ */}
                    <div className="p-3 bg-slate-50 rounded-[12px] border border-slate-200/80 space-y-1.5 text-xs">
                      {isWinner && (
                        <>
                          <div className="flex justify-between text-slate-600">
                            <span>Giá chốt trúng:</span>
                            <span className="font-mono font-bold text-[#001743]">
                              {formatVND(item.finalPrice)}
                            </span>
                          </div>
                          <div className="flex justify-between text-slate-600">
                            <span>Đã khấu trừ tiền cọc:</span>
                            <span className="font-mono font-bold text-emerald-600">
                              -{formatVND(item.depositLocked)}
                            </span>
                          </div>
                          <div className="flex justify-between pt-1 border-t border-slate-200 font-bold text-[#001743]">
                            <span>Số tiền cần thanh toán nốt:</span>
                            <span className="font-mono text-sm text-[#E4011E]">
                              {formatVND(item.remainingPaymentRequired)}
                            </span>
                          </div>
                        </>
                      )}

                      {isRunnerUp && (
                        <>
                          <div className="flex justify-between text-slate-600">
                            <span>Giá chuyển nhượng Á Quân:</span>
                            <span className="font-mono font-bold text-[#001743]">
                              {formatVND(item.finalPrice)}
                            </span>
                          </div>
                          <div className="flex justify-between text-slate-600">
                            <span>Đã khấu trừ tiền cọc:</span>
                            <span className="font-mono font-bold text-emerald-600">
                              -{formatVND(item.depositLocked)}
                            </span>
                          </div>
                          <div className="flex justify-between pt-1 border-t border-slate-200 font-bold text-[#001743]">
                            <span>Số tiền cần thanh toán nếu nhận:</span>
                            <span className="font-mono text-sm text-[#001743]">
                              {formatVND(item.remainingPaymentRequired)}
                            </span>
                          </div>
                        </>
                      )}

                      {isSeller && (
                        <>
                          <div className="flex justify-between text-slate-600">
                            <span>Giá chốt ban đầu (Winner bùng):</span>
                            <span className="font-mono line-through text-slate-400">
                              {formatVND(item.finalPrice)}
                            </span>
                          </div>
                          <div className="flex justify-between pt-1 border-t border-slate-200 font-bold text-[#001743]">
                            <span>Á Quân đề xuất nhận mua:</span>
                            <span className="font-mono text-sm text-emerald-700">
                              {formatVND(item.runnerUpFinalPrice || 0)}
                            </span>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Deficit Warning nếu thiếu tiền */}
                    {hasDeficit && (isWinner || isRunnerUp) && (
                      <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-[10px] flex items-center justify-between text-xs text-rose-900">
                        <div className="flex items-center gap-1.5 font-medium">
                          <AlertTriangle size={14} className="text-rose-600 shrink-0" />
                          <span>Ví thiếu <strong>{formatVND(item.deficitAmount)}</strong></span>
                        </div>
                        {onOpenDeposit && (
                          <button
                            type="button"
                            onClick={onOpenDeposit}
                            className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-md text-[11px] font-bold shadow-2xs transition-all cursor-pointer"
                          >
                            Nạp ví ngay
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Footer Action Buttons */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1 text-[11px] text-amber-900 font-medium">
                      <Clock size={13} className="text-amber-600" />
                      <span>{formatRemaining(item.deadline).text}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {isWinner && (
                        <>
                          <button
                            type="button"
                            disabled={actionLoadingId === item.auctionId}
                            onClick={() =>
                              setActiveActionModal({ item, type: "FORFEIT" })
                            }
                            className="px-2.5 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-[8px] text-xs font-semibold transition-all cursor-pointer"
                          >
                            Bỏ quyền mua
                          </button>
                          <button
                            type="button"
                            disabled={actionLoadingId === item.auctionId || hasDeficit}
                            onClick={() =>
                              setActiveActionModal({ item, type: "PAY" })
                            }
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-[8px] text-xs font-bold shadow-xs transition-all cursor-pointer disabled:opacity-50"
                          >
                            {actionLoadingId === item.auctionId ? "Đang xử lý..." : "Thanh toán ngay"}
                          </button>
                        </>
                      )}

                      {isRunnerUp && (
                        <>
                          <button
                            type="button"
                            disabled={actionLoadingId === item.auctionId}
                            onClick={() =>
                              setActiveActionModal({ item, type: "REJECT_RUNNER_UP" })
                            }
                            className="px-2.5 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-[8px] text-xs font-semibold transition-all cursor-pointer"
                          >
                            Từ chối
                          </button>
                          <button
                            type="button"
                            disabled={actionLoadingId === item.auctionId || hasDeficit}
                            onClick={() =>
                              setActiveActionModal({ item, type: "ACCEPT_RUNNER_UP" })
                            }
                            className="px-3 py-1.5 bg-[#001743] hover:bg-[#00266B] text-white rounded-[8px] text-xs font-bold shadow-xs transition-all cursor-pointer disabled:opacity-50"
                          >
                            {actionLoadingId === item.auctionId ? "Đang xử lý..." : "Nhận mua SIM"}
                          </button>
                        </>
                      )}

                      {isSeller && (
                        <>
                          <button
                            type="button"
                            disabled={actionLoadingId === item.auctionId}
                            onClick={() =>
                              setActiveActionModal({ item, type: "SELLER_REJECT" })
                            }
                            className="px-2.5 py-1.5 border border-slate-200 hover:bg-slate-50 text-rose-700 rounded-[8px] text-xs font-semibold transition-all cursor-pointer"
                          >
                            Từ chối & nhận phạt cọc
                          </button>
                          <button
                            type="button"
                            disabled={actionLoadingId === item.auctionId}
                            onClick={() =>
                              setActiveActionModal({ item, type: "SELLER_APPROVE" })
                            }
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-[8px] text-xs font-bold shadow-xs transition-all cursor-pointer"
                          >
                            {actionLoadingId === item.auctionId ? "Đang xử lý..." : "Duyệt bán cho Á Quân"}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── 4. Bộ Lọc Trạng Thái & Thanh Tìm Kiếm ── */}
      <div className="bg-white border border-slate-200/90 rounded-[18px] p-4 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Status Filter Chips */}
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: "ALL", label: "Tất cả phiên" },
              { id: "ACTIVE", label: "Đang diễn ra" },
              { id: "SCHEDULE", label: "Sắp mở" },
              { id: "END", label: "Đã kết thúc" },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setStatusFilter(f.id as StatusFilter)}
                className={`px-3 py-1.5 rounded-[10px] text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === f.id
                    ? "bg-[#001743] text-white shadow-xs"
                    : "bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200/70"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative min-w-[240px]">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo số SIM hoặc Mã phiên..."
              className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-[10px] font-medium text-[#001743] focus:bg-white focus:border-[#001743] focus:outline-none transition-all placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── 5. Danh Sách Các Phiên Đấu Giá (Cards Grid) ── */}
      {loading ? (
        <div className="p-12 text-center bg-white border border-slate-200/90 rounded-[20px] space-y-3">
          <RefreshCw size={24} className="animate-spin text-[#001743] mx-auto" />
          <p className="text-xs font-semibold text-slate-500">Đang đồng bộ dữ liệu phiên đấu giá từ hệ thống...</p>
        </div>
      ) : activeList.length === 0 ? (
        <div className="p-12 text-center bg-white border border-slate-200/90 rounded-[20px] space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            {role === "buyer" ? <ShoppingBag size={28} /> : <Tag size={28} />}
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-sm font-black text-[#001743]">
              {role === "buyer"
                ? "Chưa có phiên đấu giá nào bạn đã tham gia"
                : "Chưa có phiên đấu giá nào do bạn tạo"}
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
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#001743] hover:bg-[#00266B] text-white rounded-full text-xs font-bold shadow-xs transition-all"
              >
                <span>Khám phá phòng đấu giá</span>
                <ArrowRight size={14} />
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => onNavigateTab ? onNavigateTab("auctions") : null}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#E4011E] hover:bg-[#C00119] text-white rounded-full text-xs font-bold shadow-xs transition-all cursor-pointer"
              >
                <Plus size={15} />
                <span>Tạo phiên đấu giá ngay</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {activeList.map((item) => {
            const isDutch =
              item.auctionType === "DUTCH" || String(item.auctionType) === "1";
            const isActive =
              item.auctionStatus === "ACTIVE" || String(item.auctionStatus) === "2";
            const isSchedule =
              item.auctionStatus === "SCHEDULE" || String(item.auctionStatus) === "1";
            const isEnded =
              item.auctionStatus === "END" ||
              String(item.auctionStatus) === "3" ||
              item.auctionStatus === "CANCELLED" ||
              String(item.auctionStatus) === "4";
            const timeInfo = formatRemaining(item.endAt);

            return (
              <div
                key={item.id}
                className="bg-white border border-slate-200/90 hover:border-[#001743]/40 rounded-[20px] p-5 shadow-2xs hover:shadow-sm transition-all duration-200 flex flex-col justify-between group space-y-4"
              >
                <div className="space-y-3.5">
                  {/* Top Bar: Code, Type, Carrier, Status */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-extrabold text-[#001743] bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200/60">
                        {item.auctionCode}
                      </span>
                      <CarrierMiniBadge carrier={item.carrierName} />
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                          isDutch
                            ? "bg-amber-50 text-amber-800 border-amber-200"
                            : "bg-slate-100 text-slate-700 border-slate-200"
                        }`}
                      >
                        {isDutch ? "Hà Lan" : "Kiểu Anh"}
                      </span>
                    </div>

                    {/* Status Badge */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {isActive && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                          Đang diễn ra
                        </span>
                      )}
                      {isSchedule && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-800 border border-blue-200">
                          Sắp mở
                        </span>
                      )}
                      {isEnded && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-100 text-slate-600 border border-slate-200">
                          Đã chốt
                        </span>
                      )}
                    </div>
                  </div>

                  {/* SIM Number Hero */}
                  <div>
                    <Link
                      href={`/auctions/${item.id}`}
                      className="font-mono text-xl sm:text-2xl font-black text-[#001743] group-hover:text-[#E4011E] transition-colors tracking-tight inline-block"
                    >
                      {formatPhoneNumber(item.simPhoneNumber)}
                    </Link>
                  </div>

                  {/* Financial & Bid Metrics */}
                  <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50/80 rounded-[14px] border border-slate-200/70 text-xs">
                    <div>
                      <span className="text-[11px] text-slate-500 block">
                        {isEnded ? "Giá chốt phiên:" : "Giá hiện tại:"}
                      </span>
                      <span className="font-mono text-sm font-black text-[#001743] block">
                        {formatVND(item.currentPrice || item.startingPrice)}
                      </span>
                    </div>

                    <div>
                      <span className="text-[11px] text-slate-500 block">Giá khởi điểm:</span>
                      <span className="font-mono text-xs font-semibold text-slate-700 block">
                        {formatVND(item.startingPrice)}
                      </span>
                    </div>

                    <div className="pt-1.5 border-t border-slate-200/60 flex items-center gap-1.5 text-[11px] text-slate-600">
                      <Gavel size={12} className="text-slate-400" />
                      <span>Tổng: <strong>{item.totalBids || 0} lượt trả</strong></span>
                    </div>

                    <div className="pt-1.5 border-t border-slate-200/60 flex items-center gap-1.5 text-[11px] text-slate-600">
                      <ShieldCheck size={12} className="text-emerald-600" />
                      <span>Cọc: <strong>{formatVND(item.depositAmount)}</strong></span>
                    </div>
                  </div>
                </div>

                {/* Card Footer: Time Countdown & Enter Button */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <Clock size={13} className={isActive ? "text-amber-500" : "text-slate-400"} />
                    <span className="font-medium text-[11px]">
                      {isActive
                        ? timeInfo.text
                        : isSchedule
                        ? `Mở lúc: ${formatDate(item.startAt)}`
                        : `Đóng: ${formatDate(item.endAt)}`}
                    </span>
                  </div>

                  <Link
                    href={`/auctions/${item.id}`}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#001743] hover:bg-[#00266B] text-white rounded-lg text-xs font-bold shadow-2xs hover:shadow-xs transition-all active:scale-98"
                  >
                    <span>{role === "buyer" ? "Vào phòng đấu giá" : "Theo dõi phiên"}</span>
                    <ChevronRight size={14} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── 6. Modal Xác Nhận Quyết Định / Thanh Toán Khẩn Cấp ── */}
      {activeActionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-[24px] max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <AlertCircle size={20} className="text-[#001743]" />
                <h3 className="font-extrabold text-[#001743] text-sm">Xác nhận thao tác</h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveActionModal(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-700 leading-relaxed">
              <p>
                Bạn đang thực hiện thao tác trên phiên đấu giá SIM{" "}
                <strong className="text-[#001743] font-mono">
                  {formatPhoneNumber(activeActionModal.item.simPhoneNumber)}
                </strong>{" "}
                (Mã: {activeActionModal.item.auctionCode}).
              </p>

              {activeActionModal.type === "PAY" && (
                <div className="p-3 bg-emerald-50 rounded-[12px] border border-emerald-200 text-emerald-950 space-y-1">
                  <div className="font-bold">Xác nhận thanh toán số tiền còn lại:</div>
                  <div className="font-mono text-base font-black text-emerald-700">
                    {formatVND(activeActionModal.item.remainingPaymentRequired)}
                  </div>
                  <p className="text-[11px] text-emerald-800">
                    Số tiền này sẽ được trừ trực tiếp từ số dư ví khả dụng của bạn để đưa vào quỹ ký quỹ bảo đảm.
                  </p>
                </div>
              )}

              {activeActionModal.type === "FORFEIT" && (
                <div className="p-3 bg-rose-50 rounded-[12px] border border-rose-200 text-rose-950 space-y-1">
                  <div className="font-bold text-rose-800">CẢNH BÁO MẤT TIỀN CỌC:</div>
                  <p className="text-[11px] leading-normal">
                    Khi bạn từ bỏ quyền mua, số tiền cọc{" "}
                    <strong>{formatVND(activeActionModal.item.depositLocked)}</strong> sẽ bị tịch thu bồi thường cho bên bán và sàn theo Quy chế hoạt động TrustSim.
                  </p>
                </div>
              )}

              {activeActionModal.type === "ACCEPT_RUNNER_UP" && (
                <div className="p-3 bg-blue-50 rounded-[12px] border border-blue-200 text-blue-950 space-y-1">
                  <div className="font-bold">Chấp nhận nhận quyền mua Á Quân:</div>
                  <p className="text-[11px]">
                    Bạn sẽ trở thành người trúng đấu giá chính thức với mức giá đề xuất{" "}
                    <strong>{formatVND(activeActionModal.item.finalPrice)}</strong>.
                  </p>
                </div>
              )}

              {activeActionModal.type === "REJECT_RUNNER_UP" && (
                <div className="p-3 bg-slate-50 rounded-[12px] border border-slate-200 text-slate-800 space-y-1">
                  <div className="font-bold">Từ chối nhận mua:</div>
                  <p className="text-[11px]">
                    Hệ thống sẽ hoàn trả 100% tiền cọc của bạn về ví chính thức ngay sau khi xác nhận.
                  </p>
                </div>
              )}

              {activeActionModal.type === "SELLER_APPROVE" && (
                <div className="p-3 bg-emerald-50 rounded-[12px] border border-emerald-200 text-emerald-950 space-y-1">
                  <div className="font-bold">Đồng ý bán cho Á Quân:</div>
                  <p className="text-[11px]">
                    SIM sẽ được chuyển nhượng cho Á Quân với mức giá{" "}
                    <strong>{formatVND(activeActionModal.item.runnerUpFinalPrice || 0)}</strong>.
                  </p>
                </div>
              )}

              {activeActionModal.type === "SELLER_REJECT" && (
                <div className="p-3 bg-amber-50 rounded-[12px] border border-amber-200 text-amber-950 space-y-1">
                  <div className="font-bold">Từ chối bán cho Á Quân:</div>
                  <p className="text-[11px]">
                    Phiên đấu giá sẽ kết thúc. Bạn sẽ nhận khoản bồi thường thiệt hại được trích từ tiền phạt cọc của người thắng ban đầu.
                  </p>
                </div>
              )}
            </div>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setActiveActionModal(null)}
                disabled={actionLoadingId !== null}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-full text-xs font-semibold transition-all cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmAction}
                disabled={actionLoadingId !== null}
                className={`px-5 py-2 text-white rounded-full text-xs font-bold transition-all shadow-xs cursor-pointer ${
                  activeActionModal.type === "FORFEIT" || activeActionModal.type === "SELLER_REJECT"
                    ? "bg-rose-600 hover:bg-rose-700"
                    : "bg-[#001743] hover:bg-[#00266B]"
                }`}
              >
                {actionLoadingId ? "Đang xử lý..." : "Xác nhận thực hiện"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
