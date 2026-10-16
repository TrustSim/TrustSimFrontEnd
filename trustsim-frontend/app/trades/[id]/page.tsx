/* TrustSim · Trang Chi Tiết Giao Dịch · High-Trust Banking Terminal */
"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { tradeService } from "@/services/tradeService";
import { authService } from "@/services/authService";
import type { TradeTransactionDto, TradeTransactionStatus, EscrowStatus } from "@/types/trade";
import { ToastContainer, ToastMessage } from "@/components/ui/Toast";
import {
  ArrowLeft, ShieldCheck, FileText, RefreshCw, CheckCircle2,
  Clock, AlertTriangle, XCircle, Lock, Unlock, Wallet,
  ChevronRight, Copy, Check, ExternalLink, FileSignature,
  Smartphone, User, BadgeCheck, ArrowRightLeft, Hourglass,
  CircleAlert, Flag, Scale, Info,
} from "lucide-react";

/* ─── Formatter ───────────────────────────────────────────── */
const fmt = (n?: number) =>
  n !== undefined && n !== null
    ? new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(n)
    : "—";

const fmtDate = (s?: string) => {
  if (!s) return "—";
  return new Date(s).toLocaleString("vi-VN", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
};

const fmtDateOnly = (s?: string) => {
  if (!s) return "—";
  return new Date(s).toLocaleDateString("vi-VN", {
    day: "2-digit", month: "2-digit", year: "numeric",
  });
};

const maskName = (name?: string) => {
  if (!name) return "—";
  if (name.length <= 3) return name[0] + "***";
  return name.slice(0, 2) + "***" + name.slice(-1);
};

/* ─── Trạng thái giao dịch ───────────────────────────────── */
type StepKey = "escrow" | "signature" | "transfer" | "done";

interface StepDef {
  key: StepKey;
  label: string;
  sublabel: string;
  icon: React.ReactNode;
}

const STEPS: StepDef[] = [
  {
    key: "escrow",
    label: "Ký quỹ",
    sublabel: "Người mua nạp tiền vào tài khoản ký quỹ bảo đảm",
    icon: <Wallet size={18} />,
  },
  {
    key: "signature",
    label: "Ký hợp đồng",
    sublabel: "Hai bên điện tử ký kết hợp đồng chuyển nhượng",
    icon: <FileSignature size={18} />,
  },
  {
    key: "transfer",
    label: "Sang tên SIM",
    sublabel: "Nhà mạng xác nhận sang tên chủ sở hữu SIM",
    icon: <Smartphone size={18} />,
  },
  {
    key: "done",
    label: "Giải ngân",
    sublabel: "Tiền ký quỹ được giải ngân về ví người bán",
    icon: <CheckCircle2 size={18} />,
  },
];

const statusToStep = (status: TradeTransactionStatus): { active: StepKey; isDone: boolean; isCancelled: boolean } => {
  switch (status) {
    case "PendingEscrow":    return { active: "escrow",    isDone: false, isCancelled: false };
    case "PendingSignature": return { active: "signature", isDone: false, isCancelled: false };
    case "PendingTransfer":  return { active: "transfer",  isDone: false, isCancelled: false };
    case "Completed":        return { active: "done",      isDone: true,  isCancelled: false };
    default:
      if (status?.startsWith("Cancelled") || status === "Disputed")
        return { active: "escrow", isDone: false, isCancelled: true };
      return { active: "escrow", isDone: false, isCancelled: false };
  }
};

const stepIndex = (key: StepKey) => STEPS.findIndex((s) => s.key === key);

const ESCROW_STATUS_MAP: Record<string, { label: string; color: string; bg: string; border: string }> = {
  PENDING_FUNDING: { label: "Chờ nạp tiền",   color: "#92400E", bg: "#FEF3C7", border: "#FDE68A" },
  HELD:           { label: "Đang giữ",         color: "#1D4ED8", bg: "#DBEAFE", border: "#BFDBFE" },
  FROZEN:         { label: "Đang đóng băng",   color: "#5B21B6", bg: "#EDE9FE", border: "#DDD6FE" },
  RELEASED:       { label: "Đã giải ngân",     color: "#065F46", bg: "#D1FAE5", border: "#A7F3D0" },
  REFUNDED:       { label: "Đã hoàn tiền",     color: "#374151", bg: "#F3F4F6", border: "#E5E7EB" },
  CANCELLED:      { label: "Đã huỷ",           color: "#991B1B", bg: "#FEE2E2", border: "#FECACA" },
};

const TRADE_STATUS_MAP: Record<string, { label: string; color: string; bg: string; border: string; icon: React.ReactNode }> = {
  PendingEscrow:            { label: "Chờ ký quỹ",      color: "#92400E", bg: "#FEF3C7", border: "#FDE68A", icon: <Hourglass size={13} /> },
  PendingSignature:         { label: "Chờ ký hợp đồng", color: "#1D4ED8", bg: "#DBEAFE", border: "#BFDBFE", icon: <FileSignature size={13} /> },
  PendingTransfer:          { label: "Chờ sang tên",    color: "#0F766E", bg: "#CCFBF1", border: "#99F6E4", icon: <ArrowRightLeft size={13} /> },
  Completed:                { label: "Hoàn thành",      color: "#065F46", bg: "#D1FAE5", border: "#A7F3D0", icon: <CheckCircle2 size={13} /> },
  Cancelled_EscrowTimeout:  { label: "Huỷ (hết giờ ký quỹ)",   color: "#991B1B", bg: "#FEE2E2", border: "#FECACA", icon: <XCircle size={13} /> },
  Cancelled_SigningTimeout: { label: "Huỷ (hết giờ ký HĐ)",    color: "#991B1B", bg: "#FEE2E2", border: "#FECACA", icon: <XCircle size={13} /> },
  Cancelled_TransferTimeout:{ label: "Huỷ (hết giờ sang tên)", color: "#991B1B", bg: "#FEE2E2", border: "#FECACA", icon: <XCircle size={13} /> },
  Cancelled_ByAdmin:        { label: "Huỷ bởi quản trị",        color: "#991B1B", bg: "#FEE2E2", border: "#FECACA", icon: <XCircle size={13} /> },
  Disputed:                 { label: "Đang tranh chấp",          color: "#92400E", bg: "#FEF3C7", border: "#FDE68A", icon: <Scale size={13} /> },
};

/* ─── Countdown hook ─────────────────────────────────────── */
function useCountdown(deadline?: string) {
  const [remaining, setRemaining] = useState<number>(0);

  useEffect(() => {
    if (!deadline) return;
    const update = () => {
      const diff = new Date(deadline).getTime() - Date.now();
      setRemaining(Math.max(0, diff));
    };
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, [deadline]);

  const h = Math.floor(remaining / 3_600_000);
  const m = Math.floor((remaining % 3_600_000) / 60_000);
  const s = Math.floor((remaining % 60_000) / 1000);
  const isExpired = remaining === 0;
  const isUrgent = remaining > 0 && remaining < 3_600_000;

  return { h, m, s, isExpired, isUrgent };
}

/* ─── Copy button ────────────────────────────────────────── */
function CopyText({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
      title="Sao chép"
    >
      {copied ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════════ */
export default function TradeDetailPage({
  params,
}: {
  params: Promise<{ id: string }> | { id: string };
}) {
  const resolvedParams =
    typeof (params as any)?.then === "function"
      ? use(params as Promise<{ id: string }>)
      : (params as { id: string });
  const tradeId = resolvedParams.id;
  const router = useRouter();

  const [trade, setTrade] = useState<TradeTransactionDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const addToast = (t: Omit<ToastMessage, "id">) => {
    const id = Date.now().toString();
    setToasts((p) => [...p, { ...t, id }]);
  };
  const removeToast = (id: string) => setToasts((p) => p.filter((t) => t.id !== id));

  const currentUser = authService.getUser();

  const loadTrade = async () => {
    setLoading(true);
    try {
      const data = await tradeService.getTradeById(tradeId);
      setTrade(data);
    } catch (err: any) {
      addToast({ type: "error", title: "Không tải được giao dịch", message: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadTrade(); }, [tradeId]);

  /* ─── Derived ─────────────────────────────────────────── */
  const { active, isDone, isCancelled } = trade
    ? statusToStep(trade.status)
    : { active: "escrow" as StepKey, isDone: false, isCancelled: false };

  const activeIdx = stepIndex(active);

  // Hạn chốt hiện tại
  const currentDeadline = (() => {
    if (!trade) return undefined;
    if (active === "escrow")    return trade.escrowDeadline;
    if (active === "signature") return trade.signingDeadline;
    if (active === "transfer")  return trade.transferDeadline;
    return undefined;
  })();

  const countdown = useCountdown(currentDeadline && !isDone && !isCancelled ? currentDeadline : undefined);

  const tradeStatusInfo = trade ? (TRADE_STATUS_MAP[trade.status] ?? { label: trade.status, color: "#374151", bg: "#F3F4F6", border: "#E5E7EB", icon: <Info size={13} /> }) : null;
  const escrowStatusInfo = trade ? (ESCROW_STATUS_MAP[trade.escrowStatus] ?? { label: trade.escrowStatus, color: "#374151", bg: "#F3F4F6", border: "#E5E7EB" }) : null;

  const isMyTrade = currentUser && trade && (currentUser.userId === trade.buyerId || currentUser.userId === trade.sellerId);
  const isBuyer = currentUser?.userId === trade?.buyerId;

  /* ─── Skeleton ─────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F1F5F9] flex flex-col">
        <Navbar />
        <main className="flex-1 pt-24 pb-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-5">
            <div className="h-8 w-48 bg-slate-200 rounded-lg animate-pulse" />
            <div className="h-64 bg-slate-200 rounded-2xl animate-pulse" />
            <div className="h-48 bg-slate-200 rounded-2xl animate-pulse" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!trade) {
    return (
      <div className="min-h-screen bg-[#F1F5F9] flex flex-col">
        <Navbar />
        <main className="flex-1 pt-24 pb-16 flex items-center justify-center">
          <div className="bg-white border border-slate-200 rounded-2xl p-16 text-center max-w-sm">
            <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-rose-200">
              <AlertTriangle size={24} />
            </div>
            <h2 className="text-base font-bold text-[#001743] mb-2">Không tìm thấy giao dịch</h2>
            <p className="text-xs text-slate-500 mb-6">Giao dịch này không tồn tại hoặc bạn không có quyền xem.</p>
            <Link href="/profile?tab=trades" className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#001743] hover:bg-[#00266B] text-white text-xs font-bold rounded-xl transition-colors">
              <ArrowLeft size={14} /><span>Quay về danh sách</span>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F1F5F9] text-slate-900 flex flex-col">
      <ToastContainer toasts={toasts} onClose={removeToast} />
      <Navbar />

      <main className="flex-1 pt-20 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-5">

          {/* ── Breadcrumb ── */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500">
            <div className="flex items-center gap-2 flex-wrap">
              <Link href="/" className="hover:text-[#001743] transition-colors">Trang chủ</Link>
              <span className="text-slate-300">/</span>
              <Link href="/profile?tab=trades" className="hover:text-[#001743] transition-colors">Giao dịch của tôi</Link>
              <span className="text-slate-300">/</span>
              <span className="text-[#001743] font-mono font-bold">{trade.tradeTransactionCode}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => loadTrade()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-all shadow-xs cursor-pointer"
              >
                <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
                <span>Làm mới</span>
              </button>
            </div>
          </div>

          {/* ── Header card ── */}
          <div className="bg-[#001743] rounded-2xl border border-[#0D2847] p-6 text-white shadow-xl relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none" />
            <div className="absolute -right-20 -top-20 w-[280px] h-[280px] rounded-full opacity-[0.04]" style={{ background: "radial-gradient(circle, #4F8EF7, transparent 70%)" }} />

            <div className="relative z-10">
              {/* Top row */}
              <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
                <div>
                  <div className="text-[11px] font-semibold text-slate-400 mb-1 uppercase tracking-wide">Mã giao dịch</div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-lg font-black text-white">{trade.tradeTransactionCode}</span>
                    <CopyText text={trade.tradeTransactionCode} />
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1 font-mono">Tạo lúc: {fmtDate(trade.createdDate)}</div>
                </div>

                {tradeStatusInfo && (
                  <span
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border"
                    style={{ color: tradeStatusInfo.color, backgroundColor: tradeStatusInfo.bg, borderColor: tradeStatusInfo.border }}
                  >
                    {tradeStatusInfo.icon}
                    {tradeStatusInfo.label}
                  </span>
                )}
              </div>

              {/* SIM Info */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-4 border-t border-white/10">
                <div>
                  <div className="text-[11px] text-slate-400 font-medium mb-1">Số SIM chuyển nhượng</div>
                  <div className="font-mono text-2xl font-black text-white tracking-tight">
                    {trade.simPhoneNumber
                      ? trade.simPhoneNumber.replace(/(\d{4})(\d{3})(\d{3})/, "$1 · $2 · $3")
                      : "—"}
                  </div>
                </div>
                <div className="sm:text-right">
                  <div className="text-[11px] text-slate-400 font-medium mb-1">Số tiền ký quỹ</div>
                  <div className="font-mono text-2xl font-black text-amber-300">{fmt(trade.escrowAmount)}</div>
                  {escrowStatusInfo && (
                    <span
                      className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold border"
                      style={{ color: escrowStatusInfo.color, backgroundColor: escrowStatusInfo.bg, borderColor: escrowStatusInfo.border }}
                    >
                      <Lock size={9} /> {escrowStatusInfo.label}
                    </span>
                  )}
                </div>
              </div>

              {/* Trust strip */}
              <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-white/10 text-xs text-slate-300 font-medium">
                <span className="flex items-center gap-1.5"><ShieldCheck size={13} className="text-emerald-400" />Ký quỹ bảo đảm</span>
                <span className="flex items-center gap-1.5"><FileSignature size={13} className="text-blue-400" />Hợp đồng điện tử</span>
                <span className="flex items-center gap-1.5"><BadgeCheck size={13} className="text-amber-400" />Sang tên chính chủ</span>
              </div>
            </div>
          </div>

          {/* ── Cảnh báo huỷ / tranh chấp ── */}
          {isCancelled && (
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <XCircle size={18} />
              </div>
              <div>
                <div className="font-bold text-sm text-rose-900 mb-0.5">Giao dịch đã bị huỷ</div>
                <p className="text-xs text-rose-700 leading-relaxed">
                  {trade.cancelledReason || "Giao dịch không hoàn thành trong thời hạn quy định. Tiền ký quỹ (nếu có) sẽ được hoàn về ví trong vài phút."}
                </p>
              </div>
            </div>
          )}

          {trade.status === "Disputed" && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <Scale size={18} />
              </div>
              <div>
                <div className="font-bold text-sm text-amber-900 mb-0.5">Đang trong quá trình xử lý tranh chấp</div>
                <p className="text-xs text-amber-800 leading-relaxed">
                  Giao dịch đang được bộ phận hỗ trợ TrustSim xem xét. Tiền ký quỹ được giữ an toàn trong khi chờ phán quyết.
                </p>
              </div>
            </div>
          )}

          {/* ── Đồng hồ hạn chót ── */}
          {!isDone && !isCancelled && trade.status !== "Disputed" && currentDeadline && (
            <div className={`rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border ${
              countdown.isExpired
                ? "bg-rose-50 border-rose-200"
                : countdown.isUrgent
                ? "bg-amber-50 border-amber-200"
                : "bg-blue-50 border-blue-200"
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  countdown.isExpired ? "bg-rose-100 text-rose-600" : countdown.isUrgent ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"
                }`}>
                  <Hourglass size={18} />
                </div>
                <div>
                  <div className={`text-xs font-bold ${countdown.isExpired ? "text-rose-900" : countdown.isUrgent ? "text-amber-900" : "text-blue-900"}`}>
                    {countdown.isExpired
                      ? "Đã hết thời hạn"
                      : active === "escrow"
                      ? "Hạn nạp ký quỹ còn lại:"
                      : active === "signature"
                      ? "Hạn ký hợp đồng còn lại:"
                      : "Hạn sang tên còn lại:"}
                  </div>
                  <div className={`text-[11px] font-mono mt-0.5 ${countdown.isExpired ? "text-rose-700" : countdown.isUrgent ? "text-amber-700" : "text-blue-700"}`}>
                    Hạn chót: {fmtDate(currentDeadline)}
                  </div>
                </div>
              </div>
              {!countdown.isExpired && (
                <div className="flex items-center gap-1.5 font-mono self-start sm:self-auto">
                  {[
                    { val: String(countdown.h).padStart(2, "0"), unit: "giờ" },
                    { val: String(countdown.m).padStart(2, "0"), unit: "phút" },
                    { val: String(countdown.s).padStart(2, "0"), unit: "giây" },
                  ].map((seg, i) => (
                    <React.Fragment key={i}>
                      {i > 0 && <span className={`font-bold ${countdown.isUrgent ? "text-amber-400" : "text-blue-300"}`}>:</span>}
                      <div className={`px-2.5 py-1.5 rounded-lg border text-center min-w-[44px] ${
                        countdown.isUrgent ? "border-amber-300 bg-white text-amber-900" : "border-blue-300 bg-white text-blue-900"
                      }`}>
                        <span className="text-base font-black tabular-nums block leading-tight">{seg.val}</span>
                        <span className="text-[9px] uppercase tracking-wider opacity-75 block font-sans">{seg.unit}</span>
                      </div>
                    </React.Fragment>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── TIẾN TRÌNH BƯỚC ── */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
              <ArrowRightLeft size={16} className="text-[#001743]" />
              <h2 className="font-bold text-sm text-[#001743]">Tiến trình giao dịch</h2>
            </div>

            <div className="p-5">
              {/* Steps */}
              <div className="relative">
                {/* Connector line */}
                <div className="absolute left-5 top-6 bottom-6 w-0.5 bg-slate-100" aria-hidden />

                <div className="space-y-0">
                  {STEPS.map((step, idx) => {
                    const isCompleted = isDone || (!isCancelled && idx < activeIdx);
                    const isActive    = !isDone && !isCancelled && idx === activeIdx;
                    const isPending   = (!isDone && !isCancelled && idx > activeIdx) || (isCancelled && idx > 0);

                    return (
                      <div key={step.key} className="flex items-start gap-4 relative pb-6 last:pb-0">
                        {/* Step icon */}
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 relative z-10 ring-4 ring-white transition-all ${
                          isCancelled && idx === 0
                            ? "bg-rose-100 text-rose-600"
                            : isCompleted
                            ? "bg-emerald-100 text-emerald-700"
                            : isActive
                            ? "bg-[#001743] text-white shadow-lg"
                            : "bg-slate-100 text-slate-400"
                        }`}>
                          {isCancelled && idx === 0
                            ? <XCircle size={18} />
                            : isCompleted
                            ? <CheckCircle2 size={18} />
                            : step.icon}
                        </div>

                        {/* Step content */}
                        <div className="flex-1 min-w-0 pt-1.5">
                          <div className="flex flex-wrap items-center gap-2 mb-0.5">
                            <span className={`text-sm font-bold ${
                              isCompleted ? "text-emerald-700" : isActive ? "text-[#001743]" : "text-slate-400"
                            }`}>
                              {step.label}
                            </span>
                            {isActive && !isCancelled && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#001743] text-white">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                Đang thực hiện
                              </span>
                            )}
                            {isCompleted && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                Hoàn tất
                              </span>
                            )}
                            {isCancelled && idx === 0 && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                Đã huỷ
                              </span>
                            )}
                          </div>
                          <p className={`text-xs leading-relaxed ${isPending ? "text-slate-300" : "text-slate-500"}`}>
                            {step.sublabel}
                          </p>

                          {/* Deadline info per step */}
                          {step.key === "escrow" && trade.escrowDeadline && !isCancelled && (
                            <div className="mt-1.5 text-[11px] text-slate-400 font-mono flex items-center gap-1">
                              <Clock size={10} />
                              <span>Hạn: {fmtDate(trade.escrowDeadline)}</span>
                            </div>
                          )}
                          {step.key === "signature" && trade.signingDeadline && !isCancelled && (
                            <div className="mt-1.5 text-[11px] text-slate-400 font-mono flex items-center gap-1">
                              <Clock size={10} />
                              <span>Hạn: {fmtDate(trade.signingDeadline)}</span>
                            </div>
                          )}
                          {step.key === "transfer" && trade.transferDeadline && !isCancelled && (
                            <div className="mt-1.5 text-[11px] text-slate-400 font-mono flex items-center gap-1">
                              <Clock size={10} />
                              <span>Hạn: {fmtDate(trade.transferDeadline)}</span>
                            </div>
                          )}
                          {step.key === "done" && trade.completedAt && (
                            <div className="mt-1.5 text-[11px] text-emerald-600 font-mono flex items-center gap-1">
                              <CheckCircle2 size={10} />
                              <span>Hoàn tất lúc: {fmtDate(trade.completedAt)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Success banner */}
              {isDone && (
                <div className="mt-5 pt-5 border-t border-slate-100">
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                      <CheckCircle2 size={20} />
                    </div>
                    <div>
                      <div className="font-bold text-sm text-emerald-900">Giao dịch hoàn tất thành công</div>
                      <p className="text-xs text-emerald-700 mt-0.5">
                        {fmt(trade.escrowAmount)} đã được giải ngân về ví người bán · Số SIM đã sang tên chính chủ.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Grid thông tin 2 cột ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            {/* Bên mua / bên bán */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
                <User size={15} className="text-[#001743]" />
                <h3 className="font-bold text-sm text-[#001743]">Các bên tham gia</h3>
              </div>
              <div className="p-5 space-y-4">
                {[
                  { role: "Người mua", name: trade.buyerName, id: trade.buyerId },
                  { role: "Người bán", name: trade.sellerName, id: trade.sellerId },
                ].map((party) => {
                  const isSelf = currentUser?.userId === party.id;
                  return (
                    <div key={party.role} className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-[#001743] text-white flex items-center justify-center font-bold text-sm shrink-0">
                        {(party.name || "?").charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono font-bold text-xs text-[#001743] truncate">{maskName(party.name)}</span>
                          {isSelf && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">Bạn</span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 font-medium">{party.role}</div>
                      </div>
                      <BadgeCheck size={16} className="text-blue-500 shrink-0" title="Đã xác minh" />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Tài chính ký quỹ */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
                <Wallet size={15} className="text-[#001743]" />
                <h3 className="font-bold text-sm text-[#001743]">Thông tin ký quỹ</h3>
              </div>
              <div className="p-5 space-y-3">
                {[
                  { label: "Số tiền ký quỹ", value: fmt(trade.escrowAmount), highlight: true },
                  { label: "Trạng thái ký quỹ", value: escrowStatusInfo?.label ?? trade.escrowStatus },
                  { label: "Hạn nạp ký quỹ", value: fmtDate(trade.escrowDeadline) },
                  ...(trade.auctionId ? [{ label: "Từ phiên đấu giá", value: trade.auctionId.slice(0, 8) + "..." }] : []),
                ].map((row, i) => (
                  <div key={i} className="flex justify-between items-start gap-3 py-1.5 border-b border-slate-50 last:border-0">
                    <span className="text-[11px] text-slate-500 font-medium shrink-0">{row.label}</span>
                    <span className={`text-xs font-bold text-right tabular-nums ${(row as any).highlight ? "text-[#001743] text-sm" : "text-slate-800"}`}>
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Hợp đồng & hồ sơ ── */}
          {(trade.documentUrl || trade.blockchainTxHash || trade.contractStatus) && (
            <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
                <FileText size={15} className="text-[#001743]" />
                <h3 className="font-bold text-sm text-[#001743]">Hợp đồng & Xác thực</h3>
              </div>
              <div className="p-5 space-y-3">
                {trade.contractStatus && (
                  <div className="flex justify-between items-center py-1.5 border-b border-slate-50">
                    <span className="text-[11px] text-slate-500 font-medium">Trạng thái hợp đồng</span>
                    <span className="text-xs font-bold text-slate-800">{trade.contractStatus}</span>
                  </div>
                )}
                {trade.documentUrl && (
                  <div className="flex justify-between items-center py-1.5 border-b border-slate-50">
                    <span className="text-[11px] text-slate-500 font-medium">Hợp đồng điện tử</span>
                    <a
                      href={trade.documentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      <span>Xem tài liệu</span>
                      <ExternalLink size={11} />
                    </a>
                  </div>
                )}
                {trade.documentHash && (
                  <div className="py-1.5 border-b border-slate-50">
                    <div className="text-[11px] text-slate-500 font-medium mb-1">Mã băm tài liệu (SHA-256)</div>
                    <div className="flex items-center gap-1.5 bg-slate-50 rounded-lg px-3 py-2 border border-slate-100">
                      <span className="font-mono text-[10px] text-slate-600 truncate">{trade.documentHash}</span>
                      <CopyText text={trade.documentHash} />
                    </div>
                  </div>
                )}
                {trade.blockchainTxHash && (
                  <div className="py-1.5">
                    <div className="text-[11px] text-slate-500 font-medium mb-1">Mã giao dịch chuỗi khối</div>
                    <div className="flex items-center gap-1.5 bg-slate-50 rounded-lg px-3 py-2 border border-slate-100">
                      <span className="font-mono text-[10px] text-slate-600 truncate">{trade.blockchainTxHash}</span>
                      <CopyText text={trade.blockchainTxHash} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Lưu ý bảo mật ── */}
          <div className="bg-blue-50/70 border border-blue-200/80 rounded-2xl p-4 flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
              <ShieldCheck size={18} />
            </div>
            <div className="text-xs text-blue-900 space-y-1 leading-relaxed">
              <div className="font-bold text-sm text-blue-950">Tiền ký quỹ luôn được bảo đảm an toàn</div>
              <p>Toàn bộ số tiền ký quỹ được giữ trong tài khoản bảo đảm của TrustSim. Tiền chỉ được giải ngân khi quá trình sang tên hoàn tất, hoặc hoàn về ví người mua nếu giao dịch bị huỷ.</p>
              <p>Nếu phát sinh vấn đề, bạn có thể liên hệ bộ phận hỗ trợ để mở yêu cầu giải quyết tranh chấp.</p>
            </div>
          </div>

          {/* ── CTA quay về ── */}
          <div className="flex justify-center">
            <Link
              href="/profile?tab=trades"
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-xs transition-colors"
            >
              <ArrowLeft size={14} />
              <span>Quay về danh sách giao dịch</span>
            </Link>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
