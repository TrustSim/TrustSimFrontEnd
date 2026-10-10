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
  { label: "10.000 ₫", val: 10_000 },
  { label: "50.000 ₫", val: 50_000 },
  { label: "100.000 ₫", val: 100_000 },
  { label: "200.000 ₫", val: 200_000 },
  { label: "500.000 ₫", val: 500_000 },
  { label: "1.000.000 ₫", val: 1_000_000 },
  { label: "2.000.000 ₫", val: 2_000_000 },
  { label: "5.000.000 ₫", val: 5_000_000 },
  { label: "10.000.000 ₫", val: 10_000_000 },
  { label: "50.000.000 ₫", val: 50_000_000 },
];

export const DepositModal: React.FC<DepositModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialAmount = 500_000,
}) => {
  const [amount, setAmount] = useState<number>(initialAmount);
  const [customInput, setCustomInput] = useState<string>(initialAmount.toLocaleString("vi-VN"));
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
      setAmount(initialAmount);
      setCustomInput(initialAmount.toLocaleString("vi-VN"));
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

  // Bộ đếm thời gian hiệu lực
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
              message: `Tài khoản của bạn đã được cộng ${depositAmount.toLocaleString("vi-VN")} ₫.`,
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
      setError(valRes.error || "Số tiền nạp không hợp lệ");
    } else {
      setError("");
    }
  };

  const handleCreateDeposit = async () => {
    const valRes = financialValidators.validateDeposit(amount);
    if (!valRes.isValid) {
      setError(valRes.error || "Số tiền nạp không hợp lệ");
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
        const remaining = Math.max(0, Math.floor((new Date(res.expiredAt).getTime() - Date.now()) / 1000));
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
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#001743] flex items-center justify-center shadow-xs border border-white/10 shrink-0">
              <Image
                src="/logo/S-White-Logo.png"
                alt="TrustSim"
                width={20}
                height={20}
                className="w-5 h-5 object-contain"
              />
            </div>
            <div>
              <h2 id="deposit-modal-title" className="text-sm font-bold text-[#001743] tracking-tight">
                {isCompleted
                  ? "Nạp tiền thành công"
                  : depositData
                  ? "Chuyển khoản VietQR SePay"
                  : "Nạp tiền vào ví TrustSim"}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {isCompleted
                  ? "Giao dịch đã được ghi nhận tự động"
                  : depositData
                  ? "Quét mã QR để cộng tiền tự động tức thì"
                  : "Cổng thanh toán tự động 24/7 (Tối thiểu 10.000 ₫)"}
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
            className="p-1.5 text-slate-400 hover:text-[#001743] hover:bg-slate-100 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E4011E] disabled:opacity-40"
            aria-label="Đóng cửa sổ"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto flex-1">
          {isCompleted ? (
            /* Bước 3: Nạp tiền thành công */
            <div className="flex flex-col items-center text-center py-3">
              <div className="w-14 h-14 rounded-full bg-emerald-50 border-2 border-emerald-200 text-emerald-600 flex items-center justify-center mb-3 shadow-xs">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <h3 className="text-lg font-bold text-[#001743]">
                Nạp tiền thành công!
              </h3>
              <p className="text-sm font-bold text-emerald-600 mt-1 mb-4 font-mono tabular-nums">
                +{((depositData?.amount ?? amount) || 0).toLocaleString("vi-VN")} ₫ đã được cộng vào ví
              </p>

              <div className="w-full bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 mb-4 text-xs text-slate-600 flex flex-col gap-2.5 text-left">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Mã giao dịch:</span>
                  <span className="font-mono font-bold text-[#001743]">
                    {depositData?.transactionCode || "GD-SEPAY"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Cổng thanh toán:</span>
                  <span className="font-semibold text-[#001743]">VietQR SePay (Tự động)</span>
                </div>
                <div className="flex justify-between items-center border-t border-dashed border-slate-200 pt-2">
                  <span className="text-slate-500">Trạng thái:</span>
                  <span className="inline-flex items-center gap-1.5 font-bold text-emerald-600">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Hoàn tất tức thì
                  </span>
                </div>
              </div>

              <div className="w-full mb-4 text-center">
                <span className="text-xs text-slate-500">
                  Đang tự động đóng trong <strong className="text-slate-700">{autoCloseCountdown} giây</strong>…
                </span>
                <div className="w-full h-1 bg-slate-100 rounded-full mt-2 overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-1000 ease-linear"
                    style={{ width: `${(autoCloseCountdown / 3) * 100}%` }}
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleComplete}
                className="w-full py-2.5 px-4 rounded-xl bg-[#001743] hover:bg-[#0A2566] text-white text-xs font-bold transition-colors shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E4011E] active:scale-[0.99]"
              >
                Hoàn tất & Đóng ngay
              </button>
            </div>
          ) : !depositData ? (
            /* Bước 1: Chọn số tiền */
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-[11px] font-bold text-[#001743] uppercase tracking-wider mb-2">
                  Chọn nhanh số tiền nạp
                </label>
                <div className="grid grid-cols-5 gap-1.5">
                  {PRESET_AMOUNTS.map((item) => {
                    const isSelected = amount === item.val;
                    return (
                      <button
                        key={item.val}
                        type="button"
                        onClick={() => handleSelectPreset(item.val)}
                        className={`py-2 px-1 text-xs rounded-lg border font-mono tabular-nums transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E4011E] active:scale-[0.98] ${
                          isSelected
                            ? "bg-[#001743] text-white border-[#001743] font-bold shadow-xs"
                            : "bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50 font-medium"
                        }`}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#001743] uppercase tracking-wider mb-2">
                  Hoặc nhập số tiền tùy ý (VNĐ) <span className="text-[#E4011E]">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={customInput}
                    onChange={handleCustomInputChange}
                    placeholder="Tối thiểu 10.000 ₫"
                    className={`w-full py-2.5 pl-3.5 pr-14 text-sm font-bold font-mono tabular-nums text-[#001743] bg-white border rounded-lg outline-none transition-colors focus-visible:ring-2 ${
                      error
                        ? "border-rose-400 focus-visible:ring-rose-500"
                        : "border-slate-200 focus-visible:border-[#001743] focus-visible:ring-[#001743]"
                    }`}
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    VNĐ
                  </span>
                </div>
                {error ? (
                  <p className="text-xs text-rose-500 font-medium mt-1.5">{error}</p>
                ) : (
                  <p className="text-xs text-slate-500 mt-1.5">
                    Tối thiểu <strong>10.000 ₫</strong>. Số tiền sẽ được cộng tự động vào ví sau 5–30 giây.
                  </p>
                )}
              </div>

              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-xs text-slate-600 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-[#001743] shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <strong className="text-[#001743] block">Cổng thanh toán tự động SePay VietQR</strong>
                  Quý khách quét mã QR từ ngân hàng bất kỳ. Hệ thống nhận diện và cộng số dư khả dụng tức thì 24/7.
                </div>
              </div>

              <button
                type="button"
                onClick={handleCreateDeposit}
                disabled={loading || amount < 10_000}
                className="w-full py-2.5 px-4 rounded-xl bg-[#001743] hover:bg-[#0A2566] disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-xs font-bold transition-colors shadow-xs flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E4011E] active:scale-[0.99]"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Đang tạo mã QR…
                  </>
                ) : (
                  <>
                    <span>Tạo mã nạp {amount.toLocaleString("vi-VN")} ₫</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          ) : (
            /* Bước 2: Hiển thị VietQR Code & Thông tin chuyển khoản */
            <div className="flex flex-col gap-3.5">
              {/* Alert đếm ngược */}
              <div className="flex items-center justify-between bg-rose-50 border border-rose-200/80 rounded-xl px-3.5 py-2 text-xs text-rose-800">
                <span className="flex items-center gap-1.5 font-medium">
                  <Clock className="w-3.5 h-3.5 text-rose-600" />
                  Mã nạp có hiệu lực trong:
                </span>
                <span className="font-mono font-bold text-rose-700 text-sm tabular-nums">
                  {formatCountdown(timeLeft)}
                </span>
              </div>

              {/* QR Code Frame */}
              <div className="flex flex-col items-center bg-slate-50 border border-slate-200/80 rounded-xl p-3.5">
                <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-xs">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={depositData.qrCodeUrl}
                    alt="VietQR SePay Payment"
                    className="w-40 h-40 object-contain block"
                  />
                </div>
                <p className="text-[11px] text-slate-500 text-center mt-2.5 leading-relaxed">
                  Mở ứng dụng Ngân hàng hoặc MoMo / Viettel Money để quét mã QR thanh toán nhanh
                </p>
              </div>

              {/* Thông tin chuyển khoản */}
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 text-xs">
                {/* Số tiền */}
                <div className="p-3 flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Số tiền cần nạp:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-[#E4011E] tabular-nums">
                      {depositData.amount.toLocaleString("vi-VN")} ₫
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(String(depositData.amount), "amount")}
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-bold border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E4011E] ${
                        copiedField === "amount"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {copiedField === "amount" ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" />
                          Đã chép
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 text-slate-500" />
                          Sao chép
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Cú pháp chuyển khoản */}
                <div className="p-3 bg-amber-50/60 flex justify-between items-center">
                  <div>
                    <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block">
                      Nội dung chuyển khoản (BẮT BUỘC):
                    </span>
                    <span className="font-mono font-bold text-sm text-amber-950 tabular-nums">
                      {depositData.transferContent}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(depositData.transferContent, "content")}
                    className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[11px] font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E4011E] ${
                      copiedField === "content"
                        ? "bg-emerald-600 text-white"
                        : "bg-amber-600 hover:bg-amber-700 text-white shadow-xs"
                    }`}
                  >
                    {copiedField === "content" ? (
                      <>
                        <Check className="w-3 h-3 text-white" />
                        Đã chép
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3 text-white" />
                        Sao chép mã
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Status polling hint */}
              <div className="flex items-center justify-center gap-2 py-1 text-slate-500 text-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Hệ thống đang tự động lắng nghe giao dịch chuyển khoản…</span>
              </div>

              {/* Action button */}
              <button
                type="button"
                onClick={() => setDepositData(null)}
                className="w-full py-2.5 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E4011E] active:scale-[0.99]"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Quay lại & Đổi số tiền khác
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
