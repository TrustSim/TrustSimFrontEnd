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
  AlertTriangle,
  HelpCircle,
  CheckCircle2,
  Eye,
  Pencil,
  Trash2,
  KeyRound,
} from "lucide-react";
import { ToastMessage } from "@/components/ui/Toast";
import { OwnedSim } from "../../types/types";
import CreateAuctionWizardModal from "./CreateAuctionWizardModal";
import VerifySimOwnershipModal from "./VerifySimOwnershipModal";
import SimDetailModal from "./SimDetailModal";
import UpdateOwnedSimModal from "./UpdateOwnedSimModal";
import DeleteSimConfirmModal from "./DeleteSimConfirmModal";
import AiValuationModal from "./AiValuationModal";
import { aiValuationService, SimValuationDto } from "@/services/aiValuationService";
import {
  getMySims,
  registerSim,
  sendSimOwnershipOtp,
  verifySimOwnership,
  updateSim,
  getFormatRhythms,
  getCarrierColor,
  formatPhoneNumber,
  FormatRhythmItemDto,
} from "@/services/simService";
import { getCarriers, SimCarrierDto } from "@/services/carrierService";
import { getCategories, SimCategoryDto } from "@/services/categoryService";
import { auctionService } from "@/services/auctionService";

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
  onOpenAiValuation,
}: {
  sim: OwnedSim;
  onOpenAuction: (s: OwnedSim) => void;
  onOpenVerify: (s: OwnedSim) => void;
  onOpenDetail: (s: OwnedSim) => void;
  onOpenUpdate: (s: OwnedSim) => void;
  onOpenDelete: (s: OwnedSim) => void;
  onOpenAiValuation: (s: OwnedSim) => void;
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

        {/* ── Top Header: Microchip + Carrier Title + Verification Badge ── */}
        <div className="flex items-center justify-between relative z-10 gap-2 mb-1">
          <div className="flex items-center gap-2.5 min-w-0">
            <SimMicrochip />
            <div className="flex flex-col justify-center min-w-0">
              <span className="text-white font-black text-[13px] uppercase tracking-[0.14em] truncate block font-inter drop-shadow-xs">
                {sim.carrier}
              </span>
              <span className="text-[10.5px] text-slate-400 font-medium tracking-wide truncate mt-0.5">
                {sim.simType} • {sim.acquiredFrom === "PLATFORM_AUCTION" ? "Trúng đấu giá" : "Cá nhân"}
              </span>
            </div>
          </div>

          {/* Verification Badge safely padded from chamfered top-right corner */}
          <div className="mr-6 shrink-0">
            {isOwnerVerified ? (
              <span className="shrink-0 whitespace-nowrap inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10.5px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/35 backdrop-blur-md shadow-xs">
                <Check size={11} strokeWidth={2.5} /> Chính chủ
              </span>
            ) : (
              <span className="shrink-0 whitespace-nowrap inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10.5px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/35 backdrop-blur-md shadow-xs">
                <Clock size={11} strokeWidth={2} /> Chưa xác thực
              </span>
            )}
          </div>
        </div>

        {/* ── Center: Luxury SIM Number Display & Format Rhythm ── */}
        <div className="relative z-10 py-2.5 text-center">
          {renderHeroSimNumber(sim.simNumber)}
          {sim.formatRhythmName && (
            <div className="mt-1">
              <span className="inline-flex items-center px-3 py-0.5 rounded-full text-[10.5px] font-medium tracking-wide bg-yellow-500/10 text-slate-300 border border-yellow-500/30 backdrop-blur-xs shadow-xs">
                Nhịp: <strong className="text-yellow-300 font-semibold ml-1">{sim.formatRhythmName}</strong>
              </span>
            </div>
          )}
        </div>

        {/* ── Bottom: Estimated Value & Tone-sur-tone Action Button ── */}
        <div className="flex flex-col relative z-10 pt-3 border-t border-white/10 gap-2.5">
          <div className="flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[9.5px] uppercase font-semibold text-[#9CA3AF] block tracking-wider font-mono">
                Định giá ước tính
              </span>

            </div>
            <div className="flex items-baseline gap-0.5 font-mono tabular-nums whitespace-nowrap">
              {sim.estimatedValue > 0 ? (
                <>
                  <span className="text-sm sm:text-[15px] font-extrabold text-yellow-400">
                    {sim.estimatedValue.toLocaleString("vi-VN")}
                  </span>
                  <span className="text-xs font-bold text-yellow-400">₫</span>
                </>
              ) : (
                <span className="text-xs font-medium text-slate-400 italic">
                  Chưa định giá
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-1.5 flex-wrap w-full pt-0.5">
            {/* Quick Action Icons: View, Edit, Delete, AI Valuation */}
            <button
              type="button"
              onClick={() => onOpenAiValuation(sim)}
              className="p-1.5 rounded-full bg-violet-500/20 hover:bg-violet-500/35 text-violet-300 hover:text-white border border-violet-400/30 transition-colors cursor-pointer"
              title="Nhờ AI thẩm định giá"
            >
              <Sparkles size={13} className="text-yellow-400" />
            </button>
            <button
              type="button"
              onClick={() => onOpenDetail(sim)}
              className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Xem chi tiết số SIM"
            >
              <Eye size={13} />
            </button>
            <button
              type="button"
              onClick={() => onOpenUpdate(sim)}
              className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Chỉnh sửa thông tin SIM"
            >
              <Pencil size={13} />
            </button>
            <button
              type="button"
              onClick={() => onOpenDelete(sim)}
              className="p-1.5 rounded-full bg-white/10 hover:bg-rose-500/25 text-slate-300 hover:text-rose-300 transition-colors cursor-pointer"
              title="Xóa SIM khỏi kho"
            >
              <Trash2 size={13} />
            </button>

            {sim.hasActiveAuction ? (
              <Link
                href={
                  sim.activeAuctionId
                    ? `/auctions/${sim.activeAuctionId}`
                    : `/auctions?keyword=${sim.simNumber.replace(/\D/g, "")}`
                }
                className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-white/10 hover:bg-white/15 border border-white/20 text-white transition-colors shadow-2xs whitespace-nowrap flex-1 min-w-[132px]"
              >
                <span>Đang đấu giá</span>
                <ArrowRight size={12} />
              </Link>
            ) : isOwnerVerified ? (
              <button
                type="button"
                onClick={() => onOpenAuction(sim)}
                style={{
                  background: "linear-gradient(135deg, #FDE047 0%, #EAB308 50%, #CA8A04 100%)",
                  boxShadow: "0 4px 14px rgba(234, 179, 8, 0.35)",
                }}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black text-[#001743] hover:brightness-105 active:scale-95 transition-all cursor-pointer whitespace-nowrap flex-1 min-w-[132px]"
              >
                <Gavel size={12} className="text-[#001743]" strokeWidth={2.2} />
                <span>Mở đấu giá</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onOpenVerify(sim)}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 hover:border-yellow-400 transition-colors cursor-pointer whitespace-nowrap flex-1 min-w-[132px]"
                title="Xác thực chính chủ với Cổng viễn thông Nhà mạng"
              >
                <ShieldCheck size={12} />
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

  // Modal: Thêm SIM cá nhân & Quy trình xác thực OTP trực tiếp
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addSimStep, setAddSimStep] = useState<1 | 2>(1);
  const [newSimNumber, setNewSimNumber] = useState("");
  const [selectedCarrier, setSelectedCarrier] = useState<SimCarrierDto | null>(null);
  const [newSimType, setNewSimType] = useState<"Trả trước" | "Trả sau">("Trả trước");
  const [selectedFormatRhythmId, setSelectedFormatRhythmId] = useState<string>("");
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [addSimOtp, setAddSimOtp] = useState<string>("");
  const [addSimCooldown, setAddSimCooldown] = useState<number>(0);
  const [addSimError, setAddSimError] = useState<string | null>(null);
  const [sendingOtp, setSendingOtp] = useState<boolean>(false);
  const [submittingSim, setSubmittingSim] = useState(false);

  // Modal: Tạo phiên đấu giá
  const [selectedSimForAuction, setSelectedSimForAuction] = useState<OwnedSim | null>(null);
  const [isCreateAuctionOpen, setIsCreateAuctionOpen] = useState(false);

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
          hasActiveAuction: item.simStatus === "IN_AUCTION" || Boolean(item.activeAuctionId),
          activeAuctionId: item.activeAuctionId,
        }));

        // Tra cứu bổ sung nếu SIM đang ở trạng thái đấu giá mà chưa có activeAuctionId
        const needingAuctionId = mapped.filter((s) => s.hasActiveAuction && !s.activeAuctionId);
        if (needingAuctionId.length > 0) {
          try {
            const auctionsRes = await auctionService.getAuctions({ myAuctions: true, pageSize: 50 });
            if (auctionsRes.items && auctionsRes.items.length > 0) {
              mapped.forEach((sim) => {
                if (sim.hasActiveAuction && !sim.activeAuctionId) {
                  const cleanPhone = sim.simNumber.replace(/\D/g, "");
                  const matched = auctionsRes.items.find(
                    (a) =>
                      a.simNumberId === sim.id ||
                      (a.simPhoneNumber && a.simPhoneNumber.replace(/\D/g, "") === cleanPhone)
                  );
                  if (matched) {
                    sim.activeAuctionId = matched.id;
                  }
                }
              });
            }
          } catch (e) {
            console.warn("Không thể tải fallback myAuctions:", e);
          }
        }

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
    if (addSimError) setAddSimError(null);
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

  // Modal Thẩm định AI độc lập cho từng số SIM
  const [selectedSimForAiValuation, setSelectedSimForAiValuation] = useState<OwnedSim | null>(null);

  // Đếm ngược thời gian gửi lại mã OTP (Cooldown 60s)
  useEffect(() => {
    if (addSimCooldown <= 0) return;
    const timer = setInterval(() => {
      setAddSimCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [addSimCooldown]);

  const handleOpenAddModal = () => {
    setIsAddModalOpen(true);
    setAddSimStep(1);
    setAddSimOtp("");
    setAddSimCooldown(0);
    setAddSimError(null);
  };

  const handleCloseAddModal = () => {
    setIsAddModalOpen(false);
    setAddSimStep(1);
    setAddSimOtp("");
    setAddSimCooldown(0);
    setAddSimError(null);
  };

  // ─── 4. Quy trình Thêm SIM + Xác thực OTP trực tiếp ─────────────────────────

  // Bước 1: Gửi mã OTP xác thực qua SMS tới số SIM người dùng
  const handleSendAddSimOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanNumber = newSimNumber.trim().replace(/\D/g, "");
    if (!cleanNumber || cleanNumber.length !== 10 || !cleanNumber.startsWith("0")) {
      addToast({
        type: "error",
        title: "Số SIM không hợp lệ",
        message: "Số điện thoại phải bao gồm đúng 10 chữ số và bắt đầu bằng số 0 (VD: 0912 345 678).",
      });
      return;
    }

    if (!isEkycVerified) {
      addToast({
        type: "warning",
        title: "Chưa xác thực tài khoản",
        message: "Theo quy định viễn thông, bạn cần hoàn tất xác thực danh tính eKYC tài khoản trước khi đối soát SIM.",
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

    setSendingOtp(true);
    try {
      const res = await sendSimOwnershipOtp(cleanNumber);
      setAddSimCooldown(res.cooldownSeconds || 60);
      setAddSimStep(2);
      addToast({
        type: "success",
        title: "Đã gửi mã OTP qua SMS",
        message: res.message || `Mã OTP đã được gửi tới số SIM ${formatPhoneNumber(cleanNumber)}. Vui lòng kiểm tra tin nhắn.`,
      });
    } catch (err: any) {
      const errorMsg = err.message || "Đã xảy ra lỗi khi gửi mã OTP. Vui lòng kiểm tra lại số điện thoại.";
      const isAlreadyOwned =
        err.status === 409 ||
        errorMsg.toLowerCase().includes("đã được đăng ký") ||
        errorMsg.toLowerCase().includes("thuộc sở hữu");

      setAddSimError(errorMsg);
      addToast({
        type: "error",
        title: isAlreadyOwned ? "Số SIM đã được đăng ký" : "Không thể gửi OTP",
        message: errorMsg,
      });
    } finally {
      setSendingOtp(false);
    }
  };

  // Bước 2: Xác thực mã OTP SMS và đối soát quyền sở hữu với Cổng viễn thông Nhà mạng
  const handleVerifyAndAddSim = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNumber = newSimNumber.trim().replace(/\D/g, "");
    const cleanOtp = addSimOtp.trim();

    if (!cleanOtp || cleanOtp.length < 4) {
      addToast({
        type: "warning",
        title: "Mã OTP chưa đủ",
        message: "Vui lòng nhập đầy đủ mã xác thực OTP nhận được từ tin nhắn SMS.",
      });
      return;
    }

    const carrierToUse = selectedCarrier || carriersList[0];

    setSubmittingSim(true);
    try {
      // 1. Gọi API Backend xác thực OTP và đối soát Cổng viễn thông Nhà mạng
      const verifyRes = await verifySimOwnership(cleanNumber, cleanOtp);

      if (!verifyRes.isSuccess) {
        throw new Error(verifyRes.message || "Xác thực quyền sở hữu SIM không thành công.");
      }

      // 2. Xác định nhịp định dạng và thể loại
      const normalRhythm = formatRhythmsList.find(
        (r) => r.formatRhythmName.toLowerCase().includes("phổ thông") || (r.value && r.value.toUpperCase() === "NORMAL")
      ) || formatRhythmsList[0];

      const normalCategory = categoriesList.find(
        (c) => c.categoryName.toLowerCase().includes("phổ thông") || c.categoryCode === "SIM_THUONG"
      );

      const rhythmIdToUse = selectedFormatRhythmId || normalRhythm?.id;
      const categoryIdsToUse = selectedCategoryIds.length > 0
        ? selectedCategoryIds
        : normalCategory ? [normalCategory.id] : undefined;

      const rhythmNameToUse = selectedFormatRhythmId
        ? (formatRhythmsList.find((r) => r.id === selectedFormatRhythmId)?.formatRhythmName || "Nhịp Phổ thông")
        : (normalRhythm?.formatRhythmName || "Nhịp Phổ thông");

      const categoryNamesToUse = selectedCategoryIds.length > 0
        ? categoriesList.filter((c) => selectedCategoryIds.includes(c.id)).map((c) => c.categoryName)
        : [normalCategory?.categoryName || "SIM Phổ thông"];

      // 3. Cập nhật nhịp và thể loại cho số SIM vừa được tạo trong Database Backend
      if (verifyRes.simNumberId) {
        try {
          await updateSim(verifyRes.simNumberId, {
            price: 0,
            formatRhythmId: rhythmIdToUse,
            categoryIds: categoryIdsToUse,
          });
        } catch (updateErr: any) {
          console.warn("Lưu nhịp bổ sung:", updateErr.message);
        }
      }

      // 4. Cập nhật state giao diện hiển thị ngay với trạng thái VERIFIED_OWNER
      const newSimItem: OwnedSim = {
        id: verifyRes.simNumberId || `sim-${Date.now()}`,
        simNumber: formatPhoneNumber(cleanNumber),
        carrier: carrierToUse?.carrierName || verifyRes.carrierName || "Viettel",
        carrierLogo: carrierToUse?.logoImg || "",
        carrierCode: carrierToUse?.carrierCode || verifyRes.carrierCode || "",
        formatRhythmId: rhythmIdToUse,
        formatRhythmName: rhythmNameToUse,
        categoryNames: categoryNamesToUse,
        simType: newSimType,
        acquiredFrom: "PERSONAL_IMPORT",
        ownershipStatus: "VERIFIED_OWNER",
        estimatedValue: 0,
        createdDate: new Date().toLocaleDateString("vi-VN"),
      };

      setOwnedSims((prev) => [newSimItem, ...prev.filter((s) => s.simNumber.replace(/\D/g, "") !== cleanNumber)]);
      handleCloseAddModal();
      setNewSimNumber("");
      setSelectedCategoryIds([]);
      setSelectedFormatRhythmId("");

      addToast({
        type: "success",
        title: "Xác thực chính chủ thành công!",
        message: `Số SIM ${formatPhoneNumber(cleanNumber)} đã được đối soát chính chủ thành công với Cổng viễn thông và lưu vào kho SIM của bạn.`,
      });

      // Tải lại danh sách từ Database thật
      await fetchSimsFromDb();
    } catch (err: any) {
      const errorMsg = err.message || "Mã OTP không chính xác hoặc thông tin thuê bao không khớp với CCCD của bạn.";
      const isAlreadyOwned =
        err.status === 409 ||
        errorMsg.toLowerCase().includes("đã được đăng ký") ||
        errorMsg.toLowerCase().includes("thuộc sở hữu");

      addToast({
        type: "error",
        title: isAlreadyOwned ? "Số SIM đã được đăng ký" : "Xác thực SIM thất bại",
        message: errorMsg,
      });
    } finally {
      setSubmittingSim(false);
    }
  };

  // ─── 5. Handle Open Create Auction ───────────────────────────────────────
  const handleOpenCreateAuction = (sim?: OwnedSim) => {
    if (sim && sim.ownershipStatus !== "VERIFIED_OWNER") {
      addToast({
        type: "error",
        title: "Chưa đủ điều kiện mở đấu giá",
        message: "Chỉ SIM đã được xác thực chính chủ mới có thể tạo phiên đấu giá trên sàn.",
      });
      return;
    }
    setSelectedSimForAuction(sim || null);
    setIsCreateAuctionOpen(true);
  };

  return (
    <div className="flex flex-col gap-5">
      {/* ── 1. Header Toolbar & View Mode Toggle ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-extrabold text-[#001743] flex items-center gap-2 m-0 tracking-tight">
            Kho SIM sở hữu của bạn
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Quản lý danh sách SIM cá nhân và SIM trúng đấu giá trực tiếp từ cơ sở dữ liệu.
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap sm:flex-nowrap shrink-0">
          {/* Segmented Control Toggle: Dạng bảng vs Thẻ SIM */}
          <div className="inline-flex p-1 bg-slate-100/90 rounded-full border border-slate-200/80 shadow-2xs gap-1 shrink-0">
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                viewMode === "table"
                  ? "bg-white text-[#001743] shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
              title="Chuyển sang chế độ xem bảng chi tiết"
            >
              <TableIcon size={14} strokeWidth={2} />
              <span>Dạng bảng</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                viewMode === "grid"
                  ? "bg-[#001743] text-white shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
              title="Chuyển sang chế độ xem thẻ SIM Luxury độc đáo"
            >
              <LayoutGrid size={14} strokeWidth={2} />
              <span>Thẻ SIM</span>
            </button>
          </div>

          {/* Nút Làm mới đồng bộ kích thước chuẩn */}
          <button
            type="button"
            onClick={fetchSimsFromDb}
            disabled={loading}
            className="h-[36px] px-3.5 inline-flex items-center gap-1.5 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-700 disabled:opacity-60 rounded-full text-xs font-bold shadow-2xs transition-all cursor-pointer shrink-0 whitespace-nowrap active:scale-95"
            title="Làm mới dữ liệu từ Database"
          >
            <RefreshCw size={13} className={loading ? "animate-spin text-[#001743]" : "text-slate-500"} />
            <span>Làm mới</span>
          </button>

          {/* Nút Thêm SIM cá nhân */}
          <button
            type="button"
            onClick={handleOpenAddModal}
            className="h-[36px] px-4 inline-flex items-center gap-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-[#001743] rounded-full text-xs font-bold shadow-2xs hover:border-[#001743] transition-all cursor-pointer active:scale-95 shrink-0 whitespace-nowrap"
          >
            <Plus size={15} strokeWidth={2.5} />
            <span>Thêm SIM cá nhân</span>
          </button>

          {/* Nút Mở phiên đấu giá */}
          <button
            type="button"
            onClick={() => handleOpenCreateAuction()}
            className="h-[36px] px-4 inline-flex items-center gap-1.5 bg-[#001743] hover:bg-[#002875] text-white rounded-full text-xs font-bold shadow-md shadow-navy-950/15 hover:shadow-lg transition-all cursor-pointer active:scale-95 shrink-0 whitespace-nowrap"
            title="Tạo phiên đấu giá cho số SIM đã xác thực"
          >
            <Gavel size={14} strokeWidth={2.2} />
            <span>Tạo phiên đấu giá</span>
          </button>
        </div>
      </div>

      {/* ── 2. Content: Table View vs Grid Hero View ── */}
      {ownedSims.length === 0 ? (
        <div className="bg-white border border-slate-100/90 rounded-[28px] p-12 text-center shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <div className="w-14 h-14 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <Smartphone size={24} />
          </div>
          <h3 className="text-sm font-bold text-[#001743]">Chưa có số SIM nào trong kho</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Bạn chưa có số SIM cá nhân nào được thêm vào kho. Hãy bấm nút "Thêm SIM cá nhân" ở trên để bắt đầu.
          </p>
          <button
            type="button"
            onClick={handleOpenAddModal}
            className="mt-4 inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#001743] hover:bg-[#002875] text-white text-xs font-bold rounded-full shadow-md shadow-navy-950/15 transition-all active:scale-95 cursor-pointer"
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
              onOpenAiValuation={(s) => setSelectedSimForAiValuation(s)}
            />
          ))}
        </div>
      ) : (
        /* ════ CHẾ ĐỘ 2: TABLE VIEW (CHUẨN BẢNG FINTECH) ════ */
        <div className="bg-white border border-slate-100/90 rounded-[28px] overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] animate-fade-up">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-600 font-bold">
                  <th className="py-3.5 px-5">Số SIM</th>
                  <th className="py-3.5 px-5">Nhà mạng & Gói</th>
                  <th className="py-3.5 px-5">Nguồn gốc</th>
                  <th className="py-3.5 px-5">Xác thực chính chủ</th>
                  <th className="py-3.5 px-5">Định giá ước tính</th>
                  <th className="py-3.5 px-5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {ownedSims.map((sim) => {
                  const isOwnerVerified = sim.ownershipStatus === "VERIFIED_OWNER";
                  return (
                    <tr key={sim.id} className="hover:bg-slate-50/70 transition-colors h-16">
                      {/* Cột 1: Số SIM */}
                      <td className="py-3.5 px-5">
                        <div className="font-extrabold text-sm text-[#001743] font-mono tabular-nums">
                          {sim.simNumber}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">Ngày thêm: {sim.createdDate}</div>
                      </td>

                      {/* Cột 2: Nhà mạng với Logo Vuông */}
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-2.5">
                          <CarrierSquareLogo name={sim.carrier} logo={sim.carrierLogo} size={28} />
                          <div>
                            <div className="font-bold text-xs text-[#001743]">{sim.carrier}</div>
                            <div className="text-[11px] text-slate-500">{sim.simType}</div>
                          </div>
                        </div>
                      </td>

                      {/* Cột 3: Nguồn gốc */}
                      <td className="py-3.5 px-5">
                        {sim.acquiredFrom === "PLATFORM_AUCTION" ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            Trúng đấu giá sàn
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10.5px] font-semibold bg-slate-100 text-slate-600">
                            Tự thêm cá nhân
                          </span>
                        )}
                      </td>

                      {/* Cột 4: Xác thực chính chủ */}
                      <td className="py-3.5 px-5">
                        {isOwnerVerified ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <Check size={12} strokeWidth={2.5} /> Đã xác thực chính chủ
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            <Clock size={12} /> Chưa xác thực chính chủ
                          </span>
                        )}
                      </td>

                      {/* Cột 5: Định giá ước tính */}
                      <td className="py-3.5 px-5">
                        <div className="font-bold text-[#001743] font-mono tabular-nums text-xs">
                          {sim.estimatedValue > 0 ? (
                            `${sim.estimatedValue.toLocaleString("vi-VN")} ₫`
                          ) : (
                            <span className="text-slate-400 font-normal italic">Chưa định giá</span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedSimForAiValuation(sim)}
                          className="inline-flex items-center gap-1 mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold text-violet-700 bg-violet-50 hover:bg-violet-100 border border-violet-200 transition-colors cursor-pointer"
                          title="Thẩm định giá với AI"
                        >
                          <Sparkles size={10} className="text-violet-600" />
                          <span>Thẩm định AI</span>
                        </button>
                      </td>

                      {/* Cột 6: Thao tác */}
                      <td className="py-3.5 px-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedSimForAiValuation(sim)}
                            className="p-1.5 rounded-full border border-violet-200 hover:bg-violet-50 text-violet-600 transition-colors cursor-pointer"
                            title="Thẩm định giá với AI"
                          >
                            <Sparkles size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedSimForDetail(sim)}
                            className="p-1.5 rounded-full border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
                            title="Xem chi tiết SIM"
                          >
                            <Eye size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedSimForUpdate(sim)}
                            className="p-1.5 rounded-full border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
                            title="Chỉnh sửa thông tin SIM"
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedSimForDelete(sim)}
                            className="p-1.5 rounded-full border border-rose-200 hover:bg-rose-50 text-rose-600 transition-colors cursor-pointer"
                            title="Xóa SIM"
                          >
                            <Trash2 size={13} />
                          </button>

                          {sim.hasActiveAuction ? (
                            <Link
                              href={
                                sim.activeAuctionId
                                  ? `/auctions/${sim.activeAuctionId}`
                                  : `/auctions?keyword=${sim.simNumber.replace(/\D/g, "")}`
                              }
                              className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-full text-xs font-bold border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors"
                            >
                              <span>Đang đấu giá</span>
                              <ArrowRight size={12} />
                            </Link>
                          ) : isOwnerVerified ? (
                            <button
                              type="button"
                              onClick={() => handleOpenCreateAuction(sim)}
                              className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-full text-xs font-bold bg-[#001743] hover:bg-[#002875] text-white shadow-xs transition-colors cursor-pointer"
                            >
                              <Gavel size={12} />
                              <span>Mở đấu giá</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setSelectedSimForVerify(sim)}
                              className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-colors cursor-pointer"
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
        <div className="profile-modal-backdrop fixed inset-0 z-[9999] flex items-center justify-center bg-black/45 backdrop-blur-sm p-4 animate-fade-in">
          <div className="profile-modal-panel bg-white rounded-[20px] w-full max-w-[500px] shadow-2xl border border-slate-100 animate-fade-up flex flex-col max-h-[90vh] overflow-hidden">
            {/* Header Modal - Cố định ở đỉnh */}
            <div className="flex items-center justify-between p-5 pb-3.5 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2.5">
                <img src="/logo/S-Logo.png" alt="TrustSIM" className="w-7 h-7 object-contain shrink-0" />
                <div>
                  <h3 className="text-base font-black text-[#001743] tracking-tight m-0">
                    {addSimStep === 1 ? "Thêm SIM cá nhân vào kho" : "Xác thực OTP chính chủ"}
                  </h3>
                  <span className="text-[11px] text-slate-400 font-medium">
                    {addSimStep === 1 ? "Bước 1/2: Nhập thông tin & Định giá" : "Bước 2/2: Đối soát Cổng viễn thông Nhà mạng"}
                  </span>
                </div>
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

            {addSimStep === 1 ? (
              /* Bước 1: Nhập thông tin SIM & Định giá -> Gửi mã OTP */
              <form onSubmit={handleSendAddSimOtp} className="flex flex-col flex-1 min-h-0 overflow-hidden">
                {/* Vùng nội dung cuộn (Scrollable Form Body) */}
                <div className="p-5 pb-16 overflow-y-auto flex-1 flex flex-col gap-4 scroll-smooth">
                  {/* Cảnh báo eKYC nếu tài khoản chưa xác thực */}
                  {!isEkycVerified && (
                    <div className="p-3.5 bg-amber-50/70 rounded-[14px] border border-amber-200/70 flex flex-col gap-2.5">
                      <div className="flex items-start gap-2.5 text-amber-900 text-xs">
                        <AlertTriangle size={17} className="text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <strong>Yêu cầu xác thực tài khoản (eKYC):</strong>
                          <p className="mt-0.5 text-amber-800 text-[11.5px] leading-relaxed">
                            Theo quy định quản lý viễn thông, bạn cần hoàn tất xác thực danh tính cá nhân (CCCD) trên TrustSIM trước khi thêm và đối soát quyền sở hữu SIM.
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          handleCloseAddModal();
                          onNavigateToEkyc();
                        }}
                        className="w-full py-2 bg-[#001743] hover:bg-[#00266B] text-white rounded-full text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
                      >
                        <ShieldCheck size={13} />
                        <span>Đến trang xác thực eKYC ngay</span>
                      </button>
                    </div>
                  )}

                  {/* Field 1: Số điện thoại SIM * */}
                  <div className="shrink-0">
                    <label className="block text-xs font-bold text-[#001743] mb-1.5">
                      Số điện thoại SIM <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="tel"
                      placeholder="Ví dụ: 0912 345 678"
                      value={newSimNumber}
                      onChange={(e) => handleSimNumberInput(e.target.value)}
                      className={`w-full text-xs p-3 border rounded-[12px] font-mono font-bold text-[#001743] focus:ring-2 focus:outline-none transition-all ${addSimError
                        ? "border-red-400 bg-red-50/20 focus:border-red-500 focus:ring-red-500/10"
                        : "border-slate-200 focus:border-[#001743] focus:ring-[#001743]/10"
                        }`}
                      required
                    />
                    {addSimError ? (
                      <div className="p-3 mt-2 bg-rose-50 rounded-[12px] border border-rose-200 text-rose-800 text-xs flex items-start gap-2 animate-fadeIn">
                        <AlertTriangle size={15} className="text-rose-600 shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <strong className="block text-rose-900 font-bold mb-0.5">Thông báo:</strong>
                          <span>{addSimError}</span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-400 mt-1">
                        Nhập đúng 10 chữ số bắt đầu bằng số 0. Hệ thống sẽ tự động nhận diện nhà mạng tương ứng.
                      </p>
                    )}
                  </div>

                  {/* Field 2 & 3: Nhà mạng * & Loại thuê bao * */}
                  <div className="grid grid-cols-2 gap-3 shrink-0">
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


                </div>

                {/* Sticky Footer - Bước 1 */}
                <div className="p-4 px-5 border-t border-slate-100 bg-white/95 backdrop-blur-xs flex items-center justify-end gap-2.5 shrink-0 shadow-[0_-4px_12px_rgba(0,0,0,0.03)] rounded-b-[20px]">
                  <button
                    type="button"
                    onClick={handleCloseAddModal}
                    disabled={sendingOtp}
                    className="px-5 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-full text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    disabled={sendingOtp || !isEkycVerified || !newSimNumber.trim()}
                    className="px-6 py-2.5 bg-[#001743] hover:bg-[#00266B] text-white rounded-full text-xs font-bold shadow-sm cursor-pointer flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
                  >
                    {sendingOtp ? (
                      <>
                        <RefreshCw size={13} className="animate-spin" />
                        <span>Đang gửi mã OTP...</span>
                      </>
                    ) : (
                      <>
                        <KeyRound size={13} />
                        <span>Tiếp tục</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              /* Bước 2: Xác thực mã OTP SMS & Đối soát Cổng viễn thông Nhà mạng */
              <form onSubmit={handleVerifyAndAddSim} className="flex flex-col flex-1 min-h-0 overflow-hidden">
                <div className="p-5 pb-16 overflow-y-auto flex-1 flex flex-col gap-4">
                  {/* Thẻ thông tin SIM */}
                  <div className="p-3.5 bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-slate-50 rounded-[14px] border border-blue-100/60 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-white shadow-2xs border border-blue-100 flex items-center justify-center text-[#001743]">
                        <Smartphone size={20} />
                      </div>
                      <div>
                        <div className="font-extrabold text-base text-[#001743] font-mono tracking-wide">
                          {formatPhoneNumber(newSimNumber)}
                        </div>
                        <div className="text-[11px] text-slate-500 font-medium">
                          {selectedCarrier?.carrierName || "Nhà mạng"} • {newSimType}
                        </div>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 bg-amber-100/80 text-amber-800 rounded-full text-[10px] font-bold">
                      Chờ xác thực
                    </span>
                  </div>

                  {/* Hộp thông báo */}
                  <div className="p-3 bg-blue-50/60 rounded-[12px] text-xs text-blue-900 leading-relaxed flex items-center gap-2 border border-blue-100/60">
                    <Clock size={16} className="text-blue-600 shrink-0" />
                    <span>
                      Mã xác thực OTP 6 chữ số đã được gửi qua SMS tới số <strong>{formatPhoneNumber(newSimNumber)}</strong>.
                    </span>
                  </div>

                  {/* Nhập mã OTP */}
                  <div>
                    <label className="block text-xs font-bold text-[#001743] mb-1.5 text-center">
                      Nhập mã OTP 6 chữ số nhận được từ SMS
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={addSimOtp}
                      onChange={(e) => setAddSimOtp(e.target.value.replace(/\D/g, ""))}
                      placeholder="------"
                      autoFocus
                      className="w-full text-center text-3xl font-mono font-bold tracking-[0.4em] p-3.5 border border-slate-200 rounded-[14px] text-[#001743] focus:border-[#001743] focus:ring-2 focus:ring-[#001743]/15 focus:outline-none transition-all shadow-2xs"
                    />
                  </div>

                  {/* Cooldown & Gửi lại OTP */}
                  <div className="flex items-center justify-center gap-2 text-xs">
                    {addSimCooldown > 0 ? (
                      <span className="text-slate-400 text-[11px]">
                        Gửi lại mã OTP sau <strong>{addSimCooldown}s</strong>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSendAddSimOtp()}
                        disabled={sendingOtp}
                        className="text-blue-700 hover:text-blue-900 font-bold text-[11px] underline cursor-pointer"
                      >
                        {sendingOtp ? "Đang gửi..." : "Chưa nhận được mã? Gửi lại OTP"}
                      </button>
                    )}
                  </div>

                  {/* Loading Indicator khi đang đối soát nhà mạng */}
                  {submittingSim && (
                    <div className="p-3 bg-purple-50/70 rounded-[12px] text-[11.5px] text-purple-900 leading-relaxed flex items-center gap-2 border border-purple-100 animate-pulse">
                      <RefreshCw size={14} className="animate-spin text-purple-600 shrink-0" />
                      <span>
                        Đang đối soát thông tin thuê bao chính chủ với Cổng viễn thông {selectedCarrier?.carrierName}... Vui lòng đợi trong giây lát.
                      </span>
                    </div>
                  )}
                </div>

                {/* Sticky Footer - Bước 2 */}
                <div className="p-4 px-5 border-t border-slate-100 bg-white/95 backdrop-blur-xs flex items-center justify-end gap-2.5 shrink-0 shadow-[0_-4px_12px_rgba(0,0,0,0.03)] rounded-b-[20px]">
                  <button
                    type="button"
                    onClick={() => setAddSimStep(1)}
                    disabled={submittingSim}
                    className="px-5 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-full text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Quay lại
                  </button>
                  <button
                    type="submit"
                    disabled={submittingSim || addSimOtp.length < 4}
                    className="px-6 py-2.5 bg-[#001743] hover:bg-[#00266B] text-white rounded-full text-xs font-bold shadow-sm cursor-pointer flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
                  >
                    {submittingSim ? (
                      <>
                        <RefreshCw size={13} className="animate-spin" />
                        <span>Đang đối soát...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck size={14} />
                        <span>Xác nhận & Thêm SIM chính chủ</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ── 4. Modal: Tạo phiên đấu giá (Wizard Modal 4 bước) ── */}
      {(isCreateAuctionOpen || selectedSimForAuction) && (
        <CreateAuctionWizardModal
          sim={selectedSimForAuction}
          isEkycVerified={isEkycVerified}
          onClose={() => {
            setIsCreateAuctionOpen(false);
            setSelectedSimForAuction(null);
          }}
          onSuccess={() => {
            setIsCreateAuctionOpen(false);
            setSelectedSimForAuction(null);
            fetchSimsFromDb();
          }}
          onNavigateToEkyc={onNavigateToEkyc}
          onNavigateToVerifySim={(s) => {
            setIsCreateAuctionOpen(false);
            setSelectedSimForAuction(null);
            if (s) setSelectedSimForVerify(s);
          }}
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

      {/* ── 9. Modal: Thẩm định AI chuyên sâu độc lập cho từng số SIM ── */}
      {selectedSimForAiValuation && (
        <AiValuationModal
          sim={selectedSimForAiValuation}
          onClose={() => setSelectedSimForAiValuation(null)}
          onSimUpdated={(updatedSim) => {
            setOwnedSims((prev) =>
              prev.map((item) => (item.id === updatedSim.id ? updatedSim : item))
            );
            if (selectedSimForDetail && selectedSimForDetail.id === updatedSim.id) {
              setSelectedSimForDetail(updatedSim);
            }
          }}
          addToast={addToast}
        />
      )}
    </div>
  );
}
