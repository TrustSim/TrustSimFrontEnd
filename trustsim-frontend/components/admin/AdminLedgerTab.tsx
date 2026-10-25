/* Hallmark · genre: modern-minimal · macrostructure: Workbench · design-system: design.md · designed-as-app */
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
  Scale,
  FileSearch,
} from "lucide-react";
import { walletService } from "@/services/walletService";
import type {
  LedgerJournalDto,
  LedgerIntegrityReportDto,
  LedgerEntryDto,
  AccountReconciliationDetail,
} from "@/types/wallet";
import { LedgerJournalSortBy, SortOrder, type PagedResult } from "@/types/common";
import { Button, DatePicker, Input, InputNumber, Select } from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import { AdminDataTable, AdminFilterBar, AdminPageHeader } from "@/components/admin/AdminDataPrimitives";

// ─── Helpers ──────────────────────────────────────────────────────────────────
/** Safe formatVND — returns "—" for NaN/undefined/null */
const formatVND = (v: number | undefined | null) => {
  const n = Number(v);
  if (!isFinite(n)) return "—";
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(n);
};

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

/** Tính tổng debit từ entries */
const sumDebit = (entries: LedgerEntryDto[]) =>
  entries.filter(e => e.entryType === "DEBIT").reduce((s, e) => s + Number(e.amount), 0);

/** Tính tổng credit từ entries */
const sumCredit = (entries: LedgerEntryDto[]) =>
  entries.filter(e => e.entryType === "CREDIT").reduce((s, e) => s + Number(e.amount), 0);

// ─── KPI Card (matching AdminSimsTab style) ───────────────────────────────────
function KpiCard({
  label, value, sub, icon, iconBg, onClick,
}: {
  label: string;
  value: React.ReactNode;
  sub?: string;
  icon: React.ReactNode;
  iconBg: string;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`bg-white border border-slate-200/80 rounded-xl p-4 shadow-2xs flex items-center justify-between ${
        onClick ? "cursor-pointer hover:border-slate-300 hover:shadow-xs transition-[border-color,box-shadow] duration-150" : ""
      }`}
    >
      <div>
        <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">{label}</span>
        <div className="text-xl font-bold text-[#001743] tabular-nums mt-1">{value}</div>
        {sub && <span className="text-[11px] text-slate-400 mt-0.5 block">{sub}</span>}
      </div>
      <div className={`p-2.5 rounded-lg border ${iconBg}`}>{icon}</div>
    </div>
  );
}

// ─── Chi tiết chứng từ Modal ───────────────────────────────────────────────────
function ChiTietModal({ journal, onClose }: { journal: LedgerJournalDto; onClose: () => void }) {
  // Tính debit/credit từ entries (backend dùng amount + entryType, không có debitAmount/creditAmount riêng)
  const totalDebit = sumDebit(journal.entries ?? []);
  const totalCredit = sumCredit(journal.entries ?? []);
  const isBalanced = Math.abs(totalDebit - totalCredit) < 1;

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
              Mã phiếu: {journal.journalCode}
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
              <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wide mb-1.5">Thời gian ghi sổ</div>
              {/* Backend dùng postedAt, không phải createdAt */}
              <div className="text-xs font-semibold text-slate-800">{formatDate(journal.postedAt)}</div>
            </div>
            <div className="bg-emerald-50 rounded-lg p-3.5 border border-emerald-100">
              <div className="text-[10px] text-emerald-600 font-semibold uppercase tracking-wide mb-1.5">Tổng tiền Nợ</div>
              <div className="text-sm font-bold text-emerald-700">
                {totalDebit > 0 ? formatVND(totalDebit) : formatVND(Number(journal.totalAmount))}
              </div>
            </div>
            <div className="bg-blue-50 rounded-lg p-3.5 border border-blue-100">
              <div className="text-[10px] text-blue-600 font-semibold uppercase tracking-wide mb-1.5">Tổng tiền Có</div>
              <div className="text-sm font-bold text-blue-700">
                {totalCredit > 0 ? formatVND(totalCredit) : formatVND(Number(journal.totalAmount))}
              </div>
            </div>
          </div>

          {/* Thông tin bảo mật */}
          <div className="bg-slate-50 rounded-lg p-4 border border-slate-100 space-y-2.5">
            <div className="text-xs font-semibold text-slate-700 flex items-center gap-2">
              <ShieldCheck size={14} className="text-slate-500" />
              Thông tin bảo mật & toàn vẹn dữ liệu
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500 w-32">Cân đối:</span>
              {isBalanced
                ? <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">Cân đối</span>
                : <span className="text-[10px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">Lệch</span>
              }
            </div>
            <div className="flex items-start gap-3">
              <span className="text-xs text-slate-500 w-32 shrink-0">Trạng thái:</span>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                journal.status === "POSTED"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-amber-50 text-amber-700 border-amber-200"
              }`}>{journal.statusName || journal.status}</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-xs text-slate-500 w-32 shrink-0">Chữ ký ECDsa:</span>
              {/* Backend dùng signedHash, không phải hash */}
              <span className="text-[10px] font-mono text-slate-600 break-all leading-relaxed">{journal.signedHash || "—"}</span>
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
                      <th className="px-4 py-2.5 text-right">Số tiền</th>
                      <th className="px-4 py-2.5 text-center">Loại</th>
                      <th className="px-4 py-2.5 text-right">Seq#</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {journal.entries.map((e: LedgerEntryDto) => (
                      <tr key={e.id} className="hover:bg-slate-50/60">
                        <td className="px-4 py-2.5">
                          {/* Backend dùng accountTypeName, không phải accountCode/accountName */}
                          <div className="font-mono font-semibold text-[#001743] text-[11px]">{e.accountTypeName || e.accountType}</div>
                          {e.description && <div className="text-[10px] text-slate-400">{e.description}</div>}
                        </td>
                        <td className={`px-4 py-2.5 text-right font-mono font-semibold ${
                          e.entryType === "DEBIT" ? "text-emerald-700" : "text-blue-700"
                        }`}>
                          {/* Backend dùng amount (luôn > 0), không có debitAmount/creditAmount */}
                          {formatVND(Number(e.amount))}
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            e.entryType === "DEBIT" ? "bg-emerald-50 text-emerald-700" : "bg-blue-50 text-blue-700"
                          }`}>
                            {e.entryTypeName || (e.entryType === "DEBIT" ? "Nợ" : "Có")}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono text-slate-400 text-[10px]">#{e.sequenceNumber}</td>
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

// ─── Helpers Chuyển Đổi Thuật Ngữ Thân Thiện ───────────────────────────────────
const sanitizeAlertMessage = (msg?: string) => {
  if (!msg) return "";
  return msg
    .replace(/bảng Wallets/gi, "ví cá nhân")
    .replace(/bảng Wallet/gi, "ví cá nhân")
    .replace(/Wallets/gi, "ví cá nhân")
    .replace(/FRAUD_DETECTED/gi, "Phát hiện sai lệch")
    .replace(/CLEAN/gi, "Bảo toàn an toàn");
};

const formatAccountName = (code: string, rawName: string) => {
  if (!rawName) return code;
  let name = rawName;
  name = name.replace(/USER_AVAILABLE/g, "Số dư khả dụng người dùng");
  name = name.replace(/ESCROW_LOCKED/g, "Tiền ký quỹ đấu giá");
  name = name.replace(/PLATFORM_REVENUE/g, "Doanh thu sàn");
  name = name.replace(/BANK_CLEARING/g, "Tài khoản trung gian ngân hàng");
  name = name.replace(/CASH_SETTLEMENT/g, "Thanh toán giao dịch");
  name = name.replace(/bảng Wallets/gi, "ví cá nhân");
  name = name.replace(/Wallets/gi, "ví cá nhân");
  return name;
};

// ─── Modal Đối soát số dư toàn sàn ───────────────────────────────────────────
function AuditReportModal({
  report,
  onClose,
}: {
  report: LedgerIntegrityReportDto;
  onClose: () => void;
}) {
  const isOk = !report.isFraudDetected;
  const alertMsg = sanitizeAlertMessage(report.fraudAlertMessage);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,23,67,0.65)", backdropFilter: "blur(4px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-200 animate-scale-in">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-[#001743] text-white">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isOk ? "bg-emerald-500/20 text-emerald-300" : "bg-rose-500/20 text-rose-300"}`}>
              <Scale size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="text-base font-bold text-white">Biên bản đối soát số dư toàn sàn</h3>
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                  isOk
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-400/30"
                    : "bg-rose-500/20 text-rose-300 border-rose-400/30"
                }`}>
                  {isOk ? "Số dư khớp 100%" : "Phát hiện sai lệch"}
                </span>
              </div>
              <p className="text-xs text-blue-200 mt-0.5">
                Đối soát số dư ví cá nhân thực tế với Sổ cái kép bất biến · {formatDate(report.auditedAt)} · {report.executionTimeMs}ms
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white text-lg p-1.5 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
            title="Đóng"
          >
            ✕
          </button>
        </div>

        {/* Modal Body with internal scroll */}
        <div className="overflow-y-auto flex-1 p-6 space-y-5">
          {/* 4 KPI Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className={`rounded-xl border p-3.5 ${report.isBalanceReconciled ? "bg-emerald-50/70 border-emerald-200" : "bg-rose-50/70 border-rose-200"}`}>
              <div className="text-[11px] font-medium text-slate-500">Đối soát số dư ví</div>
              <div className={`text-base font-bold mt-1 ${report.isBalanceReconciled ? "text-emerald-700" : "text-rose-700"}`}>
                {report.isBalanceReconciled ? "Cân bằng" : "Lệch số dư"}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                {report.isBalanceReconciled ? "Khớp hoàn toàn với sổ cái" : "Có ví lệch với sổ cái"}
              </div>
            </div>

            <div className={`rounded-xl border p-3.5 ${report.isAccountingEquationBalanced ? "bg-emerald-50/70 border-emerald-200" : "bg-rose-50/70 border-rose-200"}`}>
              <div className="text-[11px] font-medium text-slate-500">Phương trình kế toán</div>
              <div className={`text-base font-bold mt-1 ${report.isAccountingEquationBalanced ? "text-emerald-700" : "text-rose-700"}`}>
                {report.isAccountingEquationBalanced ? "Cân bằng" : "Mất cân bằng"}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Tổng Nợ = Tổng Có</div>
            </div>

            <div className="bg-slate-50 rounded-xl border border-slate-200 p-3.5">
              <div className="text-[11px] font-medium text-slate-500">Mắt xích quét</div>
              <div className="text-base font-bold text-[#001743] mt-1 tabular-nums">{report.totalEntriesScanned.toLocaleString()}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Dòng bút toán đã quét</div>
            </div>

            <div className="bg-slate-50 rounded-xl border border-slate-200 p-3.5">
              <div className="text-[11px] font-medium text-slate-500">Chứng từ kiểm tra</div>
              <div className="text-base font-bold text-[#001743] mt-1 tabular-nums">{report.totalJournalsScanned.toLocaleString()}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Phiếu kế toán đã xác thực</div>
            </div>
          </div>

          {/* Bảng đối soát chi tiết từng tài khoản */}
          {report.reconciliations && report.reconciliations.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <span className="text-xs font-bold text-[#001743]">Danh sách tài khoản đối soát ({report.reconciliations.length})</span>
                <span className="text-[11px] text-slate-400">Đơn vị: VNĐ</span>
              </div>
              <div className="overflow-x-auto max-h-[360px] overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50/95 sticky top-0 text-slate-600 text-[10px] font-semibold uppercase border-b border-slate-200 z-10 backdrop-blur-xs">
                    <tr>
                      <th className="px-4 py-2.5 text-left">Tài khoản kế toán</th>
                      <th className="px-4 py-2.5 text-right">Theo sổ cái</th>
                      <th className="px-4 py-2.5 text-right">Số dư ví thực tế</th>
                      <th className="px-4 py-2.5 text-right">Chênh lệch</th>
                      <th className="px-4 py-2.5 text-center">Kết quả</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {report.reconciliations.map((r: AccountReconciliationDetail, idx: number) => {
                      const friendlyName = formatAccountName(r.accountCode, r.accountName);

                      return (
                        <tr key={idx} className={`hover:bg-slate-50/80 transition-colors ${!r.isBalanced ? "bg-rose-50/40" : ""}`}>
                          <td className="px-4 py-3">
                            <div className="font-mono font-bold text-[#001743] text-xs">{r.accountCode}</div>
                            <div className="text-[11px] text-slate-500 mt-0.5">{friendlyName}</div>
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-slate-700 font-semibold">{formatVND(Number(r.ledgerCalculatedBalance))}</td>
                          <td className="px-4 py-3 text-right font-mono text-slate-700 font-semibold">{formatVND(Number(r.snapshotBalance))}</td>
                          <td className={`px-4 py-3 text-right font-mono font-bold ${r.discrepancy !== 0 ? "text-rose-600" : "text-slate-400"}`}>
                            {r.discrepancy !== 0 ? formatVND(Number(r.discrepancy)) : "0 ₫"}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {r.isBalanced ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Khớp
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-full">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Lệch
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Hộp thông điệp cảnh báo / kết luận */}
          {alertMsg && (
            <div className={`p-4 rounded-xl border flex items-start gap-3 ${
              report.isFraudDetected ? "bg-rose-50 border-rose-200 text-rose-800" : "bg-emerald-50 border-emerald-200 text-emerald-800"
            }`}>
              <div className="shrink-0 mt-0.5">
                {report.isFraudDetected ? <AlertTriangle size={18} className="text-rose-600" /> : <CheckCircle2 size={18} className="text-emerald-600" />}
              </div>
              <div className="text-xs leading-relaxed">
                <div className="font-bold text-sm mb-1">
                  {report.isFraudDetected ? "Cảnh báo sai lệch số dư tài chính" : "Hệ thống tài chính toàn vẹn 100%"}
                </div>
                <div>{alertMsg}</div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            Dữ liệu đối soát thời gian thực từ cơ sở dữ liệu và sổ cái kép
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-[#001743] hover:bg-[#00266B] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
          >
            Đóng biên bản
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Modal Kiểm tra chuỗi khối Hash Chain ─────────────────────────────────
function ChainReportModal({
  report,
  onClose,
}: {
  report: LedgerIntegrityReportDto;
  onClose: () => void;
}) {
  const isOk = !report.isFraudDetected;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,23,67,0.65)", backdropFilter: "blur(4px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-200 animate-scale-in">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-[#001743] text-white">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isOk ? "bg-emerald-500/20 text-emerald-300" : "bg-rose-500/20 text-rose-300"}`}>
              <ShieldCheck size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="text-base font-bold text-white">Kết quả kiểm tra chuỗi Hash Chain SHA-256</h3>
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                  isOk
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-400/30"
                    : "bg-rose-500/20 text-rose-300 border-rose-400/30"
                }`}>
                  {isOk ? "Chuỗi khối hợp lệ" : "Bất thường"}
                </span>
              </div>
              <p className="text-xs text-blue-200 mt-0.5">
                Xác thực chữ ký số ECDsa và tính liên tục chuỗi khối · {formatDate(report.auditedAt)} · {report.executionTimeMs}ms
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white text-lg p-1.5 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
            title="Đóng"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-6 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-3.5">
              <div className="text-[11px] font-medium text-slate-500">Mắt xích đã quét</div>
              <div className="text-base font-bold text-[#001743] mt-1 tabular-nums">{report.totalEntriesScanned.toLocaleString()}</div>
            </div>
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-3.5">
              <div className="text-[11px] font-medium text-slate-500">Chứng từ kiểm tra</div>
              <div className="text-base font-bold text-[#001743] mt-1 tabular-nums">{report.totalJournalsScanned.toLocaleString()}</div>
            </div>
            <div className={`rounded-xl border p-3.5 ${report.isChainValid ? "bg-emerald-50/70 border-emerald-200" : "bg-rose-50/70 border-rose-200"}`}>
              <div className="text-[11px] font-medium text-slate-500">Tính liên tục chuỗi</div>
              <div className={`text-base font-bold mt-1 ${report.isChainValid ? "text-emerald-700" : "text-rose-700"}`}>
                {report.isChainValid ? "Toàn vẹn" : "Bị gián đoạn"}
              </div>
            </div>
            <div className={`rounded-xl border p-3.5 ${report.isSignatureValid ? "bg-emerald-50/70 border-emerald-200" : "bg-rose-50/70 border-rose-200"}`}>
              <div className="text-[11px] font-medium text-slate-500">Chữ ký số ECDsa</div>
              <div className={`text-base font-bold mt-1 ${report.isSignatureValid ? "text-emerald-700" : "text-rose-700"}`}>
                {report.isSignatureValid ? "Hợp lệ" : "Bất thường"}
              </div>
            </div>
          </div>

          {/* Danh sách bất thường nếu có */}
          {report.anomalies && report.anomalies.length > 0 && (
            <div className="rounded-xl border border-rose-200 overflow-hidden shadow-2xs">
              <div className="px-4 py-2.5 bg-rose-100/70 text-xs font-bold text-rose-800 border-b border-rose-200">
                Phát hiện {report.anomalies.length} bất thường trong chuỗi
              </div>
              <div className="overflow-x-auto max-h-[250px] overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="bg-rose-50 text-rose-700 text-[10px] font-semibold uppercase border-b border-rose-100">
                    <tr>
                      <th className="px-4 py-2 text-left">Số thứ tự</th>
                      <th className="px-4 py-2 text-left">Loại bất thường</th>
                      <th className="px-4 py-2 text-left">Mô tả chi tiết</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-rose-100">
                    {report.anomalies.map((a, i) => (
                      <tr key={i} className="bg-white hover:bg-rose-50/30">
                        <td className="px-4 py-2.5 font-mono text-slate-700">#{a.sequenceNumber}</td>
                        <td className="px-4 py-2.5 font-semibold text-rose-700">{a.anomalyType}</td>
                        <td className="px-4 py-2.5 text-slate-600">{a.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Thông điệp cảnh báo / an toàn */}
          <div className={`p-4 rounded-xl border flex items-start gap-3 ${
            isOk ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-rose-50 border-rose-200 text-rose-800"
          }`}>
            <div className="shrink-0 mt-0.5">
              {isOk ? <CheckCircle2 size={18} className="text-emerald-600" /> : <AlertTriangle size={18} className="text-rose-600" />}
            </div>
            <div className="text-xs leading-relaxed">
              <div className="font-bold text-sm mb-1">
                {isOk ? "Chuỗi giao dịch toàn vẹn — Không phát hiện can thiệp" : "Cảnh báo phát hiện dấu hiệu can thiệp dữ liệu sổ cái"}
              </div>
              <div>{sanitizeAlertMessage(report.fraudAlertMessage) || (isOk ? "Tất cả các khối SHA-256 liên kết hoàn hảo." : "Có mắt xích bị can thiệp.")}</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-[#001743] hover:bg-[#00266B] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
          >
            Đóng kết quả
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
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [sortBy, setSortBy] = useState<LedgerJournalSortBy>(LedgerJournalSortBy.PostedAt);

  const [detailLoading, setDetailLoading] = useState(false);
  const [selectedJournal, setSelectedJournal] = useState<LedgerJournalDto | null>(null);

  const [auditReport, setAuditReport] = useState<LedgerIntegrityReportDto | null>(null);
  const [auditLoading, setAuditLoading] = useState(false);
  const [showAuditModal, setShowAuditModal] = useState(false);

  const [chainReport, setChainReport] = useState<LedgerIntegrityReportDto | null>(null);
  const [chainLoading, setChainLoading] = useState(false);
  const [showChainModal, setShowChainModal] = useState(false);

  const [exportLoading, setExportLoading] = useState(false);

  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPageIndex(1);
    }, 350);
    return () => window.clearTimeout(timer);
  }, [search]);

  const fetchJournals = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setJournalLoading(true);
    setJournalError("");
    try {
      const res = await walletService.adminGetLedgerJournals({
        keyword: debouncedSearch || undefined,
        transactionType: typeFilter || undefined,
        minAmount: minAmount ? Number(minAmount) : undefined,
        maxAmount: maxAmount ? Number(maxAmount) : undefined,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
        sortBy,
        sortOrder: SortOrder.Desc,
        pageIndex,
        pageSize,
      });
      setJournals(res);
    } catch (e: any) {
      setJournalError(e.message || "Không thể tải danh sách phiếu kế toán");
    } finally {
      setJournalLoading(false);
      setRefreshing(false);
    }
  }, [debouncedSearch, typeFilter, minAmount, maxAmount, fromDate, toDate, sortBy, pageIndex, pageSize]);

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
      setShowAuditModal(true);
      const ok = !res.isFraudDetected;
      showToast(
        ok ? "Đối soát hoàn tất — Không phát hiện bất thường!" : "Cảnh báo! Phát hiện sai lệch số dư trong sổ cái!",
        ok ? "success" : "error"
      );
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
      setShowChainModal(true);
      const ok = !res.isFraudDetected;
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

  const totalJournals = journals?.totalCount ?? 0;
  const journalColumns: ColumnsType<LedgerJournalDto> = [
    {
      title: "Mã phiếu",
      dataIndex: "journalCode",
      key: "journalCode",
      render: (value: string, journal) => (
        <div>
          <div className="font-mono font-semibold text-[#001743] text-[11px]">{value}</div>
          <div className="text-[10px] text-slate-400">{journal.transactionTypeName || journal.transactionType}</div>
        </div>
      ),
    },
    {
      title: "Loại phát sinh",
      dataIndex: "transactionType",
      key: "transactionType",
      render: (value: string) => <LoaiGiaoDichBadge type={value} />,
    },
    {
      title: "Số tiền",
      dataIndex: "totalAmount",
      key: "totalAmount",
      align: "right",
      render: (value: number) => <span className="font-mono font-semibold text-[#001743]">{formatVND(Number(value))}</span>,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      align: "center",
      render: (value: string, journal) => (
        <span className={`inline-flex rounded border px-2 py-0.5 text-[10px] font-bold ${value === "POSTED" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-700"}`}>
          {journal.statusName || value}
        </span>
      ),
    },
    {
      title: "Thời gian",
      dataIndex: "postedAt",
      key: "postedAt",
      render: (value: string) => <span className="whitespace-nowrap text-slate-500">{formatDate(value)}</span>,
    },
    {
      title: "Thao tác",
      key: "actions",
      align: "right",
      fixed: "right",
      width: 92,
      render: (_, journal) => (
        <Button size="small" icon={<Eye size={13} />} loading={detailLoading} onClick={() => handleViewDetail(journal.id)}>
          Xem
        </Button>
      ),
    },
  ];

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

      {/* ── Audit Report Modal ── */}
      {showAuditModal && auditReport && (
        <AuditReportModal report={auditReport} onClose={() => setShowAuditModal(false)} />
      )}

      {/* ── Chain Report Modal ── */}
      {showChainModal && chainReport && (
        <ChainReportModal report={chainReport} onClose={() => setShowChainModal(false)} />
      )}

      <AdminPageHeader
        title="Sổ cái tài chính"
        description="Toàn bộ phiếu kế toán thu chi của sàn, được bảo mật và kiểm soát tự động theo thời gian thực."
        badge={`${totalJournals.toLocaleString()} phiếu`}
        actions={
          <>
            <Button icon={<Download size={14} />} loading={exportLoading} onClick={handleExport}>Xuất dữ liệu</Button>
            <Button icon={<Scale size={14} />} loading={auditLoading} onClick={handleDoiSoat}>Đối soát số dư</Button>
            <Button type="primary" icon={<Link2 size={14} />} loading={chainLoading} onClick={handleKiemTraChuoi}>Kiểm tra chuỗi</Button>
            <Button aria-label="Làm mới dữ liệu" icon={<RefreshCw size={14} />} loading={refreshing || journalLoading} onClick={() => { setRefreshing(true); fetchJournals(true); }} />
          </>
        }
      />

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
          label="Toàn vẹn chuỗi"
          value={chainReport ? (chainReport.isChainValid ? "Toàn vẹn" : "Bất thường") : "Chưa kiểm tra"}
          sub={chainReport ? "Nhấn để xem chi tiết chuỗi khối" : "Chạy kiểm tra chuỗi để cập nhật"}
          icon={<TrendingUp size={20} />}
          iconBg={chainReport
            ? chainReport.isChainValid
              ? "bg-emerald-50 text-emerald-600 border-emerald-100"
              : "bg-rose-50 text-rose-600 border-rose-100"
            : "bg-slate-50 text-slate-500 border-slate-100"}
          onClick={chainReport ? () => setShowChainModal(true) : undefined}
        />
        <KpiCard
          label="Đối soát số dư"
          value={auditReport ? (auditReport.isBalanceReconciled ? "Cân bằng" : "Lệch") : "Chưa đối soát"}
          sub={auditReport ? "Nhấn để xem chi tiết đối soát" : "Chạy đối soát để cập nhật"}
          icon={<Scale size={20} />}
          iconBg={auditReport
            ? auditReport.isBalanceReconciled
              ? "bg-emerald-50 text-emerald-600 border-emerald-100"
              : "bg-rose-50 text-rose-600 border-rose-100"
            : "bg-blue-50 text-blue-600 border-blue-100"}
          onClick={auditReport ? () => setShowAuditModal(true) : undefined}
        />
        <KpiCard
          label="Đánh giá rủi ro"
          value={
            auditReport
              ? auditReport.isFraudDetected
                ? "Phát hiện sai lệch"
                : "An toàn (Khớp 100%)"
              : "—"
          }
          sub={auditReport ? "Nhấn để xem biên bản đối soát" : "Chạy đối soát để cập nhật"}
          icon={<ShieldCheck size={20} />}
          iconBg={auditReport
            ? auditReport.isFraudDetected
              ? "bg-rose-50 text-rose-600 border-rose-100"
              : "bg-emerald-50 text-emerald-600 border-emerald-100"
            : "bg-slate-50 text-slate-500 border-slate-100"}
          onClick={auditReport ? () => setShowAuditModal(true) : undefined}
        />
      </div>

      {/* ── 3. Tóm tắt Kiểm tra chuỗi khối (gọn gàng, nhấn để mở Modal chi tiết) ── */}
      {chainReport && (
        <div className={`rounded-xl border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs ${
          chainReport.isChainValid && !chainReport.isFraudDetected
            ? "bg-emerald-50/70 border-emerald-200"
            : "bg-rose-50/70 border-rose-200"
        }`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg shrink-0 ${
              chainReport.isChainValid && !chainReport.isFraudDetected
                ? "bg-emerald-100 text-emerald-700"
                : "bg-rose-100 text-rose-700"
            }`}>
              {chainReport.isChainValid && !chainReport.isFraudDetected ? <ShieldCheck size={18} /> : <AlertTriangle size={18} />}
            </div>
            <div>
              <div className={`text-xs font-bold ${
                chainReport.isChainValid && !chainReport.isFraudDetected ? "text-emerald-800" : "text-rose-800"
              }`}>
                {chainReport.isChainValid && !chainReport.isFraudDetected
                  ? "Chuỗi giao dịch toàn vẹn — Tất cả mắt xích SHA-256 & chữ ký ECDsa đều hợp lệ"
                  : `Cảnh báo: Phát hiện ${chainReport.anomalies?.length ?? 1} dấu hiệu bất thường trong chuỗi giao dịch`}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Đã quét {chainReport.totalEntriesScanned.toLocaleString()} mắt xích · {formatDate(chainReport.auditedAt)} · {chainReport.executionTimeMs}ms
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowChainModal(true)}
            className="px-3.5 py-1.5 text-xs font-bold rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-[#001743] shadow-2xs transition-colors shrink-0 cursor-pointer self-start sm:self-auto"
          >
            Xem chi tiết chuỗi khối →
          </button>
        </div>
      )}

      {/* ── 4. Tóm tắt Đối soát số dư (gọn gàng, nhấn để mở Modal chi tiết) ── */}
      {auditReport && (
        <div className={`rounded-xl border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs ${
          !auditReport.isFraudDetected
            ? "bg-emerald-50/70 border-emerald-200"
            : "bg-rose-50/70 border-rose-200"
        }`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg shrink-0 ${
              !auditReport.isFraudDetected
                ? "bg-emerald-100 text-emerald-700"
                : "bg-rose-100 text-rose-700"
            }`}>
              {!auditReport.isFraudDetected ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
            </div>
            <div>
              <div className={`text-xs font-bold ${
                !auditReport.isFraudDetected ? "text-emerald-800" : "text-rose-800"
              }`}>
                {!auditReport.isFraudDetected
                  ? "Đối soát thành công: Toàn bộ số dư ví cá nhân khớp 100% với Sổ cái kép"
                  : "Cảnh báo: Phát hiện sai lệch giữa số dư ví cá nhân và Sổ cái kép"}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                {sanitizeAlertMessage(auditReport.fraudAlertMessage) || `Kiểm tra ${auditReport.totalJournalsScanned} chứng từ · ${formatDate(auditReport.auditedAt)}`}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowAuditModal(true)}
            className="px-3.5 py-1.5 text-xs font-bold rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-[#001743] shadow-2xs transition-colors shrink-0 cursor-pointer self-start sm:self-auto"
          >
            Xem biên bản đối soát →
          </button>
        </div>
      )}

      <AdminFilterBar>
        <div className="grid grid-cols-1 gap-x-3 gap-y-3 sm:grid-cols-2 xl:grid-cols-12">
          <label className="admin-filter-field sm:col-span-2 xl:col-span-3">
            <span>Tìm kiếm</span>
            <Input.Search value={search} onChange={(event) => setSearch(event.target.value)} onSearch={(value) => { setDebouncedSearch(value.trim()); setPageIndex(1); }} allowClear placeholder="Mã phiếu, mô tả…" />
          </label>
          <label className="admin-filter-field xl:col-span-3">
            <span>Loại giao dịch</span>
            <Select value={typeFilter || undefined} onChange={(value) => { setTypeFilter(value || ""); setPageIndex(1); }} allowClear placeholder="Tất cả loại" options={Object.entries(LOAI_GIAO_DICH_LABELS).map(([value, label]) => ({ value, label }))} />
          </label>
          <label className="admin-filter-field xl:col-span-3">
            <span>Giá trị từ</span>
            <InputNumber min={0} value={minAmount ? Number(minAmount) : null} onChange={(value) => { setMinAmount(value == null ? "" : String(value)); setPageIndex(1); }} placeholder="0" className="w-full" controls={false} />
          </label>
          <label className="admin-filter-field xl:col-span-3">
            <span>Giá trị đến</span>
            <InputNumber min={0} value={maxAmount ? Number(maxAmount) : null} onChange={(value) => { setMaxAmount(value == null ? "" : String(value)); setPageIndex(1); }} placeholder="Không giới hạn" className="w-full" controls={false} />
          </label>
          <label className="admin-filter-field sm:col-span-2 xl:col-span-4">
            <span>Khoảng thời gian</span>
            <DatePicker.RangePicker value={fromDate || toDate ? [fromDate ? dayjs(fromDate) : null, toDate ? dayjs(toDate) : null] : null} onChange={(_, values) => { setFromDate(values[0]); setToDate(values[1]); setPageIndex(1); }} format="DD/MM/YYYY" className="w-full" />
          </label>
          <label className="admin-filter-field xl:col-span-4">
            <span>Sắp xếp</span>
            <Select value={sortBy} onChange={(value) => { setSortBy(value); setPageIndex(1); }} options={[
              { value: LedgerJournalSortBy.PostedAt, label: "Mới ghi sổ" },
              { value: LedgerJournalSortBy.CreatedDate, label: "Mới tạo" },
              { value: LedgerJournalSortBy.JournalCode, label: "Mã phiếu" },
              { value: LedgerJournalSortBy.TransactionType, label: "Loại nghiệp vụ" },
            ]} />
          </label>
          <div className="grid self-end grid-cols-2 gap-2 sm:col-span-2 xl:col-span-4">
            <Button block onClick={() => { setSearch(""); setDebouncedSearch(""); setTypeFilter(""); setMinAmount(""); setMaxAmount(""); setFromDate(""); setToDate(""); setSortBy(LedgerJournalSortBy.PostedAt); setPageIndex(1); }}>Xóa lọc</Button>
            <Button block type="primary" loading={journalLoading} onClick={() => fetchJournals()}>Áp dụng</Button>
          </div>
        </div>
      </AdminFilterBar>

      {journalError ? (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700">
          <span className="flex items-center gap-2"><AlertTriangle size={14} />{journalError}</span>
          <Button size="small" danger onClick={() => fetchJournals()}>Thử lại</Button>
        </div>
      ) : null}

      <AdminDataTable<LedgerJournalDto>
        rowKey="id"
        columns={journalColumns}
        dataSource={journals?.items || []}
        loading={journalLoading}
        title={() => (
          <div>
            <div className="text-sm font-bold text-[#001743]">Danh sách phiếu kế toán</div>
            <div className="mt-0.5 text-[11px] text-slate-400">{totalJournals.toLocaleString()} phiếu thu chi</div>
          </div>
        )}
        pagination={{
          current: pageIndex,
          pageSize,
          total: totalJournals,
          pageSizeOptions: [20, 50, 100],
          onChange: (page, size) => {
            setPageIndex(size !== pageSize ? 1 : page);
            setPageSize(size);
          },
        }}
        locale={{
          emptyText: (
            <div className="py-10 text-center">
              <FileSearch size={30} className="mx-auto mb-2 text-slate-300" />
              <div className="text-xs font-semibold text-[#001743]">Chưa có phiếu kế toán</div>
              <div className="mt-1 text-[11px] text-slate-400">Sổ cái sẽ cập nhật khi phát sinh giao dịch.</div>
            </div>
          ),
        }}
      />
    </div>
  );
}
