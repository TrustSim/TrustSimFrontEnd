/* Hallmark · component: modal · genre: soft-cloud-navy · theme: trustsim-navy
 * states: default · hover · focus-visible · active · disabled · loading · error · success
 * compliance: TRUSTSIM_DESIGN_SYSTEM.md (Soft-Cloud Navy, compact no-scroll layout, pill buttons, tabular-nums)
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
  QrCode,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import { addDemoDeposit, walletService } from "@/services/walletService";
import type { DepositResponseDto } from "@/types/wallet";
import { financialValidators } from "@/utils/validators";

export interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialAmount?: number;
}

const PRESET_AMOUNTS = [
  { label: "50k", full: "50.000 ₫", val: 50_000 },
  { label: "100k", full: "100.000 ₫", val: 100_000 },
  { label: "200k", full: "200.000 ₫", val: 200_000 },
  { label: "500k", full: "500.000 ₫", val: 500_000 },
  { label: "1.000k", full: "1.000.000 ₫", val: 1_000_000 },
  { label: "2.000k", full: "2.000.000 ₫", val: 2_000_000 },
  { label: "5.000k", full: "5.000.000 ₫", val: 5_000_000 },
  { label: "10.000k", full: "10.000.000 ₫", val: 10_000_000 },
];

const DEMO_DEPOSIT_ENABLED =
  process.env.NODE_ENV !== "production" &&
  process.env.NEXT_PUBLIC_ENABLE_DEMO_DEPOSIT !== "false";

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
  const [isDemoDeposit, setIsDemoDeposit] = useState<boolean>(false);
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
      setIsDemoDeposit(false);
      setError("");
      setTimeLeft(1800);
      setAutoCloseCountdown(3);
      hasNotifiedRef.current = false;
      idempotencyKeyRef.current = `DEP-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
    }
  }, [isOpen, initialAmount]);

  // Auto-polling SePay Webhook
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
        // Bỏ qua lỗi mạng tạm thời
      }
    };

    checkTransactionStatus();
    const pollInterval = setInterval(checkTransactionStatus, 2500);

    return () => {
      isPolling = false;
      clearInterval(pollInterval);
    };
  }, [depositData?.transactionId, isCompleted, isOpen]);

  // Bộ đếm thời gian mã QR (30 phút)
  useEffect(() => {
    if (!depositData || timeLeft <= 0 || isCompleted) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [depositData, timeLeft, isCompleted]);

  // Hoàn tất nạp tiền
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

  const handleDemoDeposit = () => {
    const valRes = financialValidators.validateDeposit(amount);
    if (!valRes.isValid) {
      setError(valRes.error || "Số tiền nạp tối thiểu là 10.000 ₫");
      return;
    }

    setLoading(true);
    setError("");
    const demoTransactionCode = `DEMO-${Date.now().toString(36).toUpperCase()}`;

    window.setTimeout(() => {
      addDemoDeposit(amount);
      setIsDemoDeposit(true);
      setDepositData({
        transactionId: demoTransactionCode,
        transactionCode: demoTransactionCode,
        amount,
        transferContent: "Nạp tiền giả lập",
        qrCodeUrl: "",
        expiredAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      });
      setIsCompleted(true);
      setLoading(false);
    }, 350);
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
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/45 backdrop-blur-xs transition-opacity duration-150 animate-in fade-in"
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
      <div className="relative w-full max-w-lg bg-white rounded-3xl border border-slate-100 shadow-[0_20px_60px_-15px_rgba(0,23,67,0.2)] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header - Compact & Sleek */}
        <div className="px-5 py-3.5 border-b border-slate-100 bg-gradient-to-b from-slate-50/90 to-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#001743] flex items-center justify-center shadow-xs text-white shrink-0">
              <Image
                src="/logo/S-White-Logo.png"
                alt="TrustSim"
                width={20}
                height={20}
                className="w-4.5 h-4.5 object-contain"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="deposit-modal-title" className="text-sm font-bold text-[#001743] tracking-tight">
                  {isCompleted
                    ? "Nạp tiền thành công"
                    : depositData
                    ? "Quét mã VietQR SePay"
                    : "Nạp tiền vào ví TrustSim"}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Tự động 24/7
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                {isCompleted
                  ? "Số dư khả dụng đã được cập nhật"
                  : depositData
                  ? "Mở App Ngân hàng quét QR để vào ví tức thì"
                  : "Cổng NAPAS 24/7 · Nạp tối thiểu 10.000 ₫"}
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
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-400 hover:text-[#001743] transition-all cursor-pointer focus-visible:outline-none disabled:opacity-40"
            aria-label="Đóng"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content - Everything within sight, NO SCROLL */}
        <div className="p-5">
          {isCompleted ? (
            /* ═══ BƯỚC 3: DIGITAL FINANCIAL RECEIPT ═══ */
            <div className="flex flex-col items-center text-center py-1">
              <div className="w-12 h-12 rounded-full bg-emerald-50 border-2 border-emerald-300 text-emerald-600 flex items-center justify-center mb-2 shadow-xs">
                <CheckCircle2 className="w-7 h-7" />
              </div>

              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 mb-1">
                Giao Dịch Đã Quyết Toán
              </span>
              <h3 className="text-base font-bold text-[#001743]">Nạp tiền thành công!</h3>
              <div className="text-2xl font-black text-emerald-600 font-mono tabular-nums my-1">
                +{(depositData?.amount ?? amount).toLocaleString("vi-VN")}{" "}
                <span className="text-xs font-bold">₫</span>
              </div>
              <p className="text-xs text-slate-500 mb-3">
                Số dư đã sẵn sàng để tham gia đấu giá hoặc thanh toán hợp đồng.
              </p>

              {/* Receipt Summary Box */}
              <div className="w-full bg-slate-50 border border-slate-200/80 rounded-xl p-3 mb-3 text-xs text-slate-600 flex flex-col gap-1.5 text-left">
                <div className="flex justify-between items-center pb-1.5 border-b border-slate-200/70 text-[11px]">
                  <span className="font-semibold text-slate-400">Mã giao dịch:</span>
                  <span className="font-mono font-bold text-[#001743]">
                    {depositData?.transactionCode || "GD-SEPAY-SUCCESS"}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-500">Kênh thanh toán:</span>
                  <span className="font-semibold text-[#001743]">
                    {isDemoDeposit ? "Giả lập nạp tiền" : "VietQR SePay (24/7)"}
                  </span>
                </div>
              </div>

              {/* Auto close progress */}
              <p className="text-[11px] text-slate-400 mb-3">
                Cửa sổ tự đóng sau <strong className="text-slate-700 font-mono">{autoCloseCountdown}s</strong>…
              </p>

              <button
                type="button"
                onClick={handleComplete}
                className="w-full py-2.5 px-5 rounded-full bg-[#001743] hover:bg-[#0A2558] text-white text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-98"
              >
                Xác nhận & Đóng
              </button>
            </div>
          ) : !depositData ? (
            /* ═══ BƯỚC 1: NHẬP SỐ TIỀN & TẠO QR ═══ */
            <div className="flex flex-col gap-3">
              {/* Input Amount */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-[#001743]">
                    Số tiền cần nạp (VNĐ) <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[11px] text-slate-400">
                    Tối thiểu: <strong className="text-slate-600 font-mono">10.000 ₫</strong>
                  </span>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    value={customInput}
                    onChange={handleCustomInputChange}
                    placeholder="Nhập số tiền (VD: 500.000)"
                    autoFocus
                    className={`w-full py-2.5 pl-3.5 pr-12 text-base font-black font-mono tabular-nums text-[#001743] bg-slate-50/70 border rounded-xl outline-none transition-all focus:bg-white ${
                      error
                        ? "border-rose-400 ring-2 ring-rose-100"
                        : "border-slate-200 hover:border-slate-300 focus:border-[#001743] focus:ring-2 focus:ring-[#001743]/10"
                    }`}
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 font-mono">
                    ₫
                  </span>
                </div>

                {error && (
                  <p className="text-[11px] text-rose-600 font-medium mt-1 flex items-center gap-1">
                    <AlertCircle size={12} className="shrink-0" />
                    <span>{error}</span>
                  </p>
                )}
              </div>

              {/* Preset Chips */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Chọn nhanh hạn mức:
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {PRESET_AMOUNTS.map((item) => {
                    const isSelected = amount === item.val;
                    return (
                      <button
                        key={item.val}
                        type="button"
                        onClick={() => handleSelectPreset(item.val)}
                        className={`py-1.5 px-1 text-xs rounded-full border font-mono tabular-nums transition-all text-center cursor-pointer active:scale-95 ${
                          isSelected
                            ? "bg-[#001743] text-white border-[#001743] font-bold shadow-xs"
                            : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200 font-medium"
                        }`}
                      >
                        {item.full}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* VietQR Note & Demo Sandbox in one compact row */}
              <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
                <div className="flex items-center gap-2 text-slate-600 text-[11px]">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>VietQR SePay tự động 24/7 · Vào ví sau 5–30s</span>
                </div>
                {DEMO_DEPOSIT_ENABLED && (
                  <button
                    type="button"
                    onClick={handleDemoDeposit}
                    disabled={loading || amount < 10_000}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-[11px] font-bold transition-all cursor-pointer active:scale-95 shrink-0"
                    title="Nạp tiền thử nghiệm trên trình duyệt"
                  >
                    <Sparkles className="w-3 h-3 text-amber-600" />
                    <span>Thử nghiệm</span>
                  </button>
                )}
              </div>

              {/* Submit CTA */}
              <button
                type="button"
                onClick={handleCreateDeposit}
                disabled={loading || amount < 10_000}
                className="w-full py-3 px-5 rounded-full bg-[#001743] hover:bg-[#0A2558] disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang tạo mã VietQR…</span>
                  </>
                ) : (
                  <>
                    <span>Tạo mã QR nạp {amount > 0 ? `${amount.toLocaleString("vi-VN")} ₫` : ""}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          ) : (
            /* ═══ BƯỚC 2: QUÉT MÃ VIETQR (COMPACT 2-COLUMN, NO SCROLL) ═══ */
            <div className="flex flex-col gap-3">
              {/* Countdown Bar */}
              <div className="flex items-center justify-between bg-rose-50 border border-rose-200 rounded-xl px-3.5 py-1.5 text-xs text-rose-900">
                <span className="flex items-center gap-1.5 font-medium text-[11px]">
                  <Clock className="w-3.5 h-3.5 text-rose-600 animate-pulse" />
                  <span>Mã có hiệu lực:</span>
                </span>
                <span className="font-mono font-bold text-rose-700 text-xs tabular-nums">
                  {formatCountdown(timeLeft)}
                </span>
              </div>

              {/* Side-by-Side: QR Code + Transfer Details */}
              <div className="grid grid-cols-[140px_1fr] gap-3 items-center bg-slate-50/70 border border-slate-200/80 rounded-2xl p-3">
                {/* QR Code Presentation */}
                <div className="flex flex-col items-center justify-center bg-white p-2 rounded-xl border border-slate-200 shadow-2xs">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={depositData.qrCodeUrl}
                    alt="VietQR"
                    className="w-32 h-32 object-contain rounded-lg"
                  />
                  <span className="text-[9px] font-mono font-bold text-slate-400 mt-1">VietQR 24/7</span>
                </div>

                {/* Transfer Info */}
                <div className="flex flex-col gap-2 min-w-0">
                  {/* Số tiền */}
                  <div className="bg-white px-3 py-2 rounded-xl border border-slate-200/80 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Số tiền:</span>
                      <span className="font-mono font-black text-sm text-[#001743] tabular-nums">
                        {depositData.amount.toLocaleString("vi-VN")} ₫
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(String(depositData.amount), "amount")}
                      className="px-2 py-1 rounded-full text-[10px] font-bold border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 transition-all cursor-pointer"
                    >
                      {copiedField === "amount" ? "Đã chép" : "Sao chép"}
                    </button>
                  </div>

                  {/* Nội dung bắt buộc */}
                  <div className="bg-amber-50/90 border border-amber-200 px-3 py-2 rounded-xl flex items-center justify-between">
                    <div className="min-w-0 pr-2">
                      <span className="text-[10px] font-bold text-amber-900 uppercase block">
                        Nội dung (BẮT BUỘC):
                      </span>
                      <span className="font-mono font-black text-xs text-amber-950 truncate block">
                        {depositData.transferContent}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(depositData.transferContent, "content")}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-all shrink-0 cursor-pointer ${
                        copiedField === "content"
                          ? "bg-emerald-600 text-white"
                          : "bg-amber-600 hover:bg-amber-700 text-white"
                      }`}
                    >
                      {copiedField === "content" ? "Đã chép" : "Sao chép"}
                    </button>
                  </div>

                  {/* Listening pill */}
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500 pt-0.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                    <span className="truncate">Đang tự động nhận diện chuyển khoản…</span>
                  </div>
                </div>
              </div>

              {/* Back CTA */}
              <button
                type="button"
                onClick={() => setDepositData(null)}
                className="w-full py-2.5 px-4 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Chọn lại số tiền</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DepositModal;
