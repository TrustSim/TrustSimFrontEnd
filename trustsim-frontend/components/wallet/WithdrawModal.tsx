/* Hallmark · component: modal · genre: modern-minimal · theme: trustsim-navy
 * states: default · hover · focus-visible · active · disabled · loading · error · success
 * contrast: pass (46–50)
 */

"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import {
  X,
  CheckCircle2,
  AlertCircle,
  Building2,
  CreditCard,
  User,
  ArrowRight,
  Loader2,
  FileText,
} from "lucide-react";
import { walletService } from "@/services/walletService";
import type { WalletTransactionDto } from "@/types/wallet";
import { financialValidators } from "@/utils/validators";

export interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableBalance: number;
  onSuccess?: (tx: WalletTransactionDto) => void;
}

const POPULAR_BANKS = [
  { code: "VCB", name: "Vietcombank (Ngoại Thương Việt Nam)", short: "Vietcombank" },
  { code: "MB", name: "MBBank (Quân Đội)", short: "MBBank" },
  { code: "TCB", name: "Techcombank (Kỹ Thương Việt Nam)", short: "Techcombank" },
  { code: "CTG", name: "VietinBank (Công Thương Việt Nam)", short: "VietinBank" },
  { code: "BIDV", name: "BIDV (Đầu Tư & Phát Triển Việt Nam)", short: "BIDV" },
  { code: "VPB", name: "VPBank (Việt Nam Thịnh Vượng)", short: "VPBank" },
  { code: "ACB", name: "ACB (Á Châu)", short: "ACB" },
  { code: "TPB", name: "TPBank (Tiên Phong)", short: "TPBank" },
  { code: "STB", name: "Sacombank (Sài Gòn Thương Tín)", short: "Sacombank" },
  { code: "VIB", name: "VIB (Quốc Tế Việt Nam)", short: "VIB" },
  { code: "HDB", name: "HDBank (Phát Triển TP.HCM)", short: "HDBank" },
  { code: "MSB", name: "MSB (Hàng Hải Việt Nam)", short: "MSB" },
  { code: "OCB", name: "OCB (Phương Đông)", short: "OCB" },
  { code: "LPB", name: "LPBank (Lộc Phát Việt Nam)", short: "LPBank" },
  { code: "SHB", name: "SHB (Sài Gòn - Hà Nội)", short: "SHB" },
  { code: "NAB", name: "Nam A Bank (Nam Á)", short: "Nam A Bank" },
  { code: "SEAB", name: "SeABank (Đông Nam Á)", short: "SeABank" },
  { code: "BAB", name: "Bac A Bank (Bắc Á)", short: "Bac A Bank" },
  { code: "CAKE", name: "Cake by VPBank (Ngân hàng số)", short: "Cake" },
  { code: "TIMO", name: "Timo by BVBank (Ngân hàng số)", short: "Timo" },
];

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

export const WithdrawModal: React.FC<WithdrawModalProps> = ({
  isOpen,
  onClose,
  availableBalance,
  onSuccess,
}) => {
  const [bankCode, setBankCode] = useState<string>("VCB");
  const [accountNumber, setAccountNumber] = useState<string>("");
  const [accountHolderName, setAccountHolderName] = useState<string>("");
  const [amount, setAmount] = useState<number>(0);
  const [amountInput, setAmountInput] = useState<string>("");
  const [note, setNote] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [completedTx, setCompletedTx] = useState<WalletTransactionDto | null>(null);

  useEffect(() => {
    if (isOpen) {
      setBankCode("VCB");
      setAccountNumber("");
      setAccountHolderName("");
      setAmount(0);
      setAmountInput("");
      setNote("");
      setError("");
      setCompletedTx(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "");
    if (!raw) {
      setAmount(0);
      setAmountInput("");
      setError("");
      return;
    }
    const val = parseInt(raw, 10);
    setAmount(val);
    setAmountInput(val.toLocaleString("vi-VN"));

    if (val > availableBalance) {
      setError(`Số tiền vượt quá số dư khả dụng (${availableBalance.toLocaleString("vi-VN")} ₫)`);
    } else if (val < 50_000) {
      setError("Số tiền rút tối thiểu là 50.000 ₫");
    } else if (val > 100_000_000) {
      setError("Số tiền rút tối đa mỗi lần là 100.000.000 ₫");
    } else {
      setError("");
    }
  };

  const handleSelectPreset = (val: number) => {
    setAmount(val);
    setAmountInput(val.toLocaleString("vi-VN"));
    if (val > availableBalance) {
      setError(`Số tiền vượt quá số dư khả dụng (${availableBalance.toLocaleString("vi-VN")} ₫)`);
    } else if (val < 50_000) {
      setError("Số tiền rút tối thiểu là 50.000 ₫");
    } else if (val > 100_000_000) {
      setError("Số tiền rút tối đa mỗi lần là 100.000.000 ₫");
    } else {
      setError("");
    }
  };

  const handleSelectPercentage = (percent: number) => {
    if (availableBalance <= 0) {
      setError("Số dư khả dụng hiện tại là 0 ₫");
      return;
    }
    const calculated = Math.floor((availableBalance * percent) / 100);
    const finalAmount = calculated < 50_000 ? availableBalance : calculated;
    setAmount(finalAmount);
    setAmountInput(finalAmount.toLocaleString("vi-VN"));

    if (finalAmount < 50_000) {
      setError("Số tiền rút tối thiểu là 50.000 ₫");
    } else if (finalAmount > 100_000_000) {
      setError("Số tiền rút tối đa mỗi lần là 100.000.000 ₫");
    } else {
      setError("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const selectedBank = POPULAR_BANKS.find((b) => b.code === bankCode);
    const bankName = selectedBank?.name || bankCode;

    // Strict validation matching CreateWithdrawCommandValidator
    const valResult = financialValidators.validateWithdraw({
      amount,
      destinationBankCode: bankCode,
      destinationBankName: bankName,
      destinationAccountNumber: accountNumber,
      destinationAccountHolderName: accountHolderName,
      note,
      availableBalance,
    });

    if (!valResult.isValid) {
      setError(valResult.error || "Thông tin rút tiền không hợp lệ.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await walletService.createWithdraw({
        amount,
        destinationBankCode: bankCode,
        destinationBankName: bankName,
        destinationAccountNumber: accountNumber.trim(),
        destinationAccountHolderName: accountHolderName.trim().toUpperCase(),
        note: note.trim() || undefined,
      });

      setCompletedTx(res);
      if (onSuccess) {
        onSuccess(res);
      }
    } catch (err: any) {
      setError(err.message || "Không thể thực hiện yêu cầu rút tiền. Vui lòng kiểm tra lại.");
    } finally {
      setLoading(false);
    }
  };

  const selectedBankObj = POPULAR_BANKS.find((b) => b.code === bankCode);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#001743]/60 backdrop-blur-xs transition-opacity duration-150 animate-in fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="withdraw-modal-title"
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
              <h2 id="withdraw-modal-title" className="text-sm font-bold text-[#001743] tracking-tight">
                {completedTx ? "Rút tiền thành công" : "Rút tiền về tài khoản ngân hàng"}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {completedTx
                  ? "Giao dịch đã được hệ thống phê duyệt tức thì"
                  : "Chuyển khoản tự động 24/7 (Tối thiểu 50.000 ₫)"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="p-1.5 text-slate-400 hover:text-[#001743] hover:bg-slate-100 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E4011E] disabled:opacity-40"
            aria-label="Đóng cửa sổ"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        {completedTx ? (
          /* ─── SUCCESS RECEIPT VIEW ─── */
          <div className="p-5 overflow-y-auto flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-full bg-emerald-50 border-2 border-emerald-200 text-emerald-600 flex items-center justify-center mb-3 shadow-xs">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <h3 className="text-lg font-bold text-[#001743]">
              Yêu cầu rút tiền thành công!
            </h3>
            <p className="text-sm font-bold text-emerald-600 mt-1 mb-4 font-mono tabular-nums">
              -{completedTx.amount.toLocaleString("vi-VN")} ₫ đã được xuất lệnh về tài khoản
            </p>

            {/* Receipt Summary Card */}
            <div className="w-full bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 mb-4 text-xs text-slate-600 flex flex-col gap-2.5 text-left">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Mã giao dịch:</span>
                <span className="font-mono font-bold text-[#001743] tracking-wider">
                  {completedTx.transactionCode}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Ngân hàng thụ hưởng:</span>
                <span className="font-semibold text-[#001743]">
                  {completedTx.destinationBankName || selectedBankObj?.short}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Số tài khoản nhận:</span>
                <span className="font-mono font-bold text-[#001743]">
                  {completedTx.destinationAccountNumberMasked || accountNumber}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Tên chủ tài khoản:</span>
                <span className="font-bold text-[#001743] uppercase">
                  {completedTx.destinationAccountHolderName || accountHolderName}
                </span>
              </div>
              <div className="flex justify-between items-center border-t border-dashed border-slate-200 pt-2">
                <span className="text-slate-500">Trạng thái xử lý:</span>
                <span className="inline-flex items-center gap-1.5 font-bold text-emerald-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Hoàn tất tức thì
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              Số dư khả dụng của bạn đã được cập nhật. Tiền sẽ về tài khoản ngân hàng trong vòng 1–5 phút tùy theo liên ngân hàng NAPAS 247.
            </p>

            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 px-4 rounded-xl bg-[#001743] hover:bg-[#0A2566] text-white text-xs font-bold transition-colors shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E4011E] active:scale-[0.99]"
            >
              Hoàn tất & Đóng
            </button>
          </div>
        ) : (
          /* ─── WITHDRAW FORM VIEW ─── */
          <form onSubmit={handleSubmit} className="p-5 overflow-y-auto flex flex-col gap-4">
            {/* Balance Overview */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Số Dư Khả Dụng
                </span>
                <div className="text-base font-bold text-[#001743] font-mono tabular-nums mt-0.5">
                  {availableBalance.toLocaleString("vi-VN")}{" "}
                  <span className="text-xs font-bold text-[#E4011E]">₫</span>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {[
                  { label: "25%", val: 25 },
                  { label: "50%", val: 50 },
                  { label: "75%", val: 75 },
                  { label: "100%", val: 100 },
                ].map((p) => (
                  <button
                    key={p.val}
                    type="button"
                    onClick={() => handleSelectPercentage(p.val)}
                    className="px-2 py-1 text-[11px] font-bold rounded-md border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E4011E] active:scale-[0.98]"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Amount Presets */}
            <div>
              <label className="block text-[11px] font-bold text-[#001743] uppercase tracking-wider mb-2">
                Chọn nhanh số tiền rút
              </label>
              <div className="grid grid-cols-4 gap-1.5">
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

            {/* Input Amount */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-[11px] font-bold text-[#001743] uppercase tracking-wider">
                  Số tiền muốn rút (VNĐ) <span className="text-[#E4011E]">*</span>
                </label>
                <span className="text-[11px] text-slate-400">Tối thiểu 50.000 ₫</span>
              </div>
              <div className="relative">
                <input
                  type="text"
                  value={amountInput}
                  onChange={handleAmountChange}
                  placeholder="Nhập số tiền (tối thiểu 50.000 ₫)"
                  required
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
            </div>

            {/* Bank Select */}
            <div>
              <label className="block text-[11px] font-bold text-[#001743] uppercase tracking-wider mb-1.5">
                Ngân hàng nhận tiền <span className="text-[#E4011E]">*</span>
              </label>
              <div className="relative">
                <select
                  value={bankCode}
                  onChange={(e) => setBankCode(e.target.value)}
                  className="w-full py-2.5 pl-3.5 pr-8 text-xs font-semibold text-[#001743] bg-white border border-slate-200 rounded-lg outline-none cursor-pointer focus-visible:border-[#001743] focus-visible:ring-2 focus-visible:ring-[#001743] transition-colors"
                >
                  {POPULAR_BANKS.map((b) => (
                    <option key={b.code} value={b.code}>
                      {b.code} — {b.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Account Number & Account Holder Name */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-[#001743] uppercase tracking-wider mb-1.5">
                  Số tài khoản nhận <span className="text-[#E4011E]">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value.replace(/[^0-9A-Za-z]/g, ""))}
                    placeholder="VD: 19036582910012"
                    required
                    className="w-full py-2 pl-3 pr-3 text-xs font-bold font-mono tabular-nums text-[#001743] bg-white border border-slate-200 rounded-lg outline-none focus-visible:border-[#001743] focus-visible:ring-2 focus-visible:ring-[#001743] transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#001743] uppercase tracking-wider mb-1.5">
                  Tên chủ tài khoản <span className="text-[#E4011E]">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={accountHolderName}
                    onChange={(e) => setAccountHolderName(e.target.value.toUpperCase())}
                    placeholder="VD: NGUYEN VAN AN"
                    required
                    className="w-full py-2 pl-3 pr-3 text-xs font-bold uppercase text-[#001743] bg-white border border-slate-200 rounded-lg outline-none focus-visible:border-[#001743] focus-visible:ring-2 focus-visible:ring-[#001743] transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Note Field */}
            <div>
              <label className="block text-[11px] font-bold text-[#001743] uppercase tracking-wider mb-1.5">
                Ghi chú rút tiền (Không bắt buộc)
              </label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="VD: Rút tiền về tài khoản ngân hàng chính chủ"
                className="w-full py-2 px-3 text-xs text-slate-700 bg-white border border-slate-200 rounded-lg outline-none focus-visible:border-[#001743] focus-visible:ring-2 focus-visible:ring-[#001743] transition-colors"
              />
            </div>

            {/* Settlement Summary Preview */}
            {amount >= 50_000 && amount <= availableBalance && (
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-xs text-slate-600 flex flex-col gap-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Số tiền trừ số dư ví:</span>
                  <span className="font-mono font-bold text-[#001743]">
                    {amount.toLocaleString("vi-VN")} ₫
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Phí giao dịch rút tiền:</span>
                  <span className="font-semibold text-emerald-600">0 ₫ (Miễn phí)</span>
                </div>
                <div className="flex justify-between items-center border-t border-dashed border-slate-200 pt-1.5">
                  <span className="font-bold text-[#001743]">Thực nhận vào tài khoản:</span>
                  <span className="font-mono font-bold text-sm text-[#E4011E] tabular-nums">
                    {amount.toLocaleString("vi-VN")} ₫
                  </span>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-rose-50 border border-rose-200/80 rounded-xl px-3 py-2 text-xs text-rose-700 font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Actions */}
            <div className="grid grid-cols-[1fr_1.6fr] gap-2.5 pt-1">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="py-2.5 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E4011E] active:scale-[0.99]"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={
                  loading ||
                  amount < 50_000 ||
                  amount > availableBalance ||
                  !accountNumber.trim() ||
                  !accountHolderName.trim()
                }
                className="py-2.5 px-4 rounded-xl bg-[#001743] hover:bg-[#0A2566] disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-xs font-bold transition-colors shadow-xs flex items-center justify-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E4011E] active:scale-[0.99]"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Đang gửi lệnh rút…
                  </>
                ) : (
                  <>
                    <span>Xác nhận rút tiền</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
