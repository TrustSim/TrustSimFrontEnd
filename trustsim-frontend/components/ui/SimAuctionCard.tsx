"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import AuctionHelpPopover from "./AuctionHelpPopover";

export interface SimAuctionCardData {
  id: string;
  simNumber: string;
  carrier: "Viettel" | "Mobifone" | "Vinaphone" | "Vietnamobile" | string;
  type?: "english" | "dutch" | "sealed" | string;
  status?: "live" | "upcoming" | "ended" | string;
  currentPrice: number;
  startPrice?: number;
  bidCount?: number;
  endTime?: Date | string;
  category?: string;
  featuredReason?: string;
  seller?: string;
  minBidStep?: number;
  maxStepMultiplier?: number;
  extensionDurationSeconds?: number;
  dutchDecreaseAmount?: number;
  dutchDecreaseIntervalSeconds?: number;
  reservePrice?: number;
}

interface SimAuctionCardProps {
  data: SimAuctionCardData;
  featured?: boolean;
}

// Carrier color accents & icons
const CARRIER_CONFIG: Record<string, { bg: string; text: string; border: string; label: string }> = {
  Viettel: { bg: "#FEF2F2", text: "#DC2626", border: "#FECACA", label: "Viettel" },
  Mobifone: { bg: "#EFF6FF", text: "#2563EB", border: "#BFDBFE", label: "Mobifone" },
  Vinaphone: { bg: "#F0F9FF", text: "#0284C7", border: "#BAE6FD", label: "Vinaphone" },
  Vietnamobile: { bg: "#FFF7ED", text: "#EA580C", border: "#FFEDD5", label: "Vietnamobile" },
};

/**
 * Microchip SVG Watermark Component
 * Replicates the authentic gold contact pads of a physical SIM Card (ISO 7816 standard).
 */
const MicrochipWatermark = ({ isHovered }: { isHovered: boolean }) => (
  <svg
    width="140"
    height="100"
    viewBox="0 0 140 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{
      position: "absolute",
      right: 12,
      bottom: 24,
      pointerEvents: "none",
      opacity: isHovered ? 0.16 : 0.05,
      transform: isHovered ? "scale(1.06) rotate(-2deg)" : "scale(1)",
      transition: "all 0.35s ease",
      zIndex: 1,
    }}
  >
    {/* Outer SIM Chip boundary */}
    <rect x="6" y="6" width="128" height="88" rx="8" stroke="#D97706" strokeWidth="2.5" strokeDasharray="6 3" />
    <rect x="14" y="14" width="112" height="72" rx="6" stroke="#D97706" strokeWidth="1.5" />

    {/* Center core */}
    <rect x="52" y="32" width="36" height="36" rx="4" fill="#D97706" fillOpacity="0.3" stroke="#D97706" strokeWidth="2" />

    {/* Contact Pad Lines (C1 - C8) */}
    {/* Left contact traces */}
    <path d="M14 36H52" stroke="#D97706" strokeWidth="2" />
    <path d="M14 50H52" stroke="#D97706" strokeWidth="2" />
    <path d="M14 64H52" stroke="#D97706" strokeWidth="2" />

    {/* Right contact traces */}
    <path d="M88 36H126" stroke="#D97706" strokeWidth="2" />
    <path d="M88 50H126" stroke="#D97706" strokeWidth="2" />
    <path d="M88 64H126" stroke="#D97706" strokeWidth="2" />

    {/* Top & Bottom center traces */}
    <path d="M70 14V32" stroke="#D97706" strokeWidth="2" />
    <path d="M70 68V86" stroke="#D97706" strokeWidth="2" />

    {/* Notch cut representation inside chip */}
    <path d="M18 14L14 18" stroke="#D97706" strokeWidth="2" />
  </svg>
);

export const SimAuctionCard: React.FC<SimAuctionCardProps> = ({ data, featured = false }) => {
  const [hovered, setHovered] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ h: "00", m: "00", s: "00", ended: false });

  // Carrier Config
  const carrierInfo = CARRIER_CONFIG[data.carrier] || {
    bg: "#F3F4F6",
    text: "#4B5563",
    border: "#E5E7EB",
    label: data.carrier,
  };

  // Format SIM Number in standard readable chunks: 0988 888 888
  const formattedSim = data.simNumber.replace(/\s/g, "").replace(/(\d{4})(\d{3})(\d{3})/, "$1 $2 $3");

  // Format Price
  const formattedPrice = data.currentPrice.toLocaleString("vi-VN");
  const formattedStartPrice = data.startPrice ? data.startPrice.toLocaleString("vi-VN") : null;

  // Countdown timer logic
  useEffect(() => {
    if (!data.endTime) return;
    const end = typeof data.endTime === "string" ? new Date(data.endTime) : data.endTime;

    const tick = () => {
      const diff = end.getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft({ h: "00", m: "00", s: "00", ended: true });
        return;
      }
      const h = Math.floor(diff / 3_600_000).toString().padStart(2, "0");
      const m = Math.floor((diff % 3_600_000) / 60_000).toString().padStart(2, "0");
      const s = Math.floor((diff % 60_000) / 1_000).toString().padStart(2, "0");
      setTimeLeft({ h, m, s, ended: false });
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [data.endTime]);

  const isLive = data.status === "live" && !timeLeft.ended;
  const isUpcoming = data.status === "upcoming";

  return (
    <Link href={`/auctions/${data.id}`} style={{ textDecoration: "none", display: "block" }}>
      {/* Outer wrapper to create drop shadow on custom chamfered polygon */}
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          position: "relative",
          filter: hovered
            ? "drop-shadow(0 14px 28px rgba(0, 23, 67, 0.12)) drop-shadow(0 4px 10px rgba(228, 1, 30, 0.08))"
            : "drop-shadow(0 2px 8px rgba(0, 23, 67, 0.04))",
          transform: hovered ? "translateY(-5px)" : "translateY(0)",
          transition: "all 0.28s cubic-bezier(0.16, 1, 0.3, 1)",
          cursor: "pointer",
        }}
      >
        {/* Chamfered Card Container (Cắt vát góc trên bên phải 24px) */}
        <div
          style={{
            position: "relative",
            background: "#FFFFFF",
            clipPath: "polygon(0 0, calc(100% - 24px) 0, 100% 24px, 100% 100%, 0 100%)",
            border: `1px solid ${hovered ? "#D1D5DB" : "#E5E7EB"}`,
            borderRadius: "8px 0 8px 8px",
            padding: featured ? "22px 24px 20px" : "18px 20px 18px",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            minHeight: 230,
            height: "100%",
            justifyContent: "space-between",
          }}
        >
          {/* Microchip Watermark in Background */}
          <MicrochipWatermark isHovered={hovered} />

          {/* ═══ 1. HEADER ROW (Carrier, Auction Type, Status / Countdown) ═══ */}
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) auto", alignItems: "start", gap: 10, position: "relative", zIndex: 2 }}>
            {/* Carrier & Auction Type Badges */}
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "nowrap", minWidth: 0 }}>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: carrierInfo.text,
                  background: carrierInfo.bg,
                  border: `1px solid ${carrierInfo.border}`,
                  padding: "3px 8px",
                  borderRadius: 4,
                  letterSpacing: "0.02em",
                }}
              >
                {carrierInfo.label}
              </span>

              {data.type && (
                <>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: "#4B5563",
                    background: "#F3F4F6",
                    border: "1px solid #E5E7EB",
                    padding: "3px 7px",
                    borderRadius: 4,
                    whiteSpace: "nowrap",
                  }}
                >
                  {data.type === "english" ? "Đấu giá Anh" : data.type === "dutch" ? "Đấu giá Hà Lan" : "Bí mật"}
                </span>
                {(data.type === "english" || data.type === "dutch") && (
                  <AuctionHelpPopover topic={data.type === "dutch" ? "dutch" : "english"} />
                )}
                </>
              )}
            </div>

            {/* Status & Live Countdown Pill */}
            <div style={{ display: "flex", alignItems: "center", gap: 6, paddingRight: 14, flexShrink: 0, whiteSpace: "nowrap" }}>
              {isLive ? (
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                    padding: "3px 8px",
                    borderRadius: 4,
                    background: "rgba(228, 1, 30, 0.08)",
                    border: "1px solid rgba(228, 1, 30, 0.25)",
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#E4011E",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {/* Pulsing Red Dot */}
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: "#E4011E",
                      boxShadow: "0 0 6px #E4011E",
                      display: "inline-block",
                      animation: "pulse-dot 1.2s infinite ease-in-out",
                    }}
                  />
                  <span>
                    {timeLeft.h}:{timeLeft.m}:{timeLeft.s}
                  </span>
                </div>
              ) : isUpcoming ? (
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#D97706",
                    background: "#FEF3C7",
                    border: "1px solid #FDE68A",
                    padding: "3px 8px",
                    borderRadius: 4,
                  }}
                >
                  Sắp diễn ra
                </span>
              ) : (
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: "#6B7280",
                    background: "#F3F4F6",
                    padding: "3px 8px",
                    borderRadius: 4,
                  }}
                >
                  Đã kết thúc
                </span>
              )}
            </div>
          </div>

          {/* ═══ 2. BODY (SIM Number & Category / Fengshui Subtitle) ═══ */}
          <div style={{ margin: "14px 0 10px", position: "relative", zIndex: 2 }}>
            <div
              style={{
                fontSize: featured ? 26 : 22,
                fontWeight: 900,
                letterSpacing: "0.07em",
                color: hovered ? "#E4011E" : "#001743",
                fontVariantNumeric: "tabular-nums",
                lineHeight: 1.2,
                transition: "color 0.2s ease",
              }}
            >
              {formattedSim}
            </div>

            {/* Subtitle / Category badge */}
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
              <span style={{ fontSize: 12, color: "#6B7280", fontWeight: 500 }}>
                {data.category || data.featuredReason || "SIM VIP Phong thủy"}
              </span>
              {data.bidCount !== undefined && data.bidCount > 0 && (
                <span style={{ fontSize: 11, color: "#9CA3AF" }}>· {data.bidCount} lượt trả giá</span>
              )}
            </div>
          </div>

          {/* ═══ 3. FOOTER (Current Price & Action Button) ═══ */}
          <div
            style={{
              borderTop: "1px solid #F3F4F6",
              paddingTop: 12,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
              position: "relative",
              zIndex: 2,
            }}
          >
            {/* Price Information */}
            <div>
              <div style={{ fontSize: 10, color: "#9CA3AF", fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 2 }}>
                {data.type === "dutch" ? "GIÁ HIỆN TẠI (GIẢM DẦN)" : "GIÁ HIỆN TẠI"}
              </div>
              <div
                style={{
                  fontSize: 19,
                  fontWeight: 900,
                  color: "#E4011E",
                  fontVariantNumeric: "tabular-nums",
                  letterSpacing: "-0.02em",
                  lineHeight: 1.1,
                }}
              >
                {formattedPrice} <span style={{ fontSize: 13, fontWeight: 700 }}>₫</span>
              </div>
              {formattedStartPrice && (
                <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 2 }}>
                  Khởi điểm: {formattedStartPrice} ₫
                </div>
              )}
            </div>

            {/* Action CTA Button */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                padding: "7px 12px",
                borderRadius: 4,
                background: hovered ? "#E4011E" : "rgba(0, 23, 67, 0.05)",
                color: hovered ? "#FFFFFF" : "#001743",
                fontSize: 12,
                fontWeight: 700,
                border: `1px solid ${hovered ? "#E4011E" : "#E5E7EB"}`,
                whiteSpace: "nowrap",
                flexShrink: 0,
                transition: "all 0.2s ease",
              }}
            >
              <span>{isLive ? "Đấu giá ngay" : "Xem chi tiết"}</span>
              <span style={{ fontSize: 13, transform: hovered ? "translateX(2px)" : "none", transition: "transform 0.2s" }}>→</span>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse-dot {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.35); opacity: 0.6; }
        }
      `}</style>
    </Link>
  );
};

export default SimAuctionCard;
