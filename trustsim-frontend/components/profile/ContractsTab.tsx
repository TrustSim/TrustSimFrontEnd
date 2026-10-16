"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { tradeService } from "@/services/tradeService";
import { formatPhoneNumber } from "@/services/simService";
import {
  TradeTransactionDto,
  TradeTransactionStatus,
  EscrowStatus,
} from "@/types/trade";
import { ToastMessage } from "@/components/ui/Toast";
import {
  FileText,
  Search,
  RefreshCw,
  Copy,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  X,
  ChevronRight,
  ArrowRight,
  Lock,
  User,
  Smartphone,
  CreditCard,
  Building,
  Check,
  ArrowUpRight,
} from "lucide-react";

interface ContractsTabProps {
  addToast: (t: Omit<ToastMessage, "id">) => void;
}

export default function ContractsTab({ addToast }: ContractsTabProps) {
  const [trades, setTrades] = useState<TradeTransactionDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [pageIndex, setPageIndex] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);

  // Filters & Search
  const [searchKeyword, setSearchKeyword] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Detail Modal State
  const [selectedTrade, setSelectedTrade] = useState<TradeTransactionDto | null>(
    null
  );

  const fetchTrades = useCallback(async () => {
    setLoading(true);
    try {
      const statusParam =
        statusFilter !== "ALL"
          ? (statusFilter as TradeTransactionStatus)
          : undefined;

      const res = await tradeService.getMyTrades({
        status: statusParam,
        pageIndex,
        pageSize: 15,
      });

      setTrades(res.items || []);
      setTotalPages(res.totalPages || 1);
      setTotalCount(res.totalCount || 0);
    } catch (err: any) {
      addToast({
        type: "error",
        title: "Tải hợp đồng thất bại",
        message: err.message || "Vui lòng thử lại sau.",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [statusFilter, pageIndex, addToast]);

  useEffect(() => {
    fetchTrades();
  }, [fetchTrades]);

  const handleManualRefresh = async () => {
    setRefreshing(true);
    await fetchTrades();
    addToast({
      type: "success",
      title: "Đã làm mới",
      message: "Dữ liệu hợp đồng chuyển nhượng đã được cập nhật.",
    });
  };

  // Copy to clipboard helper
  const handleCopy = (text: string, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    addToast({
      type: "success",
      title: "Đã sao chép",
      message: `Đã sao chép ${label} vào bộ nhớ tạm.`,
    });
  };

  // Filtered by search keyword on client side
  const filteredTrades = useMemo(() => {
    if (!searchKeyword.trim()) return trades;
    const kw = searchKeyword.trim().toLowerCase();
    return trades.filter(
      (t) =>
        t.tradeTransactionCode.toLowerCase().includes(kw) ||
        t.simPhoneNumber.replace(/\D/g, "").includes(kw.replace(/\D/g, "")) ||
        t.buyerName?.toLowerCase().includes(kw) ||
        t.sellerName?.toLowerCase().includes(kw)
    );
  }, [trades, searchKeyword]);

  // Compute summary stats from current trade list
  const summaryStats = useMemo(() => {
    const total = totalCount || trades.length;
    const active = trades.filter(
      (t) =>
        t.status === "PendingEscrow" ||
        t.status === "PendingSignature" ||
        t.status === "PendingTransfer"
    ).length;
    const completed = trades.filter((t) => t.status === "Completed").length;
    const totalEscrow = trades.reduce(
      (acc, t) => acc + (t.escrowAmount || 0),
      0
    );

    return { total, active, completed, totalEscrow };
  }, [totalCount, trades]);

  // Escrow status badge mapping
  const getEscrowBadge = (status: EscrowStatus) => {
    switch (status) {
      case "HELD":
        return {
          text: "Đã giữ tiền ký quỹ",
          bg: "#EFF6FF",
          color: "#2563EB",
          border: "#BFDBFE",
        };
      case "RELEASED":
      case "RELEASED_TO_SELLER":
        return {
          text: "Đã giải ngân người bán",
          bg: "#F0FDF4",
          color: "#16A34A",
          border: "#BBF7D0",
        };
      case "REFUNDED":
      case "REFUNDED_TO_BUYER":
        return {
          text: "Đã hoàn trả người mua",
          bg: "#FEF2F2",
          color: "#DC2626",
          border: "#FECACA",
        };
      case "FROZEN":
        return {
          text: "Đang đóng băng tranh chấp",
          bg: "#FEF2F2",
          color: "#991B1B",
          border: "#FCA5A5",
        };
      case "CANCELLED":
        return {
          text: "Đã hủy ký quỹ",
          bg: "#F3F4F6",
          color: "#6B7280",
          border: "#E5E7EB",
        };
      case "PENDING_FUNDING":
      default:
        return {
          text: "Chờ nộp tiền ký quỹ",
          bg: "#FEF9C3",
          color: "#854D0E",
          border: "#FEF08A",
        };
    }
  };

  // Transaction Status badge mapping
  const getTradeStatusBadge = (status: TradeTransactionStatus) => {
    switch (status) {
      case "PendingEscrow":
        return {
          text: "Chờ nộp ký quỹ",
          bg: "#FEF9C3",
          color: "#854D0E",
          border: "#FEF08A",
          step: 1,
        };
      case "PendingSignature":
        return {
          text: "Chờ ký hợp đồng số",
          bg: "#EFF6FF",
          color: "#2563EB",
          border: "#BFDBFE",
          step: 2,
        };
      case "PendingTransfer":
        return {
          text: "Đang sang tên nhà mạng",
          bg: "#FAF5FF",
          color: "#9333EA",
          border: "#E9D5FF",
          step: 3,
        };
      case "Completed":
        return {
          text: "Giao dịch hoàn tất",
          bg: "#F0FDF4",
          color: "#16A34A",
          border: "#BBF7D0",
          step: 4,
        };
      case "Disputed":
        return {
          text: "Đang khiếu nại tranh chấp",
          bg: "#FEF2F2",
          color: "#DC2626",
          border: "#FECACA",
          step: 0,
        };
      default:
        if (typeof status === "string" && status.includes("Cancelled")) {
          return {
            text: "Đã hủy giao dịch",
            bg: "#F3F4F6",
            color: "#6B7280",
            border: "#E5E7EB",
            step: 0,
          };
        }
        return {
          text: status || "Đang xử lý",
          bg: "#F8FAFC",
          color: "#475569",
          border: "#E2E8F0",
          step: 1,
        };
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* ── Top Header Section ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-[#001743] m-0">
            Hợp đồng chuyển nhượng & Ký quỹ bảo đảm
          </h2>
          <p className="text-xs text-slate-500 m-0 mt-0.5">
            Tài khoản bảo chứng trung gian Escrow bảo vệ an toàn 100% tài chính cho cả bên mua và bên bán
          </p>
        </div>

        <button
          type="button"
          onClick={handleManualRefresh}
          disabled={refreshing}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-[#001743] shadow-2xs transition-colors cursor-pointer self-start sm:self-auto disabled:opacity-60"
        >
          <RefreshCw
            size={13}
            className={`text-slate-600 ${refreshing ? "animate-spin" : ""}`}
          />
          <span>{refreshing ? "Đang đồng bộ..." : "Đồng bộ hợp đồng"}</span>
        </button>
      </div>

      {/* ── KPI Overview Summary Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-[#E2E8F0] rounded-[8px] p-4 shadow-2xs">
          <div className="text-xs text-slate-500 font-semibold mb-1">
            Tổng hợp đồng
          </div>
          <div className="text-xl font-black text-[#001743] font-mono tabular-nums">
            {summaryStats.total} <span className="text-sm font-bold">hồ sơ</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Tất cả giao dịch trên hệ thống
          </div>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-[8px] p-4 shadow-2xs">
          <div className="text-xs text-slate-500 font-semibold mb-1">
            Đang ký quỹ & sang tên
          </div>
          <div className="text-xl font-black text-blue-600 font-mono tabular-nums">
            {summaryStats.active} <span className="text-sm font-bold">hồ sơ</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Đang trong tiến trình chuyển giao
          </div>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-[8px] p-4 shadow-2xs">
          <div className="text-xs text-slate-500 font-semibold mb-1">
            Hoàn tất thành công
          </div>
          <div className="text-xl font-black text-emerald-600 font-mono tabular-nums">
            {summaryStats.completed} <span className="text-sm font-bold">hồ sơ</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Đã chuyển giao SIM & giải ngân
          </div>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-[8px] p-4 shadow-2xs">
          <div className="text-xs text-slate-500 font-semibold mb-1">
            Tổng giá trị ký quỹ
          </div>
          <div className="text-xl font-black text-[#E4011E] font-mono tabular-nums">
            {summaryStats.totalEscrow.toLocaleString("vi-VN")}{" "}
            <span className="text-sm font-bold">₫</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Được bảo hiểm giao dịch 100%
          </div>
        </div>
      </div>

      {/* ── Search & Filter Toolbar ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white border border-[#E2E8F0] rounded-[8px] p-3 shadow-2xs">
        <div className="relative flex-1 min-w-[220px]">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            placeholder="Tìm theo mã hợp đồng, số SIM, tên đối tác..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-[6px] text-[#001743] placeholder:text-slate-400 focus:outline-none focus:border-[#001743] transition-colors"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPageIndex(1);
            }}
            className="px-3 py-1.5 text-xs font-semibold bg-white border border-slate-200 rounded-[6px] text-slate-700 focus:outline-none focus:border-[#001743]"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="PendingEscrow">Chờ nộp ký quỹ</option>
            <option value="PendingSignature">Chờ ký hợp đồng số</option>
            <option value="PendingTransfer">Đang sang tên nhà mạng</option>
            <option value="Completed">Hoàn tất giao dịch</option>
            <option value="Disputed">Đang tranh chấp</option>
          </select>
        </div>
      </div>

      {/* ── Contracts List ── */}
      {loading ? (
        <div className="bg-white border border-[#E2E8F0] rounded-[8px] p-12 text-center shadow-2xs">
          <RefreshCw
            size={24}
            className="animate-spin text-slate-400 mx-auto mb-2"
          />
          <div className="text-xs font-bold text-slate-600">
            Đang tải dữ liệu hợp đồng ký quỹ từ máy chủ...
          </div>
        </div>
      ) : filteredTrades.length === 0 ? (
        <div className="bg-white border border-[#E2E8F0] rounded-[8px] p-12 text-center shadow-2xs">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mx-auto mb-3">
            <FileText size={24} />
          </div>
          <h4 className="text-sm font-extrabold text-[#001743] m-0 mb-1">
            Không tìm thấy hợp đồng chuyển nhượng nào
          </h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto m-0 mb-4">
            {searchKeyword
              ? "Không có hợp đồng nào phù hợp với từ khóa tìm kiếm của bạn. Hãy thử từ khóa khác."
              : "Khi bạn trúng đấu giá SIM hoặc thực hiện mua bán trên sàn, hợp đồng chuyển giao và tiến trình ký quỹ bảo đảm sẽ hiển thị tại đây."}
          </p>
          <Link
            href="/auctions"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[6px] bg-[#E4011E] hover:bg-[#C90019] text-white text-xs font-bold transition-colors shadow-xs"
          >
            <span>Khám phá phòng đấu giá SIM</span>
            <ArrowRight size={13} />
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filteredTrades.map((trade) => {
            const escrowBadge = getEscrowBadge(trade.escrowStatus);
            const tradeBadge = getTradeStatusBadge(trade.status);
            const formattedDate = new Date(trade.createdDate).toLocaleDateString(
              "vi-VN",
              {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              }
            );

            // 4-step progress states
            const currentStep = tradeBadge.step;

            return (
              <div
                key={trade.id}
                className="bg-white border border-[#E2E8F0] rounded-[8px] p-5 shadow-2xs hover:border-slate-300 transition-all flex flex-col gap-4"
              >
                {/* Header: Code, Badges & Date */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-[6px] bg-slate-100 text-[#001743] flex items-center justify-center shrink-0">
                      <FileText size={15} />
                    </div>
                    <span className="text-xs font-black text-[#001743] font-mono">
                      #{trade.tradeTransactionCode}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        handleCopy(trade.tradeTransactionCode, "Mã hợp đồng")
                      }
                      className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 transition-colors"
                      title="Sao chép mã hợp đồng"
                    >
                      <Copy size={12} />
                    </button>
                    <span className="text-slate-300">·</span>
                    <span className="text-[11px] text-slate-400">
                      Tạo ngày {formattedDate}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span
                      style={{
                        backgroundColor: escrowBadge.bg,
                        color: escrowBadge.color,
                        borderColor: escrowBadge.border,
                      }}
                      className="text-[10.5px] font-bold px-2 py-0.5 rounded-[4px] border inline-flex items-center gap-1"
                    >
                      <Lock size={10} />
                      {escrowBadge.text}
                    </span>

                    <span
                      style={{
                        backgroundColor: tradeBadge.bg,
                        color: tradeBadge.color,
                        borderColor: tradeBadge.border,
                      }}
                      className="text-[10.5px] font-bold px-2 py-0.5 rounded-[4px] border"
                    >
                      {tradeBadge.text}
                    </span>
                  </div>
                </div>

                {/* Main Content Info */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                  {/* Col 1: Phone number */}
                  <div>
                    <div className="text-[10.5px] text-slate-400 font-semibold uppercase tracking-wider">
                      Số SIM chuyển nhượng
                    </div>
                    <div className="text-lg font-black text-[#001743] font-mono tracking-wide mt-0.5">
                      {formatPhoneNumber(trade.simPhoneNumber)}
                    </div>
                  </div>

                  {/* Col 2: Escrow Amount */}
                  <div>
                    <div className="text-[10.5px] text-slate-400 font-semibold uppercase tracking-wider">
                      Tiền ký quỹ bảo chứng
                    </div>
                    <div className="text-lg font-black text-[#E4011E] font-mono tabular-nums mt-0.5">
                      {trade.escrowAmount.toLocaleString("vi-VN")}{" "}
                      <span className="text-xs font-bold">₫</span>
                    </div>
                  </div>

                  {/* Col 3: Counterparty */}
                  <div>
                    <div className="text-[10.5px] text-slate-400 font-semibold uppercase tracking-wider">
                      Đối tác giao dịch
                    </div>
                    <div className="text-xs font-bold text-slate-700 truncate mt-0.5">
                      {trade.sellerName
                        ? `Bên bán: ${trade.sellerName}`
                        : trade.buyerName
                        ? `Bên mua: ${trade.buyerName}`
                        : "Sàn giao dịch TrustSim"}
                    </div>
                  </div>
                </div>

                {/* Visual 4-Step Progress Bar */}
                <div className="bg-slate-50 border border-slate-100 rounded-[6px] p-3">
                  <div className="grid grid-cols-4 gap-2 text-center">
                    {[
                      { step: 1, label: "1. Ký quỹ" },
                      { step: 2, label: "2. Ký hợp đồng" },
                      { step: 3, label: "3. Sang tên SIM" },
                      { step: 4, label: "4. Giải ngân" },
                    ].map((s) => {
                      const isDone = currentStep > s.step;
                      const isCurrent = currentStep === s.step;

                      return (
                        <div key={s.step} className="flex flex-col items-center">
                          <div className="w-full flex items-center mb-1.5">
                            <div
                              className={`h-1 flex-1 rounded-full ${
                                isDone
                                  ? "bg-emerald-500"
                                  : isCurrent
                                  ? "bg-blue-500"
                                  : "bg-slate-200"
                              }`}
                            />
                          </div>
                          <span
                            className={`text-[10.5px] font-bold truncate max-w-full ${
                              isDone
                                ? "text-emerald-700"
                                : isCurrent
                                ? "text-blue-700"
                                : "text-slate-400"
                            }`}
                          >
                            {s.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Footer Action Bar */}
                <div className="flex items-center justify-between pt-1">
                  <div className="text-[11px] text-slate-500">
                    {trade.escrowDeadline && (
                      <span>
                        Hạn chót xử lý:{" "}
                        <strong className="text-slate-700 font-mono">
                          {new Date(trade.escrowDeadline).toLocaleDateString(
                            "vi-VN"
                          )}
                        </strong>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {trade.documentUrl && (
                      <a
                        href={trade.documentUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-[6px] border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 shadow-2xs transition-colors"
                      >
                        <ExternalLink size={12} />
                        <span>Bản số hóa PDF</span>
                      </a>
                    )}

                    <Link
                      href={`/trades/${trade.id}`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-[6px] bg-[#001743] hover:bg-[#00266B] text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
                    >
                      <span>Xem chi tiết tiến trình</span>
                      <ChevronRight size={13} />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between bg-white border border-[#E2E8F0] rounded-[8px] p-3 shadow-2xs text-xs">
              <span className="text-slate-500">
                Hiển thị trang <strong>{pageIndex}</strong> / {totalPages} (Tổng{" "}
                {totalCount} hợp đồng)
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={pageIndex <= 1}
                  onClick={() => setPageIndex((p) => Math.max(1, p - 1))}
                  className="px-3 py-1 rounded border border-slate-200 bg-white disabled:bg-slate-100 disabled:text-slate-400 font-bold text-slate-700 cursor-pointer disabled:cursor-not-allowed"
                >
                  ← Trước
                </button>
                <button
                  type="button"
                  disabled={pageIndex >= totalPages}
                  onClick={() => setPageIndex((p) => Math.min(totalPages, p + 1))}
                  className="px-3 py-1 rounded border border-slate-200 bg-white disabled:bg-slate-100 disabled:text-slate-400 font-bold text-slate-700 cursor-pointer disabled:cursor-not-allowed"
                >
                  Sau →
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Modal: Chi Tiết Tiến Trình Hợp Đồng ── */}
      {selectedTrade && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-[10px] border border-slate-200 shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in-50 zoom-in-95">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-[6px] bg-[#001743] text-white flex items-center justify-center">
                  <FileText size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-[#001743] m-0">
                    Chi tiết hợp đồng #{selectedTrade.tradeTransactionCode}
                  </h3>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Hệ thống lưu trữ và chứng thực hợp đồng điện tử TrustSim
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedTrade(null)}
                className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto flex flex-col gap-5 text-xs text-slate-600">
              {/* Status Banner */}
              <div className="bg-slate-50 border border-slate-200 rounded-[8px] p-3 flex items-center justify-between flex-wrap gap-2">
                <div>
                  <div className="text-[11px] text-slate-400 font-semibold uppercase">
                    Trạng thái tiến trình
                  </div>
                  <div className="text-sm font-black text-[#001743] mt-0.5">
                    {getTradeStatusBadge(selectedTrade.status).text}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-[11px] text-slate-400 font-semibold uppercase">
                    Tài khoản ký quỹ
                  </div>
                  <div className="text-sm font-black text-[#E4011E] font-mono tabular-nums mt-0.5">
                    {selectedTrade.escrowAmount.toLocaleString("vi-VN")} ₫
                  </div>
                </div>
              </div>

              {/* Transaction Metadata Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50/70 border border-slate-100 rounded-[6px]">
                  <div className="text-[11px] text-slate-400 font-semibold mb-1">
                    Số SIM chuyển giao
                  </div>
                  <div className="text-base font-extrabold text-[#001743] font-mono">
                    {formatPhoneNumber(selectedTrade.simPhoneNumber)}
                  </div>
                </div>

                <div className="p-3 bg-slate-50/70 border border-slate-100 rounded-[6px]">
                  <div className="text-[11px] text-slate-400 font-semibold mb-1">
                    Trạng thái ký quỹ Escrow
                  </div>
                  <div className="text-xs font-bold text-blue-700">
                    {getEscrowBadge(selectedTrade.escrowStatus).text}
                  </div>
                </div>

                <div className="p-3 bg-slate-50/70 border border-slate-100 rounded-[6px]">
                  <div className="text-[11px] text-slate-400 font-semibold mb-1">
                    Bên bán SIM
                  </div>
                  <div className="text-xs font-bold text-slate-800">
                    {selectedTrade.sellerName || "Chưa xác định"}
                  </div>
                </div>

                <div className="p-3 bg-slate-50/70 border border-slate-100 rounded-[6px]">
                  <div className="text-[11px] text-slate-400 font-semibold mb-1">
                    Bên mua SIM
                  </div>
                  <div className="text-xs font-bold text-slate-800">
                    {selectedTrade.buyerName || "Chưa xác định"}
                  </div>
                </div>
              </div>

              {/* Deadlines Section */}
              <div className="border border-slate-200 rounded-[8px] p-3">
                <div className="text-xs font-bold text-[#001743] mb-2 flex items-center gap-1.5">
                  <Clock size={14} className="text-slate-500" />
                  <span>Các mốc thời gian chuyển nhượng quan trọng</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11.5px]">
                  <div>
                    <span className="text-slate-400">Thời hạn nộp ký quỹ:</span>{" "}
                    <strong className="text-slate-700 font-mono">
                      {new Date(selectedTrade.escrowDeadline).toLocaleString(
                        "vi-VN"
                      )}
                    </strong>
                  </div>
                  {selectedTrade.signingDeadline && (
                    <div>
                      <span className="text-slate-400">Thời hạn ký hợp đồng:</span>{" "}
                      <strong className="text-slate-700 font-mono">
                        {new Date(
                          selectedTrade.signingDeadline
                        ).toLocaleString("vi-VN")}
                      </strong>
                    </div>
                  )}
                  {selectedTrade.transferDeadline && (
                    <div>
                      <span className="text-slate-400">Thời hạn sang tên:</span>{" "}
                      <strong className="text-slate-700 font-mono">
                        {new Date(
                          selectedTrade.transferDeadline
                        ).toLocaleString("vi-VN")}
                      </strong>
                    </div>
                  )}
                  {selectedTrade.completedAt && (
                    <div>
                      <span className="text-slate-400">Thời điểm hoàn tất:</span>{" "}
                      <strong className="text-emerald-700 font-mono">
                        {new Date(selectedTrade.completedAt).toLocaleString(
                          "vi-VN"
                        )}
                      </strong>
                    </div>
                  )}
                </div>
              </div>

              {/* Digital Contract & Blockchain Proof Section */}
              <div className="border border-slate-200 rounded-[8px] p-3 bg-slate-50/50">
                <div className="text-xs font-bold text-[#001743] mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck size={14} className="text-emerald-600" />
                    Tính toàn vẹn hợp đồng số hóa
                  </span>
                  {selectedTrade.contractStatus && (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                      {selectedTrade.contractStatus}
                    </span>
                  )}
                </div>

                <div className="flex flex-col gap-2 text-[11px]">
                  {selectedTrade.documentHash && (
                    <div className="flex items-center justify-between gap-2 p-2 bg-white rounded border border-slate-200">
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-500">
                          Mã băm tài liệu (SHA-256):
                        </div>
                        <div className="font-mono text-slate-800 truncate">
                          {selectedTrade.documentHash}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          handleCopy(
                            selectedTrade.documentHash || "",
                            "Mã băm tài liệu"
                          )
                        }
                        className="p-1 text-slate-400 hover:text-slate-700"
                        title="Sao chép"
                      >
                        <Copy size={13} />
                      </button>
                    </div>
                  )}

                  {selectedTrade.blockchainTxHash && (
                    <div className="flex items-center justify-between gap-2 p-2 bg-white rounded border border-slate-200">
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-500">
                          Chứng thực sổ cái phân tán (TxHash):
                        </div>
                        <div className="font-mono text-slate-800 truncate">
                          {selectedTrade.blockchainTxHash}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          handleCopy(
                            selectedTrade.blockchainTxHash || "",
                            "Mã giao dịch sổ cái"
                          )
                        }
                        className="p-1 text-slate-400 hover:text-slate-700"
                        title="Sao chép"
                      >
                        <Copy size={13} />
                      </button>
                    </div>
                  )}

                  {selectedTrade.documentUrl ? (
                    <a
                      href={selectedTrade.documentUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 inline-flex items-center justify-center gap-1.5 p-2 bg-[#001743] hover:bg-[#00266B] text-white rounded-[6px] font-bold transition-colors"
                    >
                      <ExternalLink size={13} />
                      <span>Xem và tải bản hợp đồng số hóa (.pdf)</span>
                    </a>
                  ) : (
                    <div className="text-slate-400 italic text-[11px] mt-1">
                      * Bản hợp đồng số đang được tạo lập và lưu trữ trong hồ sơ số hóa.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-3 border-t border-slate-100 bg-slate-50 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setSelectedTrade(null)}
                className="px-4 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-[6px] hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
