"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import SimAuctionCard, { SimAuctionCardData } from "@/components/ui/SimAuctionCard";
import { auctionService, AuctionDto } from "@/services/auctionService";
import { auctionHubService } from "@/services/auctionHubService";
import {
  Search, X, Gavel, Eye, Clock, ChevronLeft, ChevronRight,
  Tag, SlidersHorizontal, ArrowUpDown, RotateCcw, ChevronDown,
  Check, Flame, Shield, Zap, TrendingUp, TrendingDown, Users, Filter
} from "lucide-react";

/* ─── Types ──────────────────────────────────────────────── */
type StatusTab = "all" | "live" | "upcoming" | "ended";
type TypeFilter = "all" | "english" | "dutch";

/* ─── Helpers ────────────────────────────────────────────── */
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

/* ─── Filter Options ─────────────────────────────────────── */
interface CarrierOption { key: string; name: string; code: string; color: string; }

const CARRIER_OPTIONS: CarrierOption[] = [
  { key: "all", name: "Tất cả nhà mạng", code: "ALL", color: "#64748B" },
  { key: "viettel", name: "Viettel", code: "VTL", color: "#E4011E" },
  { key: "mobifone", name: "MobiFone", code: "MBF", color: "#005BAA" },
  { key: "vinaphone", name: "VinaPhone", code: "VNP", color: "#00A3E0" },
  { key: "vietnamobile", name: "Vietnamobile", code: "VNM", color: "#FF6600" },
  { key: "wintel", name: "Wintel", code: "WTL", color: "#7C3AED" },
  { key: "itelecom", name: "Itelecom", code: "ITL", color: "#DC2626" },
];

interface PriceOption { key: string; label: string; desc?: string; min?: number; max?: number; }

const PRICE_OPTIONS: PriceOption[] = [
  { key: "all", label: "Tất cả mức giá" },
  { key: "under-10m", label: "Dưới 10 triệu", desc: "< 10.000.000 ₫", max: 10_000_000 },
  { key: "10m-50m", label: "10 - 50 triệu", desc: "10M - 50M ₫", min: 10_000_000, max: 50_000_000 },
  { key: "50m-100m", label: "50 - 100 triệu", desc: "50M - 100M ₫", min: 50_000_000, max: 100_000_000 },
  { key: "above-100m", label: "Trên 100 triệu (VIP)", desc: "> 100.000.000 ₫", min: 100_000_000 },
];

interface CategoryOption { key: string; label: string; tag?: string; }

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

interface SortOption { key: string; label: string; icon?: string; }

const SORT_OPTIONS: SortOption[] = [
  { key: "default", label: "Mới nhất (Mặc định)" },
  { key: "price-asc", label: "Giá thấp → cao" },
  { key: "price-desc", label: "Giá cao → thấp" },
  { key: "ending-soon", label: "Sắp kết thúc" },
  { key: "bids-desc", label: "Nhiều lượt trả giá nhất" },
];

/* ─── Client-side filter/sort functions ──────────────────── */
function matchPrice(sim: AuctionDto, priceKey: string): boolean {
  if (priceKey === "all") return true;
  const price = sim.currentPrice ?? sim.startingPrice ?? 0;
  switch (priceKey) {
    case "under-10m": return price < 10_000_000;
    case "10m-50m": return price >= 10_000_000 && price <= 50_000_000;
    case "50m-100m": return price >= 50_000_000 && price <= 100_000_000;
    case "above-100m": return price > 100_000_000;
    default: return true;
  }
}

function matchCategory(sim: AuctionDto, catKey: string): boolean {
  if (catKey === "all") return true;
  const rawNum = (sim.simPhoneNumber || "").replace(/\D/g, "");
  const rhythm = (sim.formatRhythmName || "").toLowerCase();
  const cats = (sim.categories || []).map((c) => c.toLowerCase());
  const hasInMeta = (kw: string) => rhythm.includes(kw) || cats.some((c) => c.includes(kw));

  switch (catKey) {
    case "tu-quy": return /(.)\1{3}/.test(rawNum) || hasInMeta("tứ quý") || hasInMeta("ngũ quý") || hasInMeta("lục quý");
    case "tam-hoa": return /(.)\1{2}/.test(rawNum) || hasInMeta("tam hoa");
    case "loc-phat": return /68|86/.test(rawNum) || hasInMeta("lộc phát");
    case "than-tai": return /39|79/.test(rawNum) || hasInMeta("thần tài");
    case "ong-dia": return /38|78/.test(rawNum) || hasInMeta("ông địa");
    case "so-tien": {
      const isSequential = /(?:0123|1234|2345|3456|4567|5678|6789|123|234|345|456|567|678|789)/.test(rawNum);
      return isSequential || hasInMeta("tiến") || hasInMeta("sảnh");
    }
    case "taxi": return /(\d{2})\1$/.test(rawNum) || /(\d{3})\1$/.test(rawNum) || hasInMeta("taxi") || hasInMeta("cặp");
    case "nam-sinh": return /(?:19[6-9]\d|20[0-2]\d)$/.test(rawNum) || hasInMeta("năm sinh");
    case "phong-thuy": return hasInMeta("phong thủy") || hasInMeta("đại cát") || /(?:68|86|39|79|88|99)$/.test(rawNum);
    default: return true;
  }
}

function sortAuctions(list: AuctionDto[], sortKey: string): AuctionDto[] {
  const arr = [...list];
  switch (sortKey) {
    case "price-asc": return arr.sort((a, b) => (a.currentPrice ?? a.startingPrice) - (b.currentPrice ?? b.startingPrice));
    case "price-desc": return arr.sort((a, b) => (b.currentPrice ?? b.startingPrice) - (a.currentPrice ?? a.startingPrice));
    case "ending-soon": return arr.sort((a, b) => new Date(a.endAt).getTime() - new Date(b.endAt).getTime());
    case "bids-desc": return arr.sort((a, b) => (b.totalBids || 0) - (a.totalBids || 0));
    default: return arr;
  }
}

/* ─── Custom Dropdown Component ──────────────────────────── */
function FilterDropdown<T extends { key: string }>({
  label,
  icon,
  options,
  value,
  onChange,
  isOpen,
  onToggle,
  renderOption,
  accentColor = "#E4011E",
  width = 240,
}: {
  label: string;
  icon: React.ReactNode;
  options: T[];
  value: string;
  onChange: (key: string) => void;
  isOpen: boolean;
  onToggle: () => void;
  renderOption: (item: T, isSelected: boolean) => React.ReactNode;
  accentColor?: string;
  width?: number;
}) {
  const isActive = value !== "all" && value !== "default";

  return (
    <div className="relative">
      <button
        type="button"
        onClick={onToggle}
        className={`h-9 px-3 rounded-lg text-[13px] font-semibold cursor-pointer inline-flex items-center gap-2 transition-all duration-150 whitespace-nowrap border ${
          isActive
            ? "bg-[#001743] text-white border-[#001743] shadow-sm"
            : "bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
        }`}
      >
        <span className={`flex items-center ${isActive ? "text-white" : "text-slate-400"}`}>{icon}</span>
        <span>{label}</span>
        <ChevronDown size={14} className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""} ${isActive ? "text-white/70" : "text-slate-400"}`} />
      </button>

      {isOpen && (
        <div
          className="absolute top-[calc(100%+6px)] left-0 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-1.5 animate-in fade-in slide-in-from-top-2 duration-150"
          style={{ width }}
        >
          {options.map((item) => {
            const isSelected = value === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => onChange(item.key)}
                className={`w-full flex items-center justify-between px-3 py-2 text-left transition-colors duration-100 cursor-pointer ${
                  isSelected ? "bg-slate-50" : "hover:bg-slate-50"
                }`}
              >
                {renderOption(item, isSelected)}
                {isSelected && (
                  <Check size={15} className="text-[#E4011E] shrink-0 ml-2" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN PAGE COMPONENT
   ═══════════════════════════════════════════════════════════ */
export default function AuctionsPage() {
  /* ─── State ──────────────────────────────────────────────── */
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

  const [pageIndex, setPageIndex] = useState(1);
  const pageSize = 12;

  const [auctions, setAuctions] = useState<AuctionDto[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [heroAuctions, setHeroAuctions] = useState<AuctionDto[]>([]);
  const [heroIndex, setHeroIndex] = useState(0);
  const [heroCountdown, setHeroCountdown] = useState("00:00:00");

  const [counts, setCounts] = useState({ all: 0, live: 0, upcoming: 0, ended: 0 });

  /* ─── Debounce ───────────────────────────────────────────── */
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedKeyword(searchInput);
      setPageIndex(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  /* ─── Hero Spotlight ─────────────────────────────────────── */
  useEffect(() => {
    let isMounted = true;
    async function loadHeroAuctions() {
      try {
        const res = await auctionService.getAuctions({ status: "ACTIVE", pageSize: 5, pageIndex: 1 });
        if (isMounted && res.items && res.items.length > 0) {
          const sorted = [...res.items].sort((a, b) => b.currentPrice - a.currentPrice);
          setHeroAuctions(sorted);
        }
      } catch (err) {
        console.error("Lỗi khi tải phiên tiêu biểu:", err);
      }
    }
    loadHeroAuctions();
    return () => { isMounted = false; };
  }, []);

  /* ─── SignalR Listing Feed ───────────────────────────────── */
  useEffect(() => {
    let isMounted = true;
    const setupListingFeed = async () => {
      try {
        await auctionHubService.joinListingFeed();
        if (!isMounted) return;
        auctionHubService.onNewAuctionCreated((newAuction) => {
          if (!isMounted) return;
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

  /* ─── Tab Counts ─────────────────────────────────────────── */
  const fetchCounts = useCallback(async () => {
    try {
      const [liveRes, upRes, endRes] = await Promise.allSettled([
        auctionService.getAuctions({ status: "ACTIVE", pageSize: 1, pageIndex: 1 }),
        auctionService.getAuctions({ status: "SCHEDULE", pageSize: 1, pageIndex: 1 }),
        auctionService.getAuctions({ status: "END", pageSize: 1, pageIndex: 1 }),
      ]);
      const live = liveRes.status === "fulfilled" ? liveRes.value.totalCount : 0;
      const upcoming = upRes.status === "fulfilled" ? upRes.value.totalCount : 0;
      const ended = endRes.status === "fulfilled" ? endRes.value.totalCount : 0;

      setCounts({
        all: live + upcoming + ended,
        live,
        upcoming,
        ended,
      });
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { fetchCounts(); }, [fetchCounts]);

  /* ─── Main Data Fetch ────────────────────────────────────── */
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

      // Lọc bỏ tuyệt đối các phiên trạng thái Nháp (DRAFT) trên sàn công khai của khách
      const publicItems = (res.items || []).filter(
        (a) => a.auctionStatus !== "DRAFT" && String(a.auctionStatus) !== "0"
      );

      setAuctions(publicItems);
      setTotalCount(statusTab === "all" ? publicItems.length : res.totalCount || 0);
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

  useEffect(() => { loadAuctions(); }, [loadAuctions]);

  /* ─── Click Outside ──────────────────────────────────────── */
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (filterToolbarRef.current && !filterToolbarRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /* ─── Client-side Filtering & Sorting ────────────────────── */
  const displayAuctions = useMemo(() => {
    let list = auctions;
    if (carrierFilter !== "all") {
      list = list.filter((a) => formatCarrier(a.carrierName).toLowerCase() === carrierFilter.toLowerCase());
    }
    if (priceFilter !== "all") {
      list = list.filter((a) => matchPrice(a, priceFilter));
    }
    if (categoryFilter !== "all") {
      list = list.filter((a) => matchCategory(a, categoryFilter));
    }
    return sortAuctions(list, sortBy);
  }, [auctions, carrierFilter, priceFilter, categoryFilter, sortBy]);

  /* ─── Derived State ──────────────────────────────────────── */
  const activeFilterCount = [
    carrierFilter !== "all",
    categoryFilter !== "all",
    priceFilter !== "all",
    sortBy !== "default",
    typeFilter !== "all",
  ].filter(Boolean).length;

  const hasActiveFilters = Boolean(
    searchInput.trim() || debouncedKeyword.trim() || activeFilterCount > 0 || statusTab !== "live"
  );

  const selectedCarrier = CARRIER_OPTIONS.find((c) => c.key === carrierFilter) || CARRIER_OPTIONS[0];
  const selectedCategory = CATEGORY_OPTIONS.find((c) => c.key === categoryFilter) || CATEGORY_OPTIONS[0];
  const selectedPrice = PRICE_OPTIONS.find((p) => p.key === priceFilter) || PRICE_OPTIONS[0];
  const selectedSort = SORT_OPTIONS.find((s) => s.key === sortBy) || SORT_OPTIONS[0];

  /* ─── Hero Countdown ─────────────────────────────────────── */
  const currentHero = heroAuctions[heroIndex];
  useEffect(() => {
    if (!currentHero?.endAt) return;
    const end = new Date(currentHero.endAt).getTime();
    const updateTimer = () => {
      const diff = end - Date.now();
      if (diff <= 0) { setHeroCountdown("00:00:00"); return; }
      const h = Math.floor(diff / 3_600_000).toString().padStart(2, "0");
      const m = Math.floor((diff % 3_600_000) / 60_000).toString().padStart(2, "0");
      const s = Math.floor((diff % 60_000) / 1_000).toString().padStart(2, "0");
      setHeroCountdown(`${h}:${m}:${s}`);
    };
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [currentHero]);

  /* ─── Reset Filters ──────────────────────────────────────── */
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

  const formatPrice = (n: number) => n.toLocaleString("vi-VN");

  /* ═══════════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════════ */
  return (
    <div className="min-h-screen bg-[#F1F5F9] flex flex-col">
      <Navbar />

      <div className="flex-1 pt-16">
        {/* ═══ 1. HERO SPOTLIGHT ═══════════════════════════════ */}
        {currentHero ? (
          <section className="relative overflow-hidden" style={{ background: "linear-gradient(160deg, #0A1628 0%, #001743 40%, #0D2847 100%)" }}>
            {/* Decorative Elements */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute -right-20 -top-20 w-[500px] h-[500px] rounded-full opacity-[0.07]" style={{ background: "radial-gradient(circle, #E4011E, transparent 70%)" }} />
              <div className="absolute left-1/4 bottom-0 w-[600px] h-[300px] opacity-[0.04]" style={{ background: "radial-gradient(ellipse, #3B82F6, transparent 70%)" }} />
              {/* Grid pattern */}
              <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] [background-size:48px_48px]" />
            </div>

            <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-10 sm:py-14 relative z-10">
              <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_0.7fr] gap-8 items-center">
                {/* Left: SIM Info */}
                <div className="space-y-5">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider text-rose-300 bg-rose-500/15 border border-rose-500/25">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
                      Tâm Điểm Đấu Giá
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold text-white/70 bg-white/8 border border-white/10">
                      <Tag size={11} />
                      {currentHero.auctionCode}
                    </span>
                    <span className="text-[12px] text-white/50 flex items-center gap-1.5">
                      <Users size={12} />
                      {currentHero.totalParticipants || 1} người tham gia
                    </span>
                  </div>

                  {/* SIM Number Display */}
                  <h1 className="text-[clamp(2rem,4vw,3.2rem)] font-black text-white tracking-wide leading-tight font-mono">
                    {currentHero.simPhoneNumber.replace(/(\d{4})(\d{3})(\d{3})/, "$1 $2 $3")}
                  </h1>

                  <div className="flex items-center gap-3 flex-wrap text-[13px] text-white/70">
                    <span>{currentHero.formatRhythmName || "SIM Số Đẹp"}</span>
                    <span className="text-white/25">·</span>
                    <span>Nhà mạng: <strong className="text-amber-300">{formatCarrier(currentHero.carrierName)}</strong></span>
                    <span className="text-white/25">·</span>
                    <span className="flex items-center gap-1">
                      {currentHero.auctionType === "DUTCH" ? <TrendingDown size={13} className="text-blue-400" /> : <TrendingUp size={13} className="text-emerald-400" />}
                      <strong className="text-blue-300">
                        {currentHero.auctionType === "DUTCH" ? "Đấu giá Hà Lan" : "Đấu giá Kiểu Anh"}
                      </strong>
                    </span>
                  </div>

                  {/* Price & Countdown Bar */}
                  <div className="flex flex-wrap gap-4 items-stretch">
                    <div className="bg-white/[0.06] backdrop-blur-sm border border-white/10 rounded-xl px-5 py-3 min-w-[180px]">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-white/40 mb-1">Thời gian còn lại</div>
                      <div className="text-2xl font-black text-amber-300 font-mono tabular-nums tracking-wider">
                        {heroCountdown}
                      </div>
                    </div>
                    <div className="bg-white/[0.06] backdrop-blur-sm border border-white/10 rounded-xl px-5 py-3 min-w-[180px]">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-white/40 mb-1">Giá hiện tại</div>
                      <div className="text-2xl font-black text-white font-mono tabular-nums">
                        {formatPrice(currentHero.currentPrice)} <span className="text-sm font-bold text-white/60">₫</span>
                      </div>
                    </div>
                  </div>

                  {/* CTA + Navigation */}
                  <div className="flex items-center gap-3 pt-1">
                    <Link
                      href={`/auctions/${currentHero.id}`}
                      className="inline-flex items-center gap-2.5 px-6 py-3 bg-[#E4011E] hover:bg-[#C00119] text-white text-sm font-bold rounded-xl shadow-lg shadow-rose-500/25 transition-all duration-200 active:scale-[0.98]"
                    >
                      <Gavel size={16} />
                      Vào Phòng Trả Giá
                    </Link>

                    {heroAuctions.length > 1 && (
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => setHeroIndex((prev) => (prev === 0 ? heroAuctions.length - 1 : prev - 1))}
                          className="w-9 h-9 rounded-lg bg-white/8 hover:bg-white/15 border border-white/10 text-white flex items-center justify-center cursor-pointer transition-colors"
                        >
                          <ChevronLeft size={16} />
                        </button>
                        <button
                          onClick={() => setHeroIndex((prev) => (prev === heroAuctions.length - 1 ? 0 : prev + 1))}
                          className="w-9 h-9 rounded-lg bg-white/8 hover:bg-white/15 border border-white/10 text-white flex items-center justify-center cursor-pointer transition-colors"
                        >
                          <ChevronRight size={16} />
                        </button>
                        <div className="flex items-center gap-1 ml-2">
                          {heroAuctions.map((_, i) => (
                            <button
                              key={i}
                              onClick={() => setHeroIndex(i)}
                              className={`w-1.5 h-1.5 rounded-full transition-all duration-200 cursor-pointer ${i === heroIndex ? "bg-white w-4" : "bg-white/30 hover:bg-white/50"}`}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Room Metadata */}
                <div className="bg-white/[0.05] backdrop-blur-md border border-white/10 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-white/10">
                    <span className="text-[13px] font-bold text-white flex items-center gap-2">
                      <Shield size={14} className="text-blue-400" />
                      Quy chế phòng đấu giá
                    </span>
                    <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Đang mở
                    </span>
                  </div>

                  <div className="space-y-3">
                    {[
                      { label: "Mã phiên", value: currentHero.auctionCode, mono: true },
                      { label: "Giá khởi điểm", value: `${formatPrice(currentHero.startingPrice)} ₫` },
                      { label: "Tổng lượt trả giá", value: `${currentHero.totalBids || 0} lượt`, highlight: true },
                      { label: "Người mở phiên", value: currentHero.authorName || "Hệ thống TrustSim" },
                    ].map((row, i) => (
                      <div key={i} className="flex justify-between items-center text-[13px]">
                        <span className="text-white/60">{row.label}</span>
                        <span className={`font-semibold ${row.mono ? "font-mono" : ""} ${row.highlight ? "text-amber-300" : "text-white"}`}>
                          {row.value}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-3 border-t border-white/10 flex items-start gap-2 text-[11px] text-white/40">
                    <Shield size={13} className="shrink-0 mt-0.5 text-white/30" />
                    <span>Tiền đặt cọc được hoàn lại 100% nếu không trúng đấu giá theo quy định của sàn.</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        ) : (
          /* Fallback Banner */
          <section style={{ background: "linear-gradient(160deg, #0A1628 0%, #001743 40%, #0D2847 100%)" }}>
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] [background-size:48px_48px]" />
            </div>
            <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-10 sm:py-14 relative z-10">
              <span className="inline-block px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider text-rose-300 bg-rose-500/15 border border-rose-500/25 mb-4">
                Sàn Đấu Giá Số Đẹp Minh Bạch
              </span>
              <h1 className="text-[clamp(1.6rem,3vw,2.4rem)] font-black text-white mb-3 leading-tight">
                Sàn Đấu Giá SIM Số Đẹp Quốc Gia
              </h1>
              <p className="text-[14px] text-white/60 max-w-xl leading-relaxed">
                Hệ thống đấu giá SIM số minh bạch theo tiêu chuẩn quốc tế. Tìm kiếm phiên đấu giá nhanh theo mã định danh hoặc thuê bao quan tâm.
              </p>
            </div>
          </section>
        )}

        {/* ═══ 2. FILTER & SEARCH TOOLBAR ═════════════════════ */}
        <section className="bg-white border-b border-slate-200 sticky top-16 z-30 shadow-sm">
          <div ref={filterToolbarRef} className="max-w-[1280px] mx-auto px-4 sm:px-6 py-3">
            <div className="flex flex-col gap-3">

              {/* Row 1: Search + Filter Dropdowns */}
              <div className="flex gap-2.5 items-center flex-wrap">
                {/* Search Input */}
                <div className="flex-1 min-w-[240px] max-w-[400px] relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder="Tìm theo mã phiên (AUC-...) hoặc số SIM..."
                    className="w-full h-9 pl-9 pr-9 rounded-lg border border-slate-200 text-[13px] text-slate-800 bg-white outline-none transition-all duration-150 focus:border-[#001743] focus:ring-2 focus:ring-[#001743]/10 placeholder:text-slate-400"
                  />
                  {searchInput && (
                    <button
                      onClick={() => setSearchInput("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                {/* Carrier Dropdown */}
                <FilterDropdown
                  label={carrierFilter === "all" ? "Nhà mạng" : selectedCarrier.name}
                  icon={<span className="w-3 h-3 rounded-full shrink-0" style={{ background: selectedCarrier.color }} />}
                  options={CARRIER_OPTIONS}
                  value={carrierFilter}
                  onChange={(key) => { setCarrierFilter(key); setOpenDropdown(null); }}
                  isOpen={openDropdown === "carrier"}
                  onToggle={() => setOpenDropdown(openDropdown === "carrier" ? null : "carrier")}
                  width={220}
                  renderOption={(item, isSelected) => (
                    <div className="flex items-center gap-2.5">
                      <span className="w-3 h-3 rounded-full shrink-0" style={{ background: item.color }} />
                      <span className={`text-[13px] ${isSelected ? "font-bold text-[#001743]" : "text-slate-700"}`}>
                        {item.name}
                      </span>
                    </div>
                  )}
                />

                {/* Category Dropdown */}
                <FilterDropdown
                  label={categoryFilter === "all" ? "Danh mục" : selectedCategory.label}
                  icon={<SlidersHorizontal size={14} />}
                  options={CATEGORY_OPTIONS}
                  value={categoryFilter}
                  onChange={(key) => { setCategoryFilter(key); setOpenDropdown(null); }}
                  isOpen={openDropdown === "category"}
                  onToggle={() => setOpenDropdown(openDropdown === "category" ? null : "category")}
                  width={260}
                  renderOption={(item, isSelected) => (
                    <div>
                      <div className={`text-[13px] ${isSelected ? "font-bold text-[#001743]" : "text-slate-700"}`}>
                        {item.label}
                      </div>
                      {item.tag && <div className="text-[11px] text-slate-400 mt-0.5">{item.tag}</div>}
                    </div>
                  )}
                />

                {/* Price Dropdown */}
                <FilterDropdown
                  label={priceFilter === "all" ? "Khoảng giá" : selectedPrice.label}
                  icon={<span className="text-[13px] font-bold">₫</span>}
                  options={PRICE_OPTIONS}
                  value={priceFilter}
                  onChange={(key) => { setPriceFilter(key); setOpenDropdown(null); }}
                  isOpen={openDropdown === "price"}
                  onToggle={() => setOpenDropdown(openDropdown === "price" ? null : "price")}
                  width={240}
                  renderOption={(item, isSelected) => (
                    <div>
                      <div className={`text-[13px] ${isSelected ? "font-bold text-[#001743]" : "text-slate-700"}`}>
                        {item.label}
                      </div>
                      {item.desc && <div className="text-[11px] text-slate-400 mt-0.5">{item.desc}</div>}
                    </div>
                  )}
                />

                {/* Sort Dropdown */}
                <FilterDropdown
                  label={sortBy === "default" ? "Sắp xếp" : selectedSort.label}
                  icon={<ArrowUpDown size={14} />}
                  options={SORT_OPTIONS}
                  value={sortBy}
                  onChange={(key) => { setSortBy(key); setOpenDropdown(null); }}
                  isOpen={openDropdown === "sort"}
                  onToggle={() => setOpenDropdown(openDropdown === "sort" ? null : "sort")}
                  width={250}
                  renderOption={(item, isSelected) => (
                    <span className={`text-[13px] ${isSelected ? "font-bold text-[#001743]" : "text-slate-700"}`}>
                      {item.label}
                    </span>
                  )}
                />

                {/* Clear Filters */}
                {activeFilterCount > 0 && (
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-[12px] font-bold text-rose-600 bg-rose-50 border border-rose-200 hover:bg-rose-100 cursor-pointer transition-colors"
                  >
                    <RotateCcw size={13} />
                    Xóa lọc ({activeFilterCount})
                  </button>
                )}
              </div>

              {/* Row 2: Status Tabs + Auction Type */}
              <div className="flex justify-between items-center flex-wrap gap-3 border-t border-slate-100 pt-2.5">
                {/* Status Tabs */}
                <div className="flex gap-1">
                  {[
                    { key: "live" as StatusTab, label: "Đang Diễn Ra", count: counts.live, color: "#E4011E", dot: true },
                    { key: "upcoming" as StatusTab, label: "Sắp Bắt Đầu", count: counts.upcoming, color: "#D97706" },
                    { key: "ended" as StatusTab, label: "Đã Kết Thúc", count: counts.ended, color: "#64748B" },
                    { key: "all" as StatusTab, label: "Tất Cả", count: counts.all, color: "#001743" },
                  ].map((tab) => {
                    const isActive = statusTab === tab.key;
                    return (
                      <button
                        key={tab.key}
                        onClick={() => { setStatusTab(tab.key); setPageIndex(1); }}
                        className={`relative px-3.5 py-2 text-[13px] font-semibold cursor-pointer transition-all duration-200 rounded-lg flex items-center gap-1.5 ${
                          isActive
                            ? "text-[#001743] bg-slate-100"
                            : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        {tab.dot && (
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" style={{ boxShadow: isActive ? "0 0 6px #E4011E" : "none", animation: isActive ? "pulse 2s infinite" : "none" }} />
                        )}
                        <span>{tab.label}</span>
                        <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-md tabular-nums ${
                          isActive ? "bg-white text-slate-700 shadow-sm" : "bg-slate-100 text-slate-400"
                        }`}>
                          {tab.count}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Auction Type Toggle */}
                <div className="flex items-center gap-1.5 bg-slate-100 p-0.5 rounded-lg">
                  {[
                    { key: "all" as TypeFilter, label: "Tất cả" },
                    { key: "english" as TypeFilter, label: "Kiểu Anh ↑" },
                    { key: "dutch" as TypeFilter, label: "Kiểu Hà Lan ↓" },
                  ].map((m) => (
                    <button
                      key={m.key}
                      onClick={() => { setTypeFilter(m.key); setPageIndex(1); }}
                      className={`px-3 py-1.5 rounded-md text-[12px] font-semibold cursor-pointer transition-all duration-150 ${
                        typeFilter === m.key
                          ? "bg-white text-[#001743] shadow-sm"
                          : "text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══ 3. RESULTS HEADER ══════════════════════════════ */}
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 pt-5">
          <div className="flex justify-between items-center flex-wrap gap-2">
            <div className="text-[13px] text-slate-600">
              {debouncedKeyword ? (
                <span>
                  Kết quả cho: <strong className="text-[#E4011E] font-mono">"{debouncedKeyword}"</strong>{" "}
                  ({totalCount} phiên)
                </span>
              ) : (
                <span>
                  Hiển thị <strong className="text-[#001743]">{displayAuctions.length}</strong> / <strong className="text-[#001743]">{totalCount}</strong> phiên đấu giá
                </span>
              )}
            </div>
            {loading && (
              <span className="text-[12px] text-slate-400 flex items-center gap-1.5">
                <RotateCcw size={12} className="animate-spin" />
                Đang đồng bộ...
              </span>
            )}
          </div>
        </div>

        {/* ═══ 4. AUCTION GRID ════════════════════════════════ */}
        <main className="max-w-[1280px] mx-auto px-4 sm:px-6 pt-4 pb-16">
          {error && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 mb-6 flex items-center justify-between">
              <div className="text-[13px] text-rose-800">
                <strong>Lỗi kết nối:</strong> {error}
              </div>
              <button
                onClick={loadAuctions}
                className="px-4 py-1.5 rounded-lg bg-rose-600 text-white text-[12px] font-bold cursor-pointer hover:bg-rose-700 transition-colors"
              >
                Thử lại
              </button>
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                <div key={n} className="bg-white border border-slate-200 rounded-xl p-5 min-h-[200px] animate-pulse">
                  <div className="flex justify-between mb-4">
                    <div className="w-16 h-6 bg-slate-200 rounded-md" />
                    <div className="w-20 h-6 bg-slate-200 rounded-md" />
                  </div>
                  <div className="w-40 h-8 bg-slate-200 rounded-md mb-3" />
                  <div className="w-24 h-4 bg-slate-100 rounded-md mb-6" />
                  <div className="border-t border-slate-100 pt-4 flex justify-between">
                    <div>
                      <div className="w-16 h-3 bg-slate-100 rounded-md mb-2" />
                      <div className="w-28 h-6 bg-slate-200 rounded-md" />
                    </div>
                    <div className="w-24 h-8 bg-slate-200 rounded-md" />
                  </div>
                </div>
              ))}
            </div>
          ) : displayAuctions.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-16 text-center max-w-lg mx-auto">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-5 text-slate-400">
                <Search size={28} />
              </div>
              <h3 className="text-lg font-bold text-[#001743] mb-2">
                {debouncedKeyword
                  ? `Không tìm thấy phiên đấu giá nào cho "${debouncedKeyword}"`
                  : "Không có phiên đấu giá nào"}
              </h3>
              <p className="text-[13px] text-slate-500 mb-6 leading-relaxed max-w-sm mx-auto">
                {debouncedKeyword
                  ? "Kiểm tra lại mã phiên (VD: AUC-20260901-001) hoặc số thuê bao SIM."
                  : "Hiện chưa có phiên đấu giá phù hợp với bộ lọc đã chọn."}
              </p>
              <button
                onClick={handleResetFilters}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#001743] hover:bg-[#00266B] text-white text-[13px] font-bold rounded-xl cursor-pointer transition-colors"
              >
                <RotateCcw size={14} />
                Xem tất cả phiên đấu giá
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {displayAuctions.map((item) => (
                <SimAuctionCard key={item.id} data={toCardData(item)} />
              ))}
            </div>
          )}

          {/* ═══ 5. PAGINATION ═══════════════════════════════ */}
          {!loading && totalPages > 1 && (
            <div className="mt-10 flex justify-center items-center gap-2">
              <button
                onClick={() => setPageIndex((p) => Math.max(1, p - 1))}
                disabled={pageIndex <= 1}
                className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[13px] font-semibold transition-colors cursor-pointer border ${
                  pageIndex <= 1
                    ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                    : "bg-white text-[#001743] border-slate-200 hover:bg-slate-50 shadow-sm"
                }`}
              >
                <ChevronLeft size={15} />
                Trước
              </button>

              <div className="flex gap-1">
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 7) {
                    pageNum = i + 1;
                  } else if (pageIndex <= 4) {
                    pageNum = i + 1;
                  } else if (pageIndex >= totalPages - 3) {
                    pageNum = totalPages - 6 + i;
                  } else {
                    pageNum = pageIndex - 3 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPageIndex(pageNum)}
                      className={`w-9 h-9 rounded-lg text-[13px] font-bold transition-all cursor-pointer ${
                        pageIndex === pageNum
                          ? "bg-[#001743] text-white shadow-sm"
                          : "text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setPageIndex((p) => Math.min(totalPages, p + 1))}
                disabled={pageIndex >= totalPages}
                className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[13px] font-semibold transition-colors cursor-pointer border ${
                  pageIndex >= totalPages
                    ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                    : "bg-white text-[#001743] border-slate-200 hover:bg-slate-50 shadow-sm"
                }`}
              >
                Sau
                <ChevronRight size={15} />
              </button>
            </div>
          )}
        </main>
      </div>

      <Footer />
    </div>
  );
}
