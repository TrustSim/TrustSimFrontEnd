import { apiFetch } from "./apiClient";
import type {
  TradeTransactionDto,
  CreateTradeTransactionRequest,
  TradeFilter,
  ContractPreviewDto,
  SimTransferDetailsDto,
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

  /** Khởi tạo giao dịch chuyển nhượng SIM (tạo tài khoản ký quỹ bảo đảm) */
  async createTrade(data: CreateTradeTransactionRequest): Promise<TradeTransactionDto> {
    const res = await apiFetch<TradeTransactionDto>("/TradeTransactions", {
      method: "POST",
      body: JSON.stringify(data),
    });
    if (res.data) return res.data;
    throw new Error(res.message || "Không thể khởi tạo giao dịch");
  },

  /** [Admin] Lấy danh sách tất cả giao dịch chuyển nhượng trên toàn sàn */
  async adminGetAllTrades(filter: TradeFilter = {}): Promise<PagedResult<TradeTransactionDto>> {
    const params = new URLSearchParams();
    if (filter.status) params.set("status", filter.status);
    if (filter.pageIndex) params.set("pageIndex", String(filter.pageIndex));
    if (filter.pageSize) params.set("pageSize", String(filter.pageSize));

    const res = await apiFetch<PagedResult<TradeTransactionDto>>(
      `/TradeTransactions/admin?${params.toString()}`
    );
    if (res.data) return res.data;
    throw new Error(res.message || "Không thể tải danh sách giao dịch toàn sàn");
  },

  /** Xem trước hợp đồng điện tử */
  async getContractPreview(tradeId: string): Promise<ContractPreviewDto> {
    const res = await apiFetch<ContractPreviewDto>(`/Contracts/${tradeId}/preview`);
    if (res.data) return res.data;
    throw new Error(res.message || "Không thể tải bản xem trước hợp đồng");
  },

  /** Gửi OTP ký hợp đồng điện tử qua Email */
  async sendSigningOtp(tradeId: string): Promise<{ success: boolean; message: string }> {
    const res = await apiFetch<any>(`/Contracts/${tradeId}/send-otp`, { method: "POST" });
    if (res.success) return { success: true, message: res.message || "Mã OTP đã được gửi về email của bạn" };
    throw new Error(res.message || "Không thể gửi mã OTP");
  },

  /** Ký hợp đồng bằng mã OTP Email */
  async signContract(tradeId: string, otpCode: string): Promise<any> {
    const res = await apiFetch<any>(`/Contracts/${tradeId}/sign`, {
      method: "POST",
      body: JSON.stringify({ otpCode }),
    });
    if (res.success) return res.data;
    throw new Error(res.message || "Ký hợp đồng thất bại");
  },

  /** Lấy chi tiết tiến trình sang tên SIM */
  async getSimTransferDetails(tradeId: string): Promise<SimTransferDetailsDto> {
    const res = await apiFetch<SimTransferDetailsDto>(`/SimTransfers/${tradeId}`);
    if (res.data) return res.data;
    throw new Error(res.message || "Không thể tải thông tin sang tên");
  },

  /** Người bán nộp biên bản / bằng chứng sang tên SIM */
  async submitTransferProof(tradeId: string, proofDocumentUrl: string): Promise<any> {
    const res = await apiFetch<any>(`/SimTransfers/${tradeId}/submit-proof`, {
      method: "POST",
      body: JSON.stringify({ proofDocumentUrl }),
    });
    if (res.success) return res.data;
    throw new Error(res.message || "Không thể gửi biên bản sang tên");
  },

  /** Người mua xác nhận đã nhận SIM chính chủ, hoàn tất giải ngân tiền ký quỹ */
  async confirmTransfer(tradeId: string): Promise<any> {
    const res = await apiFetch<any>(`/SimTransfers/${tradeId}/confirm`, {
      method: "POST",
    });
    if (res.success) return res.data;
    throw new Error(res.message || "Xác nhận nhận SIM thất bại");
  },
};

