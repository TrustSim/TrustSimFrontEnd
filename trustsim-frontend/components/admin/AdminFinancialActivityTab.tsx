"use client";

import { useCallback, useEffect, useState } from "react";
import { RefreshCw, WalletCards } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminDataPrimitives";
import { Pagination } from "@/components/ui/Pagination";
import { walletService } from "@/services/walletService";
import type { LedgerJournalDto, WalletTransactionDto } from "@/types/wallet";

type ViewMode = "REVENUE" | "TRANSACTIONS" | "WITHDRAWALS";

const formatVnd = (value: number) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(value || 0);

export function AdminFinancialActivityTab() {
  const [mode, setMode] = useState<ViewMode>("REVENUE");
  const [rows, setRows] = useState<Array<LedgerJournalDto | WalletTransactionDto>>([]);
  const [loading, setLoading] = useState(true);
  const [pageIndex, setPageIndex] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [totalCount, setTotalCount] = useState(0);
  const [keyword, setKeyword] = useState("");
  const [userId, setUserId] = useState("");
  const [walletId, setWalletId] = useState("");
  const [status, setStatus] = useState("");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [revenueType, setRevenueType] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      if (mode === "REVENUE") {
        const result = await walletService.adminGetRevenueHistory({ pageIndex, pageSize, keyword: keyword.trim() || undefined, transactionType: revenueType as "ESCROW_RELEASE" | "AUCTION_DEPOSIT_FORFEITED" | "ADMIN_PROFIT_WITHDRAW" || undefined, sortOrder: "Desc" });
        setRows(result.items); setTotalCount(result.totalCount);
      } else if (mode === "WITHDRAWALS") {
        const result = await walletService.adminGetWithdrawals({ pageIndex, pageSize, keyword: keyword.trim() || undefined, userId: userId.trim() || undefined, walletId: walletId.trim() || undefined, status: status as "PENDING" | "SUCCESS" | "FAILED" || undefined, minAmount: minAmount ? Number(minAmount) : undefined, maxAmount: maxAmount ? Number(maxAmount) : undefined, sortOrder: "Desc" });
        setRows(result.items); setTotalCount(result.totalCount);
      } else {
        const result = await walletService.adminGetAllTransactions({ pageIndex, pageSize, keyword: keyword.trim() || undefined, userId: userId.trim() || undefined, walletId: walletId.trim() || undefined, status: (status || undefined) as "PENDING" | "SUCCESS" | "FAILED" | undefined, minAmount: minAmount ? Number(minAmount) : undefined, maxAmount: maxAmount ? Number(maxAmount) : undefined, sortOrder: "Desc" });
        setRows(result.items); setTotalCount(result.totalCount);
      }
    } finally { setLoading(false); }
  }, [mode, pageIndex, pageSize, keyword, userId, walletId, status, minAmount, maxAmount, revenueType]);

  useEffect(() => { void loadData(); }, [loadData]);

  return <div className="admin-tab space-y-4">
    <AdminPageHeader title="Dòng tiền & doanh thu sàn" description="Tra cứu doanh thu, giao dịch ví và yêu cầu rút theo đúng phân trang backend." badge={`${totalCount} bản ghi`} actions={<button type="button" onClick={() => void loadData()} disabled={loading} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-[#001743] disabled:opacity-50"><RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />Làm mới</button>} />
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
      <div className="mb-4 flex flex-wrap gap-2" role="tablist">{([['REVENUE','Doanh thu sàn'],['TRANSACTIONS','Giao dịch ví'],['WITHDRAWALS','Yêu cầu rút']] as const).map(([value,label]) => <button key={value} type="button" role="tab" aria-selected={mode === value} onClick={() => { setMode(value); setPageIndex(1); }} className={`min-h-10 rounded-lg px-4 text-xs font-semibold ${mode === value ? "bg-[#001743] text-white" : "border border-slate-200 bg-white text-slate-600"}`}>{label}</button>)}</div>
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-4">
        <input value={keyword} onChange={(event) => { setKeyword(event.target.value); setPageIndex(1); }} placeholder="Mã chứng từ, nội dung…" className="min-h-10 rounded-lg border border-slate-200 px-3 text-xs" />
        {mode === "REVENUE" ? <select value={revenueType} onChange={(event) => { setRevenueType(event.target.value); setPageIndex(1); }} className="min-h-10 rounded-lg border border-slate-200 bg-white px-3 text-xs"><option value="">Tất cả nguồn doanh thu</option><option value="ESCROW_RELEASE">Phí giao dịch Escrow</option><option value="AUCTION_DEPOSIT_FORFEITED">Tịch thu cọc</option><option value="ADMIN_PROFIT_WITHDRAW">Admin rút doanh thu</option></select> : <><input value={userId} onChange={(event) => { setUserId(event.target.value); setPageIndex(1); }} placeholder="User ID" className="min-h-10 rounded-lg border border-slate-200 px-3 text-xs" /><input value={walletId} onChange={(event) => { setWalletId(event.target.value); setPageIndex(1); }} placeholder="Wallet ID" className="min-h-10 rounded-lg border border-slate-200 px-3 text-xs" /><select value={status} onChange={(event) => { setStatus(event.target.value); setPageIndex(1); }} className="min-h-10 rounded-lg border border-slate-200 bg-white px-3 text-xs"><option value="">Tất cả trạng thái</option><option value="PENDING">Đang xử lý</option><option value="SUCCESS">Thành công</option><option value="FAILED">Thất bại</option></select><input type="number" min={0} value={minAmount} onChange={(event) => { setMinAmount(event.target.value); setPageIndex(1); }} placeholder="Số tiền từ" className="min-h-10 rounded-lg border border-slate-200 px-3 text-xs" /><input type="number" min={0} value={maxAmount} onChange={(event) => { setMaxAmount(event.target.value); setPageIndex(1); }} placeholder="Số tiền đến" className="min-h-10 rounded-lg border border-slate-200 px-3 text-xs" /></>}
      </div>
    </section>
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs"><div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-xs"><thead className="border-b border-slate-200 bg-slate-50 text-slate-500"><tr><th className="px-4 py-3">Thời gian</th><th className="px-4 py-3">Mã / loại nghiệp vụ</th><th className="px-4 py-3">Nội dung</th><th className="px-4 py-3 text-right">Số tiền</th><th className="px-4 py-3">Trạng thái</th></tr></thead><tbody className="divide-y divide-slate-100">{loading ? <tr><td colSpan={5} className="px-4 py-16 text-center text-slate-500">Đang tải dữ liệu tài chính…</td></tr> : rows.length === 0 ? <tr><td colSpan={5} className="px-4 py-16 text-center text-slate-500"><WalletCards className="mx-auto mb-2 size-5" />Không có bản ghi phù hợp.</td></tr> : rows.map((row) => { const isJournal = 'journalCode' in row; return <tr key={row.id} className="hover:bg-slate-50"><td className="whitespace-nowrap px-4 py-3">{new Date(isJournal ? row.postedAt : row.createdAt).toLocaleString('vi-VN')}</td><td className="px-4 py-3"><strong className="block text-[#001743]">{isJournal ? row.journalCode : row.transactionCode}</strong><span className="text-[10px] text-slate-500">{isJournal ? row.transactionTypeName || row.transactionType : row.walletTransactionType}</span></td><td className="px-4 py-3 text-slate-600">{row.description || '—'}</td><td className="px-4 py-3 text-right font-mono font-bold text-[#001743]">{formatVnd(isJournal ? row.totalAmount : row.amount)}</td><td className="px-4 py-3">{isJournal ? row.statusName || row.status : row.transactionStatus}</td></tr>; })}</tbody></table></div><Pagination pageIndex={pageIndex} pageSize={pageSize} totalCount={totalCount} onPageChange={setPageIndex} onPageSizeChange={(size) => { setPageSize(size); setPageIndex(1); }} /></section>
  </div>;
}
