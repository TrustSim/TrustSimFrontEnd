"use client";
import React, { useState, useMemo } from "react";
import {
  Search,
  RefreshCw,
  X,
  Eye,
  MoreVertical,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  ShieldAlert,
  FileText,
  MessageSquare,
  DollarSign,
  User,
  Phone,
  Check,
  RotateCcw,
  Scale,
} from "lucide-react";
import {
  RightDrawer,
  DrawerBody,
  DrawerFooter,
  DrawerSection,
  BtnPrimary,
  BtnSecondary,
} from "@/components/ui/RightDrawer";
import ImportExportBar from "@/components/admin/ImportExportBar";
import { ExcelColumnDef } from "@/services/excelService";

// Helper định dạng tiền tệ VNĐ
const formatVND = (value: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(value);

// Helper định dạng số điện thoại đẹp
const formatPhone = (phone: string) => {
  const cleaned = (phone || "").replace(/\D/g, "");
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`;
  }
  return phone;
};

export type DisputeStatus = "UnderReview" | "Resolved_Buyer" | "Resolved_Seller" | "Mediated";
export type RiskLevel = "high" | "medium" | "low";

export interface DisputeEvent {
  time: string;
  actor: string;
  content: string;
  type: "system" | "buyer" | "seller" | "admin";
}

export interface DisputeItem {
  id: string;
  orderCode: string;
  sim: string;
  complainant: string; // Người khiếu nại
  complainantRole: "buyer" | "seller";
  respondent: string; // Người bị khiếu nại
  respondentRole: "buyer" | "seller";
  reason: string;
  amount: number;
  status: DisputeStatus;
  risk: RiskLevel;
  isFrozen: boolean;
  date: string;
  deadline: string;
  evidence: { title: string; desc: string; type: "file" | "image" | "log" }[];
  timeline: DisputeEvent[];
}

const INITIAL_DISPUTES: DisputeItem[] = [
  {
    id: "DSP-01",
    orderCode: "ORD-8815",
    sim: "0987654321",
    complainant: "Nguyễn Bảo Long",
    complainantRole: "buyer",
    respondent: "LuckyNum (Trần Văn Bình)",
    respondentRole: "seller",
    reason: "Bên bán không bàn giao mã OTP ủy quyền sang tên đúng hẹn 24h, từ chối ra cửa hàng Viettel.",
    amount: 35000000,
    status: "UnderReview",
    risk: "high",
    isFrozen: true,
    date: "09/09/2026 14:15",
    deadline: "11/09/2026 18:00 (Cần xử lý gấp)",
    evidence: [
      {
        title: "Ảnh chụp màn hình tin nhắn hẹn gặp",
        desc: "Bên mua chứng minh đã đến điểm giao dịch nhưng bên bán không xuất hiện.",
        type: "image",
      },
      {
        title: "Biên bản xác nhận tại quầy Viettel",
        desc: "Điểm giao dịch xác nhận thuê bao chưa thực hiện thủ tục đổi chủ.",
        type: "file",
      },
    ],
    timeline: [
      { time: "09/09/2026 14:15", actor: "Nguyễn Bảo Long", content: "Mở khiếu nại và yêu cầu phong tỏa tiền ký quỹ", type: "buyer" },
      { time: "09/09/2026 14:16", actor: "Hệ thống TrustSim", content: "Tự động đóng băng 35.000.000 đ ký quỹ của đơn hàng ORD-8815", type: "system" },
      { time: "09/09/2026 16:30", actor: "LuckyNum", content: "Phản hồi: Do bận công tác đột xuất, đề nghị lùi lịch hẹn sang ngày mai", type: "seller" },
    ],
  },
  {
    id: "DSP-02",
    orderCode: "ORD-8799",
    sim: "0911223344",
    complainant: "Phan Văn Nam",
    complainantRole: "seller",
    respondent: "Lê Minh Tuấn",
    respondentRole: "buyer",
    reason: "Người mua đã nhận mã OTP ủy quyền nhưng cố tình không xác nhận hoàn tất giao dịch để ngâm tiền.",
    amount: 18000000,
    status: "UnderReview",
    risk: "medium",
    isFrozen: true,
    date: "10/09/2026 09:30",
    deadline: "13/09/2026 12:00",
    evidence: [
      {
        title: "Mã OTP đã cấp từ Vinaphone",
        desc: "Ảnh chụp log tổng đài Vinaphone gửi mã ủy quyền thành công đến máy người mua.",
        type: "log",
      },
    ],
    timeline: [
      { time: "10/09/2026 09:30", actor: "Phan Văn Nam", content: "Yêu cầu sàn can thiệp giải ngân do người mua không xác nhận", type: "seller" },
      { time: "10/09/2026 10:00", actor: "Hệ thống TrustSim", content: "Gửi cảnh báo yêu cầu người mua phản hồi trong vòng 24h", type: "system" },
    ],
  },
  {
    id: "DSP-03",
    orderCode: "ORD-8750",
    sim: "0908889999",
    complainant: "Hoàng Minh Tuấn",
    complainantRole: "buyer",
    respondent: "Vũ Đại Gia",
    respondentRole: "seller",
    reason: "SIM bị chặn 1 chiều do còn nợ cước phát sinh từ thời chủ cũ chưa thanh toán hết.",
    amount: 65000000,
    status: "Resolved_Buyer",
    risk: "low",
    isFrozen: false,
    date: "06/09/2026 11:20",
    deadline: "Đã hoàn tất phán quyết",
    evidence: [
      {
        title: "Thông báo nợ cước của Mobifone",
        desc: "Văn bản xác nhận thuê bao nợ cước trả sau 1.250.000 đ chưa thanh toán.",
        type: "file",
      },
    ],
    timeline: [
      { time: "06/09/2026 11:20", actor: "Hoàng Minh Tuấn", content: "Mở khiếu nại nợ cước", type: "buyer" },
      { time: "07/09/2026 10:15", actor: "Quản trị viên Trọng tài", content: "Phán quyết hoàn 100% tiền ký quỹ cho người mua do vi phạm điều khoản bàn giao SIM sạch", type: "admin" },
    ],
  },
];

const DISPUTE_EXPORT_COLUMNS: ExcelColumnDef<DisputeItem>[] = [
  { header: "Mã khiếu nại", key: "id", width: 14 },
  { header: "Mã đơn hàng", key: "orderCode", width: 14 },
  { header: "Số SIM", key: "sim", width: 16, formatter: (v) => formatPhone(String(v)) },
  { header: "Người khiếu nại", key: "complainant", width: 22 },
  { header: "Người bị khiếu nại", key: "respondent", width: 22 },
  { header: "Số tiền tranh chấp (VNĐ)", key: "amount", width: 22, formatter: (v) => formatVND(Number(v)) },
  {
    header: "Mức độ rủi ro",
    key: "risk",
    width: 16,
    formatter: (v) => (v === "high" ? "Rủi ro cao" : v === "medium" ? "Trung bình" : "Thấp"),
  },
  {
    header: "Trạng thái",
    key: "status",
    width: 20,
    formatter: (v) =>
      v === "UnderReview"
        ? "Đang xem xét"
        : v === "Resolved_Buyer"
        ? "Thắng cho Người mua"
        : v === "Resolved_Seller"
        ? "Thắng cho Người bán"
        : "Hòa giải thành công",
  },
  { header: "Lý do", key: "reason", width: 35 },
  { header: "Ngày tạo", key: "date", width: 18 },
];

export default function AdminDisputesTab() {
  const [disputes, setDisputes] = useState<DisputeItem[]>(INITIAL_DISPUTES);
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [pageIndex, setPageIndex] = useState(1);
  const pageSize = 10;

  // Drawer state
  const [selectedDispute, setSelectedDispute] = useState<DisputeItem | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerTab, setDrawerTab] = useState<"details" | "timeline">("details");

  // Confirm Decision Modal
  const [adjudicateAction, setAdjudicateAction] = useState<{
    dispute: DisputeItem;
    decision: "buyer" | "seller" | "mediate";
  } | null>(null);
  const [adjudicateReason, setAdjudicateReason] = useState("");
  const [loading, setLoading] = useState(false);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // KPIs
  const underReviewCount = useMemo(() => disputes.filter((d) => d.status === "UnderReview").length, [disputes]);
  const highRiskCount = useMemo(() => disputes.filter((d) => d.risk === "high" && d.status === "UnderReview").length, [disputes]);
  const resolvedCount = useMemo(() => disputes.filter((d) => d.status !== "UnderReview").length, [disputes]);
  const frozenAmount = useMemo(
    () => disputes.filter((d) => d.isFrozen).reduce((sum, d) => sum + d.amount, 0),
    [disputes]
  );

  // Filtered
  const filtered = useMemo(() => {
    return disputes.filter((item) => {
      const q = search.toLowerCase().trim();
      const matchSearch =
        !q ||
        item.id.toLowerCase().includes(q) ||
        item.orderCode.toLowerCase().includes(q) ||
        item.sim.includes(q) ||
        item.complainant.toLowerCase().includes(q) ||
        item.respondent.toLowerCase().includes(q) ||
        item.reason.toLowerCase().includes(q);

      const matchRisk = riskFilter === "all" || item.risk === riskFilter;
      const matchStatus = statusFilter === "all" || item.status === statusFilter;

      return matchSearch && matchRisk && matchStatus;
    });
  }, [disputes, search, riskFilter, statusFilter]);

  const paged = filtered.slice((pageIndex - 1) * pageSize, pageIndex * pageSize);

  const openDetail = (d: DisputeItem, tab: "details" | "timeline" = "details") => {
    setSelectedDispute(d);
    setDrawerTab(tab);
    setDrawerOpen(true);
  };

  const handleConfirmDecision = () => {
    if (!adjudicateAction || !adjudicateReason.trim()) return;
    setLoading(true);

    setTimeout(() => {
      const { dispute, decision } = adjudicateAction;
      const newStatus: DisputeStatus =
        decision === "buyer"
          ? "Resolved_Buyer"
          : decision === "seller"
          ? "Resolved_Seller"
          : "Mediated";

      const decisionTitle =
        decision === "buyer"
          ? "Phán quyết: Hoàn tiền 100% cho người mua"
          : decision === "seller"
          ? "Phán quyết: Giải ngân tiền cho người bán"
          : "Phán quyết: Hòa giải & Phân bổ tổn thất";

      const newTimelineEvent: DisputeEvent = {
        time: new Date().toLocaleString("vi-VN"),
        actor: "Quản trị viên Trọng tài",
        content: `${decisionTitle}. Lý do: ${adjudicateReason}`,
        type: "admin",
      };

      setDisputes((prev) =>
        prev.map((item) =>
          item.id === dispute.id
            ? {
                ...item,
                status: newStatus,
                isFrozen: false,
                timeline: [...item.timeline, newTimelineEvent],
                deadline: "Đã hoàn tất phán quyết",
              }
            : item
        )
      );

      if (selectedDispute?.id === dispute.id) {
        setSelectedDispute((prev) =>
          prev
            ? {
                ...prev,
                status: newStatus,
                isFrozen: false,
                timeline: [...prev.timeline, newTimelineEvent],
                deadline: "Đã hoàn tất phán quyết",
              }
            : null
        );
      }

      showToast(`Đã ra phán quyết thành công cho khiếu nại ${dispute.id}.`);
      setLoading(false);
      setAdjudicateAction(null);
      setAdjudicateReason("");
    }, 400);
  };

  return (
    <div className="space-y-4">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-[80] bg-[#001743] text-white text-xs px-4 py-2.5 rounded-[6px] shadow-lg border border-slate-700 animate-fade-in flex items-center gap-2">
          <CheckCircle2 size={14} className="text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ── 1. Header Card ── */}
      <div className="bg-white border border-[#E2E8F0] rounded-[8px] p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-base font-bold text-[#001743]">Giải Quyết Khiếu Nại &amp; Trọng Tài</h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 font-mono">
              {disputes.length} hồ sơ
            </span>
          </div>
          <p className="text-xs text-[#6B7280] mt-0.5">
            Thẩm định bằng chứng giao dịch, xử lý tranh chấp giữa các bên và bảo vệ tính minh bạch của sàn.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <ImportExportBar
            data={disputes}
            columns={DISPUTE_EXPORT_COLUMNS}
            filename={`TrustSim_Disputes_${new Date().toISOString().slice(0, 10)}`}
            entityName="khiếu nại"
            showImport={false}
          />
        </div>
      </div>

      {/* ── 2. KPI Metrics Grid ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white border border-[#E2E8F0] rounded-[8px] p-3.5 shadow-xs">
          <span className="text-[11px] font-medium text-slate-500 block">Đang xem xét</span>
          <div className="text-base font-bold text-amber-600 font-mono tabular-nums mt-0.5">
            {underReviewCount} hồ sơ
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">Cần trọng tài thẩm định</span>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-[8px] p-3.5 shadow-xs">
          <span className="text-[11px] font-medium text-slate-500 block">Rủi ro cao cần xử lý</span>
          <div className="text-base font-bold text-[#E4011E] font-mono tabular-nums mt-0.5">
            {highRiskCount} vụ việc
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">Sát hạn chót giải quyết</span>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-[8px] p-3.5 shadow-xs">
          <span className="text-[11px] font-medium text-slate-500 block">Đã giải quyết</span>
          <div className="text-base font-bold text-emerald-600 font-mono tabular-nums mt-0.5">
            {resolvedCount} hồ sơ
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">Đã ban hành phán quyết</span>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-[8px] p-3.5 shadow-xs">
          <span className="text-[11px] font-medium text-slate-500 block">Giá trị đang đóng băng</span>
          <div className="text-base font-bold text-[#001743] font-mono tabular-nums mt-0.5">
            {formatVND(frozenAmount)}
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">Ký quỹ đang tạm giữ</span>
        </div>
      </div>

      {/* ── 3. Filter Toolbar Card ── */}
      <div className="bg-white border border-[#E2E8F0] rounded-[8px] p-3 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
          <div className="relative w-80">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPageIndex(1);
              }}
              placeholder="Tìm mã vụ việc, số SIM, người khiếu nại..."
              className="w-full pl-9 pr-8 py-1.5 text-xs bg-white border border-[#D1D5DB] rounded-[6px] focus:border-[#001743] focus:outline-none"
            />
            {search && (
              <button
                onClick={() => {
                  setSearch("");
                  setPageIndex(1);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={12} />
              </button>
            )}
          </div>

          <select
            value={riskFilter}
            onChange={(e) => {
              setRiskFilter(e.target.value);
              setPageIndex(1);
            }}
            className="text-xs py-1.5 px-3 bg-white border border-[#D1D5DB] rounded-[6px] text-slate-700 focus:border-[#001743] focus:outline-none"
          >
            <option value="all">Tất cả mức rủi ro</option>
            <option value="high">Rủi ro cao</option>
            <option value="medium">Trung bình</option>
            <option value="low">Thấp</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPageIndex(1);
            }}
            className="text-xs py-1.5 px-3 bg-white border border-[#D1D5DB] rounded-[6px] text-slate-700 focus:border-[#001743] focus:outline-none"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="UnderReview">Đang xem xét</option>
            <option value="Resolved_Buyer">Duyệt cho người mua</option>
            <option value="Resolved_Seller">Duyệt cho người bán</option>
            <option value="Mediated">Hòa giải thành công</option>
          </select>

          {(search || riskFilter !== "all" || statusFilter !== "all") && (
            <button
              onClick={() => {
                setSearch("");
                setRiskFilter("all");
                setStatusFilter("all");
                setPageIndex(1);
              }}
              className="text-xs text-[#E4011E] hover:underline px-1.5 py-1"
            >
              Xóa bộ lọc
            </button>
          )}
        </div>

        <div className="text-xs text-[#6B7280]">
          Hiển thị <strong className="text-[#001743]">{filtered.length}</strong> vụ việc
        </div>
      </div>

      {/* ── 4. Table Card ── */}
      <div className="bg-white border border-[#E2E8F0] rounded-[8px] overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-slate-500 font-semibold uppercase text-[10px] tracking-wider h-10">
                <th className="py-3 px-4">Mã khiếu nại / SIM</th>
                <th className="py-3 px-4">Bên khiếu nại</th>
                <th className="py-3 px-4">Bên bị khiếu nại</th>
                <th className="py-3 px-4 text-right">Số tiền tranh chấp</th>
                <th className="py-3 px-4 text-center">Mức rủi ro</th>
                <th className="py-3 px-4 text-center">Trạng thái</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {paged.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 text-xs">
                    Không tìm thấy hồ sơ khiếu nại nào phù hợp
                  </td>
                </tr>
              ) : (
                paged.map((item) => {
                  const isHighRiskUrgent = item.risk === "high" && item.status === "UnderReview";

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-slate-50/80 transition-colors h-14 ${
                        isHighRiskUrgent ? "border-l-4 border-l-[#E4011E] bg-rose-50/25" : ""
                      }`}
                    >
                      <td className="py-3 px-4">
                        <div className="font-bold text-sm text-[#001743] tabular-nums font-mono">
                          {formatPhone(item.sim)}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          {item.id} · {item.orderCode}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800">{item.complainant}</div>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          {item.complainantRole === "buyer" ? "Bên mua" : "Bên bán"}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800">{item.respondent}</div>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          {item.respondentRole === "buyer" ? "Bên mua" : "Bên bán"}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="font-bold text-sm text-[#001743] tabular-nums font-mono">
                          {formatVND(item.amount)}
                        </div>
                        {item.isFrozen && (
                          <span className="text-[10px] text-rose-600 font-semibold flex items-center justify-end gap-1 mt-0.5">
                            <Clock size={10} /> Đóng băng ký quỹ
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            item.risk === "high"
                              ? "bg-rose-50 text-rose-700 border border-rose-200"
                              : item.risk === "medium"
                              ? "bg-amber-50 text-amber-800 border border-amber-200"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {item.risk === "high" ? "Rủi ro cao" : item.risk === "medium" ? "Trung bình" : "Thấp"}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-[4px] text-[10px] font-bold ${
                            item.status === "UnderReview"
                              ? "bg-amber-50 text-amber-800 border border-amber-200"
                              : item.status === "Resolved_Buyer"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : item.status === "Resolved_Seller"
                              ? "bg-blue-50 text-blue-700 border border-blue-200"
                              : "bg-purple-50 text-purple-700 border border-purple-200"
                          }`}
                        >
                          {item.status === "UnderReview"
                            ? "Đang xem xét"
                            : item.status === "Resolved_Buyer"
                            ? "Thắng cho Bên mua"
                            : item.status === "Resolved_Seller"
                            ? "Thắng cho Bên bán"
                            : "Hòa giải thành công"}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => openDetail(item)}
                          className="inline-flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-slate-100 border border-[#D1D5DB] rounded-[6px] text-xs font-semibold text-slate-700 transition-colors shadow-2xs"
                        >
                          <Eye size={13} strokeWidth={1.75} />
                          <span>Thẩm định</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── 5. RightDrawer: Evidence & Dispute Workspace (size="xl") ── */}
      <RightDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={selectedDispute ? `Hồ sơ khiếu nại: ${selectedDispute.id}` : "Thẩm định khiếu nại"}
        badge={selectedDispute ? selectedDispute.orderCode : ""}
        badgeCls="bg-[#001743] text-white"
        size="xl"
      >
        {selectedDispute && (
          <>
            <DrawerBody>
              {/* Tab Navigation inside Drawer */}
              <div className="flex border-b border-slate-200 mb-4 gap-2">
                <button
                  type="button"
                  onClick={() => setDrawerTab("details")}
                  className={`pb-2 text-xs font-bold border-b-2 transition-colors ${
                    drawerTab === "details"
                      ? "border-[#001743] text-[#001743]"
                      : "border-transparent text-slate-400 hover:text-slate-600"
                  }`}
                >
                  Nội dung &amp; Bằng chứng
                </button>
                <button
                  type="button"
                  onClick={() => setDrawerTab("timeline")}
                  className={`pb-2 text-xs font-bold border-b-2 transition-colors ${
                    drawerTab === "timeline"
                      ? "border-[#001743] text-[#001743]"
                      : "border-transparent text-slate-400 hover:text-slate-600"
                  }`}
                >
                  Lịch sử xử lý ({selectedDispute.timeline.length})
                </button>
              </div>

              {drawerTab === "details" ? (
                <div className="space-y-4">
                  {/* Summary Card */}
                  <div className="bg-slate-50 border border-slate-200 rounded-[8px] p-3.5 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Số SIM chuyển nhượng:</span>
                      <span className="font-bold text-[#001743] font-mono text-sm">
                        {formatPhone(selectedDispute.sim)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Số tiền tranh chấp:</span>
                      <span className="font-extrabold text-[#E4011E] font-mono text-sm tabular-nums">
                        {formatVND(selectedDispute.amount)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                      <span className="text-slate-500">Thời hạn phán quyết:</span>
                      <span className="font-semibold text-slate-700">{selectedDispute.deadline}</span>
                    </div>
                  </div>

                  {/* Grievance Reason */}
                  <DrawerSection title="Nội dung khiếu nại">
                    <div className="p-3 bg-white border border-slate-200 rounded-[6px] text-xs text-slate-700 leading-relaxed">
                      <p className="font-medium">{selectedDispute.reason}</p>
                      <div className="text-[11px] text-slate-400 mt-2">
                        Người gửi: <strong className="text-slate-700">{selectedDispute.complainant}</strong> · Ngày gửi: {selectedDispute.date}
                      </div>
                    </div>
                  </DrawerSection>

                  {/* Evidence Items */}
                  <DrawerSection title="Tài liệu & Chứng cứ đã nộp">
                    <div className="space-y-2">
                      {selectedDispute.evidence.map((evi, idx) => (
                        <div
                          key={idx}
                          className="p-3 bg-white border border-slate-200 rounded-[6px] flex items-start gap-2.5 text-xs shadow-2xs"
                        >
                          <div className="p-2 rounded-md bg-slate-100 text-slate-600 shrink-0">
                            {evi.type === "image" ? (
                              <FileText size={16} />
                            ) : (
                              <MessageSquare size={16} />
                            )}
                          </div>
                          <div>
                            <span className="font-bold text-[#001743] block">{evi.title}</span>
                            <span className="text-[11px] text-slate-500 mt-0.5 block">{evi.desc}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </DrawerSection>
                </div>
              ) : (
                /* Timeline events */
                <DrawerSection title="Nhật ký xử lý trọng tài">
                  <div className="space-y-3 relative pl-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                    {selectedDispute.timeline.map((event, idx) => (
                      <div key={idx} className="relative">
                        <div
                          className={`absolute -left-6 top-1 w-4 h-4 rounded-full flex items-center justify-center border-2 border-white ${
                            event.type === "admin"
                              ? "bg-purple-600"
                              : event.type === "buyer"
                              ? "bg-emerald-600"
                              : event.type === "seller"
                              ? "bg-blue-600"
                              : "bg-slate-400"
                          }`}
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-white" />
                        </div>

                        <div className="bg-white border border-slate-100 rounded-[6px] p-2.5 shadow-2xs">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-bold text-[#001743]">{event.actor}</span>
                            <span className="text-slate-400">{event.time}</span>
                          </div>
                          <p className="text-xs text-slate-600 mt-1 leading-relaxed">{event.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </DrawerSection>
              )}
            </DrawerBody>

            <DrawerFooter>
              <div className="flex flex-col sm:flex-row items-center justify-between gap-2 w-full">
                <BtnSecondary onClick={() => setDrawerOpen(false)}>Đóng</BtnSecondary>

                {selectedDispute.status === "UnderReview" && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setAdjudicateAction({ dispute: selectedDispute, decision: "buyer" })}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-[6px] transition-colors"
                    >
                      Xử Bên Mua thắng (Hoàn tiền)
                    </button>
                    <button
                      type="button"
                      onClick={() => setAdjudicateAction({ dispute: selectedDispute, decision: "seller" })}
                      className="px-3 py-1.5 bg-[#001743] hover:bg-[#00266B] text-white text-xs font-bold rounded-[6px] transition-colors"
                    >
                      Xử Bên Bán thắng (Giải ngân)
                    </button>
                    <button
                      type="button"
                      onClick={() => setAdjudicateAction({ dispute: selectedDispute, decision: "mediate" })}
                      className="px-3 py-1.5 border border-purple-200 text-purple-700 hover:bg-purple-50 text-xs font-bold rounded-[6px] transition-colors"
                    >
                      Hòa giải 50/50
                    </button>
                  </div>
                )}
              </div>
            </DrawerFooter>
          </>
        )}
      </RightDrawer>

      {/* ── 6. Confirm Modal with Mandatory Reason ── */}
      {adjudicateAction && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white border border-[#E2E8F0] rounded-[8px] w-full max-w-md shadow-xl p-5 animate-fade-up">
            <div className="flex items-start gap-3 mb-3">
              <div className="p-2 rounded-lg bg-[#001743]/10 text-[#001743] shrink-0">
                <Scale size={20} strokeWidth={2} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#001743]">
                  Xác nhận phán quyết trọng tài
                </h3>
                <p className="text-xs text-[#6B7280] mt-1 leading-relaxed">
                  Quyết định:{" "}
                  <strong className="text-[#001743]">
                    {adjudicateAction.decision === "buyer"
                      ? "Xử thắng cho Bên Mua (Hoàn trả tiền 100%)"
                      : adjudicateAction.decision === "seller"
                      ? "Xử thắng cho Bên Bán (Giải ngân ký quỹ)"
                      : "Hòa giải thỏa thuận đôi bên"}
                  </strong>
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#001743] mb-1">
                  Căn cứ phán quyết (Bắt buộc) <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={adjudicateReason}
                  onChange={(e) => setAdjudicateReason(e.target.value)}
                  placeholder="Nhập chi tiết điều khoản vi phạm và chứng cứ xác minh..."
                  className="w-full text-xs p-2.5 border border-[#D1D5DB] rounded-[6px] focus:border-[#001743] focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => {
                    setAdjudicateAction(null);
                    setAdjudicateReason("");
                  }}
                  className="px-3.5 py-1.5 border border-[#D1D5DB] text-xs font-semibold text-[#4B5563] rounded-[6px] hover:bg-slate-50 transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  disabled={loading || !adjudicateReason.trim()}
                  onClick={handleConfirmDecision}
                  className="px-4 py-1.5 bg-[#001743] hover:bg-[#00266B] text-white text-xs font-bold rounded-[6px] transition-colors disabled:opacity-50"
                >
                  {loading ? "Đang ghi nhận..." : "Ban hành phán quyết"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
