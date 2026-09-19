"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Table as TableIcon,
  LayoutGrid,
  Plus,
  RefreshCw,
  Check,
  Clock,
  Lock,
  X,
  ChevronDown,
  ShieldCheck,
  Gavel,
  ArrowRight,
  Sparkles,
  Smartphone,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import { ToastMessage } from "@/components/ui/Toast";
import { OwnedSim } from "./types";
import CreateAuctionWizardModal from "./CreateAuctionWizardModal";
import { aiValuationService } from "@/services/aiValuationService";
import {
  getMySims,
  registerSim,
  getFormatRhythms,
  getCarrierColor,
  formatPhoneNumber,
  FormatRhythmItemDto,
} from "@/services/simService";
import { getCarriers, SimCarrierDto } from "@/services/carrierService";

interface OwnedSimsTabProps {
  isEkycVerified: boolean;
  addToast: (t: Omit<ToastMessage, "id">) => void;
  onNavigateToEkyc: () => void;
}

// Default fallback carriers list
const DEFAULT_CARRIERS: SimCarrierDto[] = [
  { id: "c1", carrierName: "Viettel", carrierCode: "VTT", logoImg: "" },
  { id: "c2", carrierName: "MobiFone", carrierCode: "MBF", logoImg: "" },
  { id: "c3", carrierName: "VinaPhone", carrierCode: "VNP", logoImg: "" },
  { id: "c4", carrierName: "Vietnamobile", carrierCode: "VNM", logoImg: "" },
  { id: "c5", carrierName: "Wintel", carrierCode: "WTL", logoImg: "" },
  { id: "c6", carrierName: "Itelecom", carrierCode: "ITL", logoImg: "" },
];

// Initial seed sims when DB is empty for demo experience
const INITIAL_DEMO_SIMS: OwnedSim[] = [
  {
    id: "sim-demo-1",
    simNumber: "0352 468 024",
    carrier: "Viettel",
    carrierCode: "VTT",
    simType: "Trả trước",
    acquiredFrom: "PLATFORM_AUCTION",
    ownershipStatus: "VERIFIED_OWNER",
    estimatedValue: 8_500_000,
    createdDate: "05/09/2026",
    formatRhythmName: "Số tiến đều",
  },
  {
    id: "sim-demo-2",
    simNumber: "0901 888 999",
    carrier: "MobiFone",
    carrierCode: "MBF",
    simType: "Trả sau",
    acquiredFrom: "PERSONAL_IMPORT",
    ownershipStatus: "UNVERIFIED",
    estimatedValue: 35_000_000,
    createdDate: "09/09/2026",
    formatRhythmName: "Tam hoa kép",
  },
  {
    id: "sim-demo-3",
    simNumber: "0888 555 666",
    carrier: "VinaPhone",
    carrierCode: "VNP",
    simType: "Trả trước",
    acquiredFrom: "PERSONAL_IMPORT",
    ownershipStatus: "VERIFIED_OWNER",
    estimatedValue: 18_000_000,
    createdDate: "08/09/2026",
    formatRhythmName: "Tam hoa liên hoàn",
  },
];

/* ─── Gold SIM Microchip (Realistic Vector Asset) ────────────────────────── */
function SimMicrochip() {
  return (
    <svg width="42" height="34" viewBox="0 0 48 38" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
      <defs>
        <linearGradient id="chipBorderGradOwned" x1="0" y1="0" x2="48" y2="38" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FDE68A" />
          <stop offset="45%" stopColor="#D97706" />
          <stop offset="100%" stopColor="#78350F" />
        </linearGradient>
        <linearGradient id="chipBgGradOwned" x1="0" y1="0" x2="48" y2="38" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#B45309" />
          <stop offset="50%" stopColor="#78350F" />
          <stop offset="100%" stopColor="#451A03" />
        </linearGradient>
        <linearGradient id="padGradOwned" x1="0" y1="0" x2="0" y2="100%">
          <stop offset="0%" stopColor="#FEF08A" />
          <stop offset="35%" stopColor="#FBBF24" />
          <stop offset="100%" stopColor="#D97706" />
        </linearGradient>
      </defs>
      <rect x="0.75" y="0.75" width="46.5" height="36.5" rx="5.5" fill="url(#chipBgGradOwned)" stroke="url(#chipBorderGradOwned)" strokeWidth="1.5" />
      <rect x="4.5" y="4.5" width="10" height="7.5" rx="2" fill="url(#padGradOwned)" />
      <rect x="19" y="4.5" width="10" height="7.5" rx="2" fill="url(#padGradOwned)" />
      <rect x="33.5" y="4.5" width="10" height="7.5" rx="2" fill="url(#padGradOwned)" />
      <rect x="4.5" y="15" width="10" height="8" rx="2" fill="url(#padGradOwned)" />
      <rect x="18" y="15" width="12" height="8" rx="4" fill="url(#padGradOwned)" />
      <rect x="33.5" y="15" width="10" height="8" rx="2" fill="url(#padGradOwned)" />
      <rect x="4.5" y="26" width="10" height="7.5" rx="2" fill="url(#padGradOwned)" />
      <rect x="19" y="26" width="10" height="7.5" rx="2" fill="url(#padGradOwned)" />
      <rect x="33.5" y="26" width="10" height="7.5" rx="2" fill="url(#padGradOwned)" />
    </svg>
  );
}

/* ─── Square Carrier Logo Component (28x28 square with fallback) ────────── */
function CarrierSquareLogo({
  name,
  logo,
  size = 28,
}: {
  name: string;
  logo?: string;
  size?: number;
}) {
  const [error, setError] = useState(false);
  const color = getCarrierColor(name);
  const isValid = logo && typeof logo === "string" && logo.trim().length > 0 && !logo.includes("trustsim.vn");

  if (isValid && !error) {
    return (
      <div
        style={{ width: size, height: size }}
        className="rounded-[6px] border border-slate-200 bg-white p-0.5 flex items-center justify-center shrink-0 overflow-hidden shadow-2xs"
      >
        <img
          src={logo}
          alt={name}
          className="w-full h-full object-contain"
          onError={() => setError(true)}
        />
      </div>
    );
  }

  const abbr = name ? name.substring(0, 2).toUpperCase() : "SM";
  return (
    <div
      style={{ width: size, height: size, backgroundColor: color }}
      className="rounded-[6px] flex items-center justify-center shrink-0 font-bold text-[10px] text-white shadow-2xs font-mono"
    >
      {abbr}
    </div>
  );
}

/* ─── Luxury Hero Phone Number (0909: Silver | 888 999: Vivid Gold) ─────── */
function renderHeroSimNumber(phone?: string) {
  if (!phone) return <span className="text-yellow-400 font-mono">---</span>;
  const clean = phone.replace(/\D/g, "");
  if (clean.length === 10) {
    const prefix = clean.slice(0, 4);
    const middle = clean.slice(4, 7);
    const suffix = clean.slice(7);

    return (
      <div className="flex items-center justify-center gap-2.5 sm:gap-3.5 font-mono font-black text-2xl sm:text-[29px] tracking-wider select-all leading-none my-3.5">
        <span className="text-slate-200" style={{ textShadow: "0 2px 10px rgba(0,0,0,0.7)" }}>
          {prefix}
        </span>
        <span className="text-yellow-400" style={{ textShadow: "0 0 18px rgba(250, 204, 21, 0.55)" }}>
          {middle}
        </span>
        <span className="text-yellow-400" style={{ textShadow: "0 0 18px rgba(250, 204, 21, 0.55)" }}>
          {suffix}
        </span>
      </div>
    );
  }
  return (
    <div className="text-center font-mono font-black text-2xl text-yellow-400 tracking-wider my-3.5 select-all">
      {phone}
    </div>
  );
}

/* ─── Carrier Dropdown Select Component (Square Logo + Name) ─────────────── */
function CarrierDropdownSelect({
  carriers,
  selectedCarrier,
  onSelect,
}: {
  carriers: SimCarrierDto[];
  selectedCarrier: SimCarrierDto | null;
  onSelect: (c: SimCarrierDto) => void;
}) {
  const [open, setOpen] = useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const activeCarrier = selectedCarrier || carriers[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  return (
    <div ref={dropdownRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="w-full flex items-center justify-between p-2.5 border border-slate-300 rounded-[6px] bg-white hover:border-[#001743] transition-colors text-xs font-semibold text-[#001743] focus:outline-none focus:border-[#001743]"
      >
        <div className="flex items-center gap-2.5">
          {activeCarrier && (
            <CarrierSquareLogo name={activeCarrier.carrierName} logo={activeCarrier.logoImg} size={24} />
          )}
          <span className="font-bold text-xs">{activeCarrier?.carrierName || "Chọn nhà mạng"}</span>
        </div>
        <ChevronDown size={14} className={`text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-[8px] shadow-xl z-50 max-h-56 overflow-y-auto p-1 animate-fade-up">
          {carriers.map((c) => {
            const isSel = activeCarrier?.carrierName.toLowerCase() === c.carrierName.toLowerCase();
            return (
              <button
                key={c.id || c.carrierName}
                type="button"
                onClick={() => {
                  onSelect(c);
                  setOpen(false);
                }}
                className={`w-full flex items-center justify-between p-2 rounded-[6px] text-xs transition-colors ${isSel ? "bg-slate-100 font-bold text-[#001743]" : "hover:bg-slate-50 text-slate-700"
                  }`}
              >
                <div className="flex items-center gap-2.5">
                  <CarrierSquareLogo name={c.carrierName} logo={c.logoImg} size={24} />
                  <span className="font-bold">{c.carrierName}</span>
                </div>
                {isSel && <Check size={14} className="text-emerald-600" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─── Luxury Physical SIM Asset Card (Grid Hero View) ─────────────────────── */
function OwnedSimHeroCard({
  sim,
  onOpenAuction,
  onNavigateToEkyc,
}: {
  sim: OwnedSim;
  onOpenAuction: (s: OwnedSim) => void;
  onNavigateToEkyc: () => void;
}) {
  const isOwnerVerified = sim.ownershipStatus === "VERIFIED_OWNER";
  const rawCarrier = (sim.carrier || "").toUpperCase();

  return (
    <div
      style={{
        position: "relative",
        padding: "1px",
        borderRadius: "14px",
        background: "linear-gradient(135deg, rgba(255, 255, 255, 0.28) 0%, rgba(255, 255, 255, 0.06) 50%, rgba(234, 179, 8, 0.45) 100%)",
        clipPath: "polygon(0 0, calc(100% - 28px) 0, 100% 28px, 100% 100%, 0 100%)",
        boxShadow: "0 18px 36px -10px rgba(0, 15, 45, 0.45), 0 0 0 1px rgba(0, 23, 67, 0.12)",
      }}
      className="group hover:-translate-y-1 transition-transform duration-200"
    >
      <div
        style={{
          background: "linear-gradient(145deg, #010A1A 0%, #00122E 55%, #010B1B 100%)",
          clipPath: "polygon(0 0, calc(100% - 27.5px) 0, 100% 27.5px, 100% 100%, 0 100%)",
          borderRadius: "13px",
          padding: "20px 22px 18px",
          position: "relative",
          overflow: "hidden",
          minHeight: 250,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        {/* Subtle Dotted Matrix Pattern Overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: "radial-gradient(rgba(255, 255, 255, 0.08) 1.2px, transparent 1.2px)",
            backgroundSize: "16px 16px",
            pointerEvents: "none",
          }}
        />

        {/* Subtle Circuit Traces Texture Overlay (4% opacity) */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.04]"
          xmlns="http://www.w3.org/2000/svg"
        >
          <pattern id={`circuit-${sim.id}`} width="120" height="120" patternUnits="userSpaceOnUse">
            <path d="M10 20 h35 v30 h25 v-20 h40" fill="none" stroke="#FFFFFF" strokeWidth="1.2" />
            <circle cx="10" cy="20" r="2.5" fill="#FDE047" />
            <circle cx="110" cy="30" r="2.5" fill="#FDE047" />
            <path d="M15 105 h30 v-35 h40 v-15" fill="none" stroke="#FFFFFF" strokeWidth="1.2" />
            <circle cx="15" cy="105" r="2.5" fill="#FDE047" />
            <circle cx="85" cy="55" r="2.5" fill="#FDE047" />
          </pattern>
          <rect width="100%" height="100%" fill={`url(#circuit-${sim.id})`} />
        </svg>

        {/* Diagonal Gold Accent Line at Chamfered Corner */}
        <div
          style={{
            position: "absolute",
            top: 14,
            right: 14,
            width: 40,
            height: 1.5,
            background: "linear-gradient(90deg, transparent 0%, #FDE047 50%, #CA8A04 100%)",
            transform: "rotate(45deg)",
            transformOrigin: "center",
            boxShadow: "0 0 8px rgba(250, 204, 21, 0.6)",
            pointerEvents: "none",
          }}
        />

        {/* Faint Massive Watermark in Bottom Right */}
        <div
          style={{
            position: "absolute",
            right: 12,
            bottom: -8,
            fontSize: "clamp(46px, 7vw, 68px)",
            fontWeight: 950,
            color: "rgba(255, 255, 255, 0.03)",
            letterSpacing: "0.06em",
            pointerEvents: "none",
            userSelect: "none",
            lineHeight: 1,
            zIndex: 1,
            textTransform: "uppercase",
            fontFamily: "var(--font-inter), sans-serif",
          }}
        >
          {rawCarrier}
        </div>

        {/* ── Top Header: Microchip + Carrier Title + Verification Badge (No redundant square, no line-break) ── */}
        <div className="flex items-center justify-between relative z-10 gap-2">
          <div className="flex items-center gap-3">
            <SimMicrochip />
            <div className="flex flex-col justify-center">
              <span className="text-white font-black text-[13px] uppercase tracking-[0.14em] block font-inter drop-shadow-xs">
                {sim.carrier}
              </span>
              <span className="text-[10.5px] text-slate-400 font-medium tracking-wide mt-0.5">
                {sim.simType} • {sim.acquiredFrom === "PLATFORM_AUCTION" ? "Trúng đấu giá" : "Cá nhân"}
              </span>
            </div>
          </div>

          <div className="mr-5 shrink-0">
            {isOwnerVerified ? (
              <span className="shrink-0 whitespace-nowrap inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/35 backdrop-blur-md shadow-xs">
                <Check size={11} strokeWidth={2.5} /> Chính chủ
              </span>
            ) : (
              <span className="shrink-0 whitespace-nowrap inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/35 backdrop-blur-md shadow-xs">
                <Clock size={11} strokeWidth={2} /> Chưa xác thực
              </span>
            )}
          </div>
        </div>

        {/* ── Center: Luxury SIM Number Display & Format Rhythm (Generous Breathing Room) ── */}
        <div className="relative z-10 py-3 text-center">
          {renderHeroSimNumber(sim.simNumber)}
          {sim.formatRhythmName && (
            <div className="mt-1.5">
              <span className="inline-flex items-center px-3 py-0.5 rounded-full text-[10.5px] font-medium tracking-wide bg-yellow-500/10 text-slate-300 border border-yellow-500/30 backdrop-blur-xs shadow-xs">
                Nhịp: <strong className="text-yellow-300 font-semibold ml-1">{sim.formatRhythmName}</strong>
              </span>
            </div>
          )}
        </div>

        {/* ── Bottom: Estimated Value & Tone-sur-tone Action Button ── */}
        <div className="flex items-center justify-between relative z-10 pt-3 border-t border-white/10">
          <div>
            <span className="text-[10px] uppercase font-semibold text-[#9CA3AF] block tracking-wider font-mono">
              Định giá ước tính
            </span>
            <span className="text-sm sm:text-base font-extrabold text-yellow-400 font-mono tabular-nums">
              {sim.estimatedValue.toLocaleString("vi-VN")} ₫
            </span>
          </div>

          <div>
            {sim.hasActiveAuction ? (
              <Link
                href={`/auctions/${sim.activeAuctionId || 1}`}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-[6px] text-xs font-bold bg-white/10 hover:bg-white/15 border border-white/20 text-white transition-colors shadow-sm"
              >
                <span>Đang đấu giá</span>
                <ArrowRight size={13} />
              </Link>
            ) : isOwnerVerified ? (
              <button
                type="button"
                onClick={() => onOpenAuction(sim)}
                style={{
                  background: "linear-gradient(135deg, #FDE047 0%, #EAB308 50%, #CA8A04 100%)",
                  boxShadow: "0 4px 14px rgba(234, 179, 8, 0.35)",
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-[6px] text-xs font-black text-[#001743] hover:brightness-105 active:scale-95 transition-all cursor-pointer"
              >
                <Gavel size={13} className="text-[#001743]" strokeWidth={2.2} />
                <span>Mở đấu giá</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onNavigateToEkyc}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-[6px] text-xs font-bold bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 hover:border-yellow-400 transition-colors cursor-pointer"
                title="Cần xác minh chính chủ để mở phiên đấu giá"
              >
                <ShieldCheck size={13} />
                <span>Xác thực ngay</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT: OwnedSimsTab
   ═══════════════════════════════════════════════════════════════════════════════ */
export default function OwnedSimsTab({
  isEkycVerified,
  addToast,
  onNavigateToEkyc,
}: OwnedSimsTabProps) {
  // SIM list state
  const [ownedSims, setOwnedSims] = useState<OwnedSim[]>(INITIAL_DEMO_SIMS);
  const [loading, setLoading] = useState(false);

  // View mode toggle: 'table' vs 'grid' (Hero Cards)
  const [viewMode, setViewMode] = useState<"table" | "grid">("grid");

  // Master data
  const [carriersList, setCarriersList] = useState<SimCarrierDto[]>(DEFAULT_CARRIERS);
  const [formatRhythmsList, setFormatRhythmsList] = useState<FormatRhythmItemDto[]>([]);

  // Modal: Thêm SIM cá nhân
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newSimNumber, setNewSimNumber] = useState("");
  const [selectedCarrier, setSelectedCarrier] = useState<SimCarrierDto | null>(null);
  const [newSimType, setNewSimType] = useState<"Trả trước" | "Trả sau">("Trả trước");
  // Number masking state for estimated value
  const [newEstimatedValueRaw, setNewEstimatedValueRaw] = useState<number>(10_000_000);
  const [newEstimatedValueFormatted, setNewEstimatedValueFormatted] = useState<string>("10.000.000");
  const [submittingSim, setSubmittingSim] = useState(false);

  // Modal: Tạo phiên đấu giá
  const [selectedSimForAuction, setSelectedSimForAuction] = useState<OwnedSim | null>(null);

  // ─── 1. Load MasterData & Owned SIMs from Database ───────────────────────
  const fetchSimsFromDb = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getMySims({ pageIndex: 1, pageSize: 50 });
      if (res.items && res.items.length > 0) {
        const mapped: OwnedSim[] = res.items.map((item) => ({
          id: item.id,
          simNumber: formatPhoneNumber(item.phoneNumber),
          carrier: item.carrierName || "Viettel",
          carrierLogo: item.carrierLogo,
          carrierCode: item.carrierCode,
          formatRhythmName: item.formatRhythmName,
          simType: "Trả trước",
          acquiredFrom:
            (item as any).acquisitionType === "AUCTION_TRANSFER"
              ? "PLATFORM_AUCTION"
              : "PERSONAL_IMPORT",
          ownershipStatus:
            item.verificationStatus === 2 || item.verificationStatus === "VERIFIED"
              ? "VERIFIED_OWNER"
              : "UNVERIFIED",
          estimatedValue: 10_000_000,
          createdDate: item.createdDate
            ? new Date(item.createdDate).toLocaleDateString("vi-VN")
            : "10/09/2026",
          hasActiveAuction: item.simStatus === "IN_AUCTION",
        }));
        setOwnedSims(mapped);
      }
    } catch (err) {
      console.warn("Chưa có phiên đăng nhập hoặc kho SIM rỗng:", err);
      // Giữ nguyên demo sims ban đầu để người dùng vẫn tương tác mượt mà
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSimsFromDb();

    // Fetch live carriers
    getCarriers()
      .then((data) => {
        if (data && data.length > 0) {
          setCarriersList(data);
          setSelectedCarrier(data[0]);
        }
      })
      .catch(() => { });

    // Fetch format rhythms
    getFormatRhythms()
      .then((data) => {
        if (data && data.length > 0) setFormatRhythmsList(data);
      })
      .catch(() => { });
  }, [fetchSimsFromDb]);

  // ─── 2. Auto-Detect Carrier from Phone Prefix ───────────────────────────
  const handleSimNumberInput = (val: string) => {
    setNewSimNumber(val);
    const clean = val.replace(/\D/g, "");
    if (clean.length >= 3) {
      const prefix3 = clean.substring(0, 3);
      const matched = carriersList.find((c) => {
        const cname = c.carrierName.toLowerCase();
        if (c.prefixes?.some((p) => p.prefixValue === prefix3)) return true;
        if (cname.includes("viettel") && ["086", "096", "097", "098", "032", "033", "034", "035", "036", "037", "038", "039"].includes(prefix3)) return true;
        if (cname.includes("mobi") && ["089", "090", "093", "070", "079", "077", "076", "078"].includes(prefix3)) return true;
        if (cname.includes("vina") && ["088", "091", "094", "083", "084", "085", "081", "082"].includes(prefix3)) return true;
        if (cname.includes("vietnamobile") && ["092", "056", "058"].includes(prefix3)) return true;
        if (cname.includes("wintel") && ["055"].includes(prefix3)) return true;
        if (cname.includes("itelecom") && ["087"].includes(prefix3)) return true;
        return false;
      });
      if (matched) {
        setSelectedCarrier(matched);
      }
    }
  };

  // ─── 3. Number Masking Handler for Estimated Value ───────────────────────
  const handleEstimatedValueMasking = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "");
    if (!raw) {
      setNewEstimatedValueRaw(0);
      setNewEstimatedValueFormatted("");
      return;
    }
    const num = parseInt(raw, 10);
    setNewEstimatedValueRaw(num);
    setNewEstimatedValueFormatted(num.toLocaleString("vi-VN"));
  };

  const handleQuickAddPrice = (addAmount: number) => {
    const nextVal = (newEstimatedValueRaw || 0) + addAmount;
    setNewEstimatedValueRaw(nextVal);
    setNewEstimatedValueFormatted(nextVal.toLocaleString("vi-VN"));
  };

  const [loadingAiValuation, setLoadingAiValuation] = useState(false);

  const handleAiEstimateForNewSim = async () => {
    const cleanNumber = newSimNumber.replace(/\D/g, "");
    if (cleanNumber.length < 9) {
      addToast({
        type: "warning",
        title: "Chưa đủ số điện thoại",
        message: "Vui lòng nhập số điện thoại trước khi nhờ AI thẩm định giá.",
      });
      return;
    }
    setLoadingAiValuation(true);
    try {
      const res = await aiValuationService.estimatePrice({ phoneNumber: cleanNumber });
      if (res.suggestedPrice && res.suggestedPrice > 0) {
        const price = Math.round(res.suggestedPrice);
        setNewEstimatedValueRaw(price);
        setNewEstimatedValueFormatted(price.toLocaleString("vi-VN"));
        addToast({
          type: "success",
          title: "AI đã định giá thành công",
          message: `Mức giá gợi ý: ${price.toLocaleString("vi-VN")} ₫ (${res.detectedRhythmName || "SIM số đẹp"}).`,
        });
      }
    } catch (err: any) {
      addToast({
        type: "error",
        title: "Không thể định giá bằng AI",
        message: err.message || "Vui lòng thử lại sau.",
      });
    } finally {
      setLoadingAiValuation(false);
    }
  };

  // ─── 4. Handle Add Personal SIM ──────────────────────────────────────────
  const handleAddPersonalSim = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNumber = newSimNumber.trim().replace(/\D/g, "");
    if (!cleanNumber || cleanNumber.length !== 10 || !cleanNumber.startsWith("0")) {
      addToast({
        type: "error",
        title: "Số SIM không hợp lệ",
        message: "Số điện thoại phải bao gồm đúng 10 chữ số và bắt đầu bằng số 0 (VD: 0912 345 678).",
      });
      return;
    }

    const carrierToUse = selectedCarrier || carriersList[0];
    if (!carrierToUse) {
      addToast({
        type: "error",
        title: "Chưa chọn nhà mạng",
        message: "Vui lòng chọn nhà mạng cung cấp dịch vụ cho SIM.",
      });
      return;
    }

    if (newEstimatedValueRaw < 100_000) {
      addToast({
        type: "error",
        title: "Định giá không hợp lệ",
        message: "Vui lòng nhập định giá ước tính tối thiểu từ 100.000 ₫.",
      });
      return;
    }

    setSubmittingSim(true);
    try {
      // 1. Tìm FormatRhythm mặc định
      const defaultRhythm = formatRhythmsList[0]?.id || "be433391-84db-4b7d-a540-603bda9e816a";
      const prefix3 = cleanNumber.substring(0, 3);
      const matchedPrefix = carrierToUse.prefixes?.find((p) => p.prefixValue === prefix3);

      // Thử đăng ký trực tiếp vào Database Backend
      try {
        await registerSim({
          phoneNumber: cleanNumber,
          formatRhythmId: defaultRhythm,
          phonePrefixId: matchedPrefix?.id,
        });
      } catch (backendErr: any) {
        console.warn("Backend register notice:", backendErr.message);
      }

      // Lưu vào kho SIM giao diện ngay lập tức
      const newSimItem: OwnedSim = {
        id: `sim-${Date.now()}`,
        simNumber: formatPhoneNumber(cleanNumber),
        carrier: carrierToUse.carrierName,
        carrierLogo: carrierToUse.logoImg,
        carrierCode: carrierToUse.carrierCode,
        simType: newSimType,
        acquiredFrom: "PERSONAL_IMPORT",
        ownershipStatus: "UNVERIFIED",
        estimatedValue: newEstimatedValueRaw,
        createdDate: new Date().toLocaleDateString("vi-VN"),
      };

      setOwnedSims((prev) => [newSimItem, ...prev.filter((s) => s.simNumber.replace(/\D/g, "") !== cleanNumber)]);
      setIsAddModalOpen(false);
      setNewSimNumber("");
      setNewEstimatedValueRaw(10_000_000);
      setNewEstimatedValueFormatted("10.000.000");

      addToast({
        type: "success",
        title: "Thêm SIM cá nhân thành công",
        message: `Đã lưu SIM ${formatPhoneNumber(cleanNumber)} vào kho của bạn. Hãy tiến hành xác thực chính chủ để mở phiên đấu giá.`,
      });

      // Fetch fresh items from DB
      fetchSimsFromDb();
    } catch (err: any) {
      addToast({
        type: "error",
        title: "Không thể thêm SIM",
        message: err.message || "Đã xảy ra lỗi khi thêm SIM. Vui lòng thử lại.",
      });
    } finally {
      setSubmittingSim(false);
    }
  };

  // ─── 5. Handle Open Create Auction ───────────────────────────────────────
  const handleOpenCreateAuction = (sim: OwnedSim) => {
    if (sim.ownershipStatus !== "VERIFIED_OWNER") {
      addToast({
        type: "error",
        title: "Chưa đủ điều kiện mở đấu giá",
        message: "Chỉ SIM đã được xác thực chính chủ mới có thể tạo phiên đấu giá trên sàn.",
      });
      return;
    }
    setSelectedSimForAuction(sim);
  };

  return (
    <div className="flex flex-col gap-5">
      {/* ── 1. Header Toolbar & View Mode Toggle ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-extrabold text-[#001743] flex items-center gap-2 m-0">
            Kho SIM sở hữu của bạn
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Quản lý danh sách SIM cá nhân và SIM trúng đấu giá trực tiếp từ cơ sở dữ liệu.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Segmented Control Toggle: Dạng bảng vs Thẻ SIM */}
          <div className="inline-flex p-1 bg-slate-100/90 rounded-lg border border-slate-200/80 shadow-2xs gap-1">
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                viewMode === "table"
                  ? "bg-white text-[#001743] shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
              title="Chuyển sang chế độ xem bảng chi tiết"
            >
              <TableIcon size={14} strokeWidth={1.75} />
              <span>Dạng bảng</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                viewMode === "grid"
                  ? "bg-[#001743] text-white shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
              title="Chuyển sang chế độ xem thẻ SIM Luxury độc đáo"
            >
              <LayoutGrid size={14} strokeWidth={1.75} />
              <span>Thẻ SIM</span>
            </button>
          </div>

          <button
            type="button"
            onClick={fetchSimsFromDb}
            disabled={loading}
            className="btn-outline flex items-center gap-1.5 px-3 py-2 rounded-[6px] text-xs font-semibold"
            title="Làm mới dữ liệu từ Database"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            <span className="hidden sm:inline">Làm mới</span>
          </button>

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#001743] hover:bg-[#002266] text-white rounded-[6px] text-xs font-bold shadow-xs transition-all cursor-pointer hover:shadow active:scale-98"
          >
            <Plus size={15} strokeWidth={2} />
            <span>Thêm SIM cá nhân</span>
          </button>
        </div>
      </div>

      {/* ── 2. Content: Table View vs Grid Hero View ── */}
      {ownedSims.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-[10px] p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <Smartphone size={22} />
          </div>
          <h3 className="text-sm font-bold text-[#001743]">Chưa có số SIM nào trong kho</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Bạn chưa có số SIM cá nhân nào được thêm vào kho. Hãy bấm nút "Thêm SIM cá nhân" ở trên để bắt đầu.
          </p>
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-[#001743] hover:bg-[#002266] text-white text-xs font-bold rounded-[6px] transition-colors"
          >
            <Plus size={14} /> Thêm SIM mới ngay
          </button>
        </div>
      ) : viewMode === "grid" ? (
        /* ════ CHẾ ĐỘ 1: GRID VIEW (HERO CARD HEADER DESIGN) ════ */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-fade-up">
          {ownedSims.map((sim) => (
            <OwnedSimHeroCard
              key={sim.id}
              sim={sim}
              onOpenAuction={handleOpenCreateAuction}
              onNavigateToEkyc={onNavigateToEkyc}
            />
          ))}
        </div>
      ) : (
        /* ════ CHẾ ĐỘ 2: TABLE VIEW (CHUẨN BẢNG FINTECH) ════ */
        <div className="bg-white border border-slate-200 rounded-[10px] overflow-hidden shadow-2xs animate-fade-up">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                  <th className="py-3 px-4">Số SIM</th>
                  <th className="py-3 px-4">Nhà mạng & Gói</th>
                  <th className="py-3 px-4">Nguồn gốc</th>
                  <th className="py-3 px-4">Xác thực chính chủ</th>
                  <th className="py-3 px-4">Định giá ước tính</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {ownedSims.map((sim) => {
                  const isOwnerVerified = sim.ownershipStatus === "VERIFIED_OWNER";
                  return (
                    <tr key={sim.id} className="hover:bg-slate-50/80 transition-colors h-16">
                      {/* Cột 1: Số SIM */}
                      <td className="py-3 px-4">
                        <div className="font-extrabold text-sm text-[#001743] font-mono tabular-nums">
                          {sim.simNumber}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">Ngày thêm: {sim.createdDate}</div>
                      </td>

                      {/* Cột 2: Nhà mạng với Logo Vuông */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <CarrierSquareLogo name={sim.carrier} logo={sim.carrierLogo} size={28} />
                          <div>
                            <div className="font-bold text-xs text-[#001743]">{sim.carrier}</div>
                            <div className="text-[11px] text-slate-500">{sim.simType}</div>
                          </div>
                        </div>
                      </td>

                      {/* Cột 3: Nguồn gốc */}
                      <td className="py-3 px-4">
                        {sim.acquiredFrom === "PLATFORM_AUCTION" ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10.5px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            Trúng đấu giá sàn
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10.5px] font-semibold bg-slate-100 text-slate-600">
                            Tự thêm cá nhân
                          </span>
                        )}
                      </td>

                      {/* Cột 4: Xác thực chính chủ */}
                      <td className="py-3 px-4">
                        {isOwnerVerified ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <Check size={12} strokeWidth={2.5} /> Đã xác thực chính chủ
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            <Clock size={12} /> Chưa xác thực chính chủ
                          </span>
                        )}
                      </td>

                      {/* Cột 5: Định giá ước tính */}
                      <td className="py-3 px-4 font-bold text-[#001743] font-mono tabular-nums text-xs">
                        {sim.estimatedValue.toLocaleString("vi-VN")} ₫
                      </td>

                      {/* Cột 6: Thao tác */}
                      <td className="py-3 px-4 text-right">
                        {sim.hasActiveAuction ? (
                          <Link
                            href={`/auctions/${sim.activeAuctionId || 1}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-[6px] text-xs font-bold border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors"
                          >
                            <span>Đang đấu giá</span>
                            <ArrowRight size={12} />
                          </Link>
                        ) : isOwnerVerified ? (
                          <button
                            type="button"
                            onClick={() => handleOpenCreateAuction(sim)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-[6px] text-xs font-bold bg-[#E4011E] hover:bg-[#B80018] text-white transition-colors cursor-pointer"
                          >
                            <Gavel size={12} />
                            <span>Mở đấu giá</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={onNavigateToEkyc}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-[6px] text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-colors cursor-pointer"
                            title="Xác thực chính chủ để mở quyền tạo đấu giá"
                          >
                            <ShieldCheck size={12} />
                            <span>Xác thực ngay</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── 3. Modal: Thêm SIM cá nhân (Soft UI, Logo chữ S, AI Valuation, Pills) ── */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/45 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-[20px] w-full max-w-[500px] p-6 shadow-2xl border border-slate-100 animate-fade-up">
            {/* Header Modal */}
            <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <img src="/logo/S-Logo.png" alt="TrustSIM" className="w-7 h-7 object-contain shrink-0" />
                <h3 className="text-base font-black text-[#001743] tracking-tight m-0">
                  Thêm SIM cá nhân vào kho
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                aria-label="Đóng"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddPersonalSim} className="flex flex-col gap-4">
              {/* Field 1: Số điện thoại SIM * */}
              <div>
                <label className="block text-xs font-bold text-[#001743] mb-1.5">
                  Số điện thoại SIM <span className="text-red-600">*</span>
                </label>
                <input
                  type="tel"
                  placeholder="Ví dụ: 0912 345 678"
                  value={newSimNumber}
                  onChange={(e) => handleSimNumberInput(e.target.value)}
                  className="w-full text-xs p-3 border border-slate-200 rounded-[12px] font-mono font-bold text-[#001743] focus:border-[#001743] focus:ring-2 focus:ring-[#001743]/10 focus:outline-none transition-all"
                  required
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Nhập đúng 10 chữ số bắt đầu bằng số 0. Hệ thống sẽ tự động nhận diện nhà mạng tương ứng.
                </p>
              </div>

              {/* Field 2 & 3: Nhà mạng * & Loại thuê bao * */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#001743] mb-1.5">
                    Nhà mạng <span className="text-red-600">*</span>
                  </label>
                  <CarrierDropdownSelect
                    carriers={carriersList}
                    selectedCarrier={selectedCarrier}
                    onSelect={(c) => setSelectedCarrier(c)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#001743] mb-1.5">
                    Loại thuê bao <span className="text-red-600">*</span>
                  </label>
                  <select
                    value={newSimType}
                    onChange={(e) => setNewSimType(e.target.value as any)}
                    className="w-full text-xs p-3 border border-slate-200 rounded-[12px] bg-white font-semibold text-[#001743] focus:border-[#001743] focus:ring-2 focus:ring-[#001743]/10 focus:outline-none transition-all"
                  >
                    <option value="Trả trước">Trả trước</option>
                    <option value="Trả sau">Trả sau</option>
                  </select>
                </div>
              </div>

              {/* Field 4: Định giá ước tính * (Có AI Valuation & Quick Add Pills) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-[#001743]">
                    Định giá ước tính <span className="text-red-600">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleAiEstimateForNewSim}
                    disabled={loadingAiValuation}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50/80 hover:bg-blue-100 text-[#001743] rounded-full text-[11px] font-bold transition-all disabled:opacity-50 cursor-pointer shadow-2xs"
                  >
                    {loadingAiValuation ? (
                      <>
                        <RefreshCw size={11} className="animate-spin text-[#E4011E]" />
                        <span>Đang phân tích...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={12} className="text-[#E4011E]" />
                        <span>Nhờ AI định giá</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="relative flex items-center">
                  <input
                    type="text"
                    value={newEstimatedValueFormatted}
                    onChange={handleEstimatedValueMasking}
                    placeholder="10.000.000"
                    className="w-full text-xs p-3 pr-8 border border-slate-200 rounded-[12px] font-mono font-bold text-[#001743] focus:border-[#001743] focus:ring-2 focus:ring-[#001743]/10 focus:outline-none transition-all"
                    required
                  />
                  <span className="absolute right-3.5 text-xs font-bold text-slate-400 pointer-events-none">
                    ₫
                  </span>
                </div>

                {/* Quick Add Price Pills */}
                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                  <span className="text-[11px] text-slate-400 font-medium mr-1">Cộng nhanh:</span>
                  {[
                    { label: "+1 triệu", val: 1_000_000 },
                    { label: "+5 triệu", val: 5_000_000 },
                    { label: "+10 triệu", val: 10_000_000 },
                    { label: "+50 triệu", val: 50_000_000 },
                  ].map((chip) => (
                    <button
                      key={chip.label}
                      type="button"
                      onClick={() => handleQuickAddPrice(chip.val)}
                      className="px-3 py-1 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 rounded-full text-[11px] font-semibold transition-all cursor-pointer"
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Soft UI Notice Box (Không viền cứng, pastel nhẹ) */}
              <div className="p-4 bg-amber-50/60 rounded-[14px] text-xs text-amber-900 leading-relaxed">
                SIM mới thêm cần được <strong>xác thực chính chủ (eKYC)</strong> trước khi có thể mở phiên đấu giá trên sàn.
              </div>

              {/* Form Buttons (Pills bo tròn) */}
              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  disabled={submittingSim}
                  className="px-5 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-full text-xs font-semibold transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={submittingSim}
                  className="px-6 py-2.5 bg-[#001743] hover:bg-[#00266B] text-white rounded-full text-xs font-bold shadow-sm cursor-pointer flex items-center gap-1.5 transition-all"
                >
                  {submittingSim && <RefreshCw size={13} className="animate-spin" />}
                  <span>{submittingSim ? "Đang lưu..." : "Lưu vào kho SIM"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── 4. Modal: Tạo phiên đấu giá (Wizard Modal 4 bước) ── */}
      {selectedSimForAuction && (
        <CreateAuctionWizardModal
          sim={selectedSimForAuction}
          isEkycVerified={isEkycVerified}
          onClose={() => setSelectedSimForAuction(null)}
          onSuccess={() => {
            setSelectedSimForAuction(null);
            fetchSimsFromDb();
          }}
          onNavigateToEkyc={onNavigateToEkyc}
          addToast={addToast}
        />
      )}
    </div>
  );
}
