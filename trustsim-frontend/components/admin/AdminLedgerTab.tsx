"use client";
import React, { useState, useCallback, useEffect } from "react";
import {
  BookOpen,
  Download,
  ShieldCheck,
  Link2,
  RefreshCw,
  Eye,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  TrendingUp,
  TrendingDown,
  Scale,
  Users,
  FileSearch,
} from "lucide-react";
import { walletService } from "@/services/walletService";
import type {
  LedgerJournalDto,
  LedgerIntegrityReportDto,
  LedgerEntryDto,
} from "@/types/wallet";
import type { PagedResult } from "@/types/common";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatVND = (v: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(v);

const formatDate = (d?: string) => {
  if (!d) return "—";
  return new Date(d).toLocaleString("vi-VN", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
};

const LOAI_GIAO_DICH_LABELS: Record<string, string> = {
  TOP_UP: "Nạp tiền",
  WITHDRAW: "Rút tiền",
  ESCROW_LOCK: "Khóa ký quỹ",
  ESCROW_RELEASE: "Giải phóng ký quỹ",
  ESCROW_FORFEIT: "Thu ký quỹ",
  FEE: "Phí dịch vụ",
  ADJUSTMENT: "Điều chỉnh thủ công",
};

// ─── Badges ───────────────────────────────────────────────────────────────────
function LoaiGiaoDichBadge({ type }: { type: string }) {
  const map: Record<string, string> = {
    TOP_UP: "bg-emerald-50 text-emerald-700 border-emerald-200",
    WITHDRAW: "bg-rose-50 text-rose-700 border-rose-200",
    ESCROW_LOCK: "bg-amber-50 text-amber-700 border-amber-200",
    ESCROW_RELEASE: "bg-blue-50 text-blue-700 border-blue-200",
    ESCROW_FORFEIT: "bg-orange-50 text-orange-700 border-orange-200",
    FEE: "bg-purple-50 text-purple-700 border-purple-200",
    ADJUSTMENT: "bg-slate-100 text-slate-600 border-slate-200",
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${map[type] || "bg-slate-100 text-slate-500 border-slate-200"}`}>
      {LOAI_GIAO_DICH_LABELS[type] || type}
    </span>
  );
}

function ChuKyBadge({ valid }: { valid?: boolean }) {
  if (valid === undefined) return <span className="text-[10px] text-slate-400">—</span>;
  return valid ? (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />Hợp lệ
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
      <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />Bất thường
    </span>
  );
}

// ─── KPI Card (matching AdminSimsTab style) ───────────────────────────────────
function KpiCard({
  label, value, sub, icon, iconBg,
}: {
  label: string;
  value: React.ReactNode;
  sub?: string;
  icon: React.ReactNode;
  iconBg: string;
}) {
  return (
    <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-2xs flex items-center justify-between">
      <div>
        <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">{label}</span>
        <div className="text-xl font-bold text-[#001743] tabular-nums mt-1">{value}</div>
        {sub && <span className="text-[11px] text-slate-400">{sub}</span>}
      </div>
      <div className={`p-2.5 rounded-lg border ${iconBg}`}>{icon}</div>
    </div>
  );
}

// ─── Chi tiết chứng từ Modal ───────────────────────────────────────────────────
function ChiTietModal({ journal, onClose }: { journal: LedgerJournalDto; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,23,67,0.6)", backdropFilter: "blur(4px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-[8px] shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden border border-[#E2E8F0]">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-[#E2E8F0] flex items-center justify-between bg-[#001743]">
          <div>
            <h3 className="text-sm font-bold text-white">Chi tiết phiếu kế toán</h3>
            <p className="text-[11px] text-blue-200 mt-0.5">
              Mã phiếu: {journal.journalCode} · STT #{journal.sequence}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white text-lg leading-none p-1.5 hover:bg-white/10 rounded-md transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-5 space-y-4">
          {/* Thông tin tóm tắt */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50 rounded-lg p-3.5 border border-slate-100">
              <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wide mb-1.5">Loại phát sinh</div>
              <LoaiGiaoDichBadge type={journal.transactionType} />
            </div>
            <div className="bg-slate-50 rounded-lg p-3.5 border border-slate-100">
              <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wide mb-1.5">Thời gian</div>
              <div className="text-xs font-semibold text-slate-800">{formatDate(journal.createdAt)}</div>
            </div>
            <div className="bg-emerald-50 rounded-lg p-3.5 border border-emerald-100">
              <div className="text-[10px] text-emerald-600 font-semibold uppercase tracking-wide mb-1.5">Tổng tiền Nợ</div>
              <div className="text-sm font-bold text-emerald-700">{formatVND(journal.totalDebit)}</div>
            </div>
            <div className="bg-blue-50 rounded-lg p-3.5 border border-blue-100">
              <div className="text-[10px] text-blue-600 font-semibold uppercase tracking-wide mb-1.5">Tổng tiền Có</div>
              <div className="text-sm font-bold text-blue-700">{formatVND(journal.totalCredit)}</div>
            </div>
          </div>

          {/* Thông tin bảo mật */}
          <div className="bg-slate-50 rounded-lg p-4 border border-slate-100 space-y-2.5">
            <div className="text-xs font-semibold text-slate-700 flex items-center gap-2">
              <ShieldCheck size={14} className="text-slate-500" />
              Thông tin bảo mật & toàn vẹn dữ liệu
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500 w-32">Chữ ký xác thực:</span>
              <ChuKyBadge valid={journal.isSignatureValid} />
            </div>
            <div className="flex items-start gap-3">
              <span className="text-xs text-slate-500 w-32 shrink-0">Mã kiểm tra:</span>
              <span className="text-[10px] font-mono text-slate-600 break-all leading-relaxed">{journal.hash || "—"}</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-xs text-slate-500 w-32 shrink-0">Mã phiếu trước:</span>
              <span className="text-[10px] font-mono text-slate-400 break-all leading-relaxed">{journal.previousHash || "—"}</span>
            </div>
          </div>

          {/* Bảng dòng ghi nợ/có */}
          {journal.entries && journal.entries.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-slate-700 mb-2.5">
                Chi tiết ghi nhận ({journal.entries.length} dòng)
              </div>
              <div className="rounded-lg border border-slate-200 overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 text-slate-500 text-[10px] font-semibold uppercase">
                    <tr>
                      <th className="px-4 py-2.5 text-left">Tài khoản</th>
                      <th className="px-4 py-2.5 text-right">Ghi Nợ</th>
                      <th className="px-4 py-2.5 text-right">Ghi Có</th>
                      <th className="px-4 py-2.5 text-center">Loại</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {journal.entries.map((e: LedgerEntryDto) => (
                      <tr key={e.id} className="hover:bg-slate-50/60">
                        <td className="px-4 py-2.5">
                          <div className="font-mono font-semibold text-[#001743] text-[11px]">{e.accountCode}</div>
                          <div className="text-[10px] text-slate-400">{e.accountName}</div>
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono text-emerald-700">
                          {e.debitAmount > 0 ? formatVND(e.debitAmount) : "—"}
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono text-blue-700">
                          {e.creditAmount > 0 ? formatVND(e.creditAmount) : "—"}
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${e.entryType === "DEBIT" ? "bg-emerald-50 text-emerald-700" : "bg-blue-50 text-blue-700"}`}>
                            {e.entryType === "DEBIT" ? "Nợ" : "Có"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="px-5 py-3.5 border-t border-[#E2E8F0] flex justify-end bg-slate-50/50">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#001743] text-white text-xs font-bold rounded-[6px] hover:bg-[#00266B] transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AdminLedgerTab() {
  const [journals, setJournals] = useState<PagedResult<LedgerJournalDto> | null>(null);
  const [journalLoading, setJournalLoading] = useState(false);
  const [journalError, setJournalError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [pageIndex, setPageIndex] = useState(1);
  const [typeFilter, setTypeFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [detailLoading, setDetailLoading] = useState(false);
  const [selectedJournal, setSelectedJournal] = useState<LedgerJournalDto | null>(null);

  const [auditReport, setAuditReport] = useState<LedgerIntegrityReportDto | null>(null);
  const [auditLoading, setAuditLoading] = useState(false);

  const [chainReport, setChainReport] = useState<LedgerIntegrityReportDto | null>(null);
  const [chainLoading, setChainLoading] = useState(false);

  const [exportLoading, setExportLoading] = useState(false);

  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchJournals = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setJournalLoading(true);
    setJournalError("");
    try {
      const res = await walletService.adminGetLedgerJournals({
        transactionType: typeFilter || undefined,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
        pageIndex,
        pageSize: 20,
      });
      setJournals(res);
    } catch (e: any) {
      setJournalError(e.message || "Không thể tải danh sách phiếu kế toán");
    } finally {
      setJournalLoading(false);
      setRefreshing(false);
    }
  }, [typeFilter, fromDate, toDate, pageIndex]);

  useEffect(() => { fetchJournals(); }, [fetchJournals]);

  const handleViewDetail = async (id: string) => {
    setDetailLoading(true);
    try {
      const detail = await walletService.adminGetLedgerJournalDetail(id);
      setSelectedJournal(detail);
    } catch (e: any) {
      showToast(e.message || "Không thể tải chi tiết phiếu", "error");
    } finally {
      setDetailLoading(false);
    }
  };

  const handleDoiSoat = async () => {
    setAuditLoading(true);
    try {
      const res = await walletService.adminGetLedgerAudit();
      setAuditReport(res);
      showToast("Đối soát số dư hoàn tất!", "success");
    } catch (e: any) {
      showToast(e.message || "Không thể thực hiện đối soát", "error");
    } finally {
      setAuditLoading(false);
    }
  };

  const handleKiemTraChuoi = async () => {
    setChainLoading(true);
    try {
      const res = await walletService.adminVerifyLedgerChain(1, 10000);
      setChainReport(res);
      const ok = res.isChainValid && res.isSignatureValid;
      showToast(
        ok ? "Chuỗi giao dịch toàn vẹn, không có dấu hiệu bất thường." : "Phát hiện dấu hiệu bất thường trong chuỗi giao dịch!",
        ok ? "success" : "error"
      );
    } catch (e: any) {
      showToast(e.message || "Không thể kiểm tra chuỗi giao dịch", "error");
    } finally {
      setChainLoading(false);
    }
  };

  const handleExport = async () => {
    setExportLoading(true);
    try {
      const blob = await walletService.adminExportTransactions();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `SoCai_TrustSim_${new Date().toISOString().slice(0, 10)}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      showToast("Xuất dữ liệu thành công!", "success");
    } catch (e: any) {
      showToast(e.message || "Không thể xuất dữ liệu", "error");
    } finally {
      setExportLoading(false);
    }
  };

  const totalPages = journals ? Math.ceil(journals.totalCount / 20) : 0;
  const totalJournals = journals?.totalCount ?? 0;

  return (
    <div className="admin-tab admin-tab-ledger space-y-6">
      {/* ── Toast ── */}
      {toast && (
        <div className={`fixed top-4 right-4 z-[9999] px-4 py-3 rounded-lg shadow-xl text-xs font-semibold flex items-center gap-2 border animate-fade-in ${
          toast.type === "success"
            ? "bg-emerald-50 text-emerald-800 border-emerald-200"
            : "bg-rose-50 text-rose-800 border-rose-200"
        }`}>
          {toast.type === "success" ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
          <span>{toast.msg}</span>
        </div>
      )}

      {/* ── Detail Modal ── */}
      {selectedJournal && (
        <ChiTietModal journal={selectedJournal} onClose={() => setSelectedJournal(null)} />
      )}

      {/* ── 1. Header Card ── */}
      <div className="bg-white border border-[#E2E8F0] rounded-[8px] p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-base font-bold text-[#001743]">Sổ Cái Tài Chính</h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 font-mono">
              {totalJournals.toLocaleString()} phiếu
            </span>
          </div>
          <p className="text-xs text-[#6B7280] mt-0.5">
            Toàn bộ phiếu kế toán thu chi của sàn, được bảo mật và kiểm soát tự động theo thời gian thực.
          </p>
        </div>

        {/* Nút hành động */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <button
            onClick={handleExport}
            disabled={exportLoading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-[#D1D5DB] text-xs font-semibold text-[#4B5563] bg-white hover:bg-slate-50 rounded-[6px] transition-colors disabled:opacity-50"
          >
            {exportLoading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
            Xuất dữ liệu
          </button>

          <button
            onClick={handleDoiSoat}
            disabled={auditLoading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-emerald-300 text-xs font-semibold text-emerald-700 bg-white hover:bg-emerald-50 rounded-[6px] transition-colors disabled:opacity-50"
          >
            {auditLoading ? <Loader2 size={14} className="animate-spin" /> : <Scale size={14} />}
            Đối soát số dư sàn
          </button>

          <button
            onClick={handleKiemTraChuoi}
            disabled={chainLoading}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#001743] hover:bg-[#00266B] text-white text-xs font-bold rounded-[6px] transition-colors shadow-xs disabled:opacity-50 shrink-0"
          >
            {chainLoading ? <Loader2 size={14} className="animate-spin" /> : <Link2 size={14} />}
            Kiểm tra chuỗi giao dịch
          </button>

          <button
            onClick={() => { setRefreshing(true); fetchJournals(true); }}
            disabled={refreshing || journalLoading}
            title="Làm mới dữ liệu"
            className="p-1.5 text-[#4B5563] hover:text-[#001743] hover:bg-slate-100 border border-[#D1D5DB] rounded-[6px] transition-colors bg-white disabled:opacity-50"
          >
            <RefreshCw size={15} className={refreshing ? "animate-spin text-[#001743]" : ""} />
          </button>
        </div>
      </div>

      {/* ── 2. KPI Strip ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard
          label="Tổng số phiếu"
          value={totalJournals.toLocaleString()}
          sub="Toàn bộ phiếu kế toán"
          icon={<BookOpen size={20} />}
          iconBg="bg-slate-50 text-[#001743] border-slate-100"
        />
        <KpiCard
          label="Tổng tiền thu vào"
          value={journals?.items[0] != null ? "—" : "—"}
          sub="Từ kết quả đối soát"
          icon={<TrendingUp size={20} />}
          iconBg="bg-emerald-50 text-emerald-600 border-emerald-100"
        />
        <KpiCard
          label="Tổng tiền chi ra"
          value="—"
          sub="Từ kết quả đối soát"
          icon={<TrendingDown size={20} />}
          iconBg="bg-rose-50 text-rose-600 border-rose-100"
        />
        <KpiCard
          label="Số dư ròng sàn"
          value="—"
          sub="Chạy đối soát để cập nhật"
          icon={<Scale size={20} />}
          iconBg="bg-blue-50 text-blue-600 border-blue-100"
        />
      </div>

      {/* ── 3. Kết quả kiểm tra chuỗi ── */}
      {chainReport && (
        <div className={`rounded-[8px] border p-4 ${chainReport.isChainValid && chainReport.isSignatureValid ? "bg-emerald-50 border-emerald-200" : "bg-rose-50 border-rose-200"}`}>
          <div className="flex items-start gap-3 mb-3">
            <div className={`mt-0.5 p-2 rounded-lg border ${chainReport.isChainValid && chainReport.isSignatureValid ? "bg-emerald-100 text-emerald-700 border-emerald-200" : "bg-rose-100 text-rose-700 border-rose-200"}`}>
              {chainReport.isChainValid && chainReport.isSignatureValid
                ? <ShieldCheck size={18} />
                : <AlertTriangle size={18} />}
            </div>
            <div>
              <div className={`text-sm font-bold ${chainReport.isChainValid && chainReport.isSignatureValid ? "text-emerald-800" : "text-rose-800"}`}>
                {chainReport.isChainValid && chainReport.isSignatureValid
                  ? "Chuỗi giao dịch toàn vẹn — Không phát hiện dữ liệu bị can thiệp"
                  : "Cảnh báo — Phát hiện dấu hiệu bất thường trong chuỗi giao dịch!"}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">Kiểm tra lúc: {formatDate(chainReport.generatedAt)}</div>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white rounded-lg border border-slate-200 p-3">
              <div className="text-[10px] font-medium text-slate-500">Phiếu đã kiểm tra</div>
              <div className="text-base font-bold text-[#001743] mt-1 tabular-nums">{chainReport.totalEntriesScanned.toLocaleString()}</div>
            </div>
            <div className={`rounded-lg border p-3 ${chainReport.isChainValid ? "bg-emerald-50 border-emerald-200" : "bg-rose-50 border-rose-200"}`}>
              <div className="text-[10px] font-medium text-slate-500">Tính liên tục</div>
              <div className={`text-base font-bold mt-1 ${chainReport.isChainValid ? "text-emerald-700" : "text-rose-700"}`}>
                {chainReport.isChainValid ? "Liên tục" : "Bị gián đoạn"}
              </div>
            </div>
            <div className={`rounded-lg border p-3 ${chainReport.isSignatureValid ? "bg-emerald-50 border-emerald-200" : "bg-rose-50 border-rose-200"}`}>
              <div className="text-[10px] font-medium text-slate-500">Chữ ký xác thực</div>
              <div className={`text-base font-bold mt-1 ${chainReport.isSignatureValid ? "text-emerald-700" : "text-rose-700"}`}>
                {chainReport.isSignatureValid ? "Hợp lệ" : "Bất thường"}
              </div>
            </div>
            {chainReport.firstBrokenSequence ? (
              <div className="bg-rose-50 border border-rose-200 rounded-lg p-3">
                <div className="text-[10px] font-medium text-slate-500">Phát sinh đầu tiên bất thường</div>
                <div className="text-base font-bold text-rose-700 mt-1">STT #{chainReport.firstBrokenSequence}</div>
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-lg p-3">
                <div className="text-[10px] font-medium text-slate-500">Người dùng kiểm tra</div>
                <div className="text-base font-bold text-[#001743] mt-1 tabular-nums">{chainReport.totalUsersAudited}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── 4. Kết quả đối soát số dư ── */}
      {auditReport && (
        <div className="bg-white border border-[#E2E8F0] rounded-[8px] shadow-xs overflow-hidden">
          <div className="px-5 py-3.5 border-b border-[#E2E8F0] flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-[#001743]">Kết quả đối soát số dư</h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                So sánh sổ cái với số dư thực tế từng tài khoản · {formatDate(auditReport.generatedAt)}
              </p>
            </div>
            <span className={`text-xs font-bold px-3 py-1 rounded-full border ${auditReport.discrepanciesFound === 0 ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-rose-50 text-rose-700 border-rose-200"}`}>
              {auditReport.discrepanciesFound === 0 ? "Cân bằng hoàn toàn" : `${auditReport.discrepanciesFound} tài khoản lệch`}
            </span>
          </div>

          <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 border-b border-slate-100">
            <div className="bg-emerald-50 rounded-lg border border-emerald-100 p-3">
              <div className="text-[10px] font-medium text-emerald-600">Tổng thu vào</div>
              <div className="text-sm font-bold text-emerald-700 mt-1 tabular-nums">{formatVND(auditReport.totalDebit)}</div>
            </div>
            <div className="bg-blue-50 rounded-lg border border-blue-100 p-3">
              <div className="text-[10px] font-medium text-blue-600">Tổng chi ra</div>
              <div className="text-sm font-bold text-blue-700 mt-1 tabular-nums">{formatVND(auditReport.totalCredit)}</div>
            </div>
            <div className="bg-slate-50 rounded-lg border border-slate-100 p-3">
              <div className="text-[10px] font-medium text-slate-500">Số dư ròng</div>
              <div className="text-sm font-bold text-[#001743] mt-1 tabular-nums">{formatVND(auditReport.netBalance)}</div>
            </div>
            <div className="bg-slate-50 rounded-lg border border-slate-100 p-3">
              <div className="text-[10px] font-medium text-slate-500">Tài khoản kiểm tra</div>
              <div className="text-sm font-bold text-[#001743] mt-1 tabular-nums">{auditReport.totalUsersAudited}</div>
            </div>
          </div>

          {auditReport.userAudits && auditReport.userAudits.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 text-slate-500 text-[10px] font-semibold uppercase border-b border-slate-100">
                  <tr>
                    <th className="px-4 py-2.5 text-left">Người dùng</th>
                    <th className="px-4 py-2.5 text-right">Theo sổ cái</th>
                    <th className="px-4 py-2.5 text-right">Số dư thực tế</th>
                    <th className="px-4 py-2.5 text-right">Chênh lệch</th>
                    <th className="px-4 py-2.5 text-center">Kết quả</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {auditReport.userAudits.map((u) => (
                    <tr key={u.userId} className={`hover:bg-slate-50/60 ${!u.isMatch ? "bg-rose-50/30" : ""}`}>
                      <td className="px-4 py-2.5 font-medium text-slate-800">{u.userName}</td>
                      <td className="px-4 py-2.5 text-right font-mono text-slate-700">{formatVND(u.ledgerBalance)}</td>
                      <td className="px-4 py-2.5 text-right font-mono text-slate-700">{formatVND(u.materializedBalance)}</td>
                      <td className={`px-4 py-2.5 text-right font-mono font-bold ${u.discrepancy !== 0 ? "text-rose-600" : "text-slate-400"}`}>
                        {u.discrepancy !== 0 ? formatVND(u.discrepancy) : "—"}
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        {u.isMatch
                          ? <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">Khớp</span>
                          : <span className="text-[10px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">Lệch</span>
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── 5. Bộ lọc ── */}
      <div className="bg-white border border-[#E2E8F0] rounded-[8px] p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row gap-3 items-end">
          <div className="flex-1">
            <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
              Loại giao dịch
            </label>
            <select
              value={typeFilter}
              onChange={(e) => { setTypeFilter(e.target.value); setPageIndex(1); }}
              className="w-full text-xs px-3 py-1.5 border border-[#D1D5DB] rounded-[6px] focus:outline-none focus:border-[#001743] bg-white text-slate-700"
            >
              <option value="">Tất cả loại</option>
              {Object.entries(LOAI_GIAO_DICH_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Từ ngày</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => { setFromDate(e.target.value); setPageIndex(1); }}
              className="text-xs px-3 py-1.5 border border-[#D1D5DB] rounded-[6px] focus:outline-none focus:border-[#001743] bg-white"
            />
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Đến ngày</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => { setToDate(e.target.value); setPageIndex(1); }}
              className="text-xs px-3 py-1.5 border border-[#D1D5DB] rounded-[6px] focus:outline-none focus:border-[#001743] bg-white"
            />
          </div>
          <button
            onClick={() => { setTypeFilter(""); setFromDate(""); setToDate(""); setPageIndex(1); }}
            className="px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-700 border border-[#D1D5DB] rounded-[6px] hover:bg-slate-50 transition-colors"
          >
            Xóa lọc
          </button>
          <button
            onClick={() => fetchJournals()}
            disabled={journalLoading}
            className="px-4 py-1.5 text-xs font-bold bg-[#001743] text-white rounded-[6px] hover:bg-[#00266B] transition-colors disabled:opacity-50"
          >
            {journalLoading ? "Đang tải..." : "Áp dụng"}
          </button>
        </div>
      </div>

      {/* ── 6. Bảng danh sách phiếu kế toán ── */}
      <div className="bg-white border border-[#E2E8F0] rounded-[8px] shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 border-b border-[#E2E8F0] flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-[#001743]">Danh sách phiếu kế toán</h2>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {journals ? `${journals.totalCount.toLocaleString()} phiếu thu chi` : "Đang tải..."}
            </p>
          </div>
          <button
            onClick={() => fetchJournals(true)}
            disabled={refreshing || journalLoading}
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-[#001743] transition-colors disabled:opacity-40"
          >
            <RefreshCw size={13} className={refreshing ? "animate-spin" : ""} />
            Làm mới
          </button>
        </div>

        {journalError && (
          <div className="px-5 py-3 text-xs text-rose-600 bg-rose-50 border-b border-rose-100 flex items-center gap-2">
            <AlertTriangle size={14} />{journalError}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-medium text-[10px] uppercase h-10">
                <th className="px-4 py-2">Mã phiếu</th>
                <th className="px-4 py-2">Loại phát sinh</th>
                <th className="px-4 py-2 text-right">Ghi Nợ</th>
                <th className="px-4 py-2 text-right">Ghi Có</th>
                <th className="px-4 py-2 text-center">Cân đối</th>
                <th className="px-4 py-2 text-center">Xác thực</th>
                <th className="px-4 py-2">Thời gian</th>
                <th className="px-4 py-2 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {journalLoading ? (
                <tr>
                  <td colSpan={8} className="py-14 text-center">
                    <Loader2 size={22} className="animate-spin mx-auto text-slate-300 mb-2" />
                    <p className="text-xs text-slate-400">Đang tải dữ liệu sổ cái...</p>
                  </td>
                </tr>
              ) : !journals || journals.items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-14 text-center">
                    <FileSearch size={34} className="mx-auto text-slate-300 mb-2" strokeWidth={1.5} />
                    <p className="text-xs font-semibold text-[#001743]">Chưa có phiếu kế toán nào</p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Sổ cái sẽ được cập nhật tự động khi phát sinh giao dịch
                    </p>
                  </td>
                </tr>
              ) : (
                journals.items.map((j) => (
                  <tr key={j.id} className="hover:bg-slate-50/60 transition-colors duration-150 h-12">
                    <td className="px-4 py-2.5">
                      <div className="font-mono font-semibold text-[#001743] text-[11px]">{j.journalCode}</div>
                      <div className="text-[10px] text-slate-400">STT #{j.sequence}</div>
                    </td>
                    <td className="px-4 py-2.5">
                      <LoaiGiaoDichBadge type={j.transactionType} />
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-emerald-700 font-semibold">
                      {formatVND(j.totalDebit)}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-blue-700 font-semibold">
                      {formatVND(j.totalCredit)}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      {j.isBalanced
                        ? <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">Cân đối</span>
                        : <span className="text-[10px] font-bold text-rose-600 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">Lệch</span>
                      }
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <ChuKyBadge valid={j.isSignatureValid} />
                    </td>
                    <td className="px-4 py-2.5 text-xs text-slate-500 whitespace-nowrap">
                      {formatDate(j.createdAt)}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <button
                        onClick={() => handleViewDetail(j.id)}
                        disabled={detailLoading}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-[#001743] hover:bg-[#001743] hover:text-white border border-[#D1D5DB] rounded-[6px] transition-all disabled:opacity-40"
                      >
                        <Eye size={12} />
                        Xem
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Phân trang */}
        {totalPages > 1 && (
          <div className="px-5 py-3.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Trang {pageIndex}/{totalPages} · {journals?.totalCount.toLocaleString()} phiếu</span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPageIndex((p) => Math.max(1, p - 1))}
                disabled={pageIndex <= 1}
                className="px-3 py-1.5 border border-[#D1D5DB] rounded-[6px] hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-xs font-medium"
              >
                ← Trước
              </button>
              <button
                onClick={() => setPageIndex((p) => Math.min(totalPages, p + 1))}
                disabled={pageIndex >= totalPages}
                className="px-3 py-1.5 border border-[#D1D5DB] rounded-[6px] hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-xs font-medium"
              >
                Sau →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
