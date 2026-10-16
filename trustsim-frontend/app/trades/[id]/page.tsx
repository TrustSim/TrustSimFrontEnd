/* TrustSim · Trang Chi Tiết Giao Dịch Chuyển Nhượng SIM · Dual-Cockpit Workspace 65/35 */
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
import { PhysicalSimCard } from "@/components/ui/PhysicalSimCard";
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
  ChevronDown,
  ChevronUp,
  Download,
  Building2,
  HelpCircle,
  ShieldAlert,
  Sparkles,
} from "lucide-react";

/* ─── Helpers: Định Dạng & Tiện Ích ───────────────────────── */
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
  const parts = name.trim().split(" ");
  if (parts.length === 1) {
    const w = parts[0];
    if (w.length <= 3) return w[0] + "***";
    return w.slice(0, 2) + "***" + w.slice(-1);
  }
  const first = parts[0];
  const last = parts[parts.length - 1];
  return `${first} *** ${last}`;
};

function detectCarrier(phone?: string): string {
  if (!phone) return "Viettel";
  const clean = phone.replace(/\D/g, "");
  if (/^(096|097|098|086|03[2-9])/.test(clean)) return "Viettel";
  if (/^(091|094|088|08[1-5])/.test(clean)) return "VinaPhone";
  if (/^(090|093|089|07[06-9])/.test(clean)) return "MobiFone";
  if (/^(092|056|058)/.test(clean)) return "Vietnamobile";
  if (/^(099|059)/.test(clean)) return "Gmobile";
  if (/^(087)/.test(clean)) return "Wintel";
  return "Viettel";
}

/* ─── Trạng Thái & 4 Bước Giao Dịch ─────────────────────── */
type StepKey = "escrow" | "signature" | "transfer" | "done";

interface StepDef {
  key: StepKey;
  stepNumber: number;
  label: string;
  sublabel: string;
  shortDesc: string;
  icon: React.ReactNode;
}

const STEPS: StepDef[] = [
  {
    key: "escrow",
    stepNumber: 1,
    label: "Ký quỹ",
    sublabel: "Người mua nạp tiền vào tài khoản ký quỹ bảo đảm của sàn TrustSim",
    shortDesc: "Bảo chứng dòng tiền 100%",
    icon: <Wallet size={16} />,
  },
  {
    key: "signature",
    stepNumber: 2,
    label: "Ký hợp đồng",
    sublabel: "Hai bên điện tử ký kết hợp đồng số hoá qua mã OTP Email (X.509 PAdES)",
    shortDesc: "Xác thực pháp lý số",
    icon: <FileSignature size={16} />,
  },
  {
    key: "transfer",
    stepNumber: 3,
    label: "Sang tên SIM",
    sublabel: "Người bán thực hiện thủ tục sang tên SIM chính chủ tại nhà mạng viễn thông",
    shortDesc: "Bàn giao tại nhà mạng",
    icon: <Smartphone size={16} />,
  },
  {
    key: "done",
    stepNumber: 4,
    label: "Giải ngân",
    sublabel: "Người mua xác nhận nhận SIM, hệ thống tự động giải ngân tiền về ví người bán",
    shortDesc: "Hoàn tất & thanh toán",
    icon: <CheckCircle2 size={16} />,
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
  { label: string; color: string; bg: string; border: string; desc: string }
> = {
  PENDING_FUNDING: {
    label: "Chờ nạp tiền",
    color: "#92400e",
    bg: "#fef3c7",
    border: "#fde68a",
    desc: "Đang chờ người mua chuyển tiền vào tài khoản ký quỹ bảo đảm",
  },
  HELD: {
    label: "Đang giữ bảo đảm",
    color: "#1d4ed8",
    bg: "#dbeafe",
    border: "#bfdbfe",
    desc: "Tiền đã được phong toả an toàn tại TrustSim Escrow",
  },
  FROZEN: {
    label: "Đang đóng băng",
    color: "#7e22ce",
    bg: "#f3e8ff",
    border: "#e9d5ff",
    desc: "Dòng tiền bị tạm khoá do đang có khiếu nại đối soát",
  },
  RELEASED: {
    label: "Đã giải ngân",
    color: "#15803d",
    bg: "#dcfce7",
    border: "#bbf7d0",
    desc: "Đã chuyển tiền thành công vào ví người bán sau khi giao dịch hoàn tất",
  },
  REFUNDED: {
    label: "Đã hoàn tiền",
    color: "#374151",
    bg: "#f3f4f6",
    border: "#e5e7eb",
    desc: "Tiền ký quỹ đã được hoàn trả về tài khoản người mua",
  },
  CANCELLED: {
    label: "Đã huỷ",
    color: "#b91c1c",
    bg: "#fee2e2",
    border: "#fecaca",
    desc: "Giao dịch đã bị huỷ bỏ, tiền hoàn trả theo quy định",
  },
};

const TRADE_STATUS_MAP: Record<
  string,
  { label: string; color: string; bg: string; border: string; icon: React.ReactNode }
> = {
  PendingEscrow: {
    label: "Chờ ký quỹ",
    color: "#92400e",
    bg: "#fef3c7",
    border: "#fde68a",
    icon: <Hourglass size={13} />,
  },
  PendingSignature: {
    label: "Chờ ký hợp đồng",
    color: "#1d4ed8",
    bg: "#dbeafe",
    border: "#bfdbfe",
    icon: <FileSignature size={13} />,
  },
  PendingTransfer: {
    label: "Chờ sang tên SIM",
    color: "#0f766e",
    bg: "#ccfbf1",
    border: "#99f6e4",
    icon: <ArrowRightLeft size={13} />,
  },
  Completed: {
    label: "Hoàn tất chuyển nhượng",
    color: "#15803d",
    bg: "#dcfce7",
    border: "#bbf7d0",
    icon: <CheckCircle2 size={13} />,
  },
  Cancelled_EscrowTimeout: {
    label: "Huỷ: Hết giờ nạp ký quỹ",
    color: "#b91c1c",
    bg: "#fee2e2",
    border: "#fecaca",
    icon: <XCircle size={13} />,
  },
  Cancelled_SigningTimeout: {
    label: "Huỷ: Hết giờ ký hợp đồng",
    color: "#b91c1c",
    bg: "#fee2e2",
    border: "#fecaca",
    icon: <XCircle size={13} />,
  },
  Cancelled_TransferTimeout: {
    label: "Huỷ: Hết giờ sang tên",
    color: "#b91c1c",
    bg: "#fee2e2",
    border: "#fecaca",
    icon: <XCircle size={13} />,
  },
  Cancelled_ByAdmin: {
    label: "Huỷ bởi quản trị viên",
    color: "#b91c1c",
    bg: "#fee2e2",
    border: "#fecaca",
    icon: <XCircle size={13} />,
  },
  Disputed: {
    label: "Đang mở khiếu nại / tranh chấp",
    color: "#92400e",
    bg: "#fef3c7",
    border: "#fde68a",
    icon: <Scale size={13} />,
  },
};

/* ─── Countdown Hook ─────────────────────────────────────── */
function useCountdown(deadline?: string) {
  const [remaining, setRemaining] = useState<number>(0);

  useEffect(() => {
    if (!deadline) {
      setRemaining(0);
      return;
    }
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
  const isExpired = deadline ? remaining === 0 : false;
  const isUrgent = remaining > 0 && remaining < 3_600_000;

  return { h, m, s, isExpired, isUrgent };
}

/* ─── Copy Button ────────────────────────────────────────── */
function CopyText({ text, title = "Sao chép" }: { text: string; title?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="inline-flex items-center justify-center p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
      title={title}
    >
      {copied ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT: TradeDetailPage (Dual-Cockpit 65/35)
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
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [contractAccordionOpen, setContractAccordionOpen] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [sendingOtp, setSendingOtp] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [signingContract, setSigningContract] = useState(false);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreviewUrl, setProofPreviewUrl] = useState<string>("");
  const [uploadingProof, setUploadingProof] = useState(false);
  const [confirmingTransfer, setConfirmingTransfer] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const addToast = (t: Omit<ToastMessage, "id">) => {
    const id = Date.now().toString();
    setToasts((p) => [...p, { ...t, id }]);
  };
  const removeToast = (id: string) => setToasts((p) => p.filter((t) => t.id !== id));

  const currentUser = authService.getUser();

  // Đếm ngược 60s gửi lại OTP
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await tradeService.getTradeById(tradeId);
      setTrade(data);

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
        message: err.message || "Vui lòng kiểm tra lại kết nối mạng.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [tradeId]);

  /* ─── Derived State ──────────────────────────────────────── */
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
        bg: "#f3f4f6",
        border: "#e5e7eb",
        icon: <Info size={13} />,
      }
    : null;

  const escrowStatusInfo = trade
    ? ESCROW_STATUS_MAP[trade.escrowStatus] ?? {
        label: trade.escrowStatus,
        color: "#374151",
        bg: "#f3f4f6",
        border: "#e5e7eb",
        desc: "Đang xử lý dòng tiền",
      }
    : null;

  const isBuyer = currentUser?.userId === trade?.buyerId;
  const isSeller = currentUser?.userId === trade?.sellerId;
  const isParticipant = isBuyer || isSeller;

  const hasUserSigned = (() => {
    if (!contractPreview) return false;
    if (isBuyer) return contractPreview.buyerSigned;
    if (isSeller) return contractPreview.sellerSigned;
    return false;
  })();

  /* ─── Action Handlers ────────────────────────────────────── */
  const handleSendOtp = async () => {
    if (resendCooldown > 0) return;
    setSendingOtp(true);
    try {
      const res = await tradeService.sendSigningOtp(tradeId);
      addToast({
        type: "success",
        title: "Đã gửi mã xác thực",
        message: res.message || "Mã OTP ký hợp đồng điện tử đã được gửi đến email tài khoản của bạn.",
      });
      setResendCooldown(60);
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
        message: "Vui lòng nhập đủ 6 chữ số mã OTP xác thực được gửi về email.",
      });
      return;
    }

    setSigningContract(true);
    try {
      await tradeService.signContract(tradeId, otpCode.trim());
      addToast({
        type: "success",
        title: "Ký hợp đồng thành công",
        message: "Chữ ký điện tử PAdES đã được tích hợp và chứng thực vào hợp đồng số.",
      });
      setOtpCode("");
      await loadData();
    } catch (err: any) {
      addToast({
        type: "error",
        title: "Ký hợp đồng thất bại",
        message: err.message || "Mã OTP không chính xác hoặc đã quá hạn xác thực.",
      });
    } finally {
      setSigningContract(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Giới hạn kích thước tệp tối đa 10MB
      if (file.size > 10 * 1024 * 1024) {
        addToast({
          type: "warning",
          title: "Tệp quá lớn",
          message: "Kích thước tệp tải lên tối đa là 10MB. Vui lòng chọn tệp nhỏ hơn.",
        });
        return;
      }
      setProofFile(file);
      setProofPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmitProof = async () => {
    if (!proofFile) {
      addToast({
        type: "warning",
        title: "Chưa chọn tài liệu",
        message: "Vui lòng chọn ảnh chụp biên bản sang tên hoặc giấy xác nhận từ nhà mạng.",
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
        message: "Biên bản sang tên đã được lưu và gửi thông báo tới người mua để đối soát.",
      });

      setProofFile(null);
      setProofPreviewUrl("");
      await loadData();
    } catch (err: any) {
      addToast({
        type: "error",
        title: "Nộp biên bản thất bại",
        message: err.message || "Có lỗi xảy ra khi nộp biên bản sang tên.",
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
        title: "Giao dịch hoàn tất thành công!",
        message: "SIM đã hoàn tất đổi chủ và tiền ký quỹ đã được tự động giải ngân cho người bán.",
      });
      setShowConfirmModal(false);
      await loadData();
    } catch (err: any) {
      addToast({
        type: "error",
        title: "Xác nhận thất bại",
        message: err.message || "Không thể xác nhận giao dịch. Vui lòng thử lại sau.",
      });
    } finally {
      setConfirmingTransfer(false);
    }
  };

  /* ─── Skeleton Loading State ─────────────────────────────── */
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex flex-col font-sans">
        <Navbar />
        <main className="flex-1 pt-24 pb-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
            <div className="h-6 w-56 bg-slate-200 rounded animate-pulse" />
            <div className="h-20 bg-slate-200 rounded-2xl animate-pulse" />
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-8 space-y-5">
                <div className="h-28 bg-slate-200 rounded-2xl animate-pulse" />
                <div className="h-96 bg-slate-200 rounded-2xl animate-pulse" />
              </div>
              <div className="lg:col-span-4 space-y-5">
                <div className="h-60 bg-slate-200 rounded-2xl animate-pulse" />
                <div className="h-72 bg-slate-200 rounded-2xl animate-pulse" />
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  /* ─── 404 / Không Tìm Thấy Giao Dịch ─────────────────────── */
  if (!trade) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex flex-col font-sans">
        <Navbar />
        <main className="flex-1 pt-24 pb-16 flex items-center justify-center">
          <div className="bg-white border border-slate-200 rounded-2xl p-8 sm:p-12 text-center max-w-md shadow-sm mx-4">
            <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-rose-100">
              <AlertTriangle size={26} />
            </div>
            <h2 className="text-lg font-black text-[#001743] mb-2 tracking-tight">
              Không tìm thấy giao dịch chuyển nhượng
            </h2>
            <p className="text-xs text-slate-500 mb-6 leading-relaxed">
              Mã giao dịch này không tồn tại hoặc tài khoản hiện tại không có quyền truy cập hồ sơ này.
            </p>
            <Link
              href="/profile?tab=contracts"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#001743] hover:bg-[#00266B] text-white text-xs font-bold rounded-xl transition-colors shadow-xs"
            >
              <ArrowLeft size={14} />
              <span>Quay về danh sách hợp đồng & giao dịch</span>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const carrierName = detectCarrier(trade.simPhoneNumber);

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-slate-900 flex flex-col font-sans">
      <ToastContainer toasts={toasts} onClose={removeToast} />
      <Navbar />

      <main className="flex-1 pt-20 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          
          {/* ═══════════════════════════════════════════════════════
             1. BREADCRUMB & AUDIT CONTROL STRIP
             ═══════════════════════════════════════════════════════ */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2 flex-wrap text-xs text-slate-500">
              <Link href="/" className="hover:text-[#001743] transition-colors">
                Trang chủ
              </Link>
              <span className="text-slate-300">/</span>
              <Link
                href="/profile?tab=contracts"
                className="hover:text-[#001743] transition-colors"
              >
                Hợp đồng & Ký quỹ
              </Link>
              <span className="text-slate-300">/</span>
              <span className="text-[#001743] font-mono font-bold bg-white px-2 py-0.5 rounded border border-slate-200">
                {trade.tradeTransactionCode}
              </span>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => loadData()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-all shadow-2xs cursor-pointer"
                title="Cập nhật trạng thái mới nhất từ hệ thống"
              >
                <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
                <span>Làm mới đối soát</span>
              </button>

              <Link
                href="/profile?tab=contracts"
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors shadow-2xs"
              >
                <ArrowLeft size={13} />
                <span>Trở về</span>
              </Link>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════
             2. TOP COMMAND HEADER: TRẠNG THÁI & HẠN CHÓT SLA
             ═══════════════════════════════════════════════════════ */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs relative overflow-hidden">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              
              {/* Cột trái: Mã giao dịch, loại SIM, thời gian khởi tạo */}
              <div>
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Hồ sơ giao dịch bảo chứng
                  </span>
                  <span className="text-slate-300">·</span>
                  <span className="text-[11px] font-mono text-slate-500">
                    Khởi tạo: {fmtDate(trade.createdDate)}
                  </span>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-black text-[#001743] font-mono tracking-tight m-0">
                    {trade.tradeTransactionCode}
                  </h1>
                  <CopyText text={trade.tradeTransactionCode} title="Sao chép mã giao dịch" />

                  {tradeStatusInfo && (
                    <span
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border"
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

                  {isDone && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <Sparkles size={13} />
                      Đã tất toán
                    </span>
                  )}
                </div>
              </div>

              {/* Cột phải: Đồng hồ đếm ngược SLA (nếu có hạn chót chưa hoàn thành) */}
              {!isDone && !isCancelled && trade.status !== "Disputed" && currentDeadline && (
                <div
                  className={`p-3.5 rounded-xl border flex items-center gap-3.5 ${
                    countdown.isExpired
                      ? "bg-rose-50 border-rose-200"
                      : countdown.isUrgent
                      ? "bg-amber-50 border-amber-200"
                      : "bg-blue-50/70 border-blue-200"
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
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
                      className={`text-[11px] font-bold ${
                        countdown.isExpired
                          ? "text-rose-900"
                          : countdown.isUrgent
                          ? "text-amber-900"
                          : "text-blue-900"
                      }`}
                    >
                      {countdown.isExpired
                        ? "Đã quá hạn chót của bước hiện tại"
                        : active === "escrow"
                        ? "Hạn nộp tiền ký quỹ:"
                        : active === "signature"
                        ? "Hạn ký hợp đồng điện tử:"
                        : "Hạn hoàn tất sang tên SIM:"}
                    </div>

                    {!countdown.isExpired ? (
                      <div className="flex items-center gap-1.5 mt-1 font-mono">
                        {[
                          { val: String(countdown.h).padStart(2, "0"), unit: "giờ" },
                          { val: String(countdown.m).padStart(2, "0"), unit: "phút" },
                          { val: String(countdown.s).padStart(2, "0"), unit: "giây" },
                        ].map((seg, i) => (
                          <React.Fragment key={i}>
                            {i > 0 && (
                              <span
                                className={`font-bold ${
                                  countdown.isUrgent ? "text-amber-400" : "text-blue-400"
                                }`}
                              >
                                :
                              </span>
                            )}
                            <span
                              className={`px-1.5 py-0.5 rounded text-xs font-black tabular-nums border ${
                                countdown.isUrgent
                                  ? "bg-white text-amber-900 border-amber-300"
                                  : "bg-white text-blue-900 border-blue-200"
                              }`}
                            >
                              {seg.val} <span className="text-[9px] font-normal font-sans opacity-75">{seg.unit}</span>
                            </span>
                          </React.Fragment>
                        ))}
                      </div>
                    ) : (
                      <div className="text-[11px] font-mono text-rose-600 mt-0.5">
                        Mốc quá hạn: {fmtDate(currentDeadline)}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Thông báo sự cố nếu có */}
            {isCancelled && (
              <div className="mt-4 pt-4 border-t border-slate-100 flex items-start gap-3 text-rose-800 bg-rose-50/70 p-3.5 rounded-xl border border-rose-200">
                <XCircle size={18} className="text-rose-600 shrink-0 mt-0.5" />
                <div className="text-xs leading-relaxed">
                  <div className="font-bold text-rose-900 mb-0.5">Giao dịch đã kết thúc hoặc bị huỷ</div>
                  <div>
                    {trade.cancelledReason ||
                      "Giao dịch đã bị huỷ do không hoàn tất đúng thời hạn cam kết. Tiền ký quỹ được giải toả hoặc hoàn trả theo đúng quy chế sàn TrustSim."}
                  </div>
                </div>
              </div>
            )}

            {trade.status === "Disputed" && (
              <div className="mt-4 pt-4 border-t border-slate-100 flex items-start gap-3 text-amber-800 bg-amber-50/80 p-3.5 rounded-xl border border-amber-200">
                <Scale size={18} className="text-amber-700 shrink-0 mt-0.5" />
                <div className="text-xs leading-relaxed">
                  <div className="font-bold text-amber-950 mb-0.5">Giao dịch đang thụ lý tranh chấp</div>
                  <div>
                    Ban Kiểm Soát TrustSim đã nhận được yêu cầu đối soát và đang phong toả 100% tài khoản ký quỹ bảo chứng để giải quyết minh bạch giữa hai bên.
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ═══════════════════════════════════════════════════════
             3. DUAL-COCKPIT WORKSPACE (65% / 35%)
             ═══════════════════════════════════════════════════════ */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* ───────────────────────────────────────────────────
               LEFT COCKPIT (65% - lg:col-span-8):
               Tiến trình 4 bước + Action Hub + Dossier
               ─────────────────────────────────────────────────── */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* ── A. DẢI TIẾN TRÌNH 4 BƯỚC THU GỌN ── */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <ArrowRightLeft size={16} className="text-[#001743]" />
                    <h2 className="font-bold text-sm text-[#001743] m-0">
                      Quy trình chuyển nhượng & ký quỹ 4 bước
                    </h2>
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-500">
                    {isDone ? "4/4 Đã hoàn thành" : `Giai đoạn ${activeIdx + 1}/4`}
                  </span>
                </div>

                {/* Stepper ngang thu gọn responsive */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 relative">
                  {STEPS.map((step, idx) => {
                    const isCompleted = isDone || (!isCancelled && idx < activeIdx);
                    const isActive = !isDone && !isCancelled && idx === activeIdx;

                    return (
                      <div
                        key={step.key}
                        className={`p-3 rounded-xl border transition-all ${
                          isActive
                            ? "bg-[#001743] border-[#001743] text-white shadow-sm ring-2 ring-[#001743]/10"
                            : isCompleted
                            ? "bg-emerald-50/70 border-emerald-200 text-emerald-950"
                            : "bg-slate-50/70 border-slate-200 text-slate-500"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                              isActive
                                ? "bg-white text-[#001743]"
                                : isCompleted
                                ? "bg-emerald-600 text-white"
                                : "bg-slate-200 text-slate-600"
                            }`}
                          >
                            {isCompleted ? <Check size={12} strokeWidth={3} /> : step.stepNumber}
                          </div>
                          {isActive && (
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                          )}
                        </div>

                        <div className="text-xs font-bold leading-tight truncate">
                          {step.label}
                        </div>
                        <div
                          className={`text-[10px] mt-0.5 truncate ${
                            isActive ? "text-slate-300" : isCompleted ? "text-emerald-700" : "text-slate-400"
                          }`}
                        >
                          {step.shortDesc}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ── B. INTERACTIVE ACTION HUB: THAO TÁC THEO BƯỚC ── */}
              <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-xs overflow-hidden">
                <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#E4011E]" />
                    <h3 className="font-extrabold text-sm text-[#001743] m-0">
                      Hành động cần thực hiện
                    </h3>
                  </div>
                  <span className="text-[11px] font-bold font-mono text-slate-500 px-2 py-0.5 bg-white border border-slate-200 rounded">
                    {STEPS[activeIdx]?.label.toUpperCase()}
                  </span>
                </div>

                <div className="p-5 sm:p-6">
                  
                  {/* BƯỚC 1: KÝ QUỸ (PendingEscrow) */}
                  {active === "escrow" && (
                    <div className="space-y-4">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center shrink-0">
                          <Wallet size={22} />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-extrabold text-base text-[#001743] mb-1">
                            {isBuyer
                              ? "Nạp tiền ký quỹ để bảo chứng giao dịch"
                              : "Đang chờ người mua nạp tiền ký quỹ bảo chứng"}
                          </h4>
                          <p className="text-xs text-slate-600 leading-relaxed">
                            Số tiền <strong>{fmt(trade.escrowAmount)}</strong> sẽ được chuyển vào tài khoản bảo đảm trung gian của TrustSim. Tiền hoàn toàn không chuyển trực tiếp cho người bán cho tới khi thủ tục sang tên SIM thành công.
                          </p>
                        </div>
                      </div>

                      <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                        <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                          <span className="text-slate-500">Số tiền bảo chứng:</span>
                          <span className="font-mono font-black text-slate-900 text-sm">
                            {fmt(trade.escrowAmount)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                          <span className="text-slate-500">Hạn chót nạp tiền:</span>
                          <span className="font-mono font-bold text-slate-800">
                            {fmtDate(trade.escrowDeadline)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-1">
                          <span className="text-slate-500">Cơ chế an toàn:</span>
                          <span className="font-bold text-emerald-700 flex items-center gap-1">
                            <ShieldCheck size={13} /> Bảo vệ hoàn tiền 100% nếu giao dịch không thành
                          </span>
                        </div>
                      </div>

                      {isBuyer ? (
                        <div className="pt-2 flex items-center gap-3 flex-wrap">
                          <Link
                            href="/profile?tab=transactions"
                            className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#E4011E] hover:bg-[#C20018] text-white text-xs font-bold rounded-xl transition-all shadow-xs"
                          >
                            <Wallet size={14} />
                            <span>Nạp tiền vào ví & Ký quỹ ngay</span>
                          </Link>
                          <span className="text-xs text-slate-400">
                            Giao dịch tự động huỷ nếu quá hạn nạp.
                          </span>
                        </div>
                      ) : (
                        <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-center gap-2">
                          <Info size={14} className="text-blue-600 shrink-0" />
                          <span>
                            Người bán chưa cần bàn giao SIM. Hệ thống sẽ gửi thông báo ngay khi tiền ký quỹ vào tài khoản bảo chứng.
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* BƯỚC 2: KÝ HỢP ĐỒNG (PendingSignature) */}
                  {active === "signature" && (
                    <div className="space-y-5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                        <div>
                          <h4 className="font-extrabold text-base text-[#001743] mb-0.5">
                            Ký kết hợp đồng chuyển nhượng điện tử
                          </h4>
                          <p className="text-xs text-slate-500">
                            Xác thực pháp lý số bằng mã OTP Email theo tiêu chuẩn Nghị định 130/2018/NĐ-CP.
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => setShowContractModal(true)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold rounded-xl transition-all shadow-2xs shrink-0 cursor-pointer"
                        >
                          <Eye size={13} />
                          <span>Đọc toàn văn hợp đồng</span>
                        </button>
                      </div>

                      {/* Trạng thái chữ ký 2 bên */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                          <div>
                            <div className="text-[11px] font-semibold text-slate-400">Bên Mua SIM</div>
                            <div className="text-xs font-bold text-slate-900 mt-0.5">
                              {maskName(trade.buyerName)}
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

                        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                          <div>
                            <div className="text-[11px] font-semibold text-slate-400">Bên Bán SIM</div>
                            <div className="text-xs font-bold text-slate-900 mt-0.5">
                              {maskName(trade.sellerName)}
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

                      {/* Console Ký Số OTP */}
                      {isParticipant && !hasUserSigned && (
                        <div className="p-5 bg-gradient-to-br from-blue-50/70 to-indigo-50/40 border border-blue-200 rounded-2xl space-y-4">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                              <div className="font-extrabold text-xs text-blue-950 uppercase tracking-wide">
                                Chữ ký điện tử của bạn
                              </div>
                              <p className="text-xs text-slate-600 mt-0.5">
                                Nhập mã xác thực OTP 6 số được gửi về địa chỉ email đăng ký tài khoản.
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={handleSendOtp}
                              disabled={sendingOtp || resendCooldown > 0}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-700 bg-white border border-blue-200 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0 shadow-2xs"
                            >
                              <Send size={12} />
                              <span>
                                {sendingOtp
                                  ? "Đang gửi OTP..."
                                  : resendCooldown > 0
                                  ? `Gửi lại sau (${resendCooldown}s)`
                                  : "Gửi mã OTP về Email"}
                              </span>
                            </button>
                          </div>

                          <div className="flex items-center gap-3 max-w-md">
                            <input
                              type="text"
                              maxLength={6}
                              placeholder="000000"
                              value={otpCode}
                              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                              className="flex-1 px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-base font-mono tracking-widest text-center font-black text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
                            />
                            <button
                              type="button"
                              onClick={handleSignContract}
                              disabled={signingContract || otpCode.length !== 6}
                              className="px-5 py-2.5 bg-[#001743] hover:bg-[#00266B] disabled:bg-slate-300 text-white text-xs font-bold rounded-xl transition-all cursor-pointer disabled:cursor-not-allowed shadow-xs shrink-0"
                            >
                              {signingContract ? "Đang xác thực..." : "Xác nhận ký số"}
                            </button>
                          </div>

                          <div className="text-[11px] text-slate-500 italic flex items-center gap-1">
                            <ShieldCheck size={12} className="text-blue-600 shrink-0" />
                            <span>
                              Bằng việc nhập OTP, bạn cam kết thực hiện đúng các điều khoản trong hợp đồng chuyển nhượng.
                            </span>
                          </div>
                        </div>
                      )}

                      {isParticipant && hasUserSigned && (
                        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-xs font-bold text-emerald-900">
                          <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
                          <span>
                            Bạn đã hoàn tất ký hợp đồng điện tử. Đang chờ đối tác ký để chuyển tiếp sang bước sang tên SIM.
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* BƯỚC 3: SANG TÊN SIM (PendingTransfer) */}
                  {active === "transfer" && (
                    <div className="space-y-5">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-700 border border-teal-200 flex items-center justify-center shrink-0">
                          <Smartphone size={22} />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-extrabold text-base text-[#001743] mb-1">
                            Thực hiện thủ tục sang tên SIM chính chủ tại nhà mạng
                          </h4>
                          <p className="text-xs text-slate-600 leading-relaxed">
                            Bên bán và bên mua phối hợp ra điểm giao dịch của nhà mạng{" "}
                            <strong>{carrierName}</strong> để hoàn tất thủ tục đăng ký thông tin thuê bao chính chủ cho số SIM <strong>{trade.simPhoneNumber}</strong>.
                          </p>
                        </div>
                      </div>

                      {/* Danh sách biên bản sang tên đã nộp */}
                      {transferDetails?.proofs && transferDetails.proofs.length > 0 && (
                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                          <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                            <FileCheck size={14} className="text-teal-600" />
                            <span>Biên bản / Chứng từ sang tên đã tải lên ({transferDetails.proofs.length}):</span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {transferDetails.proofs.map((p, idx) => (
                              <a
                                key={idx}
                                href={p.proofDocumentUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center justify-between p-2.5 bg-white border border-slate-200 hover:border-blue-400 rounded-lg text-xs font-semibold text-slate-800 shadow-2xs transition-colors group"
                              >
                                <span className="flex items-center gap-2 truncate">
                                  <FileText size={13} className="text-slate-400 group-hover:text-blue-600" />
                                  <span className="truncate">Biên bản sang tên #{idx + 1}</span>
                                </span>
                                <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1 shrink-0">
                                  {fmtDate(p.uploadedAt)}
                                  <ExternalLink size={11} className="text-slate-400 group-hover:text-blue-600" />
                                </span>
                              </a>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Tác vụ người bán: Upload biên bản sang tên */}
                      {isSeller && (
                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                          <div className="font-bold text-xs text-[#001743]">
                            Bên Bán: Tải lên ảnh chụp biên bản sang tên / phiếu yêu cầu từ nhà mạng
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
                              className="inline-flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 transition-colors cursor-pointer shadow-2xs"
                            >
                              <Upload size={13} />
                              <span>{proofFile ? proofFile.name : "Chọn tệp biên bản sang tên..."}</span>
                            </button>

                            {proofFile && (
                              <button
                                type="button"
                                onClick={handleSubmitProof}
                                disabled={uploadingProof}
                                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#001743] hover:bg-[#00266B] disabled:bg-slate-300 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-xs"
                              >
                                <span>{uploadingProof ? "Đang tải lên..." : "Nộp biên bản đối soát"}</span>
                              </button>
                            )}
                          </div>

                          {proofPreviewUrl && (
                            <div className="mt-2">
                              <img
                                src={proofPreviewUrl}
                                alt="Biên bản xem trước"
                                className="max-h-48 rounded-xl border border-slate-200 shadow-2xs object-contain bg-white p-1"
                              />
                            </div>
                          )}
                        </div>
                      )}

                      {/* Tác vụ người mua: Xác nhận nhận SIM & Giải ngân */}
                      {isBuyer && (
                        <div className="p-5 bg-gradient-to-br from-emerald-50 to-teal-50/50 border border-emerald-200 rounded-2xl space-y-3">
                          <div className="flex items-center gap-2">
                            <ShieldCheck size={18} className="text-emerald-700" />
                            <h5 className="font-extrabold text-sm text-emerald-950 m-0">
                              Bên Mua: Xác nhận nhận SIM & Giải ngân ký quỹ
                            </h5>
                          </div>
                          <p className="text-xs text-emerald-900 leading-relaxed">
                            Vui lòng kiểm tra SIM đã nhận sóng, thông tin CCCD chính chủ đã cập nhật chính xác trên ứng dụng nhà mạng (My Viettel, My VNPT, My MobiFone...). Khi bạn xác nhận, số tiền <strong>{fmt(trade.escrowAmount)}</strong> sẽ được chuyển ngay lập tức cho người bán.
                          </p>
                          <button
                            type="button"
                            onClick={() => setShowConfirmModal(true)}
                            className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
                          >
                            <CheckCircle2 size={16} />
                            <span>Tôi đã nhận SIM & Đồng ý giải ngân</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* BƯỚC 4: HOÀN TẤT (Completed) */}
                  {isDone && (
                    <div className="p-5 bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl flex items-start gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                        <CheckCircle2 size={24} />
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-black text-base text-emerald-950 m-0">
                          Giao dịch chuyển nhượng hoàn tất thành công!
                        </h4>
                        <p className="text-xs text-emerald-800 leading-relaxed">
                          Số tiền <strong>{fmt(trade.escrowAmount)}</strong> đã được tất toán cho bên bán. Quyền sở hữu số SIM <strong>{trade.simPhoneNumber}</strong> đã hoàn toàn thuộc về bên mua.
                        </p>
                        {trade.completedAt && (
                          <div className="text-[11px] font-mono text-emerald-700 pt-1">
                            Thời điểm hoàn tất: {fmtDate(trade.completedAt)}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                </div>
              </div>

              {/* ── C. HỒ SƠ PHÁP LÝ & BẢN THẢO HỢP ĐỒNG ĐIỆN TỬ (ACCORDION) ── */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <button
                  type="button"
                  onClick={() => setContractAccordionOpen(!contractAccordionOpen)}
                  className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-slate-50/60 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <FileText size={16} className="text-[#001743]" />
                    <span className="font-bold text-sm text-[#001743]">
                      Văn bản hợp đồng chuyển nhượng điện tử
                    </span>
                    {trade.contractStatus && (
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                        {trade.contractStatus}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                    <span>{contractAccordionOpen ? "Thu gọn" : "Xem chi tiết"}</span>
                    {contractAccordionOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </div>
                </button>

                {contractAccordionOpen && (
                  <div className="p-5 border-t border-slate-100 bg-slate-50/40 space-y-4">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="text-xs text-slate-500">
                        Mã hợp đồng điện tử: <strong className="text-slate-800 font-mono">#{trade.tradeTransactionCode}</strong>
                      </div>
                      <div className="flex items-center gap-2">
                        {trade.documentUrl && (
                          <a
                            href={trade.documentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:border-slate-300 text-xs font-bold text-slate-700 rounded-lg shadow-2xs transition-colors"
                          >
                            <Download size={13} />
                            <span>Tải bản PDF đã ký số</span>
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() => setShowContractModal(true)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#001743] hover:bg-[#00266B] text-xs font-bold text-white rounded-lg shadow-2xs transition-colors cursor-pointer"
                        >
                          <Eye size={13} />
                          <span>Xem toàn màn hình</span>
                        </button>
                      </div>
                    </div>

                    {/* Nội dung xem trước thu nhỏ */}
                    <div className="bg-white p-5 rounded-xl border border-slate-200 max-h-80 overflow-y-auto text-xs leading-relaxed text-slate-700 shadow-inner">
                      {contractPreview?.htmlContent ? (
                        <div
                          dangerouslySetInnerHTML={{ __html: contractPreview.htmlContent }}
                          className="prose prose-xs max-w-none"
                        />
                      ) : (
                        <div className="p-6 text-center text-slate-400 space-y-2">
                          <FileText size={24} className="mx-auto text-slate-300" />
                          <p>Nội dung hợp đồng đang được khởi tạo và đồng bộ mã chứng thư số.</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

            </div>

            {/* ───────────────────────────────────────────────────
               RIGHT COCKPIT (35% - lg:col-span-4):
               VIP Physical SIM Card + Sổ Ký Quỹ + Audit Ledger
               ─────────────────────────────────────────────────── */}
            <div className="lg:col-span-4 space-y-5 lg:sticky lg:top-24">
              
              {/* ── 1. THẺ SIM VẬT LÝ VIP MICROCHIP ── */}
              <div>
                <PhysicalSimCard
                  phoneNumber={trade.simPhoneNumber || "0900000000"}
                  carrierName={carrierName}
                  price={trade.escrowAmount}
                  categoryName="Tài sản bảo đảm chuyển nhượng"
                  size="md"
                  className="shadow-md"
                />
              </div>

              {/* ── 2. SỔ TÀI KHOẢN KÝ QUỸ BẢO CHỨNG ── */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wallet size={15} className="text-[#001743]" />
                    <h3 className="font-bold text-xs uppercase tracking-wide text-[#001743] m-0">
                      Sổ Ký Quỹ Bảo Chứng
                    </h3>
                  </div>
                  {escrowStatusInfo && (
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full border"
                      style={{
                        color: escrowStatusInfo.color,
                        backgroundColor: escrowStatusInfo.bg,
                        borderColor: escrowStatusInfo.border,
                      }}
                    >
                      {escrowStatusInfo.label}
                    </span>
                  )}
                </div>

                <div className="p-5 space-y-3.5">
                  <div>
                    <span className="text-[11px] text-slate-400 block font-medium">
                      Tổng số tiền bảo chứng
                    </span>
                    <span className="font-mono text-2xl font-black text-[#001743] tabular-nums block mt-0.5">
                      {fmt(trade.escrowAmount)}
                    </span>
                    <span className="text-[11px] text-slate-500 mt-0.5 block leading-tight">
                      {escrowStatusInfo?.desc}
                    </span>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500">Phí dịch vụ sàn:</span>
                      <span className="font-bold text-emerald-600">0 ₫ (Miễn phí)</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500">Tài khoản lưu ký:</span>
                      <span className="font-bold text-slate-800">TrustSim Escrow Account</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500">Bảo hiểm giao dịch:</span>
                      <span className="font-bold text-emerald-700 flex items-center gap-1">
                        <ShieldCheck size={12} /> 100% Giá trị SIM
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── 3. HỒ SƠ ĐỐI SOÁT HAI BÊN (BUYER / SELLER) ── */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="px-5 py-3.5 border-b border-slate-100 flex items-center gap-2">
                  <User size={15} className="text-[#001743]" />
                  <h3 className="font-bold text-xs uppercase tracking-wide text-[#001743] m-0">
                    Đối tác tham gia giao dịch
                  </h3>
                </div>

                <div className="p-5 space-y-4">
                  {[
                    {
                      role: "Bên Mua (Nhận SIM)",
                      name: trade.buyerName,
                      id: trade.buyerId,
                      signed: contractPreview?.buyerSigned,
                    },
                    {
                      role: "Bên Bán (Chuyển quyền)",
                      name: trade.sellerName,
                      id: trade.sellerId,
                      signed: contractPreview?.sellerSigned,
                    },
                  ].map((party) => {
                    const isSelf = currentUser?.userId === party.id;
                    return (
                      <div key={party.role} className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#001743] text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-2xs">
                          {(party.name || "?").charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-mono font-bold text-xs text-[#001743] truncate">
                              {maskName(party.name)}
                            </span>
                            {isSelf && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                Bạn
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 font-medium">{party.role}</div>
                        </div>
                        <span title="Tài khoản đã eKYC" className="inline-flex items-center shrink-0">
                          <BadgeCheck size={16} className="text-blue-600" />
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ── 4. CHỨNG THỰC BẤT BIẾN (SHA-256 & BLOCKCHAIN TXHASH) ── */}
              {(trade.documentHash || trade.blockchainTxHash) && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                  <div className="px-5 py-3.5 border-b border-slate-100 flex items-center gap-2">
                    <ShieldAlert size={15} className="text-[#001743]" />
                    <h3 className="font-bold text-xs uppercase tracking-wide text-[#001743] m-0">
                      Chứng thực sổ cái bất biến
                    </h3>
                  </div>

                  <div className="p-5 space-y-3">
                    {trade.documentHash && (
                      <div>
                        <span className="text-[11px] text-slate-400 block font-medium mb-1">
                          Mã băm hợp đồng (SHA-256)
                        </span>
                        <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200">
                          <span className="font-mono text-[10px] text-slate-600 truncate flex-1">
                            {trade.documentHash}
                          </span>
                          <CopyText text={trade.documentHash} title="Sao chép SHA-256" />
                        </div>
                      </div>
                    )}

                    {trade.blockchainTxHash && (
                      <div>
                        <span className="text-[11px] text-slate-400 block font-medium mb-1">
                          Giao dịch Blockchain (TxHash)
                        </span>
                        <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200">
                          <span className="font-mono text-[10px] text-slate-600 truncate flex-1">
                            {trade.blockchainTxHash}
                          </span>
                          <CopyText text={trade.blockchainTxHash} title="Sao chép TxHash" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ── 5. CAM KẾT & HOTLINE TRỢ GIÚP ── */}
              <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 space-y-2 text-xs text-slate-600">
                <div className="font-bold text-[#001743] flex items-center gap-1.5">
                  <HelpCircle size={14} className="text-blue-600" />
                  <span>Cần hỗ trợ trong giao dịch?</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  Nếu có bất kỳ thắc mắc hoặc sự cố khi làm thủ tục sang tên SIM tại nhà mạng, hãy liên hệ ngay với đường dây nóng của TrustSim để được hỗ trợ can thiệp.
                </p>
                <div className="pt-1 flex items-center justify-between font-mono font-bold text-[#001743]">
                  <span>Hotline: 1900 8888</span>
                  <span className="text-[10px] font-sans font-medium text-emerald-600">Trực 24/7</span>
                </div>
              </div>

            </div>

          </div>

        </div>
      </main>

      {/* ═══════════════════════════════════════════════════════
         MODAL 1: XEM TOÀN BỘ VĂN BẢN HỢP ĐỒNG ĐIỆN TỬ
         ═══════════════════════════════════════════════════════ */}
      {showContractModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in-50"
        >
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#001743] text-white flex items-center justify-center">
                  <FileText size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-[#001743] m-0">
                    Văn bản hợp đồng chuyển nhượng #{trade.tradeTransactionCode}
                  </h3>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Hệ thống hợp đồng số hoá và chứng thư số TrustSim PAdES
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowContractModal(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 text-xs text-slate-700 leading-relaxed font-sans bg-slate-50/40">
              {contractPreview?.htmlContent ? (
                <div
                  dangerouslySetInnerHTML={{ __html: contractPreview.htmlContent }}
                  className="prose prose-xs max-w-none bg-white p-8 rounded-2xl border border-slate-200 shadow-2xs font-sans"
                />
              ) : (
                <div className="p-12 text-center text-slate-400">
                  <FileText size={36} className="mx-auto mb-3 text-slate-300" />
                  <p className="font-medium">Nội dung hợp đồng đang được khởi tạo và số hoá...</p>
                </div>
              )}
            </div>

            <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <div className="text-[11px] text-slate-400 font-mono">
                Mã SHA-256: {trade.documentHash ? trade.documentHash.slice(0, 16) + "..." : "Đang niêm phong"}
              </div>
              <button
                type="button"
                onClick={() => setShowContractModal(false)}
                className="px-5 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer shadow-2xs"
              >
                Đóng văn bản
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
         MODAL 2: XÁC NHẬN NHẬN SIM VÀ GIẢI NGÂN
         ═══════════════════════════════════════════════════════ */}
      {showConfirmModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in-50"
        >
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md p-6 text-center animate-in zoom-in-95">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={28} />
            </div>
            <h3 className="text-base font-black text-[#001743] mb-2 tracking-tight">
              Xác nhận nhận SIM & Giải ngân ký quỹ
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed mb-6">
              Bạn xác nhận đã nhận bàn giao SIM <strong>{trade.simPhoneNumber}</strong> và kiểm tra thông tin thuê bao chính chủ tại nhà mạng thành công. Số tiền bảo chứng <strong>{fmt(trade.escrowAmount)}</strong> sẽ được chuyển ngay lập tức cho người bán. Hành động này không thể hoàn tác.
            </p>

            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                disabled={confirmingTransfer}
                className="px-4 py-2.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                Kiểm tra lại
              </button>
              <button
                type="button"
                onClick={handleConfirmTransfer}
                disabled={confirmingTransfer}
                className="px-6 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-xs cursor-pointer disabled:opacity-50"
              >
                {confirmingTransfer ? "Đang xử lý..." : "Đồng ý giải ngân ngay"}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
