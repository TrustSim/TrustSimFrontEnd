"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, Flame, Users } from "lucide-react";
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

// Carrier color accents & pills
const CARRIER_CONFIG: Record<
  string,
  { dot: string; bg: string; text: string; border: string; label: string }
> = {
  Viettel: { dot: "#E4011E", bg: "#FEF2F2", text: "#B91C1C", border: "#FEE2E2", label: "Viettel" },
  Mobifone: { dot: "#0284C7", bg: "#F0F9FF", text: "#0369A1", border: "#E0F2FE", label: "MobiFone" },
  Vinaphone: { dot: "#2563EB", bg: "#EFF6FF", text: "#1D4ED8", border: "#DBEAFE", label: "VinaPhone" },
  Vietnamobile: { dot: "#EA580C", bg: "#FFF7ED", text: "#C2410C", border: "#FFEDD5", label: "Vietnamobile" },
};

/**
 * Microchip SVG Watermark Component
 * Replicates the authentic gold contact pads of a physical SIM Card (ISO 7816 standard).
 */
const MicrochipWatermark = ({ isHovered }: { isHovered: boolean }) => (
  <svg
    width="130"
    height="90"
    viewBox="0 0 140 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="pointer-events-none absolute right-3 bottom-4 z-0 transition-all duration-300"
    style={{
      opacity: isHovered ? 0.12 : 0.04,
      transform: isHovered ? "scale(1.08) rotate(-1deg)" : "scale(1)",
    }}
  >
    {/* Outer SIM Chip boundary */}
    <rect x="6" y="6" width="128" height="88" rx="10" stroke="#001743" strokeWidth="2.5" strokeDasharray="6 3" />
    <rect x="14" y="14" width="112" height="72" rx="8" stroke="#001743" strokeWidth="1.5" />

    {/* Center core */}
    <rect x="52" y="32" width="36" height="36" rx="6" fill="#001743" fillOpacity="0.2" stroke="#001743" strokeWidth="2" />

    {/* Contact Pad Lines (C1 - C8) */}
    <path d="M14 36H52" stroke="#001743" strokeWidth="2" />
    <path d="M14 50H52" stroke="#001743" strokeWidth="2" />
    <path d="M14 64H52" stroke="#001743" strokeWidth="2" />

    <path d="M88 36H126" stroke="#001743" strokeWidth="2" />
    <path d="M88 50H126" stroke="#001743" strokeWidth="2" />
    <path d="M88 64H126" stroke="#001743" strokeWidth="2" />

    <path d="M70 14V32" stroke="#001743" strokeWidth="2" />
    <path d="M70 68V86" stroke="#001743" strokeWidth="2" />

    <path d="M18 14L14 18" stroke="#001743" strokeWidth="2" />
  </svg>
);

export const SimAuctionCard: React.FC<SimAuctionCardProps> = ({ data, featured = false }) => {
  const [hovered, setHovered] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ h: "00", m: "00", s: "00", ended: false });

  // Carrier Config
  const carrierInfo = CARRIER_CONFIG[data.carrier] || {
    dot: "#64748B",
    bg: "#F8FAFC",
    text: "#475569",
    border: "#E2E8F0",
    label: data.carrier || "Nhà mạng",
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
    <Link href={`/auctions/${data.id}`} className="block text-inherit no-underline">
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={`group relative flex min-h-[250px] flex-col justify-between overflow-hidden rounded-[24px] border border-[rgba(0,23,67,0.08)] bg-white/95 p-5 transition-all duration-200 backdrop-blur-sm ${
          hovered
            ? "-translate-y-1.5 border-[#4c5fd5]/40 shadow-[0_20px_45px_rgba(0,23,67,0.1)]"
            : "shadow-[0_8px_24px_rgba(0,23,67,0.04)]"
        }`}
      >
        {/* Subtle authentic Microchip watermark */}
        <MicrochipWatermark isHovered={hovered} />

        {/* ═══ 1. HEADER ROW: Carrier, Auction Type & Status Pill ═══ */}
        <div className="relative z-10 flex items-start justify-between gap-2">
          {/* Left: Carrier + Type */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold tracking-tight"
              style={{
                backgroundColor: carrierInfo.bg,
                color: carrierInfo.text,
                border: `1px solid ${carrierInfo.border}`,
              }}
            >
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: carrierInfo.dot }}
              />
              {carrierInfo.label}
            </span>

            {data.type && (
              <span className="inline-flex items-center gap-1 rounded-full border border-slate-200/80 bg-slate-50/80 px-2.5 py-1 text-[11px] font-medium text-slate-600">
                <span>
                  {data.type === "english" ? "Đấu giá Anh" : data.type === "dutch" ? "Đấu giá Hà Lan" : "Bí mật"}
                </span>
                {(data.type === "english" || data.type === "dutch") && (
                  <AuctionHelpPopover topic={data.type === "dutch" ? "dutch" : "english"} />
                )}
              </span>
            )}
          </div>

          {/* Right: Live countdown or status pill */}
          <div className="shrink-0">
            {isLive ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 font-mono text-[11px] font-bold text-emerald-700 tabular-nums">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_6px_#10B981]" />
                <span>
                  {timeLeft.h}:{timeLeft.m}:{timeLeft.s}
                </span>
              </span>
            ) : isUpcoming ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-800">
                Sắp bắt đầu
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-500">
                Đã kết thúc
              </span>
            )}
          </div>
        </div>

        {/* ═══ 2. BODY: BIG FORMATTED SIM NUMBER + RHYTHM BADGE ═══ */}
        <div className="relative z-10 my-3">
          <div
            className={`font-mono text-[22px] sm:text-[23px] font-bold tracking-tight transition-colors duration-150 tabular-nums ${
              hovered ? "text-[#0b2a6b]" : "text-[#001743]"
            }`}
          >
            {formattedSim}
          </div>

          <div className="mt-1.5 flex items-center gap-2 text-[12px] text-slate-500">
            <span className="rounded-md bg-slate-100/90 px-1.5 py-0.5 font-medium text-slate-700">
              {data.category || data.featuredReason || "SIM VIP"}
            </span>
            {data.bidCount !== undefined && data.bidCount > 0 && (
              <span className="inline-flex items-center gap-1 font-medium text-slate-500">
                <Users size={12} className="text-slate-400" />
                {data.bidCount} lượt trả giá
              </span>
            )}
          </div>
        </div>

        {/* ═══ 3. FOOTER: CURRENT PRICE & SOFT NAVY ACTION PILL ═══ */}
        <div className="relative z-10 flex items-end justify-between gap-3 border-t border-dashed border-[rgba(0,23,67,0.08)] pt-3">
          {/* Price */}
          <div className="min-w-0">
            <span className="block text-[10.5px] font-bold uppercase tracking-wider text-slate-400">
              {data.type === "dutch" ? "Giá hiện tại (Hạ dần)" : "Giá hiện tại"}
            </span>
            <div className="font-mono text-[18px] font-bold text-[#001743] tabular-nums leading-tight">
              {formattedPrice} <span className="text-[13px] font-semibold text-slate-500">₫</span>
            </div>
            {formattedStartPrice && (
              <span className="block text-[11px] text-slate-400 truncate">
                Khởi điểm: {formattedStartPrice} ₫
              </span>
            )}
          </div>

          {/* Action Button Pill */}
          <div
            className={`inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full px-3.5 py-2 text-[12px] font-bold transition-all duration-200 ${
              hovered
                ? "bg-gradient-to-r from-[#0b2a6b] to-[#001743] text-white shadow-[0_4px_14px_rgba(0,23,67,0.25)]"
                : "border border-slate-200/90 bg-[#F4F6FC] text-[#001743]"
            }`}
          >
            <span>{isLive ? "Trả giá" : "Xem phiên"}</span>
            <ArrowRight
              size={13}
              className={`transition-transform duration-200 ${hovered ? "translate-x-0.5" : ""}`}
            />
          </div>
        </div>
      </div>
    </Link>
  );
};

export default SimAuctionCard;
