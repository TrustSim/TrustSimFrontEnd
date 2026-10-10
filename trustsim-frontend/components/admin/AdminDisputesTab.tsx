/* Hallmark · genre: modern-minimal · macrostructure: Workbench · design-system: design.md · designed-as-app */
"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Search,
  RefreshCw,
  X,
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
  HelpCircle,
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
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [pageIndex, setPageIndex] = useState(1);
  const pageSize = 15;

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

  // 1. Fetch live disputes from API
  const fetchDisputes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await disputeService.getDisputes({
        status: statusFilter === "all" ? undefined : statusFilter,
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
  }, [statusFilter, pageIndex, pageSize]);

  useEffect(() => {
    fetchDisputes();
  }, [fetchDisputes]);

  // Client search filter across current batch
  const filteredDisputes = useMemo(() => {
    if (!search.trim()) return disputes;
    const q = search.toLowerCase().trim();
    return disputes.filter((item) => {
      const idMatch = item.id.toLowerCase().includes(q);
      const tradeMatch = item.tradeTransactionId.toLowerCase().includes(q);
      const complainantMatch = (item.complainantName || "").toLowerCase().includes(q);
      const reasonMatch = (item.reason || "").toLowerCase().includes(q);
      const notesMatch = (item.adminResolutionNotes || "").toLowerCase().includes(q);
      return idMatch || tradeMatch || complainantMatch || reasonMatch || notesMatch;
    });
  }, [disputes, search]);

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
      const blob = await disputeService.exportDisputes(
        statusFilter === "all" ? undefined : statusFilter
      );
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

  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  return (
    <div className="space-y-4">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-[#001743] text-white text-xs px-4 py-2.5 rounded-xl shadow-lg border border-slate-700 animate-fade-in flex items-center gap-2">
          <CheckCircle2 size={14} className="text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ── 1. Header Card ── */}
      <div className="bg-white border border-[#e4e7ec] rounded-xl p-4 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-base font-bold text-[#001743]">Giải Quyết Khiếu Nại &amp; Trọng Tài</h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 font-mono">
              {totalCount} hồ sơ
            </span>
          </div>
          <p className="text-xs text-[#6B7280] mt-0.5">
            Xem xét khiếu nại giữa các bên giao dịch, ban hành phán quyết trọng tài và đảm bảo quyền lợi người dùng sàn.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchDisputes()}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-[#e4e7ec] rounded-lg text-xs font-semibold text-slate-700 transition-colors shadow-2xs disabled:opacity-50"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            <span>Làm mới</span>
          </button>

          <button
            onClick={handleExport}
            disabled={exportLoading}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#001743] hover:bg-[#00266B] text-white rounded-lg text-xs font-semibold transition-colors shadow-2xs disabled:opacity-50"
          >
            {exportLoading ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <Download size={13} strokeWidth={2} />
            )}
            <span>Xuất file Excel</span>
          </button>
        </div>
      </div>

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

      {/* ── 3. Filter Toolbar Card ── */}
      <div className="bg-white border border-[#e4e7ec] rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
          <div className="relative w-80">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm mã khiếu nại, mã GD, người gửi, lý do…"
              className="w-full pl-9 pr-8 py-1.5 text-xs bg-white border border-[#e4e7ec] rounded-lg focus:border-[#001743] focus:outline-none transition-colors"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
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
            className="text-xs py-1.5 px-3 bg-white border border-[#e4e7ec] rounded-lg text-slate-700 focus:border-[#001743] focus:outline-none transition-colors"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="OPEN">Chờ tiếp nhận</option>
            <option value="INVESTIGATING">Đang xem xét</option>
            <option value="RESOLVED_FAVOR_BUYER">Bên Mua thắng (Hoàn tiền)</option>
            <option value="RESOLVED_FAVOR_SELLER">Bên Bán thắng (Giải ngân)</option>
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
          Hiển thị <strong className="text-[#001743]">{filteredDisputes.length}</strong> / {totalCount} hồ sơ
        </div>
      </div>

      {/* ── 4. Main Table Card ── */}
      <div className="bg-white border border-[#e4e7ec] rounded-xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#e4e7ec] bg-[#F8FAFC] text-slate-500 font-semibold uppercase text-[10px] tracking-wider h-10">
                <th className="py-3 px-4">Mã khiếu nại</th>
                <th className="py-3 px-4">Giao dịch liên quan</th>
                <th className="py-3 px-4">Người khiếu nại</th>
                <th className="py-3 px-4">Nội dung khiếu nại</th>
                <th className="py-3 px-4 text-center">Trạng thái</th>
                <th className="py-3 px-4">Ngày tạo</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e4e7ec]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <div className="inline-flex items-center gap-2">
                      <Loader2 size={16} className="animate-spin text-[#001743]" />
                      <span>Đang tải danh sách khiếu nại từ máy chủ…</span>
                    </div>
                  </td>
                </tr>
              ) : filteredDisputes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-1.5">
                      <HelpCircle size={24} className="text-slate-300" />
                      <span>Không tìm thấy hồ sơ khiếu nại nào phù hợp</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredDisputes.map((item) => {
                  const badge = getStatusBadge(item.status);
                  const isPending = item.status === "OPEN" || item.status === "INVESTIGATING";

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-slate-50/80 transition-colors h-14 ${
                        isPending ? "border-l-4 border-l-amber-500 bg-amber-50/15" : ""
                      }`}
                    >
                      {/* Ticket ID */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-[#001743] font-mono">
                          #{item.id.slice(0, 8)}
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono block">
                          {item.id.slice(8, 18)}…
                        </span>
                      </td>

                      {/* Trade Transaction ID */}
                      <td className="py-3 px-4">
                        <div className="font-mono text-slate-700 text-[11px] font-medium">
                          {item.tradeTransactionId ? `GD-${item.tradeTransactionId.slice(0, 8)}` : "—"}
                        </div>
                        <span className="text-[10px] text-slate-400 block">Ký quỹ chuyển nhượng</span>
                      </td>

                      {/* Complainant */}
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800">
                          {item.complainantName || "Người dùng ẩn danh"}
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono block">
                          ID: {item.complainantId ? item.complainantId.slice(0, 8) : "—"}
                        </span>
                      </td>

                      {/* Reason */}
                      <td className="py-3 px-4 max-w-xs">
                        <p className="line-clamp-2 text-slate-600 text-xs leading-relaxed" title={item.reason}>
                          {item.reason}
                        </p>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[4px] text-[10px] font-bold border ${badge.bg}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                          {badge.label}
                        </span>
                      </td>

                      {/* Created Date */}
                      <td className="py-3 px-4 text-slate-600 text-[11px] font-mono tabular-nums whitespace-nowrap">
                        {item.createdDate
                          ? new Date(item.createdDate).toLocaleString("vi-VN", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "—"}
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => openDetail(item)}
                          className="inline-flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-slate-100 border border-[#e4e7ec] rounded-lg text-xs font-semibold text-slate-700 transition-colors shadow-2xs"
                        >
                          <Eye size={13} strokeWidth={1.75} />
                          <span>{isPending ? "Thẩm định" : "Xem chi tiết"}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Toolbar */}
        {totalPages > 1 && (
          <div className="p-3 border-t border-[#e4e7ec] flex items-center justify-between text-xs text-slate-600 bg-[#F8FAFC]">
            <span>
              Trang <strong className="text-[#001743]">{pageIndex}</strong> / {totalPages}
            </span>
            <div className="flex items-center gap-1">
              <button
                disabled={pageIndex <= 1 || loading}
                onClick={() => setPageIndex((p) => Math.max(1, p - 1))}
                className="px-2.5 py-1 border border-[#e4e7ec] rounded-lg bg-white hover:bg-slate-50 disabled:opacity-40 transition-colors"
              >
                Trang trước
              </button>
              <button
                disabled={pageIndex >= totalPages || loading}
                onClick={() => setPageIndex((p) => Math.min(totalPages, p + 1))}
                className="px-2.5 py-1 border border-[#D1D5DB] rounded-[4px] bg-white hover:bg-slate-50 disabled:opacity-40"
              >
                Trang sau
              </button>
            </div>
          </div>
        )}
      </div>

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
