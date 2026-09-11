"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import SimAuctionCard, { SimAuctionCardData } from "@/components/ui/SimAuctionCard";

/* ─── Line SVG Icons ──────────────────────────────────────── */
const Icons = {
  Flame: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
    </svg>
  ),
  Gavel: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="m14 13-7.5 7.5c-.83.83-2.17.83-3 0 0 0 0 0 0 0a2.12 2.12 0 0 1 0-3L11 10" />
      <path d="m16 16 6-6" />
      <path d="m8 8 6-6" />
      <path d="m9 7 8 8" />
      <path d="m21 11-8-8" />
    </svg>
  ),
  Eye: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  Clock: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  ChevronLeft: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  ),
  ChevronRight: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  ),
};

const ALL_AUCTIONS: SimAuctionCardData[] = [
  { id: "1", simNumber: "0901234567", carrier: "Viettel", type: "english", status: "live", currentPrice: 15000000, startPrice: 10000000, bidCount: 24, endTime: new Date(Date.now() + 2 * 3600000), seller: "TrustSim", featuredReason: "Sim sảnh rồng tiến lên" },
  { id: "2", simNumber: "0777777777", carrier: "Mobifone", type: "sealed", status: "live", currentPrice: 42000000, startPrice: 30000000, bidCount: 18, endTime: new Date(Date.now() + 4 * 3600000), seller: "NguyenA", featuredReason: "Bát quý 7 cực hiếm" },
  { id: "3", simNumber: "0888555000", carrier: "Vinaphone", type: "dutch", status: "live", currentPrice: 8500000, startPrice: 12000000, bidCount: 0, endTime: new Date(Date.now() + 45 * 60000), seller: "SimVIP" },
  { id: "4", simNumber: "0909090909", carrier: "Viettel", type: "english", status: "live", currentPrice: 22000000, startPrice: 15000000, bidCount: 37, endTime: new Date(Date.now() + 1 * 3600000), seller: "MinhTuan", featuredReason: "Ngũ quý 09 siêu VIP" },
  { id: "5", simNumber: "0338866688", carrier: "Viettel", type: "english", status: "live", currentPrice: 6800000, startPrice: 5000000, bidCount: 11, endTime: new Date(Date.now() + 3 * 3600000), seller: "HoangLe" },
  { id: "6", simNumber: "0911119999", carrier: "Mobifone", type: "sealed", status: "upcoming", currentPrice: 20000000, startPrice: 20000000, bidCount: 0, endTime: new Date(Date.now() + 24 * 3600000), seller: "KhanhSim" },
  { id: "7", simNumber: "0799888777", carrier: "Vinaphone", type: "dutch", status: "upcoming", currentPrice: 11000000, startPrice: 11000000, bidCount: 0, endTime: new Date(Date.now() + 48 * 3600000), seller: "TrustSim" },
  { id: "8", simNumber: "0352468024", carrier: "Viettel", type: "english", status: "ended", currentPrice: 8500000, startPrice: 5000000, bidCount: 19, endTime: new Date(Date.now() - 2 * 3600000), seller: "TrungPT" },
  { id: "9", simNumber: "0987654321", carrier: "Mobifone", type: "sealed", status: "ended", currentPrice: 35000000, startPrice: 25000000, bidCount: 12, endTime: new Date(Date.now() - 5 * 3600000), seller: "LuckyNum" },
  { id: "10", simNumber: "0666999888", carrier: "Vinaphone", type: "dutch", status: "live", currentPrice: 5200000, startPrice: 9000000, bidCount: 0, endTime: new Date(Date.now() + 20 * 60000), seller: "NamSim" },
  { id: "11", simNumber: "0944488888", carrier: "Vietnamobile", type: "english", status: "live", currentPrice: 16000000, startPrice: 12000000, bidCount: 7, endTime: new Date(Date.now() + 90 * 60000), seller: "HuuLoc", featuredReason: "Ngũ quý 8 phát tài" },
  { id: "12", simNumber: "0355577799", carrier: "Viettel", type: "sealed", status: "upcoming", currentPrice: 7500000, startPrice: 7500000, bidCount: 0, endTime: new Date(Date.now() + 36 * 3600000), seller: "BaoNguyen" },
];

const FEATURED_HERO_AUCTIONS = [
  {
    id: "2",
    simNumber: "0777 777 777",
    carrier: "Mobifone",
    title: "Siêu Phẩm Bát Quý 7 – Bảo Vật Phong Thủy Độc Bản",
    type: "sealed" as const,
    typeLabel: "Đấu Giá Bí Mật",
    currentPrice: 42_000_000,
    startPrice: 30_000_000,
    bids: 18,
    watchers: 245,
    timeLeft: "03:45:12",
    bgGradient: "linear-gradient(135deg, #001743 0%, #002B7A 50%, #061938 100%)",
    accentColor: "#F59E0B",
  },
  {
    id: "4",
    simNumber: "0909 0909 09",
    carrier: "Viettel",
    title: "Đại Sảnh 09 Tối Thượng – Biểu Tượng Uy Quyền Doanh Nhân",
    type: "english" as const,
    typeLabel: "Đấu Giá Kiểu Anh (Live)",
    currentPrice: 22_000_000,
    startPrice: 15_000_000,
    bids: 37,
    watchers: 412,
    timeLeft: "00:58:24",
    bgGradient: "linear-gradient(135deg, #450A0A 0%, #7F1D1D 50%, #001743 100%)",
    accentColor: "#EF4444",
  },
];

type StatusTab = "all" | "live" | "upcoming" | "ended";
type TypeFilter = "all" | "english" | "dutch" | "sealed";

export default function AuctionsPage() {
  const [statusTab, setStatusTab] = useState<StatusTab>("live");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [carrierFilter, setCarrierFilter] = useState<string>("Tất cả");
  const [featuredIndex, setFeaturedIndex] = useState(0);

  const currentHero = FEATURED_HERO_AUCTIONS[featuredIndex];

  // Filtering
  const filteredAuctions = useMemo(() => {
    return ALL_AUCTIONS.filter((a) => {
      if (statusTab !== "all" && a.status !== statusTab) return false;
      if (typeFilter !== "all" && a.type !== typeFilter) return false;
      if (carrierFilter !== "Tất cả" && a.carrier !== carrierFilter) return false;
      return true;
    });
  }, [statusTab, typeFilter, carrierFilter]);

  const liveCount = ALL_AUCTIONS.filter((a) => a.status === "live").length;
  const upcomingCount = ALL_AUCTIONS.filter((a) => a.status === "upcoming").length;
  const endedCount = ALL_AUCTIONS.filter((a) => a.status === "ended").length;

  return (
    <div style={{ minHeight: "100vh", background: "#F8F9FA", paddingTop: 64 }}>
      
      {/* ═══════════════════════════════════════════════════════════
          1. FEATURED CAROUSEL: TÂM ĐIỂM SIÊU PHẨM ĐẤU GIÁ (GLOWING REALTIME)
      ═══════════════════════════════════════════════════════════ */}
      <section
        style={{
          background: currentHero.bgGradient,
          color: "#FFFFFF",
          padding: "32px 0 28px",
          position: "relative",
          overflow: "hidden",
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          transition: "background 0.4s ease",
        }}
      >
        {/* Subtle Glowing Rings */}
        <div
          style={{
            position: "absolute",
            right: "5%",
            top: "50%",
            transform: "translateY(-50%)",
            width: 400,
            height: 400,
            background: `radial-gradient(circle, ${currentHero.accentColor}25 0%, transparent 70%)`,
            filter: "blur(50px)",
            pointerEvents: "none",
          }}
        />

        <div className="container" style={{ maxWidth: 1200, margin: "0 auto", padding: "0 20px", position: "relative", zIndex: 2 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 36, alignItems: "center" }}>
            
            {/* Left Column: Hero SIM Showcase */}
            <div>
              {/* Badge & Live Pulse */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "4px 10px",
                    borderRadius: 4,
                    background: "rgba(228, 1, 30, 0.25)",
                    border: "1px solid rgba(228, 1, 30, 0.5)",
                    color: "#FF4D6D",
                    fontSize: 11,
                    fontWeight: 800,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: "#FF4D6D",
                      boxShadow: "0 0 8px #FF4D6D",
                      animation: "pulse-hero 1.5s infinite",
                    }}
                  />
                  Tâm Điểm Đấu Giá Realtime
                </span>

                <span style={{ fontSize: 12, color: "rgba(255, 255, 255, 0.7)", display: "flex", alignItems: "center", gap: 4 }}>
                  <Icons.Eye /> {currentHero.watchers} người đang theo dõi
                </span>
              </div>

              <h1 style={{ fontSize: "clamp(1.8rem, 3.2vw, 2.6rem)", fontWeight: 900, color: "#FFFFFF", margin: "0 0 6px", letterSpacing: "-0.02em", lineHeight: 1.2 }}>
                {currentHero.simNumber}
              </h1>
              <p style={{ fontSize: 14, color: "rgba(255, 255, 255, 0.8)", margin: "0 0 20px", lineHeight: 1.5 }}>
                {currentHero.title} · <strong style={{ color: "#FDE047" }}>{currentHero.carrier}</strong>
              </p>

              {/* Countdown Timer & Price Bar */}
              <div
                style={{
                  background: "rgba(255, 255, 255, 0.08)",
                  backdropFilter: "blur(12px)",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  borderRadius: 10,
                  padding: "14px 18px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  maxWidth: 520,
                  marginBottom: 20,
                }}
              >
                <div>
                  <div style={{ fontSize: 11, color: "rgba(255, 255, 255, 0.65)", fontWeight: 700, textTransform: "uppercase" }}>
                    Thời gian còn lại
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 900, color: "#FDE047", fontVariantNumeric: "tabular-nums", letterSpacing: "0.05em" }}>
                    {currentHero.timeLeft}
                  </div>
                </div>

                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 11, color: "rgba(255, 255, 255, 0.65)", fontWeight: 700, textTransform: "uppercase" }}>
                    Giá trả cao nhất
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 900, color: "#FFFFFF", fontVariantNumeric: "tabular-nums" }}>
                    {currentHero.currentPrice.toLocaleString("vi-VN")} <span style={{ fontSize: 14, fontWeight: 700 }}>₫</span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <Link
                  href={`/auctions/${currentHero.id}`}
                  className="btn-red"
                  style={{
                    padding: "11px 24px",
                    fontSize: 14,
                    fontWeight: 800,
                    borderRadius: 6,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    boxShadow: "0 8px 24px rgba(228, 1, 30, 0.4)",
                  }}
                >
                  <Icons.Gavel /> Vào Phòng Trả Giá Ngay →
                </Link>

                {/* Carousel Navigation Arrows */}
                <div style={{ display: "flex", gap: 6 }}>
                  <button
                    onClick={() => setFeaturedIndex((prev) => (prev === 0 ? FEATURED_HERO_AUCTIONS.length - 1 : prev - 1))}
                    aria-label="Previous featured"
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 6,
                      background: "rgba(255, 255, 255, 0.1)",
                      border: "1px solid rgba(255, 255, 255, 0.2)",
                      color: "#FFFFFF",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                    }}
                  >
                    <Icons.ChevronLeft />
                  </button>
                  <button
                    onClick={() => setFeaturedIndex((prev) => (prev === FEATURED_HERO_AUCTIONS.length - 1 ? 0 : prev + 1))}
                    aria-label="Next featured"
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 6,
                      background: "rgba(255, 255, 255, 0.1)",
                      border: "1px solid rgba(255, 255, 255, 0.2)",
                      color: "#FFFFFF",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                    }}
                  >
                    <Icons.ChevronRight />
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column: Live Room Activity Box */}
            <div
              style={{
                background: "rgba(0, 0, 0, 0.35)",
                backdropFilter: "blur(16px)",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                borderRadius: 12,
                padding: "20px",
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 800, color: "#FFFFFF", borderBottom: "1px solid rgba(255, 255, 255, 0.1)", paddingBottom: 10, marginBottom: 12, display: "flex", justifyContent: "space-between" }}>
                <span>🔥 Diễn biến trả giá trực tiếp</span>
                <span style={{ color: "#86EFAC", fontSize: 11, fontWeight: 700 }}>Đang diễn ra</span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  { user: "Đỗ *** Long", price: currentHero.currentPrice, time: "1 phút trước", isTop: true },
                  { user: "Trần *** Nam", price: currentHero.currentPrice - 1_500_000, time: "4 phút trước", isTop: false },
                  { user: "Nguyễn *** Hùng", price: currentHero.currentPrice - 3_000_000, time: "12 phút trước", isTop: false },
                ].map((bid, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "8px 10px",
                      background: bid.isTop ? "rgba(228, 1, 30, 0.2)" : "rgba(255, 255, 255, 0.04)",
                      border: `1px solid ${bid.isTop ? "rgba(228, 1, 30, 0.4)" : "rgba(255, 255, 255, 0.06)"}`,
                      borderRadius: 6,
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 12.5, fontWeight: 700, color: "#FFFFFF" }}>{bid.user}</div>
                      <div style={{ fontSize: 10.5, color: "rgba(255, 255, 255, 0.6)" }}>{bid.time}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 14, fontWeight: 900, color: bid.isTop ? "#FDE047" : "#FFFFFF", fontVariantNumeric: "tabular-nums" }}>
                        {bid.price.toLocaleString("vi-VN")} ₫
                      </div>
                      {bid.isTop && <span style={{ fontSize: 9.5, color: "#FF4D6D", fontWeight: 800 }}>DẪN ĐẦU 👑</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          2. AUCTION TABS BAR (STATUS & AUCTION MECHANISMS)
      ═══════════════════════════════════════════════════════════ */}
      <div
        style={{
          background: "#FFFFFF",
          borderBottom: "1px solid #E5E7EB",
          position: "sticky",
          top: 64,
          zIndex: 30,
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.03)",
        }}
      >
        <div className="container" style={{ maxWidth: 1200, margin: "0 auto", padding: "0 20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
            
            {/* Status Tabs */}
            <div style={{ display: "flex", gap: 6 }}>
              {[
                { key: "live" as StatusTab, label: "Đang Diễn Ra", count: liveCount, color: "#E4011E", pulse: true },
                { key: "upcoming" as StatusTab, label: "Sắp Bắt Đầu", count: upcomingCount, color: "#D97706", pulse: false },
                { key: "ended" as StatusTab, label: "Đã Kết Thúc", count: endedCount, color: "#4B5563", pulse: false },
                { key: "all" as StatusTab, label: "Tất Cả Phiên", count: ALL_AUCTIONS.length, color: "#001743", pulse: false },
              ].map((tab) => {
                const isActive = statusTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setStatusTab(tab.key)}
                    style={{
                      padding: "14px 16px",
                      background: "none",
                      border: "none",
                      borderBottom: `3px solid ${isActive ? tab.color : "transparent"}`,
                      color: isActive ? "#001743" : "#6B7280",
                      fontSize: 13.5,
                      fontWeight: isActive ? 800 : 500,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      transition: "all 0.15s ease",
                    }}
                  >
                    {tab.pulse && (
                      <span
                        style={{
                          width: 7,
                          height: 7,
                          borderRadius: "50%",
                          background: "#E4011E",
                          boxShadow: "0 0 6px #E4011E",
                          display: "inline-block",
                        }}
                      />
                    )}
                    <span>{tab.label}</span>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        padding: "1px 6px",
                        borderRadius: 999,
                        background: isActive ? `${tab.color}15` : "#F3F4F6",
                        color: isActive ? tab.color : "#6B7280",
                      }}
                    >
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Sub-Filter: Mechanism (English / Dutch / Sealed) */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0" }}>
              <span style={{ fontSize: 12, color: "#6B7280", fontWeight: 600 }}>Hình thức:</span>
              {[
                { key: "all" as TypeFilter, label: "Tất cả" },
                { key: "english" as TypeFilter, label: "Kiểu Anh (Tăng)" },
                { key: "dutch" as TypeFilter, label: "Kiểu Hà Lan (Giảm)" },
                { key: "sealed" as TypeFilter, label: "Bí Mật (Kín)" },
              ].map((m) => (
                <button
                  key={m.key}
                  onClick={() => setTypeFilter(m.key)}
                  style={{
                    padding: "5px 10px",
                    borderRadius: 4,
                    fontSize: 12,
                    fontWeight: typeFilter === m.key ? 700 : 500,
                    background: typeFilter === m.key ? "#001743" : "#F3F4F6",
                    color: typeFilter === m.key ? "#FFFFFF" : "#4B5563",
                    border: "none",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  {m.label}
                </button>
              ))}
            </div>

          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          3. REALTIME AUCTION GRID (GLOWING CARDS)
      ═══════════════════════════════════════════════════════════ */}
      <main className="container" style={{ maxWidth: 1200, margin: "0 auto", padding: "28px 20px 80px" }}>
        {filteredAuctions.length === 0 ? (
          <div
            style={{
              background: "#FFFFFF",
              border: "1px solid #E5E7EB",
              borderRadius: 8,
              padding: "48px 24px",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 36, marginBottom: 8 }}>🔨</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#001743", marginBottom: 6 }}>
              Không có phiên đấu giá nào trong danh mục này
            </div>
            <p style={{ fontSize: 13, color: "#6B7280", margin: 0 }}>
              Vui lòng chọn tab trạng thái hoặc hình thức đấu giá khác.
            </p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 }}>
            {filteredAuctions.map((item) => (
              <SimAuctionCard key={item.id} data={item} />
            ))}
          </div>
        )}
      </main>

      <style>{`
        @keyframes pulse-hero {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(1.3); }
        }
      `}</style>
    </div>
  );
}
