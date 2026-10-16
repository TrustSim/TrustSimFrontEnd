/* Hallmark · genre: modern-minimal · style: High-Trust Financial Settlement & Checkout Terminal · role: auction-settlement-payment */
"use client";

import React, { useState, useEffect, use, useMemo, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import {
  auctionService,
  AuctionDto,
  AuctionResultDto,
  PendingSettlementDto,
} from "@/services/auctionService";
import { walletService } from "@/services/walletService";
import { authService } from "@/services/authService";
import { tradeService } from "@/services/tradeService";
import type { TradeTransactionDto } from "@/types/trade";
import { WalletDto } from "@/types/wallet";
import { formatPhoneNumber, getCarrierColor } from "@/services/simService";
import { ToastContainer, ToastMessage } from "@/components/ui/Toast";
import { DepositModal } from "@/components/wallet/DepositModal";
import {
  ArrowLeft,
  Award,
  Trophy,
  Clock,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  RefreshCw,
  Wallet,
  ExternalLink,
  Info,
  Lock,
  ArrowRight,
  Sparkles,
  Check,
  CreditCard,
  FileCheck2,
  FileText,
} from "lucide-react";

/* ─── Realistic Microchip Gold Sim Component ───────────────────────────── */
function SimMicrochip() {
  return (
    <svg
      width="36"
      height="28"
      viewBox="0 0 48 38"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0"
    >
      <defs>
        <linearGradient
          id="chipBorderPayment"
          x1="0"
          y1="0"
          x2="48"
          y2="38"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#FDE68A" />
          <stop offset="45%" stopColor="#D97706" />
          <stop offset="100%" stopColor="#78350F" />
        </linearGradient>
        <linearGradient
          id="chipBgPayment"
          x1="0"
          y1="0"
          x2="48"
          y2="38"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#B45309" />
          <stop offset="50%" stopColor="#78350F" />
          <stop offset="100%" stopColor="#451A03" />
        </linearGradient>
        <linearGradient id="padGradPayment" x1="0" y1="0" x2="0" y2="100%">
          <stop offset="0%" stopColor="#FEF08A" />
          <stop offset="35%" stopColor="#FBBF24" />
          <stop offset="100%" stopColor="#D97706" />
        </linearGradient>
      </defs>
      <rect
        x="0.75"
        y="0.75"
        width="46.5"
        height="36.5"
        rx="5.5"
        fill="url(#chipBgPayment)"
        stroke="url(#chipBorderPayment)"
        strokeWidth="1.5"
      />
      <rect x="4.5" y="4.5" width="10" height="7.5" rx="2" fill="url(#padGradPayment)" />
      <rect x="19" y="4.5" width="10" height="7.5" rx="2" fill="url(#padGradPayment)" />
      <rect x="33.5" y="4.5" width="10" height="7.5" rx="2" fill="url(#padGradPayment)" />
      <rect x="4.5" y="15" width="10" height="8" rx="2" fill="url(#padGradPayment)" />
      <rect x="18" y="15" width="12" height="8" rx="4" fill="url(#padGradPayment)" />
      <rect x="33.5" y="15" width="10" height="8" rx="2" fill="url(#padGradPayment)" />
      <rect x="4.5" y="26" width="10" height="7.5" rx="2" fill="url(#padGradPayment)" />
      <rect x="19" y="26" width="10" height="7.5" rx="2" fill="url(#padGradPayment)" />
      <rect x="33.5" y="26" width="10" height="7.5" rx="2" fill="url(#padGradPayment)" />
    </svg>
  );
}

function formatVND(val?: number | null): string {
  if (val === undefined || val === null || isNaN(val)) return "0 ₫";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(val);
}

export default function AuctionPaymentTerminalPage({
  params,
}: {
  params: Promise<{ id: string }> | { id: string };
}) {
  const resolvedParams =
    typeof (params as any)?.then === "function"
      ? use(params as Promise<{ id: string }>)
      : (params as { id: string });
  const auctionId = resolvedParams.id;
  const router = useRouter();

  // ─── Data States ───────────────────────────────────────────────────────────
  const [auction, setAuction] = useState<AuctionDto | null>(null);
  const [wallet, setWallet] = useState<WalletDto | null>(null);
  const [settlement, setSettlement] = useState<PendingSettlementDto | null>(null);
  const [trade, setTrade] = useState<TradeTransactionDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // ─── Action & Modal States ─────────────────────────────────────────────────
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [forfeitModalOpen, setForfeitModalOpen] = useState(false);
  const [forfeitReason, setForfeitReason] = useState("");
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [runnerUpRejected, setRunnerUpRejected] = useState(false);

  const addToast = useCallback((toast: Omit<ToastMessage, "id">) => {
    const id = Date.now().toString() + Math.random().toString();
    setToasts((prev) => [...prev, { ...toast, id }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // ─── Fetch Data ────────────────────────────────────────────────────────────
  const fetchData = useCallback(
    async (isManualRefresh = false) => {
      if (isManualRefresh) setRefreshing(true);
      else setLoading(true);

      try {
        const [auctionData, walletData, settlements, myTrades] = await Promise.all([
          auctionService.getAuctionById(auctionId),
          walletService.getMyWallet().catch(() => null),
          auctionService.getPendingSettlements().catch(() => []),
          tradeService.getMyTrades({ pageSize: 50 }).catch(() => null),
        ]);

        setAuction(auctionData);
        setWallet(walletData);

        const matched = settlements.find(
          (s: PendingSettlementDto) => s.auctionId === auctionId
        );
        // Luôn cập nhật settlement thành matched hoặc null để xóa state cũ khi đã quyết toán
        setSettlement(matched ?? null);

        const matchedTrade = myTrades?.items?.find(
          (t: TradeTransactionDto) => t.auctionId === auctionId
        );
        if (matchedTrade) {
          setTrade(matchedTrade);
        }
      } catch (err: any) {
        addToast({
          type: "error",
          title: "Tải dữ liệu thất bại",
          message: err.message || "Không thể tải thông tin thanh toán quyết toán.",
        });
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [auctionId, addToast]
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ─── Financial Calculations ────────────────────────────────────────────────
  const currentUser = authService.getUser();
  const currentUserId = currentUser?.userId || (currentUser as any)?.id;
  const isAuthor = Boolean(auction && currentUserId && auction.authorId === currentUserId);

  const result: AuctionResultDto | undefined = auction?.result;

  // Quyết định xem giao dịch đã được thanh toán / quyết toán hay chưa
  const isAlreadyPaid = Boolean(
    paymentSuccess ||
    result?.auctionResultStatus === "CONFIRMED" ||
    result?.auctionResultStatus === "SETTLED" ||
    result?.auctionResultStatus === 2 ||
    result?.auctionResultStatus === 4 ||
    Boolean(result?.settledAt) ||
    Boolean(trade)
  );

  // Quyết định vai trò: Winner vs Runner-up
  const isRunnerUp =
    settlement?.role === "RUNNER_UP" ||
    (result && currentUserId && result.runnerUpParticipantId === currentUserId) ||
    result?.winType === "RUNNER_UP_TAKEOVER" ||
    result?.winType === 1;

  // Giá mua áp dụng
  const purchasePrice = useMemo(() => {
    if (trade?.escrowAmount) return trade.escrowAmount;
    if (settlement?.finalPrice) return settlement.finalPrice;
    if (isRunnerUp && result?.runnerUpFinalPrice) return result.runnerUpFinalPrice;
    return result?.finalPrice || auction?.currentPrice || 0;
  }, [trade, settlement, isRunnerUp, result, auction]);

  // Tiền cọc đã cấn trừ
  const depositLocked = useMemo(() => {
    if (isAlreadyPaid) {
      return 0;
    }
    if (isRunnerUp) {
      // Á quân đã được hoàn cọc 100% khi phiên kết thúc ban đầu,
      // nên không còn khoản cọc nào bị phong toả để cấn trừ
      return settlement?.depositLocked ?? 0;
    }
    if (settlement?.depositLocked !== undefined) return settlement.depositLocked;
    return auction?.depositAmount || 0;
  }, [settlement, auction, isRunnerUp, isAlreadyPaid]);

  // Số tiền còn lại phải thanh toán
  const remainingPaymentRequired = useMemo(() => {
    if (isAlreadyPaid) return 0;
    if (settlement?.remainingPaymentRequired !== undefined) {
      return settlement.remainingPaymentRequired;
    }
    const val = purchasePrice - depositLocked;
    return val > 0 ? val : 0;
  }, [settlement, purchasePrice, depositLocked, isAlreadyPaid]);

  // Số dư ví khả dụng
  const availableBalance = wallet?.availableBalance ?? 0;

  // Số tiền còn thiếu trong ví
  const deficitAmount = useMemo(() => {
    if (isAlreadyPaid) return 0;
    if (availableBalance >= remainingPaymentRequired) return 0;
    return remainingPaymentRequired - availableBalance;
  }, [availableBalance, remainingPaymentRequired, isAlreadyPaid]);

  const canPay = deficitAmount === 0;

  // ─── Deadline Countdown ────────────────────────────────────────────────────
  const deadlineDateStr =
    settlement?.deadline ||
    result?.paymentDeadline ||
    result?.runnerUpPaymentDeadline;

  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);

  useEffect(() => {
    if (!deadlineDateStr || isAlreadyPaid) {
      setRemainingSeconds(null);
      return;
    }
    const target = new Date(deadlineDateStr).getTime();
    const updateTimer = () => {
      const diff = Math.floor((target - Date.now()) / 1000);
      setRemainingSeconds(diff > 0 ? diff : 0);
    };
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [deadlineDateStr, isAlreadyPaid]);

  const formattedCountdown = useMemo(() => {
    if (remainingSeconds === null || isAlreadyPaid) return null;
    if (remainingSeconds <= 0) return "Đã hết hạn thanh toán";
    const hours = Math.floor(remainingSeconds / 3600);
    const minutes = Math.floor((remainingSeconds % 3600) / 60);
    const secs = remainingSeconds % 60;
    return `${hours.toString().padStart(2, "0")}h ${minutes
      .toString()
      .padStart(2, "0")}m ${secs.toString().padStart(2, "0")}s`;
  }, [remainingSeconds, isAlreadyPaid]);

  const isExpired = remainingSeconds !== null && remainingSeconds <= 0 && !isAlreadyPaid;

  // ─── Handle Confirm Payment (Winner) ───────────────────────────────────────
  const handleConfirmPayment = async () => {
    if (!auction) return;
    if (!canPay) {
      setDepositModalOpen(true);
      return;
    }

    setActionLoading("PAY");
    try {
      await auctionService.confirmWinnerPayment(auction.id);
      setPaymentSuccess(true);
      addToast({
        type: "success",
        title: "Thanh toán thành công! 🎉",
        message: `Đã nạp ${formatVND(
          remainingPaymentRequired
        )} vào quỹ bảo chứng ký quỹ. Hợp đồng chuyển nhượng số đã được tạo lập!`,
      });
      await fetchData(true);
    } catch (err: any) {
      addToast({
        type: "error",
        title: "Thanh toán thất bại",
        message: err.message || "Không thể thực hiện thanh toán quyết toán.",
      });
    } finally {
      setActionLoading(null);
    }
  };

  // ─── Handle Runner Up: Accept Offer ───────────────────────────────────────
  const handleAcceptRunnerUp = async () => {
    if (!auction) return;
    setActionLoading("ACCEPT_RUNNER_UP");
    try {
      await auctionService.acceptRunnerUpOffer(auction.id);
      setPaymentSuccess(true);
      addToast({
        type: "success",
        title: "Đã chấp thuận mua SIM & Ký quỹ thành công! 🎉",
        message:
          "Hệ thống đã tự động cấn trừ ký quỹ từ ví khả dụng và khởi tạo hợp đồng chuyển nhượng số.",
      });
      await fetchData(true);
    } catch (err: any) {
      addToast({
        type: "error",
        title: "Thao tác thất bại",
        message: err.message || "Không thể chấp thuận quyền mua.",
      });
    } finally {
      setActionLoading(null);
    }
  };

  // ─── Handle Runner Up: Reject Offer ───────────────────────────────────────
  const handleRejectRunnerUp = async () => {
    if (!auction) return;
    setActionLoading("REJECT_RUNNER_UP");
    try {
      await auctionService.rejectRunnerUpOffer(auction.id);
      setRunnerUpRejected(true);
      addToast({
        type: "info",
        title: "Đã từ chối nhận mua",
        message: `Bạn đã từ chối nhận mua SIM ${formatPhoneNumber(
          auction.simPhoneNumber
        )}. Toàn bộ tiền cọc đã được hoàn trả về ví khả dụng của bạn!`,
      });
      await fetchData(true);
    } catch (err: any) {
      addToast({
        type: "error",
        title: "Thao tác thất bại",
        message: err.message || "Không thể từ chối nhận mua.",
      });
    } finally {
      setActionLoading(null);
    }
  };

  // ─── Handle Winner: Forfeit Purchase ──────────────────────────────────────
  const handleForfeit = async () => {
    if (!auction) return;
    setActionLoading("FORFEIT");
    try {
      await auctionService.forfeitWinnerPurchase(
        auction.id,
        forfeitReason.trim() || "Người mua chủ động từ bỏ quyền mua SIM"
      );
      setForfeitModalOpen(false);
      addToast({
        type: "warning",
        title: "Đã từ bỏ quyền mua SIM",
        message:
          "Hệ thống đã ghi nhận việc từ bỏ quyền mua. Tiền cọc đã được phân bổ bồi thường theo quy chế sàn.",
      });
      await fetchData(true);
    } catch (err: any) {
      addToast({
        type: "error",
        title: "Thao tác thất bại",
        message: err.message || "Không thể từ bỏ quyền mua.",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const carrierColor = getCarrierColor(auction?.carrierName || "Viettel");

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* ── Breadcrumb & Top Controls ── */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Link href="/" className="hover:text-[#001743] transition-colors font-medium">
              Trang chủ
            </Link>
            <span>/</span>
            <Link
              href="/profile?tab=bids"
              className="hover:text-[#001743] transition-colors font-medium"
            >
              Đang đấu giá
            </Link>
            <span>/</span>
            <Link
              href={`/auctions/${auctionId}`}
              className="hover:text-[#001743] transition-colors font-medium"
            >
              Phiên #{auction?.auctionCode || "AUC"}
            </Link>
            <span>/</span>
            <span className="text-[#001743] font-bold">Thanh toán quyết toán</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fetchData(true)}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 shadow-2xs transition-colors cursor-pointer"
            >
              <RefreshCw size={13} className={refreshing ? "animate-spin" : ""} />
              <span>Đồng bộ đối soát</span>
            </button>
            <Link
              href={`/auctions/${auctionId}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 shadow-2xs transition-colors"
            >
              <ArrowLeft size={13} />
              <span>Xem phòng đấu giá</span>
            </Link>
          </div>
        </div>

        {/* ── Loading Skeleton ── */}
        {loading ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center space-y-4 shadow-xs">
            <RefreshCw size={30} className="animate-spin mx-auto text-[#001743]" />
            <p className="text-sm font-bold text-slate-700">
              Đang khởi tạo cổng thanh toán & đối soát ký quỹ...
            </p>
          </div>
        ) : !auction ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-4 shadow-xs">
            <AlertTriangle size={36} className="text-amber-500 mx-auto" />
            <h2 className="text-lg font-black text-[#001743]">
              Không tìm thấy phiên đấu giá
            </h2>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Phiên đấu giá không tồn tại hoặc bạn không có quyền thanh toán phiên này.
            </p>
            <Link
              href="/profile?tab=bids"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[6px] bg-[#001743] text-white text-xs font-bold hover:bg-[#00266B] transition-colors"
            >
              Về danh mục đấu giá của tôi
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {/* ── SUCCESS STATE BANNER ── */}
            {isAlreadyPaid && (
              <div className="bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent border-l-4 border-emerald-500 p-5 rounded-r-2xl flex items-start gap-4 shadow-2xs">
                <CheckCircle2 size={24} className="text-emerald-600 shrink-0 mt-0.5" />
                <div className="space-y-2 flex-1">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <h3 className="font-extrabold text-base text-emerald-950 m-0">
                      Giao dịch đã được thanh toán & bảo chứng ký quỹ thành công! 🎉
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      Đã phong toả 100%
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed max-w-2xl">
                    Số tiền <strong>{formatVND(trade?.escrowAmount || purchasePrice)}</strong> đã được chuyển
                    vào tài khoản ký quỹ bảo vệ giao dịch của TrustSim. Hợp đồng chuyển nhượng SIM số hóa đã được
                    kích hoạt sẵn sàng để hai bên tiến hành ký kết điện tử.
                  </p>
                  <div className="flex items-center gap-3 pt-1 flex-wrap">
                    {trade ? (
                      <Link
                        href={`/trades/${trade.id}`}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#001743] hover:bg-[#00266B] text-white text-xs font-bold shadow-xs transition-colors"
                      >
                        <FileCheck2 size={15} />
                        <span>Vào ký hợp đồng chuyển nhượng #{trade.tradeTransactionCode}</span>
                        <ArrowRight size={14} />
                      </Link>
                    ) : (
                      <Link
                        href="/profile?tab=contracts"
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#001743] hover:bg-[#00266B] text-white text-xs font-bold shadow-xs transition-colors"
                      >
                        <FileCheck2 size={15} />
                        <span>Xem danh sách hợp đồng & giao dịch</span>
                        <ArrowRight size={14} />
                      </Link>
                    )}
                    <Link
                      href={`/auctions/${auctionId}`}
                      className="text-xs font-bold text-slate-600 hover:text-[#001743] hover:underline"
                    >
                      Về trang phiên đấu giá
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* ── RUNNER-UP REJECTED BANNER ── */}
            {runnerUpRejected && (
              <div className="bg-slate-100 border border-slate-200 p-5 rounded-2xl flex items-start gap-3">
                <XCircle size={20} className="text-slate-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-sm text-[#001743]">
                    Bạn đã từ chối nhận mua SIM
                  </h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Hệ thống đã ghi nhận việc từ chối nhận mua. Tiền cọc đã được bảo lưu hoặc hoàn trả về
                    ví khả dụng của bạn theo quy định.
                  </p>
                  <Link
                    href="/profile?tab=bids"
                    className="inline-flex items-center gap-1 mt-3 px-3.5 py-1.5 rounded-[6px] bg-[#001743] text-white text-xs font-bold"
                  >
                    Về danh mục đấu giá của tôi
                  </Link>
                </div>
              </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════════
                SPLIT-VIEW: 2 CỘT (7 COLS Hóa đơn & Ví | 5 COLS Thẻ SIM & Quyền lợi)
                ═══════════════════════════════════════════════════════════════════ */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* ── CỘT TRÁI (7 COLS): HÓA ĐƠN QUYẾT TOÁN & THANH TOÁN ── */}
              <div className="lg:col-span-7 space-y-5">
                <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-6">
                  {/* Header Settlement */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          isAlreadyPaid
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : isRunnerUp
                            ? "bg-purple-50 text-purple-700 border border-purple-200"
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}
                      >
                        {isAlreadyPaid ? (
                          <CheckCircle2 size={20} />
                        ) : isRunnerUp ? (
                          <Award size={20} />
                        ) : (
                          <Trophy size={20} />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-base font-black text-[#001743] m-0">
                            {isAlreadyPaid
                              ? "Quyết toán hoàn tất (Đã ký quỹ)"
                              : isRunnerUp
                              ? "Quyết toán tiếp quản SIM (Á Quân)"
                              : "Quyết toán trúng đấu giá SIM"}
                          </h2>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              isAlreadyPaid
                                ? "bg-emerald-100 text-emerald-900 border border-emerald-200"
                                : isRunnerUp
                                ? "bg-purple-100 text-purple-900 border border-purple-200"
                                : "bg-emerald-100 text-emerald-900 border border-emerald-200"
                            }`}
                          >
                            {isAlreadyPaid
                              ? "Đã nộp tiền bảo chứng"
                              : isRunnerUp
                              ? "Chuyển giao quyền mua"
                              : "Quán quân"}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 m-0 mt-0.5">
                          Phiên đấu giá #{auction.auctionCode}
                        </p>
                      </div>
                    </div>

                    {/* Countdown Timer */}
                    {formattedCountdown && !isAlreadyPaid && (
                      <div
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono font-bold shrink-0 ${
                          isExpired
                            ? "bg-rose-50 border-rose-200 text-rose-700"
                            : "bg-blue-50 border-blue-200 text-blue-900"
                        }`}
                      >
                        <Clock size={13} className="text-blue-700" />
                        <span>{formattedCountdown}</span>
                      </div>
                    )}
                  </div>

                  {/* ── BẢNG TÍNH HÓA ĐƠN CHI TIẾT ── */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Hóa đơn quyết toán tiền mua SIM
                    </h3>

                    <div className="rounded-xl border border-slate-200 overflow-hidden text-xs">
                      {/* Dòng 1: Giá mua SIM */}
                      <div className="p-3.5 bg-slate-50 flex items-center justify-between border-b border-slate-200">
                        <span className="text-slate-600 font-medium">
                          {isRunnerUp
                            ? "Mức giá đề xuất của bạn (Giá Á Quân):"
                            : "Mức giá trúng đấu giá chính thức:"}
                        </span>
                        <span className="font-mono font-bold text-[#001743] text-sm tabular-nums">
                          {formatVND(purchasePrice)}
                        </span>
                      </div>

                      {/* Dòng 2: Trừ tiền cọc bảo chứng đã đặt (chỉ hiện khi có cọc cấn trừ thực tế) */}
                      {depositLocked > 0 && (
                        <div className="p-3.5 bg-emerald-50/60 flex items-center justify-between border-b border-emerald-200">
                          <div className="flex items-center gap-1.5 text-emerald-900 font-medium">
                            <Lock size={14} className="text-emerald-600" />
                            <span>Tiền đặt cọc bảo chứng (Đã cấn trừ):</span>
                          </div>
                          <span className="font-mono font-bold text-emerald-700 tabular-nums">
                            -{formatVND(depositLocked)}
                          </span>
                        </div>
                      )}

                      {/* Dòng 3: SỐ TIỀN CÒN LẠI HOẶC TRẠNG THÁI ĐÃ TẤT TOÁN */}
                      {isAlreadyPaid ? (
                        <div className="p-4 bg-emerald-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-emerald-200">
                          <div>
                            <div className="text-xs font-black uppercase tracking-wider text-emerald-950 flex items-center gap-1.5">
                              <CheckCircle2 size={16} className="text-emerald-600" />
                              <span>Trạng thái thanh toán bảo chứng:</span>
                            </div>
                            <div className="text-[11px] text-emerald-700 mt-0.5">
                              Đã nộp 100% vào tài khoản ký quỹ TrustSim Escrow
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="font-mono text-xl font-black text-emerald-700 tabular-nums">
                              {formatVND(trade?.escrowAmount || purchasePrice)}
                            </div>
                            <div className="text-[11px] text-emerald-600 font-bold">
                              Đã phong toả bảo vệ an toàn
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <div className="text-xs font-black uppercase tracking-wider text-[#001743] flex items-center gap-1.5">
                              <Sparkles size={14} className="text-[#E4011E]" />
                              <span>Số tiền còn lại cần thanh toán:</span>
                            </div>
                            <div className="text-[11px] text-slate-400 mt-0.5">
                              {isRunnerUp
                                ? "Mức giá trả của Á quân nạp vào quỹ bảo chứng"
                                : "Giá mua SIM trừ đi khoản cọc ban đầu"}
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="font-mono text-xl font-black text-[#E4011E] tabular-nums">
                              {formatVND(remainingPaymentRequired)}
                            </div>
                            <div className="text-[11px] text-slate-400 font-medium">
                              Giữ an toàn trong quỹ ký quỹ trung gian
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ── KIỂM TRA SỐ DƯ VÍ (WALLET CHECK) ── */}
                  <div className="rounded-xl border border-slate-200 p-4 space-y-3 bg-slate-50/70">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <Wallet size={16} className="text-[#001743]" />
                        <span className="font-bold text-[#001743]">
                          Ví TrustSim cá nhân của bạn
                        </span>
                      </div>
                      <span className="font-mono text-sm font-black text-[#001743] tabular-nums">
                        {formatVND(availableBalance)}
                      </span>
                    </div>

                    {isAlreadyPaid ? (
                      <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center gap-2 text-xs text-emerald-800 font-medium">
                        <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                        <span>
                          Giao dịch này đã được tất toán thành công. Không cần nạp thêm tiền.
                        </span>
                      </div>
                    ) : canPay ? (
                      <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center gap-2 text-xs text-emerald-800 font-medium">
                        <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                        <span>
                          Số dư khả dụng trong ví <strong>đủ để thanh toán</strong> đơn hàng này.
                        </span>
                      </div>
                    ) : (
                      <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-900">
                        <div className="flex items-center gap-2">
                          <AlertTriangle size={18} className="text-amber-700 shrink-0" />
                          <div>
                            <span>Ví hiện đang thiếu: </span>
                            <strong className="font-mono text-sm text-[#E4011E]">
                              {formatVND(deficitAmount)}
                            </strong>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setDepositModalOpen(true)}
                          className="px-3.5 py-2 rounded-lg bg-[#E4011E] hover:bg-[#C90019] text-white font-bold transition-colors shadow-xs shrink-0 flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <CreditCard size={14} />
                          <span>Nạp thêm {formatVND(deficitAmount)}</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* ── ACTION BUTTONS ── */}
                  {isAlreadyPaid ? (
                    <div className="p-5 bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-200 rounded-2xl space-y-3">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
                        <h4 className="font-black text-sm text-emerald-950 m-0">
                          Thanh toán bảo chứng hoàn tất thành công! 🎉
                        </h4>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Số tiền <strong>{formatVND(trade?.escrowAmount || purchasePrice)}</strong> đã được phong toả an toàn vào tài khoản ký quỹ của sàn. Hợp đồng chuyển nhượng SIM số hoá đã sẵn sàng để bạn ký xác nhận.
                      </p>
                      <div className="pt-2 flex items-center gap-3 flex-wrap">
                        {trade ? (
                          <Link
                            href={`/trades/${trade.id}`}
                            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#001743] hover:bg-[#00266B] text-white text-xs font-bold shadow-md transition-all cursor-pointer"
                          >
                            <FileCheck2 size={16} />
                            <span>Vào trang giao dịch & Ký hợp đồng #{trade.tradeTransactionCode}</span>
                            <ArrowRight size={14} />
                          </Link>
                        ) : (
                          <Link
                            href="/profile?tab=contracts"
                            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#001743] hover:bg-[#00266B] text-white text-xs font-bold shadow-md transition-all cursor-pointer"
                          >
                            <FileCheck2 size={16} />
                            <span>Xem danh sách hợp đồng & giao dịch</span>
                            <ArrowRight size={14} />
                          </Link>
                        )}
                        <Link
                          href={`/auctions/${auctionId}`}
                          className="px-4 py-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 transition-colors"
                        >
                          Về phòng đấu giá
                        </Link>
                      </div>
                    </div>
                  ) : !runnerUpRejected ? (
                    <div className="space-y-3 pt-2">
                      {isRunnerUp && settlement?.actionRequired === "RESPOND_RUNNER_UP_OFFER" ? (
                        /* Trường hợp Á Quân được mời: Chấp thuận hoặc Từ chối */
                        <div className="flex flex-col sm:flex-row items-center gap-3">
                          <button
                            type="button"
                            disabled={actionLoading !== null || isExpired}
                            onClick={handleRejectRunnerUp}
                            className="w-full sm:w-1/2 py-3 px-4 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all disabled:opacity-50 text-center cursor-pointer"
                          >
                            {actionLoading === "REJECT_RUNNER_UP" ? (
                              <RefreshCw size={14} className="animate-spin mx-auto" />
                            ) : (
                              "❌ Từ chối mua (Không mất gì)"
                            )}
                          </button>

                          <button
                            type="button"
                            disabled={actionLoading !== null || isExpired || !canPay}
                            onClick={handleAcceptRunnerUp}
                            className={`w-full sm:w-1/2 py-3 px-4 rounded-xl text-white text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 ${
                              canPay
                                ? "bg-purple-700 hover:bg-purple-800 active:scale-[0.99]"
                                : "bg-slate-400 cursor-not-allowed"
                            }`}
                          >
                            {actionLoading === "ACCEPT_RUNNER_UP" ? (
                              <RefreshCw size={14} className="animate-spin" />
                            ) : (
                              <Award size={15} />
                            )}
                            <span>
                              {canPay
                                ? `🎉 Chấp thuận mua SIM (${formatVND(purchasePrice)})`
                                : `Ví thiếu ${formatVND(deficitAmount)} để nhận mua`}
                            </span>
                          </button>
                        </div>
                      ) : (
                        /* Trường hợp thanh toán trực tiếp (Quán quân hoặc Á quân chưa thanh toán) */
                        <div className="flex flex-col sm:flex-row items-center gap-3">
                          <button
                            type="button"
                            disabled={actionLoading !== null || isExpired}
                            onClick={() => setForfeitModalOpen(true)}
                            className="w-full sm:w-1/3 py-3 px-4 rounded-xl border border-slate-300 hover:bg-slate-100 text-rose-700 text-xs font-bold transition-all disabled:opacity-50 text-center cursor-pointer"
                          >
                            Từ bỏ quyền mua
                          </button>

                          <button
                            type="button"
                            disabled={actionLoading !== null || !canPay || isExpired}
                            onClick={handleConfirmPayment}
                            className={`w-full sm:w-2/3 py-3.5 px-4 rounded-xl text-white text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 ${
                              canPay
                                ? "bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99]"
                                : "bg-slate-400 cursor-not-allowed"
                            }`}
                          >
                            {actionLoading === "PAY" ? (
                              <RefreshCw size={15} className="animate-spin" />
                            ) : (
                              <CheckCircle2 size={16} />
                            )}
                            <span>
                              {canPay
                                ? `Xác nhận thanh toán ${formatVND(remainingPaymentRequired)}`
                                : "Vui lòng nạp thêm tiền để thanh toán"}
                            </span>
                          </button>
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>
              </div>

              {/* ── CỘT PHẢI (5 COLS): THẺ SIM & BẢO ĐẢM KÝ QUỸ ── */}
              <div className="lg:col-span-5 space-y-5">
                {/* ── THẺ SIM SANG TRỌNG ── */}
                <div className="bg-gradient-to-br from-[#001743] via-[#00266B] to-[#001743] rounded-2xl p-5 text-white shadow-md relative overflow-hidden border border-slate-700">
                  <div className="flex items-center justify-between mb-4">
                    <span
                      style={{ backgroundColor: carrierColor }}
                      className="px-2.5 py-1 rounded-[6px] text-xs font-black text-white uppercase tracking-wider font-mono shadow-xs"
                    >
                      {auction.carrierName}
                    </span>
                    <span className="text-[11px] font-mono font-bold text-slate-300 bg-white/10 px-2 py-0.5 rounded">
                      #{auction.auctionCode}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 my-3">
                    <SimMicrochip />
                    <div>
                      <div className="text-[11px] text-slate-300 font-mono uppercase tracking-wider">
                        Số thuê bao bàn giao
                      </div>
                      <div className="text-xl sm:text-2xl font-black font-mono tracking-tight text-white">
                        {formatPhoneNumber(auction.simPhoneNumber)}
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 mt-3 border-t border-white/15 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] text-slate-300 uppercase block font-mono">
                        {isAlreadyPaid
                          ? "Số tiền bảo chứng ký quỹ"
                          : isRunnerUp
                          ? "Giá tiếp quản Á Quân"
                          : "Giá trúng đấu giá"}
                      </span>
                      <span className="font-mono font-black text-amber-300 text-sm">
                        {formatVND(purchasePrice)}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-300 uppercase block font-mono">
                        Trạng thái
                      </span>
                      <span className="font-bold text-emerald-400 text-xs flex items-center gap-1 justify-end">
                        <ShieldCheck size={13} />
                        {isAlreadyPaid ? "Đã ký quỹ" : "Chờ quyết toán"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* ── BẢO ĐẢM PHÁP LÝ & KÝ QUỸ AN TOÀN ── */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
                  <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                    <ShieldCheck size={18} className="text-emerald-600" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#001743] m-0">
                      Bảo đảm an toàn từ TrustSim
                    </h3>
                  </div>

                  <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
                    <div className="flex items-start gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 font-bold text-[10px] mt-0.5">
                        1
                      </div>
                      <div>
                        <strong>Bảo chứng ký quỹ 100%:</strong> Tiền thanh toán được giữ tại tài khoản
                        trung gian của sàn, hoàn toàn không chuyển ngay cho Người Bán.
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 font-bold text-[10px] mt-0.5">
                        2
                      </div>
                      <div>
                        <strong>Ký hợp đồng chuyển nhượng điện tử:</strong> Hợp đồng số hóa có chứng thư
                        số PAdES được tạo lập tự động giữa Bên Mua, Bên Bán và Sàn TrustSim.
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 font-bold text-[10px] mt-0.5">
                        3
                      </div>
                      <div>
                        <strong>Hoàn tiền 100% nếu có tranh chấp:</strong> Nếu người bán không sang
                        tên hoặc SIM có tranh chấp với nhà mạng, bạn được hoàn trả 100% tiền mua và
                        tiền cọc.
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100">
                    <Link
                      href={`/auctions/${auctionId}`}
                      target="_blank"
                      className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 transition-colors"
                    >
                      <ExternalLink size={13} />
                      <span>Xem lại diễn biến phòng đấu giá</span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ── MODAL: TỪ BỎ QUYỀN MUA (FORFEIT) ── */}
      {forfeitModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4"
        >
          <div className="relative w-full max-w-md bg-white rounded-2xl border border-slate-200 p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle size={18} />
              </div>
              <div>
                <h3 className="text-sm font-black text-[#001743] m-0">
                  Xác nhận từ bỏ quyền mua SIM
                </h3>
                <p className="text-xs text-slate-500 m-0 mt-0.5">
                  Phiên #{auction?.auctionCode}
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900 leading-relaxed">
              <strong>Lưu ý chế tài:</strong> Khi từ bỏ quyền mua, toàn bộ tiền cọc bảo chứng{" "}
              <strong>{formatVND(depositLocked)}</strong> sẽ bị tịch thu để bồi thường thiệt hại cho
              Người Bán và chi phí vận hành sàn.
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Lý do từ bỏ (Tùy chọn):
              </label>
              <textarea
                value={forfeitReason}
                onChange={(e) => setForfeitReason(e.target.value)}
                placeholder="Ví dụ: Thay đổi nhu cầu cá nhân..."
                rows={3}
                className="w-full p-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#001743] focus:border-transparent resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setForfeitModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-xs font-bold text-slate-700 transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={actionLoading === "FORFEIT"}
                onClick={handleForfeit}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {actionLoading === "FORFEIT" && (
                  <RefreshCw size={13} className="animate-spin" />
                )}
                <span>Chấp nhận phạt cọc & Từ bỏ</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL NẠP TIỀN VIETQR SEPAY NHANH ── */}
      <DepositModal
        isOpen={depositModalOpen}
        onClose={() => {
          setDepositModalOpen(false);
          fetchData(true);
        }}
        onSuccess={() => {
          setDepositModalOpen(false);
          addToast({
            type: "success",
            title: "Nạp tiền thành công",
            message: "Số dư ví đã được cập nhật.",
          });
          fetchData(true);
        }}
      />

      <Footer />
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
}
