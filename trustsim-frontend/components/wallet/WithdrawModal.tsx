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

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const selectedBankObj = POPULAR_BANKS.find((b) => b.code === bankCode);
  const remainingBalanceAfterWithdraw = Math.max(0, availableBalance - amount);

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
                <h2 id="withdraw-modal-title" className="text-sm font-bold text-[#001743] tracking-tight">
                  {completedTx ? "Rút tiền thành công" : "Rút tiền về tài khoản ngân hàng"}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  NAPAS 24/7
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
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
            className="p-2 text-slate-400 hover:text-[#001743] hover:bg-slate-200/60 rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#001743] disabled:opacity-40 cursor-pointer"
            aria-label="Đóng cửa sổ"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        {completedTx ? (
          /* ═══ SUCCESS DIGITAL RECEIPT VOUCHER ═══ */
          <div className="p-5 overflow-y-auto flex flex-col items-center text-center animate-in fade-in duration-200">
            <div className="w-16 h-16 rounded-full bg-emerald-50 border-2 border-emerald-200 text-emerald-600 flex items-center justify-center mb-3 shadow-xs">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200/80 mb-2">
              Lệnh Rút Tiền Đã Ghi Nhận
            </span>
            <h3 className="text-xl font-black text-[#001743]">
              Yêu cầu rút tiền thành công!
            </h3>
            <div className="text-2xl font-black text-rose-600 font-mono tabular-nums my-2">
              -{completedTx.amount.toLocaleString("vi-VN")}{" "}
              <span className="text-sm font-bold">₫</span>
            </div>
            <p className="text-xs text-slate-500 mb-5 max-w-sm">
              Tiền sẽ về tài khoản ngân hàng của quý khách trong vòng 1–5 phút qua liên ngân hàng NAPAS 247.
            </p>

            {/* Receipt Summary Card */}
            <div className="w-full bg-slate-50 border border-slate-200/90 rounded-2xl p-4 mb-5 text-xs text-slate-600 flex flex-col gap-2.5 text-left shadow-2xs">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200/80">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Biên nhận giao dịch
                </span>
                <span className="font-mono text-[11px] text-slate-500">
                  {new Date().toLocaleTimeString("vi-VN")} · {new Date().toLocaleDateString("vi-VN")}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Mã giao dịch:</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-bold text-[#001743] tracking-wider">
                    {completedTx.transactionCode}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopyCode(completedTx.transactionCode)}
                    className="p-1 text-slate-400 hover:text-[#001743] rounded cursor-pointer"
                    title="Sao chép mã"
                  >
                    {copiedCode ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                  </button>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Ngân hàng thụ hưởng:</span>
                <span className="font-bold text-[#001743]">
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
              <div className="flex justify-between items-center border-t border-dashed border-slate-200 pt-2.5">
                <span className="text-slate-500">Trạng thái xử lý:</span>
                <span className="inline-flex items-center gap-1.5 font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Đang chuyển khoản NAPAS
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-full py-3 px-4 rounded-xl bg-[#001743] hover:bg-[#00266B] text-white text-xs font-bold transition-all shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#001743] active:scale-[0.99] cursor-pointer"
            >
              Hoàn tất & Đóng cửa sổ
            </button>
          </div>
        ) : (
          /* ═══ WITHDRAW CONFIGURATION FORM ═══ */
          <form onSubmit={handleSubmit} className="p-5 overflow-y-auto flex flex-col gap-4 animate-in fade-in duration-150">
            {/* Available Balance Banner with Fast Percentage Chips */}
            <div className="bg-slate-50/90 border border-slate-200/90 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Số Dư Khả Dụng Trong Ví
                </span>
                <div className="text-xl font-black text-[#001743] font-mono tabular-nums mt-0.5">
                  {availableBalance.toLocaleString("vi-VN")}{" "}
                  <span className="text-xs font-bold text-slate-500">₫</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
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
                    className="px-2.5 py-1.5 text-xs font-bold rounded-lg border border-slate-200 bg-white hover:bg-slate-100/90 text-slate-700 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#001743] active:scale-[0.97] cursor-pointer shadow-2xs"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Input Amount Section */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-bold text-[#001743]">
                  Số tiền muốn rút (VNĐ) <span className="text-[#E4011E]">*</span>
                </label>
                <span className="text-[11px] font-semibold text-slate-400">
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
                  className={`w-full py-3.5 pl-4 pr-14 text-lg font-black font-mono tabular-nums text-[#001743] bg-white border rounded-xl outline-none transition-all ${
                    error && (amount < 50_000 || amount > availableBalance)
                      ? "border-rose-400 ring-2 ring-rose-100 focus:border-rose-500"
                      : "border-slate-200 hover:border-slate-300 focus:border-[#001743] focus:ring-2 focus:ring-[#001743]/15"
                  }`}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400 font-mono">
                  ₫
                </span>
              </div>
            </div>

            {/* Curated Preset Chips */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Hoặc chọn nhanh số tiền:
              </label>
              <div className="grid grid-cols-4 gap-2">
                {PRESET_AMOUNTS.map((item) => {
                  const isSelected = amount === item.val;
                  const isExceed = item.val > availableBalance;
                  return (
                    <button
                      key={item.val}
                      type="button"
                      onClick={() => handleSelectPreset(item.val)}
                      disabled={isExceed}
                      className={`py-2 px-1 text-xs rounded-xl border font-mono tabular-nums transition-all text-center cursor-pointer active:scale-[0.98] ${
                        isSelected
                          ? "bg-[#001743] text-white border-[#001743] font-bold shadow-xs ring-2 ring-[#001743]/20"
                          : isExceed
                          ? "bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed opacity-60"
                          : "bg-slate-50/70 hover:bg-slate-100/90 text-slate-700 border-slate-200/80 font-medium"
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Beneficiary Bank Select */}
            <div>
              <label className="block text-[11px] font-bold text-[#001743] uppercase tracking-wider mb-1.5">
                Ngân hàng nhận tiền <span className="text-[#E4011E]">*</span>
              </label>
              <div className="relative">
                <select
                  value={bankCode}
                  onChange={(e) => setBankCode(e.target.value)}
                  className="w-full py-3 pl-3.5 pr-10 text-xs font-bold text-[#001743] bg-white border border-slate-200 hover:border-slate-300 rounded-xl outline-none cursor-pointer focus:border-[#001743] focus:ring-2 focus:ring-[#001743]/15 transition-all appearance-none"
                >
                  {POPULAR_BANKS.map((b) => (
                    <option key={b.code} value={b.code}>
                      {b.code} — {b.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Account Number & Account Holder Name Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                    className="w-full py-2.5 px-3.5 text-xs font-bold font-mono tabular-nums text-[#001743] bg-white border border-slate-200 hover:border-slate-300 rounded-xl outline-none focus:border-[#001743] focus:ring-2 focus:ring-[#001743]/15 transition-all"
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
                    className="w-full py-2.5 px-3.5 text-xs font-bold uppercase text-[#001743] bg-white border border-slate-200 hover:border-slate-300 rounded-xl outline-none focus:border-[#001743] focus:ring-2 focus:ring-[#001743]/15 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Note Field (Optional) */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Ghi chú rút tiền (Không bắt buộc)
              </label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="VD: Rút tiền về tài khoản chính chủ"
                className="w-full py-2 px-3 text-xs text-slate-700 bg-white border border-slate-200 hover:border-slate-300 rounded-xl outline-none focus:border-[#001743] focus:ring-2 focus:ring-[#001743]/15 transition-all"
              />
            </div>

            {/* Financial Settlement Breakdown Card */}
            {amount >= 50_000 && amount <= availableBalance && (
              <div className="bg-slate-50/90 border border-slate-200/90 rounded-2xl p-4 text-xs text-slate-600 flex flex-col gap-2 shadow-2xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 pb-1 border-b border-slate-200/80">
                  Đối Soát Giao Dịch
                </span>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Số tiền xuất lệnh:</span>
                  <span className="font-mono font-bold text-[#001743]">
                    {amount.toLocaleString("vi-VN")} ₫
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Phí giao dịch rút tiền:</span>
                  <span className="font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60">
                    0 ₫ (Miễn phí)
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Số dư ví còn lại:</span>
                  <span className="font-mono font-bold text-slate-700">
                    {remainingBalanceAfterWithdraw.toLocaleString("vi-VN")} ₫
                  </span>
                </div>
                <div className="flex justify-between items-center border-t border-dashed border-slate-200 pt-2">
                  <span className="font-bold text-[#001743]">Thực nhận vào tài khoản:</span>
                  <span className="font-mono font-black text-sm text-[#E4011E] tabular-nums">
                    {amount.toLocaleString("vi-VN")} ₫
                  </span>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-rose-50 border border-rose-200 rounded-xl px-3.5 py-2.5 text-xs text-rose-700 font-medium flex items-center gap-2">
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
                className="py-3 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#001743] active:scale-[0.99] cursor-pointer"
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
                className="py-3 px-4 rounded-xl bg-[#001743] hover:bg-[#00266B] disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#001743] active:scale-[0.99] cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang gửi lệnh rút…</span>
                  </>
                ) : (
                  <>
                    <span>Xác nhận rút tiền</span>
                    <ArrowRight className="w-4 h-4" />
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

export default WithdrawModal;
