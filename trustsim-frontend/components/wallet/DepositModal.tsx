"use client";

import React, { useState, useEffect } from "react";
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
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [error, setError] = useState<string>("");
  const [timeLeft, setTimeLeft] = useState<number>(1800); // 30 phút đếm ngược

  useEffect(() => {
    if (isOpen) {
      setAmount(initialAmount);
      setCustomInput(initialAmount.toLocaleString("vi-VN"));
      setDepositData(null);
      setIsCompleted(false);
      setError("");
      setTimeLeft(1800);
    }
  }, [isOpen, initialAmount]);

  // Tự động kiểm tra trạng thái giao dịch nạp tiền mỗi 3 giây (Auto-polling)
  useEffect(() => {
    if (!depositData || isCompleted || !isOpen) return;

    const pollInterval = setInterval(async () => {
      try {
        const tx = await walletService.getTransactionById(depositData.transactionId);
        if (tx && tx.transactionStatus === "COMPLETED") {
          setIsCompleted(true);
          if (onSuccess) onSuccess();
        }
      } catch {
        // Bỏ qua lỗi mạng nền
      }
    }, 3000);

    return () => clearInterval(pollInterval);
  }, [depositData, isCompleted, isOpen, onSuccess]);

  // Bộ đếm thời gian hiệu lực 30 phút
  useEffect(() => {
    if (!depositData || timeLeft <= 0 || isCompleted) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [depositData, timeLeft, isCompleted]);

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
        className="profile-modal-panel profile-deposit-panel"
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
                boxShadow: "0 4px 12px rgba(0, 23, 67, 0.25)",
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
                {depositData ? "Chuyển khoản VietQR SePay" : "Nạp tiền vào ví TrustSim"}
              </h3>
              <p style={{ fontSize: 11, color: "#6B7280", margin: "1px 0 0" }}>
                {depositData ? "Quét mã QR để cộng tiền tự động tức thì" : "Cổng thanh toán tự động 24/7 (Tối thiểu 10.000 ₫)"}
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

        {/* Content Body */}
        <div style={{ padding: "14px 18px", overflowY: "auto", flex: 1 }}>
          {isCompleted && depositData ? (
            /* Bước 3: Nạp tiền thành công tức thì */
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "12px 0" }}>
              <div
                style={{
                  width: 58,
                  height: 58,
                  borderRadius: "50%",
                  background: "#F0FDF4",
                  border: "2px solid #BBF7D0",
                  color: "#16A34A",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 14,
                  boxShadow: "0 6px 18px rgba(22, 163, 74, 0.15)",
                }}
              >
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>

              <h3 style={{ fontSize: 19, fontWeight: 900, color: "#001743", margin: "0 0 6px" }}>
                Nạp tiền thành công!
              </h3>
              <p style={{ fontSize: 14, color: "#16A34A", fontWeight: 800, margin: "0 0 16px" }}>
                +{depositData.amount.toLocaleString("vi-VN")} ₫ đã được cộng vào ví của bạn
              </p>

              <div
                style={{
                  width: "100%",
                  background: "#F8FAFC",
                  border: "1px solid #E2E8F0",
                  borderRadius: 10,
                  padding: "14px 16px",
                  marginBottom: 18,
                  fontSize: 12.5,
                  color: "#475569",
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  textAlign: "left",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#64748B" }}>Mã giao dịch:</span>
                  <strong style={{ color: "#001743", fontWeight: 800 }}>{depositData.transactionCode}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#64748B" }}>Cổng thanh toán:</span>
                  <strong style={{ color: "#001743", fontWeight: 700 }}>VietQR SePay (Tự động)</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px dashed #E2E8F0", paddingTop: 8 }}>
                  <span style={{ color: "#64748B" }}>Trạng thái:</span>
                  <strong style={{ color: "#16A34A", fontWeight: 800 }}>● Hoàn tất tức thì</strong>
                </div>
              </div>

              <button
                type="button"
                onClick={handleComplete}
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: 8,
                  background: "#001743",
                  color: "#FFFFFF",
                  fontSize: 14,
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
          ) : !depositData ? (
            /* Bước 1: Chọn số tiền */
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#001743", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.03em" }}>
                  Chọn nhanh số tiền nạp
                </label>
                <div className="deposit-presets" style={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(0, 1fr))", gap: 6 }}>
                  {PRESET_AMOUNTS.map((item) => (
                    <button
                      key={item.val}
                      type="button"
                      onClick={() => handleSelectPreset(item.val)}
                      style={{
                        padding: "8px 4px",
                        fontSize: 12,
                        fontWeight: amount === item.val ? 800 : 600,
                        borderRadius: 6,
                        border: amount === item.val ? "2px solid #001743" : "1px solid #E5E7EB",
                        background: amount === item.val ? "#EFF6FF" : "#FFFFFF",
                        color: amount === item.val ? "#001743" : "#374151",
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
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#001743", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.03em" }}>
                  Hoặc nhập số tiền tùy ý (VNĐ) <span style={{ color: "#E4011E" }}>*</span>
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type="text"
                    value={customInput}
                    onChange={handleCustomInputChange}
                    placeholder="Tối thiểu 10.000 ₫"
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
                      fontSize: 12.5,
                      fontWeight: 800,
                      color: "#64748B",
                    }}
                  >
                    VNĐ
                  </span>
                </div>
                {error ? (
                  <p style={{ fontSize: 11.5, color: "#EF4444", marginTop: 4, fontWeight: 600 }}>{error}</p>
                ) : (
                  <p style={{ fontSize: 11, color: "#6B7280", marginTop: 4 }}>
                    Tối thiểu <strong>10.000 ₫</strong>. Số tiền sẽ được cộng tự động vào ví sau 5–30 giây.
                  </p>
                )}
              </div>

              <div
                style={{
                  background: "#F8FAFC",
                  border: "1px solid #E2E8F0",
                  borderRadius: 8,
                  padding: "8px 12px",
                  fontSize: 11.5,
                  color: "#475569",
                  lineHeight: 1.5,
                }}
              >
                <div style={{ fontWeight: 700, color: "#001743", marginBottom: 2 }}>
                  ⚡ Tự động hóa qua Cổng SePay VietQR
                </div>
                Quý khách quét mã VietQR ngân hàng bất kỳ hoặc chuyển đúng nội dung. Hệ thống nhận và cộng số dư khả dụng tức thì.
              </div>

              <button
                type="button"
                onClick={handleCreateDeposit}
                disabled={loading || amount < 10_000}
                style={{
                  width: "100%",
                  padding: "11px",
                  borderRadius: 8,
                  background: loading || amount < 10_000 ? "#9CA3AF" : "linear-gradient(135deg, #001743 0%, #002B7F 100%)",
                  color: "#FFFFFF",
                  fontSize: 13,
                  fontWeight: 800,
                  border: "none",
                  cursor: loading || amount < 10_000 ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  boxShadow: loading || amount < 10_000 ? "none" : "0 4px 14px rgba(0, 23, 67, 0.25)",
                  transition: "all 0.15s ease",
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
                    Đang tạo mã QR...
                  </>
                ) : (
                  `Tạo mã nạp ${amount.toLocaleString("vi-VN")} ₫ →`
                )}
              </button>
            </div>
          ) : (
            /* Bước 2: Hiển thị VietQR Code & Thông tin chuyển khoản */
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {/* Alert đếm ngược */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  background: "#FEF2F2",
                  border: "1px solid #FECACA",
                  borderRadius: 8,
                  padding: "8px 12px",
                  fontSize: 12,
                  color: "#991B1B",
                }}
              >
                <span>Mã nạp có hiệu lực trong:</span>
                <span style={{ fontWeight: 900, fontVariantNumeric: "tabular-nums", fontSize: 14, color: "#DC2626" }}>
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
                  border: "1px solid #E2E8F0",
                  borderRadius: 10,
                  padding: "12px",
                }}
              >
                <div
                  style={{
                    background: "#FFFFFF",
                    padding: 6,
                    borderRadius: 8,
                    border: "1px solid #E2E8F0",
                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
                  }}
                >
                  <img
                    src={depositData.qrCodeUrl}
                    alt="VietQR SePay Payment"
                    style={{ width: 150, height: 150, objectFit: "contain", display: "block" }}
                  />
                </div>
                <p style={{ fontSize: 11, color: "#64748B", marginTop: 8, textAlign: "center", margin: "8px 0 0" }}>
                  Mở ứng dụng Ngân hàng hoặc MoMo / Viettel Money để quét mã QR thanh toán nhanh
                </p>
              </div>

              {/* Thông tin chuyển khoản sao chép */}
              <div
                style={{
                  background: "#FFFFFF",
                  border: "1px solid #E5E7EB",
                  borderRadius: 8,
                  overflow: "hidden",
                }}
              >
                {/* Số tiền */}
                <div
                  style={{
                    padding: "10px 14px",
                    borderBottom: "1px solid #F3F4F6",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span style={{ fontSize: 12, color: "#6B7280" }}>Số tiền cần nạp:</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 15, fontWeight: 900, color: "#E4011E", fontVariantNumeric: "tabular-nums" }}>
                      {depositData.amount.toLocaleString("vi-VN")} ₫
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(String(depositData.amount), "amount")}
                      style={{
                        fontSize: 10.5,
                        fontWeight: 700,
                        padding: "3px 7px",
                        borderRadius: 4,
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
                    padding: "10px 14px",
                    background: "#FEF9C3",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <span style={{ fontSize: 11.5, fontWeight: 700, color: "#854D0E", display: "block" }}>
                      Nội dung chuyển khoản (BẮT BUỘC):
                    </span>
                    <span style={{ fontSize: 14, fontWeight: 900, color: "#A16207", fontVariantNumeric: "tabular-nums" }}>
                      {depositData.transferContent}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(depositData.transferContent, "content")}
                    style={{
                      fontSize: 11.5,
                      fontWeight: 800,
                      padding: "5px 10px",
                      borderRadius: 4,
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



              {/* Action button */}
              <div>
                <button
                  type="button"
                  onClick={() => setDepositData(null)}
                  style={{
                    width: "100%",
                    padding: "11px",
                    borderRadius: 8,
                    border: "1.5px solid #D1D5DB",
                    background: "#FFFFFF",
                    color: "#001743",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#F8FAFC";
                    e.currentTarget.style.borderColor = "#001743";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "#FFFFFF";
                    e.currentTarget.style.borderColor = "#D1D5DB";
                  }}
                >
                  ← Quay lại & Đổi số tiền khác
                </button>
              </div>
            </div>
          )}
        </div>
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
