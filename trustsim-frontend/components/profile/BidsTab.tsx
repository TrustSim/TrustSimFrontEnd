import React from "react";
import Link from "next/link";
import { ToastMessage } from "@/components/ui/Toast";

interface BidsTabProps {
  addToast: (t: Omit<ToastMessage, "id">) => void;
}

export default function BidsTab({ addToast }: BidsTabProps) {
  const bids = [
    { auctionId: "1", simNumber: "0901 234 567", carrier: "Viettel", myBid: 14_500_000, currentPrice: 15_000_000, status: "losing", statusText: "Bị vượt giá", endTime: "Còn 02:35:40" },
    { auctionId: "2", simNumber: "0777 777 777", carrier: "Mobifone", myBid: 42_000_000, currentPrice: 42_000_000, status: "winning", statusText: "Đang dẫn đầu", endTime: "Còn 04:12:00" },
    { auctionId: "8", simNumber: "0352 468 024", carrier: "Viettel", myBid: 8_500_000, currentPrice: 8_500_000, status: "won", statusText: "Đã thắng đấu giá", endTime: "Đã kết thúc" },
    { auctionId: "9", simNumber: "0987 654 321", carrier: "Mobifone", myBid: 32_000_000, currentPrice: 35_000_000, status: "lost", statusText: "Không trúng", endTime: "Đã kết thúc" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ fontSize: 18, fontWeight: 800, color: "#001743", margin: 0 }}>Các phiên bạn đang tham gia trả giá</h2>
        <Link href="/auctions" className="btn-red" style={{ padding: "7px 14px", fontSize: 13, borderRadius: 6 }}>
          Tìm thêm SIM đấu giá →
        </Link>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {bids.map((b) => (
          <div
            key={b.auctionId}
            style={{
              background: "#FFFFFF",
              border: "1px solid #E5E7EB",
              borderRadius: 8,
              padding: "16px 20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 16,
            }}
          >
            <div>
              <div style={{ fontSize: 17, fontWeight: 900, color: "#001743", fontVariantNumeric: "tabular-nums" }}>
                {b.simNumber}
              </div>
              <div style={{ fontSize: 12, color: "#6B7280", marginTop: 2 }}>
                Nhà mạng: <strong>{b.carrier}</strong> · {b.endTime}
              </div>
            </div>

            <div>
              <div style={{ fontSize: 11, color: "#6B7280", fontWeight: 600 }}>Giá bạn trả:</div>
              <div style={{ fontSize: 16, fontWeight: 900, color: "#001743", fontVariantNumeric: "tabular-nums" }}>
                {b.myBid.toLocaleString("vi-VN")} ₫
              </div>
            </div>

            <div>
              <div style={{ fontSize: 11, color: "#6B7280", fontWeight: 600 }}>Giá hiện tại:</div>
              <div style={{ fontSize: 16, fontWeight: 900, color: "#E4011E", fontVariantNumeric: "tabular-nums" }}>
                {b.currentPrice.toLocaleString("vi-VN")} ₫
              </div>
            </div>

            <div>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  padding: "4px 10px",
                  borderRadius: 6,
                  background: b.status === "winning" ? "#F0FDF4" : b.status === "won" ? "#EFF6FF" : "#FEF2F2",
                  color: b.status === "winning" ? "#16A34A" : b.status === "won" ? "#2563EB" : "#DC2626",
                  border: `1px solid ${b.status === "winning" ? "#BBF7D0" : b.status === "won" ? "#BFDBFE" : "#FECACA"}`,
                }}
              >
                {b.statusText}
              </span>
            </div>

            <div>
              <Link
                href={`/auctions/${b.auctionId}`}
                className="btn-outline"
                style={{ padding: "6px 14px", fontSize: 12, borderRadius: 4 }}
              >
                Vào phòng đấu giá →
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
