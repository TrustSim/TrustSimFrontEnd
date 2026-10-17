"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, Loader2, RefreshCw, X } from "lucide-react";
import { auctionService, PendingSettlementDto } from "@/services/auctionService";
import { formatPhoneNumber } from "@/services/simService";
import { ToastMessage } from "@/components/ui/Toast";

interface SettlementsTabProps {
  addToast: (toast: Omit<ToastMessage, "id">) => void;
  onOpenDeposit: () => void;
}

type RoleFilter = "ALL" | "BUYER" | "SELLER";
type SettlementAction =
  | "PAY"
  | "FORFEIT"
  | "ACCEPT_RUNNER_UP"
  | "REJECT_RUNNER_UP"
  | "SELLER_APPROVE"
  | "SELLER_REJECT";

function formatVND(value?: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function getRemaining(deadline?: string) {
  if (!deadline) return { text: "Chưa có hạn", detail: "", urgent: false, ended: false };

  const date = new Date(deadline);
  if (Number.isNaN(date.getTime())) {
    return { text: "Chưa có hạn", detail: "", urgent: false, ended: false };
  }
  const diff = date.getTime() - Date.now();
  const detail = `Hạn ${new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date)}`;

  if (diff <= 0) return { text: "Đã hết hạn", detail, urgent: true, ended: true };

  const totalMinutes = Math.floor(diff / 60_000);
  const days = Math.floor(totalMinutes / 1_440);
  const hours = Math.floor((totalMinutes % 1_440) / 60);
  const minutes = totalMinutes % 60;
  const text = days > 0
    ? `Còn ${days} ngày${hours > 0 ? ` ${hours} giờ` : ""}`
    : hours > 0
      ? `Còn ${hours} giờ${minutes > 0 ? ` ${minutes} phút` : ""}`
      : `Còn ${Math.max(minutes, 1)} phút`;

  return { text, detail, urgent: diff <= 2 * 60 * 60 * 1000, ended: false };
}

function isBuyer(item: PendingSettlementDto) {
  return item.role === "WINNER" || item.role === "RUNNER_UP";
}

function getTask(item: PendingSettlementDto) {
  if (item.actionRequired === "PAY_SETTLEMENT" || item.role === "WINNER") {
    return {
      title: "Thanh toán số tiền còn lại",
      detail: `Giá trúng ${formatVND(item.finalPrice)} · đã trừ tiền cọc`,
      button: item.deficitAmount > 0 ? "Cần nạp thêm tiền" : "Thanh toán ngay",
    };
  }

  if (item.actionRequired === "DECIDE_RUNNER_UP" || item.role === "SELLER") {
    return {
      title: "Chọn có bán cho người trả giá kế tiếp",
      detail: "Người thắng trước đã bỏ quyền mua",
      button: "Xem và quyết định",
    };
  }

  return {
    title: "Trả lời đề nghị mua",
    detail: "Bạn là người trả giá kế tiếp",
    button: "Xem đề nghị",
  };
}

export default function SettlementsTab({ addToast, onOpenDeposit }: SettlementsTabProps) {
  const [items, setItems] = useState<PendingSettlementDto[]>([]);
  const [filter, setFilter] = useState<RoleFilter>("ALL");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [selected, setSelected] = useState<PendingSettlementDto | null>(null);
  const [, setTick] = useState(0);

  const fetchSettlements = useCallback(async (silent = false) => {
    if (silent) setRefreshing(true);
    else setLoading(true);
    setLoadError(false);

    try {
      const data = await auctionService.getPendingSettlements();
      setItems(data || []);
    } catch (error) {
      setLoadError(true);
      if (silent) {
        addToast({
          type: "error",
          title: "Chưa cập nhật được danh sách",
          message: error instanceof Error ? error.message : "Vui lòng kiểm tra lại kết nối mạng.",
        });
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchSettlements();
  }, [fetchSettlements]);

  useEffect(() => {
    const timer = window.setInterval(() => setTick((value) => value + 1), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const counts = useMemo(() => ({
    all: items.length,
    buyer: items.filter(isBuyer).length,
    seller: items.filter((item) => item.role === "SELLER").length,
    urgent: items.filter((item) => getRemaining(item.deadline).urgent).length,
  }), [items]);

  const visibleItems = useMemo(() => {
    const filtered = items.filter((item) => {
      if (filter === "BUYER") return isBuyer(item);
      if (filter === "SELLER") return item.role === "SELLER";
      return true;
    });

    return filtered.toSorted((a, b) => {
      const aTime = a.deadline ? new Date(a.deadline).getTime() : Number.MAX_SAFE_INTEGER;
      const bTime = b.deadline ? new Date(b.deadline).getTime() : Number.MAX_SAFE_INTEGER;
      return aTime - bTime;
    });
  }, [filter, items]);

  const deficitTotal = useMemo(
    () => items.reduce((total, item) => total + Math.max(item.deficitAmount || 0, 0), 0),
    [items],
  );

  const runAction = async (action: SettlementAction) => {
    if (!selected || actionLoading) return;
    setActionLoading(true);

    try {
      if (action === "PAY") await auctionService.confirmWinnerPayment(selected.auctionId);
      if (action === "FORFEIT") await auctionService.forfeitWinnerPurchase(selected.auctionId);
      if (action === "ACCEPT_RUNNER_UP") await auctionService.acceptRunnerUpOffer(selected.auctionId);
      if (action === "REJECT_RUNNER_UP") await auctionService.rejectRunnerUpOffer(selected.auctionId);
      if (action === "SELLER_APPROVE") await auctionService.sellerDecideRunnerUp(selected.auctionId, true);
      if (action === "SELLER_REJECT") await auctionService.sellerDecideRunnerUp(selected.auctionId, false);

      const messages: Record<SettlementAction, string> = {
        PAY: "Đã thanh toán số tiền còn lại.",
        FORFEIT: "Đã ghi nhận việc từ bỏ quyền mua.",
        ACCEPT_RUNNER_UP: "Đã chấp nhận quyền mua.",
        REJECT_RUNNER_UP: "Đã từ chối quyền mua.",
        SELLER_APPROVE: "Đã đồng ý bán cho người trả giá kế tiếp.",
        SELLER_REJECT: "Đã từ chối bán cho người trả giá kế tiếp.",
      };

      addToast({ type: "success", title: "Đã cập nhật", message: messages[action] });
      setSelected(null);
      await fetchSettlements(true);
    } catch (error) {
      addToast({
        type: "error",
        title: "Thao tác không thành công",
        message: error instanceof Error ? error.message : "Vui lòng thử lại sau.",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const openItem = (item: PendingSettlementDto) => {
    if (item.deficitAmount > 0 && isBuyer(item)) {
      onOpenDeposit();
      return;
    }
    setSelected(item);
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white px-5 py-16 text-center">
        <Loader2 className="mx-auto size-5 animate-spin text-[#001743]" aria-hidden />
        <p className="mt-3 text-sm text-slate-500">Đang tải các giao dịch cần hoàn tất…</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <p className="m-0 text-sm text-slate-500">Các phiên đã kết thúc và đang chờ bạn xử lý.</p>
        <div className="flex items-center gap-5 text-xs text-slate-500">
          <span><strong className="block text-base text-[#101828]">{counts.all}</strong>cần làm</span>
          <span><strong className="block text-base text-[#101828]">{counts.urgent}</strong>sắp hết hạn</span>
        </div>
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white" aria-labelledby="settlement-list-title">
        <header className="flex flex-col gap-4 border-b border-slate-200 px-5 py-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 id="settlement-list-title" className="m-0 text-base font-semibold text-[#101828]">Việc cần bạn xử lý</h2>
            <p className="mt-1 mb-0 text-xs text-slate-500">Sắp xếp theo hạn gần nhất, không phụ thuộc vai trò.</p>
          </div>
          <div className="flex flex-wrap gap-1.5" aria-label="Lọc theo vai trò">
            {([
              ["ALL", `Tất cả ${counts.all}`],
              ["BUYER", `Mua ${counts.buyer}`],
              ["SELLER", `Bán ${counts.seller}`],
            ] as const).map(([value, label]) => (
              <button
                key={value}
                type="button"
                aria-pressed={filter === value}
                onClick={() => setFilter(value)}
                className={`min-h-9 rounded-lg border px-3 text-xs font-semibold transition-colors ${
                  filter === value
                    ? "border-[#001743] bg-[#001743] text-white"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                {label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => fetchSettlements(true)}
              aria-label="Tải lại danh sách"
              title="Tải lại danh sách"
              className="grid size-9 place-items-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            >
              <RefreshCw className={`size-4 ${refreshing ? "animate-spin" : ""}`} aria-hidden />
            </button>
          </div>
        </header>

        {loadError ? (
          <div className="px-5 py-16 text-center">
            <h3 className="m-0 text-base font-semibold text-[#101828]">Chưa tải được danh sách</h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">Kết nối đang gián đoạn. Các giao dịch của bạn vẫn được giữ nguyên.</p>
            <button type="button" onClick={() => fetchSettlements()} className="mt-4 min-h-10 rounded-xl border border-slate-300 bg-white px-4 text-sm font-medium text-[#101828] hover:bg-slate-50">Tải lại</button>
          </div>
        ) : items.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <h3 className="m-0 text-base font-semibold text-[#101828]">Không có giao dịch nào cần xử lý</h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">Khi một phiên kết thúc và cần bạn thanh toán hoặc xác nhận, phiên đó sẽ xuất hiện tại đây.</p>
            <Link href="/auctions" className="mt-4 inline-flex min-h-10 items-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-medium text-[#101828] hover:bg-slate-50">Xem sàn đấu giá</Link>
          </div>
        ) : (
          <>
            {deficitTotal > 0 ? (
              <div className="mx-5 mt-4 flex flex-col gap-2 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-xs text-amber-900 sm:flex-row sm:items-center sm:justify-between">
                <span>Ví hiện thiếu {formatVND(deficitTotal)} cho các khoản cần thanh toán.</span>
                <button type="button" onClick={onOpenDeposit} className="self-start font-semibold underline underline-offset-2 sm:self-auto">Nạp tiền</button>
              </div>
            ) : null}

            {visibleItems.length === 0 ? (
              <div className="px-5 py-12 text-center text-sm text-slate-500">Không có giao dịch phù hợp với bộ lọc này.</div>
            ) : (
              <ul className="m-0 mt-4 list-none divide-y divide-slate-200 p-0">
                {visibleItems.map((item) => {
                  const task = getTask(item);
                  const remaining = getRemaining(item.deadline);
                  const blockedByBalance = item.deficitAmount > 0 && isBuyer(item);

                  return (
                    <li key={`${item.auctionId}-${item.role}`} className="grid gap-3 px-5 py-4 md:grid-cols-[minmax(190px,1.1fr)_minmax(190px,1fr)_minmax(130px,.65fr)_auto] md:items-center md:gap-5">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-lg font-black tracking-tight text-[#001743] tabular-nums">{formatPhoneNumber(item.simPhoneNumber)}</span>
                          <span className="rounded-md border border-slate-300 bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-600">{isBuyer(item) ? "Bạn mua" : "Bạn bán"}</span>
                        </div>
                        <div className="mt-1 text-[11px] text-slate-500">Phiên {item.auctionCode} · {item.carrierName || "Nhà mạng chưa xác định"}</div>
                      </div>

                      <div>
                        <div className="text-sm font-semibold text-[#101828]">{task.title}</div>
                        <div className="mt-1 text-[11px] leading-relaxed text-slate-500">{task.detail}</div>
                        {blockedByBalance ? <div className="mt-1 text-[11px] font-semibold text-[#B42318]">Ví thiếu {formatVND(item.deficitAmount)}</div> : null}
                      </div>

                      <div className={remaining.urgent ? "text-[#B42318]" : "text-slate-700"}>
                        <div className="text-sm font-semibold tabular-nums">{remaining.text}</div>
                        <div className="mt-1 text-[11px] text-slate-500">{remaining.detail}</div>
                      </div>

                      <button
                        type="button"
                        onClick={() => openItem(item)}
                        className={`min-h-10 w-full rounded-xl px-4 text-sm font-semibold transition-colors md:w-auto md:min-w-36 ${
                          blockedByBalance
                            ? "border border-slate-300 bg-slate-100 text-slate-600 hover:bg-slate-200"
                            : "bg-[#001743] text-white hover:bg-[#00266B]"
                        }`}
                      >
                        {task.button}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}

            <footer className="border-t border-slate-200 px-5 py-3 text-[11px] text-slate-500">Danh sách chỉ hiển thị những phiên đang chờ chính bạn xử lý.</footer>
          </>
        )}
      </section>

      {selected ? (
        <div className="profile-modal-backdrop fixed inset-0 z-[9999] flex items-center justify-center p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !actionLoading) setSelected(null); }}>
          <section className="profile-modal-panel w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="settlement-dialog-title">
            <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
              <div>
                <h2 id="settlement-dialog-title" className="m-0 text-base font-semibold text-[#101828]">Xác nhận lựa chọn</h2>
                <p className="mt-1 mb-0 font-mono text-sm font-bold text-[#001743]">{formatPhoneNumber(selected.simPhoneNumber)}</p>
              </div>
              <button type="button" onClick={() => setSelected(null)} disabled={actionLoading} aria-label="Đóng" className="grid size-9 place-items-center rounded-lg text-slate-500 hover:bg-slate-100"><X className="size-4" /></button>
            </header>

            <div className="space-y-4 px-5 py-5">
              {selected.role === "WINNER" ? (
                <>
                  <p className="m-0 text-sm leading-relaxed text-slate-600">Bạn cần thanh toán <strong className="text-[#101828]">{formatVND(selected.remainingPaymentRequired)}</strong> sau khi đã trừ tiền cọc.</p>
                  <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                    <button type="button" onClick={() => runAction("FORFEIT")} aria-disabled={actionLoading} className="min-h-10 rounded-xl border border-slate-300 bg-white px-4 text-sm font-medium text-[#B42318] hover:bg-slate-50">Từ bỏ quyền mua</button>
                    <button type="button" onClick={() => runAction("PAY")} aria-disabled={actionLoading} className="min-h-10 rounded-xl bg-[#001743] px-4 text-sm font-semibold text-white hover:bg-[#00266B]">{actionLoading ? "Đang xử lý…" : "Thanh toán"}</button>
                  </div>
                </>
              ) : selected.role === "RUNNER_UP" ? (
                <>
                  <p className="m-0 text-sm leading-relaxed text-slate-600">Bạn được đề nghị mua SIM với giá <strong className="text-[#101828]">{formatVND(selected.finalPrice)}</strong>. Nếu đồng ý, bạn cần thanh toán phần tiền còn lại.</p>
                  <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                    <button type="button" onClick={() => runAction("REJECT_RUNNER_UP")} aria-disabled={actionLoading} className="min-h-10 rounded-xl border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50">Từ chối</button>
                    <button type="button" onClick={() => runAction("ACCEPT_RUNNER_UP")} aria-disabled={actionLoading} className="min-h-10 rounded-xl bg-[#001743] px-4 text-sm font-semibold text-white hover:bg-[#00266B]">{actionLoading ? "Đang xử lý…" : "Nhận quyền mua"}</button>
                  </div>
                </>
              ) : (
                <>
                  <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-950"><AlertTriangle className="mr-2 inline size-4" aria-hidden />Người thắng trước đã bỏ quyền mua. Người trả giá kế tiếp đề nghị mua với giá <strong>{formatVND(selected.runnerUpFinalPrice)}</strong>.</div>
                  <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                    <button type="button" onClick={() => runAction("SELLER_REJECT")} aria-disabled={actionLoading} className="min-h-10 rounded-xl border border-slate-300 bg-white px-4 text-sm font-medium text-[#B42318] hover:bg-slate-50">Từ chối bán</button>
                    <button type="button" onClick={() => runAction("SELLER_APPROVE")} aria-disabled={actionLoading} className="min-h-10 rounded-xl bg-[#001743] px-4 text-sm font-semibold text-white hover:bg-[#00266B]">{actionLoading ? "Đang xử lý…" : "Đồng ý bán"}</button>
                  </div>
                </>
              )}
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}
