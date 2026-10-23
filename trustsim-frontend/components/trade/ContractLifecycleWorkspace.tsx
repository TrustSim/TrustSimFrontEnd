"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  AlertTriangle,
  ArrowLeft,
  BadgeCheck,
  Banknote,
  Check,
  CheckCircle2,
  Clock3,
  Copy,
  Download,
  ExternalLink,
  Eye,
  FileCheck2,
  FileKey2,
  FileSignature,
  FileText,
  Fingerprint,
  LoaderCircle,
  LockKeyhole,
  RefreshCw,
  Send,
  ShieldCheck,
  Smartphone,
  Upload,
  UserRound,
  WalletCards,
  X,
  XCircle,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { ToastContainer, type ToastMessage } from "@/components/ui/Toast";
import { authService } from "@/services/authService";
import { uploadImageToCloudinary } from "@/services/cloudinaryService";
import { tradeService } from "@/services/tradeService";
import type {
  ContractPreviewDto,
  LiquidationPreviewDto,
  SimTransferDetailsDto,
  TradeTransactionDto,
  VerifyContractIntegrityResponse,
} from "@/types/trade";

type DocumentKind = "winning-notice" | "contract" | "liquidation";
type PreviewKind = "contract" | "liquidation";

const MONEY_FORMATTER = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});

const STAGES = [
  { key: "escrow", label: "Ký quỹ", detail: "Tiền được giữ an toàn", icon: WalletCards },
  { key: "contract", label: "Ký hợp đồng", detail: "Buyer và Seller xác thực", icon: FileSignature },
  { key: "carrier", label: "Sang tên", detail: "Thực hiện tại nhà mạng", icon: Smartphone },
  { key: "acceptance", label: "Nghiệm thu", detail: "Buyer kiểm tra và xác nhận", icon: FileCheck2 },
  { key: "settlement", label: "Giải ngân", detail: "Thanh lý và tất toán", icon: Banknote },
] as const;

const STATUS_META: Record<string, { label: string; tone: string; description: string }> = {
  PendingEscrow: {
    label: "Chờ hoàn tất ký quỹ",
    tone: "border-amber-200 bg-amber-50 text-amber-800",
    description: "Người mua cần hoàn tất tiền bảo chứng trước thời hạn.",
  },
  PendingSignature: {
    label: "Chờ ký hợp đồng",
    tone: "border-blue-200 bg-blue-50 text-blue-800",
    description: "Hợp đồng chỉ được niêm phong sau khi đủ điều kiện chữ ký.",
  },
  PendingTransfer: {
    label: "Đang sang tên SIM",
    tone: "border-cyan-200 bg-cyan-50 text-cyan-800",
    description: "Hai bên phối hợp làm thủ tục trực tiếp tại nhà mạng.",
  },
  Completed: {
    label: "Đã hoàn tất",
    tone: "border-emerald-200 bg-emerald-50 text-emerald-800",
    description: "Quyền sở hữu và dòng tiền đã được tất toán.",
  },
  Disputed: {
    label: "Đang tranh chấp",
    tone: "border-orange-200 bg-orange-50 text-orange-900",
    description: "Các hành động giải ngân đang được kiểm soát.",
  },
};

function money(value?: number | null) {
  return value == null ? "—" : MONEY_FORMATTER.format(value);
}

function dateTime(value?: string | null) {
  if (!value) return "Chưa xác lập";
  return new Date(value).toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function maskedName(value?: string | null) {
  if (!value) return "Chưa cập nhật";
  const words = value.trim().split(/\s+/);
  return words.length < 2 ? value : `${words[0]} ••• ${words.at(-1)}`;
}

function getActiveStage(trade: TradeTransactionDto, transfer: SimTransferDetailsDto | null) {
  if (trade.status === "Completed") return 4;
  if (trade.status === "PendingTransfer") {
    return transfer?.proofs?.length || transfer?.canConfirmTransfer ? 3 : 2;
  }
  if (trade.status === "PendingSignature") return 1;
  return 0;
}

function getDeadline(trade: TradeTransactionDto, stage: number) {
  if (stage === 0) return trade.escrowDeadline;
  if (stage === 1) return trade.signingDeadline;
  if (stage === 2) return trade.transferDeadline;
  if (stage === 3) return trade.liquidationDeadline;
  return null;
}

function useCountdown(deadline?: string | null) {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    if (!deadline) {
      setRemaining(0);
      return;
    }
    const update = () => setRemaining(Math.max(0, new Date(deadline).getTime() - Date.now()));
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [deadline]);

  const hours = Math.floor(remaining / 3_600_000);
  const minutes = Math.floor((remaining % 3_600_000) / 60_000);
  const seconds = Math.floor((remaining % 60_000) / 1000);
  return {
    text: `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`,
    expired: Boolean(deadline) && remaining === 0,
    urgent: remaining > 0 && remaining <= 3_600_000,
  };
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      aria-label="Sao chép"
      onClick={async () => {
        await navigator.clipboard.writeText(value);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1500);
      }}
      className="rounded-md p-1.5 text-slate-400 outline-none transition hover:bg-slate-100 hover:text-slate-700 focus-visible:ring-2 focus-visible:ring-blue-500"
    >
      {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
    </button>
  );
}

export default function ContractLifecycleWorkspace({ identifier }: { identifier: string }) {
  const [trade, setTrade] = useState<TradeTransactionDto | null>(null);
  const [contract, setContract] = useState<ContractPreviewDto | null>(null);
  const [transfer, setTransfer] = useState<SimTransferDetailsDto | null>(null);
  const [liquidation, setLiquidation] = useState<LiquidationPreviewDto | null>(null);
  const [integrity, setIntegrity] = useState<VerifyContractIntegrityResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpCooldown, setOtpCooldown] = useState(0);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofDescription, setProofDescription] = useState("");
  const [preview, setPreview] = useState<PreviewKind | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const currentUser = authService.getUser();

  const notify = useCallback((toast: Omit<ToastMessage, "id">) => {
    setToasts((items) => [...items, { ...toast, id: crypto.randomUUID() }]);
  }, []);

  const loadData = useCallback(async (silent = false) => {
    if (silent) setRefreshing(true);
    else setLoading(true);
    try {
      const nextTrade = await tradeService.getTradeByIdentifier(identifier);
      setTrade(nextTrade);

      const shouldLoadContract = nextTrade.status !== "PendingEscrow";
      const shouldLoadTransfer =
        nextTrade.status === "PendingTransfer" || nextTrade.status === "Completed";
      const [nextContract, nextTransfer] = await Promise.all([
        shouldLoadContract
          ? tradeService.getContractPreview(nextTrade.id).catch(() => null)
          : Promise.resolve(null),
        shouldLoadTransfer
          ? tradeService.getSimTransferDetails(nextTrade.id).catch(() => null)
          : Promise.resolve(null),
      ]);
      setContract(nextContract);
      setTransfer(nextTransfer);
    } catch (error) {
      notify({
        type: "error",
        title: "Không tải được hồ sơ",
        message: error instanceof Error ? error.message : "Hãy kiểm tra kết nối và thử lại.",
      });
      setTrade(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [identifier, notify]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    if (!contract?.isFullySigned || contract.documentPdfUrl || !trade) return;
    const timer = window.setInterval(async () => {
      const next = await tradeService.getContractPreview(trade.id).catch(() => null);
      if (next) setContract(next);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [contract?.documentPdfUrl, contract?.isFullySigned, trade]);

  useEffect(() => {
    if (otpCooldown <= 0) return;
    const timer = window.setInterval(() => setOtpCooldown((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [otpCooldown]);

  const activeStage = trade ? getActiveStage(trade, transfer) : 0;
  const deadline = trade ? getDeadline(trade, activeStage) : null;
  const countdown = useCountdown(deadline);
  const isCancelled = Boolean(trade?.status?.startsWith("Cancelled"));
  const isBuyer = currentUser?.userId === trade?.buyerId;
  const isSeller = currentUser?.userId === trade?.sellerId;
  const hasSigned = isBuyer ? contract?.buyerSigned : isSeller ? contract?.sellerSigned : true;
  const statusMeta = trade
    ? STATUS_META[trade.status] ?? {
        label: isCancelled ? "Giao dịch đã hủy" : trade.status,
        tone: isCancelled
          ? "border-rose-200 bg-rose-50 text-rose-800"
          : "border-slate-200 bg-slate-50 text-slate-700",
        description: isCancelled
          ? "Hồ sơ đã dừng; dòng tiền được xử lý theo quy chế sàn."
          : "Trạng thái hồ sơ đang được đồng bộ.",
      }
    : null;

  const documentItems = useMemo(() => [
    {
      kind: "winning-notice" as const,
      title: "Phiếu chốt giá trúng",
      description: "Kết quả đấu giá và nghĩa vụ thanh toán",
      available: Boolean(contract?.winningNoticeUrl),
      hash: contract?.winningNoticeHash,
    },
    {
      kind: "contract" as const,
      title: "Hợp đồng chuyển nhượng",
      description: "Bản ba bên đã niêm phong PAdES",
      available: Boolean(contract?.documentPdfUrl),
      hash: contract?.documentHash,
    },
    {
      kind: "liquidation" as const,
      title: "Biên bản nghiệm thu & thanh lý",
      description: "Chứng từ tất toán sau bàn giao",
      available: Boolean(contract?.liquidationDocumentUrl),
      hash: contract?.liquidationDocumentHash,
    },
  ], [contract]);

  const runAction = useCallback(async (
    key: string,
    action: () => Promise<void>,
    successMessage?: string,
  ) => {
    setBusyAction(key);
    try {
      await action();
      if (successMessage) notify({ type: "success", message: successMessage });
    } catch (error) {
      notify({
        type: "error",
        message: error instanceof Error ? error.message : "Không thể hoàn tất thao tác.",
      });
    } finally {
      setBusyAction(null);
    }
  }, [notify]);

  const sendOtp = () => runAction("send-otp", async () => {
    if (!trade) return;
    const result = await tradeService.sendSigningOtp(trade.id);
    setOtpCooldown(60);
    notify({ type: "success", title: "OTP đã được gửi", message: result.message });
  });

  const signContract = () => {
    if (!trade || otpCode.length !== 6) {
      notify({ type: "warning", message: "Nhập đủ 6 chữ số OTP trước khi ký." });
      return;
    }
    void runAction("sign", async () => {
      const result = await tradeService.signContract(trade.id, otpCode);
      setOtpCode("");
      notify({ type: "success", title: "Đã ghi nhận chữ ký", message: result.message });
      await loadData(true);
    });
  };

  const submitProof = () => {
    if (!trade || !proofFile) {
      notify({ type: "warning", message: "Chọn ảnh biên bản sang tên trước khi gửi." });
      return;
    }
    void runAction("proof", async () => {
      const uploaded = await uploadImageToCloudinary(proofFile, "general");
      if (!uploaded.success || !uploaded.url) {
        throw new Error(uploaded.error || "Không thể tải ảnh bằng chứng.");
      }
      await tradeService.submitTransferProof(trade.id, uploaded.url, proofDescription || undefined);
      setProofFile(null);
      setProofDescription("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      notify({
        type: "success",
        title: "Đã nộp biên bản",
        message: "Buyer đã được thông báo để kiểm tra SIM và nghiệm thu.",
      });
      await loadData(true);
    });
  };

  const selectProofFile = (file: File | null) => {
    if (!file) {
      setProofFile(null);
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      notify({ type: "warning", message: "Ảnh biên bản phải nhỏ hơn 5 MB." });
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    setProofFile(file);
  };

  const confirmTransfer = () => {
    if (!trade) return;
    void runAction("confirm", async () => {
      await tradeService.confirmTransfer(trade.id);
      setConfirmOpen(false);
      notify({
        type: "success",
        title: "Giao dịch đã hoàn tất",
        message: "Biên bản thanh lý được niêm phong và Escrow đã giải ngân.",
      });
      await loadData(true);
    });
  };

  const downloadDocument = (kind: DocumentKind) => {
    if (!trade) return;
    void runAction(`download-${kind}`, async () => {
      const blob = await tradeService.getDocumentBlob(trade.id, kind);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${kind}-${trade.tradeTransactionCode}.pdf`;
      anchor.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    });
  };

  const verifyIntegrity = () => {
    if (!trade) return;
    void runAction("verify", async () => {
      const blob = await tradeService.getDocumentBlob(trade.id, "contract");
      const digest = await crypto.subtle.digest("SHA-256", await blob.arrayBuffer());
      const hash = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
      const result = await tradeService.verifyContractIntegrity(trade.id, hash);
      setIntegrity(result);
      notify({
        type: result.isValid ? "success" : "error",
        title: result.isValid ? "Tài liệu nguyên vẹn" : "Không thể xác minh",
        message: result.message,
      });
    });
  };

  const openPreview = (kind: PreviewKind) => {
    if (!trade) return;
    if (kind === "contract") {
      setPreview("contract");
      return;
    }
    void runAction("liquidation-preview", async () => {
      const result = await tradeService.getLiquidationPreview(trade.id);
      setLiquidation(result);
      setPreview("liquidation");
    });
  };

  if (loading) return <LoadingState />;
  if (!trade) return <NotFoundState />;

  return (
    <div className="min-h-screen bg-[#f4f6f8] text-slate-900">
      <ToastContainer
        toasts={toasts}
        onClose={(id) => setToasts((items) => items.filter((item) => item.id !== id))}
      />
      <Navbar />

      <main className="mx-auto max-w-[1400px] px-4 pb-16 pt-24 sm:px-6 lg:px-8">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Link href="/profile?tab=contracts" className="inline-flex items-center gap-1.5 font-semibold hover:text-[#001743]">
              <ArrowLeft size={15} /> Hồ sơ hợp đồng
            </Link>
            <span>/</span>
            <span className="font-mono text-xs text-slate-700">{trade.tradeTransactionCode}</span>
          </div>
          <button
            type="button"
            onClick={() => void loadData(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-sm outline-none hover:border-slate-400 focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-60"
          >
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
            Đồng bộ hồ sơ
          </button>
        </div>

        <header className="overflow-hidden rounded-[22px] bg-[#001743] text-white shadow-[0_18px_50px_rgba(0,23,67,0.18)]">
          <div className="grid gap-8 px-6 py-7 md:px-9 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className={`rounded-full border px-3 py-1 text-xs font-bold ${statusMeta?.tone ?? ""}`}>
                  {statusMeta?.label}
                </span>
                {contract?.isAutoEnforced ? (
                  <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-blue-100">
                    Có cơ chế cưỡng chế đại diện
                  </span>
                ) : null}
              </div>
              <p className="mb-1 text-sm text-blue-200">Hồ sơ chuyển nhượng số thuê bao</p>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-black tracking-tight sm:text-3xl">{trade.simPhoneNumber}</h1>
                <span className="font-mono text-sm text-blue-200">{trade.tradeTransactionCode}</span>
                <CopyButton value={trade.tradeTransactionCode} />
              </div>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-blue-100/80">{statusMeta?.description}</p>
            </div>

            {deadline && trade.status !== "Completed" && !isCancelled ? (
              <div className={`min-w-64 rounded-2xl border p-4 ${countdown.expired ? "border-rose-300/40 bg-rose-500/15" : countdown.urgent ? "border-amber-300/40 bg-amber-400/15" : "border-white/15 bg-white/10"}`}>
                <div className="mb-1 flex items-center gap-2 text-xs font-semibold text-blue-100">
                  <Clock3 size={14} /> Hạn xử lý hiện tại
                </div>
                <div className="font-mono text-2xl font-black tracking-wider">
                  {countdown.expired ? "ĐÃ QUÁ HẠN" : countdown.text}
                </div>
                <div className="mt-1 text-xs text-blue-100/70">{dateTime(deadline)}</div>
              </div>
            ) : null}
          </div>

          <div className="border-t border-white/10 bg-[#001238] px-5 py-5 md:px-8">
            <ol className="grid grid-cols-1 gap-2 sm:grid-cols-5">
              {STAGES.map((stage, index) => {
                const Icon = stage.icon;
                const complete = trade.status === "Completed" || index < activeStage;
                const current = index === activeStage && trade.status !== "Completed";
                return (
                  <li key={stage.key} className="relative flex items-center gap-3 rounded-xl px-3 py-2.5 sm:block sm:px-2 sm:text-center">
                    <div className={`mx-0 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border sm:mx-auto ${complete ? "border-emerald-300 bg-emerald-400 text-[#001743]" : current ? "border-white bg-white text-[#001743]" : "border-white/20 bg-white/5 text-blue-200"}`}>
                      {complete ? <Check size={17} strokeWidth={3} /> : <Icon size={16} />}
                    </div>
                    <div className="sm:mt-2">
                      <div className={`text-xs font-bold ${current || complete ? "text-white" : "text-blue-200/70"}`}>{stage.label}</div>
                      <div className="mt-0.5 text-[10px] text-blue-200/55">{stage.detail}</div>
                    </div>
                    {index < STAGES.length - 1 ? <div className={`absolute left-[60%] right-[-40%] top-[27px] hidden h-px sm:block ${index < activeStage ? "bg-emerald-300" : "bg-white/15"}`} /> : null}
                  </li>
                );
              })}
            </ol>
          </div>
        </header>

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.65fr)_minmax(310px,0.75fr)]">
          <div className="space-y-6">
            <CurrentActionPanel
              trade={trade}
              contract={contract}
              transfer={transfer}
              isBuyer={isBuyer}
              isSeller={isSeller}
              hasSigned={Boolean(hasSigned)}
              otpCode={otpCode}
              otpCooldown={otpCooldown}
              busyAction={busyAction}
              proofFile={proofFile}
              proofDescription={proofDescription}
              fileInputRef={fileInputRef}
              onOtpChange={setOtpCode}
              onSendOtp={sendOtp}
              onSign={signContract}
              onFileChange={selectProofFile}
              onDescriptionChange={setProofDescription}
              onSubmitProof={submitProof}
              onConfirm={() => setConfirmOpen(true)}
              onPreviewContract={() => openPreview("contract")}
            />

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 px-5 py-4 sm:px-6">
                <h2 className="font-extrabold text-[#001743]">Bộ hồ sơ điện tử</h2>
                <p className="mt-1 text-sm text-slate-500">Ba văn bản theo suốt vòng đời giao dịch và thanh lý.</p>
              </div>
              <div className="divide-y divide-slate-100">
                {documentItems.map((item, index) => (
                  <div key={item.kind} className="grid gap-4 px-5 py-4 sm:grid-cols-[auto_1fr_auto] sm:items-center sm:px-6">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${item.available ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-400"}`}>
                      {item.available ? <FileCheck2 size={19} /> : <FileText size={19} />}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold text-slate-400">Văn bản {index + 1}</span>
                        <h3 className="font-bold text-slate-900">{item.title}</h3>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${item.available ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                          {item.available ? "Đã sẵn sàng" : "Chưa phát hành"}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-500">{item.description}</p>
                      {item.hash ? <p className="mt-1 truncate font-mono text-[10px] text-slate-400">SHA-256: {item.hash}</p> : null}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {item.kind === "contract" && contract ? (
                        <button type="button" onClick={() => openPreview("contract")} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50">
                          <Eye size={14} /> Xem
                        </button>
                      ) : null}
                      {item.kind === "liquidation" && trade.status === "Completed" ? (
                        <button type="button" onClick={() => openPreview("liquidation")} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50">
                          <Eye size={14} /> Xem
                        </button>
                      ) : null}
                      <button
                        type="button"
                        disabled={!item.available || busyAction === `download-${item.kind}`}
                        onClick={() => downloadDocument(item.kind)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-[#001743] px-3 py-2 text-xs font-bold text-white hover:bg-[#00245f] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
                      >
                        {busyAction === `download-${item.kind}` ? <LoaderCircle size={14} className="animate-spin" /> : <Download size={14} />} Tải PDF
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {contract?.documentPdfUrl ? (
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                  <div className="flex gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700"><Fingerprint size={21} /></div>
                    <div>
                      <h2 className="font-extrabold text-[#001743]">Kiểm tra bản PDF nguyên gốc</h2>
                      <p className="mt-1 max-w-xl text-sm leading-5 text-slate-500">Trình duyệt tải bản PDF, tính SHA-256 ngay trên thiết bị rồi đối chiếu với dấu niêm phong trong hệ thống.</p>
                    </div>
                  </div>
                  <button type="button" disabled={busyAction === "verify"} onClick={verifyIntegrity} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-xs font-bold text-blue-800 hover:bg-blue-100 disabled:opacity-60">
                    {busyAction === "verify" ? <LoaderCircle size={15} className="animate-spin" /> : <ShieldCheck size={15} />} Kiểm tra toàn vẹn
                  </button>
                </div>
                {integrity ? (
                  <div className={`mt-4 rounded-xl border p-4 text-sm ${integrity.isValid ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-rose-200 bg-rose-50 text-rose-900"}`}>
                    <div className="flex items-center gap-2 font-bold">{integrity.isValid ? <CheckCircle2 size={17} /> : <AlertTriangle size={17} />}{integrity.isValid ? "Hash trùng khớp bản niêm phong" : "Không thể xác nhận bản nguyên gốc"}</div>
                    <p className="mt-1 text-xs leading-5 opacity-80">{integrity.message}</p>
                  </div>
                ) : null}
              </section>
            ) : null}
          </div>

          <aside className="space-y-5">
            <InfoCard title="Tài chính bảo chứng" icon={<LockKeyhole size={17} />}>
              <InfoRow label="Giá trị Escrow" value={money(trade.escrowAmount)} strong />
              <InfoRow label="Trạng thái" value={trade.escrowStatus} />
              {transfer ? <><InfoRow label="Phí nền tảng" value={money(transfer.platformFeeAmount)} /><InfoRow label="Seller thực nhận" value={money(transfer.netSellerPayout)} strong /></> : <InfoRow label="Phí khi hoàn tất" value="5% giá trị giao dịch" />}
            </InfoCard>

            <InfoCard title="Các bên tham gia" icon={<UserRound size={17} />}>
              <Party name={trade.buyerName} role="Bên mua · Nhận SIM" signed={contract?.buyerSigned} self={isBuyer} />
              <Party name={trade.sellerName} role="Bên bán · Chuyển quyền" signed={contract?.sellerSigned} self={isSeller} />
            </InfoCard>

            <InfoCard title="Mốc thời gian" icon={<Clock3 size={17} />}>
              <InfoRow label="Khởi tạo" value={dateTime(trade.createdDate)} />
              <InfoRow label="Hạn ký" value={dateTime(trade.signingDeadline)} />
              <InfoRow label="Hạn sang tên" value={dateTime(trade.transferDeadline)} />
              <InfoRow label="Hạn nghiệm thu" value={dateTime(trade.liquidationDeadline)} />
              {trade.completedAt ? <InfoRow label="Hoàn tất" value={dateTime(trade.completedAt)} strong /> : null}
            </InfoCard>

            {transfer?.proofs?.length ? (
              <InfoCard title={`Chứng từ nhà mạng (${transfer.proofs.length})`} icon={<FileKey2 size={17} />}>
                <div className="space-y-2">
                  {transfer.proofs.map((proof) => (
                    <a key={proof.id} href={proof.imageUrl} target="_blank" rel="noreferrer" className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-3 hover:border-blue-300 hover:bg-blue-50/40">
                      <div className="min-w-0"><div className="truncate text-xs font-bold text-slate-800">{proof.description || "Biên bản sang tên"}</div><div className="mt-0.5 text-[10px] text-slate-400">{dateTime(proof.createdDate)} · {proof.proofStatus}</div></div>
                      <ExternalLink size={14} className="shrink-0 text-slate-400" />
                    </a>
                  ))}
                </div>
              </InfoCard>
            ) : null}
          </aside>
        </div>
      </main>

      {preview ? (
        <DocumentPreviewModal
          title={preview === "contract" ? "Hợp đồng chuyển nhượng quyền sử dụng SIM" : "Biên bản nghiệm thu và thanh lý"}
          subtitle={trade.tradeTransactionCode}
          html={preview === "contract" ? contract?.htmlContent : liquidation?.htmlContent}
          canDownload={preview === "contract" ? Boolean(contract?.documentPdfUrl) : Boolean(contract?.liquidationDocumentUrl)}
          onClose={() => setPreview(null)}
          onDownload={() => downloadDocument(preview === "contract" ? "contract" : "liquidation")}
        />
      ) : null}

      {confirmOpen ? (
        <ConfirmModal
          simNumber={trade.simPhoneNumber}
          escrowAmount={trade.escrowAmount}
          busy={busyAction === "confirm"}
          onClose={() => setConfirmOpen(false)}
          onConfirm={confirmTransfer}
        />
      ) : null}
      <Footer />
    </div>
  );
}

interface ActionPanelProps {
  trade: TradeTransactionDto;
  contract: ContractPreviewDto | null;
  transfer: SimTransferDetailsDto | null;
  isBuyer: boolean;
  isSeller: boolean;
  hasSigned: boolean;
  otpCode: string;
  otpCooldown: number;
  busyAction: string | null;
  proofFile: File | null;
  proofDescription: string;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onOtpChange: (value: string) => void;
  onSendOtp: () => void;
  onSign: () => void;
  onFileChange: (file: File | null) => void;
  onDescriptionChange: (value: string) => void;
  onSubmitProof: () => void;
  onConfirm: () => void;
  onPreviewContract: () => void;
}

function CurrentActionPanel(props: ActionPanelProps) {
  const { trade, contract, transfer } = props;
  const cancelled = trade.status.startsWith("Cancelled");
  if (cancelled || trade.status === "Disputed") {
    return <section className="rounded-2xl border border-rose-200 bg-white p-6 shadow-sm"><div className="flex gap-4"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-700"><XCircle size={21} /></div><div><h2 className="font-extrabold text-rose-950">Hồ sơ không thể tiếp tục</h2><p className="mt-1 text-sm leading-6 text-slate-600">Giao dịch đã bị hủy hoặc đang tranh chấp. Không thực hiện thêm thao tác ký, bàn giao hay giải ngân trên hồ sơ này.</p></div></div></section>;
  }

  if (trade.status === "PendingEscrow") {
    return <section className="rounded-2xl border border-amber-200 bg-white p-6 shadow-sm"><div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center"><div><p className="text-xs font-bold text-amber-700">Việc cần làm tiếp theo</p><h2 className="mt-1 text-xl font-black text-[#001743]">Hoàn tất tiền ký quỹ</h2><p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">Hợp đồng chỉ mở ký khi toàn bộ giá trị giao dịch đã được giữ trong tài khoản Escrow.</p></div>{props.isBuyer && trade.auctionId ? <Link href={`/auctions/${trade.auctionId}/payment`} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#e4011e] px-5 py-3 text-sm font-bold text-white hover:bg-[#c9001a]"><WalletCards size={17} /> Đi đến thanh toán</Link> : <span className="rounded-xl bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-800">Đang chờ Buyer hoàn tất</span>}</div></section>;
  }

  if (trade.status === "PendingSignature") {
    return (
      <section className="rounded-2xl border border-blue-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div><p className="text-xs font-bold text-blue-700">Việc cần làm tiếp theo</p><h2 className="mt-1 text-xl font-black text-[#001743]">Đọc và ký hợp đồng bằng OTP</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">OTP ghi nhận sự chấp thuận của bạn. Sau khi hai bên hoàn tất, TrustSim mới niêm phong bản PDF bằng chứng thư PAdES.</p></div>
          <button type="button" onClick={props.onPreviewContract} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50"><Eye size={15} /> Đọc toàn văn</button>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2"><SignerState label="Bên mua" signed={contract?.buyerSigned} at={contract?.buyerSignedAt} /><SignerState label="Bên bán" signed={contract?.sellerSigned} at={contract?.sellerSignedAt} /></div>
        {(props.isBuyer || props.isSeller) && !props.hasSigned ? (
          <div className="mt-5 rounded-2xl border border-blue-200 bg-blue-50/60 p-4 sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <label className="flex-1"><span className="mb-1.5 block text-xs font-bold text-slate-700">Mã OTP email gồm 6 chữ số</span><input value={props.otpCode} onChange={(event) => props.onOtpChange(event.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" placeholder="000000" className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-center font-mono text-lg font-black tracking-[0.35em] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" /></label>
              <button type="button" onClick={props.onSendOtp} disabled={props.otpCooldown > 0 || props.busyAction === "send-otp"} className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-200 bg-white px-4 py-3 text-xs font-bold text-blue-800 hover:bg-blue-50 disabled:opacity-50">{props.busyAction === "send-otp" ? <LoaderCircle size={15} className="animate-spin" /> : <Send size={15} />}{props.otpCooldown > 0 ? `Gửi lại sau ${props.otpCooldown}s` : "Gửi OTP"}</button>
              <button type="button" onClick={props.onSign} disabled={props.otpCode.length !== 6 || props.busyAction === "sign"} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#001743] px-5 py-3 text-xs font-bold text-white hover:bg-[#00245f] disabled:bg-slate-300">{props.busyAction === "sign" ? <LoaderCircle size={15} className="animate-spin" /> : <FileSignature size={15} />} Ký xác nhận</button>
            </div>
          </div>
        ) : <div className="mt-5 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-900"><CheckCircle2 size={19} /> Chữ ký của bạn đã được ghi nhận. Đang chờ điều kiện còn lại để niêm phong hợp đồng.</div>}
      </section>
    );
  }

  if (trade.status === "Completed") {
    return <section className="rounded-2xl border border-emerald-200 bg-white p-6 shadow-sm"><div className="flex gap-4"><div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700"><CheckCircle2 size={24} /></div><div><p className="text-xs font-bold text-emerald-700">Hồ sơ đã tất toán</p><h2 className="mt-1 text-xl font-black text-[#001743]">SIM đã sang tên, Escrow đã giải ngân</h2><p className="mt-2 text-sm leading-6 text-slate-600">Bạn có thể tải hợp đồng và biên bản thanh lý trong bộ hồ sơ điện tử phía dưới.</p></div></div></section>;
  }

  const hasProof = Boolean(transfer?.proofs?.length);
  return (
    <section className="rounded-2xl border border-cyan-200 bg-white p-5 shadow-sm sm:p-6">
      <p className="text-xs font-bold text-cyan-700">{hasProof ? "Đang nghiệm thu" : "Việc cần làm tiếp theo"}</p>
      <h2 className="mt-1 text-xl font-black text-[#001743]">{hasProof ? "Buyer kiểm tra SIM và xác nhận bàn giao" : "Hoàn tất sang tên tại nhà mạng"}</h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{hasProof ? "Kiểm tra SIM có sóng và thông tin chính chủ trước khi xác nhận. Xác nhận sẽ phát hành biên bản thanh lý và giải ngân Escrow." : "Buyer và Seller phối hợp tại điểm giao dịch nhà mạng. Sau khi hoàn tất, Seller nộp ảnh biên bản để bắt đầu thời hạn nghiệm thu."}</p>

      {props.isSeller && transfer?.canSubmitProof ? (
        <div className="mt-5 grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-[1fr_auto] sm:items-end">
          <div className="space-y-3">
            <label className="block"><span className="mb-1.5 block text-xs font-bold text-slate-700">Ảnh biên bản từ nhà mạng</span><input ref={props.fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => props.onFileChange(event.target.files?.[0] ?? null)} className="block w-full rounded-xl border border-slate-300 bg-white text-xs text-slate-600 file:mr-3 file:border-0 file:bg-[#001743] file:px-4 file:py-2.5 file:font-bold file:text-white" /></label>
            <label className="block"><span className="mb-1.5 block text-xs font-bold text-slate-700">Ghi chú</span><input value={props.proofDescription} onChange={(event) => props.onDescriptionChange(event.target.value)} placeholder="Ví dụ: Biên bản sang tên tại Viettel Quận 1" className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" /></label>
          </div>
          <button type="button" onClick={props.onSubmitProof} disabled={!props.proofFile || props.busyAction === "proof"} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#001743] px-5 py-3 text-xs font-bold text-white hover:bg-[#00245f] disabled:bg-slate-300">{props.busyAction === "proof" ? <LoaderCircle size={15} className="animate-spin" /> : <Upload size={15} />} Nộp biên bản</button>
        </div>
      ) : null}

      {props.isBuyer && transfer?.canConfirmTransfer ? (
        <div className="mt-5 flex flex-col justify-between gap-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 sm:flex-row sm:items-center"><div className="flex gap-3"><ShieldCheck className="mt-0.5 shrink-0 text-emerald-700" size={20} /><div><div className="text-sm font-bold text-emerald-950">Biên bản đã được Seller nộp</div><div className="mt-1 text-xs leading-5 text-emerald-800">Chỉ xác nhận sau khi SIM hoạt động và nhà mạng đã cập nhật đúng chính chủ.</div></div></div><button type="button" onClick={props.onConfirm} className="shrink-0 rounded-xl bg-emerald-700 px-5 py-3 text-xs font-bold text-white hover:bg-emerald-800">Xác nhận đã nhận SIM</button></div>
      ) : null}

      {!transfer?.canSubmitProof && !transfer?.canConfirmTransfer ? <div className="mt-5 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600"><Clock3 size={18} className="shrink-0 text-slate-400" /> Đang chờ bên có trách nhiệm hoàn tất bước tiếp theo.</div> : null}
    </section>
  );
}

function SignerState({ label, signed, at }: { label: string; signed?: boolean; at?: string | null }) {
  return <div className="flex items-center justify-between rounded-xl border border-slate-200 p-3.5"><div><div className="text-xs font-bold text-slate-900">{label}</div><div className="mt-0.5 text-[11px] text-slate-400">{signed ? dateTime(at) : "Chưa ký"}</div></div><span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold ${signed ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{signed ? <CheckCircle2 size={12} /> : <Clock3 size={12} />}{signed ? "Đã xác nhận" : "Đang chờ"}</span></div>;
}

function InfoCard({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="flex items-center gap-2 border-b border-slate-100 px-5 py-3.5 text-sm font-extrabold text-[#001743]">{icon}{title}</div><div className="space-y-3 p-5">{children}</div></section>;
}

function InfoRow({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return <div className="flex items-start justify-between gap-4 text-xs"><span className="text-slate-500">{label}</span><span className={`text-right ${strong ? "font-extrabold text-[#001743]" : "font-semibold text-slate-700"}`}>{value}</span></div>;
}

function Party({ name, role, signed, self }: { name?: string; role: string; signed?: boolean; self: boolean }) {
  return <div className="flex items-center gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#001743] text-sm font-black text-white">{name?.charAt(0).toUpperCase() || "?"}</div><div className="min-w-0 flex-1"><div className="flex items-center gap-1.5"><span className="truncate text-xs font-bold text-slate-900">{maskedName(name)}</span>{self ? <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[9px] font-bold text-blue-700">Bạn</span> : null}</div><div className="mt-0.5 text-[10px] text-slate-400">{role}</div></div>{signed ? <BadgeCheck size={17} className="shrink-0 text-emerald-600" /> : <Clock3 size={16} className="shrink-0 text-amber-500" />}</div>;
}

function DocumentPreviewModal({ title, subtitle, html, canDownload, onClose, onDownload }: { title: string; subtitle: string; html?: string | null; canDownload: boolean; onClose: () => void; onDownload: () => void }) {
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#001743]/70 p-3 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={title}><div className="flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"><div className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-4"><div className="min-w-0"><h2 className="truncate font-extrabold text-[#001743]">{title}</h2><p className="mt-0.5 font-mono text-[11px] text-slate-400">{subtitle}</p></div><button type="button" onClick={onClose} aria-label="Đóng" className="rounded-full p-2 text-slate-500 hover:bg-slate-100"><X size={19} /></button></div><div className="overflow-y-auto bg-slate-100 p-3 sm:p-6">{html ? <article className="mx-auto max-w-4xl rounded-sm bg-white p-5 shadow-sm sm:p-10" dangerouslySetInnerHTML={{ __html: html }} /> : <div className="py-20 text-center text-sm text-slate-500">Tài liệu đang được tạo. Hãy đồng bộ lại hồ sơ sau ít phút.</div>}</div><div className="flex justify-end gap-2 border-t border-slate-200 px-5 py-3"><button type="button" onClick={onClose} className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-bold text-slate-700">Đóng</button><button type="button" onClick={onDownload} disabled={!canDownload} className="inline-flex items-center gap-2 rounded-lg bg-[#001743] px-4 py-2 text-xs font-bold text-white disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"><Download size={14} /> Tải PDF</button></div></div></div>;
}

function ConfirmModal({ simNumber, escrowAmount, busy, onClose, onConfirm }: { simNumber: string; escrowAmount: number; busy: boolean; onClose: () => void; onConfirm: () => void }) {
  const [acknowledged, setAcknowledged] = useState(false);
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#001743]/70 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Xác nhận nghiệm thu"><div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"><div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700"><ShieldCheck size={24} /></div><h2 className="mt-4 text-xl font-black text-[#001743]">Xác nhận nghiệm thu và giải ngân?</h2><p className="mt-2 text-sm leading-6 text-slate-600">Bạn xác nhận SIM <strong>{simNumber}</strong> hoạt động bình thường và đã đứng tên chính chủ. Hệ thống sẽ phát hành biên bản thanh lý và giải ngân <strong>{money(escrowAmount)}</strong> theo cơ chế Escrow. Hành động này không thể hoàn tác.</p><label className="mt-4 flex cursor-pointer items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900"><input type="checkbox" checked={acknowledged} onChange={(event) => setAcknowledged(event.target.checked)} className="mt-0.5" /> Tôi đã kiểm tra SIM có sóng và thông tin chính chủ tại nhà mạng.</label><div className="mt-6 flex justify-end gap-2"><button type="button" onClick={onClose} disabled={busy} className="rounded-xl border border-slate-300 px-4 py-2.5 text-xs font-bold text-slate-700">Kiểm tra lại</button><button type="button" onClick={onConfirm} disabled={busy || !acknowledged} className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-5 py-2.5 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">{busy ? <LoaderCircle size={15} className="animate-spin" /> : <CheckCircle2 size={15} />} Xác nhận và giải ngân</button></div></div></div>;
}

function LoadingState() {
  return <div className="min-h-screen bg-[#f4f6f8]"><Navbar /><main className="mx-auto max-w-[1400px] px-4 pb-16 pt-24 sm:px-6 lg:px-8"><div className="h-64 animate-pulse rounded-[22px] bg-slate-200" /><div className="mt-6 grid gap-6 lg:grid-cols-[1.65fr_0.75fr]"><div className="h-96 animate-pulse rounded-2xl bg-slate-200" /><div className="h-72 animate-pulse rounded-2xl bg-slate-200" /></div></main></div>;
}

function NotFoundState() {
  return <div className="flex min-h-screen flex-col bg-[#f4f6f8]"><Navbar /><main className="flex flex-1 items-center justify-center px-4 pt-20"><div className="max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm"><AlertTriangle className="mx-auto text-rose-600" size={32} /><h1 className="mt-4 text-xl font-black text-[#001743]">Không thể mở hồ sơ</h1><p className="mt-2 text-sm leading-6 text-slate-500">Hồ sơ không tồn tại hoặc tài khoản hiện tại không có quyền truy cập.</p><Link href="/profile?tab=contracts" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#001743] px-5 py-3 text-sm font-bold text-white"><ArrowLeft size={16} /> Về danh sách hợp đồng</Link></div></main><Footer /></div>;
}
