"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import SimAuctionCard, { SimAuctionCardData } from "@/components/ui/SimAuctionCard";
import { AuctionGuideModal } from "@/components/auction/AuctionGuide";
import { auctionService, AuctionDto } from "@/services/auctionService";
import { auctionHubService } from "@/services/auctionHubService";
import { getCarriers } from "@/services/carrierService";
import { getCategories } from "@/services/categoryService";
import { AuctionSortBy, SortOrder } from "@/types/common";
import {
  Search,
  X,
  Gavel,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  ArrowUpDown,
  RotateCcw,
  ChevronDown,
  Check,
  Shield,
  TrendingUp,
  TrendingDown,
  Users,
  Sparkles,
  HelpCircle,
  Clock,
  Layers,
} from "lucide-react";

/* ─── Types ──────────────────────────────────────────────── */
type StatusTab = "all" | "live" | "upcoming" | "ended";
type TypeFilter = "all" | "english" | "dutch";

/* ─── Helpers ────────────────────────────────────────────── */
function formatCarrier(rawCarrier?: string): string {
  if (!rawCarrier) return "Viettel";
  const lower = rawCarrier.toLowerCase();
  if (lower.includes("viettel")) return "Viettel";
  if (lower.includes("mobi")) return "MobiFone";
  if (lower.includes("vina")) return "VinaPhone";
  if (lower.includes("vietnamobile") || lower.includes("vnm")) return "Vietnamobile";
  return rawCarrier;
}

function mapAuctionStatus(status: any, startAt?: string, endAt?: string): "live" | "upcoming" | "ended" {
  const s = String(status).toUpperCase();
  const now = Date.now();
  const start = startAt ? new Date(startAt).getTime() : 0;
  const end = endAt ? new Date(endAt).getTime() : 0;
  if (start > 0 && end > 0 && now >= start && now < end && s !== "END" && s !== "ENDED" && s !== "CANCELLED") return "live";
  if (start > 0 && now < start && s !== "END" && s !== "ENDED" && s !== "CANCELLED") return "upcoming";
  if (end > 0 && now >= end) return "ended";
  if (s === "ACTIVE" || s === "2") return "live";
  if (s === "SCHEDULE" || s === "UPCOMING" || s === "0" || s === "1") return "upcoming";
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
    status: mapAuctionStatus(item.auctionStatus, item.startAt, item.endAt),
    currentPrice: item.currentPrice ?? item.startingPrice,
    startPrice: item.startingPrice,
    bidCount: item.totalBids ?? 0,
    endTime: item.endAt,
    minBidStep: item.minBidStep,
    maxStepMultiplier: item.maxStepMultiplier,
    extensionDurationSeconds: item.extensionDurationSeconds,
    dutchDecreaseAmount: item.dutchDecreaseAmount,
    dutchDecreaseIntervalSeconds: item.dutchDecreaseIntervalSeconds,
    reservePrice: item.reservePrice,
    category: item.formatRhythmName || `Mã: ${item.auctionCode}`,
    seller: item.authorName || "TrustSim Đấu Giá",
  };
}

/* ─── Filter Definitions ─────────────────────────────────── */
interface CarrierOption {
  key: string;
  name: string;
  code: string;
  color: string;
}

const DEFAULT_CARRIER_OPTIONS: CarrierOption[] = [
  { key: "all", name: "Tất cả nhà mạng", code: "ALL", color: "#64748B" },
];

interface PriceOption {
  key: string;
  label: string;
  desc?: string;
  min?: number;
  max?: number;
}

const PRICE_OPTIONS: PriceOption[] = [
  { key: "all", label: "Mọi ngân sách" },
  { key: "under-10m", label: "Dưới 10 triệu", desc: "Dưới 10.000.000 ₫", max: 10_000_000 },
  { key: "10m-50m", label: "10 – 50 triệu", desc: "10M đến 50M ₫", min: 10_000_000, max: 50_000_000 },
  { key: "50m-100m", label: "50 – 100 triệu", desc: "50M đến 100M ₫", min: 50_000_000, max: 100_000_000 },
  { key: "above-100m", label: "Trên 100 triệu (VIP)", desc: "Từ 100.000.000 ₫ trở lên", min: 100_000_000 },
];

interface CategoryOption {
  key: string;
  label: string;
  tag?: string;
}

const DEFAULT_CATEGORY_OPTIONS: CategoryOption[] = [
  { key: "all", label: "Tất cả nhịp số" },
];

interface SortOption {
  key: string;
  label: string;
}

const SORT_OPTIONS: SortOption[] = [
  { key: "default", label: "Mới nhất (Mặc định)" },
  { key: "price-asc", label: "Giá tăng dần (Thấp → Cao)" },
  { key: "price-desc", label: "Giá giảm dần (Cao → Thấp)" },
  { key: "ending-soon", label: "Sắp kết thúc trước" },
  { key: "bids-desc", label: "Nhiều lượt trả giá nhất" },
];

/* ─── Custom Professional Dropdown Pill Component ─────────── */
function FilterPopover<T extends { key: string }>({
  label,
  icon,
  options,
  value,
  onChange,
  isOpen,
  onToggle,
  renderOption,
  width = 250,
}: {
  label: string;
  icon: React.ReactNode;
  options: T[];
  value: string;
  onChange: (key: string) => void;
  isOpen: boolean;
  onToggle: () => void;
  renderOption: (item: T, isSelected: boolean) => React.ReactNode;
  width?: number;
}) {
  const isActive = value !== "all" && value !== "default";

  return (
    <div className="relative">
      <button
        type="button"
        onClick={onToggle}
        className={`inline-flex h-[38px] cursor-pointer items-center gap-2 rounded-full px-3.5 text-xs font-semibold whitespace-nowrap transition-all duration-150 border ${
          isActive
            ? "border-[#001743] bg-[#001743] text-white shadow-[0_4px_12px_rgba(0,23,67,0.18)]"
            : "border-[rgba(0,23,67,0.08)] bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50/80 shadow-xs"
        }`}
      >
        <span className={`flex items-center ${isActive ? "text-white" : "text-slate-400"}`}>
          {icon}
        </span>
        <span>{label}</span>
        <ChevronDown
          size={13}
          className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""} ${
            isActive ? "text-white/70" : "text-slate-400"
          }`}
        />
      </button>

      {isOpen && (
        <div
          className="absolute top-[calc(100%+8px)] left-0 z-50 overflow-hidden rounded-[20px] border border-slate-200/90 bg-white/95 p-1.5 shadow-[0_16px_40px_rgba(0,23,67,0.14)] backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150"
          style={{ width }}
        >
          <div className="max-h-[300px] overflow-y-auto space-y-0.5">
            {options.map((item) => {
              const isSelected = value === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => onChange(item.key)}
                  className={`flex w-full cursor-pointer items-center justify-between rounded-xl px-3 py-2 text-left text-xs transition-colors duration-100 ${
                    isSelected
                      ? "bg-[#001743]/[0.06] font-bold text-[#001743]"
                      : "text-slate-700 hover:bg-slate-100/80 font-medium"
                  }`}
                >
                  <div className="min-w-0 flex-1">{renderOption(item, isSelected)}</div>
                  {isSelected && <Check size={14} className="shrink-0 text-[#001743] ml-2" />}
                </button>
              );
            })}
          </div>
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
  const [carrierOptions, setCarrierOptions] = useState<CarrierOption[]>(DEFAULT_CARRIER_OPTIONS);
  const [categoryOptions, setCategoryOptions] = useState<CategoryOption[]>(DEFAULT_CATEGORY_OPTIONS);
  const [openDropdown, setOpenDropdown] = useState<"carrier" | "price" | "category" | "sort" | null>(null);
  const filterToolbarRef = useRef<HTMLDivElement>(null);

  const [pageIndex, setPageIndex] = useState(1);
  const pageSize = 12;

  const [auctions, setAuctions] = useState<AuctionDto[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [guideOpen, setGuideOpen] = useState(false);

  const [heroAuctions, setHeroAuctions] = useState<AuctionDto[]>([]);
  const [heroIndex, setHeroIndex] = useState(0);
  const [heroCountdown, setHeroCountdown] = useState("00:00:00");

  const [counts, setCounts] = useState({ all: 0, live: 0, upcoming: 0, ended: 0 });

  /* ─── Debounce Search ────────────────────────────────────── */
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedKeyword(searchInput);
      setPageIndex(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  /* ─── Load Carriers & Categories ─────────────────────────── */
  useEffect(() => {
    let active = true;
    Promise.all([getCarriers(), getCategories()])
      .then(([carriers, categories]) => {
        if (!active) return;
        setCarrierOptions([
          DEFAULT_CARRIER_OPTIONS[0],
          ...carriers.map((carrier) => ({
            key: carrier.id,
            name: carrier.carrierName,
            code: carrier.carrierCode,
            color: carrier.carrierName.toLowerCase().includes("viettel")
              ? "#E4011E"
              : carrier.carrierName.toLowerCase().includes("mobi")
              ? "#0284C7"
              : carrier.carrierName.toLowerCase().includes("vina")
              ? "#2563EB"
              : "#EA580C",
          })),
        ]);
        setCategoryOptions([
          DEFAULT_CATEGORY_OPTIONS[0],
          ...categories.map((category) => ({
            key: category.id,
            label: category.categoryName,
            tag: category.description,
          })),
        ]);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  /* ─── Hero Spotlight Data ────────────────────────────────── */
  useEffect(() => {
    let isMounted = true;
    async function loadHeroAuctions() {
      try {
        const res = await auctionService.getAuctions({ status: "ACTIVE", pageSize: 5, pageIndex: 1 });
        if (isMounted && res.items && res.items.length > 0) {
          const sorted = [...res.items].sort((a, b) => (b.currentPrice || 0) - (a.currentPrice || 0));
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

  /* ─── Realtime SignalR Listing Feed ──────────────────────── */
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

  /* ─── Fetch Tab Counts ───────────────────────────────────── */
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
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    fetchCounts();
  }, [fetchCounts]);

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

      const selectedPrice = PRICE_OPTIONS.find((option) => option.key === priceFilter);
      const sortConfig =
        sortBy === "price-asc"
          ? { sortBy: AuctionSortBy.CurrentPrice, sortOrder: SortOrder.Asc }
          : sortBy === "price-desc"
          ? { sortBy: AuctionSortBy.CurrentPrice, sortOrder: SortOrder.Desc }
          : sortBy === "ending-soon"
          ? { sortBy: AuctionSortBy.EndAt, sortOrder: SortOrder.Asc }
          : sortBy === "bids-desc"
          ? { sortBy: AuctionSortBy.BidCount, sortOrder: SortOrder.Desc }
          : { sortBy: AuctionSortBy.CreatedDate, sortOrder: SortOrder.Desc };

      const res = await auctionService.getAuctions({
        keyword: debouncedKeyword.trim() || undefined,
        status: statusParam,
        type: typeParam,
        carrierId: carrierFilter !== "all" ? carrierFilter : undefined,
        categoryId: categoryFilter !== "all" ? categoryFilter : undefined,
        minPrice: selectedPrice?.min,
        maxPrice: selectedPrice?.max,
        ...sortConfig,
        pageIndex,
        pageSize,
      });

      // Lọc bỏ tuyệt đối các phiên trạng thái Nháp (DRAFT)
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
  }, [debouncedKeyword, statusTab, typeFilter, carrierFilter, categoryFilter, priceFilter, sortBy, pageIndex, pageSize]);

  useEffect(() => {
    loadAuctions();
  }, [loadAuctions]);

  /* ─── Click Outside To Close Popovers ────────────────────── */
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (filterToolbarRef.current && !filterToolbarRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /* ─── Active Filters Count & Labels ──────────────────────── */
  const activeFilterCount = [
    carrierFilter !== "all",
    categoryFilter !== "all",
    priceFilter !== "all",
    sortBy !== "default",
    typeFilter !== "all",
  ].filter(Boolean).length;

  const selectedCarrier = carrierOptions.find((c) => c.key === carrierFilter) || carrierOptions[0];
  const selectedCategory = categoryOptions.find((c) => c.key === categoryFilter) || categoryOptions[0];
  const selectedPrice = PRICE_OPTIONS.find((p) => p.key === priceFilter) || PRICE_OPTIONS[0];
  const selectedSort = SORT_OPTIONS.find((s) => s.key === sortBy) || SORT_OPTIONS[0];

  /* ─── Hero Countdown Timer ───────────────────────────────── */
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

  /* ─── Reset All Filters ──────────────────────────────────── */
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

  return (
    <div className="min-h-screen bg-[#F7F8FD] text-[#0B1630] font-sans flex flex-col pt-16">
      <Navbar />

      {/* ═══ 1. HERO SPOTLIGHT: SOFT-CLOUD NAVY ═══════════════ */}
      <div className="px-3 sm:px-6 pt-5 pb-3">
        {currentHero ? (
          <section className="relative mx-auto max-w-[1180px] overflow-hidden rounded-[32px] border border-white bg-gradient-to-b from-[#f1f3ff] via-[#e4e9ff] to-[#d3dbff] p-6 sm:p-10 shadow-[0_16px_50px_rgba(0,23,67,0.08)]">
            {/* Soft Ambient Glows */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -top-24 -left-20 h-72 w-72 rounded-full bg-white/70 blur-3xl"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute top-10 -right-20 h-80 w-80 rounded-full bg-[#8c9cff]/35 blur-3xl"
            />

            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-[1.3fr_0.7fr] gap-8 items-center">
              {/* Left SIM Details */}
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(0,23,67,0.08)] bg-white/85 px-3 py-1 text-xs font-bold text-[#001743] shadow-xs">
                    <Sparkles size={13} className="text-[#4C5FD5]" />
                    TÂM ĐIỂM ĐẤU GIÁ
                  </span>
                  <span className="inline-flex items-center rounded-full border border-[rgba(0,23,67,0.08)] bg-white/60 px-2.5 py-1 font-mono text-[11px] font-bold text-slate-600">
                    {currentHero.auctionCode}
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs text-slate-500 font-medium ml-1">
                    <Users size={13} /> {currentHero.totalParticipants || 1} người quan tâm
                  </span>
                </div>

                {/* Big SIM Title */}
                <h1 className="font-mono text-[clamp(2.4rem,4.5vw,3.6rem)] font-bold tracking-tight text-[#001743] tabular-nums leading-none mb-3">
                  {currentHero.simPhoneNumber.replace(/(\d{4})(\d{3})(\d{3})/, "$1 $2 $3")}
                </h1>

                <div className="flex flex-wrap items-center gap-2.5 text-xs text-slate-600 mb-6">
                  <span className="font-semibold text-[#001743]">
                    {currentHero.formatRhythmName || "SIM VIP Phong thủy"}
                  </span>
                  <span className="text-slate-300">•</span>
                  <span>
                    Nhà mạng: <strong className="text-[#001743]">{formatCarrier(currentHero.carrierName)}</strong>
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="inline-flex items-center gap-1 font-semibold text-[#0B2A6B]">
                    {currentHero.auctionType === "DUTCH" ? (
                      <TrendingDown size={14} className="text-blue-600" />
                    ) : (
                      <TrendingUp size={14} className="text-emerald-600" />
                    )}
                    {currentHero.auctionType === "DUTCH" ? "Đấu giá Hà Lan" : "Đấu giá Kiểu Anh"}
                  </span>
                </div>

                {/* Price & Countdown Metric Boxes */}
                <div className="flex flex-wrap gap-3.5 mb-6">
                  <div className="rounded-2xl border border-white/90 bg-white/85 px-5 py-3 shadow-[0_6px_20px_rgba(0,23,67,0.05)] backdrop-blur-sm min-w-[170px]">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">
                      Thời gian còn lại
                    </div>
                    <div className="font-mono text-2xl font-bold text-[#0B2A6B] tabular-nums tracking-wide">
                      {heroCountdown}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/90 bg-white/85 px-5 py-3 shadow-[0_6px_20px_rgba(0,23,67,0.05)] backdrop-blur-sm min-w-[190px]">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">
                      Giá hiện tại
                    </div>
                    <div className="font-mono text-2xl font-bold text-[#001743] tabular-nums">
                      {formatPrice(currentHero.currentPrice)}{" "}
                      <span className="text-sm font-semibold text-slate-500">₫</span>
                    </div>
                  </div>
                </div>

                {/* CTA Action & Hero Switcher */}
                <div className="flex flex-wrap items-center gap-3">
                  <Link
                    href={`/auctions/${currentHero.id}`}
                    className="inline-flex items-center gap-2 rounded-full bg-gradient-to-b from-[#0B2A6B] to-[#001743] px-6 py-3 text-sm font-bold text-white shadow-[0_6px_18px_rgba(0,23,67,0.28)] transition-all duration-150 hover:-translate-y-0.5"
                  >
                    <Gavel size={16} />
                    Vào phòng trả giá ngay
                  </Link>

                  {heroAuctions.length > 1 && (
                    <div className="flex items-center gap-1.5 ml-2">
                      <button
                        onClick={() =>
                          setHeroIndex((prev) => (prev === 0 ? heroAuctions.length - 1 : prev - 1))
                        }
                        className="grid h-9 w-9 cursor-pointer place-items-center rounded-full border border-white/80 bg-white/70 text-slate-700 transition-colors hover:bg-white"
                        aria-label="Phiên trước"
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <button
                        onClick={() =>
                          setHeroIndex((prev) => (prev === heroAuctions.length - 1 ? 0 : prev + 1))
                        }
                        className="grid h-9 w-9 cursor-pointer place-items-center rounded-full border border-white/80 bg-white/70 text-slate-700 transition-colors hover:bg-white"
                        aria-label="Phiên tiếp theo"
                      >
                        <ChevronRight size={16} />
                      </button>
                      <div className="flex items-center gap-1 ml-2">
                        {heroAuctions.map((_, i) => (
                          <button
                            key={i}
                            onClick={() => setHeroIndex(i)}
                            className={`h-1.5 rounded-full cursor-pointer transition-all duration-200 ${
                              i === heroIndex ? "w-5 bg-[#001743]" : "w-1.5 bg-[#001743]/20 hover:bg-[#001743]/40"
                            }`}
                            aria-label={`Chuyển đến phiên ${i + 1}`}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Side Card: Trust & Rules Snapshot */}
              <div className="rounded-[24px] border border-white/90 bg-white/80 p-6 shadow-[0_10px_30px_rgba(0,23,67,0.06)] backdrop-blur-xl space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <span className="flex items-center gap-2 text-xs font-bold text-[#001743]">
                    <Shield size={15} className="text-[#4C5FD5]" />
                    Quy chế bảo vệ giao dịch
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-200">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Đang mở phiên
                  </span>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Mã phiên đấu giá</span>
                    <span className="font-mono font-bold text-[#001743]">{currentHero.auctionCode}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Giá khởi điểm</span>
                    <span className="font-bold text-slate-700">{formatPrice(currentHero.startingPrice)} ₫</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Tổng lượt trả giá</span>
                    <span className="font-bold text-[#0B2A6B]">{currentHero.totalBids || 0} lượt đặt</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Chủ sở hữu SIM</span>
                    <span className="font-medium text-slate-800">{currentHero.authorName || "Đã xác minh chính chủ"}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-start gap-2 text-[11.5px] text-slate-500 leading-relaxed">
                  <Shield size={14} className="shrink-0 mt-0.5 text-[#4C5FD5]" />
                  <span>
                    Tiền đặt cọc và thanh toán được sàn giữ ký quỹ độc lập, hoàn trả 100% nếu không trúng đấu giá.
                  </span>
                </div>
              </div>
            </div>
          </section>
        ) : (
          /* Fallback Compact Header */
          <section className="relative mx-auto max-w-[1180px] overflow-hidden rounded-[32px] border border-white bg-gradient-to-b from-[#f1f3ff] via-[#e4e9ff] to-[#d3dbff] p-8 text-center shadow-[0_16px_50px_rgba(0,23,67,0.06)]">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(0,23,67,0.08)] bg-white/85 px-3 py-1 text-xs font-bold text-[#001743] shadow-xs mb-3">
              <Sparkles size={13} className="text-[#4C5FD5]" /> SÀN ĐẤU GIÁ CHÍNH CHỦ
            </span>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#001743] mb-2">
              Sàn Đấu Giá SIM Số Đẹp Minh Bạch
            </h1>
            <p className="max-w-xl mx-auto text-sm text-slate-600">
              Mọi phiên đấu giá đều được kiểm soát bởi hợp đồng điện tử và bảo đảm ký quỹ 100% minh bạch.
            </p>
          </section>
        )}
      </div>

      {/* ═══ 2. PROFESSIONAL MULTI-CRITERIA FILTER BAR ════════ */}
      <section className="sticky top-16 z-30 px-3 sm:px-6 py-2.5 backdrop-blur-xl bg-[#F7F8FD]/90 border-b border-[rgba(0,23,67,0.06)] transition-all">
        <div ref={filterToolbarRef} className="mx-auto max-w-[1180px] space-y-3">
          {/* Top Row: Pill Search Bar & Dropdown Popovers */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search Input Pill */}
            <div className="relative flex-1 min-w-[260px] max-w-[380px]">
              <Search
                size={16}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Tìm số SIM (VD: 6868, 8888, 09…)"
                className="h-[38px] w-full rounded-full border border-[rgba(0,23,67,0.08)] bg-white pl-9 pr-9 text-xs font-medium text-slate-800 shadow-xs outline-none transition-all placeholder:text-slate-400 focus:border-[#4C5FD5] focus:ring-2 focus:ring-[#4C5FD5]/15"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => setSearchInput("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                  aria-label="Xóa từ khóa"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Carrier Filter Popover */}
            <FilterPopover
              label={carrierFilter === "all" ? "Nhà mạng" : selectedCarrier.name}
              icon={
                <span
                  className="h-2.5 w-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: selectedCarrier.color }}
                />
              }
              options={carrierOptions}
              value={carrierFilter}
              onChange={(key) => {
                setCarrierFilter(key);
                setPageIndex(1);
                setOpenDropdown(null);
              }}
              isOpen={openDropdown === "carrier"}
              onToggle={() => setOpenDropdown(openDropdown === "carrier" ? null : "carrier")}
              width={230}
              renderOption={(item, isSelected) => (
                <div className="flex items-center gap-2.5">
                  <span
                    className="h-2.5 w-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className={isSelected ? "font-bold text-[#001743]" : "text-slate-700"}>
                    {item.name}
                  </span>
                </div>
              )}
            />

            {/* Price Range Filter Popover */}
            <FilterPopover
              label={priceFilter === "all" ? "Khoảng giá" : selectedPrice.label}
              icon={<span className="font-bold text-xs">₫</span>}
              options={PRICE_OPTIONS}
              value={priceFilter}
              onChange={(key) => {
                setPriceFilter(key);
                setPageIndex(1);
                setOpenDropdown(null);
              }}
              isOpen={openDropdown === "price"}
              onToggle={() => setOpenDropdown(openDropdown === "price" ? null : "price")}
              width={250}
              renderOption={(item, isSelected) => (
                <div>
                  <div className={isSelected ? "font-bold text-[#001743]" : "text-slate-700"}>
                    {item.label}
                  </div>
                  {item.desc && <div className="text-[10.5px] text-slate-400 mt-0.5">{item.desc}</div>}
                </div>
              )}
            />

            {/* Category / Format Rhythm Popover */}
            <FilterPopover
              label={categoryFilter === "all" ? "Cấu trúc số" : selectedCategory.label}
              icon={<Layers size={13} />}
              options={categoryOptions}
              value={categoryFilter}
              onChange={(key) => {
                setCategoryFilter(key);
                setPageIndex(1);
                setOpenDropdown(null);
              }}
              isOpen={openDropdown === "category"}
              onToggle={() => setOpenDropdown(openDropdown === "category" ? null : "category")}
              width={260}
              renderOption={(item, isSelected) => (
                <div>
                  <div className={isSelected ? "font-bold text-[#001743]" : "text-slate-700"}>
                    {item.label}
                  </div>
                  {item.tag && <div className="text-[10.5px] text-slate-400 mt-0.5">{item.tag}</div>}
                </div>
              )}
            />

            {/* Sort Popover */}
            <FilterPopover
              label={sortBy === "default" ? "Sắp xếp" : selectedSort.label}
              icon={<ArrowUpDown size={13} />}
              options={SORT_OPTIONS}
              value={sortBy}
              onChange={(key) => {
                setSortBy(key);
                setPageIndex(1);
                setOpenDropdown(null);
              }}
              isOpen={openDropdown === "sort"}
              onToggle={() => setOpenDropdown(openDropdown === "sort" ? null : "sort")}
              width={250}
              renderOption={(item, isSelected) => (
                <span className={isSelected ? "font-bold text-[#001743]" : "text-slate-700"}>
                  {item.label}
                </span>
              )}
            />

            {/* Clear All Filters Action Pill */}
            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex h-[38px] cursor-pointer items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 shadow-xs"
              >
                <RotateCcw size={12} />
                Đặt lại ({activeFilterCount})
              </button>
            )}
          </div>

          {/* Bottom Row: Status Tabs + Auction Type Segmented Switcher */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-200/50">
            {/* Status Segmented Tabs */}
            <div className="flex flex-wrap items-center gap-1">
              {[
                { key: "live" as StatusTab, label: "Đang diễn ra", count: counts.live, dot: true },
                { key: "upcoming" as StatusTab, label: "Sắp bắt đầu", count: counts.upcoming },
                { key: "ended" as StatusTab, label: "Đã kết thúc", count: counts.ended },
                { key: "all" as StatusTab, label: "Tất cả", count: counts.all },
              ].map((tab) => {
                const isActive = statusTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => {
                      setStatusTab(tab.key);
                      setPageIndex(1);
                    }}
                    className={`inline-flex cursor-pointer items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all duration-150 ${
                      isActive
                        ? "bg-[#001743] text-white shadow-xs"
                        : "text-slate-600 hover:bg-slate-200/60"
                    }`}
                  >
                    {tab.dot && (
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          isActive ? "bg-emerald-400 animate-pulse" : "bg-emerald-500"
                        }`}
                      />
                    )}
                    <span>{tab.label}</span>
                    <span
                      className={`rounded-full px-1.5 py-0.2 text-[10.5px] font-bold tabular-nums ${
                        isActive ? "bg-white/20 text-white" : "bg-slate-200/80 text-slate-600"
                      }`}
                    >
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Auction Type Segmented Switcher */}
            <div className="flex items-center gap-1 rounded-full border border-[rgba(0,23,67,0.06)] bg-white/80 p-1 shadow-2xs">
              {[
                { key: "all" as TypeFilter, label: "Mọi hình thức" },
                { key: "english" as TypeFilter, label: "Kiểu Anh ↑" },
                { key: "dutch" as TypeFilter, label: "Kiểu Hà Lan ↓" },
              ].map((m) => (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => {
                    setTypeFilter(m.key);
                    setPageIndex(1);
                  }}
                  className={`cursor-pointer rounded-full px-3 py-1 text-xs font-semibold transition-all duration-150 ${
                    typeFilter === m.key
                      ? "bg-[#001743] text-white shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Active Filter Chips Bar (Visible when any filter is selected) */}
          {(debouncedKeyword ||
            carrierFilter !== "all" ||
            priceFilter !== "all" ||
            categoryFilter !== "all" ||
            sortBy !== "default" ||
            typeFilter !== "all") && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">
                Đang lọc theo:
              </span>

              {debouncedKeyword && (
                <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-[11.5px] font-semibold text-slate-700 shadow-2xs">
                  Từ khóa: <strong className="text-[#001743] font-mono">"{debouncedKeyword}"</strong>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchInput("");
                      setDebouncedKeyword("");
                    }}
                    className="cursor-pointer text-slate-400 hover:text-slate-600 ml-0.5"
                  >
                    <X size={12} />
                  </button>
                </span>
              )}

              {carrierFilter !== "all" && (
                <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-[11.5px] font-semibold text-slate-700 shadow-2xs">
                  Nhà mạng: <strong className="text-[#001743]">{selectedCarrier.name}</strong>
                  <button
                    type="button"
                    onClick={() => setCarrierFilter("all")}
                    className="cursor-pointer text-slate-400 hover:text-slate-600 ml-0.5"
                  >
                    <X size={12} />
                  </button>
                </span>
              )}

              {priceFilter !== "all" && (
                <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-[11.5px] font-semibold text-slate-700 shadow-2xs">
                  Khoảng giá: <strong className="text-[#001743]">{selectedPrice.label}</strong>
                  <button
                    type="button"
                    onClick={() => setPriceFilter("all")}
                    className="cursor-pointer text-slate-400 hover:text-slate-600 ml-0.5"
                  >
                    <X size={12} />
                  </button>
                </span>
              )}

              {categoryFilter !== "all" && (
                <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-[11.5px] font-semibold text-slate-700 shadow-2xs">
                  Cấu trúc: <strong className="text-[#001743]">{selectedCategory.label}</strong>
                  <button
                    type="button"
                    onClick={() => setCategoryFilter("all")}
                    className="cursor-pointer text-slate-400 hover:text-slate-600 ml-0.5"
                  >
                    <X size={12} />
                  </button>
                </span>
              )}

              {typeFilter !== "all" && (
                <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-[11.5px] font-semibold text-slate-700 shadow-2xs">
                  Hình thức:{" "}
                  <strong className="text-[#001743]">
                    {typeFilter === "english" ? "Kiểu Anh" : "Kiểu Hà Lan"}
                  </strong>
                  <button
                    type="button"
                    onClick={() => setTypeFilter("all")}
                    className="cursor-pointer text-slate-400 hover:text-slate-600 ml-0.5"
                  >
                    <X size={12} />
                  </button>
                </span>
              )}

              {sortBy !== "default" && (
                <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-[11.5px] font-semibold text-slate-700 shadow-2xs">
                  Sắp xếp: <strong className="text-[#001743]">{selectedSort.label}</strong>
                  <button
                    type="button"
                    onClick={() => setSortBy("default")}
                    className="cursor-pointer text-slate-400 hover:text-slate-600 ml-0.5"
                  >
                    <X size={12} />
                  </button>
                </span>
              )}

              <button
                type="button"
                onClick={handleResetFilters}
                className="text-[11.5px] font-bold text-slate-500 hover:text-[#001743] cursor-pointer underline ml-1"
              >
                Xóa tất cả
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ═══ 3. RESULTS BAR & GUIDE ACTION ════════════════════ */}
      <div className="mx-auto max-w-[1180px] w-full px-3 sm:px-6 pt-5 pb-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-500">
            {debouncedKeyword ? (
              <span>
                Tìm thấy <strong className="text-[#001743]">{totalCount}</strong> phiên phù hợp với "
                <strong className="font-mono text-[#001743]">{debouncedKeyword}</strong>"
              </span>
            ) : (
              <span>
                Hiển thị <strong className="text-[#001743]">{auctions.length}</strong> /{" "}
                <strong className="text-[#001743]">{totalCount}</strong> phiên đấu giá
              </span>
            )}
            {loading && (
              <span className="ml-2 inline-flex items-center gap-1 text-[#4C5FD5]">
                <RotateCcw size={11} className="animate-spin" />
                Đang làm mới...
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={() => setGuideOpen(true)}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-[rgba(0,23,67,0.08)] bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-xs transition-colors hover:border-[#001743] hover:text-[#001743]"
          >
            <HelpCircle size={13} className="text-[#4C5FD5]" />
            Hướng dẫn tham gia sàn
          </button>
        </div>
      </div>

      {/* ═══ 4. MAIN AUCTION GRID ═════════════════════════════ */}
      <main className="mx-auto max-w-[1180px] w-full px-3 sm:px-6 pt-2 pb-16 flex-1">
        <AuctionGuideModal open={guideOpen} onClose={() => setGuideOpen(false)} initialType="participate" />

        {error && (
          <div className="mb-6 flex items-center justify-between rounded-[20px] border border-rose-200 bg-rose-50/80 p-4 shadow-xs">
            <div className="text-xs text-rose-800">
              <strong>Lỗi tải dữ liệu:</strong> {error}
            </div>
            <button
              onClick={loadAuctions}
              className="rounded-full bg-rose-600 px-4 py-1.5 text-xs font-bold text-white transition-colors hover:bg-rose-700 cursor-pointer"
            >
              Thử lại
            </button>
          </div>
        )}

        {loading ? (
          /* Skeletons */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <div
                key={n}
                className="min-h-[250px] rounded-[24px] border border-[rgba(0,23,67,0.06)] bg-white/90 p-5 shadow-xs animate-pulse flex flex-col justify-between"
              >
                <div className="flex justify-between">
                  <div className="h-5 w-20 rounded-full bg-slate-200" />
                  <div className="h-5 w-16 rounded-full bg-slate-200" />
                </div>
                <div>
                  <div className="h-7 w-44 rounded-lg bg-slate-200 mb-2" />
                  <div className="h-4 w-28 rounded-md bg-slate-100" />
                </div>
                <div className="border-t border-dashed border-slate-100 pt-3 flex justify-between items-end">
                  <div className="space-y-1.5">
                    <div className="h-3 w-16 rounded bg-slate-100" />
                    <div className="h-6 w-32 rounded-lg bg-slate-200" />
                  </div>
                  <div className="h-8 w-20 rounded-full bg-slate-200" />
                </div>
              </div>
            ))}
          </div>
        ) : auctions.length === 0 ? (
          /* Empty State */
          <div className="mx-auto max-w-md rounded-[32px] border border-[rgba(0,23,67,0.08)] bg-white p-12 text-center shadow-[0_10px_35px_rgba(0,23,67,0.05)]">
            <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-[#f1f3ff] text-[#001743]">
              <Search size={28} />
            </div>
            <h3 className="text-base font-bold text-[#001743] mb-1.5">
              {debouncedKeyword
                ? `Không có phiên đấu giá cho "${debouncedKeyword}"`
                : "Không có phiên đấu giá nào phù hợp"}
            </h3>
            <p className="mx-auto max-w-xs text-xs text-slate-500 mb-5 leading-relaxed">
              {debouncedKeyword
                ? "Thử tìm kiếm với số thuê bao khác hoặc xóa bớt tiêu chí lọc."
                : "Hiện tại chưa có phiên nào đáp ứng tất cả bộ lọc bạn chọn."}
            </p>
            <button
              onClick={handleResetFilters}
              className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-gradient-to-b from-[#0B2A6B] to-[#001743] px-5 py-2.5 text-xs font-bold text-white shadow-xs transition-transform hover:-translate-y-0.5"
            >
              <RotateCcw size={13} />
              Xem toàn bộ các phiên
            </button>
          </div>
        ) : (
          /* Cards Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {auctions.map((item) => (
              <SimAuctionCard key={item.id} data={toCardData(item)} />
            ))}
          </div>
        )}

        {/* ═══ 5. PAGINATION: SOFT NAVY PILLS ══════════════════ */}
        {!loading && totalPages > 1 && (
          <div className="mt-12 flex justify-center items-center gap-2">
            <button
              onClick={() => setPageIndex((p) => Math.max(1, p - 1))}
              disabled={pageIndex <= 1}
              className={`inline-flex items-center gap-1 rounded-full px-4 py-2 text-xs font-bold transition-all border ${
                pageIndex <= 1
                  ? "border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed"
                  : "border-slate-200 bg-white text-[#001743] hover:bg-slate-50 shadow-xs cursor-pointer"
              }`}
            >
              <ChevronLeft size={14} />
              Trước
            </button>

            <div className="flex items-center gap-1">
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
                    className={`grid h-8 w-8 place-items-center rounded-full text-xs font-bold transition-all cursor-pointer ${
                      pageIndex === pageNum
                        ? "bg-[#001743] text-white shadow-xs"
                        : "text-slate-600 hover:bg-slate-200/70"
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
              className={`inline-flex items-center gap-1 rounded-full px-4 py-2 text-xs font-bold transition-all border ${
                pageIndex >= totalPages
                  ? "border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed"
                  : "border-slate-200 bg-white text-[#001743] hover:bg-slate-50 shadow-xs cursor-pointer"
              }`}
            >
              Sau
              <ChevronRight size={14} />
            </button>
          </div>
        )}
      </main>

      {/* ═══ 6. FOOTER ═══════════════════════════════════════ */}
      <Footer />
    </div>
  );
}
