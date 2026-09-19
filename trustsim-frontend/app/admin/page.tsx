"use client";
import React, { useState, useMemo, useEffect } from "react";
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
import { AdminDocumentsTab } from "@/components/admin/AdminDocumentsTab";
import ImportExportBar from "@/components/admin/ImportExportBar";
import { ExcelColumnDef } from "@/services/excelService";
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

// --- INITIAL MOCK DATA ---
const INITIAL_SIMS: SimItem[] = [
  { id: "SIM-01", phone: "0988888888", carrier: "Viettel", category: "Bát quý", price: 1850000000, aiValuation: 1920000000, aiMultiplier: 15.0, status: "InAuction", type: "Trả trước", created: "10/09/2026", patternDesc: "Dãy 8 chữ số 8 liên hoàn đại cát, độ hiếm 0.0001%" },
  { id: "SIM-02", phone: "0901234567", carrier: "Mobifone", category: "Sảnh tiến rồng", price: 15800000, aiValuation: 16500000, aiMultiplier: 2.5, status: "InAuction", type: "Trả trước", created: "09/09/2026", patternDesc: "Dãy số tiến từ 1 đến 7 tượng trưng cho thăng tiến liên tục" },
  { id: "SIM-03", phone: "0777777777", carrier: "Mobifone", category: "Thất quý", price: 420000000, aiValuation: 410000000, aiMultiplier: 8.5, status: "InAuction", type: "Trả trước", created: "08/09/2026", patternDesc: "Bộ 7 chữ số 7 độc tôn, thuộc phân khúc siêu VIP" },
  { id: "SIM-04", phone: "0888555000", carrier: "Vinaphone", category: "Tam hoa kép", price: 8500000, aiValuation: 9000000, aiMultiplier: 1.8, status: "Available", type: "Trả sau", created: "07/09/2026", patternDesc: "Cặp tam hoa 888 và 555 kết hợp đuôi tam quý" },
  { id: "SIM-05", phone: "0909090909", carrier: "Viettel", category: "Ngũ quý kép", price: 850000000, aiValuation: 870000000, aiMultiplier: 6.0, status: "Available", type: "Trả trước", created: "06/09/2026", patternDesc: "Cặp số 09 lặp lại 5 lần liên tiếp cân bằng âm dương" },
  { id: "SIM-06", phone: "0911119999", carrier: "Vinaphone", category: "Tứ quý kép", price: 120000000, aiValuation: 125000000, aiMultiplier: 3.2, status: "Available", type: "Trả trước", created: "05/09/2026", patternDesc: "Tứ quý 1111 đầu đuôi tứ quý 9999 đỉnh cao" },
  { id: "SIM-07", phone: "0352468024", carrier: "Viettel", category: "Lộc phát", price: 8500000, aiValuation: 8200000, aiMultiplier: 1.5, status: "Sold", type: "Trả trước", created: "01/09/2026", patternDesc: "Dãy số chẵn tiến phong thủy lộc phát" },
  { id: "SIM-08", phone: "0987654321", carrier: "Viettel", category: "Sảnh lùi đại gia", price: 65000000, aiValuation: 68000000, aiMultiplier: 2.2, status: "Locked", type: "Trả trước", created: "28/08/2026", patternDesc: "Sảnh lùi hoàn hảo từ 9 xuống 1" },
];

const INITIAL_AUCTIONS: AuctionItem[] = [
  { id: "AUC-101", sim: "0901234567", type: "english", currentPrice: 15800000, startPrice: 10000000, step: 500000, bids: 28, seller: "TrustSim Official", leader: "Hoàng Minh Tuấn", timeLeft: "03m 45s", isUrgentCountdown: true, riskLevel: "safe", status: "live" },
  { id: "AUC-102", sim: "0777777777", type: "sealed", currentPrice: 420000000, startPrice: 300000000, step: 10000000, bids: 8, seller: "NguyenVanA", leader: "Vũ Đình Trọng", timeLeft: "04h 00m", isUrgentCountdown: false, riskLevel: "monitor", status: "live" },
  { id: "AUC-103", sim: "0888555000", type: "dutch", currentPrice: 8500000, startPrice: 12000000, step: 200000, bids: 0, seller: "SimSoVip_HN", leader: "Chưa có", timeLeft: "45m", isUrgentCountdown: false, riskLevel: "safe", status: "live" },
  { id: "AUC-104", sim: "0988888888", type: "english", currentPrice: 1850000000, startPrice: 1500000000, step: 20000000, bids: 42, seller: "DaiGiaSim", leader: "Trần Bảo Long", timeLeft: "01h 30m", isUrgentCountdown: false, riskLevel: "safe", status: "live" },
  { id: "AUC-105", sim: "0911119999", type: "sealed", currentPrice: 120000000, startPrice: 120000000, step: 2000000, bids: 0, seller: "TranQuangB", leader: "Chưa có", timeLeft: "Bắt đầu sau 18h", isUrgentCountdown: false, riskLevel: "safe", status: "upcoming" },
  { id: "AUC-106", sim: "0352468024", type: "english", currentPrice: 8500000, startPrice: 5000000, step: 200000, bids: 19, seller: "TrungPT", leader: "Lê Văn Đức", timeLeft: "Đã kết thúc", isUrgentCountdown: false, riskLevel: "safe", status: "ended" },
];

const INITIAL_CATEGORIES = [
  { id: "CAT-01", code: "BAT_QUY", name: "Bát quý (88888888)", multiplier: 15.0, count: 2, desc: "Chứa chuỗi 8 số giống nhau liền mạch", regex: "(\\d)\\1{7}" },
  { id: "CAT-02", code: "THAT_QUY", name: "Thất quý (7777777)", multiplier: 8.5, count: 4, desc: "Chứa chuỗi 7 số giống nhau liền mạch", regex: "(\\d)\\1{6}" },
  { id: "CAT-03", code: "LUC_QUY", name: "Lục quý (666666)", multiplier: 4.5, count: 12, desc: "Chứa chuỗi 6 số giống nhau liền mạch", regex: "(\\d)\\1{5}" },
  { id: "CAT-04", code: "NGU_QUY", name: "Ngũ quý (55555)", multiplier: 2.8, count: 28, desc: "Chứa chuỗi 5 số giống nhau liền mạch", regex: "(\\d)\\1{4}" },
  { id: "CAT-05", code: "TU_QUY", name: "Tứ quý (4444)", multiplier: 1.8, count: 145, desc: "Chứa chuỗi 4 chữ số trùng ở đuôi", regex: "(\\d)\\1{3}$" },
  { id: "CAT-06", code: "LOC_PHAT", name: "Lộc phát (68 - 86)", multiplier: 1.5, count: 320, desc: "Đuôi chứa cặp số 68 hoặc 86 phong thủy", regex: "(68|86)$" },
  { id: "CAT-07", code: "THAN_TAI", name: "Thần tài (39 - 79)", multiplier: 1.3, count: 210, desc: "Đuôi chứa cặp số 39 hoặc 79", regex: "(39|79)$" },
  { id: "CAT-08", code: "SANH_TIEN", name: "Sảnh tiến liên hoàn", multiplier: 2.2, count: 65, desc: "Dãy số tăng dần đều như 4567, 6789", regex: "0123|1234|2345|3456|4567|5678|6789" },
];

const INITIAL_CARRIERS = [
  { id: "CAR-01", name: "Viettel", code: "VTL", prefixes: ["098", "097", "096", "086", "032", "033", "034", "035", "036", "037", "038", "039"], totalSims: 4820 },
  { id: "CAR-02", name: "Vinaphone", code: "VNP", prefixes: ["091", "094", "088", "081", "082", "083", "084", "085"], totalSims: 3150 },
  { id: "CAR-03", name: "Mobifone", code: "MBF", prefixes: ["090", "093", "089", "070", "079", "077", "076", "078"], totalSims: 2900 },
  { id: "CAR-04", name: "Vietnamobile", code: "VNM", prefixes: ["092", "056", "058"], totalSims: 640 },
  { id: "CAR-05", name: "Wintel / Itelecom", code: "WNT", prefixes: ["055", "087"], totalSims: 410 },
];

const INITIAL_USERS = [
  { id: "USR-01", name: "Trần Anh Quân", email: "tranquan@trustsim.vn", phone: "0901888999", role: "Admin", kycStatus: "verified", balance: 45000000, status: "Active", joined: "15/01/2026" },
  { id: "USR-02", name: "Nguyễn Văn An", email: "nguyenan88@gmail.com", phone: "0982345678", role: "Consultant", kycStatus: "verified", balance: 12500000, status: "Active", joined: "20/03/2026" },
  { id: "USR-03", name: "Lê Thị Hồng Cúc", email: "hongcuc.le@gmail.com", phone: "0918765432", role: "User", kycStatus: "pending", balance: 5000000, status: "Active", joined: "10/08/2026" },
  { id: "USR-04", name: "Hoàng Minh Tuấn", email: "tuanminh.sim@yahoo.com", phone: "0934567890", role: "User", kycStatus: "verified", balance: 250000000, status: "Active", joined: "05/05/2026" },
  { id: "USR-05", name: "Đỗ Gia Huy", email: "huy.dogia@outlook.com", phone: "0776543210", role: "User", kycStatus: "rejected", balance: 0, status: "Locked", joined: "22/08/2026" },
];

const INITIAL_EKYC_QUEUE = [
  {
    id: "KYC-301",
    userId: "USR-03",
    userName: "Lê Thị Hồng Cúc",
    idCardNumber: "079198004567",
    dob: "14/05/1998",
    address: "128 Hai Bà Trưng, Phường Đa Kao, Quận 1, TP.HCM",
    faceMatchScore: 96.8,
    antiSpoofing: "Pass (99.2%)",
    blacklistCheck: "Clean",
    submittedAt: "Hôm nay, 14:20 (2.5h trước)",
    status: "pending",
  },
  {
    id: "KYC-302",
    userId: "USR-06",
    userName: "Phạm Quốc Đạt",
    idCardNumber: "001200008899",
    dob: "22/10/2000",
    address: "45 Hoàng Cầu, Đống Đa, Hà Nội",
    faceMatchScore: 92.4,
    antiSpoofing: "Pass (98.1%)",
    blacklistCheck: "Clean",
    submittedAt: "Hôm nay, 11:05 (5.8h trước)",
    status: "pending",
  },
  {
    id: "KYC-303",
    userId: "USR-07",
    userName: "Vũ Đình Trọng",
    idCardNumber: "036195001234",
    dob: "08/01/1995",
    address: "Số 12 Quang Trung, TP. Nam Định",
    faceMatchScore: 88.1,
    antiSpoofing: "Warning: Góc nghiêng",
    blacklistCheck: "Clean",
    submittedAt: "Hôm qua, 17:40",
    status: "pending",
  },
];

const INITIAL_TRANSACTIONS = [
  {
    id: "TX-901",
    orderCode: "ORD-8821",
    sim: "0901234567",
    buyer: "Hoàng Minh Tuấn",
    seller: "TrustSim Official",
    amount: 15800000,
    fee: 474000,
    status: "Held",
    time: "11/09/2026 10:30",
    deadline: "13/09/2026 10:30 (Còn 22h)",
    // 5-step escrow checklist: [deposit, full_escrow, e_contract, sim_transfer, payout]
    pipelineStep: 4, // Đang ở bước 4: chờ hoàn tất chuyển nhượng viễn thông
    conditionsMet: false,
    missingReason: "Chờ người mua xác nhận mã OTP chuyển nhượng từ nhà mạng",
  },
  {
    id: "TX-902",
    orderCode: "ORD-8819",
    sim: "0352468024",
    buyer: "Trần Văn Bình",
    seller: "TrungPT",
    amount: 8500000,
    fee: 255000,
    status: "Released",
    time: "10/09/2026 16:45",
    deadline: "Đã hoàn tất giải ngân",
    pipelineStep: 5,
    conditionsMet: true,
    missingReason: "",
  },
  {
    id: "TX-903",
    orderCode: "ORD-8815",
    sim: "0987654321",
    buyer: "Nguyễn Bảo Long",
    seller: "LuckyNum",
    amount: 35000000,
    fee: 1050000,
    status: "Disputed",
    time: "09/09/2026 14:15",
    deadline: "Đang đóng băng ký quỹ chờ trọng tài",
    pipelineStep: 3,
    conditionsMet: false,
    missingReason: "Khiếu nại: Bên bán chậm bàn giao mã ủy quyền chuyển nhượng",
  },
  {
    id: "TX-904",
    orderCode: "ORD-8810",
    sim: "0909090909",
    buyer: "Đặng Thị Mai",
    seller: "SimVIP",
    amount: 850000000,
    fee: 25500000,
    status: "Refunded",
    time: "08/09/2026 09:10",
    deadline: "Đã hoàn tiền cho người mua",
    pipelineStep: 5,
    conditionsMet: false,
    missingReason: "Hủy giao dịch theo thỏa thuận trọng tài",
  },
];

const INITIAL_DISPUTES = [
  { id: "DSP-01", orderCode: "ORD-8815", sim: "0987654321", complainant: "Nguyễn Bảo Long (Người mua)", respondent: "LuckyNum (Người bán)", reason: "Không hoàn tất sang tên chính chủ tại điểm giao dịch", amount: 35000000, status: "UnderReview", risk: "high", isFrozen: true, date: "10/09/2026" },
  { id: "DSP-02", orderCode: "ORD-8799", sim: "0911223344", complainant: "Phan Văn Nam (Người bán)", respondent: "Lê Minh Tuấn (Người mua)", reason: "Người mua chậm xác nhận mã OTP chuyển nhượng quá hạn 48h", amount: 18000000, status: "UnderReview", risk: "medium", isFrozen: true, date: "09/09/2026" },
];

const INITIAL_ANOMALIES = [
  { id: "AI-101", level: "high", title: "Nghi vấn Bơm giá (Shill Bidding)", desc: "Tài khoản Nguyen*** đặt giá 23 lần liên tiếp trong 5 phút ở phiên #AUC-102", sim: "0777777777", time: "10 phút trước", status: "open", actor: "NguyenVanA & Bot_098", actionNeeded: "Cần phong tỏa phiên đấu giá thẩm định" },
  { id: "AI-102", level: "high", title: "Trùng IP & Thiết bị giữa người bán và người đặt giá", desc: "Hai tài khoản khác nhau đấu giá cùng lúc từ IP 14.161.22.84", sim: "0901234567", time: "45 phút trước", status: "open", actor: "MinhTuan99", actionNeeded: "Xác minh mối liên hệ chủ tài khoản" },
  { id: "AI-103", level: "low", title: "Giá niêm yết lệch sâu so với AI định giá", desc: "SIM 0909090909 được tạo giá sàn thấp hơn 55% so với mô hình AI", sim: "0909090909", time: "2 giờ trước", status: "resolved", actor: "SimVIP", actionNeeded: "Đã rà soát chấp thuận" },
];

export default function AdminControlCenter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentTab = searchParams?.get("tab") || "dashboard";

  // Data States
  const [sims, setSims] = useState<SimItem[]>(INITIAL_SIMS);
  const [auctions, setAuctions] = useState<AuctionItem[]>(INITIAL_AUCTIONS);
  const [categories, setCategories] = useState(INITIAL_CATEGORIES);
  const [carriers, setCarriers] = useState(INITIAL_CARRIERS);
  const [users, setUsers] = useState(INITIAL_USERS);
  const [ekycQueue, setEkycQueue] = useState(INITIAL_EKYC_QUEUE);
  const [transactions, setTransactions] = useState(INITIAL_TRANSACTIONS);
  const [disputes, setDisputes] = useState(INITIAL_DISPUTES);
  const [anomalies, setAnomalies] = useState(INITIAL_ANOMALIES);

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

  // =========================================================================
  // VIEW: 1. DASHBOARD (OPERATIONAL SUMMARY & PRIORITY ACTIONS)
  // =========================================================================
  const renderDashboard = () => {
    const liveCount = auctions.filter((a) => a.status === "live").length;
    const highRiskAlerts = anomalies.filter((a) => a.status === "open" && a.level === "high").length;
    const totalHeldEscrow = transactions
      .filter((t) => t.status === "Held" || t.status === "Disputed")
      .reduce((sum, t) => sum + t.amount, 0);

    return (
      <div className="space-y-6">
        {/* 1. PAGE HEADER (OPEN & BREATHING - NO ENCLOSING CARD BOX) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl lg:text-2xl font-bold text-[#001743] tracking-tight">
                Trung tâm điều hành TrustSim
              </h1>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium border border-emerald-200/60">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span>Vận hành ổn định</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 font-normal">
              {new Date().toLocaleDateString("vi-VN", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" })}
              {" · "}
              <span>{liveCount} phiên đang diễn ra</span>
              {" · "}
              <span className="text-emerald-700 font-medium">Định danh eKYC tự động AI</span>
              {highRiskAlerts > 0 && (
                <>
                  {" · "}
                  <span className="text-[#E4011E] font-medium">{highRiskAlerts} cảnh báo rủi ro</span>
                </>
              )}
            </p>
          </div>

          {/* Action Hierarchy: 1 Primary CTA (Navy), 1 Secondary Subtle (Outline) */}
          <div className="flex items-center gap-2.5">
            <a
              href="/admin?tab=sims"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-medium rounded-lg transition-colors shadow-2xs"
            >
              <Plus size={14} strokeWidth={1.75} />
              <span>Quản lý SIM</span>
            </a>
            <button
              onClick={() => setAuctionModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#001743] hover:bg-[#00266B] text-white text-xs font-semibold rounded-lg transition-all shadow-xs"
            >
              <Gavel size={14} strokeWidth={1.75} />
              <span>+ Mở phiên đấu giá</span>
            </button>
          </div>
        </div>

        {/* 2. UNIFIED KPI OVERVIEW (HERO METRIC + 3 SECONDARY METRICS, NO HEAVY GRIDS) */}
        <div className="bg-white border border-slate-200/70 rounded-xl p-5 shadow-xs elevation-card">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-5 items-center">
            {/* Hero Metric: Tổng ký quỹ đang giữ (Chiếm ưu thế thị giác) */}
            <div className="lg:col-span-3 flex flex-col justify-between pr-0 lg:pr-4">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-medium text-slate-500">Tổng ký quỹ đang giữ</span>
                <div className="p-1.5 rounded-md bg-blue-50 text-[#001743]">
                  <CreditCard size={15} strokeWidth={1.75} />
                </div>
              </div>
              <div className="mt-2">
                <div className="text-2xl lg:text-3xl font-bold text-[#001743] tabular-nums tracking-tight">
                  <AnimatedNumber value={totalHeldEscrow} isCurrency />
                </div>
                {/* Mini Sparkline Chart với Glowing Dot */}
                <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between gap-3">
                  <div className="text-[11px] text-emerald-700 font-medium flex items-center gap-1 shrink-0">
                    <TrendingUp size={12} />
                    <span>+12.4% tuần này</span>
                  </div>
                  <svg className="w-24 h-5 overflow-visible" viewBox="0 0 100 22" fill="none">
                    <polyline
                      className="animate-sparkline"
                      points="0,17 18,15 35,18 52,11 68,14 84,7 100,4"
                      fill="none"
                      stroke="#059669"
                      strokeWidth="1.75"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <g>
                      <circle cx="100" cy="4" r="4" fill="#059669" className="animate-ping opacity-75 origin-center" />
                      <circle cx="100" cy="4" r="2" fill="#059669" />
                    </g>
                  </svg>
                </div>
              </div>
            </div>

            {/* Subtle Divider */}
            <div className="hidden lg:block lg:col-span-1 h-14 w-px bg-slate-100 mx-auto" />

            {/* Metric 2 (Thứ cấp): Phiên đấu giá trực tiếp */}
            <div className="lg:col-span-2 flex flex-col justify-between">
              <div className="text-xs font-medium text-slate-500">Phiên trực tiếp</div>
              <div className="mt-2">
                <div className="text-xl font-bold text-slate-900 tabular-nums tracking-tight flex items-baseline gap-1.5">
                  <AnimatedNumber value={liveCount} />
                  <span className="text-xs font-normal text-slate-500">phiên</span>
                </div>
                <div className="mt-2.5 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                    <span className="text-amber-700 font-medium flex items-center gap-1">
                      <Clock size={11} />
                      <span>1 sắp hết (&lt; 5p)</span>
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1 overflow-hidden">
                    <div className="bg-amber-500 h-1 rounded-full" style={{ width: "25%" }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Subtle Divider */}
            <div className="hidden lg:block lg:col-span-1 h-14 w-px bg-slate-100 mx-auto" />

            {/* Metric 3 (Thứ cấp): eKYC tự động AI */}
            <div className="lg:col-span-2 flex flex-col justify-between">
              <div className="text-xs font-medium text-slate-500">eKYC Tự động (AI)</div>
              <div className="mt-2">
                <div className="text-xl font-bold text-slate-900 tabular-nums tracking-tight flex items-baseline gap-1.5">
                  <span className="text-emerald-600 font-bold">100%</span>
                  <span className="text-xs font-normal text-slate-500">tự động hóa</span>
                </div>
                <div className="mt-2.5 pt-2 border-t border-slate-100 text-[11px] text-slate-500 space-y-0.5">
                  <div>Tốc độ xác thực: <span className="font-medium text-slate-700">&lt; 3 giây</span></div>
                  <div className="text-emerald-700 font-medium flex items-center gap-1">
                    <CheckCircle2 size={11} />
                    <span>Hệ thống AI xử lý 24/7</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Subtle Divider */}
            <div className="hidden lg:block lg:col-span-1 h-14 w-px bg-slate-100 mx-auto" />

            {/* Metric 4 (Thứ cấp): Cảnh báo rủi ro AI - Nền trắng tinh gọn, thanh nhấn đỏ bên trái */}
            <div className="lg:col-span-2 flex flex-col justify-between pl-3 border-l-2 border-rose-500/80">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-700">Rủi ro AI</span>
                <span className="text-[10px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200/60">
                  KHẨN CẤP
                </span>
              </div>
              <div className="mt-2">
                <div className="text-xl font-bold text-[#E4011E] tabular-nums tracking-tight flex items-baseline gap-1.5">
                  <AnimatedNumber value={highRiskAlerts} />
                  <span className="text-xs font-normal text-slate-500">cảnh báo</span>
                </div>
                <div className="mt-2.5 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                  <div className="flex items-center gap-1 text-rose-700 font-medium truncate">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-600 shrink-0"></span>
                    <span className="truncate">Shill Bidding / IP</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Quét 30s/lần</div>
                </div>
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
                  <ShieldAlert size={16} className="text-[#E4011E]" />
                  <h2 className="text-sm font-semibold text-[#001743]">
                    Cảnh báo rủi ro AI &amp; Gian lận
                  </h2>
                </div>
                <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200/60">
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
                    {anomalies
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
                              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                anom.level === "high"
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
                      ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="px-5 py-2.5 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
              <span>Hệ thống phân tích hành vi tự động gắn cờ tài khoản nghi vấn liên minh đặt giá</span>
              <span className="font-medium text-slate-500">Độ tin cậy AI: 98.6%</span>
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
                  <circle cx="60" cy="60" r="42" fill="none" stroke="#F8FAFC" strokeWidth="13" />
                  {/* Segment 1: Đang bid sôi nổi (2 phiên = 50%) */}
                  <circle
                    cx="60"
                    cy="60"
                    r="42"
                    fill="none"
                    stroke="#001743"
                    strokeWidth={hoveredDonutSegment?.label === "Đang bid sôi nổi" ? 16 : 13}
                    strokeDasharray="131.9 263.9"
                    strokeDashoffset="0"
                    className="cursor-pointer transition-all duration-300 ease-out"
                    onMouseEnter={() =>
                      setHoveredDonutSegment({
                        label: "Đang bid sôi nổi",
                        count: "2 phiên (50%)",
                        color: "#001743",
                      })
                    }
                    onMouseLeave={() => setHoveredDonutSegment(null)}
                  />
                  {/* Segment 2: Sắp kết thúc (1 phiên = 25%) */}
                  <circle
                    cx="60"
                    cy="60"
                    r="42"
                    fill="none"
                    stroke="#F59E0B"
                    strokeWidth={hoveredDonutSegment?.label === "Sắp kết thúc" ? 16 : 13}
                    strokeDasharray="65.9 263.9"
                    strokeDashoffset="-131.9"
                    className="cursor-pointer transition-all duration-300 ease-out"
                    onMouseEnter={() =>
                      setHoveredDonutSegment({
                        label: "Sắp kết thúc",
                        count: "1 phiên (25%)",
                        color: "#F59E0B",
                      })
                    }
                    onMouseLeave={() => setHoveredDonutSegment(null)}
                  />
                  {/* Segment 3: Nghi vấn rủi ro (1 phiên = 25%) */}
                  <circle
                    cx="60"
                    cy="60"
                    r="42"
                    fill="none"
                    stroke="#E4011E"
                    strokeWidth={hoveredDonutSegment?.label === "Nghi vấn rủi ro" ? 16 : 13}
                    strokeDasharray="65.9 263.9"
                    strokeDashoffset="-197.8"
                    className="cursor-pointer transition-all duration-300 ease-out"
                    onMouseEnter={() =>
                      setHoveredDonutSegment({
                        label: "Nghi vấn rủi ro",
                        count: "1 phiên (25%)",
                        color: "#E4011E",
                      })
                    }
                    onMouseLeave={() => setHoveredDonutSegment(null)}
                  />
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
                <div
                  className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all ${
                    hoveredDonutSegment?.label === "Đang bid sôi nổi" ? "bg-slate-50" : "hover:bg-slate-50/70"
                  }`}
                  onMouseEnter={() =>
                    setHoveredDonutSegment({
                      label: "Đang bid sôi nổi",
                      count: "2 phiên (50%)",
                      color: "#001743",
                    })
                  }
                  onMouseLeave={() => setHoveredDonutSegment(null)}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#001743]"></span>
                    <span className="text-slate-600 font-normal">Đang bid sôi nổi</span>
                  </div>
                  <span className="font-semibold text-[#001743] tabular-nums">2 phiên (50%)</span>
                </div>

                <div
                  className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all ${
                    hoveredDonutSegment?.label === "Sắp kết thúc" ? "bg-amber-50/60" : "hover:bg-slate-50/70"
                  }`}
                  onMouseEnter={() =>
                    setHoveredDonutSegment({
                      label: "Sắp kết thúc",
                      count: "1 phiên (25%)",
                      color: "#F59E0B",
                    })
                  }
                  onMouseLeave={() => setHoveredDonutSegment(null)}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                    <span className="text-slate-600 font-normal">Sắp kết thúc (&lt; 5p)</span>
                  </div>
                  <span className="font-semibold text-amber-700 tabular-nums">1 phiên (25%)</span>
                </div>

                <div
                  className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all ${
                    hoveredDonutSegment?.label === "Nghi vấn rủi ro" ? "bg-rose-50/60" : "hover:bg-slate-50/70"
                  }`}
                  onMouseEnter={() =>
                    setHoveredDonutSegment({
                      label: "Nghi vấn rủi ro",
                      count: "1 phiên (25%)",
                      color: "#E4011E",
                    })
                  }
                  onMouseLeave={() => setHoveredDonutSegment(null)}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-rose-600"></span>
                    <span className="text-slate-600 font-normal">Nghi vấn rủi ro</span>
                  </div>
                  <span className="font-semibold text-rose-700 tabular-nums">1 phiên (25%)</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 mt-4">
              <div className="text-xs text-slate-400 flex items-center justify-between">
                <span>Tỷ lệ hoàn thành phiên:</span>
                <span className="font-semibold text-emerald-700">96.8%</span>
              </div>
            </div>
          </div>
        </div>

        {/* 4. LIVE AUCTIONS TABLE: TINH GỌN 7 CỘT CHÍNH (FLAT, BREADCRUMB HEADER) */}
        <div className="bg-white border border-slate-200/70 rounded-xl overflow-hidden elevation-card">
          <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-white">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
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
                  <th className="py-2 px-3 text-center">Lượt bid</th>
                  <th className="py-2 px-3">Thời gian còn lại</th>
                  <th className="py-2 px-3">Mức rủi ro AI</th>
                  <th className="py-2 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {auctions
                  .filter((a) => a.status === "live")
                  .map((a) => {
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
                  })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // (Tab Quản lý SIM đã chuyển sang AdminSimsTab; Tab eKYC đã gỡ bỏ do tự động hóa bằng AI)

  // =========================================================================
  // VIEW: 4. GIAO DỊCH KÝ QUỸ (5-STEP ESCROW TIMELINE & FINANCIAL CONTROL)
  // =========================================================================
  const renderTransactions = () => (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white border border-[#E2E8F0] rounded-[8px] p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-base font-bold text-[#001743]">Quản Lý Giao Dịch Ký Quỹ (Financial Control)</h1>
          <p className="text-xs text-[#6B7280] mt-0.5">
            Sàn nắm giữ 100% dòng tiền thanh toán trong tài khoản ký quỹ trung gian. Tiền chỉ được giải ngân cho bên bán sau khi hoàn tất sang tên chính chủ viễn thông.
          </p>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white border border-[#E2E8F0] rounded-[8px] overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-slate-500 font-semibold uppercase text-[10px] tracking-wider h-10">
                <th className="py-3 px-4">Mã đơn / SIM</th>
                <th className="py-3 px-4">Người mua</th>
                <th className="py-3 px-4">Người bán</th>
                <th className="py-3 px-4 text-right">Giá trị ký quỹ</th>
                <th className="py-3 px-4 text-right">Phí sàn (3%)</th>
                <th className="py-3 px-4 text-center">Trạng thái ký quỹ</th>
                <th className="py-3 px-4">Hạn giải quyết</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors h-14">
                  <td className="py-3 px-4">
                    <div className="font-extrabold text-sm text-[#001743] tabular-nums font-mono tracking-wider">
                      {formatPhone(tx.sim)}
                    </div>
                    <div className="text-[10px] text-[#9CA3AF] font-mono">{tx.orderCode}</div>
                  </td>
                  <td className="py-3 px-4 font-semibold text-[#001743]">{tx.buyer}</td>
                  <td className="py-3 px-4 font-semibold text-[#001743]">{tx.seller}</td>
                  <td className="py-3 px-4 text-right font-black text-sm text-[#001743] tabular-nums">
                    {formatVND(tx.amount)}
                  </td>
                  <td className="py-3 px-4 text-right text-emerald-700 font-bold tabular-nums">
                    +{formatVND(tx.fee)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`px-2 py-0.5 rounded-[4px] text-[10px] font-bold ${
                        tx.status === "Held"
                          ? "bg-amber-50 text-amber-800 border border-amber-200"
                          : tx.status === "Released"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : tx.status === "Disputed"
                          ? "bg-rose-50 text-rose-700 border border-rose-200"
                          : "bg-gray-100 text-gray-700 border border-gray-200"
                      }`}
                    >
                      {tx.status === "Held"
                        ? "Đang giữ ký quỹ"
                        : tx.status === "Released"
                        ? "Đã giải ngân"
                        : tx.status === "Disputed"
                        ? "Đang tranh chấp"
                        : "Đã hoàn tiền"}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-[#6B7280] text-[11px]">{tx.deadline}</td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => setSelectedTxForPipeline(tx)}
                      className="px-2.5 py-1 text-xs font-bold text-[#001743] hover:text-white bg-slate-100 hover:bg-[#001743] rounded-[4px] transition-colors"
                    >
                      Tiến độ 5 bước
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* =========================================================================
          MODAL: 5-STEP ESCROW PIPELINE TIMELINE
      ========================================================================= */}
      {selectedTxForPipeline && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white border border-[#E2E8F0] rounded-[8px] w-full max-w-2xl shadow-xl overflow-hidden animate-fade-up">
            <div className="px-5 py-4 border-b border-[#E2E8F0] flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#001743]">
                  Quy trình ký quỹ &amp; chuyển nhượng: {formatPhone(selectedTxForPipeline.sim)}
                </h3>
                <span className="text-xs text-[#6B7280]">Mã giao dịch: {selectedTxForPipeline.orderCode}</span>
              </div>
              <button
                onClick={() => setSelectedTxForPipeline(null)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* 5-Step Visual Timeline */}
              <div className="relative">
                <div className="absolute top-4 left-4 right-4 h-0.5 bg-gray-200 -z-0"></div>
                <div className="grid grid-cols-5 gap-2 relative z-10 text-center">
                  {[
                    { step: 1, label: "Đặt cọc", done: selectedTxForPipeline.pipelineStep >= 1 },
                    { step: 2, label: "Đủ ký quỹ", done: selectedTxForPipeline.pipelineStep >= 2 },
                    { step: 3, label: "Ký hợp đồng", done: selectedTxForPipeline.pipelineStep >= 3 },
                    { step: 4, label: "Sang tên SIM", done: selectedTxForPipeline.pipelineStep >= 4 },
                    { step: 5, label: "Giải ngân", done: selectedTxForPipeline.pipelineStep >= 5 },
                  ].map((st) => (
                    <div key={st.step} className="flex flex-col items-center">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold mb-1 ${
                          st.done
                            ? "bg-emerald-600 text-white"
                            : "bg-white border-2 border-gray-300 text-gray-400"
                        }`}
                      >
                        {st.done ? <Check size={14} /> : st.step}
                      </div>
                      <span className={`text-[11px] font-semibold ${st.done ? "text-[#001743]" : "text-[#9CA3AF]"}`}>
                        {st.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Conditions Checklist Card */}
              <div className="border border-[#E2E8F0] bg-[#F8F9FA] p-4 rounded-[6px] space-y-2 text-xs">
                <h4 className="font-bold text-[#001743] uppercase text-[11px]">
                  Điều kiện bắt buộc trước khi kích hoạt giải ngân
                </h4>
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center gap-2 text-emerald-700">
                    <CheckCircle2 size={15} />
                    <span>Người mua đã nạp đủ 100% số tiền {formatVND(selectedTxForPipeline.amount)} vào ký quỹ</span>
                  </div>
                  <div className="flex items-center gap-2 text-emerald-700">
                    <CheckCircle2 size={15} />
                    <span>Hợp đồng điện tử đã được cả hai bên ký số xác nhận</span>
                  </div>
                  <div
                    className={`flex items-center gap-2 ${
                      selectedTxForPipeline.pipelineStep >= 4 ? "text-emerald-700" : "text-amber-700 font-bold"
                    }`}
                  >
                    {selectedTxForPipeline.pipelineStep >= 4 ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />}
                    <span>
                      {selectedTxForPipeline.missingReason || "Hoàn tất xác nhận sang tên chính chủ viễn thông"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedTxForPipeline(null)}
                  className="px-3.5 py-1.5 border border-[#D1D5DB] text-xs font-semibold text-[#4B5563] rounded-[6px]"
                >
                  Đóng
                </button>
                {selectedTxForPipeline.status === "Held" && (
                  <button
                    type="button"
                    onClick={() => {
                      setTransactions(
                        transactions.map((t) =>
                          t.id === selectedTxForPipeline.id ? { ...t, status: "Released", pipelineStep: 5 } : t
                        )
                      );
                      setSelectedTxForPipeline(null);
                      showToast(`Đã duyệt giải ngân ${formatVND(selectedTxForPipeline.amount - selectedTxForPipeline.fee)} cho người bán.`);
                    }}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-[6px] transition-colors"
                  >
                    Duyệt giải ngân người bán
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

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
