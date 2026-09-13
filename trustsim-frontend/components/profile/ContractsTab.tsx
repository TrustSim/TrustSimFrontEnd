import React, { useState, useEffect } from "react";
import Link from "next/link";
import { tradeService } from "@/services/tradeService";
import { TradeTransactionDto } from "@/types/trade";
import { ToastMessage } from "@/components/ui/Toast";
import { ProfileIcons as Icons } from "./ProfileIcons";

interface ContractsTabProps {
  addToast: (t: Omit<ToastMessage, "id">) => void;
}

export default function ContractsTab({ addToast }: ContractsTabProps) {
  const [trades, setTrades] = useState<TradeTransactionDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    tradeService
      .getMyTrades()
      .then((res) => setTrades(res.items || []))
      .catch(() => { })
      .finally(() => setLoading(false));
  }, []);

  const getEscrowBadge = (status: string) => {
    switch (status) {
      case "HELD":
        return { text: "Đã giữ tiền ký quỹ", bg: "#EFF6FF", color: "#2563EB", border: "#BFDBFE" };
      case "RELEASED_TO_SELLER":
        return { text: "Đã giải ngân cho người bán", bg: "#F0FDF4", color: "#16A34A", border: "#BBF7D0" };
      case "REFUNDED_TO_BUYER":
        return { text: "Đã hoàn tiền cho người mua", bg: "#FEF2F2", color: "#DC2626", border: "#FECACA" };
      case "PENDING_FUNDING":
      default:
        return { text: "Chờ nộp tiền ký quỹ", bg: "#FEF9C3", color: "#854D0E", border: "#FEF08A" };
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: "#001743", margin: 0 }}>
            Hợp đồng chuyển nhượng & Ký quỹ bảo đảm
          </h2>
          <p style={{ fontSize: 12, color: "#6B7280", margin: 0, marginTop: 2 }}>
            Hệ thống tài khoản ký quỹ trung gian bảo đảm an toàn 100% cho cả bên mua và bên bán
          </p>
        </div>
      </div>

      {loading ? (
        <div style={{ background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: 8, padding: 36, textAlign: "center", color: "#6B7280" }}>
          Đang tải dữ liệu hợp đồng ký quỹ...
        </div>
      ) : trades.length === 0 ? (
        <div style={{ background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: 8, padding: 36, textAlign: "center", color: "#6B7280" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 12, color: "#9CA3AF" }}>
            <Icons.FileText size={36} />
          </div>
          <h4 style={{ fontSize: 15, fontWeight: 700, color: "#001743", margin: "0 0 4px" }}>
            Chưa có giao dịch ký quỹ nào
          </h4>
          <p style={{ fontSize: 12.5, color: "#9CA3AF", margin: "0 0 16px" }}>
            Khi bạn trúng đấu giá hoặc hoàn tất chuyển nhượng SIM, hợp đồng và tiến trình ký quỹ sẽ hiển thị tại đây.
          </p>
          <Link href="/auctions" className="btn-red" style={{ padding: "8px 16px", fontSize: 13, borderRadius: 6, display: "inline-block" }}>
            Khám phá phòng đấu giá →
          </Link>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {trades.map((trade) => {
            const escrowBadge = getEscrowBadge(trade.escrowStatus);
            return (
              <div
                key={trade.id}
                style={{
                  background: "#FFFFFF",
                  border: "1px solid #E5E7EB",
                  borderRadius: 8,
                  padding: 20,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: 16,
                }}
              >
                <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 8,
                      background: "#EFF6FF",
                      color: "#2563EB",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Icons.FileText size={20} />
                  </div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: "#001743" }}>
                      Hợp đồng chuyển nhượng #{trade.tradeTransactionCode}
                    </div>
                    <div style={{ fontSize: 12.5, color: "#4B5563", marginTop: 2 }}>
                      SIM: <strong style={{ color: "#001743", fontVariantNumeric: "tabular-nums" }}>{trade.simPhoneNumber}</strong>
                      &nbsp;·&nbsp;
                      Tiền ký quỹ: <strong style={{ color: "#E4011E" }}>{trade.escrowAmount.toLocaleString("vi-VN")} ₫</strong>
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span
                    style={{
                      background: escrowBadge.bg,
                      color: escrowBadge.color,
                      border: `1px solid ${escrowBadge.border}`,
                      fontSize: 11.5,
                      fontWeight: 700,
                      padding: "4px 10px",
                      borderRadius: 4,
                    }}
                  >
                    {escrowBadge.text}
                  </span>

                  <button
                    type="button"
                    onClick={() => addToast({ type: "info", title: "Chi tiết ký quỹ", message: `Hợp đồng #${trade.tradeTransactionCode} đang được giám sát bởi hệ thống ký quỹ tự động.` })}
                    className="btn-outline"
                    style={{ padding: "6px 14px", fontSize: 12 }}
                  >
                    Xem tiến trình →
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
