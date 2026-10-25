/* Hallmark · genre: modern-minimal · macrostructure: Workbench · designed-as-app */
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  Download,
  Eye,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import type { SortDirection } from "@/components/admin/AdminPrimitives";
import {
  DrawerBody,
  DrawerFooter,
  DrawerSection,
  RightDrawer,
} from "@/components/ui/RightDrawer";
import { tradeService } from "@/services/tradeService";
import { SortOrder, TradeTransactionSortBy } from "@/types/common";
import type { TradeTransactionDto, TradeTransactionStatus } from "@/types/trade";
import { Button, DatePicker, Input, InputNumber, Select } from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import { AdminDataTable, AdminFilterBar, AdminPageHeader } from "@/components/admin/AdminDataPrimitives";

const STATUS_OPTIONS: Array<{ value: TradeTransactionStatus; label: string }> = [
  { value: "PendingEscrow", label: "Chờ ký quỹ" },
  { value: "PendingSignature", label: "Chờ ký hợp đồng" },
  { value: "PendingTransfer", label: "Đang sang tên" },
  { value: "Completed", label: "Hoàn tất" },
  { value: "Disputed", label: "Tranh chấp" },
  { value: "Cancelled_EscrowTimeout", label: "Hủy do quá hạn ký quỹ" },
  { value: "Cancelled_SigningTimeout", label: "Hủy do quá hạn ký" },
  { value: "Cancelled_TransferTimeout", label: "Hủy do quá hạn sang tên" },
  { value: "Cancelled_ByAdmin", label: "Admin đã hủy" },
];

const formatVND = (value: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);

const formatPhone = (phone: string) => {
  const value = (phone || "").replace(/\D/g, "");
  return value.length === 10
    ? `${value.slice(0, 4)} ${value.slice(4, 7)} ${value.slice(7)}`
    : phone || "—";
};

const formatDateTime = (value?: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString("vi-VN", { hour12: false });
};

function getStatusMeta(status: TradeTransactionStatus) {
  if (status === "Completed") {
    return { label: "Hoàn tất", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" };
  }
  if (status === "Disputed") {
    return { label: "Tranh chấp", cls: "bg-rose-50 text-rose-700 border-rose-200" };
  }
  if (String(status).startsWith("Cancelled")) {
    return { label: "Đã hủy", cls: "bg-slate-100 text-slate-700 border-slate-200" };
  }
  if (status === "PendingSignature") {
    return { label: "Chờ ký hợp đồng", cls: "bg-violet-50 text-violet-700 border-violet-200" };
  }
  if (status === "PendingTransfer") {
    return { label: "Đang sang tên", cls: "bg-blue-50 text-blue-700 border-blue-200" };
  }
  return { label: "Chờ ký quỹ", cls: "bg-amber-50 text-amber-800 border-amber-200" };
}

function getPipelineStep(status: TradeTransactionStatus) {
  if (status === "PendingEscrow") return 1;
  if (status === "PendingSignature") return 2;
  if (status === "PendingTransfer" || status === "Disputed") return 3;
  return 5;
}

function getDeadline(trade: TradeTransactionDto) {
  if (trade.status === "PendingEscrow") return trade.escrowDeadline;
  if (trade.status === "PendingSignature") return trade.signingDeadline;
  if (trade.status === "PendingTransfer" || trade.status === "Disputed") {
    return trade.transferDeadline;
  }
  return trade.completedAt || trade.liquidationDeadline;
}

const PIPELINE = [
  "Ký quỹ giao dịch",
  "Ký hợp đồng điện tử",
  "Sang tên thuê bao",
  "Nghiệm thu bàn giao",
  "Giải ngân & hoàn tất",
];

export default function AdminEscrowTab() {
  const [trades, setTrades] = useState<TradeTransactionDto[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState("");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [sortBy, setSortBy] = useState<TradeTransactionSortBy>(TradeTransactionSortBy.CreatedDate);
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [pageIndex, setPageIndex] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedTrade, setSelectedTrade] = useState<TradeTransactionDto | null>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPageIndex(1);
    }, 350);
    return () => window.clearTimeout(timer);
  }, [search]);

  const currentFilter = useMemo(
    () => ({
      keyword: debouncedSearch || undefined,
      status: status || undefined,
      minAmount: minAmount ? Number(minAmount) : undefined,
      maxAmount: maxAmount ? Number(maxAmount) : undefined,
      fromDate: fromDate || undefined,
      toDate: toDate || undefined,
      sortBy,
      sortOrder: sortDirection === "asc" ? SortOrder.Asc : SortOrder.Desc,
      pageIndex,
      pageSize,
    }),
    [debouncedSearch, status, minAmount, maxAmount, fromDate, toDate, sortBy, sortDirection, pageIndex, pageSize]
  );

  const fetchTrades = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await tradeService.adminGetAllTrades(currentFilter);
      setTrades(result.items || []);
      setTotalCount(result.totalCount || 0);
    } catch (fetchError) {
      setTrades([]);
      setTotalCount(0);
      setError(fetchError instanceof Error ? fetchError.message : "Không thể tải giao dịch ký quỹ.");
    } finally {
      setLoading(false);
    }
  }, [currentFilter]);

  useEffect(() => {
    fetchTrades();
  }, [fetchTrades]);

  const resetFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setStatus("");
    setMinAmount("");
    setMaxAmount("");
    setFromDate("");
    setToDate("");
    setPageIndex(1);
  };

  const changeSort = (next: TradeTransactionSortBy) => {
    setSortDirection((current) => (sortBy === next && current === "asc" ? "desc" : "asc"));
    setSortBy(next);
    setPageIndex(1);
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const blob = await tradeService.adminExportTrades({ ...currentFilter, pageIndex: 1 });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `TrustSim_GiaoDich_${new Date().toISOString().slice(0, 10)}.xlsx`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (exportError) {
      setError(exportError instanceof Error ? exportError.message : "Không thể xuất dữ liệu.");
    } finally {
      setExporting(false);
    }
  };

  const pageAmount = trades.reduce((sum, trade) => sum + Number(trade.escrowAmount || 0), 0);
  const activeCount = trades.filter((trade) =>
    ["PendingEscrow", "PendingSignature", "PendingTransfer"].includes(trade.status)
  ).length;
  const disputedCount = trades.filter((trade) => trade.status === "Disputed").length;
  const hasFilters = Boolean(search || status || minAmount || maxAmount || fromDate || toDate);
  const tradeColumns = useMemo<ColumnsType<TradeTransactionDto>>(() => [
    {
      title: "Giao dịch / SIM",
      dataIndex: "tradeTransactionCode",
      key: TradeTransactionSortBy.TradeTransactionCode,
      sorter: true,
      sortOrder: sortBy === TradeTransactionSortBy.TradeTransactionCode ? (sortDirection === "asc" ? "ascend" : "descend") : null,
      render: (value: string, trade) => <div><div className="font-mono text-sm font-bold text-[#001743]">{formatPhone(trade.simPhoneNumber)}</div><div className="mt-0.5 font-mono text-[10px] text-slate-400">{value}</div></div>,
    },
    {
      title: "Người mua → người bán",
      key: "parties",
      render: (_, trade) => <div><div className="font-medium text-slate-800">{trade.buyerName || trade.buyerId}</div><div className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-400"><ArrowRight size={10} />{trade.sellerName || trade.sellerId}</div></div>,
    },
    {
      title: "Giá trị ký quỹ",
      dataIndex: "escrowAmount",
      key: TradeTransactionSortBy.EscrowAmount,
      sorter: true,
      align: "right",
      sortOrder: sortBy === TradeTransactionSortBy.EscrowAmount ? (sortDirection === "asc" ? "ascend" : "descend") : null,
      render: (value: number) => <span className="font-mono text-sm font-bold text-[#001743]">{formatVND(Number(value))}</span>,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: TradeTransactionSortBy.Status,
      sorter: true,
      align: "center",
      sortOrder: sortBy === TradeTransactionSortBy.Status ? (sortDirection === "asc" ? "ascend" : "descend") : null,
      render: (value: TradeTransactionStatus) => {
        const meta = getStatusMeta(value);
        const step = getPipelineStep(value);
        return <div><span className={`inline-flex rounded border px-2 py-0.5 text-[10px] font-bold ${meta.cls}`}>{meta.label}</span><div className="mx-auto mt-2 flex w-20 gap-1">{[1,2,3,4,5].map((item) => <span key={item} className={`h-1 flex-1 rounded-full ${item <= step ? (value === "Disputed" ? "bg-rose-500" : "bg-emerald-500") : "bg-slate-200"}`} />)}</div></div>;
      },
    },
    {
      title: "Hạn xử lý",
      key: "deadline",
      render: (_, trade) => <span className="whitespace-nowrap text-[11px] text-slate-500">{formatDateTime(getDeadline(trade))}</span>,
    },
    {
      title: "Thao tác",
      key: "actions",
      fixed: "right",
      align: "right",
      width: 92,
      render: (_, trade) => <Button size="small" icon={<Eye size={13} />} onClick={(event) => { event.stopPropagation(); setSelectedTrade(trade); }}>Xem</Button>,
    },
  ], [sortBy, sortDirection]);

  return (
    <div className="admin-tab admin-tab-escrow space-y-4">
      <AdminPageHeader
        title="Quản lý giao dịch ký quỹ"
        description="Theo dõi tiền ký quỹ và toàn bộ vòng đời chuyển nhượng SIM từ dữ liệu vận hành thực tế."
        badge={`${totalCount.toLocaleString("vi-VN")} giao dịch`}
        actions={<><Button icon={<Download size={14} />} loading={exporting} onClick={handleExport}>Xuất Excel</Button><Button aria-label="Làm mới dữ liệu" icon={<RefreshCw size={14} />} loading={loading} onClick={fetchTrades} /></>}
      />

      <section className="grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-[#e4e7ec] bg-[#e4e7ec] sm:grid-cols-3">
        {[
          { label: "Giá trị trên trang", value: formatVND(pageAmount), icon: ShieldCheck, tone: "text-[#001743]" },
          { label: "Đang xử lý trên trang", value: `${activeCount} giao dịch`, icon: Clock3, tone: "text-amber-700" },
          { label: "Tranh chấp trên trang", value: `${disputedCount} giao dịch`, icon: AlertTriangle, tone: "text-rose-700" },
        ].map((item) => (
          <div key={item.label} className="flex items-center justify-between bg-white px-4 py-3.5">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{item.label}</p>
              <p className={`mt-1 text-sm font-bold tabular-nums ${item.tone}`}>{item.value}</p>
            </div>
            <item.icon size={18} className={item.tone} />
          </div>
        ))}
      </section>

      <AdminFilterBar>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-12">
          <label className="admin-filter-field sm:col-span-2 xl:col-span-3"><span>Tìm kiếm</span><Input.Search value={search} onChange={(event) => setSearch(event.target.value)} allowClear placeholder="Mã giao dịch, số SIM, người mua/bán…" /></label>
          <label className="admin-filter-field xl:col-span-3"><span>Trạng thái</span><Select value={status || undefined} onChange={(value) => { setStatus(value || ""); setPageIndex(1); }} allowClear placeholder="Tất cả trạng thái" options={STATUS_OPTIONS} /></label>
          <label className="admin-filter-field xl:col-span-2"><span>Giá trị từ</span><InputNumber min={0} value={minAmount ? Number(minAmount) : null} onChange={(value) => { setMinAmount(value == null ? "" : String(value)); setPageIndex(1); }} controls={false} className="w-full" /></label>
          <label className="admin-filter-field xl:col-span-2"><span>Giá trị đến</span><InputNumber min={0} value={maxAmount ? Number(maxAmount) : null} onChange={(value) => { setMaxAmount(value == null ? "" : String(value)); setPageIndex(1); }} controls={false} className="w-full" /></label>
          <div className="self-end xl:col-span-2"><Button block disabled={!hasFilters} onClick={resetFilters}>Xóa lọc</Button></div>
          <label className="admin-filter-field sm:col-span-2 xl:col-span-4"><span>Khoảng thời gian</span><DatePicker.RangePicker value={fromDate || toDate ? [fromDate ? dayjs(fromDate) : null, toDate ? dayjs(toDate) : null] : null} onChange={(_, values) => { setFromDate(values[0]); setToDate(values[1]); setPageIndex(1); }} format="DD/MM/YYYY" className="w-full" /></label>
        </div>
      </AdminFilterBar>

      {error ? <div className="flex items-center justify-between gap-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700"><span className="flex items-center gap-2"><AlertTriangle size={14} />{error}</span><Button size="small" danger onClick={fetchTrades}>Thử lại</Button></div> : null}

      <AdminDataTable<TradeTransactionDto>
        rowKey="id"
        columns={tradeColumns}
        dataSource={trades}
        loading={loading}
        rowClassName={(trade) => trade.status === "Disputed" ? "admin-row-danger" : ""}
        onRow={(trade) => ({ onClick: () => setSelectedTrade(trade), style: { cursor: "pointer" } })}
        onChange={(_, __, sorter) => {
          const activeSorter = Array.isArray(sorter) ? sorter[0] : sorter;
          if (activeSorter.columnKey) {
            changeSort(Number(activeSorter.columnKey) as TradeTransactionSortBy);
          }
        }}
        pagination={{
          current: pageIndex,
          pageSize,
          total: totalCount,
          pageSizeOptions: [10, 20, 50],
          onChange: (page, size) => {
            setPageIndex(size !== pageSize ? 1 : page);
            setPageSize(size);
          },
        }}
        locale={{ emptyText: <div className="py-10"><ShieldCheck size={30} className="mx-auto mb-2 text-slate-300" /><div className="text-xs font-semibold text-slate-700">Không có giao dịch phù hợp</div><div className="mt-1 text-[11px] text-slate-400">Thử thay đổi hoặc xóa bộ lọc hiện tại.</div></div> }}
      />

      <RightDrawer open={Boolean(selectedTrade)} onClose={() => setSelectedTrade(null)} title="Chi tiết giao dịch ký quỹ" badge={selectedTrade?.tradeTransactionCode} badgeCls="bg-[#001743] text-white" size="lg">
        {selectedTrade && <>
          <DrawerBody>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4"><p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Giá trị ký quỹ</p><p className="mt-1 font-mono text-xl font-bold text-[#001743]">{formatVND(Number(selectedTrade.escrowAmount))}</p><span className={`mt-3 inline-flex rounded border px-2 py-0.5 text-[10px] font-bold ${getStatusMeta(selectedTrade.status).cls}`}>{getStatusMeta(selectedTrade.status).label}</span></div>
            <DrawerSection title="Các bên tham gia"><div className="grid gap-3 sm:grid-cols-2"><div className="rounded-lg border border-slate-200 p-3"><p className="text-[10px] font-semibold uppercase text-slate-400">Người mua</p><p className="mt-1 text-xs font-bold text-[#001743]">{selectedTrade.buyerName || "Chưa có tên hiển thị"}</p><p className="mt-1 break-all font-mono text-[10px] text-slate-400">{selectedTrade.buyerId}</p></div><div className="rounded-lg border border-slate-200 p-3"><p className="text-[10px] font-semibold uppercase text-slate-400">Người bán</p><p className="mt-1 text-xs font-bold text-[#001743]">{selectedTrade.sellerName || "Chưa có tên hiển thị"}</p><p className="mt-1 break-all font-mono text-[10px] text-slate-400">{selectedTrade.sellerId}</p></div></div></DrawerSection>
            <DrawerSection title="Tiến độ nghiệp vụ"><div className="space-y-2">{PIPELINE.map((label, index) => { const itemStep = index + 1; const currentStep = getPipelineStep(selectedTrade.status); const done = itemStep <= currentStep; return <div key={label} className={`flex items-center gap-3 rounded-lg border p-3 ${done ? "border-emerald-200 bg-emerald-50/40" : "border-slate-200"}`}><span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${done ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-400"}`}>{done ? <CheckCircle2 size={13} /> : itemStep}</span><span className={`text-xs font-semibold ${done ? "text-slate-800" : "text-slate-400"}`}>{label}</span></div>; })}</div></DrawerSection>
            <DrawerSection title="Mốc thời gian"><dl className="grid grid-cols-[150px_1fr] gap-x-3 gap-y-2 text-xs"><dt className="text-slate-500">Khởi tạo</dt><dd className="font-medium text-slate-800">{formatDateTime(selectedTrade.createdDate)}</dd><dt className="text-slate-500">Hạn ký quỹ</dt><dd>{formatDateTime(selectedTrade.escrowDeadline)}</dd><dt className="text-slate-500">Hạn ký hợp đồng</dt><dd>{formatDateTime(selectedTrade.signingDeadline)}</dd><dt className="text-slate-500">Hạn sang tên</dt><dd>{formatDateTime(selectedTrade.transferDeadline)}</dd><dt className="text-slate-500">Hoàn tất</dt><dd>{formatDateTime(selectedTrade.completedAt)}</dd></dl></DrawerSection>
            {selectedTrade.cancelledReason && <div className="flex gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700"><AlertTriangle size={15} className="shrink-0" />{selectedTrade.cancelledReason}</div>}
          </DrawerBody>
          <DrawerFooter><button type="button" onClick={() => setSelectedTrade(null)} className="rounded-md border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">Đóng</button></DrawerFooter>
        </>}
      </RightDrawer>
    </div>
  );
}
