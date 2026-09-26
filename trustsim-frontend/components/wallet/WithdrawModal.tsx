"use client";

import React, { useState, useEffect } from "react";
import { walletService } from "@/services/walletService";
import type { WalletTransactionDto } from "@/types/wallet";

interface WithdrawModalProps {
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

import { financialValidators } from "@/utils/validators";

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

  const handleFinish = () => {
    onClose();
  };

  const selectedBankObj = POPULAR_BANKS.find((b) => b.code === bankCode);

  return (
    <div
      className="profile-modal-backdrop"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        background: "rgba(0, 23, 67, 0.65)",
        backdropFilter: "blur(4px)",
        fontFamily: 'var(--font-inter), "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) onClose();
      }}
    >
      <div
        className="profile-modal-panel profile-withdraw-panel"
        style={{
          width: "100%",
          maxWidth: "640px",
          background: "#FFFFFF",
          borderRadius: "14px",
          boxShadow: "0 25px 60px -15px rgba(0, 23, 67, 0.25)",
          border: "1px solid #E5E7EB",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          maxHeight: "calc(100vh - 32px)",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "12px 18px",
            borderBottom: "1px solid #E5E7EB",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "#FAFAFA",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                background: "linear-gradient(135deg, #001743 0%, #002B7F 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 12px rgba(0, 23, 67, 0.2)",
                padding: 6,
                flexShrink: 0,
              }}
            >
              <img
                src="/logo/S-White-Logo.png"
                alt="TrustSim"
                style={{ width: "100%", height: "100%", objectFit: "contain" }}
              />
            </div>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 800, color: "#001743", margin: 0, letterSpacing: "-0.01em" }}>
                {completedTx ? "Rút tiền thành công" : "Rút tiền về tài khoản ngân hàng"}
              </h3>
              <p style={{ fontSize: 11, color: "#6B7280", margin: "1px 0 0" }}>
                {completedTx ? "Giao dịch đã được hệ thống phê duyệt tức thì" : "Chuyển khoản tự động 24/7 (Tối thiểu 10.000 ₫)"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "#9CA3AF",
              cursor: "pointer",
              padding: 6,
              borderRadius: 6,
              fontSize: 18,
              lineHeight: 1,
              transition: "color 0.15s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#001743")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#9CA3AF")}
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        {completedTx ? (
          /* ─── SUCCESS RECEIPT VIEW ─── */
          <div style={{ padding: "18px 20px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 14, textAlign: "center" }}>
            <div
              style={{
              width: 56,
              height: 56,
                borderRadius: "50%",
                background: "#F0FDF4",
                border: "2px solid #BBF7D0",
                color: "#16A34A",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto",
                boxShadow: "0 6px 18px rgba(22, 163, 74, 0.15)",
              }}
            >
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>

            <div>
              <h3 style={{ fontSize: 18, fontWeight: 900, color: "#001743", margin: "0 0 4px" }}>
                Yêu cầu rút tiền thành công!
              </h3>
              <p style={{ fontSize: 13.5, color: "#16A34A", fontWeight: 700, margin: 0 }}>
                -{completedTx.amount.toLocaleString("vi-VN")} ₫ đã được xuất lệnh về tài khoản
              </p>
            </div>

            {/* Receipt Summary Card */}
            <div
              style={{
                background: "#F8FAFC",
                border: "1px solid #E2E8F0",
                borderRadius: 10,
                padding: "12px 14px",
                textAlign: "left",
                fontSize: 13,
                color: "#475569",
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ color: "#64748B" }}>Mã giao dịch:</span>
                <strong style={{ color: "#001743", fontWeight: 800, letterSpacing: "0.02em" }}>
                  {completedTx.transactionCode}
                </strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ color: "#64748B" }}>Ngân hàng thụ hưởng:</span>
                <strong style={{ color: "#001743", fontWeight: 700 }}>
                  {completedTx.destinationBankName || selectedBankObj?.short}
                </strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ color: "#64748B" }}>Số tài khoản nhận:</span>
                <strong style={{ color: "#001743", fontWeight: 800 }}>
                  {completedTx.destinationAccountNumberMasked || accountNumber}
                </strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ color: "#64748B" }}>Tên chủ tài khoản:</span>
                <strong style={{ color: "#001743", fontWeight: 800 }}>
                  {completedTx.destinationAccountHolderName || accountHolderName}
                </strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px dashed #E2E8F0", paddingTop: 8 }}>
                <span style={{ color: "#64748B" }}>Trạng thái xử lý:</span>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#16A34A",
                    background: "#DCFCE7",
                    padding: "2px 8px",
                    borderRadius: 9999,
                  }}
                >
                  ● Hoàn tất tức thì
                </span>
              </div>
            </div>

            <p style={{ fontSize: 12, color: "#6B7280", margin: 0, lineHeight: 1.5 }}>
              Số dư khả dụng của bạn đã được cập nhật. Tiền sẽ về tài khoản ngân hàng trong vòng 1-5 phút tùy theo liên ngân hàng NAPAS 247.
            </p>

            <button
              type="button"
              onClick={handleFinish}
              style={{
                width: "100%",
                padding: "13px",
                borderRadius: 8,
                background: "#001743",
                color: "#FFFFFF",
                fontSize: 14.5,
                fontWeight: 800,
                border: "none",
                cursor: "pointer",
                transition: "background 0.15s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#0A2566")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#001743")}
            >
              Hoàn tất & Đóng
            </button>
          </div>
        ) : (
          /* ─── WITHDRAW FORM VIEW ─── */
          <form
            onSubmit={handleSubmit}
            style={{
              padding: "14px 18px",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            {/* Balance Overview Card */}
            <div
              style={{
                background: "linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)",
                border: "1px solid #E2E8F0",
                borderRadius: 10,
                padding: "10px 14px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div>
                <span style={{ fontSize: 11.5, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  Số Dư Khả Dụng Hiện Có
                </span>
                <div style={{ fontSize: 18, fontWeight: 900, color: "#001743", fontVariantNumeric: "tabular-nums", marginTop: 2 }}>
                  {availableBalance.toLocaleString("vi-VN")}{" "}
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#E4011E" }}>₫</span>
                </div>
              </div>

              <div style={{ display: "flex", gap: 6 }}>
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
                    style={{
                      padding: "5px 9px",
                      fontSize: 11.5,
                      fontWeight: 700,
                      borderRadius: 6,
                      border: "1px solid #CBD5E1",
                      background: "#FFFFFF",
                      color: "#001743",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "#001743";
                      e.currentTarget.style.background = "#F8FAFC";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "#CBD5E1";
                      e.currentTarget.style.background = "#FFFFFF";
                    }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Amount Presets */}
            <div>
              <label style={{ display: "block", fontSize: 11.5, fontWeight: 700, color: "#001743", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.03em" }}>
                Chọn nhanh số tiền rút
              </label>
              <div className="withdraw-presets" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6 }}>
                {PRESET_AMOUNTS.map((item) => (
                  <button
                    key={item.val}
                    type="button"
                    onClick={() => handleSelectPreset(item.val)}
                    style={{
                      padding: "7px 4px",
                      fontSize: 12,
                      fontWeight: amount === item.val ? 800 : 600,
                      borderRadius: 6,
                      border: amount === item.val ? "2px solid #001743" : "1px solid #E5E7EB",
                      background: amount === item.val ? "#EFF6FF" : "#FFFFFF",
                      color: amount === item.val ? "#001743" : "#4B5563",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                      textAlign: "center",
                    }}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Input Amount */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <label style={{ fontSize: 11.5, fontWeight: 700, color: "#001743", textTransform: "uppercase", letterSpacing: "0.03em" }}>
                  Số tiền muốn rút (VNĐ) <span style={{ color: "#E4011E" }}>*</span>
                </label>
                <span style={{ fontSize: 11.5, color: "#6B7280" }}>Tối thiểu 10.000 ₫</span>
              </div>
              <div style={{ position: "relative" }}>
                <input
                  type="text"
                  value={amountInput}
                  onChange={handleAmountChange}
                  placeholder="Nhập số tiền (tối thiểu 10.000 ₫)"
                  required
                  style={{
                    width: "100%",
                    padding: "10px 48px 10px 14px",
                    fontSize: 15,
                    fontWeight: 800,
                    fontVariantNumeric: "tabular-nums",
                    borderRadius: 8,
                    border: error ? "1.5px solid #EF4444" : "1.5px solid #D1D5DB",
                    outline: "none",
                    color: "#001743",
                    background: "#FFFFFF",
                    transition: "border-color 0.15s ease",
                  }}
                  onFocus={(e) => !error && (e.currentTarget.style.borderColor = "#001743")}
                  onBlur={(e) => !error && (e.currentTarget.style.borderColor = "#D1D5DB")}
                />
                <span
                  style={{
                    position: "absolute",
                    right: 14,
                    top: "50%",
                    transform: "translateY(-50%)",
                    fontSize: 13,
                    fontWeight: 800,
                    color: "#64748B",
                  }}
                >
                  VNĐ
                </span>
              </div>
            </div>

            {/* Bank Select */}
            <div>
              <label style={{ display: "block", fontSize: 11.5, fontWeight: 700, color: "#001743", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.03em" }}>
                Ngân hàng nhận tiền <span style={{ color: "#E4011E" }}>*</span>
              </label>
              <select
                value={bankCode}
                onChange={(e) => setBankCode(e.target.value)}
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  fontSize: 13,
                  borderRadius: 8,
                  border: "1.5px solid #D1D5DB",
                  outline: "none",
                  background: "#FFFFFF",
                  color: "#001743",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#001743")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "#D1D5DB")}
              >
                {POPULAR_BANKS.map((b) => (
                  <option key={b.code} value={b.code}>
                    {b.code} - {b.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Account Number & Account Holder Name in 2 columns */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {/* Account Number */}
              <div>
                <label style={{ display: "block", fontSize: 11.5, fontWeight: 700, color: "#001743", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.03em" }}>
                  Số tài khoản nhận <span style={{ color: "#E4011E" }}>*</span>
                </label>
                <input
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value.replace(/[^0-9A-Za-z]/g, ""))}
                  placeholder="VD: 19036582910012"
                  required
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    fontSize: 13,
                    fontWeight: 700,
                    fontVariantNumeric: "tabular-nums",
                    borderRadius: 8,
                    border: "1.5px solid #D1D5DB",
                    outline: "none",
                    color: "#001743",
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "#001743")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "#D1D5DB")}
                />
              </div>

              {/* Account Holder Name */}
              <div>
                <label style={{ display: "block", fontSize: 11.5, fontWeight: 700, color: "#001743", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.03em" }}>
                  Tên chủ tài khoản <span style={{ color: "#E4011E" }}>*</span>
                </label>
                <input
                  type="text"
                  value={accountHolderName}
                  onChange={(e) => setAccountHolderName(e.target.value.toUpperCase())}
                  placeholder="VD: NGUYEN VAN AN"
                  required
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    fontSize: 13,
                    fontWeight: 800,
                    borderRadius: 8,
                    border: "1.5px solid #D1D5DB",
                    outline: "none",
                    color: "#001743",
                    textTransform: "uppercase",
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "#001743")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "#D1D5DB")}
                />
              </div>
            </div>

            {/* Note Field */}
            <div>
              <label style={{ display: "block", fontSize: 11.5, fontWeight: 700, color: "#001743", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.03em" }}>
                Ghi chú rút tiền (Không bắt buộc)
              </label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="VD: Rút tiền về tài khoản ngân hàng chính chủ"
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  fontSize: 13,
                  borderRadius: 8,
                  border: "1px solid #D1D5DB",
                  outline: "none",
                  color: "#374151",
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#001743")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "#D1D5DB")}
              />
            </div>

            {/* Summary preview */}
            {amount >= 10_000 && amount <= availableBalance && (
              <div
                style={{
                  background: "#F8FAFC",
                  border: "1px solid #E2E8F0",
                  borderRadius: 8,
                  padding: "9px 12px",
                  fontSize: 12.5,
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                  color: "#475569",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Số tiền trừ số dư ví:</span>
                  <strong style={{ color: "#001743" }}>{amount.toLocaleString("vi-VN")} ₫</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Phí giao dịch rút tiền:</span>
                  <span style={{ color: "#16A34A", fontWeight: 700 }}>0 ₫ (Miễn phí)</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px dashed #E2E8F0", paddingTop: 6 }}>
                  <span style={{ fontWeight: 700, color: "#001743" }}>Thực nhận vào tài khoản:</span>
                  <strong style={{ color: "#E4011E", fontSize: 14, fontWeight: 900 }}>
                    {amount.toLocaleString("vi-VN")} ₫
                  </strong>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div
                style={{
                  background: "#FEF2F2",
                  border: "1px solid #FECACA",
                  borderRadius: 8,
                  padding: "10px 14px",
                  fontSize: 12.5,
                  color: "#DC2626",
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <span>⚠</span>
                <span>{error}</span>
              </div>
            )}

            {/* Actions */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1.6fr", gap: 10, marginTop: 4 }}>
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                style={{
                  padding: "10px",
                  borderRadius: 8,
                  border: "1.5px solid #D1D5DB",
                  background: "#FFFFFF",
                  color: "#374151",
                  fontSize: 13.5,
                  fontWeight: 700,
                  cursor: loading ? "not-allowed" : "pointer",
                }}
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={loading || amount < 10_000 || amount > availableBalance || !accountNumber || !accountHolderName}
                style={{
                  padding: "10px",
                  borderRadius: 8,
                  border: "none",
                  background:
                    loading || amount < 10_000 || amount > availableBalance || !accountNumber || !accountHolderName
                      ? "#9CA3AF"
                      : "linear-gradient(135deg, #001743 0%, #0A2566 100%)",
                  color: "#FFFFFF",
                  fontSize: 13,
                  fontWeight: 800,
                  cursor:
                    loading || amount < 10_000 || amount > availableBalance || !accountNumber || !accountHolderName
                      ? "not-allowed"
                      : "pointer",
                  boxShadow:
                    loading || amount < 10_000 || amount > availableBalance || !accountNumber || !accountHolderName
                      ? "none"
                      : "0 4px 14px rgba(0, 23, 67, 0.25)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                {loading ? (
                  <>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      style={{ animation: "spin 1s linear infinite" }}
                    >
                      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                    </svg>
                    Đang gửi lệnh rút...
                  </>
                ) : (
                  `Xác nhận rút tiền →`
                )}
              </button>
            </div>
          </form>
        )}
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
