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
  { code: "VCB", name: "Vietcombank (Ngoại Thương Việt Nam)" },
  { code: "MB", name: "MBBank (Quân Đội)" },
  { code: "TCB", name: "Techcombank (Kỹ Thương Việt Nam)" },
  { code: "CTG", name: "VietinBank (Công Thương Việt Nam)" },
  { code: "BIDV", name: "BIDV (Đầu Tư & Phát Triển Việt Nam)" },
  { code: "VPB", name: "VPBank (Việt Nam Thịnh Vượng)" },
  { code: "ACB", name: "ACB (Á Châu)" },
  { code: "TPB", name: "TPBank (Tiên Phong)" },
  { code: "STB", name: "Sacombank (Sài Gòn Thương Tín)" },
  { code: "VIB", name: "VIB (Quốc Tế Việt Nam)" },
  { code: "HDB", name: "HDBank (Phát Triển TP.HCM)" },
  { code: "MSB", name: "MSB (Hàng Hải Việt Nam)" },
  { code: "OCB", name: "OCB (Phương Đông)" },
  { code: "LPB", name: "LPBank (Lộc Phát Việt Nam)" },
  { code: "SHB", name: "SHB (Sài Gòn - Hà Nội)" },
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

  useEffect(() => {
    if (isOpen) {
      setBankCode("VCB");
      setAccountNumber("");
      setAccountHolderName("");
      setAmount(0);
      setAmountInput("");
      setNote("");
      setError("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "");
    if (!raw) {
      setAmount(0);
      setAmountInput("");
      return;
    }
    const val = parseInt(raw, 10);
    setAmount(val);
    setAmountInput(val.toLocaleString("vi-VN"));

    if (val > availableBalance) {
      setError(`Số tiền vượt quá số dư khả dụng (${availableBalance.toLocaleString("vi-VN")} ₫)`);
    } else if (val < 50_000) {
      setError("Số tiền rút tối thiểu là 50.000 ₫");
    } else {
      setError("");
    }
  };

  const handleWithdrawAll = () => {
    if (availableBalance <= 0) {
      setError("Số dư khả dụng hiện tại là 0 ₫");
      return;
    }
    setAmount(availableBalance);
    setAmountInput(availableBalance.toLocaleString("vi-VN"));
    if (availableBalance < 50_000) {
      setError("Số tiền rút tối thiểu là 50.000 ₫");
    } else {
      setError("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!accountNumber.trim()) {
      setError("Vui lòng nhập số tài khoản ngân hàng nhận tiền");
      return;
    }
    if (!accountHolderName.trim()) {
      setError("Vui lòng nhập tên chủ tài khoản ngân hàng");
      return;
    }
    if (amount < 50_000) {
      setError("Số tiền rút tối thiểu là 50.000 ₫");
      return;
    }
    if (amount > availableBalance) {
      setError(`Số dư khả dụng không đủ để rút ${amount.toLocaleString("vi-VN")} ₫`);
      return;
    }

    const selectedBank = POPULAR_BANKS.find((b) => b.code === bankCode);
    const bankName = selectedBank?.name || bankCode;

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

      if (onSuccess) {
        onSuccess(res);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || "Không thể thực hiện yêu cầu rút tiền. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        background: "rgba(0, 23, 67, 0.6)",
        backdropFilter: "blur(4px)",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "500px",
          background: "#FFFFFF",
          borderRadius: "12px",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          border: "1px solid #E5E7EB",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          maxHeight: "92vh",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "18px 24px",
            borderBottom: "1px solid #E5E7EB",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "#FAFAFA",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "8px",
                background: "#F3F4F6",
                color: "#001743",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <line x1="7" y1="17" x2="17" y2="7" />
                <polyline points="7 7 17 7 17 17" />
              </svg>
            </div>
            <div>
              <h3 style={{ fontSize: "16px", fontWeight: 800, color: "#001743", margin: 0 }}>
                Rút tiền về tài khoản ngân hàng
              </h3>
              <p style={{ fontSize: "12px", color: "#6B7280", margin: 0, marginTop: "2px" }}>
                Số dư khả dụng: <strong style={{ color: "#E4011E" }}>{availableBalance.toLocaleString("vi-VN")} ₫</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "#9CA3AF",
              cursor: "pointer",
              padding: "6px",
              borderRadius: "6px",
              fontSize: "18px",
              lineHeight: 1,
            }}
          >
            ✕
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: "22px 24px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Ngân hàng nhận */}
          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#374151", marginBottom: "6px", textTransform: "uppercase" }}>
              Ngân hàng nhận tiền <span style={{ color: "#EF4444" }}>*</span>
            </label>
            <select
              value={bankCode}
              onChange={(e) => setBankCode(e.target.value)}
              style={{
                width: "100%",
                padding: "12px 14px",
                fontSize: "13.5px",
                borderRadius: "8px",
                border: "1px solid #D1D5DB",
                outline: "none",
                background: "#FFFFFF",
                color: "#111827",
                fontWeight: 600,
              }}
            >
              {POPULAR_BANKS.map((b) => (
                <option key={b.code} value={b.code}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          {/* Số tài khoản */}
          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#374151", marginBottom: "6px", textTransform: "uppercase" }}>
              Số tài khoản ngân hàng <span style={{ color: "#EF4444" }}>*</span>
            </label>
            <input
              type="text"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              placeholder="VD: 19036582910012"
              required
              style={{
                width: "100%",
                padding: "12px 14px",
                fontSize: "14px",
                fontFamily: "monospace",
                fontWeight: 700,
                borderRadius: "8px",
                border: "1px solid #D1D5DB",
                outline: "none",
                color: "#111827",
              }}
            />
          </div>

          {/* Tên chủ tài khoản */}
          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#374151", marginBottom: "6px", textTransform: "uppercase" }}>
              Tên chủ tài khoản (In hoa không dấu) <span style={{ color: "#EF4444" }}>*</span>
            </label>
            <input
              type="text"
              value={accountHolderName}
              onChange={(e) => setAccountHolderName(e.target.value.toUpperCase())}
              placeholder="VD: NGUYEN VAN AN"
              required
              style={{
                width: "100%",
                padding: "12px 14px",
                fontSize: "14px",
                fontWeight: 800,
                borderRadius: "8px",
                border: "1px solid #D1D5DB",
                outline: "none",
                color: "#111827",
                textTransform: "uppercase",
              }}
            />
          </div>

          {/* Số tiền cần rút */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
              <label style={{ fontSize: "12px", fontWeight: 700, color: "#374151", textTransform: "uppercase" }}>
                Số tiền muốn rút (VNĐ) <span style={{ color: "#EF4444" }}>*</span>
              </label>
              <button
                type="button"
                onClick={handleWithdrawAll}
                style={{
                  background: "none",
                  border: "none",
                  color: "#2563EB",
                  fontSize: "12px",
                  fontWeight: 700,
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                Rút tất cả ({availableBalance.toLocaleString("vi-VN")} ₫)
              </button>
            </div>
            <div style={{ position: "relative" }}>
              <input
                type="text"
                value={amountInput}
                onChange={handleAmountChange}
                placeholder="Tối thiểu 50.000 ₫"
                required
                style={{
                  width: "100%",
                  padding: "12px 44px 12px 14px",
                  fontSize: "16px",
                  fontFamily: "monospace",
                  fontWeight: 800,
                  borderRadius: "8px",
                  border: error ? "1.5px solid #EF4444" : "1px solid #D1D5DB",
                  outline: "none",
                  color: "#001743",
                }}
              />
              <span
                style={{
                  position: "absolute",
                  right: "14px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  fontSize: "13px",
                  fontWeight: 700,
                  color: "#9CA3AF",
                }}
              >
                VNĐ
              </span>
            </div>
          </div>

          {/* Ghi chú */}
          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#374151", marginBottom: "6px", textTransform: "uppercase" }}>
              Ghi chú rút tiền (Không bắt buộc)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="VD: Rút tiền về tài khoản cá nhân"
              style={{
                width: "100%",
                padding: "10px 14px",
                fontSize: "13px",
                borderRadius: "8px",
                border: "1px solid #D1D5DB",
                outline: "none",
                color: "#374151",
              }}
            />
          </div>

          {error && (
            <div
              style={{
                background: "#FEF2F2",
                border: "1px solid #FECACA",
                borderRadius: "6px",
                padding: "10px 14px",
                fontSize: "12.5px",
                color: "#DC2626",
                fontWeight: 600,
              }}
            >
              {error}
            </div>
          )}

          {/* Submit */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: "10px", marginTop: "6px" }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "12px",
                borderRadius: "8px",
                border: "1px solid #D1D5DB",
                background: "#F3F4F6",
                color: "#374151",
                fontSize: "13px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={loading || amount < 50_000 || amount > availableBalance}
              style={{
                padding: "12px",
                borderRadius: "8px",
                border: "none",
                background: loading || amount < 50_000 || amount > availableBalance ? "#9CA3AF" : "#001743",
                color: "#FFFFFF",
                fontSize: "14px",
                fontWeight: 800,
                cursor: loading || amount < 50_000 || amount > availableBalance ? "not-allowed" : "pointer",
                boxShadow: "0 4px 12px rgba(0, 23, 67, 0.2)",
              }}
            >
              {loading ? "Đang xử lý..." : `Xác nhận rút tiền →`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
