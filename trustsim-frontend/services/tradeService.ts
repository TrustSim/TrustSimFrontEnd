import { apiFetch } from "./apiClient";
import type {
  TradeTransactionDto,
  CreateTradeTransactionRequest,
  TradeFilter,
} from "@/types/trade";
import type { PagedResult } from "@/types/common";

export const tradeService = {
  /** Lấy danh sách giao dịch chuyển nhượng / ký quỹ của tôi */
  async getMyTrades(filter: TradeFilter = {}): Promise<PagedResult<TradeTransactionDto>> {
    const params = new URLSearchParams();
    if (filter.status) params.set("status", filter.status);
    if (filter.pageIndex) params.set("pageIndex", String(filter.pageIndex));
    if (filter.pageSize) params.set("pageSize", String(filter.pageSize));

    const res = await apiFetch<PagedResult<TradeTransactionDto>>(
      `/TradeTransactions?${params.toString()}`
    );
    if (res.data) return res.data;
    throw new Error(res.message || "Không thể tải danh sách giao dịch");
  },

  /** Xem chi tiết một giao dịch chuyển nhượng */
  async getTradeById(id: string): Promise<TradeTransactionDto> {
    const res = await apiFetch<TradeTransactionDto>(`/TradeTransactions/${id}`);
    if (res.data) return res.data;
    throw new Error(res.message || "Không tìm thấy thông tin giao dịch");
  },

  /** Khởi tạo giao dịch chuyển nhượng SIM (tạo tài khoản ký quỹ Escrow bảo đảm) */
  async createTrade(data: CreateTradeTransactionRequest): Promise<TradeTransactionDto> {
    const res = await apiFetch<TradeTransactionDto>("/TradeTransactions", {
      method: "POST",
      body: JSON.stringify(data),
    });
    if (res.data) return res.data;
    throw new Error(res.message || "Không thể khởi tạo giao dịch");
  },
};
