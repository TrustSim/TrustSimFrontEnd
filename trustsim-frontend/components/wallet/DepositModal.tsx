/* Hallmark · component: modal · genre: modern-minimal · theme: trustsim-navy
 * states: default · hover · focus-visible · active · disabled · loading · error · success
 * contrast: pass (46–50)
 */

"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import {
  X,
  Check,
  Copy,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Clock,
  ShieldCheck,
  Zap,
  QrCode,
  Building2,
  Sparkles,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import { walletService } from "@/services/walletService";
import type { DepositResponseDto } from "@/types/wallet";
import { financialValidators } from "@/utils/validators";

export interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialAmount?: number;
}

const PRESET_AMOUNTS = [
  { label: "50.000 ₫", val: 50_000 },
  { label: "100.000 ₫", val: 100_000 },
  { label: "200.000 ₫", val: 200_000 },
  { label: "500.000 ₫", val: 500_000 },
  { label: "1.000.000 ₫", val: 1_000_000 },
  { label: "2.000.000 ₫", val: 2_000_000 },
  { label: "5.000.000 ₫", val: 5_000_000 },
  { label: "10.000.000 ₫", val: 10_000_000 },
];

export const DepositModal: React.FC<DepositModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialAmount = 500_000,
}) => {
  const [amount, setAmount] = useState<number>(initialAmount);
  const [customInput, setCustomInput] = useState<string>(
    initialAmount > 0 ? initialAmount.toLocaleString("vi-VN") : ""
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [depositData, setDepositData] = useState<DepositResponseDto | null>(null);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [error, setError] = useState<string>("");
  const [timeLeft, setTimeLeft] = useState<number>(1800);
  const [autoCloseCountdown, setAutoCloseCountdown] = useState<number>(3);

  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const onSuccessRef = useRef(onSuccess);
  onSuccessRef.current = onSuccess;
  const hasNotifiedRef = useRef<boolean>(false);
  const idempotencyKeyRef = useRef<string>("");

  useEffect(() => {
    if (isOpen) {
      const startAmount = initialAmount > 0 ? initialAmount : 500_000;
      setAmount(startAmount);
      setCustomInput(startAmount.toLocaleString("vi-VN"));
      setDepositData(null);
      setIsCompleted(false);
      setError("");
      setTimeLeft(1800);
      setAutoCloseCountdown(3);
      hasNotifiedRef.current = false;
      idempotencyKeyRef.current = `DEP-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
    }
  }, [isOpen, initialAmount]);

  // Auto-polling trạng thái giao dịch nạp tiền qua SePay Webhook
  useEffect(() => {
    if (!depositData?.transactionId || isCompleted || !isOpen) return;

    let isPolling = true;

    const checkTransactionStatus = async () => {
      try {
        const tx = await walletService.getTransactionById(depositData.transactionId);
        if (!isPolling) return;

        const status = String(tx?.transactionStatus ?? (tx as any)?.status ?? "").toUpperCase();
        const isDone =
          status === "COMPLETED" ||
          (tx?.transactionStatus as any) === 1 ||
          (tx as any)?.status === 1;

        if (isDone) {
          setIsCompleted(true);
        }
      } catch {
        // Bỏ qua lỗi mạng tạm thời trong lúc chờ webhook xử lý
      }
    };

    checkTransactionStatus();
    const pollInterval = setInterval(checkTransactionStatus, 2500);

    return () => {
      isPolling = false;
      clearInterval(pollInterval);
    };
  }, [depositData?.transactionId, isCompleted, isOpen]);

  // Bộ đếm thời gian hiệu lực mã QR (1800 giây = 30 phút)
  useEffect(() => {
    if (!depositData || timeLeft <= 0 || isCompleted) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [depositData, timeLeft, isCompleted]);

  // Xử lý khi nạp tiền hoàn tất
  useEffect(() => {
    if (!isCompleted || !isOpen) return;

    if (!hasNotifiedRef.current) {
      hasNotifiedRef.current = true;
      const depositAmount = depositData?.amount ?? amount;

      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("trustsim_toast", {
            detail: {
              type: "success",
              title: "Nạp tiền thành công!",
              message: `Tài khoản của bạn đã được cộng +${depositAmount.toLocaleString("vi-VN")} ₫.`,
              duration: 5000,
            },
          })
        );
      }

      if (onSuccessRef.current) {
        onSuccessRef.current();
      }
    }

    setAutoCloseCountdown(3);
    const countdownInterval = setInterval(() => {
      setAutoCloseCountdown((prev) => Math.max(0, prev - 1));
    }, 1000);

    const closeTimeout = setTimeout(() => {
      onCloseRef.current();
    }, 3000);

    return () => {
      clearInterval(countdownInterval);
      clearTimeout(closeTimeout);
    };
  }, [isCompleted, isOpen, depositData, amount]);

  if (!isOpen) return null;

  const handleSelectPreset = (val: number) => {
    setAmount(val);
    setCustomInput(val.toLocaleString("vi-VN"));
    setError("");
  };

  const handleCustomInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "");
    if (!raw) {
      setAmount(0);
      setCustomInput("");
      return;
    }
    const val = parseInt(raw, 10);
    setAmount(val);
    setCustomInput(val.toLocaleString("vi-VN"));
    const valRes = financialValidators.validateDeposit(val);
    if (!valRes.isValid) {
      setError(valRes.error || "Số tiền nạp tối thiểu là 10.000 ₫");
    } else {
      setError("");
    }
  };

  const handleCreateDeposit = async () => {
    const valRes = financialValidators.validateDeposit(amount);
    if (!valRes.isValid) {
      setError(valRes.error || "Số tiền nạp tối thiểu là 10.000 ₫");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const res = await walletService.createDeposit({
        amount,
        idempotencyKey: idempotencyKeyRef.current,
      });
      setDepositData(res);
      if (res.expiredAt) {
        const remaining = Math.max(
          0,
          Math.floor((new Date(res.expiredAt).getTime() - Date.now()) / 1000)
        );
        setTimeLeft(remaining || 1800);
      } else {
        setTimeLeft(1800);
      }
    } catch (err: any) {
      setError(err.message || "Không thể tạo yêu cầu nạp tiền. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const formatCountdown = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const handleComplete = () => {
    if (onSuccessRef.current) onSuccessRef.current();
    onCloseRef.current();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#001743]/60 backdrop-blur-xs transition-opacity duration-150 animate-in fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) {
          if (isCompleted && onSuccessRef.current) onSuccessRef.current();
          onCloseRef.current();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="deposit-modal-title"
    >
      <div className="relative w-full max-w-lg bg-white rounded-2xl border border-slate-200/90 shadow-2xl overflow-hidden flex flex-col max-h-[calc(100vh-2rem)] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#001743] flex items-center justify-center shadow-xs border border-white/10 shrink-0">
              <Image
                src="/logo/S-White-Logo.png"
                alt="TrustSim"
                width={22}
                height={22}
                className="w-5 h-5 object-contain"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="deposit-modal-title" className="text-sm font-bold text-[#001743] tracking-tight">
                  {isCompleted
                    ? "Nạp tiền thành công"
                    : depositData
                    ? "Chuyển khoản VietQR SePay"
                    : "Nạp tiền vào ví TrustSim"}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Tự động 24/7
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {isCompleted
                  ? "Số dư khả dụng đã được cập nhật vào ví"
                  : depositData
                  ? "Quét mã QR bằng App ngân hàng để cộng tiền tức thì"
                  : "Cổng thanh toán chuẩn NAPAS 247 · Tối thiểu 10.000 ₫"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              if (isCompleted && onSuccessRef.current) onSuccessRef.current();
              onCloseRef.current();
            }}
            disabled={loading}
            className="p-2 text-slate-400 hover:text-[#001743] hover:bg-slate-200/60 rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#001743] disabled:opacity-40 cursor-pointer"
            aria-label="Đóng cửa sổ"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Progression Strip (Khi chưa hoàn tất) */}
        {!isCompleted && (
          <div className="px-5 py-2.5 bg-white border-b border-slate-100 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 font-medium">
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  !depositData
                    ? "bg-[#001743] text-white"
                    : "bg-emerald-100 text-emerald-700"
                }`}
              >
                {!depositData ? "1" : <Check size={11} />}
              </span>
              <span className={!depositData ? "font-bold text-[#001743]" : "text-slate-500"}>
                1. Chọn số tiền
              </span>
            </div>
            <div className="w-8 h-[1px] bg-slate-200" />
            <div className="flex items-center gap-2 font-medium">
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  depositData
                    ? "bg-[#001743] text-white"
                    : "bg-slate-100 text-slate-400"
                }`}
              >
                2
              </span>
              <span className={depositData ? "font-bold text-[#001743]" : "text-slate-400"}>
                2. Quét mã VietQR
              </span>
            </div>
          </div>
        )}

        {/* Content Body */}
        <div className="p-5 overflow-y-auto flex-1">
          {isCompleted ? (
            /* ═══ BƯỚC 3: DIGITAL FINANCIAL RECEIPT (BIÊN LAI ĐIỆN TỬ THÀNH CÔNG) ═══ */
            <div className="flex flex-col items-center text-center py-2 animate-in fade-in duration-200">
              <div className="w-16 h-16 rounded-full bg-emerald-50 border-2 border-emerald-200 text-emerald-600 flex items-center justify-center mb-3 shadow-xs">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200/80 mb-2">
                Giao Dịch Đã Quyết Toán
              </span>
              <h3 className="text-xl font-black text-[#001743]">
                Nạp tiền thành công!
              </h3>
              <div className="text-2xl font-black text-emerald-600 font-mono tabular-nums my-2">
                +{(depositData?.amount ?? amount).toLocaleString("vi-VN")}{" "}
                <span className="text-sm font-bold">₫</span>
              </div>
              <p className="text-xs text-slate-500 mb-5">
                Số dư ví TrustSim đã được cộng tự động và sẵn sàng đặt cọc hoặc trả giá.
              </p>

              {/* Digital Receipt Voucher Card */}
              <div className="w-full bg-slate-50 border border-slate-200/90 rounded-2xl p-4 mb-5 text-xs text-slate-600 flex flex-col gap-2.5 text-left shadow-2xs">
                <div className="flex justify-between items-center pb-2 border-b border-slate-200/80">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Biên lai điện tử
                  </span>
                  <span className="font-mono text-[11px] text-slate-500">
                    {new Date().toLocaleTimeString("vi-VN")} · {new Date().toLocaleDateString("vi-VN")}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Mã giao dịch:</span>
                  <span className="font-mono font-bold text-[#001743] tracking-wide">
                    {depositData?.transactionCode || "GD-SEPAY-SUCCESS"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Kênh thanh toán:</span>
                  <span className="font-semibold text-[#001743]">VietQR SePay (Tự động 24/7)</span>
                </div>
                <div className="flex justify-between items-center border-t border-dashed border-slate-200 pt-2.5">
                  <span className="text-slate-500">Trạng thái:</span>
                  <span className="inline-flex items-center gap-1.5 font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Thành công 100%
                  </span>
                </div>
              </div>

              {/* Auto-close Progress Bar */}
              <div className="w-full mb-4 text-center">
                <span className="text-xs text-slate-500">
                  Cửa sổ sẽ tự động đóng sau <strong className="text-slate-700 font-mono">{autoCloseCountdown}s</strong>…
                </span>
                <div className="w-full h-1.5 bg-slate-100 rounded-full mt-2 overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-1000 ease-linear rounded-full"
                    style={{ width: `${(autoCloseCountdown / 3) * 100}%` }}
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleComplete}
                className="w-full py-3 px-4 rounded-xl bg-[#001743] hover:bg-[#00266B] text-white text-xs font-bold transition-all shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#001743] active:scale-[0.99] cursor-pointer"
              >
                Xác nhận & Đóng ngay
              </button>
            </div>
          ) : !depositData ? (
            /* ═══ BƯỚC 1: CHỌN SỐ TIỀN & PHƯƠNG THỨC NẠP ═══ */
            <div className="flex flex-col gap-4 animate-in fade-in duration-150">
              {/* Input Amount Section */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-[#001743]">
                    Số tiền muốn nạp (VNĐ) <span className="text-[#E4011E]">*</span>
                  </label>
                  <span className="text-[11px] font-semibold text-slate-400">
                    Tối thiểu: <strong className="text-slate-700 font-mono">10.000 ₫</strong>
                  </span>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    value={customInput}
                    onChange={handleCustomInputChange}
                    placeholder="Nhập số tiền (VD: 500.000)"
                    autoFocus
                    className={`w-full py-3.5 pl-4 pr-14 text-lg font-black font-mono tabular-nums text-[#001743] bg-white border rounded-xl outline-none transition-all ${
                      error
                        ? "border-rose-400 ring-2 ring-rose-100 focus:border-rose-500"
                        : "border-slate-200 hover:border-slate-300 focus:border-[#001743] focus:ring-2 focus:ring-[#001743]/15"
                    }`}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400 font-mono">
                    ₫
                  </span>
                </div>

                {error ? (
                  <p className="text-xs text-rose-600 font-medium mt-1.5 flex items-center gap-1">
                    <AlertCircle size={13} className="shrink-0" />
                    <span>{error}</span>
                  </p>
                ) : (
                  <p className="text-[11px] text-slate-500 mt-1.5">
                    Hệ thống sẽ tạo mã QR tương ứng để quý khách quét và nạp tự động.
                  </p>
                )}
              </div>

              {/* Curated Preset Chips */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Chọn nhanh hạn mức phổ biến:
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {PRESET_AMOUNTS.map((item) => {
                    const isSelected = amount === item.val;
                    return (
                      <button
                        key={item.val}
                        type="button"
                        onClick={() => handleSelectPreset(item.val)}
                        className={`py-2.5 px-2 text-xs rounded-xl border font-mono tabular-nums transition-all text-center cursor-pointer active:scale-[0.98] ${
                          isSelected
                            ? "bg-[#001743] text-white border-[#001743] font-bold shadow-xs ring-2 ring-[#001743]/20"
                            : "bg-slate-50/70 hover:bg-slate-100/90 text-slate-700 border-slate-200/80 font-medium"
                        }`}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* VietQR Assurance Box */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 text-xs text-slate-600 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#001743] text-white flex items-center justify-center shrink-0 mt-0.5">
                  <ShieldCheck size={16} />
                </div>
                <div className="leading-relaxed">
                  <strong className="text-[#001743] block font-bold text-xs">
                    Cổng nạp VietQR SePay tự động 24/7
                  </strong>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Hỗ trợ tất cả ứng dụng Ngân hàng Việt Nam (VCB, MB, TCB, BIDV, VPB...) và ví MoMo, Viettel Money. Tiền vào ví sau 5–30 giây.
                  </p>
                </div>
              </div>

              {/* Submit CTA */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleCreateDeposit}
                  disabled={loading || amount < 10_000}
                  className="w-full py-3.5 px-4 rounded-xl bg-[#001743] hover:bg-[#00266B] disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#001743] active:scale-[0.99] cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Đang tạo mã VietQR…</span>
                    </>
                  ) : (
                    <>
                      <span>Tiếp tục tạo mã nạp {amount > 0 ? `${amount.toLocaleString("vi-VN")} ₫` : ""}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            /* ═══ BƯỚC 2: VIETQR PAYMENT COCKPIT (QUÉT MÃ & THÔNG TIN CHUYỂN KHOẢN) ═══ */
            <div className="flex flex-col gap-3.5 animate-in fade-in duration-150">
              {/* Countdown Banner */}
              <div className="flex items-center justify-between bg-rose-50/80 border border-rose-200/90 rounded-xl px-4 py-2.5 text-xs text-rose-900 shadow-2xs">
                <span className="flex items-center gap-2 font-medium">
                  <Clock className="w-4 h-4 text-rose-600 animate-pulse" />
                  <span>Mã nạp có hiệu lực trong:</span>
                </span>
                <span className="font-mono font-black text-rose-700 text-sm tabular-nums">
                  {formatCountdown(timeLeft)}
                </span>
              </div>

              {/* QR Code Presentation Box */}
              <div className="flex flex-col items-center bg-slate-50/90 border border-slate-200/90 rounded-2xl p-4">
                <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm relative group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={depositData.qrCodeUrl}
                    alt="VietQR SePay Payment"
                    className="w-44 h-44 object-contain block mx-auto rounded-lg"
                  />
                  <div className="text-[10px] font-bold text-slate-400 text-center mt-2 flex items-center justify-center gap-1 font-mono">
                    <QrCode size={12} />
                    <span>VietQR · SePay Automatic Gateway</span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 text-center mt-3 leading-relaxed max-w-xs">
                  Mở ứng dụng <strong>Ngân hàng</strong> hoặc <strong>MoMo / ZaloPay</strong> để quét mã QR chuyển khoản chính xác tuyệt đối.
                </p>
              </div>

              {/* Transfer Spec Table */}
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 text-xs shadow-2xs">
                {/* Số tiền */}
                <div className="p-3.5 flex justify-between items-center">
                  <div>
                    <span className="text-[11px] text-slate-400 font-medium block">Số tiền cần chuyển:</span>
                    <span className="font-mono font-black text-base text-[#E4011E] tabular-nums mt-0.5 block">
                      {depositData.amount.toLocaleString("vi-VN")} ₫
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(String(depositData.amount), "amount")}
                    className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                      copiedField === "amount"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {copiedField === "amount" ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Đã chép</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-500" />
                        <span>Sao chép</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Nội dung chuyển khoản BẮT BUỘC (CRITICAL HIGHLIGHT) */}
                <div className="p-3.5 bg-amber-50/70 border-y border-amber-200 flex justify-between items-center">
                  <div className="min-w-0 pr-3">
                    <span className="text-[10px] font-bold text-amber-900 uppercase tracking-wider block">
                      Nội dung chuyển khoản (BẮT BUỘC):
                    </span>
                    <span className="font-mono font-black text-sm text-amber-950 tabular-nums break-all mt-0.5 block">
                      {depositData.transferContent}
                    </span>
                    <span className="text-[10px] text-amber-700/90 block mt-0.5">
                      Vui lòng giữ nguyên nội dung để được cộng tiền tự động
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(depositData.transferContent, "content")}
                    className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer shadow-xs ${
                      copiedField === "content"
                        ? "bg-emerald-600 text-white"
                        : "bg-amber-600 hover:bg-amber-700 text-white active:scale-[0.98]"
                    }`}
                  >
                    {copiedField === "content" ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-white" />
                        <span>Đã chép mã</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-white" />
                        <span>Sao chép mã</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Status Listening Indicator */}
              <div className="flex items-center justify-center gap-2 py-2 text-slate-500 text-xs">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-medium text-slate-600">
                  Hệ thống đang tự động lắng nghe giao dịch chuyển khoản…
                </span>
              </div>

              {/* Back CTA */}
              <button
                type="button"
                onClick={() => setDepositData(null)}
                className="w-full py-3 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all flex items-center justify-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#001743] active:scale-[0.99] cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Quay lại đổi số tiền nạp</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DepositModal;
