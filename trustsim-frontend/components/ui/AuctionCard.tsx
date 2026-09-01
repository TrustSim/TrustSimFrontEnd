"use client";
import React from "react";
import Link from "next/link";
import CountdownTimer from "./CountdownTimer";

export type AuctionType = "english" | "dutch" | "sealed";
export type AuctionStatus = "live" | "upcoming" | "ended";

export interface AuctionCardData {
  id: string;
  simNumber: string;
  carrier: "Viettel" | "Mobifone" | "Vinaphone" | "Vietnamobile";
  type: AuctionType;
  status: AuctionStatus;
  currentPrice: number;
  startPrice: number;
  bidCount: number;
  endTime: Date;
  seller: string;
  featuredReason?: string;
}

interface AuctionCardProps {
  data: AuctionCardData;
  featured?: boolean;
}

const CARRIER_COLORS: Record<string, string> = {
  Viettel: "#ee0000",
  Mobifone: "#e04d00",
  Vinaphone: "#0066cc",
  Vietnamobile: "#ffd700",
};

const TYPE_LABELS: Record<AuctionType, string> = {
  english: "Kiểu Anh",
  dutch: "Kiểu Hà Lan",
  sealed: "Bí Mật",
};

const TYPE_CLASS: Record<AuctionType, string> = {
  english: "badge-english",
  dutch: "badge-dutch",
  sealed: "badge-sealed",
};

const AuctionCard: React.FC<AuctionCardProps> = ({ data, featured = false }) => {
  const [hovered, setHovered] = React.useState(false);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(price);

  const formatSim = (sim: string) => {
    // Format: 0xxx xxx xxx
    return sim.replace(/(\d{4})(\d{3})(\d{3})/, "$1 $2 $3");
  };

  return (
    <Link href={`/auctions/${data.id}`} style={{ textDecoration: "none", display: "block" }}>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          background: hovered
            ? "linear-gradient(135deg, rgba(79,70,229,0.12), rgba(6,182,212,0.06))"
            : "var(--bg-card)",
          border: `1px solid ${hovered ? "rgba(79,70,229,0.4)" : "rgba(255,255,255,0.07)"}`,
          borderRadius: 16,
          padding: featured ? 24 : 20,
          cursor: "pointer",
          transition: "all 0.3s ease",
          transform: hovered ? "translateY(-3px)" : "none",
          boxShadow: hovered ? "0 12px 40px rgba(0,0,0,0.3), 0 0 30px rgba(79,70,229,0.15)" : "none",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Carrier accent line */}
        <div style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 2,
          background: `linear-gradient(90deg, ${CARRIER_COLORS[data.carrier]}, transparent)`,
        }} />

        {/* Top row */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
              {data.status === "live" && <span className="badge badge-live">Live</span>}
              {data.status === "upcoming" && <span className="badge badge-pending">Sắp diễn ra</span>}
              {data.status === "ended" && <span className="badge badge-ended">Đã kết thúc</span>}
              <span className={`badge ${TYPE_CLASS[data.type]}`}>{TYPE_LABELS[data.type]}</span>
            </div>
            <div style={{
              fontSize: 11,
              color: "var(--text-muted)",
              fontWeight: 600,
              letterSpacing: "0.05em",
            }}>
              {data.carrier}
            </div>
          </div>
          <div style={{
            fontSize: 10,
            color: "var(--text-muted)",
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}>
            🔨 {data.bidCount} lượt
          </div>
        </div>

        {/* SIM Number */}
        <div style={{
          fontSize: featured ? 24 : 20,
          fontWeight: 800,
          fontVariantNumeric: "tabular-nums",
          letterSpacing: "0.12em",
          marginBottom: 16,
          background: hovered ? "linear-gradient(135deg, #a5b4fc, #67e8f9)" : "none",
          WebkitBackgroundClip: hovered ? "text" : undefined,
          WebkitTextFillColor: hovered ? "transparent" : "var(--text-primary)",
          backgroundClip: hovered ? "text" : undefined,
          transition: "all 0.3s ease",
        }}>
          {formatSim(data.simNumber)}
        </div>

        {/* Featured reason */}
        {data.featuredReason && (
          <div style={{
            fontSize: 11,
            color: "var(--text-accent)",
            marginBottom: 12,
            padding: "4px 10px",
            background: "rgba(79,70,229,0.1)",
            borderRadius: 6,
            display: "inline-block",
          }}>
            ✨ {data.featuredReason}
          </div>
        )}

        {/* Price */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 2 }}>
            {data.status === "ended" ? "Giá cuối" : "Giá hiện tại"}
          </div>
          <div style={{
            fontSize: featured ? 22 : 18,
            fontWeight: 800,
            color: "var(--cyan-light)",
            fontVariantNumeric: "tabular-nums",
          }}>
            {formatPrice(data.currentPrice)}
          </div>
        </div>

        {/* Countdown */}
        {data.status !== "ended" && (
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingTop: 12,
            borderTop: "1px solid rgba(255,255,255,0.06)",
          }}>
            <CountdownTimer endTime={data.endTime} compact />
            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
              Người bán: {data.seller}
            </div>
          </div>
        )}
      </div>
    </Link>
  );
};

export default AuctionCard;
