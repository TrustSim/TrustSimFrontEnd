/* Hallmark · genre: modern-minimal · macrostructure: Workbench · design-system: design.md · designed-as-app */
"use client";
import React, { useState, useMemo, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { AdminCategoriesTab } from "@/components/admin/AdminCategoriesTab";
import { AdminCarriersTab } from "@/components/admin/AdminCarriersTab";
import { AdminSimsTab } from "@/components/admin/AdminSimsTab";
import { AdminAuctionsTab } from "@/components/admin/AdminAuctionsTab";
import { AdminCustomersTab } from "@/components/admin/AdminCustomersTab";
import { AdminStaffTab } from "@/components/admin/AdminStaffTab";
import AdminEscrowTab from "@/components/admin/AdminEscrowTab";
import AdminDisputesTab from "@/components/admin/AdminDisputesTab";
import AdminSettingsTab from "@/components/admin/AdminSettingsTab";
import AdminLedgerTab from "@/components/admin/AdminLedgerTab";
import { AdminDocumentsTab } from "@/components/admin/AdminDocumentsTab";
import { AdminAnomaliesTab } from "@/components/admin/AdminAnomaliesTab";
import ImportExportBar from "@/components/admin/ImportExportBar";
import { ExcelColumnDef } from "@/services/excelService";
import { auctionService, type AuctionDto } from "@/services/auctionService";
import { tradeService } from "@/services/tradeService";
import { getAdminSims, type AdminSimItemDto } from "@/services/simService";
import {
  Smartphone,
  Gavel,
  CreditCard,
  ShieldCheck,
  Users,
  Bot,
  Search,
  Plus,
  Edit3,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Eye,
  Lock,
  Unlock,
  Check,
  X,
  Clock,
  Radio,
  FileText,
  AlertOctagon,
  Settings as SettingsIcon,
  ChevronRight,
  UserCheck,
  Zap,
  HelpCircle,
  ShieldAlert,
  ArrowRight,
  TrendingUp,
  SlidersHorizontal,
  ExternalLink,
  RotateCcw,
  MoreHorizontal,
  RefreshCw,
  Loader2,
} from "lucide-react";
import {
  RightDrawer,
  DrawerBody,
  DrawerFooter,
  DrawerSection,
  FormField,
  BtnPrimary,
  BtnSecondary,
} from "@/components/ui/RightDrawer";
import { Pagination } from "@/components/ui/Pagination";
import { PhysicalSimCard } from "@/components/ui/PhysicalSimCard";

// --- FORMATTERS ---
const formatVND = (value: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(value);

const formatPhone = (phone: string) => {
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`;
  }
  return phone;
};

function formatTimeLeft(endAtStr?: string): { timeLeft: string; isUrgent: boolean } {
  if (!endAtStr) return { timeLeft: "Không xác định", isUrgent: false };
  const diff = new Date(endAtStr).getTime() - Date.now();
  if (diff <= 0) return { timeLeft: "Đã kết thúc", isUrgent: false };
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const isUrgent = diff < 5 * 60 * 1000;
  if (hours > 0) return { timeLeft: `${hours}h ${minutes}m`, isUrgent };
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  return { timeLeft: `${minutes}m ${seconds}s`, isUrgent };
}

// --- ANIMATED COUNTER (MICRO-INTERACTION) ---
function AnimatedNumber({
  value,
  isCurrency = false,
  suffix = "",
}: {
  value: number;
  isCurrency?: boolean;
  suffix?: string;
}) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTimestamp: number | null = null;
    const duration = 800; // ms

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // Easing: easeOutExpo
      const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setCount(Math.round(ease * value));

      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };

    const frameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frameId);
  }, [value]);

  if (isCurrency) {
    return <span>{formatVND(count)}</span>;
  }
  return (
    <span>
      {count}
      {suffix}
    </span>
  );
}

// --- DATA TYPES ---
interface SimItem {
  id: string;
  phone: string;
  carrier: string;
  category: string;
  price: number;
  aiValuation: number;
  aiMultiplier: number;
  status: "Available" | "InAuction" | "Sold" | "Locked";
  type: string;
  created: string;
  patternDesc: string;
}

const SIM_EXPORT_COLUMNS: ExcelColumnDef<SimItem>[] = [
  { header: "Mã SIM", key: "id", width: 14 },
  { header: "Số điện thoại", key: "phone", width: 16, formatter: (v) => formatPhone(String(v)) },
  { header: "Nhà mạng", key: "carrier", width: 14 },
  { header: "Phân loại", key: "category", width: 18 },
  { header: "Giá bán (VNĐ)", key: "price", width: 18, formatter: (v) => formatVND(Number(v)) },
  { header: "AI Định giá (VNĐ)", key: "aiValuation", width: 18, formatter: (v) => formatVND(Number(v)) },
  { header: "Hệ số AI", key: "aiMultiplier", width: 12 },
  { header: "Trạng thái", key: "status", width: 14 },
  { header: "Loại thuê bao", key: "type", width: 14 },
  { header: "Mô tả thế số", key: "patternDesc", width: 30 },
];

interface AuctionItem {
  id: string;
  sim: string;
  type: "english" | "dutch" | "sealed";
  currentPrice: number;
  startPrice: number;
  step: number;
  bids: number;
  seller: string;
  leader: string;
  timeLeft: string;
  isUrgentCountdown: boolean; // < 5 mins
  riskLevel: "safe" | "monitor" | "high";
  status: "live" | "upcoming" | "ended";
}

interface EscrowTransaction {
  id: string;
  orderCode: string;
  sim: string;
  buyer: string;
  seller: string;
  amount: number;
  fee: number;
  status: "Held" | "Released" | "Disputed" | "Refunded";
  time: string;
  deadline: string;
  pipelineStep: number;
  conditionsMet: boolean;
  missingReason: string;
}

interface AnomalyItem {
  id: string;
  level: "high" | "low";
  title: string;
  desc: string;
  sim: string;
  time: string;
  status: "open" | "resolved";
  actor: string;
  actionNeeded: string;
}

export default function AdminControlCenter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentTab = searchParams?.get("tab") || "dashboard";

  // Data States (Loaded from Backend APIs; empty defaults)
  const [sims, setSims] = useState<SimItem[]>([]);
  const [auctions, setAuctions] = useState<AuctionItem[]>([]);
  const [transactions, setTransactions] = useState<EscrowTransaction[]>([]);
  const [anomalies, setAnomalies] = useState<AnomalyItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Settings State
  const [settings, setSettings] = useState({
    commissionRate: 3.0,
    escrowHoldingHours: 48,
    minDepositRate: 10,
    autoExtendMinutes: 3,
    maxExtensions: 5,
  });

  // UI States
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Modals & Panels
  const [auctionModalOpen, setAuctionModalOpen] = useState(false);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [carrierModalOpen, setCarrierModalOpen] = useState(false);

  // Escrow Pipeline Detail Modal
  const [selectedTxForPipeline, setSelectedTxForPipeline] = useState<any>(null);

  // Delete Safeguard
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: string; id: string; name: string } | null>(null);

  const [searchAuction, setSearchAuction] = useState("");
  const [auctionTypeFilter, setAuctionTypeFilter] = useState("all");
  const [auctionStatusFilter, setAuctionStatusFilter] = useState("all");

  const [searchUser, setSearchUser] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("all");

  // Hover state for interactive Donut Chart inspection
  const [hoveredDonutSegment, setHoveredDonutSegment] = useState<{
    label: string;
    count: string;
    color: string;
  } | null>(null);

  // Data Fetching Hook
  const fetchDashboardData = useCallback(async () => {
    try {
      const [auctionsRes, tradesRes, simsRes] = await Promise.allSettled([
        auctionService.getAuctions({ pageSize: 50 }),
        tradeService.adminGetAllTrades({ pageSize: 50 }),
        getAdminSims({ pageSize: 50 }),
      ]);

      // 1. Ánh xạ danh sách phiên đấu giá từ Backend
      if (auctionsRes.status === "fulfilled" && auctionsRes.value?.items) {
        const mappedAuctions: AuctionItem[] = auctionsRes.value.items.map((a: AuctionDto) => {
          const { timeLeft, isUrgent } = formatTimeLeft(a.endAt);
          const typeMap: Record<string, "english" | "dutch" | "sealed"> = {
            ENGLISH: "english",
            DUTCH: "dutch",
          };
          const statusMap: Record<string, "live" | "upcoming" | "ended"> = {
            ACTIVE: "live",
            SCHEDULE: "upcoming",
            END: "ended",
            CANCELLED: "ended",
          };
          return {
            id: a.auctionCode || a.id,
            sim: a.simPhoneNumber || "",
            type: typeMap[a.auctionType] || "english",
            currentPrice: a.currentPrice || a.startingPrice || 0,
            startPrice: a.startingPrice || 0,
            step: a.minBidStep || 0,
            bids: a.totalBids || 0,
            seller: a.authorName || "Hệ thống",
            leader: "Chưa có",
            timeLeft,
            isUrgentCountdown: isUrgent,
            riskLevel: "safe",
            status: statusMap[a.auctionStatus] || "ended",
          };
        });
        setAuctions(mappedAuctions);
      } else {
        setAuctions([]);
      }

      // 2. Ánh xạ danh sách giao dịch chuyển nhượng / ký quỹ từ Backend
      if (tradesRes.status === "fulfilled" && tradesRes.value?.items) {
        const mappedTrades: EscrowTransaction[] = tradesRes.value.items.map((t) => {
          const statusStr = String(t.status);
          const escrowStatusStr = String(t.escrowStatus);

          let txStatus: "Held" | "Released" | "Disputed" | "Refunded" = "Held";
          if (escrowStatusStr === "RELEASED" || statusStr === "Completed") txStatus = "Released";
          else if (statusStr === "Disputed") txStatus = "Disputed";
          else if (escrowStatusStr === "REFUNDED" || statusStr.includes("Cancelled")) txStatus = "Refunded";
          else txStatus = "Held";

          let step = 1;
          if (statusStr === "PendingEscrow") step = 1;
          else if (statusStr === "PendingSignature") step = 2;
          else if (statusStr === "PendingTransfer") step = 4;
          else if (statusStr === "Completed") step = 5;

          return {
            id: t.id,
            orderCode: t.tradeTransactionCode || `ORD-${t.id.slice(0, 8)}`,
            sim: t.simPhoneNumber || "",
            buyer: t.buyerName || "Người mua",
            seller: t.sellerName || "Người bán",
            amount: Number(t.escrowAmount) || 0,
            fee: (Number(t.escrowAmount) || 0) * 0.03,
            status: txStatus,
            time: t.createdDate ? new Date(t.createdDate).toLocaleDateString("vi-VN") : "—",
            deadline: t.escrowDeadline ? new Date(t.escrowDeadline).toLocaleString("vi-VN") : "—",
            pipelineStep: step,
            conditionsMet: step >= 5,
            missingReason: step < 4 ? "Chờ người mua ký hợp đồng" : step === 4 ? "Chờ xác nhận chuyển nhượng từ nhà mạng" : "",
          };
        });
        setTransactions(mappedTrades);
      } else {
        setTransactions([]);
      }

      // 3. Ánh xạ danh sách SIM cho modal tạo phiên nhanh
      if (simsRes.status === "fulfilled" && simsRes.value?.items) {
        const mappedSims: SimItem[] = simsRes.value.items.map((s: AdminSimItemDto) => ({
          id: s.id,
          phone: s.phoneNumber,
          carrier: s.carrierName || "Chưa rõ",
          category: s.categoryNames?.join(", ") || "Phổ thông",
          price: 0,
          aiValuation: 0,
          aiMultiplier: 1.0,
          status:
            s.simStatus === "AVAILABLE"
              ? "Available"
              : s.simStatus === "IN_AUCTION"
                ? "InAuction"
                : s.simStatus === "TRANFERED"
                  ? "Sold"
                  : "Locked",
          type: "Trả trước",
          created: s.createdDate ? new Date(s.createdDate).toLocaleDateString("vi-VN") : "—",
          patternDesc: s.formatRhythmName || "",
        }));
        setSims(mappedSims);
      } else {
        setSims([]);
      }

      // 4. Anomalies: Backend chưa có Controller/API phát hiện bất thường -> để trống theo yêu cầu
      setAnomalies([]);
    } catch (err) {
      console.error("Lỗi nạp dữ liệu Dashboard:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // =========================================================================
  // VIEW: 1. DASHBOARD (OPERATIONAL SUMMARY & PRIORITY ACTIONS)
  // =========================================================================
  const renderDashboard = () => {
    const liveAuctions = auctions.filter((a) => a.status === "live");
    const liveCount = liveAuctions.length;
    const highRiskAlerts = anomalies.filter((a) => a.status === "open" && a.level === "high").length;
    const totalHeldEscrow = transactions
      .filter((t) => t.status === "Held" || t.status === "Disputed")
      .reduce((sum, t) => sum + t.amount, 0);

    // Donut chart dynamic calculations
    const activeBiddingCount = liveAuctions.filter((a) => a.bids > 0 && !a.isUrgentCountdown).length;
    const urgentCount = liveAuctions.filter((a) => a.isUrgentCountdown).length;
    const newAuctionCount = liveAuctions.filter((a) => a.bids === 0 && !a.isUrgentCountdown).length;
    const circumference = 263.89; // 2 * PI * 42

    const activeBiddingDash = liveCount > 0 ? (activeBiddingCount / liveCount) * circumference : 0;
    const urgentDash = liveCount > 0 ? (urgentCount / liveCount) * circumference : 0;
    const newAuctionDash = liveCount > 0 ? (newAuctionCount / liveCount) * circumference : 0;

    return (
      <div className="admin-tab admin-tab-dashboard space-y-6">
        {/* 1. PAGE HEADER (OPEN & BREATHING WORKBENCH HEAD) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl lg:text-2xl font-bold text-[#001743] tracking-tight">
                Trung tâm điều hành TrustSim
              </h1>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium border border-emerald-200/60">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>Vận hành ổn định</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 font-normal">
              {new Date().toLocaleDateString("vi-VN", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" })}
              {" · "}
              <span className="font-mono">{liveCount}</span> phiên đang diễn ra
              {" · "}
              <span className="text-emerald-700 font-medium">Định danh eKYC trực tiếp</span>
              {highRiskAlerts > 0 && (
                <>
                  {" · "}
                  <span className="text-[#E4011E] font-medium font-mono">{highRiskAlerts} cảnh báo rủi ro</span>
                </>
              )}
            </p>
          </div>

          {/* Action Hierarchy: 1 Primary CTA (Navy), 1 Secondary Subtle (Outline) */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => {
                setRefreshing(true);
                fetchDashboardData();
              }}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-medium rounded-lg transition-colors shadow-2xs disabled:opacity-50 cursor-pointer"
              title="Làm mới dữ liệu thời gian thực"
            >
              <RefreshCw size={13} className={refreshing ? "animate-spin text-[#001743]" : ""} />
              <span>{refreshing ? "Đang tải…" : "Làm mới"}</span>
            </button>
            <a
              href="/admin?tab=sims"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-medium rounded-lg transition-colors shadow-2xs"
            >
              <Plus size={14} strokeWidth={1.75} />
              <span>Quản lý SIM</span>
            </a>
            <button
              onClick={() => setAuctionModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#001743] hover:bg-[#00266B] text-white text-xs font-semibold rounded-lg transition-colors shadow-xs cursor-pointer"
            >
              <Gavel size={14} strokeWidth={1.75} />
              <span>+ Mở phiên đấu giá</span>
            </button>
          </div>
        </div>

        {/* 2. FLAT KPI WORKBENCH STRIP (OPEN BREATHING PANELS, ZERO CARD-IN-CARD) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Metric 1: Tổng ký quỹ đang giữ */}
          <div className="bg-white border border-[#e4e7ec] rounded-xl p-4 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-medium text-slate-500">Tổng ký quỹ đang giữ</span>
              <div className="p-1.5 rounded-md bg-blue-50 text-[#001743]">
                <CreditCard size={15} strokeWidth={1.75} />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-[#001743] font-mono tabular-nums tracking-tight">
                <AnimatedNumber value={totalHeldEscrow} isCurrency />
              </div>
              <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span className="flex items-center gap-1 font-medium text-emerald-700">
                  <TrendingUp size={12} />
                  <span>Sổ cái ký quỹ Escrow</span>
                </span>
                <span className="text-slate-400">Thời gian thực</span>
              </div>
            </div>
          </div>

          {/* Metric 2: Phiên đấu giá trực tiếp */}
          <div className="bg-white border border-[#e4e7ec] rounded-xl p-4 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-medium text-slate-500">Phiên trực tiếp</span>
              <div className="p-1.5 rounded-md bg-amber-50 text-amber-700">
                <Gavel size={15} strokeWidth={1.75} />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-[#001743] font-mono tabular-nums tracking-tight flex items-baseline gap-1.5">
                <AnimatedNumber value={liveCount} />
                <span className="text-xs font-normal text-slate-500">phiên</span>
              </div>
              <div className="mt-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                  <span className="text-amber-700 font-medium flex items-center gap-1">
                    <Clock size={11} />
                    <span>{urgentCount} sắp kết thúc (&lt; 5p)</span>
                  </span>
                  <span className="font-mono text-slate-400">
                    {liveCount > 0 ? `${Math.round((urgentCount / liveCount) * 100)}%` : "0%"}
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1 overflow-hidden">
                  <div
                    className="bg-amber-500 h-1 rounded-full transition-[width] duration-300"
                    style={{ width: liveCount > 0 ? `${Math.round((urgentCount / liveCount) * 100)}%` : "0%" }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Metric 3: eKYC Định danh */}
          <div className="bg-white border border-[#e4e7ec] rounded-xl p-4 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-medium text-slate-500">Định danh eKYC</span>
              <div className="p-1.5 rounded-md bg-emerald-50 text-emerald-700">
                <UserCheck size={15} strokeWidth={1.75} />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-slate-900 tracking-tight flex items-baseline gap-1.5">
                <span className="text-emerald-700 font-semibold text-lg">AI Tự động</span>
                <span className="text-xs font-normal text-slate-500">OCR & Liveness</span>
              </div>
              <div className="mt-2 pt-2 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
                <span className="text-emerald-700 font-medium flex items-center gap-1">
                  <CheckCircle2 size={11} />
                  <span>Xử lý trực tiếp 24/7</span>
                </span>
                <span className="text-slate-400">CCCD/Hộ chiếu</span>
              </div>
            </div>
          </div>

          {/* Metric 4: Giám sát an toàn & AI Fraud */}
          <div className={`bg-white border rounded-xl p-4 shadow-2xs flex flex-col justify-between ${
            highRiskAlerts > 0 ? "border-rose-300/80" : "border-[#e4e7ec]"
          }`}>
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-medium text-slate-700">Giám sát rủi ro</span>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                highRiskAlerts > 0
                  ? "text-rose-700 bg-rose-50 border-rose-200/60"
                  : "text-emerald-700 bg-emerald-50 border-emerald-200/60"
              }`}>
                {highRiskAlerts > 0 ? "CẦN XỬ LÝ" : "AN TOÀN"}
              </span>
            </div>
            <div className="mt-3">
              <div className={`text-2xl font-bold tabular-nums font-mono tracking-tight flex items-baseline gap-1.5 ${
                highRiskAlerts > 0 ? "text-[#E4011E]" : "text-emerald-700"
              }`}>
                <AnimatedNumber value={highRiskAlerts} />
                <span className="text-xs font-normal text-slate-500">cảnh báo</span>
              </div>
              <div className="mt-2 pt-2 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
                <div className={`flex items-center gap-1 font-medium truncate ${
                  highRiskAlerts > 0 ? "text-rose-700" : "text-emerald-700"
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                    highRiskAlerts > 0 ? "bg-rose-600" : "bg-emerald-600"
                  }`}></span>
                  <span className="truncate">
                    {highRiskAlerts > 0 ? "Nghi vấn đặt giá liên minh" : "Bình thường"}
                  </span>
                </div>
                <span className="text-slate-400 font-mono">Real-time</span>
              </div>
            </div>
          </div>
        </div>

        {/* 3. LAYOUT 2/3 + 1/3: CẢNH BÁO CẦN XỬ LÝ & TRẠNG THÁI PHIÊN */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          {/* CỘT TRÁI (2/3 - 8/12): CẢNH BÁO CẦN XỬ LÝ (BẢNG PHẲNG, CHỈ DIVIDER NGANG) */}
          <div className="lg:col-span-8 bg-white border border-slate-200/70 rounded-xl overflow-hidden elevation-card flex flex-col justify-between">
            <div>
              <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-white">
                <div className="flex items-center gap-2">
                  <ShieldAlert size={16} className={highRiskAlerts > 0 ? "text-[#E4011E]" : "text-slate-400"} />
                  <h2 className="text-sm font-semibold text-[#001743]">
                    Cảnh báo rủi ro AI &amp; Gian lận
                  </h2>
                </div>
                <span className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full border ${anomalies.filter((a) => a.status === "open").length > 0
                  ? "bg-rose-50 text-rose-700 border-rose-200/60"
                  : "bg-slate-50 text-slate-500 border-slate-200/60"
                  }`}>
                  {anomalies.filter((a) => a.status === "open").length} cảnh báo đang mở
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-medium text-[11px] h-9">
                      <th className="py-2 px-4">Thời gian</th>
                      <th className="py-2 px-3">Mức độ</th>
                      <th className="py-2 px-3">Loại vi phạm</th>
                      <th className="py-2 px-3">Đối tượng</th>
                      <th className="py-2 px-3">SIM liên quan</th>
                      <th className="py-2 px-4 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {anomalies.filter((a) => a.status === "open").length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-400">
                          <ShieldCheck size={36} className="mx-auto text-emerald-500 mb-2" strokeWidth={1.5} />
                          <p className="font-semibold text-xs text-[#001743]">Hệ thống vận hành an toàn</p>
                          <p className="text-[11px] text-slate-400 mt-1 max-w-sm mx-auto">
                            Chưa có cảnh báo rủi ro hoặc hành vi gian lận nào được ghi nhận từ hệ thống.
                          </p>
                        </td>
                      </tr>
                    ) : (
                      anomalies
                        .filter((a) => a.status === "open")
                        .map((anom) => (
                          <tr
                            key={anom.id}
                            className="hover:bg-slate-50/60 transition-colors duration-150 h-12"
                          >
                            <td className="py-2 px-4 text-xs text-slate-500 font-mono whitespace-nowrap">
                              {anom.time}
                            </td>
                            <td className="py-2 px-3 whitespace-nowrap">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${anom.level === "high"
                                  ? "bg-rose-50 text-rose-700 border border-rose-200/60"
                                  : "bg-amber-50 text-amber-800 border border-amber-200/60"
                                  }`}
                              >
                                {anom.level === "high" ? "Khẩn cấp" : "Theo dõi"}
                              </span>
                            </td>
                            <td className="py-2 px-3">
                              <div className="font-medium text-xs text-[#001743]">{anom.title}</div>
                              <div className="text-[11px] text-slate-400 truncate max-w-[240px]">{anom.desc}</div>
                            </td>
                            <td className="py-2 px-3 font-mono text-xs text-slate-600 whitespace-nowrap">
                              {anom.actor}
                            </td>
                            <td className="py-2 px-3 font-mono font-bold text-xs text-[#001743] whitespace-nowrap">
                              {formatPhone(anom.sim)}
                            </td>
                            <td className="py-2 px-4 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => showToast(`Đã ra lệnh khóa khẩn cấp phiên đấu giá SIM ${anom.sim}.`)}
                                  className="px-2.5 py-1 text-xs font-medium text-rose-600 hover:text-white hover:bg-[#E4011E] rounded-md border border-rose-200 hover:border-[#E4011E] transition-all"
                                >
                                  Khóa phiên
                                </button>
                                <button
                                  onClick={() => {
                                    setAnomalies(anomalies.map((a) => (a.id === anom.id ? { ...a, status: "resolved" } : a)));
                                    showToast(`Đã bỏ qua cảnh báo ${anom.id}.`);
                                  }}
                                  className="px-2 py-1 text-xs text-slate-400 hover:text-slate-700 transition-colors"
                                >
                                  Bỏ qua
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="px-5 py-2.5 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
              <span>Hệ thống phân tích hành vi tự động gắn cờ tài khoản nghi vấn liên minh đặt giá</span>
              <span className="font-medium text-slate-500">Trạng thái: Giám sát chủ động</span>
            </div>
          </div>

          {/* CỘT PHẢI (1/3 - 4/12): TRẠNG THÁI PHIÊN ĐẤU GIÁ (DONUT CHART & SOFT LEGEND) */}
          <div className="lg:col-span-4 bg-white border border-slate-200/70 rounded-xl p-5 elevation-card flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h2 className="text-sm font-semibold text-[#001743]">
                  Trạng thái phiên đấu giá
                </h2>
                <span className="text-xs text-slate-400">Thời gian thực</span>
              </div>

              {/* Donut Chart SVG với Hover Morphing Center Content */}
              <div className="flex items-center justify-center my-4 relative">
                <svg width="125" height="125" viewBox="0 0 120 120" className="-rotate-90">
                  {/* Background track */}
                  <circle cx="60" cy="60" r="42" fill="none" stroke="#F1F5F9" strokeWidth="13" />

                  {liveCount > 0 && (
                    <>
                      {/* Segment 1: Đang bid sôi nổi */}
                      {activeBiddingDash > 0 && (
                        <circle
                          cx="60"
                          cy="60"
                          r="42"
                          fill="none"
                          stroke="#001743"
                          strokeWidth={hoveredDonutSegment?.label === "Đang được đặt giá" ? 16 : 13}
                          strokeDasharray={`${activeBiddingDash} ${circumference}`}
                          strokeDashoffset="0"
                          className="cursor-pointer transition-all duration-300 ease-out"
                          onMouseEnter={() =>
                            setHoveredDonutSegment({
                              label: "Đang được đặt giá",
                              count: `${activeBiddingCount} phiên (${Math.round((activeBiddingCount / liveCount) * 100)}%)`,
                              color: "#001743",
                            })
                          }
                          onMouseLeave={() => setHoveredDonutSegment(null)}
                        />
                      )}
                      {/* Segment 2: Sắp kết thúc */}
                      {urgentDash > 0 && (
                        <circle
                          cx="60"
                          cy="60"
                          r="42"
                          fill="none"
                          stroke="#F59E0B"
                          strokeWidth={hoveredDonutSegment?.label === "Sắp kết thúc" ? 16 : 13}
                          strokeDasharray={`${urgentDash} ${circumference}`}
                          strokeDashoffset={String(-activeBiddingDash)}
                          className="cursor-pointer transition-all duration-300 ease-out"
                          onMouseEnter={() =>
                            setHoveredDonutSegment({
                              label: "Sắp kết thúc",
                              count: `${urgentCount} phiên (${Math.round((urgentCount / liveCount) * 100)}%)`,
                              color: "#F59E0B",
                            })
                          }
                          onMouseLeave={() => setHoveredDonutSegment(null)}
                        />
                      )}
                      {/* Segment 3: Mới mở / Chưa có bid */}
                      {newAuctionDash > 0 && (
                        <circle
                          cx="60"
                          cy="60"
                          r="42"
                          fill="none"
                          stroke="#3B82F6"
                          strokeWidth={hoveredDonutSegment?.label === "Chưa có lượt đặt giá" ? 16 : 13}
                          strokeDasharray={`${newAuctionDash} ${circumference}`}
                          strokeDashoffset={String(-(activeBiddingDash + urgentDash))}
                          className="cursor-pointer transition-all duration-300 ease-out"
                          onMouseEnter={() =>
                            setHoveredDonutSegment({
                              label: "Chưa có lượt đặt giá",
                              count: `${newAuctionCount} phiên (${Math.round((newAuctionCount / liveCount) * 100)}%)`,
                              color: "#3B82F6",
                            })
                          }
                          onMouseLeave={() => setHoveredDonutSegment(null)}
                        />
                      )}
                    </>
                  )}
                </svg>

                {/* Center Content: Chuyển đổi mượt mà giữa Tổng số và Chi tiết mảng màu khi hover */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none transition-all duration-200">
                  {hoveredDonutSegment ? (
                    <div className="text-center px-1">
                      <span
                        className="text-xs font-bold tabular-nums block leading-tight truncate max-w-[80px]"
                        style={{ color: hoveredDonutSegment.color }}
                      >
                        {hoveredDonutSegment.count}
                      </span>
                      <span className="text-[9px] font-normal text-slate-500 block mt-0.5 truncate max-w-[80px]">
                        {hoveredDonutSegment.label}
                      </span>
                    </div>
                  ) : (
                    <div className="text-center">
                      <span className="text-xl font-bold text-[#001743] tabular-nums leading-none block">
                        <AnimatedNumber value={liveCount} />
                      </span>
                      <span className="text-[10px] font-normal text-slate-400 block mt-1">
                        Phiên live
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Status Legend Breakdown */}
              <div className="space-y-1.5 pt-1 text-xs">
                {liveCount === 0 ? (
                  <div className="p-3 bg-slate-50 rounded-lg text-center text-xs text-slate-400">
                    Hiện tại chưa có phiên đấu giá trực tiếp
                  </div>
                ) : (
                  <>
                    <div
                      className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all ${hoveredDonutSegment?.label === "Đang được đặt giá" ? "bg-slate-50" : "hover:bg-slate-50/70"
                        }`}
                      onMouseEnter={() =>
                        setHoveredDonutSegment({
                          label: "Đang được đặt giá",
                          count: `${activeBiddingCount} phiên (${Math.round((activeBiddingCount / liveCount) * 100)}%)`,
                          color: "#001743",
                        })
                      }
                      onMouseLeave={() => setHoveredDonutSegment(null)}
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#001743]"></span>
                        <span className="text-slate-600 font-normal">Đang được đặt giá</span>
                      </div>
                      <span className="font-semibold text-[#001743] tabular-nums">
                        {activeBiddingCount} phiên ({Math.round((activeBiddingCount / liveCount) * 100)}%)
                      </span>
                    </div>

                    <div
                      className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all ${hoveredDonutSegment?.label === "Sắp kết thúc" ? "bg-amber-50/60" : "hover:bg-slate-50/70"
                        }`}
                      onMouseEnter={() =>
                        setHoveredDonutSegment({
                          label: "Sắp kết thúc",
                          count: `${urgentCount} phiên (${Math.round((urgentCount / liveCount) * 100)}%)`,
                          color: "#F59E0B",
                        })
                      }
                      onMouseLeave={() => setHoveredDonutSegment(null)}
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                        <span className="text-slate-600 font-normal">Sắp kết thúc (&lt; 5p)</span>
                      </div>
                      <span className="font-semibold text-amber-700 tabular-nums">
                        {urgentCount} phiên ({Math.round((urgentCount / liveCount) * 100)}%)
                      </span>
                    </div>

                    <div
                      className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all ${hoveredDonutSegment?.label === "Chưa có lượt đặt giá" ? "bg-blue-50/60" : "hover:bg-slate-50/70"
                        }`}
                      onMouseEnter={() =>
                        setHoveredDonutSegment({
                          label: "Chưa có lượt đặt giá",
                          count: `${newAuctionCount} phiên (${Math.round((newAuctionCount / liveCount) * 100)}%)`,
                          color: "#3B82F6",
                        })
                      }
                      onMouseLeave={() => setHoveredDonutSegment(null)}
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                        <span className="text-slate-600 font-normal">Chưa có lượt đặt giá</span>
                      </div>
                      <span className="font-semibold text-blue-700 tabular-nums">
                        {newAuctionCount} phiên ({Math.round((newAuctionCount / liveCount) * 100)}%)
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 mt-4">
              <div className="text-xs text-slate-400 flex items-center justify-between">
                <span>Tổng số phiên ghi nhận:</span>
                <span className="font-semibold font-mono text-[#001743]">{auctions.length} phiên</span>
              </div>
            </div>
          </div>
        </div>

        {/* 4. LIVE AUCTIONS TABLE: TINH GỌN 7 CỘT CHÍNH (FLAT, BREADCRUMB HEADER) */}
        <div className="bg-white border border-[#e4e7ec] rounded-xl overflow-hidden shadow-2xs">
          <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-white">
            <div className="flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <h2 className="text-sm font-semibold text-[#001743]">
                Giám sát trả giá trực tiếp
              </h2>
            </div>
            <a
              href="/admin?tab=auctions"
              className="text-xs font-medium text-slate-500 hover:text-[#001743] inline-flex items-center gap-1 transition-colors"
            >
              <span>Xem tất cả {auctions.length} phiên</span>
              <ChevronRight size={13} />
            </a>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-medium text-[11px] h-9">
                  <th className="py-2 px-4">SIM &amp; Người bán</th>
                  <th className="py-2 px-3 text-right">Giá hiện tại</th>
                  <th className="py-2 px-3">Người dẫn đầu</th>
                  <th className="py-2 px-3 text-center">Lượt đặt giá</th>
                  <th className="py-2 px-3">Thời gian còn lại</th>
                  <th className="py-2 px-3">Mức rủi ro AI</th>
                  <th className="py-2 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {liveCount === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      <Gavel size={36} className="mx-auto text-slate-300 mb-2" strokeWidth={1.5} />
                      <p className="font-semibold text-xs text-[#001743]">Chưa có phiên đấu giá trực tiếp</p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Hiện không có phiên đấu giá nào đang mở. Bấm “+ Mở phiên đấu giá” để tạo phiên mới.
                      </p>
                    </td>
                  </tr>
                ) : (
                  liveAuctions.map((a) => {
                    const priceDiffPct =
                      a.startPrice > 0
                        ? Math.round(((a.currentPrice - a.startPrice) / a.startPrice) * 100)
                        : 0;

                    return (
                      <tr key={a.id} className="hover:bg-slate-50/60 transition-colors duration-150 h-14">
                        {/* 1. SIM & Người bán (Kèm badge hình thức đấu giá phụ) */}
                        <td className="py-2.5 px-4">
                          <div className="font-bold text-sm text-[#001743] tabular-nums font-mono tracking-wider">
                            {formatPhone(a.sim)}
                          </div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                            <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-100 text-slate-600">
                              {a.type === "english" ? "Kiểu Anh" : a.type === "dutch" ? "Hà Lan" : "Bí mật"}
                            </span>
                            <span>· Bởi: {a.seller}</span>
                          </div>
                        </td>

                        {/* 2. Giá hiện tại (Dòng phụ là giá sàn và % chênh lệch) */}
                        <td className="py-2.5 px-3 text-right">
                          <div className="font-bold text-sm text-[#001743] tabular-nums tracking-tight">
                            {formatVND(a.currentPrice)}
                          </div>
                          <div className="text-[10px] text-slate-400 tabular-nums flex items-center justify-end gap-1 mt-0.5">
                            <span>Sàn: {formatVND(a.startPrice)}</span>
                            {priceDiffPct > 0 ? (
                              <span className="text-emerald-700 font-medium">(+{priceDiffPct}%)</span>
                            ) : (
                              <span className="text-slate-400">(Khởi điểm)</span>
                            )}
                          </div>
                        </td>

                        {/* 3. Người dẫn đầu */}
                        <td className="py-2.5 px-3">
                          <div className="font-normal text-xs text-slate-700">{a.leader}</div>
                        </td>

                        {/* 4. Lượt bid */}
                        <td className="py-2.5 px-3 text-center font-medium text-slate-700 tabular-nums">
                          {a.bids}
                        </td>

                        {/* 5. Thời gian còn lại */}
                        <td className="py-2.5 px-3">
                          {a.isUrgentCountdown ? (
                            <div>
                              <div className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 font-mono">
                                <Clock size={12} className="text-amber-600 animate-pulse" />
                                <span>{a.timeLeft}</span>
                              </div>
                              <div className="w-16 bg-amber-100 rounded-full h-1 mt-1 overflow-hidden">
                                <div className="bg-amber-500 h-1 rounded-full animate-pulse" style={{ width: "40%" }} />
                              </div>
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-1 text-xs font-normal text-slate-500 font-mono">
                              <Clock size={12} className="text-slate-400" />
                              <span>{a.timeLeft}</span>
                            </div>
                          )}
                        </td>

                        {/* 6. Mức rủi ro AI */}
                        <td className="py-2.5 px-3">
                          {a.riskLevel === "safe" ? (
                            <span className="inline-flex items-center gap-1.5 text-xs text-slate-600 font-normal">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                              <span>Bình thường</span>
                            </span>
                          ) : a.riskLevel === "monitor" ? (
                            <span className="inline-flex items-center gap-1.5 text-xs text-amber-700 font-medium">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                              <span>Theo dõi</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-xs text-rose-700 font-medium">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-ping mr-[-6px]"></span>
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span>
                              <span>Rủi ro cao</span>
                            </span>
                          )}
                        </td>

                        {/* 7. Thao tác */}
                        <td className="py-2.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {a.isUrgentCountdown && (
                              <button
                                onClick={() => showToast(`Đã gia hạn phiên đấu giá ${a.sim} thêm 15 phút.`)}
                                className="px-2 py-0.5 text-xs font-medium text-amber-800 bg-amber-50 hover:bg-amber-100 rounded-md border border-amber-200/60 transition-colors"
                              >
                                Gia hạn
                              </button>
                            )}
                            <button
                              onClick={() => router.push("/admin?tab=auctions")}
                              className="p-1.5 text-slate-400 hover:text-[#001743] hover:bg-slate-100 rounded-md transition-colors"
                              title="Xem chi tiết phiên đấu giá"
                            >
                              <Eye size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div>
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#001743] text-white px-4 py-3 rounded-[8px] shadow-lg border border-slate-700 text-xs font-semibold flex items-center gap-2 animate-fade-up">
          <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Tab Router */}
      {currentTab === "dashboard" && renderDashboard()}
      {currentTab === "sims" && <AdminSimsTab />}
      {currentTab === "auctions" && <AdminAuctionsTab />}
      {currentTab === "transactions" && <AdminEscrowTab />}
      {currentTab === "categories" && <AdminCategoriesTab />}
      {currentTab === "carriers" && <AdminCarriersTab />}
      {currentTab === "customers" && <AdminCustomersTab />}
      {currentTab === "staff" && <AdminStaffTab />}
      {currentTab === "users" && <AdminCustomersTab />}
      {currentTab === "disputes" && <AdminDisputesTab />}
      {currentTab === "documents" && <AdminDocumentsTab />}
      {currentTab === "ledger" && <AdminLedgerTab />}
      {currentTab === "anomalies" && <AdminAnomaliesTab />}
      {currentTab === "settings" && <AdminSettingsTab />}



      {/* =========================================================================
          MODAL: TẠO PHIÊN ĐẤU GIÁ
      ========================================================================= */}
      {auctionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white border border-[#E2E8F0] rounded-[8px] w-full max-w-lg shadow-xl overflow-hidden animate-fade-up">
            <div className="px-5 py-4 border-b border-[#E2E8F0] flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#001743]">Tạo Phiên Đấu Giá Mới (TrustSim Auction)</h3>
              <button onClick={() => setAuctionModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1">
                <X size={16} />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const sim = formData.get("sim") as string;
                const type = formData.get("type") as any;
                const startPrice = Number(formData.get("startPrice"));
                const step = Number(formData.get("step"));

                const newAuction: AuctionItem = {
                  id: `AUC-${auctions.length + 101}`,
                  sim,
                  type,
                  currentPrice: startPrice,
                  startPrice,
                  step,
                  bids: 0,
                  seller: "Admin Center",
                  leader: "Chưa có",
                  timeLeft: "24h 00m",
                  isUrgentCountdown: false,
                  riskLevel: "safe",
                  status: "live",
                };
                setAuctions([newAuction, ...auctions]);
                showToast(`Đã mở phiên đấu giá cho SIM ${sim}!`);
                setAuctionModalOpen(false);
              }}
              className="p-5 space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-[#001743] mb-1">Chọn SIM số đẹp từ kho</label>
                <select
                  required
                  name="sim"
                  className="w-full text-xs p-2.5 border border-[#D1D5DB] rounded-[6px] focus:border-[#001743] focus:outline-none font-mono font-bold"
                >
                  {sims
                    .filter((s) => s.status === "Available")
                    .map((s) => (
                      <option key={s.id} value={s.phone}>
                        {formatPhone(s.phone)} ({s.carrier} - {formatVND(s.price)})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#001743] mb-1">Hình thức đấu giá</label>
                <select
                  name="type"
                  className="w-full text-xs p-2.5 border border-[#D1D5DB] rounded-[6px] focus:border-[#001743] focus:outline-none"
                >
                  <option value="english">Đấu giá kiểu Anh (Tăng dần công khai)</option>
                  <option value="dutch">Đấu giá kiểu Hà Lan (Giảm dần theo thời gian)</option>
                  <option value="sealed">Đấu giá kín (Bí mật một lần)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#001743] mb-1">Giá khởi điểm (VNĐ)</label>
                  <input
                    required
                    type="number"
                    name="startPrice"
                    defaultValue={10000000}
                    className="w-full text-xs p-2.5 border border-[#D1D5DB] rounded-[6px] focus:border-[#001743] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#001743] mb-1">Bước giá tối thiểu</label>
                  <input
                    required
                    type="number"
                    name="step"
                    defaultValue={500000}
                    className="w-full text-xs p-2.5 border border-[#D1D5DB] rounded-[6px] focus:border-[#001743] focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-[#E2E8F0] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAuctionModalOpen(false)}
                  className="px-3.5 py-1.5 border border-[#D1D5DB] text-xs font-semibold text-[#4B5563] rounded-[6px]"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#001743] hover:bg-[#00266B] text-white text-xs font-bold rounded-[6px] transition-colors"
                >
                  Bắt đầu phiên đấu giá
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: XÁC NHẬN XÓA AN TOÀN
      ========================================================================= */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white border border-[#E2E8F0] rounded-[8px] w-full max-w-sm shadow-xl p-5 animate-fade-up">
            <div className="flex items-center gap-2.5 mb-2 text-rose-600">
              <AlertTriangle size={20} />
              <h3 className="text-sm font-bold text-[#001743]">Xác nhận xóa tài nguyên</h3>
            </div>
            <p className="text-xs text-[#4B5563] leading-relaxed mb-4">
              Bạn có chắc chắn muốn xóa <strong className="text-[#001743] font-mono">{deleteConfirm.name}</strong> không? Hành động này sẽ được ghi vào nhật ký hệ thống.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-3 py-1.5 border border-[#D1D5DB] text-xs font-semibold text-[#4B5563] rounded-[6px]"
              >
                Hủy bỏ
              </button>
              <button
                onClick={() => {
                  if (deleteConfirm.type === "sim") {
                    setSims(sims.filter((s) => s.id !== deleteConfirm.id));
                  }
                  showToast(`Đã xóa ${deleteConfirm.name} thành công!`);
                  setDeleteConfirm(null);
                }}
                className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-[6px] transition-colors"
              >
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
