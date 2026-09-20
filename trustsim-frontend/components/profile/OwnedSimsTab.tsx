"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
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
  ChevronUp,
  ShieldCheck,
  Gavel,
  ArrowRight,
  Sparkles,
  Smartphone,
  AlertCircle,
  HelpCircle,
  CheckCircle2,
  Eye,
  Pencil,
  Trash2,
} from "lucide-react";
import { ToastMessage } from "@/components/ui/Toast";
import { OwnedSim } from "./types";
import CreateAuctionWizardModal from "./CreateAuctionWizardModal";
import VerifySimOwnershipModal from "./VerifySimOwnershipModal";
import SimDetailModal from "./SimDetailModal";
import UpdateOwnedSimModal from "./UpdateOwnedSimModal";
import DeleteSimConfirmModal from "./DeleteSimConfirmModal";
import { aiValuationService, SimValuationDto } from "@/services/aiValuationService";
import {
  getMySims,
  registerSim,
  getFormatRhythms,
  getCarrierColor,
  formatPhoneNumber,
  FormatRhythmItemDto,
} from "@/services/simService";
import { getCarriers, SimCarrierDto } from "@/services/carrierService";
import { getCategories, SimCategoryDto } from "@/services/categoryService";

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
  onOpenVerify,
  onOpenDetail,
  onOpenUpdate,
  onOpenDelete,
}: {
  sim: OwnedSim;
  onOpenAuction: (s: OwnedSim) => void;
  onOpenVerify: (s: OwnedSim) => void;
  onOpenDetail: (s: OwnedSim) => void;
  onOpenUpdate: (s: OwnedSim) => void;
  onOpenDelete: (s: OwnedSim) => void;
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

          <div className="flex items-center gap-1.5">
            {/* Quick Action Icons: View, Edit, Delete */}
            <button
              type="button"
              onClick={() => onOpenDetail(sim)}
              className="p-1.5 rounded-[6px] bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Xem chi tiết số SIM"
            >
              <Eye size={13} />
            </button>
            <button
              type="button"
              onClick={() => onOpenUpdate(sim)}
              className="p-1.5 rounded-[6px] bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Chỉnh sửa thông tin SIM"
            >
              <Pencil size={13} />
            </button>
            <button
              type="button"
              onClick={() => onOpenDelete(sim)}
              className="p-1.5 rounded-[6px] bg-white/10 hover:bg-rose-500/25 text-slate-300 hover:text-rose-300 transition-colors cursor-pointer"
              title="Xóa SIM khỏi kho"
            >
              <Trash2 size={13} />
            </button>

            {sim.hasActiveAuction ? (
              <Link
                href={`/auctions/${sim.activeAuctionId || 1}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] text-xs font-bold bg-white/10 hover:bg-white/15 border border-white/20 text-white transition-colors shadow-sm"
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
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] text-xs font-black text-[#001743] hover:brightness-105 active:scale-95 transition-all cursor-pointer"
              >
                <Gavel size={13} className="text-[#001743]" strokeWidth={2.2} />
                <span>Mở đấu giá</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onOpenVerify(sim)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] text-xs font-bold bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 hover:border-yellow-400 transition-colors cursor-pointer"
                title="Xác thực chính chủ với Cổng viễn thông Nhà mạng"
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
  // SIM list state (luôn lấy dữ liệu thật từ Database)
  const [ownedSims, setOwnedSims] = useState<OwnedSim[]>([]);
  const [loading, setLoading] = useState(true);

  // View mode toggle: 'table' vs 'grid' (Hero Cards)
  const [viewMode, setViewMode] = useState<"table" | "grid">("grid");

  // Master data
  const [carriersList, setCarriersList] = useState<SimCarrierDto[]>(DEFAULT_CARRIERS);
  const [formatRhythmsList, setFormatRhythmsList] = useState<FormatRhythmItemDto[]>([]);
  const [categoriesList, setCategoriesList] = useState<SimCategoryDto[]>([]);

  // Modal: Thêm SIM cá nhân
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newSimNumber, setNewSimNumber] = useState("");
  const [selectedCarrier, setSelectedCarrier] = useState<SimCarrierDto | null>(null);
  const [newSimType, setNewSimType] = useState<"Trả trước" | "Trả sau">("Trả trước");
  const [selectedFormatRhythmId, setSelectedFormatRhythmId] = useState<string>("");
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  // Number masking state for estimated value
  const [newEstimatedValueRaw, setNewEstimatedValueRaw] = useState<number>(10_000_000);
  const [newEstimatedValueFormatted, setNewEstimatedValueFormatted] = useState<string>("10.000.000");
  const [submittingSim, setSubmittingSim] = useState(false);

  // Modal: Tạo phiên đấu giá
  const [selectedSimForAuction, setSelectedSimForAuction] = useState<OwnedSim | null>(null);

  // Modal: Xác thực chính chủ 2 bước
  const [selectedSimForVerify, setSelectedSimForVerify] = useState<OwnedSim | null>(null);

  // Modal: Xem chi tiết SIM
  const [selectedSimForDetail, setSelectedSimForDetail] = useState<OwnedSim | null>(null);

  // Modal: Chỉnh sửa SIM
  const [selectedSimForUpdate, setSelectedSimForUpdate] = useState<OwnedSim | null>(null);

  // Modal: Xóa SIM khỏi kho
  const [selectedSimForDelete, setSelectedSimForDelete] = useState<OwnedSim | null>(null);

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
          formatRhythmId: item.formatRhythmId,
          formatRhythmName: item.formatRhythmName,
          phonePrefixId: (item as any).phonePrefixId,
          categoryNames: item.categoryNames || [],
          simType: "Trả trước",
          acquiredFrom:
            (item as any).acquisitionType === "AUCTION_TRANSFER"
              ? "PLATFORM_AUCTION"
              : "PERSONAL_IMPORT",
          ownershipStatus:
            item.verificationStatus === 2 || item.verificationStatus === "VERIFIED"
              ? "VERIFIED_OWNER"
              : "UNVERIFIED",
          estimatedValue: item.price !== undefined && item.price > 0 ? item.price : 0,
          createdDate: item.createdDate
            ? new Date(item.createdDate).toLocaleDateString("vi-VN")
            : "10/09/2026",
          hasActiveAuction: item.simStatus === "IN_AUCTION",
        }));
        setOwnedSims(mapped);
      } else {
        setOwnedSims([]);
      }
    } catch (err) {
      console.warn("Lỗi lấy dữ liệu kho SIM hoặc chưa đăng nhập:", err);
      setOwnedSims([]);
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

    // Fetch categories
    getCategories()
      .then((data) => {
        if (data && data.length > 0) setCategoriesList(data);
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
  const [aiValuationResult, setAiValuationResult] = useState<SimValuationDto | null>(null);
  const [showAiAnalysisDetail, setShowAiAnalysisDetail] = useState(false);
  const [showAiDetailModal, setShowAiDetailModal] = useState(false);
  const aiValuationCardRef = useRef<HTMLDivElement | null>(null);

  const handleOpenAddModal = () => {
    setIsAddModalOpen(true);
    setAiValuationResult(null);
    setShowAiAnalysisDetail(false);
    setShowAiDetailModal(false);
  };

  const handleCloseAddModal = () => {
    setIsAddModalOpen(false);
    setAiValuationResult(null);
    setShowAiAnalysisDetail(false);
    setShowAiDetailModal(false);
  };

  const getReasoningBullets = (text?: string): string[] => {
    if (!text) return [];
    return text
      .split(/(?<=[.?!;])\s+|\n+/)
      .map((s) => s.trim().replace(/^[-*•]\s*/, ""))
      .filter((s) => s.length > 5);
  };

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
      setAiValuationResult(res);
      if (res.suggestedPrice && res.suggestedPrice > 0) {
        const price = Math.round(res.suggestedPrice);
        setNewEstimatedValueRaw(price);
        setNewEstimatedValueFormatted(price.toLocaleString("vi-VN"));
      }

      // Tự động nhận diện và gán Nhịp định dạng từ AI
      if (res.detectedRhythmName && formatRhythmsList.length > 0) {
        const matchedRhythm = formatRhythmsList.find(
          (r) =>
            r.formatRhythmName.toLowerCase() === res.detectedRhythmName.toLowerCase() ||
            res.detectedRhythmName.toLowerCase().includes(r.formatRhythmName.toLowerCase()) ||
            r.formatRhythmName.toLowerCase().includes(res.detectedRhythmName.toLowerCase())
        );
        if (matchedRhythm) {
          setSelectedFormatRhythmId(matchedRhythm.id);
        }
      }

      // Tự động nhận diện và gán Thể loại từ AI
      if (res.detectedCategories && res.detectedCategories.length > 0 && categoriesList.length > 0) {
        const matchedCatIds = categoriesList
          .filter((c) =>
            res.detectedCategories.some(
              (dc) =>
                dc.toLowerCase().includes(c.categoryName.toLowerCase()) ||
                c.categoryName.toLowerCase().includes(dc.toLowerCase())
            )
          )
          .map((c) => c.id);
        if (matchedCatIds.length > 0) {
          setSelectedCategoryIds((prev) => Array.from(new Set([...prev, ...matchedCatIds])));
        }
      }

      // Tự động cuộn mượt đưa thẻ kết quả định giá AI vào trung tâm màn hình
      setTimeout(() => {
        aiValuationCardRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 100);
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
      // Xác định nhịp định dạng và thể loại:
      // - Nếu người dùng đã nhờ AI định giá: dùng kết quả do AI thẩm định và quyết định.
      // - Nếu người dùng KHÔNG nhờ AI: tự động gán Nhịp phổ thông + SIM phổ thông.
      const normalRhythm = formatRhythmsList.find(
        (r) => r.formatRhythmName.toLowerCase().includes("phổ thông") || (r.value && r.value.toUpperCase() === "NORMAL")
      ) || formatRhythmsList[0];

      const normalCategory = categoriesList.find(
        (c) => c.categoryName.toLowerCase().includes("phổ thông") || c.categoryCode === "SIM_THUONG"
      );

      const rhythmIdToUse = (aiValuationResult && selectedFormatRhythmId)
        ? selectedFormatRhythmId
        : normalRhythm?.id || "f1000000-0000-0000-0000-000000000011";

      const categoryIdsToUse = (aiValuationResult && selectedCategoryIds.length > 0)
        ? selectedCategoryIds
        : normalCategory ? [normalCategory.id] : ["ca000000-0000-0000-0000-000000000010"];

      const rhythmNameToUse = (aiValuationResult && selectedFormatRhythmId)
        ? (formatRhythmsList.find((r) => r.id === selectedFormatRhythmId)?.formatRhythmName || aiValuationResult.detectedRhythmName)
        : (normalRhythm?.formatRhythmName || "Nhịp Phổ thông");

      const categoryNamesToUse = (aiValuationResult && selectedCategoryIds.length > 0)
        ? categoriesList.filter((c) => selectedCategoryIds.includes(c.id)).map((c) => c.categoryName)
        : [normalCategory?.categoryName || "SIM Phổ thông"];

      const prefix3 = cleanNumber.substring(0, 3);
      const matchedPrefix = carrierToUse.prefixes?.find((p) => p.prefixValue === prefix3);

      // Thử đăng ký trực tiếp vào Database Backend với đầy đủ giá, nhịp và danh mục
      try {
        await registerSim({
          phoneNumber: cleanNumber,
          formatRhythmId: rhythmIdToUse,
          phonePrefixId: matchedPrefix?.id,
          categoryIds: categoryIdsToUse,
          price: newEstimatedValueRaw,
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
        formatRhythmId: rhythmIdToUse,
        formatRhythmName: rhythmNameToUse,
        phonePrefixId: matchedPrefix?.id,
        categoryNames: categoryNamesToUse,
        simType: newSimType,
        acquiredFrom: "PERSONAL_IMPORT",
        ownershipStatus: "UNVERIFIED",
        estimatedValue: newEstimatedValueRaw,
        createdDate: new Date().toLocaleDateString("vi-VN"),
      };

      setOwnedSims((prev) => [newSimItem, ...prev.filter((s) => s.simNumber.replace(/\D/g, "") !== cleanNumber)]);
      setIsAddModalOpen(false);
      setAiValuationResult(null);
      setShowAiAnalysisDetail(false);
      setShowAiDetailModal(false);
      setNewSimNumber("");
      setSelectedCategoryIds([]);
      setSelectedFormatRhythmId("");
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
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${viewMode === "table"
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
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${viewMode === "grid"
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
            onClick={handleOpenAddModal}
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
            onClick={handleOpenAddModal}
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
              onOpenVerify={(s) => setSelectedSimForVerify(s)}
              onOpenDetail={(s) => setSelectedSimForDetail(s)}
              onOpenUpdate={(s) => setSelectedSimForUpdate(s)}
              onOpenDelete={(s) => setSelectedSimForDelete(s)}
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
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedSimForDetail(sim)}
                            className="p-1.5 rounded-[6px] border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
                            title="Xem chi tiết SIM"
                          >
                            <Eye size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedSimForUpdate(sim)}
                            className="p-1.5 rounded-[6px] border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
                            title="Chỉnh sửa thông tin SIM"
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedSimForDelete(sim)}
                            className="p-1.5 rounded-[6px] border border-rose-200 hover:bg-rose-50 text-rose-600 transition-colors cursor-pointer"
                            title="Xóa SIM"
                          >
                            <Trash2 size={13} />
                          </button>

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
                              onClick={() => setSelectedSimForVerify(sim)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-[6px] text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-colors cursor-pointer"
                              title="Xác thực chính chủ với Cổng viễn thông Nhà mạng"
                            >
                              <ShieldCheck size={12} />
                              <span>Xác thực ngay</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── 3. Modal: Thêm SIM cá nhân (Soft UI, Logo chữ S, AI Valuation, Sticky Footer) ── */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/45 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-[20px] w-full max-w-[500px] shadow-2xl border border-slate-100 animate-fade-up flex flex-col max-h-[90vh] overflow-hidden">
            {/* Header Modal - Cố định ở đỉnh */}
            <div className="flex items-center justify-between p-5 pb-3.5 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2.5">
                <img src="/logo/S-Logo.png" alt="TrustSIM" className="w-7 h-7 object-contain shrink-0" />
                <h3 className="text-base font-black text-[#001743] tracking-tight m-0">
                  Thêm SIM cá nhân vào kho
                </h3>
              </div>
              <button
                type="button"
                onClick={handleCloseAddModal}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                aria-label="Đóng"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddPersonalSim} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              {/* Vùng nội dung cuộn (Scrollable Form Body) */}
              <div className="p-5 pb-16 overflow-y-auto flex-1 flex flex-col gap-4 scroll-smooth">
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

                {/* Trạng thái AI Thinking / Skeleton Loading */}
                {loadingAiValuation && (
                  <div className="p-3.5 bg-gradient-to-r from-blue-50/70 via-purple-50/40 to-slate-50/70 rounded-[14px] border border-purple-100/60 animate-pulse transition-all">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles size={13} className="text-[#E4011E] animate-spin" />
                      <span className="text-xs font-bold text-[#001743]">
                        AI đang phân tích thế số, phong thủy và định giá thị trường...
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div className="h-3 bg-slate-200/80 rounded-full w-3/4" />
                      <div className="h-2.5 bg-slate-200/60 rounded-full w-1/2" />
                    </div>
                  </div>
                )}

                {/* THẺ KẾT QUẢ AI ĐỊNH GIÁ HỢP NHẤT: Đặt ngay trên trường Định giá ước tính, hiển thị đầy đủ, không bị che khuất */}
                {aiValuationResult && !loadingAiValuation && (
                  <div
                    ref={aiValuationCardRef}
                    className="p-4 bg-gradient-to-br from-blue-50/90 via-indigo-50/40 to-slate-50/80 rounded-[16px] border border-blue-200/80 shadow-xs relative overflow-hidden transition-all animate-fadeIn space-y-3"
                  >
                    {/* Header card: S-Logo + Nhịp phát hiện + Nút Xem chi tiết phân tích + Nút Đóng */}
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2 min-w-0">
                        <img
                          src="/logo/S-Logo.png"
                          alt="TrustSim AI"
                          className="w-4 h-4 object-contain shrink-0"
                        />
                        <span className="text-xs font-bold text-[#001743] shrink-0">
                          Kết quả AI định giá
                        </span>
                        {aiValuationResult.detectedRhythmName && (
                          <span className="px-2.5 py-0.5 bg-blue-100 text-blue-900 rounded-full text-[10.5px] font-bold truncate">
                            {aiValuationResult.detectedRhythmName}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => setShowAiDetailModal(true)}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-white hover:bg-red-50 text-[#001743] hover:text-[#E4011E] border border-blue-200/90 rounded-full text-[11px] font-extrabold transition-all shadow-2xs cursor-pointer active:scale-95"
                          title="Mở xem báo cáo phân tích định giá chi tiết"
                        >
                          <Sparkles size={12} className="text-[#E4011E]" />
                          <span>Chi tiết phân tích</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setAiValuationResult(null)}
                          className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-200/60 transition-colors cursor-pointer"
                          title="Đóng kết quả định giá"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Mức giá AI đề xuất & Khoảng giá thị trường */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-white/95 p-3 rounded-[12px] border border-blue-100 shadow-2xs">
                      <div>
                        <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Mức giá AI đề xuất:</div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-base font-black text-[#E4011E] font-mono">
                            {aiValuationResult.suggestedPrice?.toLocaleString("vi-VN")} ₫
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              if (aiValuationResult.suggestedPrice) {
                                const price = Math.round(aiValuationResult.suggestedPrice);
                                setNewEstimatedValueRaw(price);
                                setNewEstimatedValueFormatted(price.toLocaleString("vi-VN"));
                              }
                            }}
                            title="Áp dụng mức giá này vào ô nhập"
                            className="px-2.5 py-0.5 bg-[#001743] hover:bg-[#00266B] text-white rounded-full text-[10px] font-bold transition-all shadow-2xs cursor-pointer flex items-center gap-1 active:scale-95 shrink-0"
                          >
                            <Check size={10} strokeWidth={2.5} />
                            <span>Áp dụng</span>
                          </button>
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Khoảng giá thị trường:</div>
                        <div className="text-xs font-bold text-slate-700 font-mono mt-1">
                          {aiValuationResult.minPrice ? aiValuationResult.minPrice.toLocaleString("vi-VN") : "---"} ₫
                          {" – "}
                          {aiValuationResult.maxPrice ? aiValuationResult.maxPrice.toLocaleString("vi-VN") : "---"} ₫
                        </div>
                      </div>
                    </div>

                    {/* Thể loại số SIM do AI phân loại */}
                    <div className="flex flex-col gap-1 text-xs pt-2 border-t border-blue-100/60">
                      <span className="font-bold text-[#001743] flex items-center gap-1.5 text-[11px]">
                        <Check size={12} className="text-emerald-600" />
                        <span>Thể loại số SIM (AI phân loại):</span>
                      </span>
                      <div className="flex flex-wrap gap-1.5 mt-0.5">
                        {aiValuationResult.detectedCategories && aiValuationResult.detectedCategories.length > 0 ? (
                          aiValuationResult.detectedCategories.map((c, i) => (
                            <span
                              key={i}
                              className="px-2.5 py-0.5 bg-white text-[#001743] border border-blue-200/80 rounded-full text-[11px] font-bold shadow-2xs"
                            >
                              {c}
                            </span>
                          ))
                        ) : (
                          <span className="px-2.5 py-0.5 bg-white text-slate-600 border border-slate-200 rounded-full text-[11px] font-medium">
                            SIM Phổ thông
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Dòng trạng thái đã điền & Accordion nhận định */}
                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-blue-100/60 text-[11px]">
                      <span className="text-emerald-700 font-bold flex items-center gap-1">
                        <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                        <span>Đã tự động điền vào ô định giá bên dưới</span>
                      </span>

                      {aiValuationResult.valuationReasoning && (
                        <button
                          type="button"
                          onClick={() => setShowAiAnalysisDetail(!showAiAnalysisDetail)}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 hover:text-blue-900 cursor-pointer transition-colors"
                        >
                          <span>{showAiAnalysisDetail ? "Thu gọn nhận định" : "Xem nhận định"}</span>
                          {showAiAnalysisDetail ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                        </button>
                      )}
                    </div>

                    {/* Accordion Content: Nhận định thẩm định */}
                    {showAiAnalysisDetail && aiValuationResult.valuationReasoning && (
                      <div className="mt-2 p-2.5 bg-white/90 rounded-[10px] border border-blue-100/70 animate-fadeIn">
                        <div className="text-[10px] font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                          <Sparkles size={11} className="text-[#E4011E]" />
                          <span>Chi tiết nhận định thẩm định:</span>
                        </div>
                        <ul className="space-y-1.5 text-[11px] text-slate-600">
                          {getReasoningBullets(aiValuationResult.valuationReasoning).map((bullet, idx) => (
                            <li key={idx} className="flex items-start gap-1.5 leading-relaxed">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0 mt-1.5" />
                              <span>{bullet}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* Field 4: Định giá ước tính * (Nâng cấp Shimmer + Skeleton + Pills Tactile) */}
                <div>
                  <div className="flex items-center justify-between mb-1.5 flex-wrap gap-1.5">
                    <label className="block text-xs font-bold text-[#001743]">
                      Định giá ước tính <span className="text-red-600">*</span>
                    </label>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {aiValuationResult && (
                        <button
                          type="button"
                          onClick={() => setShowAiDetailModal(true)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-blue-50 text-[#001743] hover:text-[#E4011E] border border-blue-200/80 rounded-full text-[10px] font-bold transition-all shadow-2xs cursor-pointer active:scale-95"
                          title="Mở xem chi tiết phân tích định giá"
                        >
                          <Sparkles size={11} className="text-[#E4011E]" />
                          <span>Chi tiết phân tích</span>
                        </button>
                      )}
                      {/* Nút Nhờ AI định giá: Gradient viền nhẹ + Shimmer effect */}
                      <button
                        type="button"
                        onClick={handleAiEstimateForNewSim}
                        disabled={loadingAiValuation}
                        className="relative overflow-hidden group inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-red-50 via-purple-50 to-blue-50 hover:from-red-100 hover:to-purple-100 border border-red-200/80 text-[#001743] rounded-full text-[11px] font-bold transition-all disabled:opacity-50 cursor-pointer shadow-2xs active:scale-95"
                      >
                        {/* Hiệu ứng tia sáng lướt qua (Shimmer effect) */}
                        <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/70 to-transparent pointer-events-none" />
                        {loadingAiValuation ? (
                          <>
                            <RefreshCw size={11} className="animate-spin text-[#E4011E]" />
                            <span>Đang phân tích...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles size={12} className="text-[#E4011E]" />
                            <span className="bg-gradient-to-r from-[#E4011E] to-[#7C3AED] bg-clip-text text-transparent">
                              {aiValuationResult ? "Định giá lại" : "Nhờ AI định giá"}
                            </span>
                          </>
                        )}
                      </button>
                    </div>
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

                  {/* Quick Add Price Pills: Bo tròn hoàn toàn (Pills), nền #F3F4F6, hover sang Đỏ Primary chữ trắng */}
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
                        className="px-3 py-1 bg-[#F3F4F6] hover:bg-[#E4011E] hover:text-white active:scale-95 text-slate-700 rounded-full text-[11px] font-semibold transition-all cursor-pointer shadow-2xs"
                      >
                        {chip.label}
                      </button>
                    ))}
                  </div>
                </div>


              </div>

              {/* Sticky Footer: Cố định ở đáy, không bị che khuất hay cuộn mất */}
              <div className="p-4 px-5 border-t border-slate-100 bg-white/95 backdrop-blur-xs flex items-center justify-end gap-2.5 shrink-0 shadow-[0_-4px_12px_rgba(0,0,0,0.03)] rounded-b-[20px]">
                <button
                  type="button"
                  onClick={handleCloseAddModal}
                  disabled={submittingSim}
                  className="px-5 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-full text-xs font-semibold transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={submittingSim}
                  className="px-6 py-2.5 bg-[#001743] hover:bg-[#00266B] text-white rounded-full text-xs font-bold shadow-sm cursor-pointer flex items-center gap-1.5 transition-all active:scale-95"
                >
                  {submittingSim && <RefreshCw size={13} className="animate-spin" />}
                  <span>{submittingSim ? "Đang lưu..." : "Lưu vào kho SIM"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── 3.1 Modal: Báo cáo chi tiết thẩm định AI ── */}
      {showAiDetailModal && aiValuationResult && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-[20px] w-full max-w-[540px] shadow-2xl border border-slate-100 animate-fade-up flex flex-col max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 pb-3.5 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2.5">
                <img src="/logo/S-Logo.png" alt="TrustSIM" className="w-7 h-7 object-contain shrink-0" />
                <div>
                  <h3 className="text-base font-black text-[#001743] tracking-tight m-0 flex items-center gap-2">
                    <span>Báo cáo thẩm định AI chuyên sâu</span>
                    <span className="px-2 py-0.5 bg-red-50 text-[#E4011E] rounded-full text-[10px] font-bold border border-red-100">
                      TrustSim AI
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400 m-0">
                    Số SIM: <span className="font-mono font-bold text-[#001743]">{formatPhoneNumber(aiValuationResult.phoneNumber || newSimNumber)}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAiDetailModal(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                aria-label="Đóng"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto flex-1 flex flex-col gap-4">
              {/* Hero Price Box */}
              <div className="p-4 bg-gradient-to-br from-red-50/60 via-purple-50/30 to-blue-50/50 rounded-[16px] border border-red-100/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="text-[11px] text-slate-500 font-medium">Mức giá AI đề xuất:</div>
                  <div className="text-2xl font-black text-[#E4011E] font-mono">
                    {aiValuationResult.suggestedPrice?.toLocaleString("vi-VN")} ₫
                  </div>
                  <div className="text-xs text-slate-600 mt-1 flex items-center gap-1.5 flex-wrap">
                    <span>Khoảng giá:</span>
                    <span className="font-mono font-bold text-[#001743]">
                      {aiValuationResult.minPrice ? aiValuationResult.minPrice.toLocaleString("vi-VN") : "---"} ₫
                      {" – "}
                      {aiValuationResult.maxPrice ? aiValuationResult.maxPrice.toLocaleString("vi-VN") : "---"} ₫
                    </span>
                  </div>
                </div>

                <div className="flex flex-col items-start sm:items-end gap-1.5 shrink-0">
                  {aiValuationResult.detectedRhythmName && (
                    <span className="px-3 py-1 bg-blue-100 text-blue-900 rounded-full text-xs font-bold">
                      {aiValuationResult.detectedRhythmName}
                    </span>
                  )}
                  {aiValuationResult.confidenceScore ? (
                    <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
                      <CheckCircle2 size={12} className="text-emerald-600" />
                      <span>Độ tin cậy: {Math.round(aiValuationResult.confidenceScore * 100)}%</span>
                    </span>
                  ) : null}
                </div>
              </div>

              {/* 3 Price Tiers Grid (Bán lẻ / P2P / Giá thợ) */}
              <div>
                <div className="text-xs font-bold text-[#001743] mb-2 flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-blue-600" />
                  <span>Tham chiếu giá theo từng phân khúc giao dịch</span>
                </div>
                <div className="grid grid-cols-3 gap-2.5">
                  <div className="p-3 bg-slate-50 rounded-[12px] border border-slate-100 text-center">
                    <div className="text-[10px] text-slate-400 font-medium">Giá bán lẻ (Retail)</div>
                    <div className="text-xs font-bold text-[#001743] font-mono mt-1">
                      {aiValuationResult.retailPrice
                        ? aiValuationResult.retailPrice.toLocaleString("vi-VN") + " ₫"
                        : (aiValuationResult.suggestedPrice * 1.15).toLocaleString("vi-VN") + " ₫"}
                    </div>
                  </div>
                  <div className="p-3 bg-blue-50/60 rounded-[12px] border border-blue-100/60 text-center">
                    <div className="text-[10px] text-blue-700 font-bold">Giá người dùng (P2P)</div>
                    <div className="text-xs font-extrabold text-[#E4011E] font-mono mt-1">
                      {aiValuationResult.p2pPrice
                        ? aiValuationResult.p2pPrice.toLocaleString("vi-VN") + " ₫"
                        : aiValuationResult.suggestedPrice.toLocaleString("vi-VN") + " ₫"}
                    </div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-[12px] border border-slate-100 text-center">
                    <div className="text-[10px] text-slate-400 font-medium">Giá thu mua đại lý</div>
                    <div className="text-xs font-bold text-slate-600 font-mono mt-1">
                      {aiValuationResult.dealerPrice
                        ? aiValuationResult.dealerPrice.toLocaleString("vi-VN") + " ₫"
                        : (aiValuationResult.suggestedPrice * 0.75).toLocaleString("vi-VN") + " ₫"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Chi tiết nhận định thẩm định (Bullet points) */}
              {aiValuationResult.valuationReasoning && (
                <div className="p-4 bg-slate-50/70 rounded-[14px] border border-slate-100">
                  <div className="text-xs font-bold text-[#001743] mb-2 flex items-center gap-1.5">
                    <Sparkles size={13} className="text-[#E4011E]" />
                    <span>Lý giải định giá của mô hình AI</span>
                  </div>
                  <ul className="space-y-2 text-xs text-slate-600 leading-relaxed">
                    {getReasoningBullets(aiValuationResult.valuationReasoning).map((bullet, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#E4011E] shrink-0 mt-1.5" />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Phân tích phong thủy nếu có */}
              {aiValuationResult.fengShuiAnalysis && (
                <div className="p-3.5 bg-amber-50/50 rounded-[14px] border border-amber-100/50 text-xs text-amber-950 leading-relaxed">
                  <div className="font-bold text-amber-900 mb-1 flex items-center gap-1.5">
                    <Sparkles size={12} className="text-amber-600" />
                    <span>Ý nghĩa phong thủy & ngũ hành:</span>
                  </div>
                  <p className="m-0 text-slate-600">{aiValuationResult.fengShuiAnalysis}</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 px-5 border-t border-slate-100 bg-white flex items-center justify-between gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setShowAiDetailModal(false)}
                className="px-5 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-full text-xs font-semibold transition-colors cursor-pointer"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={() => {
                  if (aiValuationResult.suggestedPrice) {
                    const price = Math.round(aiValuationResult.suggestedPrice);
                    setNewEstimatedValueRaw(price);
                    setNewEstimatedValueFormatted(price.toLocaleString("vi-VN"));
                  }
                  setShowAiDetailModal(false);
                }}
                className="px-6 py-2.5 bg-[#001743] hover:bg-[#00266B] text-white rounded-full text-xs font-bold shadow-sm cursor-pointer flex items-center gap-1.5 transition-all active:scale-95"
              >
                <Check size={14} />
                <span>Áp dụng mức giá {aiValuationResult.suggestedPrice?.toLocaleString("vi-VN")} ₫</span>
              </button>
            </div>
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

      {/* ── 5. Modal: Xác thực quyền sở hữu SIM (2 bước: SMS OTP + Cổng Viễn thông) ── */}
      {selectedSimForVerify && (
        <VerifySimOwnershipModal
          sim={selectedSimForVerify}
          isEkycVerified={isEkycVerified}
          onClose={() => setSelectedSimForVerify(null)}
          onSuccess={() => {
            setSelectedSimForVerify(null);
            fetchSimsFromDb();
          }}
          onNavigateToEkyc={onNavigateToEkyc}
          onOpenCreateAuction={(s: OwnedSim) => {
            setSelectedSimForVerify(null);
            handleOpenCreateAuction(s);
          }}
          addToast={addToast}
        />
      )}

      {/* ── 6. Modal: Xem chi tiết số SIM ── */}
      {selectedSimForDetail && (
        <SimDetailModal
          sim={selectedSimForDetail}
          onClose={() => setSelectedSimForDetail(null)}
          onOpenCreateAuction={(s: OwnedSim) => {
            setSelectedSimForDetail(null);
            handleOpenCreateAuction(s);
          }}
          onOpenVerify={(s: OwnedSim) => {
            setSelectedSimForDetail(null);
            setSelectedSimForVerify(s);
          }}
          onOpenUpdate={(s: OwnedSim) => {
            setSelectedSimForDetail(null);
            setSelectedSimForUpdate(s);
          }}
          onOpenDelete={(s: OwnedSim) => {
            setSelectedSimForDetail(null);
            setSelectedSimForDelete(s);
          }}
          onSimUpdated={(updatedSim: OwnedSim) => {
            setOwnedSims((prev) =>
              prev.map((item) => (item.id === updatedSim.id ? updatedSim : item))
            );
            setSelectedSimForDetail(updatedSim);
          }}
          addToast={addToast}
        />
      )}

      {/* ── 7. Modal: Chỉnh sửa thông tin SIM ── */}
      {selectedSimForUpdate && (
        <UpdateOwnedSimModal
          sim={selectedSimForUpdate}
          formatRhythmsList={formatRhythmsList}
          categoriesList={categoriesList}
          onClose={() => setSelectedSimForUpdate(null)}
          onSuccess={() => {
            setSelectedSimForUpdate(null);
            fetchSimsFromDb();
          }}
          addToast={addToast}
        />
      )}

      {/* ── 8. Modal: Xác nhận xóa SIM ── */}
      {selectedSimForDelete && (
        <DeleteSimConfirmModal
          sim={selectedSimForDelete}
          onClose={() => setSelectedSimForDelete(null)}
          onSuccess={() => {
            setSelectedSimForDelete(null);
            fetchSimsFromDb();
          }}
          addToast={addToast}
        />
      )}
    </div>
  );
}
