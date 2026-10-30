"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { App, Button, Input, InputNumber, Segmented, Select, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import { RefreshCw } from "lucide-react";
import { AdminDataTable, AdminFilterBar, AdminPageHeader } from "@/components/admin/AdminDataPrimitives";
import { walletService } from "@/services/walletService";
import type { LedgerJournalDto, WalletTransactionDto } from "@/types/wallet";

type ViewMode = "REVENUE" | "TRANSACTIONS" | "WITHDRAWALS";
type FinancialRow = LedgerJournalDto | WalletTransactionDto;

const formatVnd = (value: number) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(value || 0);
const isJournal = (row: FinancialRow): row is LedgerJournalDto => "journalCode" in row;

function statusColor(value: unknown) {
  const status = String(value || "").toUpperCase();
  if (["SUCCESS", "COMPLETED", "POSTED"].some((item) => status.includes(item))) return "success";
  if (["FAILED", "REJECTED", "CANCELLED"].some((item) => status.includes(item))) return "error";
  if (["PENDING", "PROCESSING"].some((item) => status.includes(item))) return "processing";
  return "default";
}

export function AdminFinancialActivityTab() {
  const { message } = App.useApp();
  const [mode, setMode] = useState<ViewMode>("REVENUE");
  const [rows, setRows] = useState<FinancialRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageIndex, setPageIndex] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [totalCount, setTotalCount] = useState(0);
  const [keyword, setKeyword] = useState("");
  const [debouncedKeyword, setDebouncedKeyword] = useState("");
  const [userId, setUserId] = useState("");
  const [walletId, setWalletId] = useState("");
  const [status, setStatus] = useState("");
  const [minAmount, setMinAmount] = useState<number | null>(null);
  const [maxAmount, setMaxAmount] = useState<number | null>(null);
  const [revenueType, setRevenueType] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => { setDebouncedKeyword(keyword.trim()); setPageIndex(1); }, 300);
    return () => window.clearTimeout(timer);
  }, [keyword]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      if (mode === "REVENUE") {
        const result = await walletService.adminGetRevenueHistory({ pageIndex, pageSize, keyword: debouncedKeyword || undefined, transactionType: revenueType as "ESCROW_RELEASE" | "AUCTION_DEPOSIT_FORFEITED" | "ADMIN_PROFIT_WITHDRAW" || undefined, sortOrder: "Desc" });
        setRows(result.items);
        setTotalCount(result.totalCount);
      } else if (mode === "WITHDRAWALS") {
        const result = await walletService.adminGetWithdrawals({ pageIndex, pageSize, keyword: debouncedKeyword || undefined, userId: userId.trim() || undefined, walletId: walletId.trim() || undefined, status: status as "PENDING" | "SUCCESS" | "FAILED" || undefined, minAmount: minAmount ?? undefined, maxAmount: maxAmount ?? undefined, sortOrder: "Desc" });
        setRows(result.items);
        setTotalCount(result.totalCount);
      } else {
        const result = await walletService.adminGetAllTransactions({ pageIndex, pageSize, keyword: debouncedKeyword || undefined, userId: userId.trim() || undefined, walletId: walletId.trim() || undefined, status: (status || undefined) as "PENDING" | "SUCCESS" | "FAILED" | undefined, minAmount: minAmount ?? undefined, maxAmount: maxAmount ?? undefined, sortOrder: "Desc" });
        setRows(result.items);
        setTotalCount(result.totalCount);
      }
    } catch {
      void message.error("Không thể tải dữ liệu tài chính.");
    } finally {
      setLoading(false);
    }
  }, [debouncedKeyword, maxAmount, message, minAmount, mode, pageIndex, pageSize, revenueType, status, userId, walletId]);

  useEffect(() => { void loadData(); }, [loadData]);

  const columns = useMemo<ColumnsType<FinancialRow>>(() => [
    {
      title: "Thời gian",
      key: "time",
      width: 164,
      render: (_, row) => <span className="whitespace-nowrap">{new Date(isJournal(row) ? row.postedAt : row.createdAt).toLocaleString("vi-VN")}</span>,
    },
    {
      title: "Mã / loại nghiệp vụ",
      key: "code",
      width: 230,
      render: (_, row) => <div><strong className="block text-xs text-[var(--admin-ink)]">{isJournal(row) ? row.journalCode : row.transactionCode}</strong><span className="text-[11px] text-slate-500">{isJournal(row) ? row.transactionTypeName || row.transactionType : row.walletTransactionType}</span></div>,
    },
    {
      title: "Nội dung",
      dataIndex: "description",
      key: "description",
      ellipsis: true,
      render: (value) => value || "—",
    },
    {
      title: "Số tiền",
      key: "amount",
      width: 168,
      align: "right",
      render: (_, row) => <strong className="whitespace-nowrap font-mono text-xs text-[var(--admin-ink)]">{formatVnd(isJournal(row) ? row.totalAmount : row.amount)}</strong>,
    },
    {
      title: "Trạng thái",
      key: "status",
      width: 140,
      render: (_, row) => {
        const value = isJournal(row) ? row.statusName || row.status : row.transactionStatus;
        return <Tag color={statusColor(value)}>{String(value)}</Tag>;
      },
    },
  ], []);

  const changeMode = (value: ViewMode) => {
    setMode(value);
    setPageIndex(1);
    setStatus("");
    setRevenueType("");
  };

  return (
    <div className="admin-tab space-y-4">
      <AdminPageHeader
        title="Dòng tiền & doanh thu sàn"
        description="Tra cứu doanh thu, giao dịch ví và yêu cầu rút theo phân trang backend."
        badge={`${totalCount} bản ghi`}
        actions={<Button onClick={() => void loadData()} loading={loading} icon={<RefreshCw size={14} aria-hidden="true" />}>Làm mới</Button>}
      />

      <AdminFilterBar>
        <Segmented<ViewMode>
          block
          className="mb-4 max-w-2xl"
          value={mode}
          onChange={changeMode}
          options={[{ value: "REVENUE", label: "Doanh thu sàn" }, { value: "TRANSACTIONS", label: "Giao dịch ví" }, { value: "WITHDRAWALS", label: "Yêu cầu rút" }]}
        />
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          <label className="admin-filter-field xl:col-span-2"><span>Tìm kiếm</span><Input allowClear value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="Mã chứng từ hoặc nội dung" /></label>
          {mode === "REVENUE" ? (
            <label className="admin-filter-field xl:col-span-2"><span>Nguồn doanh thu</span><Select allowClear value={revenueType || undefined} placeholder="Tất cả nguồn doanh thu" onChange={(value) => { setRevenueType(value || ""); setPageIndex(1); }} options={[{ value: "ESCROW_RELEASE", label: "Phí giao dịch Escrow" }, { value: "AUCTION_DEPOSIT_FORFEITED", label: "Tịch thu cọc" }, { value: "ADMIN_PROFIT_WITHDRAW", label: "Admin rút doanh thu" }]} /></label>
          ) : (
            <>
              <label className="admin-filter-field"><span>User ID</span><Input allowClear value={userId} onChange={(event) => { setUserId(event.target.value); setPageIndex(1); }} /></label>
              <label className="admin-filter-field"><span>Wallet ID</span><Input allowClear value={walletId} onChange={(event) => { setWalletId(event.target.value); setPageIndex(1); }} /></label>
              <label className="admin-filter-field"><span>Trạng thái</span><Select allowClear value={status || undefined} placeholder="Tất cả trạng thái" onChange={(value) => { setStatus(value || ""); setPageIndex(1); }} options={[{ value: "PENDING", label: "Đang xử lý" }, { value: "SUCCESS", label: "Thành công" }, { value: "FAILED", label: "Thất bại" }]} /></label>
              <label className="admin-filter-field"><span>Số tiền từ</span><InputNumber min={0} value={minAmount} onChange={(value) => { setMinAmount(value); setPageIndex(1); }} formatter={(value) => new Intl.NumberFormat("vi-VN").format(Number(value || 0))} /></label>
              <label className="admin-filter-field"><span>Số tiền đến</span><InputNumber min={0} value={maxAmount} onChange={(value) => { setMaxAmount(value); setPageIndex(1); }} formatter={(value) => new Intl.NumberFormat("vi-VN").format(Number(value || 0))} /></label>
            </>
          )}
        </div>
      </AdminFilterBar>

      <AdminDataTable<FinancialRow>
        rowKey="id"
        loading={loading}
        columns={columns}
        dataSource={rows}
        pagination={{ current: pageIndex, pageSize, total: totalCount, onChange: (page, size) => { setPageIndex(page); setPageSize(size); } }}
      />
    </div>
  );
}
