"use client";

import React from "react";

export interface PhysicalSimCardProps {
  phoneNumber: string;
  carrierName?: string;
  categoryName?: string;
  patternDesc?: string;
  startingPrice?: number;
  currentPrice?: number;
  price?: number;
  isAuction?: boolean;
  isLive?: boolean;
  auctionType?: string;
  badgeText?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

/**
 * Helper to split phone number into prefix and highlighted tail
 * e.g. "0988888888" -> { prefix: "0988", tail: "888 888", formatted: "0988 888 888" }
 * e.g. "0901234567" -> { prefix: "090", tail: "123 4567", formatted: "090 123 4567" }
 */
export function parseSimNumber(rawPhone: string) {
  const clean = (rawPhone || "").replace(/\D/g, "");
  if (!clean) return { prefix: "090", tail: "000 000", formatted: "090 000 0000" };

  if (clean.length === 10) {
    // Check if 4-digit prefix or 3-digit prefix
    const prefix4 = clean.slice(0, 4);
    const tail6 = clean.slice(4);
    return {
      prefix: prefix4,
      tail: `${tail6.slice(0, 3)} ${tail6.slice(3)}`,
      formatted: `${prefix4} ${tail6.slice(0, 3)} ${tail6.slice(3)}`,
    };
  }

  // Fallback chunking
  const formatted = clean.replace(/(\d{3,4})(\d{3})(\d{3,4})/, "$1 $2 $3");
  const parts = formatted.split(" ");
  return {
    prefix: parts[0] || clean.slice(0, 3),
    tail: parts.slice(1).join(" ") || clean.slice(3),
    formatted,
  };
}

/**
 * Format currency in VND
 */
function formatVND(amount?: number) {
  if (amount === undefined || amount === null) return "0 đ";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Carrier Watermark Insignia
 */
const CarrierWatermark = ({ carrier }: { carrier?: string }) => {
  const c = (carrier || "Viettel").toUpperCase();
  return (
    <div className="absolute -bottom-4 -right-3 select-none pointer-events-none opacity-[0.06] font-black text-6xl tracking-tighter text-white font-mono uppercase">
      {c}
    </div>
  );
};

/**
 * Realistic SIM Smart Chip (ISO 7816 Microchip Contact Pad)
 */
const SimSmartChip = ({ size = "md" }: { size?: "sm" | "md" | "lg" }) => {
  const chipScale = size === "sm" ? "scale-75 origin-top-left" : size === "lg" ? "scale-110 origin-top-left" : "scale-90 origin-top-left";
  return (
    <div className={`relative ${chipScale}`}>
      <div className="w-12 h-9 rounded-md bg-gradient-to-br from-[#F59E0B] via-[#FDE68A] to-[#D97706] p-[1.5px] shadow-[inset_0_1px_1px_rgba(255,255,255,0.6),0_2px_4px_rgba(0,0,0,0.3)]">
        <div className="w-full h-full bg-gradient-to-br from-[#D97706] via-[#B45309] to-[#78350F] rounded-[4px] p-0.5 relative overflow-hidden flex flex-col justify-between">
          {/* Top Contact Traces */}
          <div className="flex justify-between h-[30%]">
            <div className="w-[30%] bg-gradient-to-b from-[#FDE68A] to-[#F59E0B] rounded-sm" />
            <div className="w-[34%] bg-gradient-to-b from-[#FDE68A] to-[#F59E0B] rounded-sm border-x border-[#92400E]" />
            <div className="w-[30%] bg-gradient-to-b from-[#FDE68A] to-[#F59E0B] rounded-sm" />
          </div>
          {/* Middle Core & Traces */}
          <div className="flex justify-between items-center h-[34%] my-0.5">
            <div className="w-[28%] h-full bg-gradient-to-r from-[#FDE68A] to-[#F59E0B] rounded-sm" />
            <div className="w-[38%] h-[80%] bg-gradient-to-br from-[#FEF08A] to-[#D97706] rounded-[3px] border border-[#78350F]/60 flex items-center justify-center">
              <div className="w-2 h-1.5 bg-[#92400E]/40 rounded-[1px]" />
            </div>
            <div className="w-[28%] h-full bg-gradient-to-l from-[#FDE68A] to-[#F59E0B] rounded-sm" />
          </div>
          {/* Bottom Contact Traces */}
          <div className="flex justify-between h-[30%]">
            <div className="w-[30%] bg-gradient-to-t from-[#FDE68A] to-[#F59E0B] rounded-sm" />
            <div className="w-[34%] bg-gradient-to-t from-[#FDE68A] to-[#F59E0B] rounded-sm border-x border-[#92400E]" />
            <div className="w-[30%] bg-gradient-to-t from-[#FDE68A] to-[#F59E0B] rounded-sm" />
          </div>
          {/* Micro Metallic Shine Glint */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/25 to-transparent pointer-events-none" />
        </div>
      </div>
    </div>
  );
};

export const PhysicalSimCard: React.FC<PhysicalSimCardProps> = ({
  phoneNumber,
  carrierName = "Viettel",
  categoryName,
  patternDesc,
  startingPrice,
  currentPrice,
  price,
  isAuction = false,
  isLive = false,
  auctionType,
  badgeText,
  className = "",
  size = "md",
}) => {
  const { prefix, tail } = parseSimNumber(phoneNumber);

  // Chamfered cut corner style
  const chamferCut = "polygon(0 0, calc(100% - 22px) 0, 100% 22px, 100% 100%, 0 100%)";

  return (
    <div
      className={`relative select-none text-white transition-all duration-300 ${className}`}
      style={{
        filter: "drop-shadow(0 14px 30px rgba(0, 15, 46, 0.45))",
      }}
    >
      {/* Outer Chamfered Container */}
      <div
        className="relative overflow-hidden rounded-lg border border-white/15 bg-gradient-to-br from-[#001743] via-[#000F2E] to-[#020617] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.18),inset_0_0_24px_rgba(0,0,0,0.4)]"
        style={{
          clipPath: chamferCut,
        }}
      >
        {/* Subtle Circuit Traces / Dot Grid Background Layer */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.07]"
          style={{
            backgroundImage: `radial-gradient(#60A5FA 1px, transparent 1px), linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px)`,
            backgroundSize: "16px 16px, 32px 32px, 32px 32px",
          }}
        />

        {/* Diagonal Notch Accent in Chamfered Corner */}
        <div className="absolute top-0 right-0 w-8 h-8 pointer-events-none flex items-center justify-center">
          <div className="w-[1px] h-6 bg-amber-400/40 transform rotate-45" />
        </div>

        {/* Carrier Watermark in Background */}
        <CarrierWatermark carrier={carrierName} />

        {/* ═══ 1. HEADER ROW: Carrier, Chip & Type Badge ═══ */}
        <div className="flex items-center justify-between mb-4 relative z-10">
          <div className="flex items-center gap-3">
            <SimSmartChip size={size} />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black uppercase tracking-wider text-slate-200">
                  {carrierName}
                </span>
                <span className="text-[10px] text-amber-400/80 font-mono">SIM-CARD</span>
              </div>
              {categoryName && (
                <span className="text-[11px] text-amber-300/90 font-medium block leading-tight">
                  {categoryName}
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col items-end gap-1">
            {badgeText ? (
              <span className="text-[10px] font-bold bg-white/15 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-white/10 text-white shadow-sm">
                {badgeText}
              </span>
            ) : auctionType ? (
              <span className="text-[10px] font-bold bg-amber-400/15 border border-amber-400/30 text-amber-300 px-2.5 py-0.5 rounded-full">
                {auctionType}
              </span>
            ) : null}

            {isLive && (
              <div className="flex items-center gap-1 bg-emerald-950/60 border border-emerald-500/40 px-2 py-0.5 rounded-full">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-300">
                  LIVE AUCTION
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ═══ 2. HERO SIM NUMBER (Monospace + Dual-Tone Glowing Highlight) ═══ */}
        <div className="my-3 py-2 text-center relative z-10">
          <div className="font-mono tracking-[0.2em] font-extrabold tabular-nums flex items-baseline justify-center text-2xl sm:text-3xl">
            {/* Prefix in sleek silver-white */}
            <span className="text-slate-300/90 mr-2 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
              {prefix}
            </span>
            {/* Value core in luxurious glowing Gold */}
            <span className="text-amber-300 font-black tracking-widest drop-shadow-[0_2px_12px_rgba(251,191,36,0.45)] bg-gradient-to-b from-amber-200 via-amber-300 to-amber-400 bg-clip-text text-transparent">
              {tail}
            </span>
          </div>

          {patternDesc && (
            <p className="text-[11px] text-slate-300/70 font-medium mt-1">
              {patternDesc}
            </p>
          )}
        </div>

        {/* ═══ 3. FOOTER: Auction Board (Static vs Dynamic Prices) ═══ */}
        {isAuction ? (
          <div className="grid grid-cols-2 gap-2 text-xs border-t border-white/15 pt-3 mt-2 relative z-10 bg-black/20 -mx-5 -mb-5 px-5 pb-4 rounded-b-lg">
            <div>
              <span className="text-[10px] block uppercase font-mono tracking-wider text-slate-400">
                Giá khởi điểm
              </span>
              <span className="font-bold text-slate-200 tabular-nums font-mono text-xs">
                {formatVND(startingPrice)}
              </span>
            </div>
            <div className="text-right">
              <div className="flex items-center justify-end gap-1.5">
                {isLive && (
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                )}
                <span className="text-[10px] uppercase font-mono tracking-wider text-amber-400/90 font-semibold">
                  Giá hiện tại
                </span>
              </div>
              <span className="font-black text-amber-400 text-sm sm:text-base tabular-nums font-mono drop-shadow-[0_1px_6px_rgba(251,191,36,0.3)]">
                {formatVND(currentPrice || startingPrice)}
              </span>
            </div>
          </div>
        ) : price !== undefined ? (
          <div className="flex justify-between items-end text-xs border-t border-white/15 pt-3 mt-2 relative z-10 bg-black/20 -mx-5 -mb-5 px-5 pb-4 rounded-b-lg">
            <div>
              <span className="text-[10px] block uppercase font-mono tracking-wider text-slate-400">
                Thế số nhận diện
              </span>
              <span className="font-bold text-slate-200 text-xs">
                {categoryName || "SIM Số Đẹp"}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] block uppercase font-mono tracking-wider text-slate-400">
                Giá niêm yết
              </span>
              <span className="font-black text-amber-300 text-sm sm:text-base tabular-nums font-mono">
                {formatVND(price)}
              </span>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};
