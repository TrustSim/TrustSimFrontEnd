import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { FileText } from "lucide-react";
import { walletService } from "@/services/walletService";
import { UnifiedWalletTransactionDto } from "@/types/wallet";
import { SortOrder, WalletTransactionSortBy } from "@/types/common";
import { ToastMessage } from "@/components/ui/Toast";
import { ProfileIcons as Icons } from "./ProfileIcons";

interface TransactionsTabProps {
  onOpenDeposit: () => void;
  onOpenWithdraw: () => void;
  addToast: (t: Omit<ToastMessage, "id">) => void;
  refreshTrigger?: number;
}

export default function TransactionsTab({
  onOpenDeposit,
  onOpenWithdraw,
  addToast,
  refreshTrigger,
}: TransactionsTabProps) {
  const [transactions, setTransactions] = useState<UnifiedWalletTransactionDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [pageIndex, setPageIndex] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [sourceFilter, setSourceFilter] = useState<"ALL" | "WALLET" | "AUCTION" | "AUCTION_DEPOSIT" | "ESCROW" | "COMPENSATION">("ALL");
  const [directionFilter, setDirectionFilter] = useState<"ALL" | "CREDIT" | "DEBIT" | "LOCK">("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PENDING" | "SUCCESS" | "FAILED">("ALL");
  const [keyword, setKeyword] = useState("");
  const [debouncedKeyword, setDebouncedKeyword] = useState("");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [sortOrder, setSortOrder] = useState<SortOrder>(SortOrder.Desc);

  const loadTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await walletService.getStatement({
        pageIndex,
        pageSize: 15,
        sourceType: sourceFilter !== "ALL" ? sourceFilter : undefined,
        direction: directionFilter !== "ALL" ? directionFilter : undefined,
        status: statusFilter !== "ALL" ? statusFilter : undefined,
        keyword: debouncedKeyword || undefined,
        minAmount: minAmount ? Number(minAmount) : undefined,
        maxAmount: maxAmount ? Number(maxAmount) : undefined,
        sortBy: WalletTransactionSortBy.CreatedAt,
        sortOrder,
      });
      setTransactions(res.items || []);
      setTotalPages(res.totalPages || 1);
    } catch (err: any) {
      addToast({
        type: "error",
        title: "Tải lịch sử giao dịch thất bại",
        message: err.message || "Vui lòng thử lại sau.",
      });
    } finally {
      setLoading(false);
    }
  }, [sourceFilter, directionFilter, statusFilter, debouncedKeyword, minAmount, maxAmount, sortOrder, pageIndex, addToast]);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedKeyword(keyword.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [keyword]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions, refreshTrigger]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
      case "SUCCESS":
        return { text: "Hoàn tất", bg: "#F0FDF4", color: "#16A34A", border: "#BBF7D0" };
      case "PENDING":
        return { text: "Đang xử lý", bg: "#FEF9C3", color: "#A16207", border: "#FEF08A" };
      case "FAILED":
        return { text: "Thất bại", bg: "#FEF2F2", color: "#DC2626", border: "#FECACA" };
      case "CANCELLED":
        return { text: "Đã hủy", bg: "#F3F4F6", color: "#6B7280", border: "#E5E7EB" };
      default:
        return { text: status, bg: "#F3F4F6", color: "#6B7280", border: "#E5E7EB" };
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "TOP_UP":
        return "Nạp tiền VietQR SePay";
      case "WITHDRAW":
        return "Rút tiền về ngân hàng";
      case "AUCTION_DEPOSIT_LOCK":
        return "Khóa cọc đấu giá";
      case "AUCTION_PROGRESSIVE_DEPOSIT_LOCK":
        return "Khóa cọc bổ sung";
      case "AUCTION_DEPOSIT_RELEASED":
        return "Hoàn cọc đấu giá";
      case "AUCTION_DEPOSIT_FORFEITED":
        return "Tịch thu cọc vi phạm";
      case "AUCTION_COMPENSATION":
        return "Tiền bồi thường đấu giá";
      case "ESCROW_HOLD":
        return "Tạm giữ tiền Escrow";
      case "ESCROW_REFUNDED":
        return "Hoàn tiền Escrow";
      case "SELLER_PAYOUT":
        return "Thanh toán cho người bán";
      case "PENALTY":
        return "Khấu trừ tiền phạt";
      default:
        return type;
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Action Header & Filters */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: "#001743", margin: 0 }}>
            Lịch sử biến động số dư ví
          </h2>
          <p style={{ fontSize: 12, color: "#6B7280", margin: 0, marginTop: 2 }}>
            Toàn bộ các giao dịch nạp, rút và biến động số dư tài khoản của bạn
          </p>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          {/* Filter Type */}
          <select
            value={sourceFilter}
            onChange={(e) => {
              setSourceFilter(e.target.value as typeof sourceFilter);
              setPageIndex(1);
            }}
            style={{
              padding: "7px 12px",
              fontSize: 12.5,
              fontWeight: 600,
              borderRadius: 6,
              border: "1px solid #D1D5DB",
              background: "#FFFFFF",
              color: "#374151",
              outline: "none",
            }}
          >
            <option value="ALL">Tất cả nguồn giao dịch</option>
            <option value="WALLET">Nạp/rút ngân hàng</option>
            <option value="AUCTION">Tất cả đấu giá</option>
            <option value="AUCTION_DEPOSIT">Tiền cọc đấu giá</option>
            <option value="ESCROW">Thanh toán Escrow</option>
            <option value="COMPENSATION">Tiền bồi thường</option>
          </select>

          <select value={directionFilter} onChange={(event) => { setDirectionFilter(event.target.value as typeof directionFilter); setPageIndex(1); }} aria-label="Lọc hướng dòng tiền" style={{ padding: "7px 12px", fontSize: 12.5, fontWeight: 600, borderRadius: 6, border: "1px solid #D1D5DB", background: "#FFFFFF", color: "#374151" }}>
            <option value="ALL">Tất cả thu/chi</option><option value="CREDIT">Tiền vào</option><option value="DEBIT">Tiền ra</option><option value="LOCK">Tạm khóa</option>
          </select>

          <select value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value as typeof statusFilter); setPageIndex(1); }} aria-label="Lọc trạng thái giao dịch" style={{ padding: "7px 12px", fontSize: 12.5, fontWeight: 600, borderRadius: 6, border: "1px solid #D1D5DB", background: "#FFFFFF", color: "#374151" }}>
            <option value="ALL">Tất cả trạng thái</option><option value="PENDING">Đang xử lý</option><option value="SUCCESS">Thành công</option><option value="FAILED">Thất bại</option>
          </select>

          {/* Filter Status */}
          <select
            value={sortOrder}
            onChange={(e) => {
              setSortOrder(Number(e.target.value) as SortOrder);
              setPageIndex(1);
            }}
            style={{
              padding: "7px 12px",
              fontSize: 12.5,
              fontWeight: 600,
              borderRadius: 6,
              border: "1px solid #D1D5DB",
              background: "#FFFFFF",
              color: "#374151",
              outline: "none",
            }}
          >
            <option value={SortOrder.Desc}>Mới nhất trước</option>
            <option value={SortOrder.Asc}>Cũ nhất trước</option>
          </select>

          {/* Action Buttons */}
          <Link
            href="/profile?tab=contracts"
            className="btn-outline"
            style={{ padding: "7px 14px", fontSize: 12.5, borderRadius: 6, display: "flex", alignItems: "center", gap: 5, textDecoration: "none", color: "#001743" }}
          >
            <FileText size={15} /> Tiến trình hợp đồng SIM
          </Link>
          <button
            type="button"
            onClick={onOpenDeposit}
            className="btn-red"
            style={{ padding: "7px 14px", fontSize: 12.5, borderRadius: 6, display: "flex", alignItems: "center", gap: 4 }}
          >
            <Icons.Plus size={15} /> Nạp tiền
          </button>
          <button
            type="button"
            onClick={onOpenWithdraw}
            className="btn-outline"
            style={{ padding: "7px 14px", fontSize: 12.5, borderRadius: 6, display: "flex", alignItems: "center", gap: 4 }}
          >
            <Icons.ArrowUpRight size={15} /> Rút tiền
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2 rounded-lg border border-slate-200 bg-white p-3 sm:grid-cols-3">
        <label className="text-xs font-semibold text-slate-600"><span className="mb-1 block">Tìm chứng từ hoặc nội dung</span><input value={keyword} onChange={(event) => { setKeyword(event.target.value); setPageIndex(1); }} placeholder="Mã tham chiếu, ghi chú…" className="min-h-10 w-full rounded-md border border-slate-300 px-3 text-sm font-normal outline-none focus:border-[#001743]" /></label>
        <label className="text-xs font-semibold text-slate-600"><span className="mb-1 block">Số tiền tối thiểu</span><input type="number" min={0} value={minAmount} onChange={(event) => { setMinAmount(event.target.value); setPageIndex(1); }} className="min-h-10 w-full rounded-md border border-slate-300 px-3 text-sm font-normal outline-none focus:border-[#001743]" /></label>
        <label className="text-xs font-semibold text-slate-600"><span className="mb-1 block">Số tiền tối đa</span><input type="number" min={0} value={maxAmount} onChange={(event) => { setMaxAmount(event.target.value); setPageIndex(1); }} className="min-h-10 w-full rounded-md border border-slate-300 px-3 text-sm font-normal outline-none focus:border-[#001743]" /></label>
      </div>

      {/* Transaction List Card */}
      <div style={{ background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: 8, overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: "#6B7280", fontSize: 13 }}>
            Đang tải dữ liệu giao dịch...
          </div>
        ) : transactions.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "#9CA3AF", fontSize: 13 }}>
            Không tìm thấy giao dịch nào phù hợp với bộ lọc.
          </div>
        ) : (
          <div>
            {transactions.map((tx) => {
              const isPlus = tx.direction === "CREDIT";
              const isLock = tx.direction === "LOCK";
              const badge = getStatusBadge(tx.status);
              const formattedDate = new Date(tx.createdAt).toLocaleString("vi-VN", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              });

              return (
                <div
                  key={tx.id}
                  style={{
                    padding: "16px 20px",
                    borderBottom: "1px solid #F3F4F6",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: 12,
                    transition: "background 0.15s ease",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "#F8FAFC"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "#FFFFFF"; }}
                >
                  {/* Left: Transaction Code & Description */}
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                    <div
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 8,
                        background: isPlus ? "#F0FDF4" : isLock ? "#FFFBEB" : "#FEF2F2",
                        color: isPlus ? "#16A34A" : isLock ? "#D97706" : "#DC2626",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        marginTop: 2,
                      }}
                    >
                      {isPlus ? <Icons.Plus size={16} /> : <Icons.ArrowUpRight size={16} />}
                    </div>

                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 14, fontWeight: 800, color: "#001743" }}>
                          {getTypeLabel(tx.transactionType)}
                        </span>
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            padding: "2px 6px",
                            borderRadius: 4,
                            background: badge.bg,
                            color: badge.color,
                            border: `1px solid ${badge.border}`,
                          }}
                        >
                          {badge.text}
                        </span>
                      </div>

                      <div style={{ fontSize: 12, color: "#6B7280", marginTop: 3 }}>
                        {tx.description || `Mã giao dịch: ${tx.referenceCode || tx.id}`}
                      </div>

                      <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 2 }}>
                        Mã: <strong style={{ fontFamily: "monospace" }}>{tx.referenceCode || tx.id}</strong> · {formattedDate}
                      </div>
                    </div>
                  </div>

                  {/* Right: Amount & Balance Changes */}
                  <div style={{ textAlign: "right" }}>
                    <div
                      style={{
                        fontSize: 17,
                        fontWeight: 900,
                        color: isPlus ? "#16A34A" : isLock ? "#D97706" : "#DC2626",
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {isPlus ? "+" : isLock ? "Giữ " : "-"}{tx.amount.toLocaleString("vi-VN")} ₫
                    </div>

                    {tx.balanceAfter !== undefined && (
                      <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 3 }}>
                        Số dư sau GD: <strong style={{ color: "#374151" }}>{tx.balanceAfter.toLocaleString("vi-VN")} ₫</strong>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div
                style={{
                  padding: "12px 20px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  background: "#F8F9FA",
                  borderTop: "1px solid #E5E7EB",
                  fontSize: 13,
                }}
              >
                <span style={{ color: "#6B7280" }}>
                  Trang <strong>{pageIndex}</strong> / {totalPages}
                </span>

                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    type="button"
                    disabled={pageIndex <= 1}
                    onClick={() => setPageIndex((p) => Math.max(1, p - 1))}
                    style={{
                      padding: "5px 12px",
                      borderRadius: 4,
                      border: "1px solid #D1D5DB",
                      background: pageIndex <= 1 ? "#E5E7EB" : "#FFFFFF",
                      color: pageIndex <= 1 ? "#9CA3AF" : "#374151",
                      cursor: pageIndex <= 1 ? "not-allowed" : "pointer",
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  >
                    ← Trước
                  </button>
                  <button
                    type="button"
                    disabled={pageIndex >= totalPages}
                    onClick={() => setPageIndex((p) => Math.min(totalPages, p + 1))}
                    style={{
                      padding: "5px 12px",
                      borderRadius: 4,
                      border: "1px solid #D1D5DB",
                      background: pageIndex >= totalPages ? "#E5E7EB" : "#FFFFFF",
                      color: pageIndex >= totalPages ? "#9CA3AF" : "#374151",
                      cursor: pageIndex >= totalPages ? "not-allowed" : "pointer",
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  >
                    Sau →
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
