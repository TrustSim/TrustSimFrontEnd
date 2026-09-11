"use client";
import React, { useState, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
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
  Filter,
  Eye,
  Lock,
  Unlock,
  Download,
  Check,
  X,
  Clock,
  ArrowUpRight,
  TrendingUp,
  RefreshCw,
  FolderTree,
  Radio,
  FileText,
  AlertOctagon,
  Settings as SettingsIcon,
  ShieldAlert,
  ChevronRight,
  UserCheck,
  UserX,
  Sliders,
  DollarSign,
  Info,
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

// --- INITIAL MOCK DATA ---
const INITIAL_SIMS = [
  { id: "SIM-01", phone: "0988888888", carrier: "Viettel", category: "Bát quý", price: 1850000000, status: "InAuction", type: "Trả trước", created: "10/09/2026" },
  { id: "SIM-02", phone: "0901234567", carrier: "Mobifone", category: "Sảnh tiến", price: 15800000, status: "InAuction", type: "Trả trước", created: "09/09/2026" },
  { id: "SIM-03", phone: "0777777777", carrier: "Mobifone", category: "Thất quý", price: 420000000, status: "InAuction", type: "Trả trước", created: "08/09/2026" },
  { id: "SIM-04", phone: "0888555000", carrier: "Vinaphone", category: "Tam hoa kép", price: 8500000, status: "Available", type: "Trả sau", created: "07/09/2026" },
  { id: "SIM-05", phone: "0909090909", carrier: "Viettel", category: "Ngũ quý kép", price: 850000000, status: "Available", type: "Trả trước", created: "06/09/2026" },
  { id: "SIM-06", phone: "0911119999", carrier: "Vinaphone", category: "Tứ quý kép", price: 120000000, status: "Available", type: "Trả trước", created: "05/09/2026" },
  { id: "SIM-07", phone: "0352468024", carrier: "Viettel", category: "Lộc phát", price: 8500000, status: "Sold", type: "Trả trước", created: "01/09/2026" },
  { id: "SIM-08", phone: "0987654321", carrier: "Viettel", category: "Sảnh tiến rồng", price: 65000000, status: "Locked", type: "Trả trước", created: "28/08/2026" },
];

const INITIAL_AUCTIONS = [
  { id: "AUC-101", sim: "0901234567", type: "english", currentPrice: 15800000, startPrice: 10000000, step: 500000, bids: 28, seller: "TrustSim Official", timeLeft: "02h 15m", status: "live" },
  { id: "AUC-102", sim: "0777777777", type: "sealed", currentPrice: 420000000, startPrice: 300000000, step: 10000000, bids: 8, seller: "NguyenVanA", timeLeft: "04h 00m", status: "live" },
  { id: "AUC-103", sim: "0888555000", type: "dutch", currentPrice: 8500000, startPrice: 12000000, step: 200000, bids: 0, seller: "SimSoVip_HN", timeLeft: "45m", status: "live" },
  { id: "AUC-104", sim: "0988888888", type: "english", currentPrice: 1850000000, startPrice: 1500000000, step: 20000000, bids: 42, seller: "DaiGiaSim", timeLeft: "01h 30m", status: "live" },
  { id: "AUC-105", sim: "0911119999", type: "sealed", currentPrice: 120000000, startPrice: 120000000, step: 2000000, bids: 0, seller: "TranQuangB", timeLeft: "Bắt đầu sau 18h", status: "upcoming" },
  { id: "AUC-106", sim: "0352468024", type: "english", currentPrice: 8500000, startPrice: 5000000, step: 200000, bids: 19, seller: "TrungPT", timeLeft: "Đã kết thúc", status: "ended" },
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
    submittedAt: "Hôm nay, 14:20",
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
    submittedAt: "Hôm nay, 11:05",
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
    submittedAt: "Hôm qua, 17:40",
    status: "pending",
  },
];

const INITIAL_TRANSACTIONS = [
  { id: "TX-901", orderCode: "ORD-8821", sim: "0901234567", buyer: "Hoàng Minh Tuấn", seller: "TrustSim Official", amount: 15800000, fee: 474000, status: "EscrowHeld", time: "11/09/2026 10:30", disputeDeadline: "13/09/2026 10:30" },
  { id: "TX-902", orderCode: "ORD-8819", sim: "0352468024", buyer: "Trần Văn Bình", seller: "TrungPT", amount: 8500000, fee: 255000, status: "Released", time: "10/09/2026 16:45", disputeDeadline: "Đã hoàn tất" },
  { id: "TX-903", orderCode: "ORD-8815", sim: "0987654321", buyer: "Nguyễn Bảo Long", seller: "LuckyNum", amount: 35000000, fee: 1050000, status: "Disputed", time: "09/09/2026 14:15", disputeDeadline: "Đang giải quyết khiếu nại" },
  { id: "TX-904", orderCode: "ORD-8810", sim: "0909090909", buyer: "Đặng Thị Mai", seller: "SimVIP", amount: 850000000, fee: 25500000, status: "Refunded", time: "08/09/2026 09:10", disputeDeadline: "Đã hoàn trả" },
];

const INITIAL_DISPUTES = [
  { id: "DSP-01", orderCode: "ORD-8815", sim: "0987654321", complainant: "Nguyễn Bảo Long (Người mua)", respondent: "LuckyNum (Người bán)", reason: "Không hoàn tất sang tên chính chủ tại điểm giao dịch", amount: 35000000, status: "UnderReview", date: "10/09/2026" },
  { id: "DSP-02", orderCode: "ORD-8799", sim: "0911223344", complainant: "Phan Văn Nam (Người bán)", respondent: "Lê Minh Tuấn (Người mua)", reason: "Người mua chậm xác nhận mã OTP chuyển nhượng quá hạn 48h", amount: 18000000, status: "UnderReview", date: "09/09/2026" },
];

const INITIAL_ANOMALIES = [
  { id: "AI-101", level: "high", title: "Nghi vấn Bơm giá (Shill Bidding)", desc: "Tài khoản Nguyen*** đặt giá 23 lần liên tiếp trong 5 phút ở phiên #AUC-102", sim: "0777777777", time: "10 phút trước", status: "open" },
  { id: "AI-102", level: "medium", title: "Trùng IP & Dấu vân tay trình duyệt", desc: "Hai tài khoản khác nhau đấu giá cùng một thời điểm từ địa chỉ IP 14.161.22.84", sim: "0901234567", time: "45 phút trước", status: "open" },
  { id: "AI-103", level: "low", title: "Giá niêm yết lệch sâu so với AI định giá", desc: "SIM 0909090909 được tạo giá sàn thấp hơn 55% so với phân tích lịch sử thị trường", sim: "0909090909", time: "2 giờ trước", status: "resolved" },
];

export default function AdminPage() {
  const searchParams = useSearchParams();
  const currentTab = searchParams?.get("tab") || "dashboard";

  // Data State
  const [sims, setSims] = useState(INITIAL_SIMS);
  const [auctions, setAuctions] = useState(INITIAL_AUCTIONS);
  const [categories, setCategories] = useState(INITIAL_CATEGORIES);
  const [carriers, setCarriers] = useState(INITIAL_CARRIERS);
  const [users, setUsers] = useState(INITIAL_USERS);
  const [ekycQueue, setEkycQueue] = useState(INITIAL_EKYC_QUEUE);
  const [transactions, setTransactions] = useState(INITIAL_TRANSACTIONS);
  const [disputes, setDisputes] = useState(INITIAL_DISPUTES);
  const [anomalies, setAnomalies] = useState(INITIAL_ANOMALIES);

  // System Settings State
  const [settings, setSettings] = useState({
    commissionRate: 3.0,
    escrowHoldingHours: 48,
    minDepositRate: 10,
    autoExtendMinutes: 3,
    maxExtensions: 5,
    maintenanceMode: false,
  });

  // UI / Modal States
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // --- MODAL CONTROLS ---
  const [simModalOpen, setSimModalOpen] = useState(false);
  const [editingSim, setEditingSim] = useState<any>(null);
  const [auctionModalOpen, setAuctionModalOpen] = useState(false);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [carrierModalOpen, setCarrierModalOpen] = useState(false);
  const [ekycInspectItem, setEkycInspectItem] = useState<any>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: string; id: string; name: string } | null>(null);

  // Search & Filter States
  const [searchSim, setSearchSim] = useState("");
  const [carrierFilter, setCarrierFilter] = useState("all");
  const [simStatusFilter, setSimStatusFilter] = useState("all");

  const [searchAuction, setSearchAuction] = useState("");
  const [auctionTypeFilter, setAuctionTypeFilter] = useState("all");
  const [auctionStatusFilter, setAuctionStatusFilter] = useState("all");

  const [searchUser, setSearchUser] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("all");

  // ==========================================
  // TAB: 1. DASHBOARD OVERVIEW
  // ==========================================
  const renderDashboard = () => {
    const kpiData = [
      { label: "Tổng SIM trong kho", value: "11.820", sub: "+148 SIM tuần này", icon: Smartphone, trend: "up" },
      { label: "Phiên đang Live", value: auctions.filter(a => a.status === "live").length.toString(), sub: "4 phiên sắp kết thúc", icon: Gavel, trend: "up", highlight: true },
      { label: "Ký quỹ Escrow đang giữ", value: formatVND(456800000), sub: "Bảo đảm 100% người mua", icon: CreditCard, trend: "up" },
      { label: "Hồ sơ eKYC chờ duyệt", value: ekycQueue.filter(k => k.status === "pending").length.toString(), sub: "Cần xử lý trong 24h", icon: ShieldCheck, trend: "warning", alert: true },
      { label: "Thành viên đã xác minh", value: users.filter(u => u.kycStatus === "verified").length.toString(), sub: "98.2% tỷ lệ hoàn tất", icon: Users, trend: "up" },
      { label: "Cảnh báo AI cần rà soát", value: anomalies.filter(a => a.status === "open").length.toString(), sub: "1 cảnh báo mức độ cao", icon: Bot, trend: "danger", alert: true },
    ];

    return (
      <div className="space-y-6">
        {/* Top welcome banner */}
        <div className="bg-white border border-[#E5E7EB] rounded-md p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-[#001743] tracking-tight">Trung tâm Quản trị Sàn TrustSim</h1>
            <p className="text-xs text-[#6B7280] mt-1">
              Hệ thống giám sát giao dịch, quản lý kho SIM số đẹp, đấu giá minh bạch và bảo hộ ký quỹ Escrow.
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => {
                setEditingSim(null);
                setSimModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-[#E4011E] hover:bg-[#B80018] text-white text-xs font-semibold rounded-md transition-colors shadow-sm"
            >
              <Plus size={15} strokeWidth={1.5} />
              <span>Thêm SIM mới</span>
            </button>
            <button
              onClick={() => setAuctionModalOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-[#001743] hover:bg-[#002266] text-white text-xs font-semibold rounded-md transition-colors"
            >
              <Gavel size={15} strokeWidth={1.5} />
              <span>Mở phiên đấu giá</span>
            </button>
          </div>
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {kpiData.map((kpi, idx) => {
            const Icon = kpi.icon;
            return (
              <div
                key={idx}
                className="bg-white border border-[#E5E7EB] rounded-md p-5 hover:border-gray-300 transition-all duration-150"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-[#6B7280]">{kpi.label}</span>
                  <div
                    className={`w-8 h-8 rounded-md flex items-center justify-center ${
                      kpi.highlight
                        ? "bg-red-50 text-[#E4011E] border border-red-100"
                        : kpi.alert
                        ? "bg-amber-50 text-amber-600 border border-amber-100"
                        : "bg-gray-100 text-[#001743]"
                    }`}
                  >
                    <Icon size={16} strokeWidth={1.5} />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-extrabold text-[#001743] tabular-nums tracking-tight">
                    {kpi.value}
                  </div>
                  <div className="text-[11px] text-[#6B7280] mt-1 flex items-center gap-1">
                    <TrendingUp size={12} className="text-emerald-600" />
                    <span>{kpi.sub}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Split Grid: Live Auctions & AI Alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Live Auctions Table (2 cols) */}
          <div className="lg:col-span-2 bg-white border border-[#E5E7EB] rounded-md overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-[#E5E7EB] flex items-center justify-between bg-white">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#E4011E] animate-pulse"></span>
                <h2 className="text-sm font-bold text-[#001743] uppercase tracking-wider">
                  Phiên đấu giá đang diễn ra (Live)
                </h2>
              </div>
              <a
                href="/admin?tab=auctions"
                className="text-xs font-semibold text-[#E4011E] hover:underline inline-flex items-center gap-1"
              >
                <span>Xem tất cả</span>
                <ChevronRight size={14} />
              </a>
            </div>

            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#E5E7EB] bg-[#F8F9FA] text-[#6B7280] font-semibold uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-4">Số SIM</th>
                    <th className="py-3 px-4">Hình thức</th>
                    <th className="py-3 px-4">Giá hiện tại</th>
                    <th className="py-3 px-4">Lượt đặt</th>
                    <th className="py-3 px-4">Thời gian</th>
                    <th className="py-3 px-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]">
                  {auctions
                    .filter((a) => a.status === "live")
                    .slice(0, 4)
                    .map((a) => (
                      <tr key={a.id} className="hover:bg-gray-50/70 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-bold text-sm text-[#001743] tabular-nums tracking-wider">
                            {formatPhone(a.sim)}
                          </div>
                          <div className="text-[10px] text-[#6B7280]">Bởi: {a.seller}</div>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                              a.type === "english"
                                ? "bg-blue-50 text-blue-700 border border-blue-200"
                                : a.type === "dutch"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-purple-50 text-purple-700 border border-purple-200"
                            }`}
                          >
                            {a.type === "english" ? "Kiểu Anh" : a.type === "dutch" ? "Hà Lan" : "Bí mật"}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-bold text-[#E4011E] tabular-nums text-xs">
                          {formatVND(a.currentPrice)}
                        </td>
                        <td className="py-3 px-4 tabular-nums text-[#001743] font-medium">{a.bids} lượt</td>
                        <td className="py-3 px-4 text-[#6B7280] flex items-center gap-1">
                          <Clock size={12} className="text-amber-600" />
                          <span className="font-medium text-[#001743]">{a.timeLeft}</span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => {
                              showToast(`Đã gia hạn phiên đấu giá ${a.sim} thêm 15 phút.`);
                            }}
                            className="text-[11px] font-semibold text-[#001743] hover:text-[#E4011E] border border-[#D1D5DB] hover:border-[#E4011E] rounded px-2 py-1 transition-colors"
                          >
                            Gia hạn
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* AI Anomaly Warnings Widget (1 col) */}
          <div className="bg-white border border-[#E5E7EB] rounded-md flex flex-col">
            <div className="px-5 py-4 border-b border-[#E5E7EB] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot size={16} className="text-[#E4011E]" />
                <h2 className="text-sm font-bold text-[#001743] uppercase tracking-wider">
                  Cảnh báo AI Gian lận
                </h2>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-100 text-[#E4011E]">
                {anomalies.filter((x) => x.status === "open").length} mới
              </span>
            </div>

            <div className="divide-y divide-[#E5E7EB] flex-1">
              {anomalies.map((anom) => (
                <div key={anom.id} className="p-4 hover:bg-gray-50/50 transition-colors">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${
                        anom.level === "high"
                          ? "bg-red-50 text-red-700 border border-red-200"
                          : anom.level === "medium"
                          ? "bg-amber-50 text-amber-700 border border-amber-200"
                          : "bg-gray-100 text-gray-700 border border-gray-200"
                      }`}
                    >
                      {anom.level === "high" ? "Nghiêm trọng" : anom.level === "medium" ? "Trung bình" : "Thấp"}
                    </span>
                    <span className="text-[10px] text-[#9CA3AF]">{anom.time}</span>
                  </div>
                  <div className="text-xs font-bold text-[#001743] mb-1">{anom.title}</div>
                  <p className="text-[11px] text-[#6B7280] leading-relaxed mb-3">{anom.desc}</p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => showToast(`Đã phong tỏa tạm thời phiên ${anom.sim} để điều tra.`)}
                      className="px-2 py-1 bg-red-50 text-[#E4011E] border border-red-200 hover:bg-red-100 rounded text-[10px] font-semibold transition-colors"
                    >
                      Phong tỏa
                    </button>
                    <button
                      onClick={() => {
                        setAnomalies(anomalies.map((a) => (a.id === anom.id ? { ...a, status: "resolved" } : a)));
                        showToast(`Đã đánh dấu cảnh báo ${anom.id} là bình thường.`);
                      }}
                      className="px-2 py-1 bg-white text-[#6B7280] border border-[#D1D5DB] hover:text-[#001743] rounded text-[10px] font-medium transition-colors"
                    >
                      Bỏ qua
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* eKYC Review Queue */}
        <div className="bg-white border border-[#E5E7EB] rounded-md p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ShieldCheck size={18} className="text-emerald-600" />
              <h2 className="text-sm font-bold text-[#001743] uppercase tracking-wider">
                Hồ sơ định danh eKYC chờ kiểm duyệt
              </h2>
            </div>
            <a href="/admin?tab=ekyc" className="text-xs font-semibold text-[#001743] hover:text-[#E4011E]">
              Xem toàn bộ danh sách →
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {ekycQueue.map((item) => (
              <div
                key={item.id}
                className="border border-[#E5E7EB] rounded-md p-4 bg-[#F8F9FA] flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-[#001743]">{item.id}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-semibold">
                      Chờ duyệt
                    </span>
                  </div>
                  <div className="font-bold text-sm text-[#001743]">{item.userName}</div>
                  <div className="text-xs text-[#6B7280] mt-0.5">CCCD: {item.idCardNumber}</div>
                  <div className="mt-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded inline-block font-semibold">
                    Face Match: {item.faceMatchScore}%
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[#E5E7EB] flex items-center justify-between">
                  <button
                    onClick={() => setEkycInspectItem(item)}
                    className="text-xs font-semibold text-[#001743] hover:text-[#E4011E] inline-flex items-center gap-1"
                  >
                    <Eye size={14} />
                    <span>Xem ảnh CCCD</span>
                  </button>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => {
                        setEkycQueue(ekycQueue.filter((x) => x.id !== item.id));
                        showToast(`Đã phê duyệt hồ sơ eKYC của ${item.userName}.`);
                      }}
                      className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs transition-colors"
                      title="Duyệt hồ sơ"
                    >
                      <Check size={14} />
                    </button>
                    <button
                      onClick={() => {
                        setEkycQueue(ekycQueue.filter((x) => x.id !== item.id));
                        showToast(`Đã từ chối hồ sơ eKYC của ${item.userName}.`);
                      }}
                      className="p-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs transition-colors"
                      title="Từ chối"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // ==========================================
  // TAB: 2. QUẢN LÝ SIM (CRUD)
  // ==========================================
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
      {/* Header & Actions */}
      <div className="bg-white border border-[#E5E7EB] rounded-md p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-[#001743]">Kho SIM Số Đẹp</h1>
          <p className="text-xs text-[#6B7280] mt-0.5">
            Quản lý cơ sở dữ liệu SIM, niêm yết giá, danh mục phong thủy và tình trạng lưu kho.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              setEditingSim(null);
              setSimModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#E4011E] hover:bg-[#B80018] text-white text-xs font-semibold rounded-md transition-colors shadow-sm"
          >
            <Plus size={15} strokeWidth={1.5} />
            <span>Thêm SIM vào kho</span>
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white border border-[#E5E7EB] rounded-md p-3.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
          <div className="relative w-64">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm theo số SIM, danh mục..."
              value={searchSim}
              onChange={(e) => setSearchSim(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-[#D1D5DB] rounded-md focus:border-[#E4011E] focus:outline-none"
            />
          </div>

          <select
            value={carrierFilter}
            onChange={(e) => setCarrierFilter(e.target.value)}
            className="text-xs py-1.5 px-2.5 bg-white border border-[#D1D5DB] rounded-md focus:border-[#E4011E] focus:outline-none"
          >
            <option value="all">Nhà mạng: Tất cả</option>
            <option value="Viettel">Viettel</option>
            <option value="Vinaphone">Vinaphone</option>
            <option value="Mobifone">Mobifone</option>
            <option value="Vietnamobile">Vietnamobile</option>
          </select>

          <select
            value={simStatusFilter}
            onChange={(e) => setSimStatusFilter(e.target.value)}
            className="text-xs py-1.5 px-2.5 bg-white border border-[#D1D5DB] rounded-md focus:border-[#E4011E] focus:outline-none"
          >
            <option value="all">Trạng thái: Tất cả</option>
            <option value="Available">Sẵn sàng bán</option>
            <option value="InAuction">Đang đấu giá</option>
            <option value="Sold">Đã bán</option>
            <option value="Locked">Đang khóa</option>
          </select>
        </div>

        <div className="text-xs text-[#6B7280] font-medium">
          Tìm thấy <span className="font-bold text-[#001743]">{filteredSims.length}</span> SIM
        </div>
      </div>

      {/* SIM Table */}
      <div className="bg-white border border-[#E5E7EB] rounded-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#E5E7EB] bg-[#F8F9FA] text-[#6B7280] font-semibold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">Mã / Số SIM</th>
                <th className="py-3 px-4">Nhà mạng</th>
                <th className="py-3 px-4">Phân loại</th>
                <th className="py-3 px-4">Gói cước</th>
                <th className="py-3 px-4">Giá niêm yết</th>
                <th className="py-3 px-4">Trạng thái</th>
                <th className="py-3 px-4">Ngày nhập</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {filteredSims.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50/60 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-bold text-sm text-[#001743] tabular-nums tracking-wider">
                      {formatPhone(s.phone)}
                    </div>
                    <div className="text-[10px] text-[#9CA3AF]">{s.id}</div>
                  </td>
                  <td className="py-3 px-4 font-medium text-[#001743]">{s.carrier}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-[#001743] border border-gray-200">
                      {s.category}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-[#6B7280]">{s.type}</td>
                  <td className="py-3 px-4 font-bold text-[#001743] tabular-nums text-xs">
                    {formatVND(s.price)}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${
                        s.status === "Available"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : s.status === "InAuction"
                          ? "bg-red-50 text-[#E4011E] border border-red-200"
                          : s.status === "Sold"
                          ? "bg-gray-100 text-gray-600 border border-gray-200"
                          : "bg-amber-50 text-amber-700 border border-amber-200"
                      }`}
                    >
                      {s.status === "Available"
                        ? "Sẵn sàng"
                        : s.status === "InAuction"
                        ? "Đang đấu giá"
                        : s.status === "Sold"
                        ? "Đã bán"
                        : "Đang khóa"}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-[#9CA3AF] text-[11px]">{s.created}</td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => {
                          setEditingSim(s);
                          setSimModalOpen(true);
                        }}
                        className="p-1.5 text-[#4B5563] hover:text-[#001743] hover:bg-gray-100 rounded transition-colors"
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
                        className="p-1.5 text-[#4B5563] hover:text-amber-600 hover:bg-amber-50 rounded transition-colors"
                        title={s.status === "Locked" ? "Mở khóa" : "Khóa SIM"}
                      >
                        {s.status === "Locked" ? <Unlock size={15} strokeWidth={1.5} /> : <Lock size={15} strokeWidth={1.5} />}
                      </button>
                      <button
                        onClick={() => setDeleteConfirm({ type: "sim", id: s.id, name: s.phone })}
                        className="p-1.5 text-[#4B5563] hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Xóa SIM"
                      >
                        <Trash2 size={15} strokeWidth={1.5} />
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

  // ==========================================
  // TAB: 3. QUẢN LÝ PHIÊN ĐẤU GIÁ (CRUD)
  // ==========================================
  const filteredAuctions = useMemo(() => {
    return auctions.filter((a) => {
      const matchSearch = a.sim.includes(searchAuction.replace(/\s/g, "")) || a.seller.toLowerCase().includes(searchAuction.toLowerCase());
      const matchType = auctionTypeFilter === "all" || a.type === auctionTypeFilter;
      const matchStatus = auctionStatusFilter === "all" || a.status === auctionStatusFilter;
      return matchSearch && matchType && matchStatus;
    });
  }, [auctions, searchAuction, auctionTypeFilter, auctionStatusFilter]);

  const renderAuctions = () => (
    <div className="space-y-4">
      <div className="bg-white border border-[#E5E7EB] rounded-md p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-[#001743]">Quản lý Phiên Đấu Giá</h1>
          <p className="text-xs text-[#6B7280] mt-0.5">
            Điều hành các phiên đấu giá kiểu Anh, Hà Lan và Đấu giá kín. Can thiệp khẩn cấp khi phát hiện dấu hiệu vi phạm.
          </p>
        </div>
        <button
          onClick={() => setAuctionModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#E4011E] hover:bg-[#B80018] text-white text-xs font-semibold rounded-md transition-colors shadow-sm"
        >
          <Plus size={15} strokeWidth={1.5} />
          <span>Tạo phiên đấu giá mới</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-[#E5E7EB] rounded-md p-3.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
          <div className="relative w-64">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm theo SIM hoặc Người bán..."
              value={searchAuction}
              onChange={(e) => setSearchAuction(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-[#D1D5DB] rounded-md focus:border-[#E4011E] focus:outline-none"
            />
          </div>

          <select
            value={auctionTypeFilter}
            onChange={(e) => setAuctionTypeFilter(e.target.value)}
            className="text-xs py-1.5 px-2.5 bg-white border border-[#D1D5DB] rounded-md focus:border-[#E4011E] focus:outline-none"
          >
            <option value="all">Hình thức: Tất cả</option>
            <option value="english">Kiểu Anh (English)</option>
            <option value="dutch">Kiểu Hà Lan (Dutch)</option>
            <option value="sealed">Bí mật (Sealed)</option>
          </select>

          <select
            value={auctionStatusFilter}
            onChange={(e) => setAuctionStatusFilter(e.target.value)}
            className="text-xs py-1.5 px-2.5 bg-white border border-[#D1D5DB] rounded-md focus:border-[#E4011E] focus:outline-none"
          >
            <option value="all">Trạng thái: Tất cả</option>
            <option value="live">Đang diễn ra (Live)</option>
            <option value="upcoming">Sắp diễn ra</option>
            <option value="ended">Đã kết thúc</option>
          </select>
        </div>
      </div>

      {/* Auctions Table */}
      <div className="bg-white border border-[#E5E7EB] rounded-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#E5E7EB] bg-[#F8F9FA] text-[#6B7280] font-semibold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">Mã phiên / SIM</th>
                <th className="py-3 px-4">Hình thức</th>
                <th className="py-3 px-4">Giá hiện tại</th>
                <th className="py-3 px-4">Giá khởi điểm</th>
                <th className="py-3 px-4">Bước giá</th>
                <th className="py-3 px-4">Lượt đặt</th>
                <th className="py-3 px-4">Người bán</th>
                <th className="py-3 px-4">Thời gian</th>
                <th className="py-3 px-4">Trạng thái</th>
                <th className="py-3 px-4 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {filteredAuctions.map((a) => (
                <tr key={a.id} className="hover:bg-gray-50/60 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-bold text-sm text-[#001743] tabular-nums tracking-wider">
                      {formatPhone(a.sim)}
                    </div>
                    <div className="text-[10px] text-[#9CA3AF]">{a.id}</div>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                        a.type === "english"
                          ? "bg-blue-50 text-blue-700 border border-blue-200"
                          : a.type === "dutch"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-purple-50 text-purple-700 border border-purple-200"
                      }`}
                    >
                      {a.type === "english" ? "Anh" : a.type === "dutch" ? "Hà Lan" : "Bí mật"}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-bold text-[#E4011E] tabular-nums text-xs">
                    {formatVND(a.currentPrice)}
                  </td>
                  <td className="py-3 px-4 text-[#6B7280] tabular-nums">{formatVND(a.startPrice)}</td>
                  <td className="py-3 px-4 text-[#6B7280] tabular-nums">+{formatVND(a.step)}</td>
                  <td className="py-3 px-4 font-medium text-[#001743] tabular-nums">{a.bids}</td>
                  <td className="py-3 px-4 text-[#001743]">{a.seller}</td>
                  <td className="py-3 px-4 text-[#6B7280] font-medium">{a.timeLeft}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        a.status === "live"
                          ? "bg-red-50 text-[#E4011E] border border-red-200"
                          : a.status === "upcoming"
                          ? "bg-amber-50 text-amber-700 border border-amber-200"
                          : "bg-gray-100 text-gray-600 border border-gray-200"
                      }`}
                    >
                      {a.status === "live" ? "Đang diễn ra" : a.status === "upcoming" ? "Sắp diễn ra" : "Kết thúc"}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {a.status === "live" && (
                        <button
                          onClick={() => showToast(`Đã kéo dài phiên ${a.id} thêm 15 phút.`)}
                          className="px-2 py-1 text-[11px] font-semibold text-[#001743] border border-[#D1D5DB] hover:border-[#E4011E] rounded transition-colors"
                        >
                          +15m
                        </button>
                      )}
                      <button
                        onClick={() => {
                          const newStatus = a.status === "ended" ? "live" : "ended";
                          setAuctions(auctions.map((item) => (item.id === a.id ? { ...item, status: newStatus } : item)));
                          showToast(`Đã chuyển trạng thái phiên ${a.id} sang ${newStatus}.`);
                        }}
                        className="p-1.5 text-[#4B5563] hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        title={a.status === "live" ? "Dừng phiên" : "Mở lại"}
                      >
                        {a.status === "live" ? <XCircle size={15} strokeWidth={1.5} /> : <CheckCircle2 size={15} strokeWidth={1.5} />}
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

  // ==========================================
  // TAB: 4. DANH MỤC & ĐỊNH GIÁ SIM (CRUD)
  // ==========================================
  const renderCategories = () => (
    <div className="space-y-4">
      <div className="bg-white border border-[#E5E7EB] rounded-md p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-[#001743]">Danh mục SIM & Hệ số AI Định giá</h1>
          <p className="text-xs text-[#6B7280] mt-0.5">
            Cấu hình các bộ nhận diện mẫu số đẹp (Regular Expression) và hệ số nhân định giá tự động cho AI Engine.
          </p>
        </div>
        <button
          onClick={() => setCategoryModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#E4011E] hover:bg-[#B80018] text-white text-xs font-semibold rounded-md transition-colors shadow-sm"
        >
          <Plus size={15} strokeWidth={1.5} />
          <span>Thêm danh mục mới</span>
        </button>
      </div>

      <div className="bg-white border border-[#E5E7EB] rounded-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#E5E7EB] bg-[#F8F9FA] text-[#6B7280] font-semibold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">Tên danh mục</th>
                <th className="py-3 px-4">Mã ký hiệu</th>
                <th className="py-3 px-4">Hệ số AI Multiplier</th>
                <th className="py-3 px-4">Số lượng SIM</th>
                <th className="py-3 px-4">Quy luật nhận diện (Regex)</th>
                <th className="py-3 px-4">Mô tả đặc tính</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {categories.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50/60 transition-colors">
                  <td className="py-3 px-4 font-bold text-[#001743]">{c.name}</td>
                  <td className="py-3 px-4 font-mono text-[11px] text-[#E4011E] bg-red-50/50 px-2 py-0.5 rounded w-fit">
                    {c.code}
                  </td>
                  <td className="py-3 px-4 font-bold text-[#001743] tabular-nums">
                    <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {c.multiplier}x
                    </span>
                  </td>
                  <td className="py-3 px-4 font-medium text-[#001743] tabular-nums">{c.count} SIM</td>
                  <td className="py-3 px-4 font-mono text-[11px] text-[#4B5563]">{c.regex}</td>
                  <td className="py-3 px-4 text-[#6B7280]">{c.desc}</td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => {
                          const newMul = prompt(`Nhập hệ số mới cho ${c.name}:`, c.multiplier.toString());
                          if (newMul && !isNaN(Number(newMul))) {
                            setCategories(categories.map((item) => (item.id === c.id ? { ...item, multiplier: Number(newMul) } : item)));
                            showToast(`Đã cập nhật hệ số của ${c.name} thành ${newMul}x.`);
                          }
                        }}
                        className="p-1.5 text-[#4B5563] hover:text-[#001743] hover:bg-gray-100 rounded transition-colors"
                        title="Sửa hệ số"
                      >
                        <Edit3 size={15} strokeWidth={1.5} />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm({ type: "category", id: c.id, name: c.name })}
                        className="p-1.5 text-[#4B5563] hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Xóa danh mục"
                      >
                        <Trash2 size={15} strokeWidth={1.5} />
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

  // ==========================================
  // TAB: 5. NHÀ MẠNG & ĐẦU SỐ (CRUD)
  // ==========================================
  const renderCarriers = () => (
    <div className="space-y-4">
      <div className="bg-white border border-[#E5E7EB] rounded-md p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-[#001743]">Nhà Mạng & Dải Đầu Số</h1>
          <p className="text-xs text-[#6B7280] mt-0.5">
            Quản lý danh sách nhà mạng viễn thông tại Việt Nam và các đầu số tương ứng để phân luồng tự động.
          </p>
        </div>
        <button
          onClick={() => setCarrierModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#E4011E] hover:bg-[#B80018] text-white text-xs font-semibold rounded-md transition-colors shadow-sm"
        >
          <Plus size={15} strokeWidth={1.5} />
          <span>Thêm nhà mạng / Dải đầu số</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {carriers.map((c) => (
          <div key={c.id} className="bg-white border border-[#E5E7EB] rounded-md p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
                <div>
                  <h3 className="text-base font-bold text-[#001743]">{c.name}</h3>
                  <span className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">Mã: {c.code}</span>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-[#001743] tabular-nums">{c.totalSims}</div>
                  <div className="text-[10px] text-[#9CA3AF]">SIM trên sàn</div>
                </div>
              </div>

              <div className="mt-3">
                <div className="text-[11px] font-semibold text-[#6B7280] mb-2 uppercase tracking-wider">
                  Dải đầu số ({c.prefixes.length}):
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {c.prefixes.map((p) => (
                    <span
                      key={p}
                      className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-[#F8F9FA] text-[#001743] border border-[#E5E7EB]"
                    >
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-[#E5E7EB] flex items-center justify-between">
              <button
                onClick={() => {
                  const newPrefix = prompt(`Nhập đầu số mới muốn thêm vào ${c.name} (ví dụ 087):`);
                  if (newPrefix && newPrefix.length >= 3) {
                    setCarriers(
                      carriers.map((item) =>
                        item.id === c.id ? { ...item, prefixes: [...item.prefixes, newPrefix] } : item
                      )
                    );
                    showToast(`Đã thêm đầu số ${newPrefix} vào nhà mạng ${c.name}.`);
                  }
                }}
                className="text-xs font-semibold text-[#001743] hover:text-[#E4011E] inline-flex items-center gap-1"
              >
                <Plus size={13} />
                <span>Thêm đầu số</span>
              </button>
              <button
                onClick={() => setDeleteConfirm({ type: "carrier", id: c.id, name: c.name })}
                className="text-xs text-[#9CA3AF] hover:text-red-600 transition-colors"
              >
                Xóa
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // ==========================================
  // TAB: 6. QUẢN LÝ NGƯỜI DÙNG & PHÂN QUYỀN
  // ==========================================
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchSearch =
        u.name.toLowerCase().includes(searchUser.toLowerCase()) ||
        u.email.toLowerCase().includes(searchUser.toLowerCase()) ||
        u.phone.includes(searchUser.replace(/\s/g, ""));
      const matchRole = userRoleFilter === "all" || u.role === userRoleFilter;
      return matchSearch && matchRole;
    });
  }, [users, searchUser, userRoleFilter]);

  const renderUsers = () => (
    <div className="space-y-4">
      <div className="bg-white border border-[#E5E7EB] rounded-md p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-[#001743]">Quản lý Tài Khoản & Phân Quyền</h1>
          <p className="text-xs text-[#6B7280] mt-0.5">
            Phân quyền quản trị, tư vấn viên sàn, khóa tài khoản vi phạm hoặc kiểm soát số dư ký quỹ.
          </p>
        </div>
      </div>

      <div className="bg-white border border-[#E5E7EB] rounded-md p-3.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
          <div className="relative w-64">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm theo tên, email, SĐT..."
              value={searchUser}
              onChange={(e) => setSearchUser(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-[#D1D5DB] rounded-md focus:border-[#E4011E] focus:outline-none"
            />
          </div>

          <select
            value={userRoleFilter}
            onChange={(e) => setUserRoleFilter(e.target.value)}
            className="text-xs py-1.5 px-2.5 bg-white border border-[#D1D5DB] rounded-md focus:border-[#E4011E] focus:outline-none"
          >
            <option value="all">Vai trò: Tất cả</option>
            <option value="Admin">Quản trị viên (Admin)</option>
            <option value="Consultant">Tư vấn viên (Consultant)</option>
            <option value="User">Thành viên (User)</option>
          </select>
        </div>
        <div className="text-xs text-[#6B7280] font-medium">
          Tổng cộng: <span className="font-bold text-[#001743]">{filteredUsers.length}</span> người dùng
        </div>
      </div>

      <div className="bg-white border border-[#E5E7EB] rounded-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#E5E7EB] bg-[#F8F9FA] text-[#6B7280] font-semibold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">Họ và tên</th>
                <th className="py-3 px-4">Thông tin liên hệ</th>
                <th className="py-3 px-4">Vai trò</th>
                <th className="py-3 px-4">Trạng thái eKYC</th>
                <th className="py-3 px-4">Số dư ký quỹ</th>
                <th className="py-3 px-4">Tài khoản</th>
                <th className="py-3 px-4">Ngày tham gia</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50/60 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-bold text-[#001743]">{u.name}</div>
                    <div className="text-[10px] text-[#9CA3AF]">{u.id}</div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-[#001743]">{u.email}</div>
                    <div className="text-[11px] text-[#6B7280] tabular-nums">{formatPhone(u.phone)}</div>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        u.role === "Admin"
                          ? "bg-purple-50 text-purple-700 border border-purple-200"
                          : u.role === "Consultant"
                          ? "bg-blue-50 text-blue-700 border border-blue-200"
                          : "bg-gray-100 text-[#001743] border border-gray-200"
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                        u.kycStatus === "verified"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : u.kycStatus === "pending"
                          ? "bg-amber-50 text-amber-700 border border-amber-200"
                          : "bg-rose-50 text-rose-700 border border-rose-200"
                      }`}
                    >
                      {u.kycStatus === "verified"
                        ? "Đã xác thực"
                        : u.kycStatus === "pending"
                        ? "Chờ duyệt"
                        : "Bị từ chối"}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-bold text-[#001743] tabular-nums">
                    {formatVND(u.balance)}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        u.status === "Active"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-rose-50 text-rose-700 border border-rose-200"
                      }`}
                    >
                      {u.status === "Active" ? "Hoạt động" : "Đang khóa"}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-[#9CA3AF] text-[11px]">{u.joined}</td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => {
                          const nextRole = u.role === "User" ? "Consultant" : u.role === "Consultant" ? "Admin" : "User";
                          setUsers(users.map((item) => (item.id === u.id ? { ...item, role: nextRole } : item)));
                          showToast(`Đã chuyển vai trò của ${u.name} sang ${nextRole}.`);
                        }}
                        className="px-2 py-1 text-[11px] font-semibold text-[#001743] border border-[#D1D5DB] hover:border-[#001743] rounded transition-colors"
                        title="Đổi vai trò"
                      >
                        Đổi vai trò
                      </button>
                      <button
                        onClick={() => {
                          const nextStatus = u.status === "Active" ? "Locked" : "Active";
                          setUsers(users.map((item) => (item.id === u.id ? { ...item, status: nextStatus } : item)));
                          showToast(`Đã ${nextStatus === "Active" ? "mở khóa" : "khóa"} tài khoản của ${u.name}.`);
                        }}
                        className="p-1.5 text-[#4B5563] hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                        title={u.status === "Active" ? "Khóa tài khoản" : "Mở khóa"}
                      >
                        {u.status === "Active" ? <Lock size={15} strokeWidth={1.5} /> : <Unlock size={15} strokeWidth={1.5} />}
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

  // ==========================================
  // TAB: 7. PHÊ DUYỆT eKYC
  // ==========================================
  const renderEkyc = () => (
    <div className="space-y-4">
      <div className="bg-white border border-[#E5E7EB] rounded-md p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-[#001743]">Phê Duyệt Hồ Sơ eKYC</h1>
          <p className="text-xs text-[#6B7280] mt-0.5">
            Xác minh thẻ căn cước công dân gắn chip (CCCD) và đối sánh khuôn mặt (Face Matching) trước khi cho phép giao dịch lớn.
          </p>
        </div>
        <div className="text-xs font-semibold px-3 py-1.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
          Còn {ekycQueue.length} hồ sơ đang chờ duyệt
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {ekycQueue.map((item) => (
          <div key={item.id} className="bg-white border border-[#E5E7EB] rounded-md p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
                <div>
                  <div className="text-xs font-bold text-[#001743]">{item.id}</div>
                  <div className="text-[10px] text-[#9CA3AF]">Gửi lúc: {item.submittedAt}</div>
                </div>
                <div className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                  Chờ xác minh
                </div>
              </div>

              <div className="py-3 space-y-2">
                <div>
                  <div className="text-[10px] text-[#6B7280] uppercase">Họ và tên</div>
                  <div className="font-bold text-sm text-[#001743]">{item.userName}</div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <div className="text-[10px] text-[#6B7280] uppercase">Số CCCD</div>
                    <div className="font-mono text-xs font-bold text-[#001743]">{item.idCardNumber}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-[#6B7280] uppercase">Ngày sinh</div>
                    <div className="text-xs text-[#001743]">{item.dob}</div>
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-[#6B7280] uppercase">Địa chỉ thường trú</div>
                  <div className="text-xs text-[#001743] leading-snug">{item.address}</div>
                </div>
                <div className="pt-2">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-semibold text-[#001743]">AI Face Match</span>
                    <span className="font-bold text-emerald-700">{item.faceMatchScore}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-600 rounded-full"
                      style={{ width: `${item.faceMatchScore}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-[#E5E7EB] space-y-2">
              <button
                onClick={() => setEkycInspectItem(item)}
                className="w-full py-2 bg-gray-50 hover:bg-gray-100 text-[#001743] border border-[#D1D5DB] rounded text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Eye size={14} />
                <span>Xem ảnh đối chiếu (Trước / Sau / Chân dung)</span>
              </button>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    setEkycQueue(ekycQueue.filter((x) => x.id !== item.id));
                    showToast(`Đã duyệt thành công hồ sơ ${item.userName}.`);
                  }}
                  className="py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
                >
                  <Check size={14} />
                  <span>Duyệt hồ sơ</span>
                </button>
                <button
                  onClick={() => {
                    const reason = prompt("Nhập lý do từ chối hồ sơ eKYC:");
                    if (reason) {
                      setEkycQueue(ekycQueue.filter((x) => x.id !== item.id));
                      showToast(`Đã từ chối hồ sơ ${item.userName} (Lý do: ${reason}).`);
                    }
                  }}
                  className="py-2 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
                >
                  <X size={14} />
                  <span>Từ chối</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // ==========================================
  // TAB: 8. GIAO DỊCH ESCROW
  // ==========================================
  const renderTransactions = () => (
    <div className="space-y-4">
      <div className="bg-white border border-[#E5E7EB] rounded-md p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-[#001743]">Giao Dịch Ký Quỹ (Escrow)</h1>
          <p className="text-xs text-[#6B7280] mt-0.5">
            Sàn nắm giữ tiền thanh toán của người mua an toàn. Tiền chỉ được giải ngân cho người bán sau khi hoàn tất sang tên hợp lệ.
          </p>
        </div>
      </div>

      <div className="bg-white border border-[#E5E7EB] rounded-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#E5E7EB] bg-[#F8F9FA] text-[#6B7280] font-semibold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">Mã đơn / SIM</th>
                <th className="py-3 px-4">Người mua</th>
                <th className="py-3 px-4">Người bán</th>
                <th className="py-3 px-4">Giá trị giao dịch</th>
                <th className="py-3 px-4">Phí sàn (3%)</th>
                <th className="py-3 px-4">Trạng thái Escrow</th>
                <th className="py-3 px-4">Thời gian</th>
                <th className="py-3 px-4 text-right">Lệnh trọng tài</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-gray-50/60 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-bold text-sm text-[#001743] tabular-nums tracking-wider">
                      {formatPhone(tx.sim)}
                    </div>
                    <div className="text-[10px] text-[#9CA3AF] font-mono">{tx.orderCode}</div>
                  </td>
                  <td className="py-3 px-4 font-medium text-[#001743]">{tx.buyer}</td>
                  <td className="py-3 px-4 font-medium text-[#001743]">{tx.seller}</td>
                  <td className="py-3 px-4 font-bold text-[#001743] tabular-nums text-xs">
                    {formatVND(tx.amount)}
                  </td>
                  <td className="py-3 px-4 text-emerald-700 font-semibold tabular-nums">
                    +{formatVND(tx.fee)}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        tx.status === "EscrowHeld"
                          ? "bg-amber-50 text-amber-800 border border-amber-200"
                          : tx.status === "Released"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : tx.status === "Disputed"
                          ? "bg-rose-50 text-rose-700 border border-rose-200"
                          : "bg-gray-100 text-gray-700 border border-gray-200"
                      }`}
                    >
                      {tx.status === "EscrowHeld"
                        ? "Đang giữ ký quỹ"
                        : tx.status === "Released"
                        ? "Đã giải ngân"
                        : tx.status === "Disputed"
                        ? "Đang khiếu nại"
                        : "Đã hoàn trả"}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-[#6B7280] text-[11px]">{tx.time}</td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {tx.status === "EscrowHeld" && (
                        <>
                          <button
                            onClick={() => {
                              setTransactions(
                                transactions.map((t) => (t.id === tx.id ? { ...t, status: "Released" } : t))
                              );
                              showToast(`Đã thực hiện giải ngân ${formatVND(tx.amount - tx.fee)} cho người bán.`);
                            }}
                            className="px-2 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded text-[11px] font-semibold transition-colors"
                          >
                            Giải ngân
                          </button>
                          <button
                            onClick={() => {
                              setTransactions(
                                transactions.map((t) => (t.id === tx.id ? { ...t, status: "Refunded" } : t))
                              );
                              showToast(`Đã hoàn tiền ${formatVND(tx.amount)} lại cho người mua.`);
                            }}
                            className="px-2 py-1 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded text-[11px] font-semibold transition-colors"
                          >
                            Hoàn tiền
                          </button>
                        </>
                      )}
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

  // ==========================================
  // TAB: 9. KHIẾU NẠI & TRỌNG TÀI
  // ==========================================
  const renderDisputes = () => (
    <div className="space-y-4">
      <div className="bg-white border border-[#E5E7EB] rounded-md p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-[#001743]">Giải Quyết Khiếu Nại & Trọng Tài</h1>
          <p className="text-xs text-[#6B7280] mt-0.5">
            Xử lý tranh chấp hợp đồng mua bán SIM, xác minh bằng chứng chuyển quyền sở hữu viễn thông.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {disputes.map((d) => (
          <div key={d.id} className="bg-white border border-[#E5E7EB] rounded-md p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
                <div>
                  <span className="font-bold text-xs text-[#001743]">{d.id}</span>
                  <span className="text-xs text-[#6B7280] ml-2">Đơn: {d.orderCode}</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                  Đang xử lý
                </span>
              </div>

              <div className="py-3 space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-[#6B7280]">SIM tranh chấp:</span>
                  <span className="font-bold text-[#001743] tabular-nums">{formatPhone(d.sim)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#6B7280]">Bên khiếu nại:</span>
                  <span className="font-semibold text-[#001743]">{d.complainant}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#6B7280]">Bên bị khiếu nại:</span>
                  <span className="font-semibold text-[#001743]">{d.respondent}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#6B7280]">Số tiền tạm giữ:</span>
                  <span className="font-bold text-[#E4011E] tabular-nums">{formatVND(d.amount)}</span>
                </div>
                <div className="pt-2 border-t border-dashed border-[#E5E7EB]">
                  <span className="text-[#6B7280] block mb-1">Nội dung khiếu nại:</span>
                  <p className="p-2.5 bg-gray-50 rounded text-[#001743] leading-relaxed border border-[#E5E7EB]">
                    {d.reason}
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-[#E5E7EB] flex items-center justify-end gap-2">
              <button
                onClick={() => {
                  setDisputes(disputes.filter((item) => item.id !== d.id));
                  showToast(`Phán quyết: Chấp thuận khiếu nại của người mua, hoàn tiền ${formatVND(d.amount)}.`);
                }}
                className="px-3 py-1.5 bg-[#E4011E] text-white hover:bg-[#B80018] rounded text-xs font-semibold transition-colors"
              >
                Xử thắng cho Người Mua
              </button>
              <button
                onClick={() => {
                  setDisputes(disputes.filter((item) => item.id !== d.id));
                  showToast(`Phán quyết: Bác bỏ khiếu nại, giải ngân cho Người Bán.`);
                }}
                className="px-3 py-1.5 bg-[#001743] text-white hover:bg-[#002266] rounded text-xs font-semibold transition-colors"
              >
                Xử thắng cho Người Bán
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // ==========================================
  // TAB: 10. GIÁM SÁT AI FRAUD & AUDIT LOGS
  // ==========================================
  const renderAnomalies = () => (
    <div className="space-y-4">
      <div className="bg-white border border-[#E5E7EB] rounded-md p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-[#001743]">AI Giám Sát Bất Thường & Phòng Chống Gian Lận</h1>
          <p className="text-xs text-[#6B7280] mt-0.5">
            Mô hình máy học phát hiện hành vi quân xanh quân đỏ (Shill Bidding), spam bước giá và thông đồng tài khoản liên kết.
          </p>
        </div>
      </div>

      <div className="bg-white border border-[#E5E7EB] rounded-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#E5E7EB] bg-[#F8F9FA] text-[#6B7280] font-semibold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">Mức độ</th>
                <th className="py-3 px-4">Loại bất thường</th>
                <th className="py-3 px-4">Mô tả hành vi</th>
                <th className="py-3 px-4">Đối tượng / SIM</th>
                <th className="py-3 px-4">Thời gian</th>
                <th className="py-3 px-4">Trạng thái</th>
                <th className="py-3 px-4 text-right">Biện pháp xử lý</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {anomalies.map((anom) => (
                <tr key={anom.id} className="hover:bg-gray-50/60 transition-colors">
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        anom.level === "high"
                          ? "bg-red-50 text-red-700 border border-red-200"
                          : anom.level === "medium"
                          ? "bg-amber-50 text-amber-700 border border-amber-200"
                          : "bg-gray-100 text-gray-700 border border-gray-200"
                      }`}
                    >
                      {anom.level === "high" ? "Khẩn cấp" : anom.level === "medium" ? "Cảnh báo" : "Thông tin"}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-bold text-[#001743]">{anom.title}</td>
                  <td className="py-3 px-4 text-[#6B7280] max-w-sm">{anom.desc}</td>
                  <td className="py-3 px-4 font-mono font-bold text-[#001743]">{formatPhone(anom.sim)}</td>
                  <td className="py-3 px-4 text-[#9CA3AF] text-[11px]">{anom.time}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        anom.status === "open"
                          ? "bg-rose-50 text-rose-700 border border-rose-200"
                          : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      }`}
                    >
                      {anom.status === "open" ? "Chưa giải quyết" : "Đã xử lý"}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => showToast(`Đã đình chỉ phiên đấu giá của ${anom.sim} để thẩm định.`)}
                        className="px-2 py-1 bg-red-50 text-[#E4011E] hover:bg-red-100 border border-red-200 rounded text-[10px] font-semibold transition-colors"
                      >
                        Đình chỉ
                      </button>
                      <button
                        onClick={() => {
                          setAnomalies(anomalies.map((a) => (a.id === anom.id ? { ...a, status: "resolved" } : a)));
                          showToast(`Đã đóng cảnh báo ${anom.id}.`);
                        }}
                        className="px-2 py-1 bg-white text-[#6B7280] hover:text-[#001743] border border-[#D1D5DB] rounded text-[10px] font-semibold transition-colors"
                      >
                        Đóng
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

  // ==========================================
  // TAB: 11. CÀI ĐẶT HỆ THỐNG
  // ==========================================
  const renderSettings = () => (
    <div className="max-w-3xl space-y-6">
      <div className="bg-white border border-[#E5E7EB] rounded-md p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-[#001743]">Cấu Hình Tham Số Sàn TrustSim</h1>
          <p className="text-xs text-[#6B7280] mt-0.5">
            Điều chỉnh chính sách hoa hồng môi giới, tỷ lệ đặt cọc đấu giá và cơ chế bảo vệ giao dịch.
          </p>
        </div>
        <button
          onClick={() => showToast("Đã lưu các thiết lập hệ thống thành công!")}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#E4011E] hover:bg-[#B80018] text-white text-xs font-semibold rounded-md transition-colors shadow-sm"
        >
          <Check size={15} strokeWidth={1.5} />
          <span>Lưu cấu hình</span>
        </button>
      </div>

      <div className="bg-white border border-[#E5E7EB] rounded-md p-6 space-y-5">
        <div className="border-b border-[#E5E7EB] pb-4">
          <h3 className="text-sm font-bold text-[#001743] uppercase tracking-wider mb-1">
            Chính Sách Tài Chính & Phí Sàn
          </h3>
          <p className="text-xs text-[#6B7280]">Áp dụng cho mọi giao dịch thành công trên nền tảng TrustSim.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-semibold text-[#001743] mb-1.5">
              Phí hoa hồng sàn giao dịch (%)
            </label>
            <input
              type="number"
              step="0.1"
              value={settings.commissionRate}
              onChange={(e) => setSettings({ ...settings, commissionRate: Number(e.target.value) })}
              className="w-full text-xs p-2.5 bg-white border border-[#D1D5DB] rounded-md focus:border-[#E4011E] focus:outline-none"
            />
            <span className="text-[11px] text-[#9CA3AF] mt-1 block">Khấu trừ tự động khi giải ngân cho người bán.</span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#001743] mb-1.5">
              Tỷ lệ đặt cọc tối thiểu khi tham gia đấu giá (%)
            </label>
            <input
              type="number"
              value={settings.minDepositRate}
              onChange={(e) => setSettings({ ...settings, minDepositRate: Number(e.target.value) })}
              className="w-full text-xs p-2.5 bg-white border border-[#D1D5DB] rounded-md focus:border-[#E4011E] focus:outline-none"
            />
            <span className="text-[11px] text-[#9CA3AF] mt-1 block">Khóa tạm thời trong ví của người đấu giá.</span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#001743] mb-1.5">
              Thời gian bảo lưu ký quỹ Escrow (Giờ)
            </label>
            <input
              type="number"
              value={settings.escrowHoldingHours}
              onChange={(e) => setSettings({ ...settings, escrowHoldingHours: Number(e.target.value) })}
              className="w-full text-xs p-2.5 bg-white border border-[#D1D5DB] rounded-md focus:border-[#E4011E] focus:outline-none"
            />
            <span className="text-[11px] text-[#9CA3AF] mt-1 block">Thời hạn người mua kiểm tra SIM và xác nhận sang tên.</span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#001743] mb-1.5">
              Tự động gia hạn khi có bid phút chót (Phút)
            </label>
            <input
              type="number"
              value={settings.autoExtendMinutes}
              onChange={(e) => setSettings({ ...settings, autoExtendMinutes: Number(e.target.value) })}
              className="w-full text-xs p-2.5 bg-white border border-[#D1D5DB] rounded-md focus:border-[#E4011E] focus:outline-none"
            />
            <span className="text-[11px] text-[#9CA3AF] mt-1 block">Chống hành vi bắn tỉa (Sniping) ở giây cuối.</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#001743] text-white px-4 py-3 rounded-md shadow-lg border border-gray-700 text-xs font-semibold flex items-center gap-2 animate-fade-up">
          <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Render Active View Based on currentTab */}
      {currentTab === "dashboard" && renderDashboard()}
      {currentTab === "sims" && renderSims()}
      {currentTab === "auctions" && renderAuctions()}
      {currentTab === "categories" && renderCategories()}
      {currentTab === "carriers" && renderCarriers()}
      {currentTab === "users" && renderUsers()}
      {currentTab === "ekyc" && renderEkyc()}
      {currentTab === "transactions" && renderTransactions()}
      {currentTab === "disputes" && renderDisputes()}
      {currentTab === "anomalies" && renderAnomalies()}
      {currentTab === "settings" && renderSettings()}

      {/* ==========================================
          MODAL: THÊM / SỬA SIM
      ========================================== */}
      {simModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white border border-[#E5E7EB] rounded-md w-full max-w-lg shadow-xl overflow-hidden animate-fade-up">
            <div className="px-5 py-4 border-b border-[#E5E7EB] flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#001743]">
                {editingSim ? "Chỉnh sửa thông tin SIM" : "Thêm SIM mới vào kho"}
              </h3>
              <button
                onClick={() => setSimModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
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
                const status = formData.get("status") as string;

                if (editingSim) {
                  setSims(
                    sims.map((item) =>
                      item.id === editingSim.id ? { ...item, phone, carrier, category, price, type, status } : item
                    )
                  );
                  showToast(`Đã cập nhật SIM ${phone} thành công!`);
                } else {
                  const newSim = {
                    id: `SIM-${String(sims.length + 1).padStart(2, "0")}`,
                    phone,
                    carrier,
                    category,
                    price,
                    type,
                    status,
                    created: new Date().toLocaleDateString("vi-VN"),
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
                  className="w-full text-xs p-2.5 border border-[#D1D5DB] rounded-md focus:border-[#E4011E] focus:outline-none font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#001743] mb-1">Nhà mạng</label>
                  <select
                    name="carrier"
                    defaultValue={editingSim?.carrier || "Viettel"}
                    className="w-full text-xs p-2.5 border border-[#D1D5DB] rounded-md focus:border-[#E4011E] focus:outline-none"
                  >
                    <option value="Viettel">Viettel</option>
                    <option value="Vinaphone">Vinaphone</option>
                    <option value="Mobifone">Mobifone</option>
                    <option value="Vietnamobile">Vietnamobile</option>
                    <option value="Wintel">Wintel</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#001743] mb-1">Danh mục phong thủy</label>
                  <select
                    name="category"
                    defaultValue={editingSim?.category || "Tứ quý"}
                    className="w-full text-xs p-2.5 border border-[#D1D5DB] rounded-md focus:border-[#E4011E] focus:outline-none"
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
                    className="w-full text-xs p-2.5 border border-[#D1D5DB] rounded-md focus:border-[#E4011E] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#001743] mb-1">Hình thức thuê bao</label>
                  <select
                    name="type"
                    defaultValue={editingSim?.type || "Trả trước"}
                    className="w-full text-xs p-2.5 border border-[#D1D5DB] rounded-md focus:border-[#E4011E] focus:outline-none"
                  >
                    <option value="Trả trước">Trả trước</option>
                    <option value="Trả sau">Trả sau</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#001743] mb-1">Tình trạng kho</label>
                <select
                  name="status"
                  defaultValue={editingSim?.status || "Available"}
                  className="w-full text-xs p-2.5 border border-[#D1D5DB] rounded-md focus:border-[#E4011E] focus:outline-none"
                >
                  <option value="Available">Sẵn sàng giao dịch (Available)</option>
                  <option value="InAuction">Đang đấu giá (InAuction)</option>
                  <option value="Sold">Đã bán (Sold)</option>
                  <option value="Locked">Khóa tạm thời (Locked)</option>
                </select>
              </div>

              <div className="pt-3 border-t border-[#E5E7EB] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSimModalOpen(false)}
                  className="px-3.5 py-2 border border-[#D1D5DB] text-xs font-semibold text-[#4B5563] hover:text-[#001743] rounded-md"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#E4011E] hover:bg-[#B80018] text-white text-xs font-semibold rounded-md transition-colors"
                >
                  {editingSim ? "Lưu thay đổi" : "Thêm vào kho"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL: TẠO PHIÊN ĐẤU GIÁ
      ========================================== */}
      {auctionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white border border-[#E5E7EB] rounded-md w-full max-w-lg shadow-xl overflow-hidden animate-fade-up">
            <div className="px-5 py-4 border-b border-[#E5E7EB] flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#001743]">Tạo Phiên Đấu Giá Mới</h3>
              <button
                onClick={() => setAuctionModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X size={16} />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const sim = formData.get("sim") as string;
                const type = formData.get("type") as string;
                const startPrice = Number(formData.get("startPrice"));
                const step = Number(formData.get("step"));

                const newAuction = {
                  id: `AUC-${auctions.length + 101}`,
                  sim,
                  type,
                  currentPrice: startPrice,
                  startPrice,
                  step,
                  bids: 0,
                  seller: "Admin Center",
                  timeLeft: "24h 00m",
                  status: "live",
                };
                setAuctions([newAuction, ...auctions]);
                showToast(`Đã tạo thành công phiên đấu giá cho SIM ${sim}!`);
                setAuctionModalOpen(false);
              }}
              className="p-5 space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-[#001743] mb-1">Chọn SIM số đẹp</label>
                <select
                  required
                  name="sim"
                  className="w-full text-xs p-2.5 border border-[#D1D5DB] rounded-md focus:border-[#E4011E] focus:outline-none font-mono font-bold"
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
                  className="w-full text-xs p-2.5 border border-[#D1D5DB] rounded-md focus:border-[#E4011E] focus:outline-none"
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
                    className="w-full text-xs p-2.5 border border-[#D1D5DB] rounded-md focus:border-[#E4011E] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#001743] mb-1">Bước giá tối thiểu</label>
                  <input
                    required
                    type="number"
                    name="step"
                    defaultValue={500000}
                    className="w-full text-xs p-2.5 border border-[#D1D5DB] rounded-md focus:border-[#E4011E] focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-[#E5E7EB] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAuctionModalOpen(false)}
                  className="px-3.5 py-2 border border-[#D1D5DB] text-xs font-semibold text-[#4B5563] hover:text-[#001743] rounded-md"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#E4011E] hover:bg-[#B80018] text-white text-xs font-semibold rounded-md transition-colors"
                >
                  Bắt đầu phiên đấu giá
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL: THÊM DANH MỤC SIM
      ========================================== */}
      {categoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white border border-[#E5E7EB] rounded-md w-full max-w-lg shadow-xl overflow-hidden animate-fade-up">
            <div className="px-5 py-4 border-b border-[#E5E7EB] flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#001743]">Thêm Danh Mục Định Giá Mới</h3>
              <button
                onClick={() => setCategoryModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X size={16} />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const name = formData.get("name") as string;
                const code = formData.get("code") as string;
                const multiplier = Number(formData.get("multiplier"));
                const desc = formData.get("desc") as string;
                const regex = formData.get("regex") as string;

                const newCat = {
                  id: `CAT-${categories.length + 1}`,
                  name,
                  code,
                  multiplier,
                  count: 0,
                  desc,
                  regex,
                };
                setCategories([...categories, newCat]);
                showToast(`Đã thêm danh mục ${name} thành công!`);
                setCategoryModalOpen(false);
              }}
              className="p-5 space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-[#001743] mb-1">Tên danh mục</label>
                <input
                  required
                  name="name"
                  placeholder="Ví dụ: Cửu quý (999999999)"
                  className="w-full text-xs p-2.5 border border-[#D1D5DB] rounded-md focus:border-[#E4011E] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#001743] mb-1">Mã ký hiệu (Code)</label>
                  <input
                    required
                    name="code"
                    placeholder="CUU_QUY"
                    className="w-full text-xs p-2.5 border border-[#D1D5DB] rounded-md focus:border-[#E4011E] focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#001743] mb-1">Hệ số định giá AI</label>
                  <input
                    required
                    step="0.1"
                    type="number"
                    name="multiplier"
                    defaultValue={2.0}
                    className="w-full text-xs p-2.5 border border-[#D1D5DB] rounded-md focus:border-[#E4011E] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#001743] mb-1">Biểu thức chính quy (Regex Pattern)</label>
                <input
                  required
                  name="regex"
                  placeholder="(\\d)\\1{8}"
                  className="w-full text-xs p-2.5 border border-[#D1D5DB] rounded-md focus:border-[#E4011E] focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#001743] mb-1">Mô tả nhận diện</label>
                <textarea
                  name="desc"
                  rows={2}
                  placeholder="Mô tả ý nghĩa và quy tắc phong thủy..."
                  className="w-full text-xs p-2.5 border border-[#D1D5DB] rounded-md focus:border-[#E4011E] focus:outline-none"
                ></textarea>
              </div>

              <div className="pt-3 border-t border-[#E5E7EB] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCategoryModalOpen(false)}
                  className="px-3.5 py-2 border border-[#D1D5DB] text-xs font-semibold text-[#4B5563] hover:text-[#001743] rounded-md"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#E4011E] hover:bg-[#B80018] text-white text-xs font-semibold rounded-md transition-colors"
                >
                  Tạo danh mục
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL: THÊM NHÀ MẠNG
      ========================================== */}
      {carrierModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white border border-[#E5E7EB] rounded-md w-full max-w-lg shadow-xl overflow-hidden animate-fade-up">
            <div className="px-5 py-4 border-b border-[#E5E7EB] flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#001743]">Thêm Nhà Mạng & Dải Đầu Số</h3>
              <button
                onClick={() => setCarrierModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X size={16} />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const name = formData.get("name") as string;
                const code = formData.get("code") as string;
                const prefixesRaw = formData.get("prefixes") as string;
                const prefixes = prefixesRaw.split(",").map((p) => p.trim()).filter(Boolean);

                const newCarrier = {
                  id: `CAR-${carriers.length + 1}`,
                  name,
                  code,
                  prefixes,
                  totalSims: 0,
                };
                setCarriers([...carriers, newCarrier]);
                showToast(`Đã thêm nhà mạng ${name} thành công!`);
                setCarrierModalOpen(false);
              }}
              className="p-5 space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-[#001743] mb-1">Tên nhà mạng viễn thông</label>
                <input
                  required
                  name="name"
                  placeholder="Ví dụ: FPT Telecom"
                  className="w-full text-xs p-2.5 border border-[#D1D5DB] rounded-md focus:border-[#E4011E] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#001743] mb-1">Mã nhà mạng</label>
                <input
                  required
                  name="code"
                  placeholder="FPT"
                  className="w-full text-xs p-2.5 border border-[#D1D5DB] rounded-md focus:border-[#E4011E] focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#001743] mb-1">
                  Danh sách đầu số (cách nhau bởi dấu phẩy)
                </label>
                <input
                  required
                  name="prefixes"
                  placeholder="0775, 0776, 0778"
                  className="w-full text-xs p-2.5 border border-[#D1D5DB] rounded-md focus:border-[#E4011E] focus:outline-none font-mono"
                />
              </div>

              <div className="pt-3 border-t border-[#E5E7EB] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCarrierModalOpen(false)}
                  className="px-3.5 py-2 border border-[#D1D5DB] text-xs font-semibold text-[#4B5563] hover:text-[#001743] rounded-md"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#E4011E] hover:bg-[#B80018] text-white text-xs font-semibold rounded-md transition-colors"
                >
                  Lưu nhà mạng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL: SOI ẢNH ĐỐI CHIẾU eKYC
      ========================================== */}
      {ekycInspectItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white border border-[#E5E7EB] rounded-md w-full max-w-2xl shadow-2xl overflow-hidden animate-fade-up">
            <div className="px-5 py-4 border-b border-[#E5E7EB] flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#001743]">
                  Hồ sơ đối soát eKYC: {ekycInspectItem.userName}
                </h3>
                <span className="text-xs text-[#6B7280]">CCCD số: {ekycInspectItem.idCardNumber}</span>
              </div>
              <button
                onClick={() => setEkycInspectItem(null)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Photo Comparison Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Front Side */}
                <div className="border border-[#E5E7EB] rounded-md p-3 bg-[#F8F9FA] text-center">
                  <div className="text-[11px] font-bold text-[#001743] mb-2">1. Mặt trước CCCD</div>
                  <div className="h-32 bg-gray-200 rounded flex flex-col items-center justify-center text-[#6B7280] text-[11px] border border-dashed border-gray-300">
                    <FileText size={24} className="text-gray-400 mb-1" />
                    <span>Ảnh mặt trước</span>
                    <span className="text-[10px] text-emerald-600 font-semibold mt-1">✓ Đã bóc tách OCR</span>
                  </div>
                </div>

                {/* Back Side */}
                <div className="border border-[#E5E7EB] rounded-md p-3 bg-[#F8F9FA] text-center">
                  <div className="text-[11px] font-bold text-[#001743] mb-2">2. Mặt sau CCCD</div>
                  <div className="h-32 bg-gray-200 rounded flex flex-col items-center justify-center text-[#6B7280] text-[11px] border border-dashed border-gray-300">
                    <FileText size={24} className="text-gray-400 mb-1" />
                    <span>Ảnh mặt sau</span>
                    <span className="text-[10px] text-emerald-600 font-semibold mt-1">✓ Chip NFC hợp lệ</span>
                  </div>
                </div>

                {/* Selfie Face */}
                <div className="border border-[#E5E7EB] rounded-md p-3 bg-[#F8F9FA] text-center">
                  <div className="text-[11px] font-bold text-[#001743] mb-2">3. Ảnh Chân dung (Selfie)</div>
                  <div className="h-32 bg-gray-200 rounded flex flex-col items-center justify-center text-[#6B7280] text-[11px] border border-dashed border-gray-300">
                    <UserCheck size={24} className="text-gray-400 mb-1" />
                    <span>Chân dung động Liveness</span>
                    <span className="text-[10px] text-emerald-600 font-semibold mt-1">
                      {ekycInspectItem.faceMatchScore}% Match
                    </span>
                  </div>
                </div>
              </div>

              {/* Data comparison sheet */}
              <div className="bg-[#F8F9FA] border border-[#E5E7EB] rounded-md p-4 space-y-2 text-xs">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[#6B7280] block text-[10px] uppercase">Họ và tên</span>
                    <span className="font-bold text-[#001743]">{ekycInspectItem.userName}</span>
                  </div>
                  <div>
                    <span className="text-[#6B7280] block text-[10px] uppercase">Số định danh cá nhân</span>
                    <span className="font-mono font-bold text-[#001743]">{ekycInspectItem.idCardNumber}</span>
                  </div>
                  <div>
                    <span className="text-[#6B7280] block text-[10px] uppercase">Ngày sinh</span>
                    <span className="text-[#001743]">{ekycInspectItem.dob}</span>
                  </div>
                  <div>
                    <span className="text-[#6B7280] block text-[10px] uppercase">Điểm tin cậy AI</span>
                    <span className="font-bold text-emerald-600">Đạt chuẩn giao dịch cấp 2</span>
                  </div>
                </div>
                <div className="pt-2 border-t border-[#E5E7EB]">
                  <span className="text-[#6B7280] block text-[10px] uppercase">Nơi thường trú</span>
                  <span className="text-[#001743]">{ekycInspectItem.address}</span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEkycInspectItem(null)}
                  className="px-3.5 py-2 border border-[#D1D5DB] text-xs font-semibold text-[#4B5563] hover:text-[#001743] rounded-md"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEkycQueue(ekycQueue.filter((x) => x.id !== ekycInspectItem.id));
                    setEkycInspectItem(null);
                    showToast(`Đã phê duyệt eKYC cho ${ekycInspectItem.userName}.`);
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5"
                >
                  <Check size={14} />
                  <span>Xác nhận duyệt hồ sơ</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL: XÁC NHẬN XÓA
      ========================================== */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white border border-[#E5E7EB] rounded-md w-full max-w-sm shadow-xl p-5 animate-fade-up">
            <div className="flex items-center gap-3 mb-3 text-red-600">
              <AlertTriangle size={20} />
              <h3 className="text-sm font-bold text-[#001743]">Xác nhận xóa dữ liệu</h3>
            </div>
            <p className="text-xs text-[#6B7280] leading-relaxed mb-5">
              Bạn có chắc chắn muốn xóa <strong className="text-[#001743]">{deleteConfirm.name}</strong> không? Hành động này không thể hoàn tác.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-3 py-1.5 border border-[#D1D5DB] text-xs font-semibold text-[#4B5563] hover:text-[#001743] rounded-md"
              >
                Hủy bỏ
              </button>
              <button
                onClick={() => {
                  if (deleteConfirm.type === "sim") {
                    setSims(sims.filter((s) => s.id !== deleteConfirm.id));
                  } else if (deleteConfirm.type === "category") {
                    setCategories(categories.filter((c) => c.id !== deleteConfirm.id));
                  } else if (deleteConfirm.type === "carrier") {
                    setCarriers(carriers.filter((c) => c.id !== deleteConfirm.id));
                  }
                  showToast(`Đã xóa ${deleteConfirm.name} thành công!`);
                  setDeleteConfirm(null);
                }}
                className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-md transition-colors"
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
