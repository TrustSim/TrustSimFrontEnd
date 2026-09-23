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
  ShieldCheck,
  RotateCcw,
  DollarSign,
  User,
  Phone,
  Calendar,
  Layers,
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
import { AdminSortButton, toggleSort, type SortDirection } from "@/components/admin/AdminPrimitives";

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

export type EscrowStatus = "Held" | "Released" | "Disputed" | "Refunded";

export interface EscrowTransaction {
  id: string;
  orderCode: string;
  sim: string;
  buyer: string;
  seller: string;
  amount: number;
  fee: number;
  status: EscrowStatus;
  time: string;
  deadline: string;
  pipelineStep: number; // 1 to 5
  conditionsMet: boolean;
  missingReason: string;
}

const INITIAL_TRANSACTIONS: EscrowTransaction[] = [
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
    pipelineStep: 4,
    conditionsMet: false,
    missingReason: "Chờ người mua xác nhận đã nhận bàn giao SIM vật lý",
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
  {
    id: "TX-905",
    orderCode: "ORD-8805",
    sim: "0777777777",
    buyer: "Vũ Đình Trọng",
    seller: "SimSoVip_HN",
    amount: 420000000,
    fee: 12600000,
    status: "Held",
    time: "12/09/2026 08:00",
    deadline: "14/09/2026 08:00 (Còn 36h)",
    pipelineStep: 2,
    conditionsMet: false,
    missingReason: "Người bán đang lập thủ tục cấp mã ủy quyền chuyển mạng/sang tên",
  },
];

const PIPELINE_STEPS = [
  { step: 1, name: "Đặt cọc & Nạp ký quỹ 100%", desc: "Người mua đã chuyển tiền vào tài khoản Escrow TrustSim" },
  { step: 2, name: "Xác nhận & Khóa cọc người bán", desc: "Bên bán đồng ý chuyển giao và ký quỹ bảo đảm" },
  { step: 3, name: "Bàn giao SIM & Mã ủy quyền", desc: "Hai bên thực hiện thủ tục sang tên tại điểm giao dịch nhà mạng" },
  { step: 4, name: "Đối soát thông tin chính chủ", desc: "Kiểm tra SIM đã đứng tên người mua trên hệ thống viễn thông" },
  { step: 5, name: "Giải ngân & Quyết toán", desc: "Sàn giải ngân tiền cho người bán sau khi trừ 3% phí dịch vụ" },
];

const ESCROW_EXPORT_COLUMNS: ExcelColumnDef<EscrowTransaction>[] = [
  { header: "Mã giao dịch", key: "id", width: 14 },
  { header: "Mã đơn hàng", key: "orderCode", width: 14 },
  { header: "Số SIM", key: "sim", width: 16, formatter: (v) => formatPhone(String(v)) },
  { header: "Người mua", key: "buyer", width: 20 },
  { header: "Người bán", key: "seller", width: 20 },
  { header: "Giá trị ký quỹ (VNĐ)", key: "amount", width: 22, formatter: (v) => formatVND(Number(v)) },
  { header: "Phí sàn (3%)", key: "fee", width: 18, formatter: (v) => formatVND(Number(v)) },
  {
    header: "Trạng thái",
    key: "status",
    width: 18,
    formatter: (v) =>
      v === "Held"
        ? "Đang giữ ký quỹ"
        : v === "Released"
        ? "Đã giải ngân"
        : v === "Disputed"
        ? "Đang tranh chấp"
        : "Đã hoàn tiền",
  },
  { header: "Thời gian", key: "time", width: 20 },
  { header: "Hạn xử lý", key: "deadline", width: 30 },
];

export default function AdminEscrowTab() {
  const [transactions, setTransactions] = useState<EscrowTransaction[]>(INITIAL_TRANSACTIONS);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [pageIndex, setPageIndex] = useState(1);
  const pageSize = 10;
  const [sortKey, setSortKey] = useState<"order" | "amount" | "deadline">("order");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  // Drawer detail state
  const [selectedTx, setSelectedTx] = useState<EscrowTransaction | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Active action menu row id
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  // Confirm Modal state for manual release / refund
  const [confirmAction, setConfirmAction] = useState<{
    tx: EscrowTransaction;
    type: "release" | "refund";
  } | null>(null);
  const [actionReason, setActionReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
  };

  // KPIs
  const heldTxs = useMemo(() => transactions.filter((t) => t.status === "Held"), [transactions]);
  const disputedTxs = useMemo(() => transactions.filter((t) => t.status === "Disputed"), [transactions]);
  const releasedTxs = useMemo(() => transactions.filter((t) => t.status === "Released"), [transactions]);

  const heldAmount = useMemo(() => heldTxs.reduce((sum, t) => sum + t.amount, 0), [heldTxs]);
  const disputedAmount = useMemo(() => disputedTxs.reduce((sum, t) => sum + t.amount, 0), [disputedTxs]);
  const releasedAmount = useMemo(() => releasedTxs.reduce((sum, t) => sum + t.amount, 0), [releasedTxs]);
  const totalAmount = useMemo(() => transactions.reduce((sum, t) => sum + t.amount, 0), [transactions]);

  // Filtered transactions
  const filtered = useMemo(() => {
    return transactions.filter((tx) => {
      const q = search.toLowerCase().trim();
      const matchSearch =
        !q ||
        tx.orderCode.toLowerCase().includes(q) ||
        tx.id.toLowerCase().includes(q) ||
        tx.sim.includes(q) ||
        tx.buyer.toLowerCase().includes(q) ||
        tx.seller.toLowerCase().includes(q);

      const matchStatus = statusFilter === "all" || tx.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [transactions, search, statusFilter]);

  const sorted = [...filtered].sort((a, b) => {
    const left = sortKey === "order" ? a.orderCode : sortKey === "amount" ? a.amount : a.deadline;
    const right = sortKey === "order" ? b.orderCode : sortKey === "amount" ? b.amount : b.deadline;
    const result = typeof left === "number" && typeof right === "number" ? left - right : String(left).localeCompare(String(right), "vi");
    return sortDirection === "asc" ? result : -result;
  });
  const paged = sorted.slice((pageIndex - 1) * pageSize, pageIndex * pageSize);
  const changeSort = (key: "order" | "amount" | "deadline") => {
    const next = toggleSort(sortKey, sortDirection, key);
    setSortKey(next.key);
    setSortDirection(next.direction);
    setPageIndex(1);
  };

  const openDetail = (tx: EscrowTransaction) => {
    setSelectedTx(tx);
    setDrawerOpen(true);
    setMenuOpenId(null);
  };

  const handleActionConfirm = () => {
    if (!confirmAction || !actionReason.trim()) return;
    setActionLoading(true);

    setTimeout(() => {
      const { tx, type } = confirmAction;
      const newStatus: EscrowStatus = type === "release" ? "Released" : "Refunded";
      const newStep = 5;

      setTransactions((prev) =>
        prev.map((item) =>
          item.id === tx.id
            ? {
                ...item,
                status: newStatus,
                pipelineStep: newStep,
                conditionsMet: type === "release",
                deadline:
                  type === "release"
                    ? "Đã giải ngân thủ công bởi Admin"
                    : `Đã hoàn tiền cho người mua. Lý do: ${actionReason}`,
              }
            : item
        )
      );

      if (selectedTx?.id === tx.id) {
        setSelectedTx((prev) =>
          prev
            ? {
                ...prev,
                status: newStatus,
                pipelineStep: newStep,
                conditionsMet: type === "release",
                deadline:
                  type === "release"
                    ? "Đã giải ngân thủ công bởi Admin"
                    : `Đã hoàn tiền cho người mua. Lý do: ${actionReason}`,
              }
            : null
        );
      }

      showToast(
        type === "release"
          ? `Đã giải ngân thành công giao dịch ${tx.orderCode} (${formatVND(tx.amount)}).`
          : `Đã hoàn lại tiền giao dịch ${tx.orderCode} cho người mua (${formatVND(tx.amount)}).`
      );

      setActionLoading(false);
      setConfirmAction(null);
      setActionReason("");
    }, 400);
  };

  return (
    <div className="admin-tab admin-tab-escrow space-y-4">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-[80] bg-[#001743] text-white text-xs px-4 py-2.5 rounded-[6px] shadow-lg border border-slate-700 animate-fade-in flex items-center gap-2">
          <CheckCircle2 size={14} className="text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ── 1. Header Card (Matching CRUD Workspace & Admin Tabs Guidelines) ── */}
      <div className="bg-white border border-[#E2E8F0] rounded-[8px] p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-base font-bold text-[#001743]">Quản Lý Giao Dịch Ký Quỹ</h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 font-mono">
              {transactions.length} giao dịch
            </span>
          </div>
          <p className="text-xs text-[#6B7280] mt-0.5">
            Giám sát tiền ký quỹ của người mua, tiền cọc người bán và quy trình giải ngân an toàn theo từng bước.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <ImportExportBar
            data={transactions}
            columns={ESCROW_EXPORT_COLUMNS}
            filename={`TrustSim_Escrow_${new Date().toISOString().slice(0, 10)}`}
            entityName="giao dịch ký quỹ"
            showImport={false}
          />
        </div>
      </div>

      {/* ── 2. KPI Metrics Cards (Enclosed in Clean Cards) ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white border border-[#E2E8F0] rounded-[8px] p-3.5 shadow-xs">
          <span className="text-[11px] font-medium text-slate-500 block">Đang giữ ký quỹ</span>
          <div className="text-base font-bold text-amber-600 font-mono tabular-nums mt-0.5">
            {formatVND(heldAmount)}
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">{heldTxs.length} giao dịch</span>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-[8px] p-3.5 shadow-xs">
          <span className="text-[11px] font-medium text-slate-500 block">Đang tranh chấp</span>
          <div className="text-base font-bold text-[#E4011E] font-mono tabular-nums mt-0.5">
            {formatVND(disputedAmount)}
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">{disputedTxs.length} vụ khiếu nại</span>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-[8px] p-3.5 shadow-xs">
          <span className="text-[11px] font-medium text-slate-500 block">Đã giải ngân</span>
          <div className="text-base font-bold text-emerald-600 font-mono tabular-nums mt-0.5">
            {formatVND(releasedAmount)}
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">{releasedTxs.length} giao dịch</span>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-[8px] p-3.5 shadow-xs">
          <span className="text-[11px] font-medium text-slate-500 block">Tổng giá trị quản lý</span>
          <div className="text-base font-bold text-[#001743] font-mono tabular-nums mt-0.5">
            {formatVND(totalAmount)}
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">{transactions.length} giao dịch ghi nhận</span>
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
              placeholder="Tìm mã đơn, số SIM, tên người mua/bán..."
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
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPageIndex(1);
            }}
            className="text-xs py-1.5 px-3 bg-white border border-[#D1D5DB] rounded-[6px] text-slate-700 focus:border-[#001743] focus:outline-none"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="Held">Đang giữ ký quỹ</option>
            <option value="Released">Đã giải ngân</option>
            <option value="Disputed">Đang tranh chấp</option>
            <option value="Refunded">Đã hoàn tiền</option>
          </select>

          {(search || statusFilter !== "all") && (
            <button
              onClick={() => {
                setSearch("");
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
          Hiển thị <strong className="text-[#001743]">{filtered.length}</strong> giao dịch
        </div>
      </div>

      {/* ── 4. Table Card ── */}
      <div className="bg-white border border-[#E2E8F0] rounded-[8px] overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-slate-500 font-semibold uppercase text-[10px] tracking-wider h-10">
                <th className="py-3 px-4"><AdminSortButton label="Đơn hàng / SIM" active={sortKey === "order"} direction={sortDirection} onClick={() => changeSort("order")} /></th>
                <th className="py-3 px-4">Người mua – Người bán</th>
                <th className="py-3 px-4 text-right"><AdminSortButton label="Giá trị ký quỹ" align="right" active={sortKey === "amount"} direction={sortDirection} onClick={() => changeSort("amount")} /></th>
                <th className="py-3 px-4 text-center">Tiến độ</th>
                <th className="py-3 px-4 text-center">Trạng thái</th>
                <th className="py-3 px-4"><AdminSortButton label="Hạn xử lý" active={sortKey === "deadline"} direction={sortDirection} onClick={() => changeSort("deadline")} /></th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {paged.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 text-xs">
                    Không tìm thấy giao dịch ký quỹ nào phù hợp
                  </td>
                </tr>
              ) : (
                paged.map((tx) => (
                  <tr
                    key={tx.id}
                    className={`hover:bg-slate-50/80 transition-colors h-14 ${
                      tx.status === "Disputed" ? "border-l-4 border-l-[#E4011E] bg-rose-50/20" : ""
                    }`}
                  >
                    <td className="py-3 px-4">
                      <div className="font-bold text-sm text-[#001743] tabular-nums font-mono">
                        {formatPhone(tx.sim)}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        {tx.orderCode} · {tx.id}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-800">{tx.buyer}</div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <ArrowRight size={10} />
                        <span>{tx.seller}</span>
                      </div>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="font-bold text-sm text-[#001743] tabular-nums font-mono">
                        {formatVND(tx.amount)}
                      </div>
                      <div className="text-[10px] text-slate-400 tabular-nums">
                        Phí: {formatVND(tx.fee)}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {[1, 2, 3, 4, 5].map((step) => (
                          <span
                            key={step}
                            className={`h-1.5 w-3 rounded-full transition-colors ${
                              step <= tx.pipelineStep
                                ? tx.status === "Disputed"
                                  ? "bg-[#E4011E]"
                                  : "bg-emerald-500"
                                : "bg-slate-200"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        Bước {tx.pipelineStep}/5
                      </span>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-[4px] text-[10px] font-bold ${
                          tx.status === "Held"
                            ? "bg-amber-50 text-amber-800 border border-amber-200"
                            : tx.status === "Released"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : tx.status === "Disputed"
                            ? "bg-rose-50 text-rose-700 border border-rose-200"
                            : "bg-slate-100 text-slate-700 border border-slate-200"
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

                    <td className="py-3 px-4 text-[#6B7280] text-[11px] max-w-[180px] truncate">
                      {tx.deadline}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="relative inline-flex items-center justify-end gap-1">
                        <button
                          onClick={() => openDetail(tx)}
                          className="p-1.5 text-slate-500 hover:text-[#001743] hover:bg-slate-100 rounded-[4px] transition-colors"
                          title="Xem tiến độ & chi tiết"
                        >
                          <Eye size={15} strokeWidth={1.75} />
                        </button>

                        <button
                          onClick={() => setMenuOpenId(menuOpenId === tx.id ? null : tx.id)}
                          className="p-1.5 text-slate-500 hover:text-[#001743] hover:bg-slate-100 rounded-[4px] transition-colors"
                          title="Thao tác"
                        >
                          <MoreVertical size={15} strokeWidth={1.75} />
                        </button>

                        {/* Dropdown Menu */}
                        {menuOpenId === tx.id && (
                          <div className="absolute right-0 top-8 z-30 w-44 bg-white border border-[#E2E8F0] rounded-[6px] shadow-lg py-1 animate-fade-in text-left">
                            <button
                              onClick={() => openDetail(tx)}
                              className="w-full px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                            >
                              <Layers size={13} className="text-slate-400" />
                              <span>Tiến độ 5 bước</span>
                            </button>

                            {tx.status === "Held" && (
                              <button
                                onClick={() => {
                                  setMenuOpenId(null);
                                  setConfirmAction({ tx, type: "release" });
                                }}
                                className="w-full px-3 py-1.5 text-xs text-emerald-700 hover:bg-emerald-50 flex items-center gap-2"
                              >
                                <ShieldCheck size={13} className="text-emerald-600" />
                                <span>Giải ngân ngay</span>
                              </button>
                            )}

                            {(tx.status === "Held" || tx.status === "Disputed") && (
                              <button
                                onClick={() => {
                                  setMenuOpenId(null);
                                  setConfirmAction({ tx, type: "refund" });
                                }}
                                className="w-full px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                              >
                                <RotateCcw size={13} className="text-rose-500" />
                                <span>Hoàn tiền cho mua</span>
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── 5. RightDrawer: Pipeline & Escrow Detail ── */}
      <RightDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={selectedTx ? `Giao dịch ký quỹ: ${formatPhone(selectedTx.sim)}` : "Chi tiết ký quỹ"}
        badge={selectedTx ? selectedTx.orderCode : ""}
        badgeCls="bg-[#001743] text-white"
        size="lg"
      >
        {selectedTx && (
          <>
            <DrawerBody>
              {/* Financial Snapshot */}
              <div className="bg-slate-50 p-3.5 rounded-[8px] border border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Giá trị ký quỹ:</span>
                  <span className="font-bold text-[#001743] text-sm tabular-nums font-mono">
                    {formatVND(selectedTx.amount)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Phí dịch vụ sàn (3%):</span>
                  <span className="font-bold text-emerald-700 tabular-nums">
                    +{formatVND(selectedTx.fee)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200">
                  <span className="text-slate-600 font-medium">Bên bán thực nhận:</span>
                  <span className="font-extrabold text-[#001743] tabular-nums font-mono">
                    {formatVND(selectedTx.amount - selectedTx.fee)}
                  </span>
                </div>
              </div>

              {/* Stakeholders Section */}
              <DrawerSection title="Các bên tham gia giao dịch">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-white border border-slate-200 rounded-[6px]">
                    <span className="text-[10px] text-slate-400 block uppercase font-semibold">Người mua</span>
                    <span className="font-bold text-[#001743] mt-0.5 block">{selectedTx.buyer}</span>
                    <span className="text-[11px] text-slate-500 mt-1 block">Đã nạp 100% tiền ký quỹ</span>
                  </div>
                  <div className="p-3 bg-white border border-slate-200 rounded-[6px]">
                    <span className="text-[10px] text-slate-400 block uppercase font-semibold">Người bán</span>
                    <span className="font-bold text-[#001743] mt-0.5 block">{selectedTx.seller}</span>
                    <span className="text-[11px] text-slate-500 mt-1 block">Đã khóa tiền cọc bảo đảm</span>
                  </div>
                </div>
              </DrawerSection>

              {/* Status & Warning */}
              {selectedTx.missingReason && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-[6px] text-xs flex items-start gap-2 text-amber-800">
                  <AlertTriangle size={15} className="shrink-0 mt-0.5 text-amber-600" />
                  <div>
                    <span className="font-bold">Lưu ý tiến độ: </span>
                    <span>{selectedTx.missingReason}</span>
                  </div>
                </div>
              )}

              {/* 5-Step Pipeline Timeline */}
              <DrawerSection title="Quy trình chuyển nhượng 5 bước">
                <div className="space-y-3 relative pl-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                  {PIPELINE_STEPS.map((stepItem) => {
                    const isPassed = stepItem.step <= selectedTx.pipelineStep;
                    const isCurrent = stepItem.step === selectedTx.pipelineStep;

                    return (
                      <div key={stepItem.step} className="relative">
                        {/* Dot indicator */}
                        <div
                          className={`absolute -left-6 top-0.5 w-4 h-4 rounded-full flex items-center justify-center border-2 ${
                            isPassed
                              ? selectedTx.status === "Disputed" && isCurrent
                                ? "bg-[#E4011E] border-white text-white shadow-xs"
                                : "bg-emerald-600 border-white text-white shadow-xs"
                              : "bg-white border-slate-300 text-slate-400"
                          }`}
                        >
                          {isPassed ? <CheckCircle2 size={10} strokeWidth={3} /> : <div className="w-1 h-1 rounded-full bg-slate-400" />}
                        </div>

                        <div className="bg-white border border-slate-100 rounded-[6px] p-2.5 shadow-2xs">
                          <div className="flex items-center justify-between">
                            <span
                              className={`text-xs font-bold ${
                                isCurrent
                                  ? selectedTx.status === "Disputed"
                                    ? "text-[#E4011E]"
                                    : "text-emerald-700"
                                  : isPassed
                                  ? "text-slate-800"
                                  : "text-slate-400"
                              }`}
                            >
                              Bước {stepItem.step}: {stepItem.name}
                            </span>
                            {isCurrent && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-slate-100 text-slate-700">
                                Hiện tại
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">{stepItem.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </DrawerSection>
            </DrawerBody>

            <DrawerFooter>
              <div className="flex items-center justify-between w-full">
                <BtnSecondary onClick={() => setDrawerOpen(false)}>Đóng</BtnSecondary>

                <div className="flex items-center gap-2">
                  {(selectedTx.status === "Held" || selectedTx.status === "Disputed") && (
                    <button
                      type="button"
                      onClick={() => setConfirmAction({ tx: selectedTx, type: "refund" })}
                      className="px-3.5 py-1.5 border border-rose-200 hover:bg-rose-50 text-rose-600 text-xs font-semibold rounded-[6px] transition-colors"
                    >
                      Hoàn tiền người mua
                    </button>
                  )}

                  {selectedTx.status === "Held" && (
                    <BtnPrimary
                      type="button"
                      onClick={() => setConfirmAction({ tx: selectedTx, type: "release" })}
                    >
                      Giải ngân cho người bán
                    </BtnPrimary>
                  )}
                </div>
              </div>
            </DrawerFooter>
          </>
        )}
      </RightDrawer>

      {/* ── 6. Confirm Modal with Mandatory Reason ── */}
      {confirmAction && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white border border-[#E2E8F0] rounded-[8px] w-full max-w-md shadow-xl p-5 animate-fade-up">
            <div className="flex items-start gap-3 mb-3">
              <div
                className={`p-2 rounded-lg shrink-0 ${
                  confirmAction.type === "release"
                    ? "bg-emerald-50 text-emerald-600"
                    : "bg-rose-50 text-rose-600"
                }`}
              >
                {confirmAction.type === "release" ? (
                  <ShieldCheck size={20} strokeWidth={2} />
                ) : (
                  <AlertTriangle size={20} strokeWidth={2} />
                )}
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#001743]">
                  {confirmAction.type === "release"
                    ? "Xác nhận giải ngân tiền ký quỹ"
                    : "Xác nhận hoàn tiền cho người mua"}
                </h3>
                <p className="text-xs text-[#6B7280] mt-1 leading-relaxed">
                  Đơn hàng: <strong className="font-mono">{confirmAction.tx.orderCode}</strong> (SIM{" "}
                  {formatPhone(confirmAction.tx.sim)}) — Số tiền:{" "}
                  <strong className="text-[#001743]">{formatVND(confirmAction.tx.amount)}</strong>
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#001743] mb-1">
                  Lý do phê duyệt giải ngân / hoàn trả <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  placeholder="Nhập căn cứ xử lý (VD: Đã kiểm tra biên bản bàn giao viễn thông thành công...)"
                  className="w-full text-xs p-2.5 border border-[#D1D5DB] rounded-[6px] focus:border-[#001743] focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => {
                    setConfirmAction(null);
                    setActionReason("");
                  }}
                  className="px-3.5 py-1.5 border border-[#D1D5DB] text-xs font-semibold text-[#4B5563] rounded-[6px] hover:bg-slate-50 transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  disabled={actionLoading || !actionReason.trim()}
                  onClick={handleActionConfirm}
                  className={`px-4 py-1.5 text-white text-xs font-bold rounded-[6px] transition-colors disabled:opacity-50 ${
                    confirmAction.type === "release"
                      ? "bg-emerald-600 hover:bg-emerald-700"
                      : "bg-rose-600 hover:bg-rose-700"
                  }`}
                >
                  {actionLoading
                    ? "Đang xử lý..."
                    : confirmAction.type === "release"
                    ? "Xác nhận giải ngân"
                    : "Xác nhận hoàn tiền"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
