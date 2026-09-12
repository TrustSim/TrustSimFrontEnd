"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
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
  ChevronDown: ({ size = 14 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  ),
  Check: ({ size = 14 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  Sliders: ({ size = 14 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" y1="21" x2="4" y2="14" /><line x1="4" y1="10" x2="4" y2="3" />
      <line x1="12" y1="21" x2="12" y2="12" /><line x1="12" y1="8" x2="12" y2="3" />
      <line x1="20" y1="21" x2="20" y2="16" /><line x1="20" y1="12" x2="20" y2="3" />
      <line x1="1" y1="14" x2="7" y2="14" /><line x1="9" y1="8" x2="15" y2="8" /><line x1="17" y1="16" x2="23" y2="16" />
    </svg>
  ),
  ArrowUpDown: ({ size = 14 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m7 15 5 5 5-5" />
      <path d="m7 9 5-5 5 5" />
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

interface CarrierOption {
  key: string;
  name: string;
  code: string;
  color: string;
  bg: string;
}

const CARRIER_OPTIONS: CarrierOption[] = [
  { key: "all", name: "Tất cả nhà mạng", code: "ALL", color: "#001743", bg: "#F3F4F6" },
  { key: "viettel", name: "Viettel", code: "VTL", color: "#E4011E", bg: "#FEF2F2" },
  { key: "mobifone", name: "MobiFone", code: "MBF", color: "#005BAA", bg: "#EFF6FF" },
  { key: "vinaphone", name: "VinaPhone", code: "VNP", color: "#00A3E0", bg: "#F0F9FF" },
  { key: "vietnamobile", name: "Vietnamobile", code: "VNM", color: "#FF6600", bg: "#FFF7ED" },
  { key: "wintel", name: "Wintel", code: "WTL", color: "#7C3AED", bg: "#F5F3FF" },
  { key: "itelecom", name: "Itelecom", code: "ITL", color: "#DC2626", bg: "#FEF2F2" },
];

interface PriceOption {
  key: string;
  label: string;
  desc?: string;
  min?: number;
  max?: number;
}

const PRICE_OPTIONS: PriceOption[] = [
  { key: "all", label: "Tất cả mức giá" },
  { key: "under-10m", label: "Dưới 10 triệu", desc: "< 10.000.000 ₫", max: 10_000_000 },
  { key: "10m-50m", label: "10 - 50 triệu", desc: "10M - 50M ₫", min: 10_000_000, max: 50_000_000 },
  { key: "50m-100m", label: "50 - 100 triệu", desc: "50M - 100M ₫", min: 50_000_000, max: 100_000_000 },
  { key: "above-100m", label: "Trên 100 triệu (VIP)", desc: "> 100.000.000 ₫", min: 100_000_000 },
];

interface CategoryOption {
  key: string;
  label: string;
  tag?: string;
}

const CATEGORY_OPTIONS: CategoryOption[] = [
  { key: "all", label: "Tất cả danh mục" },
  { key: "tu-quy", label: "Tứ quý / Ngũ quý", tag: "8888, 9999..." },
  { key: "tam-hoa", label: "Tam hoa", tag: "666, 888..." },
  { key: "loc-phat", label: "Lộc phát", tag: "68, 86, 6868" },
  { key: "than-tai", label: "Thần tài", tag: "39, 79, 7979" },
  { key: "ong-dia", label: "Ông địa", tag: "38, 78" },
  { key: "so-tien", label: "Số tiến / Sảnh", tag: "5678, 6789..." },
  { key: "taxi", label: "SIM Taxi / Cặp đôi", tag: "7878, 8989..." },
  { key: "nam-sinh", label: "SIM Năm sinh", tag: "19xx, 20xx" },
  { key: "phong-thuy", label: "SIM Phong thủy", tag: "Hợp mệnh, đại cát" },
];

interface SortOption {
  key: string;
  label: string;
}

const SORT_OPTIONS: SortOption[] = [
  { key: "default", label: "Mới nhất (Mặc định)" },
  { key: "price-asc", label: "Giá thấp → cao" },
  { key: "price-desc", label: "Giá cao → thấp" },
  { key: "ending-soon", label: "Sắp kết thúc (Phút chót)" },
  { key: "bids-desc", label: "Nhiều lượt trả giá nhất (Hot)" },
];

function matchPrice(sim: AuctionDto, priceKey: string): boolean {
  if (priceKey === "all") return true;
  const price = sim.currentPrice ?? sim.startingPrice ?? 0;
  switch (priceKey) {
    case "under-10m":
      return price < 10_000_000;
    case "10m-50m":
      return price >= 10_000_000 && price <= 50_000_000;
    case "50m-100m":
      return price >= 50_000_000 && price <= 100_000_000;
    case "above-100m":
      return price > 100_000_000;
    default:
      return true;
  }
}

function matchCategory(sim: AuctionDto, catKey: string): boolean {
  if (catKey === "all") return true;
  const rawNum = (sim.simPhoneNumber || "").replace(/\D/g, "");
  const rhythm = (sim.formatRhythmName || "").toLowerCase();
  const cats = (sim.categories || []).map((c) => c.toLowerCase());

  const hasInMeta = (kw: string) => rhythm.includes(kw) || cats.some((c) => c.includes(kw));

  switch (catKey) {
    case "tu-quy":
      return /(.)\1{3}/.test(rawNum) || hasInMeta("tứ quý") || hasInMeta("ngũ quý") || hasInMeta("lục quý");
    case "tam-hoa":
      return /(.)\1{2}/.test(rawNum) || hasInMeta("tam hoa");
    case "loc-phat":
      return /68|86/.test(rawNum) || hasInMeta("lộc phát");
    case "than-tai":
      return /39|79/.test(rawNum) || hasInMeta("thần tài");
    case "ong-dia":
      return /38|78/.test(rawNum) || hasInMeta("ông địa");
    case "so-tien": {
      const isSequential = /(?:0123|1234|2345|3456|4567|5678|6789|123|234|345|456|567|678|789)/.test(rawNum);
      return isSequential || hasInMeta("tiến") || hasInMeta("sảnh");
    }
    case "taxi":
      return /(\d{2})\1$/.test(rawNum) || /(\d{3})\1$/.test(rawNum) || hasInMeta("taxi") || hasInMeta("cặp");
    case "nam-sinh":
      return /(?:19[6-9]\d|20[0-2]\d)$/.test(rawNum) || hasInMeta("năm sinh");
    case "phong-thuy":
      return hasInMeta("phong thủy") || hasInMeta("đại cát") || /(?:68|86|39|79|88|99)$/.test(rawNum);
    default:
      return true;
  }
}

function sortAuctions(list: AuctionDto[], sortKey: string): AuctionDto[] {
  const arr = [...list];
  switch (sortKey) {
    case "price-asc":
      return arr.sort((a, b) => (a.currentPrice ?? a.startingPrice) - (b.currentPrice ?? b.startingPrice));
    case "price-desc":
      return arr.sort((a, b) => (b.currentPrice ?? b.startingPrice) - (a.currentPrice ?? a.startingPrice));
    case "ending-soon":
      return arr.sort((a, b) => new Date(a.endAt).getTime() - new Date(b.endAt).getTime());
    case "bids-desc":
      return arr.sort((a, b) => (b.totalBids || 0) - (a.totalBids || 0));
    default:
      return arr;
  }
}

export default function AuctionsPage() {
  // Filter & Search states
  const [searchInput, setSearchInput] = useState("");
  const [debouncedKeyword, setDebouncedKeyword] = useState("");
  const [statusTab, setStatusTab] = useState<StatusTab>("live");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [carrierFilter, setCarrierFilter] = useState<string>("all");
  const [priceFilter, setPriceFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("default");
  const [openDropdown, setOpenDropdown] = useState<"carrier" | "price" | "category" | "sort" | null>(null);
  const filterToolbarRef = useRef<HTMLDivElement>(null);

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

  // Handle click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (filterToolbarRef.current && !filterToolbarRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Multi-criteria client filtering & sorting
  const displayAuctions = useMemo(() => {
    let list = auctions;

    // 1. Carrier filter
    if (carrierFilter !== "all") {
      list = list.filter((a) => formatCarrier(a.carrierName).toLowerCase() === carrierFilter.toLowerCase());
    }

    // 2. Price filter
    if (priceFilter !== "all") {
      list = list.filter((a) => matchPrice(a, priceFilter));
    }

    // 3. Category filter
    if (categoryFilter !== "all") {
      list = list.filter((a) => matchCategory(a, categoryFilter));
    }

    // 4. Sort
    return sortAuctions(list, sortBy);
  }, [auctions, carrierFilter, priceFilter, categoryFilter, sortBy]);

  // Active filter indicator
  const hasActiveFilters = Boolean(
    searchInput.trim() ||
    debouncedKeyword.trim() ||
    carrierFilter !== "all" ||
    categoryFilter !== "all" ||
    priceFilter !== "all" ||
    sortBy !== "default" ||
    typeFilter !== "all" ||
    statusTab !== "live"
  );

  const selectedCarrier = CARRIER_OPTIONS.find((c) => c.key === carrierFilter) || CARRIER_OPTIONS[0];
  const selectedCategory = CATEGORY_OPTIONS.find((c) => c.key === categoryFilter) || CATEGORY_OPTIONS[0];
  const selectedPrice = PRICE_OPTIONS.find((p) => p.key === priceFilter) || PRICE_OPTIONS[0];
  const selectedSort = SORT_OPTIONS.find((s) => s.key === sortBy) || SORT_OPTIONS[0];

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
    setPriceFilter("all");
    setCategoryFilter("all");
    setSortBy("default");
    setOpenDropdown(null);
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
          <div ref={filterToolbarRef} className="container" style={{ maxWidth: 1200, margin: "0 auto", padding: "12px 20px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              
              {/* Row 1: Search Input & Custom Filter Dropdowns */}
              <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                {/* Search Input Box */}
                <div style={{ flex: "1 1 260px", position: "relative" }}>
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
                    placeholder="Tìm theo mã phiên (AUC-...) hoặc số SIM..."
                    style={{
                      width: "100%",
                      height: 40,
                      padding: "0 38px 0 42px",
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

                {/* ── 1. Custom Carrier Dropdown (Logo Badge) ── */}
                <div style={{ position: "relative" }}>
                  <button
                    type="button"
                    onClick={() => setOpenDropdown(openDropdown === "carrier" ? null : "carrier")}
                    style={{
                      height: 40,
                      padding: "0 12px",
                      borderRadius: 6,
                      border: carrierFilter !== "all" ? "1.5px solid #001743" : "1px solid #D1D5DB",
                      background: carrierFilter !== "all" ? "#F8FAFC" : "#FFFFFF",
                      color: "#001743",
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      transition: "all 0.15s ease",
                      whiteSpace: "nowrap",
                    }}
                  >
                    <span
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: "50%",
                        background: selectedCarrier.color,
                        color: "#FFFFFF",
                        fontSize: 9,
                        fontWeight: 900,
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        letterSpacing: "-0.5px",
                      }}
                    >
                      {selectedCarrier.code}
                    </span>
                    <span>{selectedCarrier.name}</span>
                    <span style={{ transform: openDropdown === "carrier" ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s", display: "flex", color: "#6B7280" }}>
                      <Icons.ChevronDown size={14} />
                    </span>
                  </button>

                  {openDropdown === "carrier" && (
                    <div
                      style={{
                        position: "absolute",
                        top: "calc(100% + 6px)",
                        left: 0,
                        width: 210,
                        background: "#FFFFFF",
                        border: "1px solid #E5E7EB",
                        borderRadius: 8,
                        boxShadow: "0 10px 25px rgba(0, 23, 67, 0.12)",
                        zIndex: 50,
                        padding: 6,
                      }}
                    >
                      <div style={{ padding: "6px 8px 4px", fontSize: 10.5, fontWeight: 700, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                        Chọn nhà mạng
                      </div>
                      {CARRIER_OPTIONS.map((item) => {
                        const isSelected = carrierFilter === item.key;
                        return (
                          <button
                            key={item.key}
                            type="button"
                            onClick={() => {
                              setCarrierFilter(item.key);
                              setOpenDropdown(null);
                            }}
                            style={{
                              width: "100%",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              padding: "7px 10px",
                              borderRadius: 6,
                              background: isSelected ? "rgba(0, 23, 67, 0.05)" : "transparent",
                              border: "none",
                              cursor: "pointer",
                              textAlign: "left",
                              transition: "background 0.15s",
                            }}
                            onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = "#F9FAFB"; }}
                            onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = "transparent"; }}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                              <span
                                style={{
                                  width: 20,
                                  height: 20,
                                  borderRadius: "50%",
                                  background: item.color,
                                  color: "#FFFFFF",
                                  fontSize: 9,
                                  fontWeight: 900,
                                  display: "inline-flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  flexShrink: 0,
                                  letterSpacing: "-0.5px",
                                }}
                              >
                                {item.code}
                              </span>
                              <span style={{ fontSize: 13, fontWeight: isSelected ? 700 : 500, color: isSelected ? "#001743" : "#374151" }}>
                                {item.name}
                              </span>
                            </div>
                            {isSelected && (
                              <span style={{ color: "#E4011E", display: "flex" }}>
                                <Icons.Check size={14} />
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* ── 2. Custom Category Dropdown (Danh mục SIM) ── */}
                <div style={{ position: "relative" }}>
                  <button
                    type="button"
                    onClick={() => setOpenDropdown(openDropdown === "category" ? null : "category")}
                    style={{
                      height: 40,
                      padding: "0 12px",
                      borderRadius: 6,
                      border: categoryFilter !== "all" ? "1.5px solid #001743" : "1px solid #D1D5DB",
                      background: categoryFilter !== "all" ? "#F8FAFC" : "#FFFFFF",
                      color: "#001743",
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 7,
                      transition: "all 0.15s ease",
                      whiteSpace: "nowrap",
                    }}
                  >
                    <span style={{ color: categoryFilter !== "all" ? "#E4011E" : "#6B7280", display: "flex" }}>
                      <Icons.Sliders size={14} />
                    </span>
                    <span>{categoryFilter === "all" ? "Danh mục SIM" : selectedCategory.label}</span>
                    <span style={{ transform: openDropdown === "category" ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s", display: "flex", color: "#6B7280" }}>
                      <Icons.ChevronDown size={14} />
                    </span>
                  </button>

                  {openDropdown === "category" && (
                    <div
                      style={{
                        position: "absolute",
                        top: "calc(100% + 6px)",
                        left: 0,
                        width: 250,
                        maxHeight: 320,
                        overflowY: "auto",
                        background: "#FFFFFF",
                        border: "1px solid #E5E7EB",
                        borderRadius: 8,
                        boxShadow: "0 10px 25px rgba(0, 23, 67, 0.12)",
                        zIndex: 50,
                        padding: 6,
                      }}
                    >
                      <div style={{ padding: "6px 8px 4px", fontSize: 10.5, fontWeight: 700, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                        Loại số & Dòng SIM
                      </div>
                      {CATEGORY_OPTIONS.map((item) => {
                        const isSelected = categoryFilter === item.key;
                        return (
                          <button
                            key={item.key}
                            type="button"
                            onClick={() => {
                              setCategoryFilter(item.key);
                              setOpenDropdown(null);
                            }}
                            style={{
                              width: "100%",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              padding: "7px 10px",
                              borderRadius: 6,
                              background: isSelected ? "rgba(0, 23, 67, 0.05)" : "transparent",
                              border: "none",
                              cursor: "pointer",
                              textAlign: "left",
                              transition: "background 0.15s",
                            }}
                            onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = "#F9FAFB"; }}
                            onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = "transparent"; }}
                          >
                            <div>
                              <div style={{ fontSize: 13, fontWeight: isSelected ? 700 : 500, color: isSelected ? "#001743" : "#374151" }}>
                                {item.label}
                              </div>
                              {item.tag && (
                                <div style={{ fontSize: 11, color: "#6B7280", marginTop: 1 }}>{item.tag}</div>
                              )}
                            </div>
                            {isSelected && (
                              <span style={{ color: "#E4011E", display: "flex" }}>
                                <Icons.Check size={14} />
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* ── 3. Custom Price Range Dropdown (Khoảng giá) ── */}
                <div style={{ position: "relative" }}>
                  <button
                    type="button"
                    onClick={() => setOpenDropdown(openDropdown === "price" ? null : "price")}
                    style={{
                      height: 40,
                      padding: "0 12px",
                      borderRadius: 6,
                      border: priceFilter !== "all" ? "1.5px solid #001743" : "1px solid #D1D5DB",
                      background: priceFilter !== "all" ? "#F8FAFC" : "#FFFFFF",
                      color: "#001743",
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 7,
                      transition: "all 0.15s ease",
                      whiteSpace: "nowrap",
                    }}
                  >
                    <span style={{ fontSize: 13, color: priceFilter !== "all" ? "#E4011E" : "#6B7280", fontWeight: 700 }}>₫</span>
                    <span>{priceFilter === "all" ? "Khoảng giá" : selectedPrice.label}</span>
                    <span style={{ transform: openDropdown === "price" ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s", display: "flex", color: "#6B7280" }}>
                      <Icons.ChevronDown size={14} />
                    </span>
                  </button>

                  {openDropdown === "price" && (
                    <div
                      style={{
                        position: "absolute",
                        top: "calc(100% + 6px)",
                        left: 0,
                        width: 220,
                        background: "#FFFFFF",
                        border: "1px solid #E5E7EB",
                        borderRadius: 8,
                        boxShadow: "0 10px 25px rgba(0, 23, 67, 0.12)",
                        zIndex: 50,
                        padding: 6,
                      }}
                    >
                      <div style={{ padding: "6px 8px 4px", fontSize: 10.5, fontWeight: 700, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                        Mức ngân sách
                      </div>
                      {PRICE_OPTIONS.map((item) => {
                        const isSelected = priceFilter === item.key;
                        return (
                          <button
                            key={item.key}
                            type="button"
                            onClick={() => {
                              setPriceFilter(item.key);
                              setOpenDropdown(null);
                            }}
                            style={{
                              width: "100%",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              padding: "7px 10px",
                              borderRadius: 6,
                              background: isSelected ? "rgba(0, 23, 67, 0.05)" : "transparent",
                              border: "none",
                              cursor: "pointer",
                              textAlign: "left",
                              transition: "background 0.15s",
                            }}
                            onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = "#F9FAFB"; }}
                            onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = "transparent"; }}
                          >
                            <div>
                              <div style={{ fontSize: 13, fontWeight: isSelected ? 700 : 500, color: isSelected ? "#001743" : "#374151" }}>
                                {item.label}
                              </div>
                              {item.desc && (
                                <div style={{ fontSize: 11, color: "#6B7280", marginTop: 1 }}>{item.desc}</div>
                              )}
                            </div>
                            {isSelected && (
                              <span style={{ color: "#E4011E", display: "flex" }}>
                                <Icons.Check size={14} />
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* ── 4. Custom Sort Dropdown (Sắp xếp) ── */}
                <div style={{ position: "relative" }}>
                  <button
                    type="button"
                    onClick={() => setOpenDropdown(openDropdown === "sort" ? null : "sort")}
                    style={{
                      height: 40,
                      padding: "0 12px",
                      borderRadius: 6,
                      border: sortBy !== "default" ? "1.5px solid #001743" : "1px solid #D1D5DB",
                      background: sortBy !== "default" ? "#F8FAFC" : "#FFFFFF",
                      color: "#001743",
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 7,
                      transition: "all 0.15s ease",
                      whiteSpace: "nowrap",
                    }}
                  >
                    <span style={{ color: sortBy !== "default" ? "#E4011E" : "#6B7280", display: "flex" }}>
                      <Icons.ArrowUpDown size={14} />
                    </span>
                    <span>{sortBy === "default" ? "Sắp xếp" : selectedSort.label}</span>
                    <span style={{ transform: openDropdown === "sort" ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s", display: "flex", color: "#6B7280" }}>
                      <Icons.ChevronDown size={14} />
                    </span>
                  </button>

                  {openDropdown === "sort" && (
                    <div
                      style={{
                        position: "absolute",
                        top: "calc(100% + 6px)",
                        right: 0,
                        width: 230,
                        background: "#FFFFFF",
                        border: "1px solid #E5E7EB",
                        borderRadius: 8,
                        boxShadow: "0 10px 25px rgba(0, 23, 67, 0.12)",
                        zIndex: 50,
                        padding: 6,
                      }}
                    >
                      <div style={{ padding: "6px 8px 4px", fontSize: 10.5, fontWeight: 700, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                        Thứ tự hiển thị
                      </div>
                      {SORT_OPTIONS.map((item) => {
                        const isSelected = sortBy === item.key;
                        return (
                          <button
                            key={item.key}
                            type="button"
                            onClick={() => {
                              setSortBy(item.key);
                              setOpenDropdown(null);
                            }}
                            style={{
                              width: "100%",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              padding: "7px 10px",
                              borderRadius: 6,
                              background: isSelected ? "rgba(0, 23, 67, 0.05)" : "transparent",
                              border: "none",
                              cursor: "pointer",
                              textAlign: "left",
                              transition: "background 0.15s",
                            }}
                            onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = "#F9FAFB"; }}
                            onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = "transparent"; }}
                          >
                            <span style={{ fontSize: 13, fontWeight: isSelected ? 700 : 500, color: isSelected ? "#001743" : "#374151" }}>
                              {item.label}
                            </span>
                            {isSelected && (
                              <span style={{ color: "#E4011E", display: "flex" }}>
                                <Icons.Check size={14} />
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* ── 5. Clear Filters Button ── */}
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "0 14px",
                      height: 40,
                      borderRadius: 6,
                      background: "#FEF2F2",
                      border: "1px solid #FECACA",
                      color: "#DC2626",
                      fontSize: 12.5,
                      fontWeight: 700,
                      cursor: "pointer",
                      transition: "all 0.15s",
                      whiteSpace: "nowrap",
                    }}
                  >
                    <Icons.Refresh /> Xóa lọc
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
