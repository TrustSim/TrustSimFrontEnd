/* TrustSim · Trang Chi Tiết Giao Dịch Chuyển Nhượng SIM · High-Trust Terminal */
"use client";

import React, { useState, useEffect, use, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { tradeService } from "@/services/tradeService";
import { authService } from "@/services/authService";
import { uploadImageToCloudinary } from "@/services/cloudinaryService";
import type {
  TradeTransactionDto,
  TradeTransactionStatus,
  ContractPreviewDto,
  SimTransferDetailsDto,
} from "@/types/trade";
import { ToastContainer, ToastMessage } from "@/components/ui/Toast";
import {
  ArrowLeft,
  ShieldCheck,
  FileText,
  RefreshCw,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  Lock,
  Wallet,
  Copy,
  Check,
  ExternalLink,
  FileSignature,
  Smartphone,
  User,
  BadgeCheck,
  ArrowRightLeft,
  Hourglass,
  Scale,
  Info,
  Send,
  Upload,
  Eye,
  X,
  FileCheck,
  CheckCircle,
} from "lucide-react";

/* ─── Formatter Helpers ───────────────────────────────────── */
const fmt = (n?: number) =>
  n !== undefined && n !== null
    ? new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        maximumFractionDigits: 0,
      }).format(n)
    : "—";

const fmtDate = (s?: string) => {
  if (!s) return "—";
  return new Date(s).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const maskName = (name?: string) => {
  if (!name) return "—";
  if (name.length <= 3) return name[0] + "***";
  return name.slice(0, 2) + "***" + name.slice(-1);
};

/* ─── Trạng Thái & 4 Bước Giao Dịch ─────────────────────── */
type StepKey = "escrow" | "signature" | "transfer" | "done";

interface StepDef {
  key: StepKey;
  stepNumber: number;
  label: string;
  sublabel: string;
  icon: React.ReactNode;
}

const STEPS: StepDef[] = [
  {
    key: "escrow",
    stepNumber: 1,
    label: "Ký quỹ",
    sublabel: "Người mua nạp tiền vào tài khoản ký quỹ bảo đảm của TrustSim",
    icon: <Wallet size={18} />,
  },
  {
    key: "signature",
    stepNumber: 2,
    label: "Ký hợp đồng",
    sublabel: "Hai bên điện tử ký kết hợp đồng chuyển nhượng qua mã xác thực OTP",
    icon: <FileSignature size={18} />,
  },
  {
    key: "transfer",
    stepNumber: 3,
    label: "Sang tên SIM",
    sublabel: "Người bán thực hiện thủ tục sang tên SIM chính chủ tại nhà mạng",
    icon: <Smartphone size={18} />,
  },
  {
    key: "done",
    stepNumber: 4,
    label: "Giải ngân",
    sublabel: "Người mua xác nhận nhận SIM, hệ thống giải ngân tiền ký quỹ về ví người bán",
    icon: <CheckCircle2 size={18} />,
  },
];

const statusToStep = (
  status: TradeTransactionStatus
): { active: StepKey; isDone: boolean; isCancelled: boolean } => {
  switch (status) {
    case "PendingEscrow":
      return { active: "escrow", isDone: false, isCancelled: false };
    case "PendingSignature":
      return { active: "signature", isDone: false, isCancelled: false };
    case "PendingTransfer":
      return { active: "transfer", isDone: false, isCancelled: false };
    case "Completed":
      return { active: "done", isDone: true, isCancelled: false };
    default:
      if (status?.startsWith("Cancelled") || status === "Disputed")
        return { active: "escrow", isDone: false, isCancelled: true };
      return { active: "escrow", isDone: false, isCancelled: false };
  }
};

const stepIndex = (key: StepKey) => STEPS.findIndex((s) => s.key === key);

const ESCROW_STATUS_MAP: Record<
  string,
  { label: string; color: string; bg: string; border: string }
> = {
  PENDING_FUNDING: { label: "Chờ nạp tiền", color: "#92400E", bg: "#FEF3C7", border: "#FDE68A" },
  HELD: { label: "Đang giữ bảo đảm", color: "#1D4ED8", bg: "#DBEAFE", border: "#BFDBFE" },
  FROZEN: { label: "Đang đóng băng", color: "#5B21B6", bg: "#EDE9FE", border: "#DDD6FE" },
  RELEASED: { label: "Đã giải ngân", color: "#065F46", bg: "#D1FAE5", border: "#A7F3D0" },
  REFUNDED: { label: "Đã hoàn tiền", color: "#374151", bg: "#F3F4F6", border: "#E5E7EB" },
  CANCELLED: { label: "Đã huỷ", color: "#991B1B", bg: "#FEE2E2", border: "#FECACA" },
};

const TRADE_STATUS_MAP: Record<
  string,
  { label: string; color: string; bg: string; border: string; icon: React.ReactNode }
> = {
  PendingEscrow: {
    label: "Chờ ký quỹ",
    color: "#92400E",
    bg: "#FEF3C7",
    border: "#FDE68A",
    icon: <Hourglass size={13} />,
  },
  PendingSignature: {
    label: "Chờ ký hợp đồng",
    color: "#1D4ED8",
    bg: "#DBEAFE",
    border: "#BFDBFE",
    icon: <FileSignature size={13} />,
  },
  PendingTransfer: {
    label: "Chờ sang tên SIM",
    color: "#0F766E",
    bg: "#CCFBF1",
    border: "#99F6E4",
    icon: <ArrowRightLeft size={13} />,
  },
  Completed: {
    label: "Hoàn tất chuyển nhượng",
    color: "#065F46",
    bg: "#D1FAE5",
    border: "#A7F3D0",
    icon: <CheckCircle2 size={13} />,
  },
  Cancelled_EscrowTimeout: {
    label: "Huỷ (hết giờ ký quỹ)",
    color: "#991B1B",
    bg: "#FEE2E2",
    border: "#FECACA",
    icon: <XCircle size={13} />,
  },
  Cancelled_SigningTimeout: {
    label: "Huỷ (hết giờ ký HĐ)",
    color: "#991B1B",
    bg: "#FEE2E2",
    border: "#FECACA",
    icon: <XCircle size={13} />,
  },
  Cancelled_TransferTimeout: {
    label: "Huỷ (hết giờ sang tên)",
    color: "#991B1B",
    bg: "#FEE2E2",
    border: "#FECACA",
    icon: <XCircle size={13} />,
  },
  Cancelled_ByAdmin: {
    label: "Huỷ bởi quản trị viên",
    color: "#991B1B",
    bg: "#FEE2E2",
    border: "#FECACA",
    icon: <XCircle size={13} />,
  },
  Disputed: {
    label: "Đang mở khiếu nại / tranh chấp",
    color: "#92400E",
    bg: "#FEF3C7",
    border: "#FDE68A",
    icon: <Scale size={13} />,
  },
};

/* ─── Countdown Hook ─────────────────────────────────────── */
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

/* ─── Copy Button ────────────────────────────────────────── */
function CopyText({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
      title="Sao chép"
    >
      {copied ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
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
  const [contractPreview, setContractPreview] = useState<ContractPreviewDto | null>(null);
  const [transferDetails, setTransferDetails] = useState<SimTransferDetailsDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Action states
  const [showContractModal, setShowContractModal] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [sendingOtp, setSendingOtp] = useState(false);
  const [signingContract, setSigningContract] = useState(false);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreviewUrl, setProofPreviewUrl] = useState<string>("");
  const [uploadingProof, setUploadingProof] = useState(false);
  const [confirmingTransfer, setConfirmingTransfer] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const addToast = (t: Omit<ToastMessage, "id">) => {
    const id = Date.now().toString();
    setToasts((p) => [...p, { ...t, id }]);
  };
  const removeToast = (id: string) => setToasts((p) => p.filter((t) => t.id !== id));

  const currentUser = authService.getUser();

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await tradeService.getTradeById(tradeId);
      setTrade(data);

      // Tải song song thông tin hợp đồng và tiến trình chuyển nhượng nếu có
      await Promise.allSettled([
        tradeService
          .getContractPreview(tradeId)
          .then((cp) => setContractPreview(cp))
          .catch(() => {}),
        tradeService
          .getSimTransferDetails(tradeId)
          .then((td) => setTransferDetails(td))
          .catch(() => {}),
      ]);
    } catch (err: any) {
      addToast({
        type: "error",
        title: "Không tải được thông tin giao dịch",
        message: err.message || "Vui lòng thử lại sau.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [tradeId]);

  /* ─── Derived state ──────────────────────────────────────── */
  const { active, isDone, isCancelled } = trade
    ? statusToStep(trade.status)
    : { active: "escrow" as StepKey, isDone: false, isCancelled: false };

  const activeIdx = stepIndex(active);

  const currentDeadline = (() => {
    if (!trade) return undefined;
    if (active === "escrow") return trade.escrowDeadline;
    if (active === "signature") return trade.signingDeadline;
    if (active === "transfer") return trade.transferDeadline;
    return undefined;
  })();

  const countdown = useCountdown(
    currentDeadline && !isDone && !isCancelled ? currentDeadline : undefined
  );

  const tradeStatusInfo = trade
    ? TRADE_STATUS_MAP[trade.status] ?? {
        label: trade.status,
        color: "#374151",
        bg: "#F3F4F6",
        border: "#E5E7EB",
        icon: <Info size={13} />,
      }
    : null;

  const escrowStatusInfo = trade
    ? ESCROW_STATUS_MAP[trade.escrowStatus] ?? {
        label: trade.escrowStatus,
        color: "#374151",
        bg: "#F3F4F6",
        border: "#E5E7EB",
      }
    : null;

  const isBuyer = currentUser?.userId === trade?.buyerId;
  const isSeller = currentUser?.userId === trade?.sellerId;
  const isParticipant = isBuyer || isSeller;

  // Trạng thái ký hợp đồng của user hiện tại
  const hasUserSigned = (() => {
    if (!contractPreview) return false;
    if (isBuyer) return contractPreview.buyerSigned;
    if (isSeller) return contractPreview.sellerSigned;
    return false;
  })();

  /* ─── Action Handlers ────────────────────────────────────── */
  const handleSendOtp = async () => {
    setSendingOtp(true);
    try {
      const res = await tradeService.sendSigningOtp(tradeId);
      addToast({
        type: "success",
        title: "Đã gửi mã xác thực",
        message: res.message || "Mã OTP ký hợp đồng đã được gửi đến email của bạn.",
      });
    } catch (err: any) {
      addToast({
        type: "error",
        title: "Gửi OTP thất bại",
        message: err.message || "Không thể gửi OTP. Vui lòng thử lại sau.",
      });
    } finally {
      setSendingOtp(false);
    }
  };

  const handleSignContract = async () => {
    if (!otpCode || otpCode.trim().length !== 6) {
      addToast({
        type: "warning",
        title: "Mã OTP không hợp lệ",
        message: "Vui lòng nhập đủ 6 chữ số mã OTP được gửi về email.",
      });
      return;
    }

    setSigningContract(true);
    try {
      await tradeService.signContract(tradeId, otpCode.trim());
      addToast({
        type: "success",
        title: "Ký hợp đồng thành công",
        message: "Chữ ký điện tử đã được ghi nhận vào hợp đồng số hóa.",
      });
      setOtpCode("");
      await loadData();
    } catch (err: any) {
      addToast({
        type: "error",
        title: "Ký hợp đồng thất bại",
        message: err.message || "Mã OTP không đúng hoặc đã hết hạn.",
      });
    } finally {
      setSigningContract(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProofFile(file);
      setProofPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmitProof = async () => {
    if (!proofFile) {
      addToast({
        type: "warning",
        title: "Chưa chọn tài liệu",
        message: "Vui lòng tải lên ảnh chụp biên bản sang tên hoặc giấy xác nhận từ nhà mạng.",
      });
      return;
    }

    setUploadingProof(true);
    try {
      // 1. Upload ảnh lên Cloudinary
      const uploadRes = await uploadImageToCloudinary(proofFile, "general");
      if (!uploadRes.success || !uploadRes.url) {
        throw new Error(uploadRes.error || "Tải ảnh lên máy chủ lưu trữ thất bại.");
      }

      // 2. Gửi API sang backend
      await tradeService.submitTransferProof(tradeId, uploadRes.url);

      addToast({
        type: "success",
        title: "Nộp biên bản thành công",
        message: "Biên bản sang tên đã được gửi để người mua đối soát và xác nhận nhận SIM.",
      });

      setProofFile(null);
      setProofPreviewUrl("");
      await loadData();
    } catch (err: any) {
      addToast({
        type: "error",
        title: "Nộp biên bản thất bại",
        message: err.message || "Có lỗi xảy ra khi nộp biên bản.",
      });
    } finally {
      setUploadingProof(false);
    }
  };

  const handleConfirmTransfer = async () => {
    setConfirmingTransfer(true);
    try {
      await tradeService.confirmTransfer(tradeId);
      addToast({
        type: "success",
        title: "Giao dịch hoàn tất!",
        message: "SIM đã được sang tên thành công và tiền ký quỹ đã được giải ngân cho người bán.",
      });
      setShowConfirmModal(false);
      await loadData();
    } catch (err: any) {
      addToast({
        type: "error",
        title: "Xác nhận thất bại",
        message: err.message || "Không thể xác nhận giao dịch. Vui lòng thử lại.",
      });
    } finally {
      setConfirmingTransfer(false);
    }
  };

  /* ─── Skeleton Loading ───────────────────────────────────── */
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F1F5F9] flex flex-col font-sans">
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

  /* ─── 404 Không Tìm Thấy ─────────────────────────────────── */
  if (!trade) {
    return (
      <div className="min-h-screen bg-[#F1F5F9] flex flex-col font-sans">
        <Navbar />
        <main className="flex-1 pt-24 pb-16 flex items-center justify-center">
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center max-w-sm shadow-sm">
            <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-rose-200">
              <AlertTriangle size={24} />
            </div>
            <h2 className="text-base font-extrabold text-[#001743] mb-2">
              Không tìm thấy giao dịch
            </h2>
            <p className="text-xs text-slate-500 mb-6 leading-relaxed">
              Giao dịch này không tồn tại trên sàn hoặc tài khoản của bạn không có thẩm quyền truy cập.
            </p>
            <Link
              href="/profile?tab=contracts"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#001743] hover:bg-[#00266B] text-white text-xs font-bold rounded-xl transition-colors shadow-xs"
            >
              <ArrowLeft size={14} />
              <span>Quay về danh sách hợp đồng</span>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F1F5F9] text-slate-900 flex flex-col font-sans">
      <ToastContainer toasts={toasts} onClose={removeToast} />
      <Navbar />

      <main className="flex-1 pt-20 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-5">
          {/* ── Breadcrumb Điều Hướng ── */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500">
            <div className="flex items-center gap-2 flex-wrap">
              <Link href="/" className="hover:text-[#001743] transition-colors">
                Trang chủ
              </Link>
              <span className="text-slate-300">/</span>
              <Link
                href="/profile?tab=contracts"
                className="hover:text-[#001743] transition-colors"
              >
                Hợp đồng & Giao dịch
              </Link>
              <span className="text-slate-300">/</span>
              <span className="text-[#001743] font-mono font-bold">
                {trade.tradeTransactionCode}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => loadData()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-all shadow-2xs cursor-pointer"
              >
                <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
                <span>Làm mới dữ liệu</span>
              </button>
            </div>
          </div>

          {/* ── Header Terminal: Thẻ Tổng Quan Giao Dịch ── */}
          <div className="bg-[#001743] rounded-2xl border border-[#0D2847] p-6 text-white shadow-xl relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none" />
            <div
              className="absolute -right-20 -top-20 w-[280px] h-[280px] rounded-full opacity-[0.05]"
              style={{ background: "radial-gradient(circle, #4F8EF7, transparent 70%)" }}
            />

            <div className="relative z-10">
              {/* Dòng tiêu đề & Trạng thái */}
              <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
                <div>
                  <div className="text-[11px] font-semibold text-slate-400 mb-1 uppercase tracking-wide">
                    Mã giao dịch chuyển nhượng
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xl font-black text-white tracking-wide">
                      {trade.tradeTransactionCode}
                    </span>
                    <CopyText text={trade.tradeTransactionCode} />
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1 font-mono">
                    Khởi tạo: {fmtDate(trade.createdDate)}
                  </div>
                </div>

                {tradeStatusInfo && (
                  <span
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border"
                    style={{
                      color: tradeStatusInfo.color,
                      backgroundColor: tradeStatusInfo.bg,
                      borderColor: tradeStatusInfo.border,
                    }}
                  >
                    {tradeStatusInfo.icon}
                    {tradeStatusInfo.label}
                  </span>
                )}
              </div>

              {/* Thông tin SIM & Số tiền ký quỹ */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-4 border-t border-white/10">
                <div>
                  <div className="text-[11px] text-slate-400 font-medium mb-1">
                    Số SIM chuyển nhượng
                  </div>
                  <div className="font-mono text-2xl font-black text-white tracking-tight">
                    {trade.simPhoneNumber
                      ? trade.simPhoneNumber.replace(/(\d{4})(\d{3})(\d{3})/, "$1 · $2 · $3")
                      : "—"}
                  </div>
                </div>
                <div className="sm:text-right">
                  <div className="text-[11px] text-slate-400 font-medium mb-1">
                    Số tiền ký quỹ bảo đảm
                  </div>
                  <div className="font-mono text-2xl font-black text-amber-300">
                    {fmt(trade.escrowAmount)}
                  </div>
                  {escrowStatusInfo && (
                    <span
                      className="inline-flex items-center gap-1 mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border"
                      style={{
                        color: escrowStatusInfo.color,
                        backgroundColor: escrowStatusInfo.bg,
                        borderColor: escrowStatusInfo.border,
                      }}
                    >
                      <Lock size={9} /> {escrowStatusInfo.label}
                    </span>
                  )}
                </div>
              </div>

              {/* 4 Trụ Cột Minh Bạch */}
              <div className="flex flex-wrap items-center gap-4 mt-5 pt-4 border-t border-white/10 text-xs text-slate-300 font-medium">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck size={13} className="text-emerald-400" />
                  Ký quỹ bảo đảm sàn
                </span>
                <span className="flex items-center gap-1.5">
                  <FileSignature size={13} className="text-blue-400" />
                  Hợp đồng ký số điện tử
                </span>
                <span className="flex items-center gap-1.5">
                  <Smartphone size={13} className="text-amber-400" />
                  Sang tên chính chủ nhà mạng
                </span>
                <span className="flex items-center gap-1.5">
                  <BadgeCheck size={13} className="text-emerald-400" />
                  Giải ngân an toàn tuyệt đối
                </span>
              </div>
            </div>
          </div>

          {/* ── Cảnh Báo Huỷ Hoặc Tranh Chấp ── */}
          {isCancelled && (
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-start gap-3 shadow-2xs">
              <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <XCircle size={18} />
              </div>
              <div>
                <div className="font-bold text-sm text-rose-900 mb-0.5">
                  Giao dịch đã kết thúc / Huỷ
                </div>
                <p className="text-xs text-rose-700 leading-relaxed">
                  {trade.cancelledReason ||
                    "Giao dịch không hoàn thành trong thời hạn cam kết. Tiền ký quỹ (nếu đã nộp) đã được giải toả hoặc hoàn trả theo đúng quy chế sàn."}
                </p>
              </div>
            </div>
          )}

          {trade.status === "Disputed" && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 shadow-2xs">
              <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <Scale size={18} />
              </div>
              <div>
                <div className="font-bold text-sm text-amber-900 mb-0.5">
                  Giao dịch đang trong quá trình giải quyết tranh chấp
                </div>
                <p className="text-xs text-amber-800 leading-relaxed">
                  Ban Kiểm soát TrustSim đang thụ lý khiếu nại giữa 2 bên. Toàn bộ tiền ký quỹ được
                  đóng băng an toàn cho đến khi có phán quyết xử lý chính thức.
                </p>
              </div>
            </div>
          )}

          {/* ── Đồng Hồ Đếm Ngược Hạn Chót ── */}
          {!isDone && !isCancelled && trade.status !== "Disputed" && currentDeadline && (
            <div
              className={`rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border shadow-2xs ${
                countdown.isExpired
                  ? "bg-rose-50 border-rose-200"
                  : countdown.isUrgent
                  ? "bg-amber-50 border-amber-200"
                  : "bg-blue-50 border-blue-200"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    countdown.isExpired
                      ? "bg-rose-100 text-rose-600"
                      : countdown.isUrgent
                      ? "bg-amber-100 text-amber-700"
                      : "bg-blue-100 text-blue-700"
                  }`}
                >
                  <Hourglass size={18} />
                </div>
                <div>
                  <div
                    className={`text-xs font-bold ${
                      countdown.isExpired
                        ? "text-rose-900"
                        : countdown.isUrgent
                        ? "text-amber-900"
                        : "text-blue-900"
                    }`}
                  >
                    {countdown.isExpired
                      ? "Đã hết thời hạn thực hiện mốc hiện tại"
                      : active === "escrow"
                      ? "Thời hạn nộp tiền ký quỹ còn lại:"
                      : active === "signature"
                      ? "Thời hạn ký hợp đồng điện tử còn lại:"
                      : "Thời hạn sang tên SIM còn lại:"}
                  </div>
                  <div
                    className={`text-[11px] font-mono mt-0.5 ${
                      countdown.isExpired
                        ? "text-rose-700"
                        : countdown.isUrgent
                        ? "text-amber-700"
                        : "text-blue-700"
                    }`}
                  >
                    Mốc hạn chót: {fmtDate(currentDeadline)}
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
                      {i > 0 && (
                        <span
                          className={`font-bold ${
                            countdown.isUrgent ? "text-amber-400" : "text-blue-300"
                          }`}
                        >
                          :
                        </span>
                      )}
                      <div
                        className={`px-2.5 py-1.5 rounded-lg border text-center min-w-[44px] ${
                          countdown.isUrgent
                            ? "border-amber-300 bg-white text-amber-900"
                            : "border-blue-300 bg-white text-blue-900"
                        }`}
                      >
                        <span className="text-base font-black tabular-nums block leading-tight">
                          {seg.val}
                        </span>
                        <span className="text-[9px] uppercase tracking-wider opacity-75 block font-sans">
                          {seg.unit}
                        </span>
                      </div>
                    </React.Fragment>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── 4 BƯỚC TIẾN TRÌNH GIAO DỊCH ── */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ArrowRightLeft size={16} className="text-[#001743]" />
                <h2 className="font-bold text-sm text-[#001743]">
                  Tiến trình giao dịch 4 bước
                </h2>
              </div>
              <span className="text-xs font-bold text-slate-500 font-mono">
                {isDone ? "4/4 Hoàn tất" : `${activeIdx + 1}/4`}
              </span>
            </div>

            <div className="p-5">
              <div className="relative">
                {/* Đường nối dọc */}
                <div className="absolute left-5 top-6 bottom-6 w-0.5 bg-slate-100" aria-hidden />

                <div className="space-y-0">
                  {STEPS.map((step, idx) => {
                    const isCompleted = isDone || (!isCancelled && idx < activeIdx);
                    const isActive = !isDone && !isCancelled && idx === activeIdx;
                    const isPending =
                      (!isDone && !isCancelled && idx > activeIdx) || (isCancelled && idx > 0);

                    return (
                      <div
                        key={step.key}
                        className="flex items-start gap-4 relative pb-6 last:pb-0"
                      >
                        {/* Icon hình tròn */}
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 relative z-10 ring-4 ring-white transition-all ${
                            isCancelled && idx === 0
                              ? "bg-rose-100 text-rose-600"
                              : isCompleted
                              ? "bg-emerald-100 text-emerald-700"
                              : isActive
                              ? "bg-[#001743] text-white shadow-md"
                              : "bg-slate-100 text-slate-400"
                          }`}
                        >
                          {isCancelled && idx === 0 ? (
                            <XCircle size={18} />
                          ) : isCompleted ? (
                            <CheckCircle2 size={18} />
                          ) : (
                            step.icon
                          )}
                        </div>

                        {/* Nội dung bước */}
                        <div className="flex-1 min-w-0 pt-1.5">
                          <div className="flex flex-wrap items-center gap-2 mb-0.5">
                            <span
                              className={`text-sm font-bold ${
                                isCompleted
                                  ? "text-emerald-700"
                                  : isActive
                                  ? "text-[#001743]"
                                  : "text-slate-400"
                              }`}
                            >
                              {step.stepNumber}. {step.label}
                            </span>
                            {isActive && !isCancelled && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#001743] text-white">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                Đang diễn ra
                              </span>
                            )}
                            {isCompleted && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                Hoàn thành
                              </span>
                            )}
                            {isCancelled && idx === 0 && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                Đã huỷ
                              </span>
                            )}
                          </div>
                          <p
                            className={`text-xs leading-relaxed ${
                              isPending ? "text-slate-300" : "text-slate-500"
                            }`}
                          >
                            {step.sublabel}
                          </p>

                          {/* Thông tin mốc hạn từng bước */}
                          {step.key === "escrow" && trade.escrowDeadline && !isCancelled && (
                            <div className="mt-1.5 text-[11px] text-slate-400 font-mono flex items-center gap-1">
                              <Clock size={10} />
                              <span>Hạn nộp ký quỹ: {fmtDate(trade.escrowDeadline)}</span>
                            </div>
                          )}
                          {step.key === "signature" && trade.signingDeadline && !isCancelled && (
                            <div className="mt-1.5 text-[11px] text-slate-400 font-mono flex items-center gap-1">
                              <Clock size={10} />
                              <span>Hạn ký hợp đồng: {fmtDate(trade.signingDeadline)}</span>
                            </div>
                          )}
                          {step.key === "transfer" && trade.transferDeadline && !isCancelled && (
                            <div className="mt-1.5 text-[11px] text-slate-400 font-mono flex items-center gap-1">
                              <Clock size={10} />
                              <span>Hạn sang tên: {fmtDate(trade.transferDeadline)}</span>
                            </div>
                          )}
                          {step.key === "done" && trade.completedAt && (
                            <div className="mt-1.5 text-[11px] text-emerald-600 font-mono flex items-center gap-1">
                              <CheckCircle2 size={10} />
                              <span>Thời điểm hoàn tất: {fmtDate(trade.completedAt)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Thông báo chúc mừng khi hoàn thành */}
              {isDone && (
                <div className="mt-5 pt-5 border-t border-slate-100">
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                      <CheckCircle2 size={20} />
                    </div>
                    <div>
                      <div className="font-bold text-sm text-emerald-900">
                        Giao dịch chuyển nhượng hoàn tất thành công!
                      </div>
                      <p className="text-xs text-emerald-700 mt-0.5 leading-relaxed">
                        Số tiền {fmt(trade.escrowAmount)} đã được giải ngân về ví người bán. Số SIM{" "}
                        <strong>{trade.simPhoneNumber}</strong> đã hoàn tất chuyển quyền sở hữu cho người mua.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ═══ KHỐI HÀNH ĐỘNG TƯƠNG TÁC THEO BƯỚC (INTERACTIVE ACTION PANEL) ═══ */}
          {!isCancelled && !isDone && (
            <div className="bg-white border-2 border-blue-100 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-5 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" />
                  <h3 className="font-extrabold text-sm text-[#001743]">
                    Hành động cần thực hiện ở bước hiện tại
                  </h3>
                </div>
                <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">
                  {STEPS[activeIdx]?.label}
                </span>
              </div>

              <div className="p-5">
                {/* ── BƯỚC 1: KÝ QUỸ (PendingEscrow) ── */}
                {active === "escrow" && (
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center shrink-0">
                        <Wallet size={18} />
                      </div>
                      <div>
                        <div className="font-bold text-sm text-[#001743]">
                          {isBuyer
                            ? "Bạn cần nạp tiền ký quỹ để bắt đầu giao dịch"
                            : "Đang chờ người mua nạp tiền ký quỹ vào tài khoản bảo đảm"}
                        </div>
                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                          Số tiền ký quỹ <strong>{fmt(trade.escrowAmount)}</strong> sẽ được
                          TrustSim giữ an toàn tuyệt đối. Tiền chỉ giải ngân khi người mua xác nhận đã
                          sang tên SIM thành công.
                        </p>
                      </div>
                    </div>

                    {isBuyer && (
                      <div className="pt-2 flex items-center gap-3 flex-wrap">
                        <Link
                          href="/profile?tab=transactions"
                          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#E4011E] hover:bg-[#C20018] text-white text-xs font-bold rounded-xl transition-colors shadow-xs"
                        >
                          <Wallet size={14} />
                          <span>Nạp tiền vào ví & Ký quỹ</span>
                        </Link>
                        <span className="text-xs text-slate-400">
                          Hạn chót: {fmtDate(trade.escrowDeadline)}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* ── BƯỚC 2: KÝ HỢP ĐỒNG (PendingSignature) ── */}
                {active === "signature" && (
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                      <div>
                        <div className="font-bold text-sm text-[#001743]">
                          Ký kết hợp đồng chuyển nhượng điện tử 3 bên
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Hợp đồng được số hoá, tích hợp chứng thư số X.509 PAdES và đóng dấu thời
                          gian xác thực pháp lý.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => setShowContractModal(true)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors shrink-0 cursor-pointer"
                      >
                        <Eye size={13} />
                        <span>Xem trước văn bản hợp đồng</span>
                      </button>
                    </div>

                    {/* Trạng thái ký của 2 bên */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                        <div>
                          <div className="text-[11px] text-slate-400 font-semibold">Bên Mua SIM</div>
                          <div className="text-xs font-bold text-slate-800 mt-0.5">
                            {trade.buyerName || "Người mua"}
                          </div>
                        </div>
                        {contractPreview?.buyerSigned ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle size={11} /> Đã ký số
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            <Clock size={11} /> Chờ ký
                          </span>
                        )}
                      </div>

                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                        <div>
                          <div className="text-[11px] text-slate-400 font-semibold">Bên Bán SIM</div>
                          <div className="text-xs font-bold text-slate-800 mt-0.5">
                            {trade.sellerName || "Người bán"}
                          </div>
                        </div>
                        {contractPreview?.sellerSigned ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle size={11} /> Đã ký số
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            <Clock size={11} /> Chờ ký
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Form ký số OTP dành cho người dùng nếu chưa ký */}
                    {isParticipant && !hasUserSigned && (
                      <div className="p-4 bg-blue-50/60 border border-blue-200 rounded-xl space-y-3">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <span className="text-xs font-bold text-blue-900">
                            Xác thực chữ ký điện tử của bạn qua mã OTP Email:
                          </span>
                          <button
                            type="button"
                            onClick={handleSendOtp}
                            disabled={sendingOtp}
                            className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 hover:text-blue-900 underline cursor-pointer disabled:opacity-50"
                          >
                            <Send size={12} />
                            <span>{sendingOtp ? "Đang gửi OTP..." : "Gửi mã OTP về Email"}</span>
                          </button>
                        </div>

                        <div className="flex items-center gap-2 max-w-sm">
                          <input
                            type="text"
                            maxLength={6}
                            placeholder="Nhập 6 số OTP"
                            value={otpCode}
                            onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                            className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-mono tracking-widest text-center font-bold text-slate-800 focus:outline-blue-500"
                          />
                          <button
                            type="button"
                            onClick={handleSignContract}
                            disabled={signingContract || otpCode.length !== 6}
                            className="px-4 py-2 bg-[#001743] hover:bg-[#00266B] disabled:bg-slate-300 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed shadow-xs"
                          >
                            {signingContract ? "Đang xác thực..." : "Xác nhận Ký số"}
                          </button>
                        </div>
                        <p className="text-[11px] text-slate-500 italic">
                          * Bằng việc nhập mã OTP, bạn đồng ý ký kết hợp đồng điện tử theo tiêu chuẩn
                          Nghị định 130/2018/NĐ-CP.
                        </p>
                      </div>
                    )}

                    {isParticipant && hasUserSigned && (
                      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs font-bold text-emerald-800">
                        <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                        <span>
                          Bạn đã hoàn thành ký hợp đồng số. Đang chờ đối tác hoàn tất chữ ký để chuyển sang bước sang tên SIM.
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* ── BƯỚC 3: SANG TÊN SIM (PendingTransfer) ── */}
                {active === "transfer" && (
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 border border-teal-200 flex items-center justify-center shrink-0">
                        <Smartphone size={18} />
                      </div>
                      <div>
                        <div className="font-bold text-sm text-[#001743]">
                          Thực hiện thủ tục sang tên SIM chính chủ tại nhà mạng
                        </div>
                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                          Người bán và người mua liên hệ hoặc ra điểm giao dịch nhà mạng (Viettel, VinaPhone, MobiFone...) để hoàn tất thủ tục đăng ký thông tin chính chủ cho số SIM <strong>{trade.simPhoneNumber}</strong>.
                        </p>
                      </div>
                    </div>

                    {/* Danh sách bằng chứng / biên bản đã nộp */}
                    {transferDetails?.proofs && transferDetails.proofs.length > 0 && (
                      <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                        <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                          <FileCheck size={14} className="text-teal-600" />
                          <span>Biên bản sang tên đã được người bán tải lên:</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {transferDetails.proofs.map((p, idx) => (
                            <a
                              key={idx}
                              href={p.proofDocumentUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:border-blue-400 rounded-lg text-xs font-bold text-blue-700 shadow-2xs transition-colors"
                            >
                              <ExternalLink size={12} />
                              <span>Biên bản #{idx + 1} ({fmtDate(p.uploadedAt)})</span>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Hành động của Người bán: Nộp bằng chứng sang tên */}
                    {isSeller && (
                      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                        <div className="font-bold text-xs text-[#001743]">
                          Tải lên ảnh chụp biên bản sang tên / Xác nhận từ nhà mạng:
                        </div>
                        <div className="flex items-center gap-3 flex-wrap">
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*,.pdf"
                            onChange={handleFileChange}
                            className="hidden"
                          />
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg text-xs font-bold text-slate-700 transition-colors cursor-pointer shadow-2xs"
                          >
                            <Upload size={13} />
                            <span>{proofFile ? proofFile.name : "Chọn tệp biên bản..."}</span>
                          </button>

                          {proofFile && (
                            <button
                              type="button"
                              onClick={handleSubmitProof}
                              disabled={uploadingProof}
                              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#001743] hover:bg-[#00266B] disabled:bg-slate-300 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-xs"
                            >
                              <span>{uploadingProof ? "Đang tải lên..." : "Nộp biên bản sang tên"}</span>
                            </button>
                          )}
                        </div>

                        {proofPreviewUrl && (
                          <div className="mt-2">
                            <img
                              src={proofPreviewUrl}
                              alt="Biên bản xem trước"
                              className="max-h-40 rounded-lg border border-slate-200 shadow-2xs object-contain"
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {/* Hành động của Người mua: Xác nhận nhận SIM & Giải ngân */}
                    {isBuyer && (
                      <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-3">
                        <div className="font-bold text-xs text-emerald-950">
                          Xác nhận chuyển quyền sở hữu SIM thành công:
                        </div>
                        <p className="text-xs text-emerald-800 leading-relaxed">
                          Vui lòng kiểm tra SIM đã nhận sóng, đúng thông tin CCCD chính chủ trên app nhà mạng trước khi xác nhận. Sau khi bấm xác nhận, số tiền <strong>{fmt(trade.escrowAmount)}</strong> sẽ được hệ thống giải ngân ngay lập tức cho người bán.
                        </p>
                        <button
                          type="button"
                          onClick={() => setShowConfirmModal(true)}
                          className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors shadow-xs cursor-pointer"
                        >
                          <CheckCircle2 size={15} />
                          <span>Tôi đã nhận SIM & Đồng ý giải ngân</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Thông Tin Hai Bên Tham Gia & Tài Chính Ký Quỹ ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Thẻ bên mua & bên bán */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
                <User size={15} className="text-[#001743]" />
                <h3 className="font-bold text-sm text-[#001743]">Các bên tham gia giao dịch</h3>
              </div>
              <div className="p-5 space-y-4">
                {[
                  { role: "Bên Mua SIM", name: trade.buyerName, id: trade.buyerId },
                  { role: "Bên Bán SIM", name: trade.sellerName, id: trade.sellerId },
                ].map((party) => {
                  const isSelf = currentUser?.userId === party.id;
                  return (
                    <div key={party.role} className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#001743] text-white flex items-center justify-center font-bold text-sm shrink-0">
                        {(party.name || "?").charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono font-bold text-xs text-[#001743] truncate">
                            {maskName(party.name)}
                          </span>
                          {isSelf && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                              Bạn
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 font-medium">{party.role}</div>
                      </div>
                      <span title="Đã định danh eKYC" className="inline-flex items-center">
                        <BadgeCheck
                          size={16}
                          className="text-blue-500 shrink-0"
                        />
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Thẻ tài chính ký quỹ */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
                <Wallet size={15} className="text-[#001743]" />
                <h3 className="font-bold text-sm text-[#001743]">Thông tin tài khoản ký quỹ</h3>
              </div>
              <div className="p-5 space-y-3">
                {[
                  {
                    label: "Số tiền ký quỹ bảo đảm",
                    value: fmt(trade.escrowAmount),
                    highlight: true,
                  },
                  {
                    label: "Trạng thái ký quỹ",
                    value: escrowStatusInfo?.label ?? trade.escrowStatus,
                  },
                  { label: "Hạn nộp ký quỹ", value: fmtDate(trade.escrowDeadline) },
                  ...(trade.auctionId
                    ? [
                        {
                          label: "Thuộc phiên đấu giá",
                          value: trade.auctionId.slice(0, 8) + "...",
                        },
                      ]
                    : []),
                ].map((row, i) => (
                  <div
                    key={i}
                    className="flex justify-between items-start gap-3 py-1.5 border-b border-slate-50 last:border-0"
                  >
                    <span className="text-[11px] text-slate-500 font-medium shrink-0">
                      {row.label}
                    </span>
                    <span
                      className={`text-xs font-bold text-right tabular-nums ${
                        (row as any).highlight ? "text-[#001743] text-sm" : "text-slate-800"
                      }`}
                    >
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Chứng Thực Số & Hồ Sơ Pháp Lý ── */}
          {(trade.documentUrl ||
            trade.blockchainTxHash ||
            trade.contractStatus ||
            trade.documentHash) && (
            <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
                <FileText size={15} className="text-[#001743]" />
                <h3 className="font-bold text-sm text-[#001743]">
                  Hợp đồng số hóa & Dữ liệu niêm phong
                </h3>
              </div>
              <div className="p-5 space-y-3">
                {trade.contractStatus && (
                  <div className="flex justify-between items-center py-1.5 border-b border-slate-50">
                    <span className="text-[11px] text-slate-500 font-medium">
                      Trạng thái hợp đồng
                    </span>
                    <span className="text-xs font-bold text-slate-800">
                      {trade.contractStatus}
                    </span>
                  </div>
                )}
                {trade.documentUrl && (
                  <div className="flex justify-between items-center py-1.5 border-b border-slate-50">
                    <span className="text-[11px] text-slate-500 font-medium">
                      Hợp đồng điện tử đã ký số (PDF)
                    </span>
                    <a
                      href={trade.documentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      <span>Xem và tải tài liệu PDF</span>
                      <ExternalLink size={12} />
                    </a>
                  </div>
                )}
                {trade.documentHash && (
                  <div className="py-1.5 border-b border-slate-50">
                    <div className="text-[11px] text-slate-500 font-medium mb-1">
                      Mã băm chứng thực (SHA-256)
                    </div>
                    <div className="flex items-center gap-1.5 bg-slate-50 rounded-lg px-3 py-2 border border-slate-100">
                      <span className="font-mono text-[10px] text-slate-600 truncate">
                        {trade.documentHash}
                      </span>
                      <CopyText text={trade.documentHash} />
                    </div>
                  </div>
                )}
                {trade.blockchainTxHash && (
                  <div className="py-1.5">
                    <div className="text-[11px] text-slate-500 font-medium mb-1">
                      Mã giao dịch sổ cái phân tán (TxHash)
                    </div>
                    <div className="flex items-center gap-1.5 bg-slate-50 rounded-lg px-3 py-2 border border-slate-100">
                      <span className="font-mono text-[10px] text-slate-600 truncate">
                        {trade.blockchainTxHash}
                      </span>
                      <CopyText text={trade.blockchainTxHash} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Cam Kết An Toàn Tiền Ký Quỹ ── */}
          <div className="bg-blue-50/70 border border-blue-200/80 rounded-2xl p-4 flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
              <ShieldCheck size={18} />
            </div>
            <div className="text-xs text-blue-900 space-y-1 leading-relaxed">
              <div className="font-bold text-sm text-blue-950">
                Tiền ký quỹ luôn được bảo đảm an toàn
              </div>
              <p>
                Toàn bộ số tiền ký quỹ được lưu giữ tại tài khoản trung gian của TrustSim. Tiền chỉ
                được giải ngân cho người bán khi người mua xác nhận đã nhận SIM và sang tên chính chủ
                thành công.
              </p>
              <p>
                Nếu có tranh chấp phát sinh hoặc đối tác không thực hiện cam kết, tiền ký quỹ sẽ được
                hoàn trả đầy đủ về ví theo đúng quy chế sàn.
              </p>
            </div>
          </div>

          {/* ── Nút Quay Về Danh Sách ── */}
          <div className="flex justify-center pt-2">
            <Link
              href="/profile?tab=contracts"
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-2xs transition-colors"
            >
              <ArrowLeft size={14} />
              <span>Quay về danh sách hợp đồng & giao dịch</span>
            </Link>
          </div>
        </div>
      </main>

      {/* ── MODAL XEM TRƯỚC HỢP ĐỒNG ĐIỆN TỬ ── */}
      {showContractModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in-50 zoom-in-95">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#001743] text-white flex items-center justify-center">
                  <FileText size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-[#001743] m-0">
                    Bản thảo hợp đồng chuyển nhượng #{trade.tradeTransactionCode}
                  </h3>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Hệ thống hợp đồng số hoá và chứng thực điện tử TrustSim
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowContractModal(false)}
                className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 text-xs text-slate-700 leading-relaxed font-sans bg-slate-50/30">
              {contractPreview?.htmlContent ? (
                <div
                  dangerouslySetInnerHTML={{ __html: contractPreview.htmlContent }}
                  className="prose prose-xs max-w-none bg-white p-6 rounded-xl border border-slate-200 shadow-2xs"
                />
              ) : (
                <div className="p-8 text-center text-slate-400">
                  <FileText size={32} className="mx-auto mb-2 text-slate-300" />
                  <p>Nội dung hợp đồng đang được tạo lập và số hoá...</p>
                </div>
              )}
            </div>

            <div className="p-3 border-t border-slate-100 bg-slate-50 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setShowContractModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL XÁC NHẬN GIẢI NGÂN (CONFIRM TRANSFER MODAL) ── */}
      {showConfirmModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md p-6 text-center animate-in fade-in-50 zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={24} />
            </div>
            <h3 className="text-base font-extrabold text-[#001743] mb-2">
              Xác nhận nhận SIM & Giải ngân
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed mb-6">
              Bạn xác nhận đã nhận bàn giao SIM <strong>{trade.simPhoneNumber}</strong> và kiểm tra
              thông tin chính chủ tại nhà mạng thành công. Số tiền ký quỹ{" "}
              <strong>{fmt(trade.escrowAmount)}</strong> sẽ được chuyển ngay lập tức cho người bán. Hành động này không thể hoàn tác.
            </p>

            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                disabled={confirmingTransfer}
                className="px-4 py-2.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                Huỷ bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmTransfer}
                disabled={confirmingTransfer}
                className="px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors shadow-xs cursor-pointer disabled:opacity-50"
              >
                {confirmingTransfer ? "Đang xử lý..." : "Đồng ý giải ngân"}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
