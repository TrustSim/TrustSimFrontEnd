"use client";
import React, { useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
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
} from "lucide-react";

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
  const [simModalOpen, setSimModalOpen] = useState(false);
  const [editingSim, setEditingSim] = useState<SimItem | null>(null);
  const [selectedSimDrawer, setSelectedSimDrawer] = useState<SimItem | null>(null);

  const [auctionModalOpen, setAuctionModalOpen] = useState(false);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [carrierModalOpen, setCarrierModalOpen] = useState(false);

  // eKYC Review Workspace active record
  const [activeEkycId, setActiveEkycId] = useState<string>(INITIAL_EKYC_QUEUE[0]?.id || "");
  const activeEkycRecord = useMemo(() => {
    return ekycQueue.find((item) => item.id === activeEkycId) || ekycQueue[0] || null;
  }, [ekycQueue, activeEkycId]);

  const [rejectReasonModal, setRejectReasonModal] = useState<{ open: boolean; kycId: string; userName: string }>({
    open: false,
    kycId: "",
    userName: "",
  });

  // Escrow Pipeline Detail Modal
  const [selectedTxForPipeline, setSelectedTxForPipeline] = useState<any>(null);

  // Delete Safeguard
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: string; id: string; name: string } | null>(null);

  // Search & Filter
  const [searchSim, setSearchSim] = useState("");
  const [carrierFilter, setCarrierFilter] = useState("all");
  const [simStatusFilter, setSimStatusFilter] = useState("all");

  const [searchAuction, setSearchAuction] = useState("");
  const [auctionTypeFilter, setAuctionTypeFilter] = useState("all");
  const [auctionStatusFilter, setAuctionStatusFilter] = useState("all");

  const [searchUser, setSearchUser] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("all");

  // =========================================================================
  // VIEW: 1. DASHBOARD (OPERATIONAL SUMMARY & PRIORITY ACTIONS)
  // =========================================================================
  const renderDashboard = () => {
    const liveCount = auctions.filter((a) => a.status === "live").length;
    const pendingKycCount = ekycQueue.filter((k) => k.status === "pending").length;
    const highRiskAlerts = anomalies.filter((a) => a.status === "open" && a.level === "high").length;
    const totalHeldEscrow = transactions
      .filter((t) => t.status === "Held" || t.status === "Disputed")
      .reduce((sum, t) => sum + t.amount, 0);

    return (
      <div className="space-y-6">
        {/* Daily Operational Summary Banner */}
        <div className="bg-white border border-[#E5E7EB] rounded-[12px] p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <h1 className="text-xl font-extrabold text-[#001743] tracking-tight">
                Tổng quan vận hành hệ thống
              </h1>
            </div>
            <p className="text-xs text-[#6B7280] mt-1.5 font-medium">
              {new Date().toLocaleDateString("vi-VN", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" })}
              {" · "}
              <span className="font-bold text-[#001743]">{liveCount} phiên live</span>
              {" · "}
              <span className="font-bold text-amber-700">{pendingKycCount} việc cần phê duyệt</span>
              {" · "}
              <span className="font-bold text-[#E4011E]">{highRiskAlerts} cảnh báo rủi ro cao</span>
            </p>
          </div>

          {/* Action Hierarchy: 1 Primary, 1 Secondary */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setAuctionModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#001743] hover:bg-[#00266B] text-white text-xs font-bold rounded-[8px] transition-colors shadow-sm"
            >
              <Gavel size={16} strokeWidth={1.75} />
              <span>+ Mở phiên đấu giá</span>
            </button>
            <button
              onClick={() => {
                setEditingSim(null);
                setSimModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-gray-50 text-[#001743] border border-[#D1D5DB] text-xs font-semibold rounded-[8px] transition-colors"
            >
              <Plus size={16} strokeWidth={1.75} />
              <span>Thêm SIM mới</span>
            </button>
          </div>
        </div>

        {/* 4 Priority Actionable KPIs (Top Row) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* KPI 1: Ký quỹ */}
          <div className="bg-white border border-[#E5E7EB] rounded-[12px] p-5 shadow-sm hover:border-gray-300 transition-all flex flex-col justify-between">
            <div className="flex items-center justify-between text-[#6B7280]">
              <span className="text-xs font-bold uppercase tracking-wider">Tổng ký quỹ đang giữ</span>
              <div className="w-8 h-8 rounded-[8px] bg-slate-100 text-[#001743] flex items-center justify-center">
                <CreditCard size={18} strokeWidth={1.5} />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-[#001743] tabular-nums tracking-tight">
                {formatVND(totalHeldEscrow)}
              </div>
              <div className="text-[11px] text-emerald-700 font-semibold mt-1 flex items-center gap-1">
                <CheckCircle2 size={13} />
                <span>Bảo chứng 100% tài chính người mua</span>
              </div>
            </div>
          </div>

          {/* KPI 2: Phiên Live */}
          <div className="bg-white border border-[#E5E7EB] rounded-[12px] p-5 shadow-sm hover:border-gray-300 transition-all flex flex-col justify-between">
            <div className="flex items-center justify-between text-[#6B7280]">
              <span className="text-xs font-bold uppercase tracking-wider">Phiên đấu giá đang Live</span>
              <div className="w-8 h-8 rounded-[8px] bg-indigo-50 text-indigo-700 flex items-center justify-center">
                <Gavel size={18} strokeWidth={1.5} />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-[#001743] tabular-nums tracking-tight">
                {liveCount} <span className="text-sm font-semibold text-[#6B7280]">phiên</span>
              </div>
              <div className="text-[11px] text-amber-700 font-semibold mt-1 flex items-center gap-1">
                <Clock size={13} />
                <span>1 phiên còn lại dưới 5 phút</span>
              </div>
            </div>
          </div>

          {/* KPI 3: eKYC Chờ Duyệt */}
          <div className="bg-white border border-[#E5E7EB] rounded-[12px] p-5 shadow-sm hover:border-gray-300 transition-all flex flex-col justify-between">
            <div className="flex items-center justify-between text-[#6B7280]">
              <span className="text-xs font-bold uppercase tracking-wider">Hồ sơ eKYC chờ duyệt</span>
              <div className="w-8 h-8 rounded-[8px] bg-amber-50 text-amber-700 flex items-center justify-center">
                <ShieldCheck size={18} strokeWidth={1.5} />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-amber-800 tabular-nums tracking-tight">
                {pendingKycCount} <span className="text-sm font-semibold text-[#6B7280]">hồ sơ</span>
              </div>
              <div className="text-[11px] text-[#6B7280] font-medium mt-1">
                Thời gian chờ trung bình: <strong className="text-[#001743]">2.5h</strong>
              </div>
            </div>
          </div>

          {/* KPI 4: Cảnh báo AI khẩn cấp */}
          <div className="bg-white border border-rose-200 rounded-[12px] p-5 shadow-sm hover:border-rose-300 transition-all flex flex-col justify-between">
            <div className="flex items-center justify-between text-[#6B7280]">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-700">Cảnh báo rủi ro AI</span>
              <div className="w-8 h-8 rounded-[8px] bg-rose-50 text-rose-700 flex items-center justify-center">
                <Bot size={18} strokeWidth={1.5} />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-[#E4011E] tabular-nums tracking-tight">
                {highRiskAlerts} <span className="text-sm font-semibold text-[#6B7280]">khẩn cấp</span>
              </div>
              <div className="text-[11px] text-rose-700 font-bold mt-1 flex items-center gap-1">
                <AlertTriangle size={13} />
                <span>Nghi vấn Shill Bidding & Trùng IP</span>
              </div>
            </div>
          </div>
        </div>

        {/* Secondary Operational Metrics Strip */}
        <div className="bg-white border border-[#E5E7EB] rounded-[10px] px-5 py-3 text-xs text-[#4B5563] flex flex-wrap items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-6 flex-wrap">
            <div>
              <span className="text-[#9CA3AF]">Kho SIM hiện tại:</span>{" "}
              <strong className="text-[#001743] tabular-nums">11.820 SIM</strong>
            </div>
            <div>
              <span className="text-[#9CA3AF]">Thành viên đã định danh:</span>{" "}
              <strong className="text-[#001743] tabular-nums">1.842 tài khoản</strong>
            </div>
            <div>
              <span className="text-[#9CA3AF]">Tỷ lệ giao dịch an toàn:</span>{" "}
              <strong className="text-emerald-700 font-bold tabular-nums">99.1%</strong>
            </div>
          </div>
          <div className="text-[11px] text-[#6B7280]">
            Chu kỳ đối soát ký quỹ tiếp theo: <strong className="text-[#001743]">20:00 hôm nay</strong>
          </div>
        </div>

        {/* Urgent AI Risk Alerts Box (Left-accent red bar) */}
        {highRiskAlerts > 0 && (
          <div className="bg-white border border-rose-200 border-l-4 border-l-rose-600 rounded-[10px] p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-rose-100">
              <div className="flex items-center gap-2">
                <ShieldAlert size={18} className="text-[#E4011E]" />
                <h3 className="text-sm font-bold text-[#001743] uppercase tracking-wider">
                  Cảnh báo AI Phòng chống Gian lận & Rủi ro Vi phạm
                </h3>
              </div>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-[6px] bg-rose-100 text-rose-800">
                1 nghiêm trọng · 1 cần xem xét
              </span>
            </div>

            <div className="mt-3 space-y-3">
              {anomalies
                .filter((a) => a.status === "open")
                .map((anom) => (
                  <div
                    key={anom.id}
                    className="p-3.5 bg-rose-50/40 border border-rose-100 rounded-[8px] flex flex-col md:flex-row md:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-rose-600 text-white">
                          {anom.level === "high" ? "Khẩn cấp" : "Cần xem xét"}
                        </span>
                        <span className="font-bold text-xs text-[#001743]">{anom.title}</span>
                        <span className="text-[11px] text-[#9CA3AF]">· {anom.time}</span>
                      </div>
                      <p className="text-xs text-[#4B5563] leading-relaxed">
                        {anom.desc}
                      </p>
                      <div className="text-[11px] text-[#6B7280]">
                        Đối tượng: <strong className="text-[#001743] font-mono">{anom.actor}</strong> · SIM liên quan:{" "}
                        <strong className="text-[#001743] font-mono">{formatPhone(anom.sim)}</strong>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => showToast(`Đã ra lệnh phong tỏa khẩn cấp phiên đấu giá SIM ${anom.sim}.`)}
                        className="px-3 py-1.5 bg-[#E4011E] hover:bg-[#B80018] text-white text-xs font-bold rounded-[6px] transition-colors shadow-sm"
                      >
                        Phong tỏa phiên
                      </button>
                      <button
                        onClick={() => {
                          setAnomalies(anomalies.map((a) => (a.id === anom.id ? { ...a, status: "resolved" } : a)));
                          showToast(`Đã đánh dấu xử lý xong cảnh báo ${anom.id}.`);
                        }}
                        className="px-3 py-1.5 bg-white border border-[#D1D5DB] hover:bg-gray-50 text-[#4B5563] text-xs font-semibold rounded-[6px] transition-colors"
                      >
                        Bỏ qua
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Live Auctions Table (Financial Control Center Format) */}
        <div className="bg-white border border-[#E5E7EB] rounded-[12px] overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-[#E5E7EB] flex items-center justify-between bg-white">
            <div className="flex items-center gap-2.5">
              {/* Strictly Deep Navy for Auction Live, NOT plain red */}
              <span className="px-2.5 py-0.5 rounded-[6px] bg-[#001743] text-white text-[11px] font-black uppercase flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Phiên Live</span>
              </span>
              <h2 className="text-sm font-bold text-[#001743] uppercase tracking-wider">
                Giám sát trả giá trực tiếp (Real-Time Control)
              </h2>
            </div>
            <a
              href="/admin?tab=auctions"
              className="text-xs font-bold text-[#001743] hover:text-[#E4011E] inline-flex items-center gap-1"
            >
              <span>Xem toàn bộ phiên</span>
              <ChevronRight size={14} />
            </a>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#E5E7EB] bg-[#F8F9FA] text-[#6B7280] font-bold uppercase text-[10px] tracking-wider h-11">
                  <th className="py-3 px-4">Số SIM / Người bán</th>
                  <th className="py-3 px-4">Hình thức</th>
                  <th className="py-3 px-4 text-right">Giá hiện tại</th>
                  <th className="py-3 px-4">Người dẫn đầu</th>
                  <th className="py-3 px-4 text-center">Lượt bid</th>
                  <th className="py-3 px-4">Thời gian còn lại</th>
                  <th className="py-3 px-4 text-center">Mức rủi ro AI</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {auctions
                  .filter((a) => a.status === "live")
                  .map((a) => (
                    <tr key={a.id} className="hover:bg-slate-50/80 transition-colors h-16">
                      <td className="py-3 px-4">
                        <div className="font-extrabold text-sm text-[#001743] tabular-nums font-mono tracking-wider">
                          {formatPhone(a.sim)}
                        </div>
                        <div className="text-[11px] text-[#6B7280]">Bởi: {a.seller}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-[4px] text-[10px] font-bold uppercase bg-blue-50 text-blue-700 border border-blue-200">
                          {a.type === "english" ? "Kiểu Anh" : a.type === "dutch" ? "Hà Lan" : "Bí mật"}
                        </span>
                      </td>
                      {/* Strongest Visual Focal Point */}
                      <td className="py-3 px-4 text-right">
                        <div className="font-black text-base text-[#001743] tabular-nums tracking-tight">
                          {formatVND(a.currentPrice)}
                        </div>
                        <div className="text-[10px] text-[#9CA3AF] tabular-nums">Sàn: {formatVND(a.startPrice)}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-[#001743]">{a.leader}</div>
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-[#001743] tabular-nums">
                        {a.bids}
                      </td>
                      <td className="py-3 px-4">
                        <div
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] text-xs font-bold ${
                            a.isUrgentCountdown
                              ? "bg-amber-100 text-amber-900 border border-amber-300 animate-pulse"
                              : "bg-gray-100 text-[#001743]"
                          }`}
                        >
                          <Clock size={13} className={a.isUrgentCountdown ? "text-amber-800" : "text-[#6B7280]"} />
                          <span className="tabular-nums font-mono">{a.timeLeft}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-[4px] text-[10px] font-bold ${
                            a.riskLevel === "safe"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : a.riskLevel === "monitor"
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : "bg-rose-50 text-rose-700 border border-rose-200"
                          }`}
                        >
                          {a.riskLevel === "safe" ? "An toàn" : a.riskLevel === "monitor" ? "Theo dõi" : "Rủi ro cao"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {a.isUrgentCountdown && (
                            <button
                              onClick={() => showToast(`Đã gia hạn phiên đấu giá ${a.sim} thêm 15 phút.`)}
                              className="px-2.5 py-1 text-xs font-bold text-[#001743] border border-[#001743] hover:bg-[#001743] hover:text-white rounded-[6px] transition-colors"
                            >
                              Gia hạn
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setSelectedSimDrawer(sims.find((s) => s.phone === a.sim) || null);
                            }}
                            className="p-1.5 text-[#4B5563] hover:text-[#001743] hover:bg-gray-100 rounded-[6px] transition-colors"
                            title="Xem chi tiết SIM & Lịch sử"
                          >
                            <Eye size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // =========================================================================
  // VIEW: 2. QUẢN LÝ SIM & AI VALUATION (WITH SLIDE-IN DETAIL DRAWER)
  // =========================================================================
  const filteredSims = useMemo(() => {
    return sims.filter((s) => {
      const matchSearch =
        s.phone.includes(searchSim.replace(/\s/g, "")) ||
        s.id.toLowerCase().includes(searchSim.toLowerCase()) ||
        s.category.toLowerCase().includes(searchSim.toLowerCase());
      const matchCarrier = carrierFilter === "all" || s.carrier.toLowerCase() === carrierFilter.toLowerCase();
      const matchStatus = simStatusFilter === "all" || s.status === simStatusFilter;
      return matchSearch && matchCarrier && matchStatus;
    });
  }, [sims, searchSim, carrierFilter, simStatusFilter]);

  const renderSims = () => (
    <div className="space-y-4">
      {/* Header & Controls */}
      <div className="bg-white border border-[#E5E7EB] rounded-[12px] p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-[#001743]">Kho SIM & Mô Hình Định Giá AI</h1>
          <p className="text-xs text-[#6B7280] mt-0.5">
            Cơ sở dữ liệu toàn bộ SIM số đẹp, phân tích quy luật phong thủy và đối soát giá thị trường với AI Engine.
          </p>
        </div>
        <button
          onClick={() => {
            setEditingSim(null);
            setSimModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#001743] hover:bg-[#00266B] text-white text-xs font-bold rounded-[8px] transition-colors shadow-sm"
        >
          <Plus size={15} strokeWidth={1.75} />
          <span>Thêm SIM vào kho</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white border border-[#E5E7EB] rounded-[10px] p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
          <div className="relative w-72">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm theo số SIM, mã định danh, thế số..."
              value={searchSim}
              onChange={(e) => setSearchSim(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-[#D1D5DB] rounded-[8px] focus:border-[#001743] focus:outline-none"
            />
          </div>

          <select
            value={carrierFilter}
            onChange={(e) => setCarrierFilter(e.target.value)}
            className="text-xs py-1.5 px-3 bg-white border border-[#D1D5DB] rounded-[8px] focus:border-[#001743] focus:outline-none"
          >
            <option value="all">Tất cả nhà mạng</option>
            <option value="Viettel">Viettel</option>
            <option value="Vinaphone">Vinaphone</option>
            <option value="Mobifone">Mobifone</option>
            <option value="Vietnamobile">Vietnamobile</option>
          </select>

          <select
            value={simStatusFilter}
            onChange={(e) => setSimStatusFilter(e.target.value)}
            className="text-xs py-1.5 px-3 bg-white border border-[#D1D5DB] rounded-[8px] focus:border-[#001743] focus:outline-none"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="Available">Sẵn sàng bán (Available)</option>
            <option value="InAuction">Đang đấu giá (InAuction)</option>
            <option value="Sold">Đã bán (Sold)</option>
            <option value="Locked">Đang khóa (Locked)</option>
          </select>
        </div>

        <div className="text-xs text-[#6B7280]">
          Hiển thị <strong className="text-[#001743]">{filteredSims.length}</strong> SIM trong danh mục
        </div>
      </div>

      {/* Main SIM Table */}
      <div className="bg-white border border-[#E5E7EB] rounded-[12px] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#E5E7EB] bg-[#F8F9FA] text-[#6B7280] font-bold uppercase text-[10px] tracking-wider h-11">
                <th className="py-3 px-4">Số SIM / Mã kho</th>
                <th className="py-3 px-4">Nhà mạng</th>
                <th className="py-3 px-4">Thế số (Pattern)</th>
                <th className="py-3 px-4 text-right">Định giá AI</th>
                <th className="py-3 px-4 text-right">Giá niêm yết</th>
                <th className="py-3 px-4 text-center">Trạng thái</th>
                <th className="py-3 px-4">Ngày nhập</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {filteredSims.map((s) => {
                const canDelete = s.status === "Available";
                return (
                  <tr
                    key={s.id}
                    onClick={() => setSelectedSimDrawer(s)}
                    className="hover:bg-slate-50/80 transition-colors h-16 cursor-pointer"
                  >
                    <td className="py-3 px-4">
                      <div className="font-extrabold text-sm text-[#001743] tabular-nums font-mono tracking-wider">
                        {formatPhone(s.phone)}
                      </div>
                      <div className="text-[10px] text-[#9CA3AF]">{s.id} · {s.type}</div>
                    </td>
                    <td className="py-3 px-4 font-semibold text-[#001743]">{s.carrier}</td>
                    <td className="py-3 px-4">
                      <span
                        title={s.patternDesc}
                        className="px-2.5 py-1 rounded-[6px] text-[11px] font-bold bg-slate-100 text-[#001743] border border-slate-200 inline-flex items-center gap-1"
                      >
                        <span>{s.category}</span>
                        <HelpCircle size={11} className="text-[#9CA3AF]" />
                      </span>
                    </td>
                    {/* Cột Định giá AI độc quyền */}
                    <td className="py-3 px-4 text-right">
                      <div className="font-black text-[#001743] tabular-nums">
                        {formatVND(s.aiValuation)}
                      </div>
                      <span className="text-[10px] text-indigo-700 font-extrabold bg-indigo-50 px-1.5 py-0.2 rounded">
                        x{s.aiMultiplier} AI Score
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-[#001743] tabular-nums">
                      {formatVND(s.price)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-[4px] text-[10px] font-bold ${
                          s.status === "Available"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : s.status === "InAuction"
                            ? "bg-[#001743] text-white"
                            : s.status === "Sold"
                            ? "bg-gray-100 text-gray-600 border border-gray-200"
                            : "bg-rose-50 text-rose-700 border border-rose-200"
                        }`}
                      >
                        {s.status === "Available"
                          ? "Sẵn sàng"
                          : s.status === "InAuction"
                          ? "Đang live"
                          : s.status === "Sold"
                          ? "Đã bán"
                          : "Đang khóa"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[#9CA3AF] text-[11px]">{s.created}</td>
                    <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setEditingSim(s);
                            setSimModalOpen(true);
                          }}
                          className="p-1.5 text-[#4B5563] hover:text-[#001743] hover:bg-gray-100 rounded-[6px] transition-colors"
                          title="Chỉnh sửa SIM"
                        >
                          <Edit3 size={15} strokeWidth={1.5} />
                        </button>
                        <button
                          onClick={() => {
                            const newStatus = s.status === "Locked" ? "Available" : "Locked";
                            setSims(sims.map((item) => (item.id === s.id ? { ...item, status: newStatus } : item)));
                            showToast(`Đã ${newStatus === "Locked" ? "khóa" : "mở khóa"} SIM ${s.phone}.`);
                          }}
                          className="p-1.5 text-[#4B5563] hover:text-amber-600 hover:bg-amber-50 rounded-[6px] transition-colors"
                          title={s.status === "Locked" ? "Mở khóa" : "Khóa SIM"}
                        >
                          {s.status === "Locked" ? <Unlock size={15} /> : <Lock size={15} />}
                        </button>
                        {/* Nút Xóa chỉ sáng khi SIM chưa vào phiên đấu giá hoặc chưa bán */}
                        <button
                          disabled={!canDelete}
                          onClick={() => {
                            if (canDelete) {
                              setDeleteConfirm({ type: "sim", id: s.id, name: s.phone });
                            }
                          }}
                          className={`p-1.5 rounded-[6px] transition-colors ${
                            canDelete
                              ? "text-[#4B5563] hover:text-rose-600 hover:bg-rose-50"
                              : "text-gray-300 cursor-not-allowed"
                          }`}
                          title={canDelete ? "Xóa SIM khỏi kho" : "Không thể xóa SIM đang trong phiên hoặc đã bán"}
                        >
                          <Trash2 size={15} strokeWidth={1.5} />
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

      {/* =========================================================================
          SLIDE-IN SIM DETAIL DRAWER
      ========================================================================= */}
      {selectedSimDrawer && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-black/30 backdrop-blur-sm flex justify-end animate-fade-in">
          <div className="w-full max-w-[480px] bg-white h-full shadow-2xl flex flex-col justify-between border-l border-[#E5E7EB] p-6 overflow-y-auto animate-fade-up">
            <div className="space-y-5">
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-4 border-b border-[#E5E7EB]">
                <div>
                  <span className="text-[10px] font-bold text-[#9CA3AF] uppercase">Hồ sơ chi tiết SIM</span>
                  <div className="text-xl font-black text-[#001743] font-mono tracking-wider">
                    {formatPhone(selectedSimDrawer.phone)}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedSimDrawer(null)}
                  className="p-1.5 rounded-[8px] text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                >
                  <X size={18} />
                </button>
              </div>

              {/* SIM Graphic Card */}
              <div className="bg-[#001743] text-white p-5 rounded-[12px] shadow-md relative overflow-hidden">
                <div className="flex justify-between items-center mb-6">
                  <span className="text-xs font-bold uppercase tracking-widest text-slate-300">
                    {selectedSimDrawer.carrier}
                  </span>
                  <span className="text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded">
                    {selectedSimDrawer.type}
                  </span>
                </div>
                <div className="text-2xl font-black tracking-widest font-mono mb-4 text-center">
                  {formatPhone(selectedSimDrawer.phone)}
                </div>
                <div className="flex justify-between items-end text-xs text-slate-300 border-t border-white/15 pt-3">
                  <div>
                    <span className="text-[10px] block text-slate-400">Thế số nhận diện</span>
                    <span className="font-bold text-white">{selectedSimDrawer.category}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] block text-slate-400">Giá niêm yết</span>
                    <span className="font-extrabold text-white text-sm tabular-nums">
                      {formatVND(selectedSimDrawer.price)}
                    </span>
                  </div>
                </div>
              </div>

              {/* AI Valuation Engine Deep Dive */}
              <div className="border border-indigo-100 bg-indigo-50/40 p-4 rounded-[10px] space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#001743]">
                    <Bot size={15} className="text-indigo-700" />
                    <span>Mô hình định giá AI (TrustSim AI Valuation)</span>
                  </div>
                  <span className="text-xs font-black text-indigo-700 tabular-nums">
                    {formatVND(selectedSimDrawer.aiValuation)}
                  </span>
                </div>
                <p className="text-xs text-[#4B5563] leading-relaxed">
                  {selectedSimDrawer.patternDesc}
                </p>
                <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                  <div className="bg-white p-2 rounded-[6px] border border-indigo-100">
                    <span className="text-[#6B7280] block">Hệ số độ hiếm</span>
                    <strong className="text-[#001743] font-bold">{selectedSimDrawer.aiMultiplier}x Base Price</strong>
                  </div>
                  <div className="bg-white p-2 rounded-[6px] border border-indigo-100">
                    <span className="text-[#6B7280] block">Dự báo thanh khoản</span>
                    <strong className="text-emerald-700 font-bold">Rất cao (A+)</strong>
                  </div>
                </div>
              </div>

              {/* Verification & Legal Status */}
              <div className="border border-[#E5E7EB] p-4 rounded-[10px] space-y-2 text-xs">
                <h4 className="font-bold text-[#001743] uppercase text-[11px] tracking-wider">
                  Trạng thái pháp lý & Sang tên
                </h4>
                <div className="flex justify-between items-center py-1 border-b border-[#E5E7EB]">
                  <span className="text-[#6B7280]">Chủ thể đăng ký:</span>
                  <span className="font-bold text-[#001743]">Chính chủ đã xác thực eKYC</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-[#E5E7EB]">
                  <span className="text-[#6B7280]">Cam kết chuyển nhượng:</span>
                  <span className="font-bold text-emerald-700">Hợp đồng điện tử ký số</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-[#6B7280]">Trạng thái kho:</span>
                  <span className="font-bold text-[#001743]">{selectedSimDrawer.status}</span>
                </div>
              </div>
            </div>

            {/* Drawer Actions */}
            <div className="pt-4 border-t border-[#E5E7EB] space-y-2">
              <button
                onClick={() => {
                  setSelectedSimDrawer(null);
                  setAuctionModalOpen(true);
                }}
                className="w-full py-2.5 bg-[#001743] hover:bg-[#00266B] text-white text-xs font-bold rounded-[8px] transition-colors"
              >
                Mở phiên đấu giá cho SIM này
              </button>
              <button
                onClick={() => {
                  setEditingSim(selectedSimDrawer);
                  setSelectedSimDrawer(null);
                  setSimModalOpen(true);
                }}
                className="w-full py-2 bg-white border border-[#D1D5DB] hover:bg-gray-50 text-[#001743] text-xs font-semibold rounded-[8px] transition-colors"
              >
                Chỉnh sửa giá & thông số
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // =========================================================================
  // VIEW: 3. PHÊ DUYỆT eKYC (PROFESSIONAL 3-COLUMN REVIEW WORKSPACE)
  // =========================================================================
  const renderEkycWorkspace = () => (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white border border-[#E5E7EB] rounded-[12px] p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-[#001743]">Không Gian Thẩm Định Hồ Sơ eKYC (Review Workspace)</h1>
          <p className="text-xs text-[#6B7280] mt-0.5">
            Quy trình đối chiếu 3 lớp: Bóc tách OCR thẻ căn cước gắn chip, phát hiện gian lận giả mạo (Anti-spoofing) và đối soát sinh trắc học khuôn mặt.
          </p>
        </div>
        <div className="px-3 py-1.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-[8px] text-xs font-bold">
          {ekycQueue.length} hồ sơ đang chờ quyết định
        </div>
      </div>

      {/* 3-Column Review Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* CỘT 1: Danh sách hồ sơ chờ duyệt (3 / 12) */}
        <div className="lg:col-span-3 bg-white border border-[#E5E7EB] rounded-[12px] p-3.5 shadow-sm space-y-2">
          <div className="text-xs font-bold text-[#001743] uppercase tracking-wider mb-2">
            Hàng đợi kiểm tra ({ekycQueue.length})
          </div>
          <div className="space-y-2">
            {ekycQueue.map((item) => {
              const isActive = item.id === activeEkycRecord?.id;
              return (
                <div
                  key={item.id}
                  onClick={() => setActiveEkycId(item.id)}
                  className={`p-3 rounded-[8px] border transition-all cursor-pointer ${
                    isActive
                      ? "bg-slate-100 border-[#001743] shadow-sm"
                      : "bg-[#F8F9FA] border-[#E5E7EB] hover:border-gray-300"
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-bold text-xs text-[#001743]">{item.userName}</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800">
                      Chờ duyệt
                    </span>
                  </div>
                  <div className="text-[11px] text-[#6B7280] font-mono">CCCD: {item.idCardNumber}</div>
                  <div className="flex justify-between items-center mt-2 text-[10px]">
                    <span className="text-emerald-700 font-bold">Match: {item.faceMatchScore}%</span>
                    <span className="text-[#9CA3AF]">{item.submittedAt.split("(")[0]}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* CỘT 2: Khu vực ảnh CCCD & Selfie đối soát (5 / 12) */}
        <div className="lg:col-span-5 bg-white border border-[#E5E7EB] rounded-[12px] p-4 shadow-sm space-y-4">
          <div className="text-xs font-bold text-[#001743] uppercase tracking-wider">
            Tài liệu ảnh gốc chụp từ thiết bị công dân
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Front Card */}
            <div className="border border-[#E5E7EB] rounded-[8px] p-2.5 bg-[#F8F9FA] text-center">
              <span className="text-[11px] font-bold text-[#001743] block mb-1.5">1. Mặt trước CCCD</span>
              <div className="h-32 bg-slate-200 rounded-[6px] flex flex-col items-center justify-center text-[#6B7280] text-[11px] border border-dashed border-slate-300 relative group">
                <FileText size={24} className="text-slate-400 mb-1" />
                <span>Ảnh mặt trước</span>
                <span className="text-[10px] text-emerald-700 font-bold mt-1">✓ Bóc tách OCR đạt</span>
              </div>
            </div>

            {/* Back Card */}
            <div className="border border-[#E5E7EB] rounded-[8px] p-2.5 bg-[#F8F9FA] text-center">
              <span className="text-[11px] font-bold text-[#001743] block mb-1.5">2. Mặt sau CCCD</span>
              <div className="h-32 bg-slate-200 rounded-[6px] flex flex-col items-center justify-center text-[#6B7280] text-[11px] border border-dashed border-slate-300">
                <FileText size={24} className="text-slate-400 mb-1" />
                <span>Ảnh mặt sau</span>
                <span className="text-[10px] text-emerald-700 font-bold mt-1">✓ Chip NFC hợp lệ</span>
              </div>
            </div>
          </div>

          {/* Selfie Portrait Card */}
          <div className="border border-[#E5E7EB] rounded-[8px] p-3 bg-[#F8F9FA]">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[11px] font-bold text-[#001743]">3. Video chân dung động (Liveness Check)</span>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                Live Video Verified
              </span>
            </div>
            <div className="h-36 bg-slate-200 rounded-[6px] flex flex-col items-center justify-center text-[#6B7280] text-xs border border-dashed border-slate-300">
              <UserCheck size={28} className="text-slate-400 mb-1" />
              <span>Chân dung sinh trắc học trực diện</span>
              <span className="text-[10px] text-emerald-700 font-extrabold mt-1">
                AI Face Match: {activeEkycRecord?.faceMatchScore}%
              </span>
            </div>
          </div>
        </div>

        {/* CỘT 3: Dữ liệu bóc tách & Phân tích rủi ro AI (4 / 12) */}
        <div className="lg:col-span-4 bg-white border border-[#E5E7EB] rounded-[12px] p-4 shadow-sm flex flex-col justify-between h-full space-y-4">
          <div>
            <div className="text-xs font-bold text-[#001743] uppercase tracking-wider mb-3">
              Kết quả so khớp tự động
            </div>

            {activeEkycRecord ? (
              <div className="space-y-3 text-xs">
                <div className="bg-[#F8F9FA] p-3 rounded-[8px] border border-[#E5E7EB] space-y-2">
                  <div>
                    <span className="text-[10px] text-[#6B7280] uppercase">Họ và tên theo CCCD</span>
                    <div className="font-extrabold text-sm text-[#001743]">{activeEkycRecord.userName}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[10px] text-[#6B7280] uppercase">Số CCCD</span>
                      <div className="font-mono font-bold text-[#001743]">{activeEkycRecord.idCardNumber}</div>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#6B7280] uppercase">Ngày sinh</span>
                      <div className="font-bold text-[#001743]">{activeEkycRecord.dob}</div>
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#6B7280] uppercase">Địa chỉ thường trú</span>
                    <div className="text-[#001743] leading-snug">{activeEkycRecord.address}</div>
                  </div>
                </div>

                {/* AI Risk Checks */}
                <div className="border border-indigo-100 bg-indigo-50/40 p-3 rounded-[8px] space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-[#6B7280]">Độ khớp khuôn mặt:</span>
                    <strong className="text-emerald-700 font-extrabold">{activeEkycRecord.faceMatchScore}% (Đạt)</strong>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[#6B7280]">Chống giả mạo (Anti-spoofing):</span>
                    <strong className="text-emerald-700 font-bold">{activeEkycRecord.antiSpoofing}</strong>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[#6B7280]">Danh sách đen viễn thông:</span>
                    <strong className="text-emerald-700 font-bold">{activeEkycRecord.blacklistCheck}</strong>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-[#9CA3AF]">Không có hồ sơ nào được chọn</div>
            )}
          </div>

          {/* Bottom Decision Bar */}
          {activeEkycRecord && (
            <div className="pt-3 border-t border-[#E5E7EB] space-y-2">
              <button
                onClick={() => {
                  setEkycQueue(ekycQueue.filter((x) => x.id !== activeEkycRecord.id));
                  showToast(`Đã phê duyệt thành công hồ sơ eKYC của ${activeEkycRecord.userName}.`);
                }}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-[8px] transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                <Check size={16} />
                <span>Phê duyệt hồ sơ chính thức</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    setRejectReasonModal({
                      open: true,
                      kycId: activeEkycRecord.id,
                      userName: activeEkycRecord.userName,
                    });
                  }}
                  className="py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded-[8px] transition-colors flex items-center justify-center gap-1.5"
                >
                  <X size={15} />
                  <span>Từ chối</span>
                </button>
                <button
                  onClick={() => {
                    showToast(`Đã gửi yêu cầu bổ sung ảnh chụp rõ nét tới ${activeEkycRecord.userName}.`);
                  }}
                  className="py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold rounded-[8px] transition-colors"
                >
                  Yêu cầu bổ sung
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // =========================================================================
  // VIEW: 4. GIAO DỊCH KÝ QUỸ (5-STEP ESCROW TIMELINE & FINANCIAL CONTROL)
  // =========================================================================
  const renderTransactions = () => (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white border border-[#E5E7EB] rounded-[12px] p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-[#001743]">Quản Lý Giao Dịch Ký Quỹ (Financial Control)</h1>
          <p className="text-xs text-[#6B7280] mt-0.5">
            Sàn nắm giữ 100% dòng tiền thanh toán trong tài khoản ký quỹ trung gian. Tiền chỉ được giải ngân cho bên bán sau khi hoàn tất sang tên chính chủ viễn thông.
          </p>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white border border-[#E5E7EB] rounded-[12px] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#E5E7EB] bg-[#F8F9FA] text-[#6B7280] font-bold uppercase text-[10px] tracking-wider h-11">
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
            <tbody className="divide-y divide-[#E5E7EB]">
              {transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors h-16">
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
                      className={`px-2.5 py-0.5 rounded-[4px] text-[10px] font-bold ${
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
                      className="px-3 py-1.5 text-xs font-bold text-[#001743] hover:text-white bg-slate-100 hover:bg-[#001743] rounded-[6px] transition-colors"
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
          <div className="bg-white border border-[#E5E7EB] rounded-[12px] w-full max-w-2xl shadow-xl overflow-hidden animate-fade-up">
            <div className="px-5 py-4 border-b border-[#E5E7EB] flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#001743]">
                  Quy trình ký quỹ & chuyển nhượng: {formatPhone(selectedTxForPipeline.sim)}
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
              <div className="border border-[#E5E7EB] bg-[#F8F9FA] p-4 rounded-[10px] space-y-2 text-xs">
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
                  className="px-4 py-2 border border-[#D1D5DB] text-xs font-semibold text-[#4B5563] rounded-[8px]"
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
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-[8px] transition-colors"
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
      {currentTab === "sims" && renderSims()}
      {currentTab === "auctions" && renderDashboard()} {/* Shared operational overview */}
      {currentTab === "ekyc" && renderEkycWorkspace()}
      {currentTab === "transactions" && renderTransactions()}

      {/* =========================================================================
          MODAL: THÊM / SỬA SIM
      ========================================================================= */}
      {simModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white border border-[#E5E7EB] rounded-[12px] w-full max-w-lg shadow-xl overflow-hidden animate-fade-up">
            <div className="px-5 py-4 border-b border-[#E5E7EB] flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#001743]">
                {editingSim ? "Chỉnh sửa thông tin SIM" : "Thêm SIM mới vào kho"}
              </h3>
              <button onClick={() => setSimModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1">
                <X size={16} />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const phone = formData.get("phone") as string;
                const carrier = formData.get("carrier") as string;
                const category = formData.get("category") as string;
                const price = Number(formData.get("price"));
                const type = formData.get("type") as string;
                const status = formData.get("status") as any;

                if (editingSim) {
                  setSims(
                    sims.map((item) =>
                      item.id === editingSim.id ? { ...item, phone, carrier, category, price, type, status } : item
                    )
                  );
                  showToast(`Đã cập nhật SIM ${phone} thành công!`);
                } else {
                  const newSim: SimItem = {
                    id: `SIM-${String(sims.length + 1).padStart(2, "0")}`,
                    phone,
                    carrier,
                    category,
                    price,
                    aiValuation: Math.round(price * 1.05),
                    aiMultiplier: 2.0,
                    type,
                    status,
                    created: new Date().toLocaleDateString("vi-VN"),
                    patternDesc: `Thế số phong thủy ${category}`,
                  };
                  setSims([newSim, ...sims]);
                  showToast(`Đã thêm mới SIM ${phone} vào hệ thống!`);
                }
                setSimModalOpen(false);
              }}
              className="p-5 space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-[#001743] mb-1">Số thuê bao (SIM)</label>
                <input
                  required
                  name="phone"
                  defaultValue={editingSim?.phone || ""}
                  placeholder="0988888888"
                  className="w-full text-xs p-2.5 border border-[#D1D5DB] rounded-[8px] focus:border-[#001743] focus:outline-none font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#001743] mb-1">Nhà mạng</label>
                  <select
                    name="carrier"
                    defaultValue={editingSim?.carrier || "Viettel"}
                    className="w-full text-xs p-2.5 border border-[#D1D5DB] rounded-[8px] focus:border-[#001743] focus:outline-none"
                  >
                    <option value="Viettel">Viettel</option>
                    <option value="Vinaphone">Vinaphone</option>
                    <option value="Mobifone">Mobifone</option>
                    <option value="Vietnamobile">Vietnamobile</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#001743] mb-1">Danh mục phong thủy</label>
                  <select
                    name="category"
                    defaultValue={editingSim?.category || "Tứ quý"}
                    className="w-full text-xs p-2.5 border border-[#D1D5DB] rounded-[8px] focus:border-[#001743] focus:outline-none"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#001743] mb-1">Giá niêm yết (VNĐ)</label>
                  <input
                    required
                    type="number"
                    name="price"
                    defaultValue={editingSim?.price || 15000000}
                    className="w-full text-xs p-2.5 border border-[#D1D5DB] rounded-[8px] focus:border-[#001743] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#001743] mb-1">Gói cước</label>
                  <select
                    name="type"
                    defaultValue={editingSim?.type || "Trả trước"}
                    className="w-full text-xs p-2.5 border border-[#D1D5DB] rounded-[8px] focus:border-[#001743] focus:outline-none"
                  >
                    <option value="Trả trước">Trả trước</option>
                    <option value="Trả sau">Trả sau</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#001743] mb-1">Trạng thái kho</label>
                <select
                  name="status"
                  defaultValue={editingSim?.status || "Available"}
                  className="w-full text-xs p-2.5 border border-[#D1D5DB] rounded-[8px] focus:border-[#001743] focus:outline-none"
                >
                  <option value="Available">Sẵn sàng bán (Available)</option>
                  <option value="InAuction">Đang đấu giá (InAuction)</option>
                  <option value="Sold">Đã bán (Sold)</option>
                  <option value="Locked">Đang khóa (Locked)</option>
                </select>
              </div>

              <div className="pt-3 border-t border-[#E5E7EB] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSimModalOpen(false)}
                  className="px-3.5 py-2 border border-[#D1D5DB] text-xs font-semibold text-[#4B5563] rounded-[8px]"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#001743] hover:bg-[#00266B] text-white text-xs font-bold rounded-[8px] transition-colors"
                >
                  {editingSim ? "Lưu thay đổi" : "Thêm vào kho"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: TỪ CHỐI eKYC VỚI LÝ DO BẮT BUỘC
      ========================================================================= */}
      {rejectReasonModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white border border-[#E5E7EB] rounded-[12px] w-full max-w-md shadow-xl p-5 animate-fade-up">
            <h3 className="text-sm font-bold text-[#001743] mb-1">Từ chối hồ sơ eKYC: {rejectReasonModal.userName}</h3>
            <p className="text-xs text-[#6B7280] mb-3">
              Vui lòng nhập lý do cụ thể để gửi thông báo hướng dẫn công dân nộp lại tài liệu hợp lệ.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const reason = formData.get("reason") as string;
                if (reason) {
                  setEkycQueue(ekycQueue.filter((x) => x.id !== rejectReasonModal.kycId));
                  showToast(`Đã từ chối hồ sơ ${rejectReasonModal.userName}. Lý do: ${reason}`);
                  setRejectReasonModal({ open: false, kycId: "", userName: "" });
                }
              }}
              className="space-y-3"
            >
              <textarea
                required
                name="reason"
                rows={3}
                placeholder="Ví dụ: Ảnh mặt sau CCCD bị lóa chip NFC, hoặc ảnh selfie không trùng khớp góc mặt..."
                className="w-full text-xs p-2.5 border border-[#D1D5DB] rounded-[8px] focus:border-rose-500 focus:outline-none"
              ></textarea>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRejectReasonModal({ open: false, kycId: "", userName: "" })}
                  className="px-3 py-1.5 border border-[#D1D5DB] text-xs font-semibold text-[#4B5563] rounded-[8px]"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-[8px] transition-colors"
                >
                  Xác nhận từ chối
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: TẠO PHIÊN ĐẤU GIÁ
      ========================================================================= */}
      {auctionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white border border-[#E5E7EB] rounded-[12px] w-full max-w-lg shadow-xl overflow-hidden animate-fade-up">
            <div className="px-5 py-4 border-b border-[#E5E7EB] flex items-center justify-between">
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
                  className="w-full text-xs p-2.5 border border-[#D1D5DB] rounded-[8px] focus:border-[#001743] focus:outline-none font-mono font-bold"
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
                  className="w-full text-xs p-2.5 border border-[#D1D5DB] rounded-[8px] focus:border-[#001743] focus:outline-none"
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
                    className="w-full text-xs p-2.5 border border-[#D1D5DB] rounded-[8px] focus:border-[#001743] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#001743] mb-1">Bước giá tối thiểu</label>
                  <input
                    required
                    type="number"
                    name="step"
                    defaultValue={500000}
                    className="w-full text-xs p-2.5 border border-[#D1D5DB] rounded-[8px] focus:border-[#001743] focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-[#E5E7EB] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAuctionModalOpen(false)}
                  className="px-3.5 py-2 border border-[#D1D5DB] text-xs font-semibold text-[#4B5563] rounded-[8px]"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#001743] hover:bg-[#00266B] text-white text-xs font-bold rounded-[8px] transition-colors"
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
          <div className="bg-white border border-[#E5E7EB] rounded-[12px] w-full max-w-sm shadow-xl p-5 animate-fade-up">
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
                className="px-3 py-1.5 border border-[#D1D5DB] text-xs font-semibold text-[#4B5563] rounded-[8px]"
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
                className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-[8px] transition-colors"
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
