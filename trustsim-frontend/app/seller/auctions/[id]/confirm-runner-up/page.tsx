/* Hallmark · genre: modern-minimal · style: High-Trust Financial Decision Terminal · role: seller-confirm-runner-up */
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
  BidDto,
  PendingSettlementDto,
} from "@/services/auctionService";
import { authService } from "@/services/authService";
import { formatPhoneNumber, getCarrierColor } from "@/services/simService";
import { ToastContainer, ToastMessage } from "@/components/ui/Toast";
import {
  ArrowLeft,
  Award,
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
  TrendingDown,
  Gavel,
  History,
  Lock,
  ArrowRight,
  Sparkles,
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
          id="chipBorderConfirm"
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
          id="chipBgConfirm"
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
        <linearGradient id="padGradConfirm" x1="0" y1="0" x2="0" y2="100%">
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
        fill="url(#chipBgConfirm)"
        stroke="url(#chipBorderConfirm)"
        strokeWidth="1.5"
      />
      <rect x="4.5" y="4.5" width="10" height="7.5" rx="2" fill="url(#padGradConfirm)" />
      <rect x="19" y="4.5" width="10" height="7.5" rx="2" fill="url(#padGradConfirm)" />
      <rect x="33.5" y="4.5" width="10" height="7.5" rx="2" fill="url(#padGradConfirm)" />
      <rect x="4.5" y="15" width="10" height="8" rx="2" fill="url(#padGradConfirm)" />
      <rect x="18" y="15" width="12" height="8" rx="4" fill="url(#padGradConfirm)" />
      <rect x="33.5" y="15" width="10" height="8" rx="2" fill="url(#padGradConfirm)" />
      <rect x="4.5" y="26" width="10" height="7.5" rx="2" fill="url(#padGradConfirm)" />
      <rect x="19" y="26" width="10" height="7.5" rx="2" fill="url(#padGradConfirm)" />
      <rect x="33.5" y="26" width="10" height="7.5" rx="2" fill="url(#padGradConfirm)" />
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

export default function SellerConfirmRunnerUpPage({
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

  const [auction, setAuction] = useState<AuctionDto | null>(null);
  const [bids, setBids] = useState<BidDto[]>([]);
  const [mySettlement, setMySettlement] = useState<PendingSettlementDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Action states
  const [actionLoading, setActionLoading] = useState<"APPROVE" | "REJECT" | null>(null);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [decisionCompleted, setDecisionCompleted] = useState<"APPROVED" | "REJECTED" | null>(null);

  const addToast = useCallback((toast: Omit<ToastMessage, "id">) => {
    const id = Date.now().toString() + Math.random().toString();
    setToasts((prev) => [...prev, { ...toast, id }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // ─── Fetch Auction & Data ──────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [auctionData, bidsData] = await Promise.all([
        auctionService.getAuctionById(auctionId),
        auctionService.getAuctionBids(auctionId, 15).catch(() => []),
      ]);
      setAuction(auctionData);
      setBids(bidsData);

      // Tra cứu Pending Settlement để lấy chính xác các mốc tài chính
      try {
        const settlements = await auctionService.getPendingSettlements();
        const matched = settlements.find(
          (s: PendingSettlementDto) => s.auctionId === auctionId
        );
        if (matched) setMySettlement(matched);
      } catch {
        // Fallback silently if not available
      }
    } catch (err: any) {
      addToast({
        type: "error",
        title: "Tải thông tin thất bại",
        message: err.message || "Không thể tải dữ liệu phiên đấu giá.",
      });
    } finally {
      setLoading(false);
    }
  }, [auctionId, addToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ─── Financial Calculations ────────────────────────────────────────────────
  const result: AuctionResultDto | undefined = auction?.result;

  const initialPrice =
    result?.initialWinningPrice ||
    result?.finalPrice ||
    auction?.currentPrice ||
    0;

  const runnerUpPrice =
    mySettlement?.runnerUpFinalPrice ||
    result?.runnerUpFinalPrice ||
    Math.round(initialPrice * 0.95);

  const compensation =
    result?.sellerCompensationAmount ||
    (auction?.depositAmount ? Math.round(auction.depositAmount / 2) : 500_000);

  const totalSellerRevenue = runnerUpPrice + compensation;
  const netDiff = totalSellerRevenue - initialPrice;
  const netDiffPercent =
    initialPrice > 0 ? ((netDiff / initialPrice) * 100).toFixed(1) : "0";

  // ─── Countdown Timer ───────────────────────────────────────────────────────
  const deadlineDateStr =
    mySettlement?.deadline ||
    result?.paymentDeadline ||
    result?.runnerUpPaymentDeadline;

  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);

  useEffect(() => {
    if (!deadlineDateStr) {
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
  }, [deadlineDateStr]);

  const formattedCountdown = useMemo(() => {
    if (remainingSeconds === null) return null;
    if (remainingSeconds <= 0) return "Đã hết hạn ra quyết định";
    const hours = Math.floor(remainingSeconds / 3600);
    const minutes = Math.floor((remainingSeconds % 3600) / 60);
    const secs = remainingSeconds % 60;
    return `${hours.toString().padStart(2, "0")}h ${minutes
      .toString()
      .padStart(2, "0")}m ${secs.toString().padStart(2, "0")}s`;
  }, [remainingSeconds]);

  const isExpired = remainingSeconds !== null && remainingSeconds <= 0;

  // ─── Handle Approve ────────────────────────────────────────────────────────
  const handleApprove = async () => {
    if (!auction) return;
    setActionLoading("APPROVE");
    try {
      await auctionService.sellerDecideRunnerUp(auction.id, true);
      setDecisionCompleted("APPROVED");
      addToast({
        type: "success",
        title: "Đã phê duyệt bán cho Á Quân 🎉",
        message:
          "Hệ thống đã kích hoạt thời hạn thanh toán cho Á Quân. Bạn sẽ nhận được thông báo ngay khi Á Quân nộp tiền ký quỹ.",
      });
      fetchData();
    } catch (err: any) {
      addToast({
        type: "error",
        title: "Phê duyệt thất bại",
        message: err.message || "Đã xảy ra lỗi trong quá trình phê duyệt.",
      });
    } finally {
      setActionLoading(null);
    }
  };

  // ─── Handle Reject ─────────────────────────────────────────────────────────
  const handleReject = async () => {
    if (!auction) return;
    setActionLoading("REJECT");
    try {
      await auctionService.sellerDecideRunnerUp(
        auction.id,
        false,
        rejectReason.trim() || "Người bán từ chối bán theo mức giá của Á Quân"
      );
      setDecisionCompleted("REJECTED");
      setRejectModalOpen(false);
      addToast({
        type: "info",
        title: "Đã từ chối chuyển nhượng cho Á Quân",
        message:
          "Phiên đấu giá đã chính thức đóng. Khoản tiền bồi thường phạt cọc vẫn thuộc về bạn và số SIM đã sẵn sàng mở phiên mới.",
      });
      fetchData();
    } catch (err: any) {
      addToast({
        type: "error",
        title: "Từ chối thất bại",
        message: err.message || "Đã xảy ra lỗi khi từ chối.",
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
        {/* ── Breadcrumb & Top Bar ── */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Link
              href="/"
              className="hover:text-[#001743] transition-colors font-medium"
            >
              Trang chủ
            </Link>
            <span>/</span>
            <Link
              href="/profile?tab=auctions"
              className="hover:text-[#001743] transition-colors font-medium"
            >
              Kho SIM sở hữu
            </Link>
            <span>/</span>
            <Link
              href={`/auctions/${auctionId}`}
              className="hover:text-[#001743] transition-colors font-medium"
            >
              Phiên #{auction?.auctionCode || "AUC"}
            </Link>
            <span>/</span>
            <span className="text-[#001743] font-bold">Xác nhận Á Quân</span>
          </div>

          <Link
            href={`/auctions/${auctionId}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 shadow-2xs transition-colors"
          >
            <ArrowLeft size={13} />
            <span>Quay lại trang đấu giá</span>
          </Link>
        </div>

        {/* ── Loading Skeleton ── */}
        {loading ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-4 shadow-xs">
            <RefreshCw
              size={28}
              className="animate-spin mx-auto text-[#001743]"
            />
            <p className="text-sm font-bold text-slate-700">
              Đang tải dữ liệu hồ sơ quyết định chuyển nhượng Á Quân...
            </p>
          </div>
        ) : !auction ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-4 shadow-xs">
            <AlertTriangle size={36} className="text-amber-500 mx-auto" />
            <h2 className="text-lg font-black text-[#001743]">
              Không tìm thấy phiên đấu giá
            </h2>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Phiên đấu giá không tồn tại hoặc bạn không có quyền truy cập hồ sơ
              này.
            </p>
            <Link
              href="/profile?tab=auctions"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[6px] bg-[#001743] text-white text-xs font-bold hover:bg-[#00266B] transition-colors"
            >
              Về danh sách SIM của tôi
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {/* ── Notification Banner: Context & Rule ── */}
            <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border-l-4 border-amber-500 p-4 rounded-r-xl flex items-start gap-3">
              <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs text-slate-700 leading-relaxed">
                <strong className="text-amber-900 font-bold block mb-0.5">
                  Quán quân ban đầu đã vi phạm nghĩa vụ nhận mua SIM
                </strong>
                Người trả giá cao nhất đã từ bỏ quyền mua hoặc quá thời hạn thanh
                toán. Hệ thống đã <strong>tịch thu 100% tiền cọc</strong> của
                người đó và <strong>chuyển ngay {formatVND(compensation)}</strong> bồi
                thường thiệt hại vào ví của bạn. Dưới đây là đề xuất chuyển nhượng
                cho người trả giá cao thứ nhì (Á Quân).
              </div>
            </div>

            {/* ── Success Banner if Already Decided ── */}
            {decisionCompleted === "APPROVED" && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 flex items-start gap-3 text-emerald-900 text-xs">
                <CheckCircle2 size={20} className="text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-sm text-emerald-900">
                    Bạn đã đồng ý bán SIM cho Á Quân!
                  </h4>
                  <p className="mt-1 text-emerald-800">
                    Á quân đã nhận được thông báo thanh toán số tiền còn lại.
                    Hợp đồng chuyển nhượng sẽ được kích hoạt ngay khi Á Quân hoàn
                    tất nộp tiền ký quỹ bảo chứng.
                  </p>
                  <Link
                    href={`/auctions/${auctionId}`}
                    className="inline-flex items-center gap-1 mt-3 px-3 py-1.5 rounded-[6px] bg-emerald-700 hover:bg-emerald-800 text-white font-bold transition-colors"
                  >
                    <span>Xem diễn biến phiên đấu giá</span>
                    <ArrowRight size={12} />
                  </Link>
                </div>
              </div>
            )}

            {decisionCompleted === "REJECTED" && (
              <div className="bg-slate-100 border border-slate-200 rounded-2xl p-5 flex items-start gap-3 text-slate-800 text-xs">
                <XCircle size={20} className="text-slate-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-sm text-[#001743]">
                    Bạn đã từ chối bán cho Á Quân
                  </h4>
                  <p className="mt-1 text-slate-600">
                    Phiên đấu giá đã chính thức kết thúc. Khoản tiền bồi thường
                    phạt cọc {formatVND(compensation)} vẫn được giữ nguyên trong ví
                    của bạn. SIM đã chuyển về kho cá nhân, sẵn sàng niêm yết mở
                    phiên mới.
                  </p>
                  <Link
                    href="/profile?tab=auctions"
                    className="inline-flex items-center gap-1 mt-3 px-3 py-1.5 rounded-[6px] bg-[#001743] hover:bg-[#00266B] text-white font-bold transition-colors"
                  >
                    <span>Về kho SIM sở hữu</span>
                    <ArrowRight size={12} />
                  </Link>
                </div>
              </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════════
                SPLIT-VIEW: 2 CỘT (60% Quyết định Tài chính | 40% Audit & Đối soát)
                ═══════════════════════════════════════════════════════════════════ */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* ── CỘT TRÁI (7 COLS): BẢNG QUYẾT ĐỊNH DÒNG TIỀN ── */}
              <div className="lg:col-span-7 space-y-5">
                <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-6">
                  {/* Header Decision Card */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 border border-purple-200 flex items-center justify-center shrink-0">
                        <Award size={20} />
                      </div>
                      <div>
                        <h2 className="text-base font-black text-[#001743] m-0">
                          Xác nhận chuyển nhượng cho Á Quân
                        </h2>
                        <p className="text-xs text-slate-500 m-0 mt-0.5">
                          Phiên đấu giá #{auction.auctionCode}
                        </p>
                      </div>
                    </div>

                    {/* Countdown Badge */}
                    {formattedCountdown && (
                      <div
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono font-bold shrink-0 ${
                          isExpired
                            ? "bg-rose-50 border-rose-200 text-rose-700"
                            : "bg-amber-50 border-amber-200 text-amber-900"
                        }`}
                      >
                        <Clock size={13} />
                        <span>{formattedCountdown}</span>
                      </div>
                    )}
                  </div>

                  {/* ── BẢNG TÍNH ĐỐI CHIẾU TÀI CHÍNH (High-Trust Ledger Table) ── */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Cân đối dòng tiền thực nhận của Người Bán
                    </h3>

                    <div className="rounded-xl border border-slate-200 overflow-hidden text-xs">
                      {/* Dòng 1: Giá Quán quân ban đầu (đã bị hủy) */}
                      <div className="p-3.5 bg-slate-50 flex items-center justify-between border-b border-slate-200">
                        <div className="flex items-center gap-2 text-slate-500">
                          <XCircle size={15} className="text-rose-500 shrink-0" />
                          <span>
                            Giá thắng Quán quân{" "}
                            <strong className="text-slate-400 font-normal">
                              (Đã vi phạm nghĩa vụ)
                            </strong>
                          </span>
                        </div>
                        <span className="font-mono line-through text-slate-400 tabular-nums">
                          {formatVND(initialPrice)}
                        </span>
                      </div>

                      {/* Dòng 2: Tiền đền bù cọc đã nhận vào ví */}
                      <div className="p-3.5 bg-emerald-50/70 flex items-center justify-between border-b border-emerald-200">
                        <div className="flex items-center gap-2 text-emerald-900 font-medium">
                          <Wallet size={15} className="text-emerald-600 shrink-0" />
                          <span>
                            Tiền bồi thường phạt cọc{" "}
                            <span className="text-[11px] text-emerald-700">
                              (Đã cộng vào ví của bạn)
                            </span>
                          </span>
                        </div>
                        <span className="font-mono font-bold text-emerald-700 tabular-nums">
                          +{formatVND(compensation)}
                        </span>
                      </div>

                      {/* Dòng 3: Giá Á quân sẵn sàng mua */}
                      <div className="p-3.5 bg-purple-50/50 flex items-center justify-between border-b border-purple-200">
                        <div className="flex items-center gap-2 text-purple-950 font-medium">
                          <Award size={15} className="text-purple-600 shrink-0" />
                          <span>Mức giá đề xuất của Á Quân</span>
                        </div>
                        <span className="font-mono font-black text-purple-700 text-sm tabular-nums">
                          {formatVND(runnerUpPrice)}
                        </span>
                      </div>

                      {/* Dòng TỔNG THỰC NHẬN */}
                      <div className="p-4 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <div className="text-xs font-black uppercase tracking-wider text-[#001743] flex items-center gap-1.5">
                            <Sparkles size={14} className="text-amber-500" />
                            <span>Tổng tiền bạn thực tế nhận được:</span>
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            Giá Á Quân + Tiền bồi thường phạt cọc
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="font-mono text-lg font-black text-[#001743] tabular-nums">
                            {formatVND(totalSellerRevenue)}
                          </div>
                          <div
                            className={`text-[11px] font-bold ${
                              netDiff >= 0
                                ? "text-emerald-700"
                                : "text-slate-500"
                            }`}
                          >
                            {netDiff >= 0
                              ? `(+${formatVND(netDiff)} cao hơn giá thắng ban đầu)`
                              : `(Chênh ${netDiffPercent}% so với giá Quán quân)`}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ── Policy Notes ── */}
                  <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 space-y-2 text-[11.5px] text-slate-600 leading-relaxed">
                    <div className="flex items-start gap-2">
                      <ShieldCheck
                        size={15}
                        className="text-emerald-600 shrink-0 mt-0.5"
                      />
                      <span>
                        <strong>Bảo đảm quyền lợi Người Bán:</strong> Nếu bạn
                        đồng ý, Á Quân sẽ có thời hạn 24 giờ để nộp toàn bộ số
                        tiền còn lại vào tài khoản ký quỹ. Nếu Á Quân cũng bỏ
                        cuộc, tiền cọc của Á Quân tiếp tục được phân bổ bồi thường
                        cho bạn.
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Info
                        size={15}
                        className="text-blue-600 shrink-0 mt-0.5"
                      />
                      <span>
                        Nếu bạn <strong>Từ chối bán</strong>, phiên đấu giá sẽ
                        đóng ngay. Khoản tiền bồi thường {formatVND(compensation)}{" "}
                        vẫn thuộc về bạn 100% và số SIM sẽ quay về kho để bạn tạo
                        phiên đấu giá mới.
                      </span>
                    </div>
                  </div>

                  {/* ── ACTION BUTTONS ── */}
                  {decisionCompleted ? (
                    <div className="p-3 bg-slate-50 rounded-xl text-center text-xs font-bold text-slate-600">
                      Quyết định của bạn đã được ghi nhận vào hệ thống.
                    </div>
                  ) : (
                    <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                      <button
                        type="button"
                        disabled={actionLoading !== null || isExpired}
                        onClick={() => setRejectModalOpen(true)}
                        className="w-full sm:w-1/2 py-3 px-4 rounded-xl border border-slate-300 hover:bg-slate-100 text-rose-700 hover:text-rose-800 text-xs font-bold transition-all disabled:opacity-50 text-center cursor-pointer"
                      >
                        🚫 Từ chối bán (Đóng phiên)
                      </button>

                      <button
                        type="button"
                        disabled={actionLoading !== null || isExpired}
                        onClick={handleApprove}
                        className="w-full sm:w-1/2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                      >
                        {actionLoading === "APPROVE" ? (
                          <RefreshCw size={15} className="animate-spin" />
                        ) : (
                          <CheckCircle2 size={15} />
                        )}
                        <span>✅ Đồng ý bán cho Á Quân</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* ── CỘT PHẢI (5 COLS): AUDIT SIM & LỊCH SỬ TRẢ GIÁ ── */}
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
                    <SimMicrochip />
                  </div>

                  <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-amber-300 drop-shadow-xs mb-1">
                    {formatPhoneNumber(auction.simPhoneNumber)}
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-300 font-medium">
                    <span>Mã phiên: {auction.auctionCode}</span>
                    <span>·</span>
                    <span>Loại: {auction.auctionType === "DUTCH" ? "Hà Lan" : "Đấu giá Anh"}</span>
                  </div>
                </div>

                {/* ── THẺ THÔNG TIN Á QUÂN & ĐỐI SOÁT ── */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <History size={15} className="text-[#001743]" />
                      <h3 className="font-bold text-xs uppercase tracking-wider text-[#001743] m-0">
                        Đối soát Á Quân & Các bước giá
                      </h3>
                    </div>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
                      Hợp lệ
                    </span>
                  </div>

                  {/* Thông tin Á quân */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-2 text-xs">
                    <div className="flex justify-between items-center text-slate-500">
                      <span>Người tham gia (Á Quân):</span>
                      <strong className="text-slate-800 font-mono">
                        {result?.runnerUpFullName ||
                          result?.runnerUpUserName ||
                          "Người tham gia #2"}
                      </strong>
                    </div>
                    <div className="flex justify-between items-center text-slate-500">
                      <span>Mức giá trả cao nhất:</span>
                      <strong className="text-purple-700 font-mono font-bold">
                        {formatVND(runnerUpPrice)}
                      </strong>
                    </div>
                    <div className="flex justify-between items-center text-slate-500">
                      <span>Tổng số lượt đấu giá:</span>
                      <strong className="text-slate-800 font-mono">
                        {auction.totalBids} lượt trả giá
                      </strong>
                    </div>
                  </div>

                  {/* Bids audit log */}
                  <div>
                    <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-2">
                      Các bước giá gần nhất của phiên
                    </h4>
                    {bids.length === 0 ? (
                      <div className="p-3 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
                        Không có dữ liệu lượt đặt giá
                      </div>
                    ) : (
                      <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                        {bids.slice(0, 5).map((b, idx) => (
                          <div
                            key={b.id || idx}
                            className={`p-2 rounded-lg border text-xs flex items-center justify-between ${
                              idx === 0
                                ? "bg-rose-50/50 border-rose-200 text-rose-900"
                                : idx === 1
                                ? "bg-purple-50/50 border-purple-200 text-purple-900"
                                : "bg-slate-50 border-slate-100 text-slate-600"
                            }`}
                          >
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="font-bold text-[10px] px-1 py-0.2 rounded bg-white border border-slate-200 shrink-0">
                                {idx === 0 ? "Quán quân" : idx === 1 ? "Á quân" : `#${idx + 1}`}
                              </span>
                              <span className="font-mono truncate">
                                {b.userNameMasked || "Thành viên"}
                              </span>
                            </div>
                            <span className="font-mono font-bold tabular-nums shrink-0 ml-2">
                              {formatVND(b.bidAmount)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Action Link to full auction */}
                  <div className="pt-2">
                    <Link
                      href={`/auctions/${auctionId}`}
                      target="_blank"
                      className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 transition-colors"
                    >
                      <ExternalLink size={13} />
                      <span>Mở phòng đấu giá đầy đủ</span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ── MODAL: TỪ CHỐI BÁN CHO Á QUÂN ── */}
      {rejectModalOpen && (
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
                  Xác nhận từ chối bán cho Á Quân
                </h3>
                <p className="text-xs text-slate-500 m-0 mt-0.5">
                  Đóng phiên đấu giá #{auction?.auctionCode}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Bạn đang quyết định từ chối chuyển nhượng SIM cho Á Quân. Bạn vẫn
              được <strong>giữ nguyên khoản bồi thường phạt cọc {formatVND(compensation)}</strong>.
              Số SIM sẽ được hoàn trả về kho cá nhân.
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Lý do từ chối (Ghi chú lưu hồ sơ):
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Ví dụ: Mức giá chưa đạt kỳ vọng của người bán..."
                rows={3}
                className="w-full p-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#001743] focus:border-transparent resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-xs font-bold text-slate-700 transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={actionLoading === "REJECT"}
                onClick={handleReject}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {actionLoading === "REJECT" && (
                  <RefreshCw size={13} className="animate-spin" />
                )}
                <span>Xác nhận từ chối</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
}
