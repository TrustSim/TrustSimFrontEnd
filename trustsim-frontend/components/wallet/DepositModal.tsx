"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { walletService } from "@/services/walletService";
import type { DepositResponseDto } from "@/types/wallet";

interface DepositModalProps {
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
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [error, setError] = useState<string>("");
  const [timeLeft, setTimeLeft] = useState<number>(1800); // 30 phút đếm ngược

  useEffect(() => {
    if (isOpen) {
      setAmount(initialAmount);
      setCustomInput(initialAmount.toLocaleString("vi-VN"));
      setDepositData(null);
      setError("");
      setTimeLeft(1800);
    }
  }, [isOpen, initialAmount]);

  // Bộ đếm thời gian hiệu lực 30 phút
  useEffect(() => {
    if (!depositData || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [depositData, timeLeft]);

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
    if (val < 10_000) {
      setError("Số tiền nạp tối thiểu là 10.000 ₫");
    } else {
      setError("");
    }
  };

  const handleCreateDeposit = async () => {
    if (amount < 10_000) {
      setError("Số tiền nạp tối thiểu là 10.000 ₫");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const res = await walletService.createDeposit({ amount });
      setDepositData(res);
      setTimeLeft(1800);
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
    if (onSuccess) onSuccess();
    onClose();
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
          maxWidth: depositData ? "580px" : "480px",
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
                <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
                <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
                <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
              </svg>
            </div>
            <div>
              <h3 style={{ fontSize: "16px", fontWeight: 800, color: "#001743", margin: 0 }}>
                {depositData ? "Chuyển khoản VietQR SePay" : "Nạp tiền vào ví TrustSim"}
              </h3>
              <p style={{ fontSize: "12px", color: "#6B7280", margin: 0, marginTop: "2px" }}>
                {depositData ? "Quét mã QR để cộng tiền tự động tức thì" : "Cổng thanh toán tự động 24/7 (Tối thiểu 10.000 ₫)"}
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

        {/* Content Body */}
        <div style={{ padding: "22px 24px", overflowY: "auto", flex: 1 }}>
          {!depositData ? (
            /* Bước 1: Chọn số tiền */
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#374151", marginBottom: "8px", textTransform: "uppercase" }}>
                  Chọn nhanh số tiền nạp
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", gap: "8px" }}>
                  {PRESET_AMOUNTS.map((item) => (
                    <button
                      key={item.val}
                      type="button"
                      onClick={() => handleSelectPreset(item.val)}
                      style={{
                        padding: "10px 6px",
                        fontSize: "12.5px",
                        fontWeight: amount === item.val ? 800 : 600,
                        borderRadius: "6px",
                        border: amount === item.val ? "2px solid #E4011E" : "1px solid #E5E7EB",
                        background: amount === item.val ? "#FEF2F2" : "#FFFFFF",
                        color: amount === item.val ? "#E4011E" : "#374151",
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

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#374151", marginBottom: "8px", textTransform: "uppercase" }}>
                  Hoặc nhập số tiền tùy ý (VNĐ)
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type="text"
                    value={customInput}
                    onChange={handleCustomInputChange}
                    placeholder="Tối thiểu 10.000 ₫"
                    style={{
                      width: "100%",
                      padding: "14px 44px 14px 16px",
                      fontSize: "18px",
                      fontWeight: 800,
                      fontFamily: "monospace",
                      borderRadius: "8px",
                      border: error ? "1.5px solid #EF4444" : "1.5px solid #D1D5DB",
                      outline: "none",
                      color: "#001743",
                      background: "#FFFFFF",
                    }}
                  />
                  <span
                    style={{
                      position: "absolute",
                      right: "16px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      fontSize: "14px",
                      fontWeight: 700,
                      color: "#9CA3AF",
                    }}
                  >
                    VNĐ
                  </span>
                </div>
                {error ? (
                  <p style={{ fontSize: "12px", color: "#EF4444", marginTop: "6px", fontWeight: 600 }}>{error}</p>
                ) : (
                  <p style={{ fontSize: "11.5px", color: "#6B7280", marginTop: "6px" }}>
                    Tối thiểu <strong>10.000 ₫</strong>. Số tiền sẽ được cộng tự động vào ví sau 5–30 giây.
                  </p>
                )}
              </div>

              <div
                style={{
                  background: "#F8FAFC",
                  border: "1px solid #E2E8F0",
                  borderRadius: "8px",
                  padding: "12px 16px",
                  fontSize: "12px",
                  color: "#475569",
                  lineHeight: 1.5,
                }}
              >
                <div style={{ fontWeight: 700, color: "#001743", marginBottom: "2px" }}>
                  ⚡ Tự động hóa qua Cổng SePay VietQR
                </div>
                Quý khách quét mã VietQR ngân hàng bất kỳ hoặc chuyển đúng nội dung. Hệ thống nhận webhook và cộng số dư khả dụng tức thì.
              </div>

              <button
                type="button"
                onClick={handleCreateDeposit}
                disabled={loading || amount < 10_000}
                style={{
                  width: "100%",
                  padding: "14px",
                  borderRadius: "8px",
                  background: loading || amount < 10_000 ? "#9CA3AF" : "#E4011E",
                  color: "#FFFFFF",
                  fontSize: "15px",
                  fontWeight: 800,
                  border: "none",
                  cursor: loading || amount < 10_000 ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  boxShadow: "0 4px 12px rgba(228, 1, 30, 0.25)",
                }}
              >
                {loading ? "Đang tạo mã QR..." : `Tạo mã nạp ${amount.toLocaleString("vi-VN")} ₫ →`}
              </button>
            </div>
          ) : (
            /* Bước 2: Hiển thị VietQR Code & Thông tin chuyển khoản */
            <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
              {/* Alert đếm ngược */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  background: "#FEF2F2",
                  border: "1px solid #FECACA",
                  borderRadius: "8px",
                  padding: "10px 14px",
                  fontSize: "12.5px",
                  color: "#991B1B",
                }}
              >
                <span>Mã nạp có hiệu lực trong:</span>
                <span style={{ fontWeight: 900, fontFamily: "monospace", fontSize: "15px", color: "#DC2626" }}>
                  {formatCountdown(timeLeft)}
                </span>
              </div>

              {/* QR Code Frame */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  background: "#F8FAFC",
                  border: "1.5px solid #E2E8F0",
                  borderRadius: "10px",
                  padding: "16px",
                }}
              >
                <div
                  style={{
                    background: "#FFFFFF",
                    padding: "8px",
                    borderRadius: "8px",
                    border: "1px solid #E2E8F0",
                    boxShadow: "0 4px 10px rgba(0, 0, 0, 0.04)",
                  }}
                >
                  <img
                    src={depositData.qrCodeUrl}
                    alt="VietQR SePay Payment"
                    style={{ width: "240px", height: "240px", objectFit: "contain", display: "block" }}
                  />
                </div>
                <p style={{ fontSize: "11px", color: "#64748B", marginTop: "10px", textAlign: "center" }}>
                  Mở ứng dụng Ngân hàng hoặc MoMo / ViettelPay để quét mã QR thanh toán nhanh
                </p>
              </div>

              {/* Thông tin chuyển khoản sao chép */}
              <div
                style={{
                  background: "#FFFFFF",
                  border: "1px solid #E5E7EB",
                  borderRadius: "8px",
                  overflow: "hidden",
                }}
              >
                {/* Số tiền */}
                <div
                  style={{
                    padding: "12px 16px",
                    borderBottom: "1px solid #F3F4F6",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span style={{ fontSize: "12.5px", color: "#6B7280" }}>Số tiền cần nạp:</span>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "16px", fontWeight: 900, color: "#E4011E", fontFamily: "monospace" }}>
                      {depositData.amount.toLocaleString("vi-VN")} ₫
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(String(depositData.amount), "amount")}
                      style={{
                        fontSize: "11px",
                        fontWeight: 700,
                        padding: "3px 8px",
                        borderRadius: "4px",
                        border: "1px solid #D1D5DB",
                        background: copiedField === "amount" ? "#10B981" : "#F3F4F6",
                        color: copiedField === "amount" ? "#FFFFFF" : "#374151",
                        cursor: "pointer",
                      }}
                    >
                      {copiedField === "amount" ? "Đã chép" : "Sao chép"}
                    </button>
                  </div>
                </div>

                {/* Cú pháp chuyển khoản */}
                <div
                  style={{
                    padding: "12px 16px",
                    background: "#FEF9C3",
                    borderBottom: "1px solid #FEF08A",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <span style={{ fontSize: "12px", fontWeight: 700, color: "#854D0E", display: "block" }}>
                      Nội dung chuyển khoản (BẮT BUỘC):
                    </span>
                    <span style={{ fontSize: "15px", fontWeight: 900, color: "#A16207", fontFamily: "monospace" }}>
                      {depositData.transferContent}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(depositData.transferContent, "content")}
                    style={{
                      fontSize: "12px",
                      fontWeight: 800,
                      padding: "5px 12px",
                      borderRadius: "4px",
                      border: "none",
                      background: copiedField === "content" ? "#10B981" : "#CA8A04",
                      color: "#FFFFFF",
                      cursor: "pointer",
                    }}
                  >
                    {copiedField === "content" ? "✓ Đã chép" : "Sao chép mã"}
                  </button>
                </div>
              </div>

              {/* Action buttons */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginTop: "4px" }}>
                <button
                  type="button"
                  onClick={() => setDepositData(null)}
                  style={{
                    padding: "12px",
                    borderRadius: "6px",
                    border: "1px solid #D1D5DB",
                    background: "#F3F4F6",
                    color: "#374151",
                    fontSize: "13px",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  ← Đổi số tiền khác
                </button>
                <button
                  type="button"
                  onClick={handleComplete}
                  style={{
                    padding: "12px",
                    borderRadius: "6px",
                    border: "none",
                    background: "#16A34A",
                    color: "#FFFFFF",
                    fontSize: "13px",
                    fontWeight: 800,
                    cursor: "pointer",
                  }}
                >
                  ✓ Tôi đã chuyển khoản xong
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
