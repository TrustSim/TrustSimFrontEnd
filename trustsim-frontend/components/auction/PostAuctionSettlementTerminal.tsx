/* Hallmark · genre: modern-minimal · style: Clean High-Trust Banking & Escrow Settlement · role: post-auction-settlement-terminal */
"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Trophy,
  Award,
  Scale,
  Clock,
  AlertTriangle,
  CheckCircle2,
  X,
  ShieldCheck,
  RefreshCw,
  Wallet,
  Gavel,
  Lock,
  ArrowRight,
  TrendingDown,
  Info,
  BadgeAlert,
  HelpCircle,
  FileCheck2,
  AlertOctagon,
} from "lucide-react";
import {
  auctionService,
  AuctionDto,
  AuctionResultDto,
  PendingSettlementDto,
} from "@/services/auctionService";
import { AuthResponseDto } from "@/types/auth";
import { authService } from "@/services/authService";
import { ToastMessage } from "@/components/ui/Toast";
import { formatPhoneNumber } from "@/services/simService";

interface PostAuctionSettlementTerminalProps {
  auction: AuctionDto;
  currentUser: AuthResponseDto | null;
  isLoggedIn: boolean;
  mySettlement: PendingSettlementDto | null;
  onRefresh: () => Promise<void>;
  onOpenDeposit: (amount?: number) => void;
  addToast: (toast: Omit<ToastMessage, "id">) => void;
}

function formatVND(val?: number): string {
  if (val === undefined || val === null || isNaN(val)) return "0 ₫";
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(val);
}

function formatTime(isoStr?: string | null): string {
  if (!isoStr) return "—";
  try {
    const d = new Date(isoStr);
    return new Intl.DateTimeFormat("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(d);
  } catch {
    return isoStr;
  }
}

export default function PostAuctionSettlementTerminal({
  auction,
  currentUser,
  isLoggedIn,
  mySettlement,
  onRefresh,
  onOpenDeposit,
  addToast,
}: PostAuctionSettlementTerminalProps) {
  // ─── Modal States ──────────────────────────────────────────────────────────
  const [forfeitModalOpen, setForfeitModalOpen] = useState(false);
  const [forfeitReason, setForfeitReason] = useState("");
  const [forfeitAcknowledged, setForfeitAcknowledged] = useState(false);

  const [sellerRejectModalOpen, setSellerRejectModalOpen] = useState(false);
  const [sellerRejectReason, setSellerRejectReason] = useState("");

  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // ─── Real-time Countdown Timer for Pending Deadline ───────────────────────
  const deadlineDateStr = mySettlement?.deadline || auction.result?.paymentDeadline || auction.result?.runnerUpPaymentDeadline;
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);

  useEffect(() => {
    if (!deadlineDateStr) {
      setRemainingSeconds(null);
      return;
    }

    const targetTime = new Date(deadlineDateStr).getTime();
    const updateCountdown = () => {
      const diff = Math.floor((targetTime - Date.now()) / 1000);
      setRemainingSeconds(diff > 0 ? diff : 0);
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [deadlineDateStr]);

  const formattedCountdown = useMemo(() => {
    if (remainingSeconds === null) return null;
    if (remainingSeconds <= 0) return "ĐÃ HẾT HẠN";

    const hours = Math.floor(remainingSeconds / 3600);
    const mins = Math.floor((remainingSeconds % 3600) / 60);
    const secs = remainingSeconds % 60;

    if (hours > 0) {
      return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
    }
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }, [remainingSeconds]);

  const isUrgent = remainingSeconds !== null && remainingSeconds > 0 && remainingSeconds < 120;
  const isExpired = remainingSeconds !== null && remainingSeconds <= 0;

  // ─── Action Handlers ───────────────────────────────────────────────────────
  // 1. Quán quân hoàn tất thanh toán
  const handleWinnerPay = async () => {
    if (!mySettlement) return;
    if (mySettlement.deficitAmount > 0) {
      addToast({
        type: "warning",
        title: "Số dư không đủ",
        message: `Ví của bạn đang thiếu ${formatVND(mySettlement.deficitAmount)}. Vui lòng nạp thêm trước khi thanh toán.`,
      });
      onOpenDeposit(mySettlement.deficitAmount);
      return;
    }

    setActionLoading("PAY");
    try {
      await auctionService.confirmWinnerPayment(auction.id);
      addToast({
        type: "success",
        title: "Thanh toán thành công 🎉",
        message: `Bạn đã hoàn tất thanh toán số tiền còn lại cho SIM ${formatPhoneNumber(auction.simPhoneNumber)}. Hợp đồng chuyển nhượng đã được kích hoạt!`,
      });
      await onRefresh();
    } catch (err: any) {
      addToast({
        type: "error",
        title: "Thanh toán thất bại",
        message: err.message || "Đã xảy ra lỗi trong quá trình ký quỹ hợp đồng.",
      });
    } finally {
      setActionLoading(null);
    }
  };

  // 2. Quán quân chủ động từ bỏ mua (Phạt cọc 50/50)
  const handleExecuteForfeit = async () => {
    setActionLoading("FORFEIT");
    try {
      await auctionService.forfeitWinnerPurchase(auction.id, forfeitReason || "Người mua chủ động từ bỏ quyền mua");
      addToast({
        type: "warning",
        title: "Đã từ bỏ quyền mua SIM",
        message: "Hệ thống đã thực thi chế tài phạt cọc (50% bồi thường người bán, 50% nộp sàn) và chuyển quyền mua cho Á quân.",
      });
      setForfeitModalOpen(false);
      setForfeitReason("");
      setForfeitAcknowledged(false);
      await onRefresh();
    } catch (err: any) {
      addToast({
        type: "error",
        title: "Thao tác thất bại",
        message: err.message || "Không thể thực hiện từ bỏ quyền mua.",
      });
    } finally {
      setActionLoading(null);
    }
  };

  // 3. Người bán duyệt bán cho Á quân
  const handleSellerApproveRunnerUp = async () => {
    setActionLoading("APPROVE");
    try {
      await auctionService.sellerDecideRunnerUp(auction.id, true);
      addToast({
        type: "success",
        title: "Đã phê duyệt bán cho Á Quân",
        message: "Hệ thống đã chuyển quyền mua và gửi thông báo kích hoạt thanh toán tới Á Quân.",
      });
      await onRefresh();
    } catch (err: any) {
      addToast({
        type: "error",
        title: "Phê duyệt thất bại",
        message: err.message || "Không thể thực hiện phê duyệt Á Quân.",
      });
    } finally {
      setActionLoading(null);
    }
  };

  // 4. Người bán từ chối bán cho Á quân
  const handleSellerRejectRunnerUp = async () => {
    setActionLoading("REJECT");
    try {
      await auctionService.sellerDecideRunnerUp(auction.id, false, sellerRejectReason || "Người bán từ chối bán với mức giá này");
      addToast({
        type: "info",
        title: "Đã từ chối bán cho Á Quân",
        message: "Phiên đấu giá đã kết thúc. Bạn giữ nguyên khoản bồi thường thiệt hại từ quỹ phạt cọc của Quán quân ban đầu.",
      });
      setSellerRejectModalOpen(false);
      setSellerRejectReason("");
      await onRefresh();
    } catch (err: any) {
      addToast({
        type: "error",
        title: "Thao tác thất bại",
        message: err.message || "Không thể từ chối bán cho Á Quân.",
      });
    } finally {
      setActionLoading(null);
    }
  };

  // 5. Á quân chấp nhận mua SIM
  const handleAcceptRunnerUp = async () => {
    setActionLoading("ACCEPT");
    try {
      await auctionService.acceptRunnerUpOffer(auction.id);
      addToast({
        type: "success",
        title: "Chấp thuận nhận mua SIM 🎉",
        message: `Bạn đã trở thành chủ mới của SIM ${formatPhoneNumber(auction.simPhoneNumber)} với mức giá Á Quân. Hợp đồng chuyển nhượng đã kích hoạt!`,
      });
      await onRefresh();
    } catch (err: any) {
      addToast({
        type: "error",
        title: "Thao tác thất bại",
        message: err.message || "Không thể xác nhận nhận mua SIM.",
      });
    } finally {
      setActionLoading(null);
    }
  };

  // 6. Á quân từ chối nhận mua (Hoàn cọc 100%)
  const handleRejectRunnerUp = async () => {
    setActionLoading("DECLINE");
    try {
      await auctionService.rejectRunnerUpOffer(auction.id);
      addToast({
        type: "info",
        title: "Đã từ chối nhận mua",
        message: "Bạn đã từ chối quyền mua lại. Tiền đặt cọc của bạn đã được hoàn lại 100% về ví khả dụng.",
      });
      await onRefresh();
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

  // ─── Determine Which State / Role to Render ────────────────────────────────
  const result = auction.result;
  const isResultConfirmed = result?.auctionResultStatus === "CONFIRMED" || String(result?.auctionResultStatus) === "2";
  const isResultFailed = result?.auctionResultStatus === "FAILED" || String(result?.auctionResultStatus) === "3";
  const isResultShielding = result?.auctionResultStatus === "INVALIDATED_SHIELDING" || String(result?.auctionResultStatus) === "6";

  // Check role from mySettlement
  const isWinnerRole = mySettlement?.role === "WINNER";
  const isRunnerUpRole = mySettlement?.role === "RUNNER_UP";
  const isSellerRole = mySettlement?.role === "SELLER";

  return (
    <div className="space-y-4">
      {/* ═══════════════════════════════════════════════════════════════════════
          MODAL 1: XÁC NHẬN BỎ MUA SIM (PHẠT CỌC 50/50)
          ═══════════════════════════════════════════════════════════════════════ */}
      {forfeitModalOpen && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-rose-200 max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center shrink-0">
                  <AlertOctagon size={22} />
                </div>
                <div>
                  <h3 className="font-bold text-base text-rose-950">Xác Nhận Từ Bỏ Quyền Mua SIM</h3>
                  <p className="text-xs text-rose-700/80">Chế tài phạt cọc và chuyển nhượng quyền mua</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setForfeitModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-4 bg-rose-50/70 border border-rose-200/80 rounded-xl space-y-2.5 text-xs text-rose-950">
              <div className="font-bold flex items-center gap-1.5 text-rose-900">
                <AlertTriangle size={15} className="text-rose-600 shrink-0" />
                <span>Cơ chế xử phạt vi phạm cam kết đấu giá:</span>
              </div>
              <ul className="list-disc pl-5 space-y-1 text-slate-700 leading-relaxed">
                <li>
                  Toàn bộ tiền đặt cọc <strong>{formatVND(mySettlement?.depositLocked || auction.depositAmount)}</strong> sẽ bị <strong>tịch thu ngay lập tức</strong>.
                </li>
                <li>
                  <strong>50%</strong> ({formatVND((mySettlement?.depositLocked || auction.depositAmount) / 2)}) chuyển vào ví Người bán để bồi thường thiệt hại cơ hội.
                </li>
                <li>
                  <strong>50%</strong> ({formatVND((mySettlement?.depositLocked || auction.depositAmount) / 2)}) nộp vào Quỹ bảo đảm liêm chính của Sàn TrustSim.
                </li>
                <li>Quyền mua số SIM này sẽ được chuyển nhượng cho <strong>Á Quân (Runner-Up)</strong>.</li>
              </ul>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 block">Lý do từ bỏ quyền mua (Tùy chọn):</label>
              <textarea
                rows={2}
                value={forfeitReason}
                onChange={(e) => setForfeitReason(e.target.value)}
                placeholder="Nhập lý do (ví dụ: Thay đổi nhu cầu cá nhân, thiếu vốn...)"
                className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-rose-500 focus:bg-white transition-colors"
              />
            </div>

            <label className="flex items-start gap-2.5 text-xs text-slate-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={forfeitAcknowledged}
                onChange={(e) => setForfeitAcknowledged(e.target.checked)}
                className="mt-0.5 rounded border-slate-300 text-rose-600 focus:ring-rose-500"
              />
              <span className="leading-tight">
                Tôi hiểu rõ hành vi này là <strong>không thể đảo ngược</strong> và chấp nhận mất toàn bộ khoản tiền cọc theo Quy chế sàn.
              </span>
            </label>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setForfeitModalOpen(false)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors"
              >
                Giữ lại quyền mua
              </button>
              <button
                type="button"
                disabled={!forfeitAcknowledged || actionLoading === "FORFEIT"}
                onClick={handleExecuteForfeit}
                className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-[0.99] text-white text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {actionLoading === "FORFEIT" ? <RefreshCw size={14} className="animate-spin" /> : <AlertOctagon size={14} />}
                <span>{actionLoading === "FORFEIT" ? "Đang xử lý…" : "Chấp nhận phạt cọc & Bỏ mua"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          MODAL 2: SELLER TỪ CHỐI BÁN CHO Á QUÂN
          ═══════════════════════════════════════════════════════════════════════ */}
      {sellerRejectModalOpen && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center shrink-0">
                  <X size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-base text-[#001743]">Từ Chối Bán Cho Á Quân</h3>
                  <p className="text-xs text-slate-500">Đóng phiên đấu giá &amp; Giữ tiền bồi thường</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSellerRejectModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Nếu từ chối, phiên đấu giá sẽ kết thúc với kết quả không tìm được người mua. Số SIM được hoàn về kho của bạn.
              Khoản tiền phạt cọc 50% từ Quán quân đã chuyển vào ví của bạn vẫn được bảo lưu hoàn toàn.
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 block">Lý do từ chối (Gửi tới Á Quân):</label>
              <input
                type="text"
                value={sellerRejectReason}
                onChange={(e) => setSellerRejectReason(e.target.value)}
                placeholder="Ví dụ: Giá trả của Á Quân chưa đạt kỳ vọng..."
                className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#001743] focus:bg-white transition-colors"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSellerRejectModalOpen(false)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={actionLoading === "REJECT"}
                onClick={handleSellerRejectRunnerUp}
                className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-[0.99] text-white text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {actionLoading === "REJECT" ? <RefreshCw size={14} className="animate-spin" /> : <X size={14} />}
                <span>{actionLoading === "REJECT" ? "Đang xử lý…" : "Xác nhận từ chối"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          TRƯỜNG HỢP 1: QUÁN QUÂN (WINNER) - THANH TOÁN HOẶC BỎ MUA
          ═══════════════════════════════════════════════════════════════════════ */}
      {isWinnerRole && mySettlement && (
        <div className="bg-gradient-to-br from-white via-white to-amber-50/30 rounded-2xl border-2 border-amber-300 p-5 shadow-md space-y-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-amber-200/20 rounded-full blur-2xl pointer-events-none" />

          {/* Header Strip */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-amber-200/80 relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs shrink-0">
                <Trophy size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm text-[#001743] uppercase tracking-wide">
                    Bàn Quyết Toán Ký Quỹ · Bạn Đã Trúng Đấu Giá!
                  </h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                    Chờ tất toán
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Vui lòng hoàn tất thanh toán số tiền còn lại trong thời hạn ân hạn (Grace Period) để nhận hợp đồng điện tử.
                </p>
              </div>
            </div>

            {/* Countdown Badge */}
            {formattedCountdown && (
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-mono font-bold tabular-nums shrink-0 self-start sm:self-auto ${
                isUrgent ? "bg-rose-50 text-rose-700 border-rose-300 animate-pulse" : "bg-amber-100/80 text-amber-900 border-amber-300"
              }`}>
                <Clock size={14} className={isUrgent ? "text-rose-600 animate-spin" : "text-amber-700"} />
                <span>Còn: {formattedCountdown}</span>
              </div>
            )}
          </div>

          {/* Financial Ledger Breakdown */}
          <div className="bg-slate-50/90 rounded-xl p-4 border border-slate-200/80 space-y-2 text-xs relative z-10">
            <div className="flex justify-between items-center text-slate-600">
              <span>Giá chốt trúng đấu giá chính thức:</span>
              <span className="font-mono font-bold text-[#001743] text-sm tabular-nums">
                {formatVND(mySettlement.finalPrice)}
              </span>
            </div>
            <div className="flex justify-between items-center text-slate-600">
              <span className="flex items-center gap-1.5">
                <Lock size={12} className="text-emerald-600" />
                <span>Tiền đặt cọc bảo đảm đã khấu trừ:</span>
              </span>
              <span className="font-mono font-bold text-emerald-700 tabular-nums">
                -{formatVND(mySettlement.depositLocked)}
              </span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-slate-200 font-bold text-[#001743]">
              <span className="text-xs uppercase tracking-wide">Số tiền còn lại cần thanh toán:</span>
              <span className="font-mono text-base text-[#E4011E] tabular-nums">
                {formatVND(mySettlement.remainingPaymentRequired)}
              </span>
            </div>
            <div className="flex justify-between items-center text-slate-500 pt-1 text-[11px]">
              <span>Số dư khả dụng hiện có trong ví:</span>
              <span className="font-mono font-semibold text-slate-700 tabular-nums">
                {formatVND(mySettlement.availableBalance)}
              </span>
            </div>
          </div>

          {/* Deficit Alert Banner */}
          {mySettlement.deficitAmount > 0 && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-rose-900 relative z-10">
              <div className="flex items-start gap-2.5">
                <AlertTriangle size={16} className="text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">
                    Số dư ví hiện tại không đủ (Thiếu {formatVND(mySettlement.deficitAmount)})
                  </span>
                  <p className="text-[11px] text-rose-700 mt-0.5">
                    Hãy nạp bù số tiền còn thiếu trước khi thời hạn ân hạn kết thúc để không bị phạt cọc.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onOpenDeposit(mySettlement.deficitAmount)}
                className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 active:scale-[0.99] text-white rounded-xl text-xs font-bold shadow-xs transition-colors shrink-0 flex items-center justify-center gap-1.5"
              >
                <Wallet size={13} />
                <span>Nạp ngay {formatVND(mySettlement.deficitAmount)}</span>
              </button>
            </div>
          )}

          {/* Action Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 relative z-10">
            <button
              type="button"
              disabled={actionLoading !== null || isExpired}
              onClick={() => setForfeitModalOpen(true)}
              className="py-2.5 px-4 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-600 text-xs font-semibold transition-colors disabled:opacity-50 text-center"
            >
              Bỏ quyền mua (Chấp nhận phạt cọc)
            </button>

            <button
              type="button"
              disabled={mySettlement.deficitAmount > 0 || actionLoading === "PAY" || isExpired}
              onClick={handleWinnerPay}
              className={`py-3 px-6 rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 active:scale-[0.99] ${
                mySettlement.deficitAmount > 0 || isExpired
                  ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                  : "bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
              }`}
            >
              {actionLoading === "PAY" ? <RefreshCw size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
              <span>
                {mySettlement.deficitAmount > 0
                  ? `Ví chưa đủ tiền (Cần nạp thêm)`
                  : `Hoàn Tất Thanh Toán (${formatVND(mySettlement.remainingPaymentRequired)})`}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          TRƯỜNG HỢP 2: SELLER KHI QUÁN QUÂN BÙNG CỌC - MỜI DUYỆT Á QUÂN
          ═══════════════════════════════════════════════════════════════════════ */}
      {isSellerRole && mySettlement && (
        <div className="bg-gradient-to-br from-white via-white to-purple-50/40 rounded-2xl border-2 border-purple-300 p-5 shadow-md space-y-4 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-purple-200/80">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-xs shrink-0">
                <Scale size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm text-[#001743] uppercase tracking-wide">
                    Phê Duyệt Bán Cho Á Quân (Runner-Up Takeover)
                  </h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-900 border border-purple-200">
                    Chủ phiên
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Quán quân ban đầu đã vi phạm cam kết (bùng cọc). Bạn có quyền duyệt bán cho Á Quân hoặc từ chối để đóng phiên.
                </p>
              </div>
            </div>

            {formattedCountdown && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-purple-300 bg-purple-50 text-purple-900 text-xs font-mono font-bold tabular-nums shrink-0">
                <Clock size={14} className="text-purple-700" />
                <span>Hạn quyết định: {formattedCountdown}</span>
              </div>
            )}
          </div>

          {/* Financial Differential Card */}
          <div className="bg-slate-50/90 rounded-xl p-4 border border-slate-200/80 space-y-2.5 text-xs">
            <div className="flex justify-between items-center text-slate-500">
              <span>Giá thắng ban đầu (Quán quân đã vi phạm):</span>
              <span className="font-mono line-through text-slate-400 tabular-nums">
                {formatVND(mySettlement.finalPrice)}
              </span>
            </div>
            <div className="flex justify-between items-center text-slate-800 font-semibold">
              <span className="flex items-center gap-1.5 text-purple-900 font-bold">
                <Award size={14} className="text-purple-600" />
                <span>Mức giá Á Quân sẵn sàng mua:</span>
              </span>
              <span className="font-mono text-base font-black text-purple-700 tabular-nums">
                {formatVND(mySettlement.runnerUpFinalPrice || 0)}
              </span>
            </div>
            <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-emerald-800 text-[11px] bg-emerald-50/60 p-2.5 rounded-lg border border-emerald-200/70">
              <span className="flex items-center gap-1.5 font-medium">
                <ShieldCheck size={14} className="text-emerald-600" />
                <span>Tiền bồi thường phạt cọc đã nhận vào ví của bạn:</span>
              </span>
              <span className="font-mono font-bold text-emerald-700 tabular-nums">
                +{formatVND(auction.result?.sellerCompensationAmount || (auction.depositAmount / 2))}
              </span>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex items-center gap-3 pt-1">
            <button
              type="button"
              disabled={actionLoading !== null || isExpired}
              onClick={() => setSellerRejectModalOpen(true)}
              className="flex-1 py-3 px-4 rounded-xl border border-slate-200 hover:bg-slate-100 text-rose-700 text-xs font-bold transition-colors disabled:opacity-50 text-center"
            >
              🚫 Từ chối bán (Đóng phiên)
            </button>
            <button
              type="button"
              disabled={actionLoading === "APPROVE" || isExpired}
              onClick={handleSellerApproveRunnerUp}
              className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {actionLoading === "APPROVE" ? <RefreshCw size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
              <span>✅ Đồng ý bán cho Á Quân</span>
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          TRƯỜNG HỢP 3: Á QUÂN (RUNNER-UP) - ĐƯỢC CHUYỂN QUYỀN MUA
          ═══════════════════════════════════════════════════════════════════════ */}
      {isRunnerUpRole && mySettlement && (
        <div className="bg-gradient-to-br from-white via-white to-blue-50/40 rounded-2xl border-2 border-blue-300 p-5 shadow-md space-y-4 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-blue-200/80">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs shrink-0">
                <Award size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm text-[#001743] uppercase tracking-wide">
                    Quyền Mua SIM Đã Chuyển Sang Bạn (Á Quân)
                  </h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-900 border border-blue-200">
                    Cơ hội tiếp quản
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Người thắng ban đầu đã từ bỏ quyền mua. Người bán đã chấp thuận chuyển nhượng cho bạn theo mức giá bạn đã đặt.
                </p>
              </div>
            </div>

            {formattedCountdown && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-blue-300 bg-blue-50 text-blue-900 text-xs font-mono font-bold tabular-nums shrink-0">
                <Clock size={14} className="text-blue-700" />
                <span>Còn: {formattedCountdown}</span>
              </div>
            )}
          </div>

          {/* Pricing Details */}
          <div className="bg-slate-50/90 rounded-xl p-4 border border-slate-200/80 space-y-2 text-xs">
            <div className="flex justify-between items-center text-slate-600">
              <span>Mức giá chuyển nhượng của bạn (Giá đặt cao nhất):</span>
              <span className="font-mono font-bold text-[#001743] text-sm tabular-nums">
                {formatVND(mySettlement.finalPrice)}
              </span>
            </div>
            <div className="flex justify-between items-center text-slate-600">
              <span className="flex items-center gap-1.5">
                <Lock size={12} className="text-emerald-600" />
                <span>Tiền cọc ký quỹ đã cấn trừ:</span>
              </span>
              <span className="font-mono font-bold text-emerald-700 tabular-nums">
                -{formatVND(mySettlement.depositLocked)}
              </span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-slate-200 font-bold text-[#001743]">
              <span className="text-xs uppercase tracking-wide">Số tiền còn lại cần thanh toán:</span>
              <span className="font-mono text-base text-[#001743] tabular-nums">
                {formatVND(mySettlement.remainingPaymentRequired)}
              </span>
            </div>
          </div>

          {/* Deficit Alert */}
          {mySettlement.deficitAmount > 0 && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-xs text-amber-900">
              <div className="flex items-center gap-2">
                <AlertTriangle size={15} className="text-amber-700 shrink-0" />
                <span>Ví đang thiếu <strong>{formatVND(mySettlement.deficitAmount)}</strong></span>
              </div>
              <button
                type="button"
                onClick={() => onOpenDeposit(mySettlement.deficitAmount)}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-colors"
              >
                Nạp ngay {formatVND(mySettlement.deficitAmount)}
              </button>
            </div>
          )}

          {/* Assurance note */}
          <div className="p-3 bg-blue-50/60 border border-blue-200/60 rounded-xl text-[11px] text-blue-900 leading-relaxed flex items-start gap-2">
            <Info size={14} className="text-blue-600 shrink-0 mt-0.5" />
            <span>
              Cam kết không rủi ro: Nếu bạn <strong>Từ chối</strong>, tiền đặt cọc <strong>{formatVND(mySettlement.depositLocked)}</strong> sẽ được hoàn trả 100% về ví ngay lập tức mà không bị trừ bất kỳ chi phí nào.
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-1">
            <button
              type="button"
              disabled={actionLoading !== null || isExpired}
              onClick={handleRejectRunnerUp}
              className="flex-1 py-3 px-4 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-colors disabled:opacity-50 text-center"
            >
              ❌ Từ chối mua (Hoàn cọc 100%)
            </button>
            <button
              type="button"
              disabled={actionLoading === "ACCEPT" || isExpired}
              onClick={handleAcceptRunnerUp}
              className="flex-1 py-3 px-4 rounded-xl bg-[#001743] hover:bg-[#00266B] active:scale-[0.99] text-white text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {actionLoading === "ACCEPT" ? <RefreshCw size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
              <span>🤝 Chấp nhận mua SIM</span>
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          TRƯỜNG HỢP 4: THẺ THÔNG BÁO KẾT QUẢ ĐÃ CHỐT HOẶC KHÁCH XEM (AUDIT)
          ═══════════════════════════════════════════════════════════════════════ */}
      {!mySettlement && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          {/* Confirmed / Success */}
          {isResultConfirmed ? (
            <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs shrink-0">
                  <CheckCircle2 size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-emerald-950 uppercase tracking-wide">
                      {result?.winType === "RUNNER_UP_TAKEOVER" || String(result?.winType) === "2"
                        ? "🥈 Á Quân Tiếp Quản Mua Lại Thành Công"
                        : result?.winType === "DUTCH_BUY_NOW" || String(result?.winType) === "3"
                        ? "⚡ Mua Ngay Phiên Hà Lan Thành Công"
                        : "🏆 Giao Dịch Thành Công · Quán Quân Thắng Trực Tiếp"}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      Đã ký quỹ
                    </span>
                  </div>
                  <p className="text-xs text-emerald-800/90 mt-1 leading-relaxed">
                    Phiên đấu giá đã hoàn tất thanh toán hợp đồng chuyển nhượng số SIM <strong>{formatPhoneNumber(auction.simPhoneNumber)}</strong>.
                  </p>
                </div>
              </div>

              <div className="bg-white/90 p-3.5 rounded-lg border border-emerald-200/80 text-xs space-y-1.5">
                <div className="flex justify-between text-slate-600">
                  <span>Chủ sở hữu mới:</span>
                  <span className="font-bold text-[#001743]">
                    {result?.winnerFullName || result?.winnerUserName || "Người thắng"}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Mức giá chốt hợp đồng:</span>
                  <span className="font-mono font-bold text-emerald-700 text-sm tabular-nums">
                    {formatVND(result?.finalPrice || auction.currentPrice)}
                  </span>
                </div>
                {result?.confirmedAt && (
                  <div className="flex justify-between text-slate-500 text-[11px] pt-1 border-t border-slate-100">
                    <span>Thời điểm xác nhận:</span>
                    <span>{formatTime(result.confirmedAt)}</span>
                  </div>
                )}
                {(result?.winType === "RUNNER_UP_TAKEOVER" || String(result?.winType) === "2") && result?.initialWinnerUserName && (
                  <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                    * Ghi chú đối soát: Quán quân ban đầu <em>{result.initialWinnerUserName}</em> đã vi phạm thời hạn thanh toán và bị xử lý phạt cọc theo quy chế.
                  </div>
                )}
              </div>
            </div>
          ) : isResultShielding ? (
            /* Bid-Shielding Detected */
            <div className="p-4 bg-rose-50/70 border border-rose-200 rounded-xl space-y-2 text-xs text-rose-950">
              <div className="flex items-center gap-2 font-bold text-rose-900 text-sm">
                <AlertOctagon size={18} className="text-rose-600" />
                <span>Phiên Đấu Giá Bị Vô Hiệu Hóa (Phát Hiện Lá Chắn Giá)</span>
              </div>
              <p className="text-slate-600 leading-relaxed">
                Hệ thống liêm chính TrustSim đã phát hiện hành vi đẩy giá bất thường (tỷ lệ chênh lệch giá &gt; 1.5x) và người trúng cố tình bùng cọc.
                Để bảo vệ quyền lợi người mua và người bán, phiên đấu giá đã bị hủy.
              </p>
              <div className="p-2.5 bg-white/80 rounded border border-rose-100 text-[11px] text-slate-600">
                Lý do: {result?.cancelledReason || "Chênh lệch giá vượt ngưỡng an toàn bảo vệ sàn."}
              </div>
            </div>
          ) : isResultFailed ? (
            /* Failed Auction */
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
              <div className="flex items-center gap-2 font-bold text-slate-800 text-sm">
                <X size={18} className="text-rose-500" />
                <span>Phiên Đấu Giá Kết Thúc Thất Bại</span>
              </div>
              <p className="text-slate-600 leading-relaxed">
                {result?.cancelledReason || "Phiên đấu giá đã kết thúc mà không đạt điều kiện thanh toán hoặc không có người tham gia hợp lệ."}
              </p>
              <div className="p-2.5 bg-blue-50/70 rounded-lg border border-blue-200/70 text-[11px] text-blue-900 flex items-center gap-2">
                <ShieldCheck size={14} className="text-blue-600 shrink-0" />
                <span>Tiền cọc của những người tham gia hợp lệ đã được hoàn trả 100% vào ví khả dụng.</span>
              </div>
            </div>
          ) : (
            /* Pending Settlement by Other Parties */
            <div className="p-4 bg-amber-50/50 border border-amber-200 rounded-xl space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-amber-950 text-sm">
                  <Clock size={16} className="text-amber-600" />
                  <span>Phiên Đã Kết Thúc · Đang Đối Soát Quyết Toán</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900">
                  Chờ hoàn tất
                </span>
              </div>
              <p className="text-slate-600 leading-relaxed">
                Phiên đấu giá đang trong thời hạn ân hạn thanh toán ký quỹ giữa người trúng thầu và chủ phiên. Kết quả chính thức sẽ được công bố ngay khi hoàn tất hợp đồng.
              </p>
              <div className="p-2.5 bg-white rounded border border-amber-200/80 flex justify-between items-center">
                <span className="text-slate-500">Mức giá chốt gõ búa:</span>
                <span className="font-mono font-bold text-[#001743] tabular-nums">
                  {formatVND(auction.currentPrice)}
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
