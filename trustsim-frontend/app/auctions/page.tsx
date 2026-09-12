"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import SimAuctionCard, { SimAuctionCardData } from "@/components/ui/SimAuctionCard";
import { auctionService, AuctionDto } from "@/services/auctionService";
import { auctionHubService } from "@/services/auctionHubService";

/* ─── Line SVG Icons ──────────────────────────────────────── */
const Icons = {
  Search: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  X: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
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
  Tag: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z" />
      <path d="M7 7h.01" />
    </svg>
  ),
  Filter: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  ),
  Refresh: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
    </svg>
  ),
};

type StatusTab = "all" | "live" | "upcoming" | "ended";
type TypeFilter = "all" | "english" | "dutch";

// Helpers
function formatCarrier(rawCarrier?: string): string {
  if (!rawCarrier) return "Viettel";
  const lower = rawCarrier.toLowerCase();
  if (lower.includes("viettel")) return "Viettel";
  if (lower.includes("mobi")) return "Mobifone";
  if (lower.includes("vina")) return "Vinaphone";
  if (lower.includes("vietnamobile") || lower.includes("vnm")) return "Vietnamobile";
  return rawCarrier;
}

function mapAuctionStatus(status: any): "live" | "upcoming" | "ended" {
  const s = String(status).toUpperCase();
  if (s === "ACTIVE" || s === "2") return "live";
  if (s === "SCHEDULE" || s === "1") return "upcoming";
  return "ended";
}

function mapAuctionType(type: any): "english" | "dutch" | "sealed" {
  const t = String(type).toUpperCase();
  if (t === "DUTCH" || t === "1") return "dutch";
  if (t === "SEALED" || t === "2") return "sealed";
  return "english";
}

function toCardData(item: AuctionDto): SimAuctionCardData {
  return {
    id: item.id,
    simNumber: item.simPhoneNumber || "---",
    carrier: formatCarrier(item.carrierName),
    type: mapAuctionType(item.auctionType),
    status: mapAuctionStatus(item.auctionStatus),
    currentPrice: item.currentPrice ?? item.startingPrice,
    startPrice: item.startingPrice,
    bidCount: item.totalBids ?? 0,
    endTime: item.endAt,
    category: item.formatRhythmName || `Mã: ${item.auctionCode}`,
    seller: item.authorName || "TrustSim Đấu Giá",
  };
}

export default function AuctionsPage() {
  // Filter & Search states
  const [searchInput, setSearchInput] = useState("");
  const [debouncedKeyword, setDebouncedKeyword] = useState("");
  const [statusTab, setStatusTab] = useState<StatusTab>("live");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [carrierFilter, setCarrierFilter] = useState<string>("all");

  // Pagination states
  const [pageIndex, setPageIndex] = useState(1);
  const pageSize = 12;

  // Data states
  const [auctions, setAuctions] = useState<AuctionDto[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Hero Spotlight states
  const [heroAuctions, setHeroAuctions] = useState<AuctionDto[]>([]);
  const [heroIndex, setHeroIndex] = useState(0);
  const [heroCountdown, setHeroCountdown] = useState("00:00:00");

  // Tab counts
  const [counts, setCounts] = useState({
    all: 0,
    live: 0,
    upcoming: 0,
    ended: 0,
  });

  // Debounce search input (350ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedKeyword(searchInput);
      setPageIndex(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Fetch Hero Spotlight Auctions (Active ones with highest current price)
  useEffect(() => {
    let isMounted = true;
    async function loadHeroAuctions() {
      try {
        const res = await auctionService.getAuctions({
          status: "ACTIVE",
          pageSize: 5,
          pageIndex: 1,
        });
        if (isMounted && res.items && res.items.length > 0) {
          // Sort by currentPrice descending
          const sorted = [...res.items].sort((a, b) => b.currentPrice - a.currentPrice);
          setHeroAuctions(sorted);
        }
      } catch (err) {
        console.error("Lỗi khi tải phiên tiêu biểu:", err);
      }
    }
    loadHeroAuctions();
    return () => {
      isMounted = false;
    };
  }, []);

  // ─── Real-time SignalR Connection for Listing Feed ─────────────────────────
  useEffect(() => {
    let isMounted = true;
    const setupListingFeed = async () => {
      try {
        await auctionHubService.joinListingFeed();
        if (!isMounted) return;

        auctionHubService.onNewAuctionCreated((newAuction) => {
          if (!isMounted) return;
          // Prepend phiên đấu giá mới vào đầu danh sách
          setAuctions((prev) => [newAuction, ...prev.filter((a) => a.id !== newAuction.id)]);
          setTotalCount((prev) => prev + 1);
          setCounts((prev) => ({
            ...prev,
            all: prev.all + 1,
            upcoming: newAuction.auctionStatus === "SCHEDULE" ? prev.upcoming + 1 : prev.upcoming,
            live: newAuction.auctionStatus === "ACTIVE" ? prev.live + 1 : prev.live,
          }));
        });
      } catch (err) {
        console.warn("[SignalR] Lỗi kết nối listing feed:", err);
      }
    };

    setupListingFeed();

    return () => {
      isMounted = false;
      auctionHubService.leaveListingFeed();
      auctionHubService.removeListingListeners();
    };
  }, []);

  // Fetch status tab counts on initial load
  const fetchCounts = useCallback(async () => {
    try {
      const [allRes, liveRes, upRes, endRes] = await Promise.allSettled([
        auctionService.getAuctions({ pageSize: 1, pageIndex: 1 }),
        auctionService.getAuctions({ status: "ACTIVE", pageSize: 1, pageIndex: 1 }),
        auctionService.getAuctions({ status: "SCHEDULE", pageSize: 1, pageIndex: 1 }),
        auctionService.getAuctions({ status: "END", pageSize: 1, pageIndex: 1 }),
      ]);

      setCounts({
        all: allRes.status === "fulfilled" ? allRes.value.totalCount : 0,
        live: liveRes.status === "fulfilled" ? liveRes.value.totalCount : 0,
        upcoming: upRes.status === "fulfilled" ? upRes.value.totalCount : 0,
        ended: endRes.status === "fulfilled" ? endRes.value.totalCount : 0,
      });
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    fetchCounts();
  }, [fetchCounts]);

  // Main Data Fetcher
  const loadAuctions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let statusParam: string | undefined = undefined;
      if (statusTab === "live") statusParam = "ACTIVE";
      else if (statusTab === "upcoming") statusParam = "SCHEDULE";
      else if (statusTab === "ended") statusParam = "END";

      let typeParam: string | undefined = undefined;
      if (typeFilter === "english") typeParam = "ENGLISH";
      else if (typeFilter === "dutch") typeParam = "DUTCH";

      const res = await auctionService.getAuctions({
        keyword: debouncedKeyword.trim() || undefined,
        status: statusParam,
        type: typeParam,
        pageIndex,
        pageSize,
      });

      setAuctions(res.items || []);
      setTotalCount(res.totalCount || 0);
      setTotalPages(res.totalPages || 1);
    } catch (err: any) {
      console.error("Lỗi khi tải danh sách đấu giá:", err);
      setError(err?.message || "Không thể tải danh sách phiên đấu giá từ hệ thống.");
      setAuctions([]);
      setTotalCount(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [debouncedKeyword, statusTab, typeFilter, pageIndex, pageSize]);

  useEffect(() => {
    loadAuctions();
  }, [loadAuctions]);

  // Carrier client filtering (if user chooses specific carrier)
  const displayAuctions = useMemo(() => {
    if (carrierFilter === "all") return auctions;
    return auctions.filter((a) => formatCarrier(a.carrierName).toLowerCase() === carrierFilter.toLowerCase());
  }, [auctions, carrierFilter]);

  // Hero Countdown Timer
  const currentHero = heroAuctions[heroIndex];
  useEffect(() => {
    if (!currentHero?.endAt) return;
    const end = new Date(currentHero.endAt).getTime();

    const updateTimer = () => {
      const diff = end - Date.now();
      if (diff <= 0) {
        setHeroCountdown("00:00:00");
        return;
      }
      const h = Math.floor(diff / 3_600_000).toString().padStart(2, "0");
      const m = Math.floor((diff % 3_600_000) / 60_000).toString().padStart(2, "0");
      const s = Math.floor((diff % 60_000) / 1_000).toString().padStart(2, "0");
      setHeroCountdown(`${h}:${m}:${s}`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [currentHero]);

  // Clear all filters & search
  const handleResetFilters = () => {
    setSearchInput("");
    setDebouncedKeyword("");
    setStatusTab("live");
    setTypeFilter("all");
    setCarrierFilter("all");
    setPageIndex(1);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#F8F9FA", display: "flex", flexDirection: "column" }}>
      {/* ─── Global Navbar ────────────────────────────────────────── */}
      <Navbar />

      <div style={{ flex: 1, paddingTop: 64 }}>
        {/* ═══════════════════════════════════════════════════════════
            1. FEATURED HERO BANNER: DYNAMIC REAL-TIME SPOTLIGHT
        ═══════════════════════════════════════════════════════════ */}
        {currentHero ? (
          <section
            style={{
              background: "linear-gradient(135deg, #001743 0%, #002B7A 55%, #061938 100%)",
              color: "#FFFFFF",
              padding: "36px 0 32px",
              position: "relative",
              overflow: "hidden",
              borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
            }}
          >
            {/* Glowing Amber / Red Spotlight */}
            <div
              style={{
                position: "absolute",
                right: "8%",
                top: "50%",
                transform: "translateY(-50%)",
                width: 450,
                height: 450,
                background: "radial-gradient(circle, rgba(228, 1, 30, 0.22) 0%, transparent 70%)",
                filter: "blur(60px)",
                pointerEvents: "none",
              }}
            />

            <div className="container" style={{ maxWidth: 1200, margin: "0 auto", padding: "0 20px", position: "relative", zIndex: 2 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1.25fr 0.75fr", gap: 36, alignItems: "center" }}>
                {/* Left Column: SIM Information & Countdown */}
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
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
                          width: 7,
                          height: 7,
                          borderRadius: "50%",
                          background: "#FF4D6D",
                          boxShadow: "0 0 8px #FF4D6D",
                          animation: "pulse-hero 1.5s infinite",
                        }}
                      />
                      Tâm Điểm Đấu Giá Realtime
                    </span>

                    {/* Auction Code Badge */}
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 5,
                        padding: "3px 8px",
                        borderRadius: 4,
                        background: "rgba(255, 255, 255, 0.12)",
                        border: "1px solid rgba(255, 255, 255, 0.2)",
                        color: "#FFFFFF",
                        fontSize: 11.5,
                        fontWeight: 700,
                        fontFamily: "monospace",
                      }}
                    >
                      <Icons.Tag /> {currentHero.auctionCode}
                    </span>

                    <span style={{ fontSize: 12, color: "rgba(255, 255, 255, 0.7)", display: "flex", alignItems: "center", gap: 4 }}>
                      <Icons.Eye /> {currentHero.totalParticipants || 1} người tham gia
                    </span>
                  </div>

                  {/* SIM Number */}
                  <h1
                    style={{
                      fontSize: "clamp(2rem, 3.5vw, 2.8rem)",
                      fontWeight: 900,
                      color: "#FFFFFF",
                      margin: "0 0 8px",
                      letterSpacing: "0.05em",
                      lineHeight: 1.2,
                    }}
                  >
                    {currentHero.simPhoneNumber.replace(/(\d{4})(\d{3})(\d{3})/, "$1 $2 $3")}
                  </h1>

                  <p style={{ fontSize: 14, color: "rgba(255, 255, 255, 0.8)", margin: "0 0 20px", lineHeight: 1.5 }}>
                    {currentHero.formatRhythmName || "SIM Đấu Giá Số Đẹp"} · Nhà mạng:{" "}
                    <strong style={{ color: "#FDE047" }}>{formatCarrier(currentHero.carrierName)}</strong> · Hình thức:{" "}
                    <strong style={{ color: "#93C5FD" }}>
                      {currentHero.auctionType === "DUTCH" ? "Đấu giá Hà Lan" : "Đấu giá Kiểu Anh"}
                    </strong>
                  </p>

                  {/* Countdown Bar */}
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
                      <div style={{ fontSize: 22, fontWeight: 900, color: "#FDE047", fontVariantNumeric: "tabular-nums", letterSpacing: "0.05em" }}>
                        {heroCountdown}
                      </div>
                    </div>

                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 11, color: "rgba(255, 255, 255, 0.65)", fontWeight: 700, textTransform: "uppercase" }}>
                        Giá trả hiện tại
                      </div>
                      <div style={{ fontSize: 24, fontWeight: 900, color: "#FFFFFF", fontVariantNumeric: "tabular-nums" }}>
                        {currentHero.currentPrice.toLocaleString("vi-VN")} <span style={{ fontSize: 15, fontWeight: 700 }}>₫</span>
                      </div>
                    </div>
                  </div>

                  {/* Hero Actions */}
                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <Link
                      href={`/auctions/${currentHero.id}`}
                      style={{
                        padding: "12px 26px",
                        fontSize: 14,
                        fontWeight: 800,
                        borderRadius: 6,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 8,
                        background: "#E4011E",
                        color: "#FFFFFF",
                        textDecoration: "none",
                        boxShadow: "0 8px 24px rgba(228, 1, 30, 0.45)",
                        transition: "all 0.2s ease",
                      }}
                    >
                      <Icons.Gavel /> Vào Phòng Trả Giá Ngay →
                    </Link>

                    {/* Carousel Arrows if multiple heroes */}
                    {heroAuctions.length > 1 && (
                      <div style={{ display: "flex", gap: 6 }}>
                        <button
                          onClick={() => setHeroIndex((prev) => (prev === 0 ? heroAuctions.length - 1 : prev - 1))}
                          aria-label="Phiên trước"
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: 6,
                            background: "rgba(255, 255, 255, 0.12)",
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
                          onClick={() => setHeroIndex((prev) => (prev === heroAuctions.length - 1 ? 0 : prev + 1))}
                          aria-label="Phiên sau"
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: 6,
                            background: "rgba(255, 255, 255, 0.12)",
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
                    )}
                  </div>
                </div>

                {/* Right Column: Room Metadata Box */}
                <div
                  style={{
                    background: "rgba(0, 0, 0, 0.35)",
                    backdropFilter: "blur(16px)",
                    border: "1px solid rgba(255, 255, 255, 0.14)",
                    borderRadius: 12,
                    padding: "22px",
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 800, color: "#FFFFFF", borderBottom: "1px solid rgba(255, 255, 255, 0.1)", paddingBottom: 10, marginBottom: 14, display: "flex", justifyContent: "space-between" }}>
                    <span>⚖️ Quy chế phòng đấu giá</span>
                    <span style={{ color: "#86EFAC", fontSize: 11, fontWeight: 700 }}>● Đang mở cửa</span>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "rgba(255, 255, 255, 0.8)" }}>
                      <span>Mã phiên đấu giá:</span>
                      <strong style={{ color: "#FFFFFF", fontFamily: "monospace" }}>{currentHero.auctionCode}</strong>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "rgba(255, 255, 255, 0.8)" }}>
                      <span>Giá khởi điểm:</span>
                      <strong style={{ color: "#FFFFFF" }}>{currentHero.startingPrice.toLocaleString("vi-VN")} ₫</strong>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "rgba(255, 255, 255, 0.8)" }}>
                      <span>Tổng lượt trả giá:</span>
                      <strong style={{ color: "#FDE047" }}>{currentHero.totalBids || 0} lượt</strong>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "rgba(255, 255, 255, 0.8)" }}>
                      <span>Người mở phiên:</span>
                      <strong style={{ color: "#FFFFFF" }}>{currentHero.authorName || "Hệ thống TrustSim"}</strong>
                    </div>

                    <div style={{ marginTop: 6, paddingTop: 10, borderTop: "1px dashed rgba(255, 255, 255, 0.12)", fontSize: 12, color: "rgba(255, 255, 255, 0.65)", display: "flex", alignItems: "center", gap: 6 }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="16" x2="12" y2="12" />
                        <line x1="12" y1="8" x2="12.01" y2="8" />
                      </svg>
                      Tiền đặt cọc được hoàn lại 100% nếu không trúng đấu giá theo quy định của sàn.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        ) : (
          /* Fallback Welcome Banner when no active hero auction exists */
          <section
            style={{
              background: "linear-gradient(135deg, #001743 0%, #00266B 100%)",
              color: "#FFFFFF",
              padding: "40px 0 36px",
              borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
            }}
          >
            <div className="container" style={{ maxWidth: 1200, margin: "0 auto", padding: "0 20px" }}>
              <div style={{ maxWidth: 700 }}>
                <span
                  style={{
                    display: "inline-block",
                    padding: "4px 10px",
                    borderRadius: 4,
                    background: "rgba(228, 1, 30, 0.25)",
                    border: "1px solid rgba(228, 1, 30, 0.5)",
                    color: "#FF4D6D",
                    fontSize: 11,
                    fontWeight: 800,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    marginBottom: 10,
                  }}
                >
                  Sàn Đấu Giá Số Đẹp Minh Bạch
                </span>
                <h1 style={{ fontSize: "clamp(1.8rem, 3vw, 2.4rem)", fontWeight: 900, margin: "0 0 10px" }}>
                  Sàn Đấu Giá SIM Số Đẹp Quốc Gia
                </h1>
                <p style={{ fontSize: 14, color: "rgba(255, 255, 255, 0.8)", margin: 0, lineHeight: 1.6 }}>
                  Hệ thống đấu giá SIM số minh bạch theo tiêu chuẩn quốc tế. Tìm kiếm phiên đấu giá nhanh theo mã định danh (Auction Code) hoặc thuê bao quan tâm bên dưới.
                </p>
              </div>
            </div>
          </section>
        )}

        {/* ═══════════════════════════════════════════════════════════
            2. SEARCH & CONTROL BAR (AUCTION CODE / PHONE NUMBER SEARCH)
        ═══════════════════════════════════════════════════════════ */}
        <section
          style={{
            background: "#FFFFFF",
            borderBottom: "1px solid #E5E7EB",
            position: "sticky",
            top: 64,
            zIndex: 30,
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.03)",
          }}
        >
          <div className="container" style={{ maxWidth: 1200, margin: "0 auto", padding: "12px 20px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              
              {/* Row 1: Search Input & Action Badges */}
              <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                {/* Search Input Box */}
                <div style={{ flex: "1 1 360px", position: "relative" }}>
                  <div
                    style={{
                      position: "absolute",
                      left: 14,
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "#6B7280",
                      display: "flex",
                      alignItems: "center",
                      pointerEvents: "none",
                    }}
                  >
                    <Icons.Search />
                  </div>

                  <input
                    type="text"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder="Tìm theo mã phiên (VD: AUC-20260901-001) hoặc số SIM..."
                    style={{
                      width: "100%",
                      padding: "10px 38px 10px 42px",
                      borderRadius: 6,
                      border: "1px solid #D1D5DB",
                      fontSize: 13.5,
                      color: "#001743",
                      background: "#FFFFFF",
                      outline: "none",
                      transition: "border-color 0.15s, box-shadow 0.15s",
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = "#E4011E";
                      e.currentTarget.style.boxShadow = "0 0 0 3px rgba(228, 1, 30, 0.1)";
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = "#D1D5DB";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  />

                  {/* Clear Button (X) */}
                  {searchInput && (
                    <button
                      onClick={() => setSearchInput("")}
                      aria-label="Xóa tìm kiếm"
                      style={{
                        position: "absolute",
                        right: 12,
                        top: "50%",
                        transform: "translateY(-50%)",
                        background: "none",
                        border: "none",
                        color: "#9CA3AF",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        padding: 4,
                      }}
                    >
                      <Icons.X />
                    </button>
                  )}
                </div>

                {/* Carrier Filter */}
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 12, color: "#6B7280", fontWeight: 600 }}>Nhà mạng:</span>
                  <select
                    value={carrierFilter}
                    onChange={(e) => setCarrierFilter(e.target.value)}
                    style={{
                      padding: "8px 12px",
                      borderRadius: 6,
                      border: "1px solid #D1D5DB",
                      fontSize: 12.5,
                      color: "#001743",
                      background: "#FFFFFF",
                      outline: "none",
                      cursor: "pointer",
                      fontWeight: 600,
                    }}
                  >
                    <option value="all">Tất cả nhà mạng</option>
                    <option value="viettel">Viettel</option>
                    <option value="mobifone">MobiFone</option>
                    <option value="vinaphone">VinaPhone</option>
                    <option value="vietnamobile">Vietnamobile</option>
                  </select>
                </div>

                {/* Reset Filters button if any active filter */}
                {(debouncedKeyword || typeFilter !== "all" || carrierFilter !== "all" || statusTab !== "live") && (
                  <button
                    onClick={handleResetFilters}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "8px 12px",
                      borderRadius: 6,
                      background: "#FEE2E2",
                      border: "1px solid #FECACA",
                      color: "#DC2626",
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: "pointer",
                      transition: "all 0.15s",
                    }}
                  >
                    <Icons.Refresh /> Đặt lại lọc
                  </button>
                )}
              </div>

              {/* Row 2: Status Tabs & Mechanism Sub-Filters */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, borderTop: "1px solid #F3F4F6", paddingTop: 8 }}>
                
                {/* Status Tabs */}
                <div style={{ display: "flex", gap: 4, overflowX: "auto" }}>
                  {[
                    { key: "live" as StatusTab, label: "Đang Diễn Ra", count: counts.live, color: "#E4011E", pulse: true },
                    { key: "upcoming" as StatusTab, label: "Sắp Bắt Đầu", count: counts.upcoming, color: "#D97706", pulse: false },
                    { key: "ended" as StatusTab, label: "Đã Kết Thúc", count: counts.ended, color: "#4B5563", pulse: false },
                    { key: "all" as StatusTab, label: "Tất Cả Phiên", count: counts.all, color: "#001743", pulse: false },
                  ].map((tab) => {
                    const isActive = statusTab === tab.key;
                    return (
                      <button
                        key={tab.key}
                        onClick={() => {
                          setStatusTab(tab.key);
                          setPageIndex(1);
                        }}
                        style={{
                          padding: "10px 14px",
                          background: "none",
                          border: "none",
                          borderBottom: `3px solid ${isActive ? tab.color : "transparent"}`,
                          color: isActive ? "#001743" : "#6B7280",
                          fontSize: 13,
                          fontWeight: isActive ? 800 : 500,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {tab.pulse && (
                          <span
                            style={{
                              width: 6,
                              height: 6,
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

                {/* Mechanism Filter: English / Dutch */}
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 12, color: "#6B7280", fontWeight: 600 }}>Hình thức:</span>
                  {[
                    { key: "all" as TypeFilter, label: "Tất cả" },
                    { key: "english" as TypeFilter, label: "Kiểu Anh (Tăng)" },
                    { key: "dutch" as TypeFilter, label: "Kiểu Hà Lan (Giảm)" },
                  ].map((m) => (
                    <button
                      key={m.key}
                      onClick={() => {
                        setTypeFilter(m.key);
                        setPageIndex(1);
                      }}
                      style={{
                        padding: "4px 10px",
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
        </section>

        {/* ═══════════════════════════════════════════════════════════
            3. ACTIVE SEARCH RESULTS / STATUS HEADER
        ═══════════════════════════════════════════════════════════ */}
        <div className="container" style={{ maxWidth: 1200, margin: "0 auto", padding: "20px 20px 0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
            <div style={{ fontSize: 13, color: "#4B5563" }}>
              {debouncedKeyword ? (
                <span>
                  Kết quả tìm kiếm cho mã/số: <strong style={{ color: "#E4011E", fontFamily: "monospace" }}>"{debouncedKeyword}"</strong>{" "}
                  ({totalCount} phiên đấu giá)
                </span>
              ) : (
                <span>
                  Đang hiển thị <strong>{displayAuctions.length}</strong> / <strong>{totalCount}</strong> phiên đấu giá
                </span>
              )}
            </div>

            {loading && (
              <span style={{ fontSize: 12, color: "#6B7280", display: "inline-flex", alignItems: "center", gap: 6 }}>
                <span className="inline-block animate-spin">⏳</span> Đang đồng bộ dữ liệu từ sàn...
              </span>
            )}
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════
            4. MAIN GRID OF REAL AUCTIONS (CHAMFERED CARDS)
        ═══════════════════════════════════════════════════════════ */}
        <main className="container" style={{ maxWidth: 1200, margin: "0 auto", padding: "16px 20px 60px" }}>
          {error && (
            <div
              style={{
                background: "#FEF2F2",
                border: "1px solid #FECACA",
                borderRadius: 8,
                padding: "16px 20px",
                color: "#991B1B",
                fontSize: 13.5,
                marginBottom: 24,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <strong>Lỗi kết nối:</strong> {error}
              </div>
              <button
                onClick={loadAuctions}
                style={{
                  padding: "6px 14px",
                  borderRadius: 4,
                  background: "#DC2626",
                  color: "#FFFFFF",
                  border: "none",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Thử lại
              </button>
            </div>
          )}

          {loading ? (
            /* Skeleton Loading State */
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 }}>
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div
                  key={n}
                  style={{
                    background: "#FFFFFF",
                    border: "1px solid #E5E7EB",
                    borderRadius: "8px 0 8px 8px",
                    padding: "20px",
                    minHeight: 210,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    animation: "pulse 1.5s infinite",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <div style={{ width: 70, height: 22, background: "#E5E7EB", borderRadius: 4 }} />
                    <div style={{ width: 80, height: 22, background: "#E5E7EB", borderRadius: 4 }} />
                  </div>
                  <div style={{ margin: "14px 0" }}>
                    <div style={{ width: 180, height: 30, background: "#E5E7EB", borderRadius: 4, marginBottom: 8 }} />
                    <div style={{ width: 120, height: 16, background: "#F3F4F6", borderRadius: 4 }} />
                  </div>
                  <div style={{ borderTop: "1px solid #F3F4F6", paddingTop: 12, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                    <div>
                      <div style={{ width: 60, height: 12, background: "#F3F4F6", borderRadius: 4, marginBottom: 4 }} />
                      <div style={{ width: 110, height: 22, background: "#E5E7EB", borderRadius: 4 }} />
                    </div>
                    <div style={{ width: 90, height: 28, background: "#E5E7EB", borderRadius: 4 }} />
                  </div>
                </div>
              ))}
            </div>
          ) : displayAuctions.length === 0 ? (
            /* Empty State */
            <div
              style={{
                background: "#FFFFFF",
                border: "1px solid #E5E7EB",
                borderRadius: 8,
                padding: "60px 24px",
                textAlign: "center",
              }}
            >
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 16, color: "#9CA3AF" }}>
                <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </div>
              <div style={{ fontSize: 17, fontWeight: 800, color: "#001743", marginBottom: 8 }}>
                {debouncedKeyword
                  ? `Không tìm thấy phiên đấu giá nào phù hợp với mã "${debouncedKeyword}"`
                  : "Không có phiên đấu giá nào trong danh mục này"}
              </div>
              <p style={{ fontSize: 13.5, color: "#6B7280", margin: "0 auto 20px", maxWidth: 460, lineHeight: 1.6 }}>
                {debouncedKeyword
                  ? "Bạn hãy kiểm tra lại định dạng mã phiên (VD: AUC-20260901-001) hoặc số thuê bao SIM cần tìm."
                  : "Hiện chưa có phiên đấu giá phù hợp với trạng thái hoặc nhà mạng đã chọn."}
              </p>
              <button
                onClick={handleResetFilters}
                style={{
                  padding: "10px 20px",
                  borderRadius: 6,
                  background: "#001743",
                  color: "#FFFFFF",
                  border: "none",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Xem tất cả các phiên đấu giá
              </button>
            </div>
          ) : (
            /* Real Auctions Cards Grid */
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 }}>
              {displayAuctions.map((item) => (
                <SimAuctionCard key={item.id} data={toCardData(item)} />
              ))}
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════
              5. PAGINATION CONTROLS
          ═══════════════════════════════════════════════════════════ */}
          {!loading && totalPages > 1 && (
            <div style={{ marginTop: 40, display: "flex", justifyContent: "center", alignItems: "center", gap: 8 }}>
              <button
                onClick={() => setPageIndex((p) => Math.max(1, p - 1))}
                disabled={pageIndex <= 1}
                style={{
                  padding: "8px 14px",
                  borderRadius: 6,
                  border: "1px solid #D1D5DB",
                  background: pageIndex <= 1 ? "#F3F4F6" : "#FFFFFF",
                  color: pageIndex <= 1 ? "#9CA3AF" : "#001743",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: pageIndex <= 1 ? "not-allowed" : "pointer",
                }}
              >
                ← Trang trước
              </button>

              <span style={{ fontSize: 13, fontWeight: 700, color: "#001743", padding: "0 10px" }}>
                Trang {pageIndex} / {totalPages}
              </span>

              <button
                onClick={() => setPageIndex((p) => Math.min(totalPages, p + 1))}
                disabled={pageIndex >= totalPages}
                style={{
                  padding: "8px 14px",
                  borderRadius: 6,
                  border: "1px solid #D1D5DB",
                  background: pageIndex >= totalPages ? "#F3F4F6" : "#FFFFFF",
                  color: pageIndex >= totalPages ? "#9CA3AF" : "#001743",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: pageIndex >= totalPages ? "not-allowed" : "pointer",
                }}
              >
                Trang sau →
              </button>
            </div>
          )}
        </main>
      </div>

      {/* ─── Global Footer ────────────────────────────────────────── */}
      <Footer />

      <style>{`
        @keyframes pulse-hero {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(1.3); }
        }
      `}</style>
    </div>
  );
}
