/* Hallmark · component: modal · genre: soft-cloud-navy · theme: trustsim-navy
 * states: default · hover · focus-visible · active · disabled · loading · error · success
 * compliance: TRUSTSIM_DESIGN_SYSTEM.md (Soft-Cloud Navy, compact no-scroll layout, pill buttons, tabular-nums)
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
  ShieldCheck,
  Check,
  Copy,
  ChevronDown,
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
  { label: "100k", full: "100.000 ₫", val: 100_000 },
  { label: "200k", full: "200.000 ₫", val: 200_000 },
  { label: "500k", full: "500.000 ₫", val: 500_000 },
  { label: "1.000k", full: "1.000.000 ₫", val: 1_000_000 },
  { label: "2.000k", full: "2.000.000 ₫", val: 2_000_000 },
  { label: "5.000k", full: "5.000.000 ₫", val: 5_000_000 },
  { label: "10.000k", full: "10.000.000 ₫", val: 10_000_000 },
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
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

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
      setCopiedCode(false);
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
      setError(`Vượt quá số dư (${availableBalance.toLocaleString("vi-VN")} ₫)`);
    } else if (val < 50_000) {
      setError("Tối thiểu là 50.000 ₫");
    } else if (val > 100_000_000) {
      setError("Tối đa là 100.000.000 ₫/lần");
    } else {
      setError("");
    }
  };

  const handleSelectPreset = (val: number) => {
    setAmount(val);
    setAmountInput(val.toLocaleString("vi-VN"));
    if (val > availableBalance) {
      setError(`Vượt quá số dư (${availableBalance.toLocaleString("vi-VN")} ₫)`);
    } else if (val < 50_000) {
      setError("Tối thiểu là 50.000 ₫");
    } else if (val > 100_000_000) {
      setError("Tối đa là 100.000.000 ₫/lần");
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
      setError("Tối thiểu là 50.000 ₫");
    } else if (finalAmount > 100_000_000) {
      setError("Tối đa là 100.000.000 ₫/lần");
    } else {
      setError("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const selectedBank = POPULAR_BANKS.find((b) => b.code === bankCode);
    const bankName = selectedBank?.name || bankCode;

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
      setError(err.message || "Không thể thực hiện yêu cầu rút tiền.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const selectedBankObj = POPULAR_BANKS.find((b) => b.code === bankCode);
  const remainingBalanceAfterWithdraw = Math.max(0, availableBalance - amount);

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/45 backdrop-blur-xs transition-opacity duration-150 animate-in fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="withdraw-modal-title"
    >
      <div className="relative w-full max-w-xl bg-white rounded-3xl border border-slate-100 shadow-[0_20px_60px_-15px_rgba(0,23,67,0.2)] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
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
                <h2 id="withdraw-modal-title" className="text-sm font-bold text-[#001743] tracking-tight">
                  {completedTx ? "Rút tiền thành công" : "Rút tiền về tài khoản ngân hàng"}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  NAPAS 24/7
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                {completedTx
                  ? "Lệnh chuyển khoản đã được ghi nhận và xuất tiền"
                  : "Chuyển tiền liên ngân hàng tức thì · Tối thiểu 50.000 ₫"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-400 hover:text-[#001743] transition-all cursor-pointer focus-visible:outline-none disabled:opacity-40"
            aria-label="Đóng"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body - Compact, NO SCROLL */}
        <div className="p-5">
          {completedTx ? (
            /* ═══ SUCCESS DIGITAL RECEIPT VOUCHER ═══ */
            <div className="flex flex-col items-center text-center py-1">
              <div className="w-12 h-12 rounded-full bg-emerald-50 border-2 border-emerald-300 text-emerald-600 flex items-center justify-center mb-2 shadow-xs">
                <CheckCircle2 className="w-7 h-7" />
              </div>

              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 mb-1">
                Lệnh Rút Tiền Đã Ghi Nhận
              </span>
              <h3 className="text-base font-bold text-[#001743]">Yêu cầu rút tiền thành công!</h3>
              <div className="text-2xl font-black text-rose-600 font-mono tabular-nums my-1">
                -{completedTx.amount.toLocaleString("vi-VN")}{" "}
                <span className="text-xs font-bold">₫</span>
              </div>
              <p className="text-xs text-slate-500 mb-3 max-w-sm">
                Tiền sẽ vào tài khoản ngân hàng trong vòng 1–5 phút qua liên ngân hàng NAPAS 247.
              </p>

              {/* Receipt Box */}
              <div className="w-full bg-slate-50 border border-slate-200/80 rounded-xl p-3 mb-4 text-xs text-slate-600 flex flex-col gap-1.5 text-left">
                <div className="flex justify-between items-center pb-1.5 border-b border-slate-200/70 text-[11px]">
                  <span className="text-slate-400">Mã giao dịch:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-[#001743]">{completedTx.transactionCode}</span>
                    <button
                      type="button"
                      onClick={() => handleCopyCode(completedTx.transactionCode)}
                      className="p-0.5 text-slate-400 hover:text-[#001743]"
                    >
                      {copiedCode ? <Check size={11} className="text-emerald-600" /> : <Copy size={11} />}
                    </button>
                  </div>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-500">Ngân hàng thụ hưởng:</span>
                  <span className="font-bold text-[#001743]">
                    {completedTx.destinationBankName || selectedBankObj?.short}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-500">Số tài khoản & Tên nhận:</span>
                  <span className="font-mono font-bold text-[#001743]">
                    {completedTx.destinationAccountNumberMasked || accountNumber} (
                    {completedTx.destinationAccountHolderName || accountHolderName})
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 px-5 rounded-full bg-[#001743] hover:bg-[#0A2558] text-white text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-98"
              >
                Hoàn tất & Đóng
              </button>
            </div>
          ) : (
            /* ═══ WITHDRAW CONFIGURATION FORM (COMPACT, NO SCROLL) ═══ */
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              {/* Available Balance Banner with Fast Percentage Chips */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl px-3.5 py-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-400 font-medium">Số dư khả dụng:</span>
                  <span className="text-sm font-black text-[#001743] font-mono tabular-nums">
                    {availableBalance.toLocaleString("vi-VN")} ₫
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  {[
                    { label: "25%", val: 25 },
                    { label: "50%", val: 50 },
                    { label: "75%", val: 75 },
                    { label: "Tối đa", val: 100 },
                  ].map((p) => (
                    <button
                      key={p.val}
                      type="button"
                      onClick={() => handleSelectPercentage(p.val)}
                      className="px-2 py-0.5 text-[11px] font-bold rounded-full border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 transition-all cursor-pointer active:scale-95"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount Input */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold text-[#001743]">
                    Số tiền muốn rút (VNĐ) <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[11px] text-slate-400">
                    Min: <strong className="text-slate-600 font-mono">50.000 ₫</strong>
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    value={amountInput}
                    onChange={handleAmountChange}
                    placeholder="Nhập số tiền cần rút"
                    required
                    autoFocus
                    className={`w-full py-2.5 pl-3.5 pr-12 text-base font-black font-mono tabular-nums text-[#001743] bg-slate-50/70 border rounded-xl outline-none transition-all focus:bg-white ${
                      error && (amount < 50_000 || amount > availableBalance)
                        ? "border-rose-400 ring-2 ring-rose-100"
                        : "border-slate-200 hover:border-slate-300 focus:border-[#001743] focus:ring-2 focus:ring-[#001743]/10"
                    }`}
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 font-mono">
                    ₫
                  </span>
                </div>
              </div>

              {/* Preset Chips */}
              <div className="grid grid-cols-7 gap-1">
                {PRESET_AMOUNTS.map((item) => {
                  const isSelected = amount === item.val;
                  const isExceed = item.val > availableBalance;
                  return (
                    <button
                      key={item.val}
                      type="button"
                      onClick={() => handleSelectPreset(item.val)}
                      disabled={isExceed}
                      className={`py-1 text-xs rounded-full border font-mono tabular-nums transition-all text-center cursor-pointer active:scale-95 ${
                        isSelected
                          ? "bg-[#001743] text-white border-[#001743] font-bold shadow-xs"
                          : isExceed
                          ? "bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed opacity-50"
                          : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200 font-medium"
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>

              {/* Bank + Account Grid (2 Columns) */}
              <div className="grid grid-cols-2 gap-2.5">
                {/* Ngân hàng */}
                <div>
                  <label className="block text-[11px] font-bold text-[#001743] mb-1">
                    Ngân hàng <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={bankCode}
                      onChange={(e) => setBankCode(e.target.value)}
                      className="w-full py-2 pl-3 pr-8 text-xs font-bold text-[#001743] bg-slate-50/70 border border-slate-200 hover:border-slate-300 rounded-xl outline-none cursor-pointer focus:bg-white focus:border-[#001743] appearance-none"
                    >
                      {POPULAR_BANKS.map((b) => (
                        <option key={b.code} value={b.code}>
                          {b.code} — {b.short}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                {/* Số tài khoản */}
                <div>
                  <label className="block text-[11px] font-bold text-[#001743] mb-1">
                    Số tài khoản <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value.replace(/[^0-9A-Za-z]/g, ""))}
                    placeholder="VD: 19036582910012"
                    required
                    className="w-full py-2 px-3 text-xs font-bold font-mono text-[#001743] bg-slate-50/70 border border-slate-200 hover:border-slate-300 rounded-xl outline-none focus:bg-white focus:border-[#001743]"
                  />
                </div>
              </div>

              {/* Tên chủ tài khoản */}
              <div>
                <label className="block text-[11px] font-bold text-[#001743] mb-1">
                  Tên chủ tài khoản (viết hoa không dấu) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={accountHolderName}
                  onChange={(e) => setAccountHolderName(e.target.value.toUpperCase())}
                  placeholder="VD: NGUYEN VAN AN"
                  required
                  className="w-full py-2 px-3 text-xs font-bold uppercase text-[#001743] bg-slate-50/70 border border-slate-200 hover:border-slate-300 rounded-xl outline-none focus:bg-white focus:border-[#001743]"
                />
              </div>

              {/* Đối soát compact 1 dòng */}
              {amount >= 50_000 && amount <= availableBalance && (
                <div className="bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-1.5 text-[11px] flex items-center justify-between text-slate-600">
                  <span>Phí: <strong className="text-emerald-600">0 ₫ (Miễn phí)</strong></span>
                  <span>Ví còn lại: <strong className="font-mono text-[#001743]">{remainingBalanceAfterWithdraw.toLocaleString("vi-VN")} ₫</strong></span>
                  <span>Thực nhận: <strong className="font-mono font-black text-rose-600">{amount.toLocaleString("vi-VN")} ₫</strong></span>
                </div>
              )}

              {/* Error Alert */}
              {error && (
                <div className="bg-rose-50 border border-rose-200 rounded-xl px-3 py-1.5 text-[11px] text-rose-700 font-medium flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Actions */}
              <div className="grid grid-cols-[1fr_1.6fr] gap-2 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="py-2.5 px-3 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all disabled:opacity-40 cursor-pointer active:scale-98"
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
                  className="py-2.5 px-4 rounded-full bg-[#001743] hover:bg-[#0A2558] disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Đang gửi lệnh…</span>
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
    </div>
  );
};

export default WithdrawModal;
