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
    <div className="flex flex-col gap-6">
      {/* ── 1. Action Header & Primary Buttons ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-100">
        <div>
          <h2 className="text-xl font-extrabold text-[#001743] m-0 tracking-tight">
            Lịch sử biến động số dư ví
          </h2>
          <p className="text-xs text-slate-500 m-0 mt-1">
            Toàn bộ các giao dịch nạp, rút và biến động số dư tài khoản của bạn trên nền tảng
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap shrink-0">
          <Link
            href="/profile?tab=contracts"
            className="rounded-full bg-slate-100 hover:bg-slate-200 text-[#001743] border border-slate-200/80 px-4 py-2 text-xs font-bold inline-flex items-center gap-1.5 transition-all shadow-2xs"
          >
            <FileText size={14} />
            <span>Tiến trình hợp đồng</span>
          </Link>
          <button
            type="button"
            onClick={onOpenDeposit}
            className="rounded-full bg-[#001743] hover:bg-[#002875] text-white px-4 py-2 text-xs font-bold inline-flex items-center gap-1.5 shadow-md shadow-navy-950/15 transition-all active:scale-95 cursor-pointer"
          >
            <Icons.Plus size={14} />
            <span>Nạp tiền ví</span>
          </button>
          <button
            type="button"
            onClick={onOpenWithdraw}
            className="rounded-full bg-white hover:bg-slate-50 text-[#001743] border border-slate-200 px-4 py-2 text-xs font-bold inline-flex items-center gap-1.5 shadow-2xs hover:shadow-xs transition-all active:scale-95 cursor-pointer"
          >
            <Icons.ArrowUpRight size={14} />
            <span>Rút tiền</span>
          </button>
        </div>
      </div>

      {/* ── 2. Filters & Search Box ── */}
      <div className="rounded-[24px] border border-slate-100/90 bg-white p-5 shadow-[0_8px_30px_rgb(0,0,0,0.03)] space-y-3.5">
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Filter Source */}
          <select
            value={sourceFilter}
            onChange={(e) => {
              setSourceFilter(e.target.value as typeof sourceFilter);
              setPageIndex(1);
            }}
            aria-label="Lọc nguồn giao dịch"
            className="rounded-full px-4 py-2 text-xs font-bold border border-slate-200 bg-white text-slate-700 outline-none hover:border-slate-300 focus:border-[#001743] transition-colors cursor-pointer shadow-2xs"
          >
            <option value="ALL">Tất cả nguồn giao dịch</option>
            <option value="WALLET">Nạp / Rút ngân hàng</option>
            <option value="AUCTION">Tất cả đấu giá</option>
            <option value="AUCTION_DEPOSIT">Tiền cọc đấu giá</option>
            <option value="ESCROW">Thanh toán Escrow</option>
            <option value="COMPENSATION">Tiền bồi thường</option>
          </select>

          <select
            value={directionFilter}
            onChange={(e) => {
              setDirectionFilter(e.target.value as typeof directionFilter);
              setPageIndex(1);
            }}
            aria-label="Lọc hướng dòng tiền"
            className="rounded-full px-4 py-2 text-xs font-bold border border-slate-200 bg-white text-slate-700 outline-none hover:border-slate-300 focus:border-[#001743] transition-colors cursor-pointer shadow-2xs"
          >
            <option value="ALL">Tất cả thu / chi</option>
            <option value="CREDIT">Tiền vào (+)</option>
            <option value="DEBIT">Tiền ra (-)</option>
            <option value="LOCK">Tạm khóa giữ</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as typeof statusFilter);
              setPageIndex(1);
            }}
            aria-label="Lọc trạng thái giao dịch"
            className="rounded-full px-4 py-2 text-xs font-bold border border-slate-200 bg-white text-slate-700 outline-none hover:border-slate-300 focus:border-[#001743] transition-colors cursor-pointer shadow-2xs"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="PENDING">Đang xử lý</option>
            <option value="SUCCESS">Thành công</option>
            <option value="FAILED">Thất bại</option>
          </select>

          <select
            value={sortOrder}
            onChange={(e) => {
              setSortOrder(Number(e.target.value) as SortOrder);
              setPageIndex(1);
            }}
            aria-label="Sắp xếp thời gian"
            className="rounded-full px-4 py-2 text-xs font-bold border border-slate-200 bg-white text-slate-700 outline-none hover:border-slate-300 focus:border-[#001743] transition-colors cursor-pointer shadow-2xs ml-auto"
          >
            <option value={SortOrder.Desc}>Mới nhất trước</option>
            <option value={SortOrder.Asc}>Cũ nhất trước</option>
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
          <input
            value={keyword}
            onChange={(e) => {
              setKeyword(e.target.value);
              setPageIndex(1);
            }}
            placeholder="Tìm theo mã tham chiếu, ghi chú..."
            className="rounded-full border border-slate-200 bg-slate-50/50 px-4 py-2 text-xs text-slate-800 outline-none focus:bg-white focus:border-[#001743] focus:ring-2 focus:ring-[#001743]/10 transition-all font-medium"
          />
          <input
            type="number"
            min={0}
            value={minAmount}
            onChange={(e) => {
              setMinAmount(e.target.value);
              setPageIndex(1);
            }}
            placeholder="Số tiền tối thiểu (VNĐ)"
            className="rounded-full border border-slate-200 bg-slate-50/50 px-4 py-2 text-xs text-slate-800 outline-none focus:bg-white focus:border-[#001743] focus:ring-2 focus:ring-[#001743]/10 transition-all font-medium font-mono tabular-nums"
          />
          <input
            type="number"
            min={0}
            value={maxAmount}
            onChange={(e) => {
              setMaxAmount(e.target.value);
              setPageIndex(1);
            }}
            placeholder="Số tiền tối đa (VNĐ)"
            className="rounded-full border border-slate-200 bg-slate-50/50 px-4 py-2 text-xs text-slate-800 outline-none focus:bg-white focus:border-[#001743] focus:ring-2 focus:ring-[#001743]/10 transition-all font-medium font-mono tabular-nums"
          />
        </div>
      </div>

      {/* ── 3. Transaction List Card ── */}
      <div className="rounded-[28px] border border-slate-100/90 bg-white overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        {loading ? (
          <div className="py-16 text-center text-slate-500 text-xs">
            <span className="w-5 h-5 border-2 border-[#001743]/30 border-t-[#001743] rounded-full animate-spin inline-block mr-2 align-middle" />
            Đang tải dữ liệu giao dịch...
          </div>
        ) : transactions.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs">
            Không tìm thấy giao dịch nào phù hợp với bộ lọc hiện tại.
          </div>
        ) : (
          <div>
            <div className="divide-y divide-slate-100">
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
                    className="p-4 sm:p-5 flex items-center justify-between flex-wrap gap-3 hover:bg-slate-50/70 transition-colors"
                  >
                    {/* Left: Transaction Code & Description */}
                    <div className="flex items-start gap-3.5 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 mt-0.5 ${
                          isPlus
                            ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                            : isLock
                            ? "bg-amber-50 text-amber-600 border border-amber-100"
                            : "bg-rose-50 text-rose-600 border border-rose-100"
                        }`}
                      >
                        {isPlus ? <Icons.Plus size={18} /> : <Icons.ArrowUpRight size={18} />}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-bold text-[#001743]">
                            {getTypeLabel(tx.transactionType)}
                          </span>
                          <span
                            className="text-[10px] font-bold px-2.5 py-0.5 rounded-full"
                            style={{
                              background: badge.bg,
                              color: badge.color,
                              border: `1px solid ${badge.border}`,
                            }}
                          >
                            {badge.text}
                          </span>
                        </div>

                        <div className="text-xs text-slate-500 mt-1 truncate max-w-md">
                          {tx.description || `Mã giao dịch: ${tx.referenceCode || tx.id}`}
                        </div>

                        <div className="text-[11px] text-slate-400 mt-0.5">
                          Mã: <strong className="font-mono text-slate-600">{tx.referenceCode || tx.id}</strong> · {formattedDate}
                        </div>
                      </div>
                    </div>

                    {/* Right: Amount & Balance Changes */}
                    <div className="text-right shrink-0">
                      <div
                        className={`text-base sm:text-lg font-black font-mono tabular-nums ${
                          isPlus ? "text-emerald-600" : isLock ? "text-amber-600" : "text-rose-600"
                        }`}
                      >
                        {isPlus ? "+" : isLock ? "Giữ " : "-"}{tx.amount.toLocaleString("vi-VN")} ₫
                      </div>

                      {tx.balanceAfter !== undefined && (
                        <div className="text-[11px] text-slate-400 mt-1 font-mono tabular-nums">
                          Số dư sau GD: <strong className="text-slate-700">{tx.balanceAfter.toLocaleString("vi-VN")} ₫</strong>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="p-4 px-6 flex items-center justify-between bg-slate-50/60 border-t border-slate-100 text-xs">
                <span className="text-slate-500">
                  Trang <strong className="text-[#001743]">{pageIndex}</strong> / {totalPages}
                </span>

                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={pageIndex <= 1}
                    onClick={() => setPageIndex((p) => Math.max(1, p - 1))}
                    className="rounded-full px-4 py-1.5 border border-slate-200 bg-white text-slate-700 font-bold hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs transition-all cursor-pointer text-xs"
                  >
                    ← Trước
                  </button>
                  <button
                    type="button"
                    disabled={pageIndex >= totalPages}
                    onClick={() => setPageIndex((p) => Math.min(totalPages, p + 1))}
                    className="rounded-full px-4 py-1.5 border border-slate-200 bg-white text-slate-700 font-bold hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs transition-all cursor-pointer text-xs"
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
