/* Hallmark · genre: modern-minimal · macrostructure: Workbench · design-system: design.md · designed-as-app */
"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  RefreshCw,
  Eye,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Scale,
  Download,
  Loader2,
  FileText,
  User,
  Phone,
  ShieldAlert,
  ArrowRight,
} from "lucide-react";
import {
  RightDrawer,
  DrawerBody,
  DrawerFooter,
  DrawerSection,
  BtnSecondary,
} from "@/components/ui/RightDrawer";
import { disputeService } from "@/services/disputeService";
import { tradeService } from "@/services/tradeService";
import type { DisputeTicketDto, DisputeStatus } from "@/types/dispute";
import type { TradeTransactionDto } from "@/types/trade";
import { disputeValidators } from "@/utils/validators";
import { DisputeTicketSortBy, SortOrder } from "@/types/common";
import { Button, DatePicker, Input, Select } from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import { AdminDataTable, AdminFilterBar, AdminPageHeader } from "@/components/admin/AdminDataPrimitives";

// Helper định dạng tiền tệ VNĐ
const formatVND = (value: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(value);

// Helper định dạng số điện thoại đẹp
const formatPhone = (phone?: string) => {
  if (!phone) return "—";
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`;
  }
  return phone;
};

// Helper nhãn trạng thái khiếu nại tiếng Việt
const getStatusBadge = (status: DisputeStatus) => {
  switch (status) {
    case "OPEN":
      return {
        label: "Chờ tiếp nhận",
        bg: "bg-amber-50 text-amber-800 border-amber-200",
        dot: "bg-amber-500",
      };
    case "INVESTIGATING":
      return {
        label: "Đang xem xét",
        bg: "bg-blue-50 text-blue-800 border-blue-200",
        dot: "bg-blue-500",
      };
    case "RESOLVED_FAVOR_BUYER":
      return {
        label: "Bên Mua thắng",
        bg: "bg-emerald-50 text-emerald-800 border-emerald-200",
        dot: "bg-emerald-500",
      };
    case "RESOLVED_FAVOR_SELLER":
      return {
        label: "Bên Bán thắng",
        bg: "bg-indigo-50 text-indigo-800 border-indigo-200",
        dot: "bg-indigo-500",
      };
    default:
      return {
        label: status || "Không xác định",
        bg: "bg-slate-100 text-slate-700 border-slate-200",
        dot: "bg-slate-400",
      };
  }
};

export default function AdminDisputesTab() {
  const [disputes, setDisputes] = useState<DisputeTicketDto[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [tradeId, setTradeId] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [sortBy, setSortBy] = useState<DisputeTicketSortBy>(DisputeTicketSortBy.CreatedDate);
  const [pageIndex, setPageIndex] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  // Drawer state
  const [selectedDispute, setSelectedDispute] = useState<DisputeTicketDto | null>(null);
  const [relatedTrade, setRelatedTrade] = useState<TradeTransactionDto | null>(null);
  const [loadingTrade, setLoadingTrade] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Adjudicate Modal State
  const [adjudicateAction, setAdjudicateAction] = useState<{
    dispute: DisputeTicketDto;
    decision: "RESOLVED_FAVOR_BUYER" | "RESOLVED_FAVOR_SELLER";
  } | null>(null);
  const [adjudicateReason, setAdjudicateReason] = useState("");
  const [adjudicateSubmitting, setAdjudicateSubmitting] = useState(false);
  const [adjudicateError, setAdjudicateError] = useState<string | null>(null);

  // Export State
  const [exportLoading, setExportLoading] = useState(false);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPageIndex(1);
    }, 350);
    return () => window.clearTimeout(timer);
  }, [search]);

  // 1. Fetch live disputes from API
  const fetchDisputes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await disputeService.getDisputes({
        status: statusFilter === "all" ? undefined : statusFilter,
        keyword: debouncedSearch || undefined,
        tradeId: tradeId.trim() || undefined,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
        sortBy,
        sortOrder: SortOrder.Desc,
        pageIndex,
        pageSize,
      });
      setDisputes(res.items || []);
      setTotalCount(res.totalCount || 0);
    } catch (err: any) {
      showToast(err.message || "Không thể tải danh sách khiếu nại");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, debouncedSearch, tradeId, fromDate, toDate, sortBy, pageIndex, pageSize]);

  useEffect(() => {
    fetchDisputes();
  }, [fetchDisputes]);

  const filteredDisputes = disputes;

  // KPIs
  const openCount = useMemo(
    () => disputes.filter((d) => d.status === "OPEN" || d.status === "INVESTIGATING").length,
    [disputes]
  );
  const buyerWinsCount = useMemo(
    () => disputes.filter((d) => d.status === "RESOLVED_FAVOR_BUYER").length,
    [disputes]
  );
  const sellerWinsCount = useMemo(
    () => disputes.filter((d) => d.status === "RESOLVED_FAVOR_SELLER").length,
    [disputes]
  );

  // Open detail drawer and fetch related trade transaction
  const openDetail = async (ticket: DisputeTicketDto) => {
    setSelectedDispute(ticket);
    setRelatedTrade(null);
    setDrawerOpen(true);

    if (ticket.tradeTransactionId) {
      setLoadingTrade(true);
      try {
        const trade = await tradeService.getTradeById(ticket.tradeTransactionId);
        setRelatedTrade(trade);
      } catch {
        // Giao dịch không tồn tại hoặc người dùng không có quyền truy cập chi tiết
      } finally {
        setLoadingTrade(false);
      }
    }
  };

  // Submit resolution to backend
  const handleConfirmDecision = async () => {
    if (!adjudicateAction) return;

    // Strict frontend validation matching ResolveDisputeCommandValidator
    const valResult = disputeValidators.validateResolution(
      adjudicateAction.decision,
      adjudicateReason
    );
    if (!valResult.isValid) {
      setAdjudicateError(valResult.error || "Dữ liệu phán quyết không hợp lệ");
      return;
    }

    setAdjudicateSubmitting(true);
    setAdjudicateError(null);

    try {
      await disputeService.resolveDispute(adjudicateAction.dispute.id, {
        resolutionStatus: adjudicateAction.decision,
        resolutionNotes: adjudicateReason.trim(),
      });

      showToast("Đã ban hành phán quyết khiếu nại thành công.");
      setAdjudicateAction(null);
      setAdjudicateReason("");

      // Update selectedDispute locally and in list
      if (selectedDispute && selectedDispute.id === adjudicateAction.dispute.id) {
        setSelectedDispute({
          ...selectedDispute,
          status: adjudicateAction.decision,
          adminResolutionNotes: adjudicateReason.trim(),
        });
      }

      fetchDisputes();
    } catch (err: any) {
      setAdjudicateError(err.message || "Ban hành phán quyết thất bại.");
    } finally {
      setAdjudicateSubmitting(false);
    }
  };

  // Export disputes to Excel using backend endpoint
  const handleExport = async () => {
    setExportLoading(true);
    try {
      const blob = await disputeService.exportDisputes({
        keyword: debouncedSearch || undefined,
        tradeId: tradeId.trim() || undefined,
        status: statusFilter === "all" ? undefined : statusFilter,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
        sortBy,
        sortOrder: SortOrder.Desc,
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `TrustSim_KhieuNai_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      showToast("Tải báo cáo khiếu nại thành công.");
    } catch (err: any) {
      showToast(err.message || "Xuất file khiếu nại thất bại.");
    } finally {
      setExportLoading(false);
    }
  };

  const disputeColumns: ColumnsType<DisputeTicketDto> = [
    { title: "Mã khiếu nại", dataIndex: "id", key: "id", render: (value: string) => <div><div className="font-mono font-bold text-[#001743]">#{value.slice(0, 8)}</div><div className="font-mono text-[10px] text-slate-400">{value.slice(8, 18)}…</div></div> },
    { title: "Giao dịch liên quan", dataIndex: "tradeTransactionId", key: "trade", render: (value?: string) => <div><div className="font-mono text-[11px] font-medium text-slate-700">{value ? `GD-${value.slice(0, 8)}` : "—"}</div><div className="text-[10px] text-slate-400">Ký quỹ chuyển nhượng</div></div> },
    { title: "Người khiếu nại", dataIndex: "complainantName", key: "complainant", render: (value: string, item) => <div><div className="font-medium text-slate-800">{value || "Người dùng ẩn danh"}</div><div className="font-mono text-[10px] text-slate-400">ID: {item.complainantId ? item.complainantId.slice(0, 8) : "—"}</div></div> },
    { title: "Nội dung", dataIndex: "reason", key: "reason", width: 280, render: (value: string) => <p className="line-clamp-2 text-xs leading-relaxed text-slate-600" title={value}>{value}</p> },
    { title: "Trạng thái", dataIndex: "status", key: "status", align: "center", render: (value: DisputeStatus) => { const badge = getStatusBadge(value); return <span className={`inline-flex items-center gap-1.5 rounded border px-2 py-0.5 text-[10px] font-bold ${badge.bg}`}><span className={`h-1.5 w-1.5 rounded-full ${badge.dot}`} />{badge.label}</span>; } },
    { title: "Ngày tạo", dataIndex: "createdDate", key: "createdDate", render: (value?: string) => <span className="whitespace-nowrap font-mono text-[11px] text-slate-600">{value ? new Date(value).toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—"}</span> },
    { title: "Thao tác", key: "actions", align: "right", fixed: "right", width: 116, render: (_, item) => { const pending = item.status === "OPEN" || item.status === "INVESTIGATING"; return <Button size="small" icon={<Eye size={13} />} onClick={() => openDetail(item)}>{pending ? "Thẩm định" : "Chi tiết"}</Button>; } },
  ];

  return (
    <div className="admin-tab admin-tab-disputes space-y-4">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-[#001743] text-white text-xs px-4 py-2.5 rounded-xl shadow-lg border border-slate-700 animate-fade-in flex items-center gap-2">
          <CheckCircle2 size={14} className="text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      <AdminPageHeader
        title="Giải quyết khiếu nại & trọng tài"
        description="Xem xét khiếu nại giữa các bên giao dịch, ban hành phán quyết trọng tài và đảm bảo quyền lợi người dùng sàn."
        badge={`${totalCount.toLocaleString("vi-VN")} hồ sơ`}
        actions={<><Button icon={<RefreshCw size={13} />} loading={loading} onClick={() => fetchDisputes()}>Làm mới</Button><Button type="primary" icon={<Download size={13} />} loading={exportLoading} onClick={handleExport}>Xuất Excel</Button></>}
      />

      {/* ── 2. KPI Metrics Grid ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white border border-[#e4e7ec] rounded-xl p-3.5 shadow-2xs">
          <span className="text-[11px] font-medium text-slate-500 block">Đang chờ xử lý</span>
          <div className="text-base font-bold text-amber-600 font-mono tabular-nums mt-0.5">
            {openCount} vụ việc
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">Hồ sơ mới &amp; đang xác minh</span>
        </div>

        <div className="bg-white border border-[#e4e7ec] rounded-xl p-3.5 shadow-2xs">
          <span className="text-[11px] font-medium text-slate-500 block">Xử Bên Mua thắng</span>
          <div className="text-base font-bold text-emerald-600 font-mono tabular-nums mt-0.5">
            {buyerWinsCount} hồ sơ
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">Đã hoàn trả 100% tiền ký quỹ</span>
        </div>

        <div className="bg-white border border-[#e4e7ec] rounded-xl p-3.5 shadow-2xs">
          <span className="text-[11px] font-medium text-slate-500 block">Xử Bên Bán thắng</span>
          <div className="text-base font-bold text-indigo-600 font-mono tabular-nums mt-0.5">
            {sellerWinsCount} hồ sơ
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">Đã giải ngân cho người bán</span>
        </div>

        <div className="bg-white border border-[#e4e7ec] rounded-xl p-3.5 shadow-2xs">
          <span className="text-[11px] font-medium text-slate-500 block">Tổng số khiếu nại</span>
          <div className="text-base font-bold text-[#001743] font-mono tabular-nums mt-0.5">
            {totalCount} hồ sơ
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">Toàn bộ hồ sơ trên hệ thống</span>
        </div>
      </div>

      <AdminFilterBar>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-12">
          <label className="admin-filter-field sm:col-span-2 xl:col-span-3"><span>Tìm kiếm</span><Input.Search value={search} onChange={(event) => setSearch(event.target.value)} allowClear placeholder="Mã khiếu nại, người gửi, lý do…" /></label>
          <label className="admin-filter-field xl:col-span-3"><span>Trạng thái</span><Select value={statusFilter === "all" ? undefined : statusFilter} onChange={(value) => { setStatusFilter(value || "all"); setPageIndex(1); }} allowClear placeholder="Tất cả trạng thái" options={[{ value: "OPEN", label: "Chờ tiếp nhận" }, { value: "INVESTIGATING", label: "Đang xem xét" }, { value: "RESOLVED_FAVOR_BUYER", label: "Bên mua thắng" }, { value: "RESOLVED_FAVOR_SELLER", label: "Bên bán thắng" }]} /></label>
          <label className="admin-filter-field xl:col-span-3"><span>Giao dịch</span><Input value={tradeId} onChange={(event) => { setTradeId(event.target.value); setPageIndex(1); }} allowClear placeholder="Trade ID (UUID)" /></label>
          <label className="admin-filter-field xl:col-span-3"><span>Sắp xếp</span><Select value={sortBy} onChange={(value) => { setSortBy(value); setPageIndex(1); }} options={[{ value: DisputeTicketSortBy.CreatedDate, label: "Mới nhất" }, { value: DisputeTicketSortBy.Status, label: "Theo trạng thái" }, { value: DisputeTicketSortBy.TradeTransactionId, label: "Theo giao dịch" }]} /></label>
          <label className="admin-filter-field sm:col-span-2 xl:col-span-6"><span>Khoảng thời gian</span><DatePicker.RangePicker value={fromDate || toDate ? [fromDate ? dayjs(fromDate) : null, toDate ? dayjs(toDate) : null] : null} onChange={(_, values) => { setFromDate(values[0]); setToDate(values[1]); setPageIndex(1); }} format="DD/MM/YYYY" className="w-full" /></label>
          <div className="self-end sm:col-span-2 xl:col-span-3"><Button block onClick={() => { setSearch(""); setStatusFilter("all"); setTradeId(""); setFromDate(""); setToDate(""); setSortBy(DisputeTicketSortBy.CreatedDate); setPageIndex(1); }}>Xóa lọc</Button></div>
        </div>
      </AdminFilterBar>

      <AdminDataTable<DisputeTicketDto>
        rowKey="id"
        columns={disputeColumns}
        dataSource={filteredDisputes}
        loading={loading}
        rowClassName={(item) => item.status === "OPEN" || item.status === "INVESTIGATING" ? "admin-row-warning" : ""}
        pagination={{
          current: pageIndex,
          pageSize,
          total: totalCount,
          pageSizeOptions: [15, 30, 50],
          onChange: (page, size) => {
            setPageIndex(size !== pageSize ? 1 : page);
            setPageSize(size);
          },
        }}
      />

      {/* ── 5. RightDrawer: Detailed Case Review (size="xl") ── */}
      <RightDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={selectedDispute ? `Hồ sơ khiếu nại #${selectedDispute.id.slice(0, 8)}` : "Thẩm định khiếu nại"}
        badge={selectedDispute ? getStatusBadge(selectedDispute.status).label : ""}
        badgeCls={selectedDispute ? getStatusBadge(selectedDispute.status).bg : ""}
        size="xl"
      >
        {selectedDispute && (
          <>
            <DrawerBody>
              <div className="space-y-4">
                {/* 1. Tổng quan hồ sơ khiếu nại */}
                <div className="bg-slate-50 border border-slate-200 rounded-[8px] p-3.5 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Mã khiếu nại (TicketId):</span>
                    <span className="font-bold text-[#001743] font-mono text-[11px]">
                      {selectedDispute.id}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Người nộp khiếu nại:</span>
                    <span className="font-semibold text-slate-800">
                      {selectedDispute.complainantName || "Người dùng"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Thời gian tiếp nhận:</span>
                    <span className="font-mono text-slate-700">
                      {new Date(selectedDispute.createdDate).toLocaleString("vi-VN")}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                    <span className="text-slate-500">Trạng thái giải quyết:</span>
                    <span
                      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[4px] text-[10px] font-bold border ${
                        getStatusBadge(selectedDispute.status).bg
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${getStatusBadge(selectedDispute.status).dot}`} />
                      {getStatusBadge(selectedDispute.status).label}
                    </span>
                  </div>
                </div>

                {/* 2. Nội dung & Lý do khiếu nại */}
                <DrawerSection title="Nội dung khiếu nại từ người dùng">
                  <div className="p-3.5 bg-white border border-slate-200 rounded-[6px] text-xs text-slate-700 leading-relaxed space-y-2 shadow-2xs">
                    <p className="font-normal text-slate-800 whitespace-pre-wrap">{selectedDispute.reason}</p>
                    <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-100 flex items-center gap-1.5">
                      <User size={12} />
                      <span>Người khiếu nại ID: <code className="font-mono text-slate-600">{selectedDispute.complainantId}</code></span>
                    </div>
                  </div>
                </DrawerSection>

                {/* 3. Thông tin giao dịch ký quỹ liên quan */}
                <DrawerSection title="Hồ sơ giao dịch ký quỹ liên quan">
                  {loadingTrade ? (
                    <div className="p-4 border border-slate-200 rounded-[6px] text-center text-slate-400 text-xs">
                      <Loader2 size={14} className="animate-spin inline-block mr-1.5 text-[#001743]" />
                      Đang tra cứu dữ liệu giao dịch từ sổ cái...
                    </div>
                  ) : relatedTrade ? (
                    <div className="p-3.5 bg-white border border-slate-200 rounded-[6px] space-y-2.5 text-xs shadow-2xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Mã giao dịch:</span>
                        <span className="font-bold text-[#001743] font-mono">
                          {relatedTrade.tradeTransactionCode || relatedTrade.id.slice(0, 8)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Số SIM chuyển nhượng:</span>
                        <span className="font-bold text-emerald-700 font-mono text-sm">
                          {formatPhone(relatedTrade.simPhoneNumber)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Giá trị ký quỹ bảo đảm:</span>
                        <span className="font-extrabold text-[#E4011E] font-mono text-sm tabular-nums">
                          {formatVND(relatedTrade.escrowAmount || 0)}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                        <div className="bg-slate-50 p-2 rounded-[4px]">
                          <span className="text-[10px] text-slate-400 block">Bên mua:</span>
                          <span className="font-semibold text-slate-800 text-[11px] block truncate">
                            {relatedTrade.buyerName || relatedTrade.buyerId.slice(0, 8)}
                          </span>
                        </div>
                        <div className="bg-slate-50 p-2 rounded-[4px]">
                          <span className="text-[10px] text-slate-400 block">Bên bán:</span>
                          <span className="font-semibold text-slate-800 text-[11px] block truncate">
                            {relatedTrade.sellerName || relatedTrade.sellerId.slice(0, 8)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[11px] text-slate-500">Trạng thái ký quỹ Escrow:</span>
                        <span className="font-mono text-[11px] font-bold text-slate-700">
                          {relatedTrade.escrowStatus || "Đang tạm giữ"}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-[6px] text-xs text-slate-500 flex items-center justify-between">
                      <span>Mã giao dịch liên kết: <code className="font-mono">{selectedDispute.tradeTransactionId}</code></span>
                      <span className="text-[10px] text-slate-400">Không tìm thấy dữ liệu bổ sung</span>
                    </div>
                  )}
                </DrawerSection>

                {/* 4. Kết quả phán quyết nếu đã xử lý */}
                {selectedDispute.adminResolutionNotes && (
                  <DrawerSection title="Biên bản phán quyết trọng tài sàn">
                    <div className="p-3.5 bg-emerald-50/50 border border-emerald-200 rounded-[6px] space-y-1.5 text-xs text-slate-700">
                      <div className="flex items-center gap-1.5 font-bold text-emerald-900">
                        <CheckCircle2 size={14} className="text-emerald-600" />
                        <span>Căn cứ và kết luận phán quyết:</span>
                      </div>
                      <p className="text-slate-800 whitespace-pre-wrap leading-relaxed pl-5">
                        {selectedDispute.adminResolutionNotes}
                      </p>
                      {selectedDispute.resolvedByAdminId && (
                        <div className="text-[10px] text-slate-500 pt-1.5 border-t border-emerald-100 pl-5">
                          Quản trị viên thụ lý: <code className="font-mono">{selectedDispute.resolvedByAdminId}</code>
                        </div>
                      )}
                    </div>
                  </DrawerSection>
                )}
              </div>
            </DrawerBody>

            <DrawerFooter>
              <div className="flex flex-col sm:flex-row items-center justify-between gap-2 w-full">
                <BtnSecondary onClick={() => setDrawerOpen(false)}>Đóng</BtnSecondary>

                {/* Phán quyết chỉ khả dụng khi chưa giải quyết (OPEN hoặc INVESTIGATING) */}
                {(selectedDispute.status === "OPEN" || selectedDispute.status === "INVESTIGATING") && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setAdjudicateAction({
                          dispute: selectedDispute,
                          decision: "RESOLVED_FAVOR_BUYER",
                        })
                      }
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-[6px] transition-colors shadow-2xs"
                    >
                      Xử Bên Mua thắng (Hoàn tiền 100%)
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setAdjudicateAction({
                          dispute: selectedDispute,
                          decision: "RESOLVED_FAVOR_SELLER",
                        })
                      }
                      className="px-3.5 py-1.5 bg-[#001743] hover:bg-[#00266B] text-white text-xs font-bold rounded-[6px] transition-colors shadow-2xs"
                    >
                      Xử Bên Bán thắng (Giải ngân)
                    </button>
                  </div>
                )}
              </div>
            </DrawerFooter>
          </>
        )}
      </RightDrawer>

      {/* ── 6. Confirm Decision Modal with Backend FluentValidation Compliance ── */}
      {adjudicateAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white border border-[#e4e7ec] rounded-xl w-full max-w-lg shadow-xl p-5 animate-fade-up">
            <div className="flex items-start gap-3 mb-3">
              <div className="p-2.5 rounded-lg bg-[#001743]/10 text-[#001743] shrink-0">
                <Scale size={22} strokeWidth={2} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#001743]">
                  Ban hành phán quyết trọng tài khiếu nại
                </h3>
                <p className="text-xs text-[#6B7280] mt-1 leading-relaxed">
                  Quyết định:{" "}
                  <strong className={adjudicateAction.decision === "RESOLVED_FAVOR_BUYER" ? "text-emerald-700" : "text-indigo-700"}>
                    {adjudicateAction.decision === "RESOLVED_FAVOR_BUYER"
                      ? "Xử thắng cho Bên Mua (Hoàn 100% tiền ký quỹ)"
                      : "Xử thắng cho Bên Bán (Giải ngân tiền cho Bên Bán)"}
                  </strong>
                </p>
              </div>
            </div>

            {/* Error banner */}
            {adjudicateError && (
              <div className="mb-3 p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center gap-2">
                <AlertTriangle size={14} className="shrink-0" />
                <span>{adjudicateError}</span>
              </div>
            )}

            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-[#001743]">
                    Căn cứ phán quyết (Bắt buộc) <span className="text-rose-500">*</span>
                  </label>
                  <span
                    className={`text-[10px] font-mono ${
                      adjudicateReason.trim().length < 10
                        ? "text-amber-600 font-semibold"
                        : adjudicateReason.trim().length > 2000
                        ? "text-rose-600 font-bold"
                        : "text-slate-400"
                    }`}
                  >
                    {adjudicateReason.trim().length} / 2000 ký tự (tối thiểu 10)
                  </span>
                </div>
                <textarea
                  rows={4}
                  value={adjudicateReason}
                  onChange={(e) => {
                    setAdjudicateReason(e.target.value);
                    if (adjudicateError) setAdjudicateError(null);
                  }}
                  placeholder="Ghi rõ điều khoản thỏa thuận, xác minh nhà mạng viễn thông hoặc chứng cứ vi phạm làm căn cứ ra phán quyết (tối thiểu 10 ký tự)…"
                  className="w-full text-xs p-2.5 border border-[#e4e7ec] rounded-lg focus:border-[#001743] focus:outline-none transition-colors"
                />
              </div>

              <div className="p-2.5 bg-slate-50 border border-[#e4e7ec] rounded-lg text-[11px] text-slate-600 leading-normal flex items-start gap-2">
                <Clock size={13} className="text-slate-400 shrink-0 mt-0.5" />
                <span>
                  Sau khi ban hành, phán quyết có hiệu lực ngay lập tức. Tiền ký quỹ trong giao dịch sẽ được điều hướng xử lý tương ứng theo quy định bảo vệ sàn TrustSim.
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#e4e7ec]">
                <button
                  type="button"
                  disabled={adjudicateSubmitting}
                  onClick={() => {
                    setAdjudicateAction(null);
                    setAdjudicateReason("");
                    setAdjudicateError(null);
                  }}
                  className="px-3.5 py-1.5 border border-[#e4e7ec] text-xs font-semibold text-[#4B5563] rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  disabled={adjudicateSubmitting}
                  onClick={handleConfirmDecision}
                  className="px-4 py-1.5 bg-[#001743] hover:bg-[#00266B] text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-50 inline-flex items-center gap-1.5"
                >
                  {adjudicateSubmitting && <Loader2 size={13} className="animate-spin" />}
                  <span>{adjudicateSubmitting ? "Đang xử lý…" : "Ban hành phán quyết"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
