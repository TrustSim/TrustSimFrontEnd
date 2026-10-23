import { apiClient, apiFetch } from "./apiClient";
import type {
  TradeTransactionDto,
  CreateTradeTransactionRequest,
  TradeFilter,
  ContractPreviewDto,
  LiquidationPreviewDto,
  SignContractResultDto,
  SimTransferDetailsDto,
  VerifyContractIntegrityResponse,
} from "@/types/trade";
import type { PagedResult } from "@/types/common";
import { withQuery } from "./queryParams";

const GUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function getTradeFilterQuery(filter: TradeFilter) {
  return {
    status: filter.status,
    role: filter.role === "all" ? undefined : filter.role,
    buyerId: filter.buyerId,
    sellerId: filter.sellerId,
    minAmount: filter.minAmount,
    maxAmount: filter.maxAmount,
    keyword: filter.keyword,
    fromDate: filter.fromDate,
    toDate: filter.toDate,
    sortBy: filter.sortBy,
    sortOrder: filter.sortOrder,
    pageIndex: filter.pageIndex ?? 1,
    pageSize: filter.pageSize ?? 10,
  };
}

export const tradeService = {
  /** Lấy danh sách giao dịch chuyển nhượng / ký quỹ của tôi */
  async getMyTrades(filter: TradeFilter = {}): Promise<PagedResult<TradeTransactionDto>> {
    const res = await apiFetch<PagedResult<TradeTransactionDto>>(
      withQuery("/TradeTransactions", getTradeFilterQuery(filter))
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

  /** Xem chi tiết giao dịch bằng mã nghiệp vụ (VD: TRD-...). */
  async getTradeByCode(tradeCode: string): Promise<TradeTransactionDto> {
    const res = await apiFetch<TradeTransactionDto>(
      `/TradeTransactions/code/${encodeURIComponent(tradeCode)}`
    );
    if (res.data) return res.data;
    throw new Error(res.message || "Không tìm thấy giao dịch theo mã");
  },

  /** Chấp nhận cả UUID hoặc tradeCode để dùng trực tiếp cho route chi tiết. */
  async getTradeByIdentifier(identifier: string): Promise<TradeTransactionDto> {
    return GUID_PATTERN.test(identifier)
      ? this.getTradeById(identifier)
      : this.getTradeByCode(identifier);
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
    const res = await apiFetch<PagedResult<TradeTransactionDto>>(
      withQuery("/TradeTransactions/admin", getTradeFilterQuery(filter))
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
  async signContract(tradeId: string, otpCode: string): Promise<SignContractResultDto> {
    const res = await apiFetch<SignContractResultDto>(`/Contracts/${tradeId}/sign`, {
      method: "POST",
      body: JSON.stringify({ otpCode }),
    });
    if (res.data) return res.data;
    throw new Error(res.message || "Ký hợp đồng thất bại");
  },

  /** Lấy chi tiết tiến trình sang tên SIM */
  async getSimTransferDetails(tradeId: string): Promise<SimTransferDetailsDto> {
    const res = await apiFetch<SimTransferDetailsDto>(`/SimTransfers/${tradeId}`);
    if (res.data) return res.data;
    throw new Error(res.message || "Không thể tải thông tin sang tên");
  },

  /** Người bán nộp biên bản / bằng chứng sang tên SIM */
  async submitTransferProof(
    tradeId: string,
    imageUrl: string,
    description?: string
  ): Promise<SimTransferDetailsDto> {
    const res = await apiFetch<SimTransferDetailsDto>(`/SimTransfers/${tradeId}/proof`, {
      method: "POST",
      body: JSON.stringify({ imageUrl, description }),
    });
    if (res.data) return res.data;
    throw new Error(res.message || "Không thể gửi biên bản sang tên");
  },

  /** Người mua xác nhận đã nhận SIM chính chủ, hoàn tất giải ngân tiền ký quỹ */
  async confirmTransfer(tradeId: string): Promise<SimTransferDetailsDto> {
    const res = await apiFetch<SimTransferDetailsDto>(`/SimTransfers/${tradeId}/confirm`, {
      method: "POST",
    });
    if (res.data) return res.data;
    throw new Error(res.message || "Xác nhận nhận SIM thất bại");
  },

  /** Xem trước biên bản nghiệm thu và thanh lý. */
  async getLiquidationPreview(tradeId: string): Promise<LiquidationPreviewDto> {
    const res = await apiFetch<LiquidationPreviewDto>(
      `/Contracts/${tradeId}/liquidation/preview`
    );
    if (res.data) return res.data;
    throw new Error(res.message || "Không thể tải biên bản nghiệm thu và thanh lý");
  },

  /** Tải tài liệu qua API có xác thực; axios theo redirect CDN và trả về blob. */
  async getDocumentBlob(
    tradeId: string,
    document: "winning-notice" | "contract" | "liquidation"
  ): Promise<Blob> {
    const path =
      document === "winning-notice"
        ? `/api/Contracts/${tradeId}/winning-notice`
        : document === "liquidation"
          ? `/api/Contracts/${tradeId}/liquidation/download`
          : `/api/Contracts/${tradeId}/download`;
    const response = await apiClient.get(path, { responseType: "blob" });
    return response.data;
  },

  /** Đối chiếu SHA-256 của PDF đã tải với bản niêm phong trong backend. */
  async verifyContractIntegrity(
    tradeId: string,
    clientSha256: string
  ): Promise<VerifyContractIntegrityResponse> {
    const res = await apiFetch<VerifyContractIntegrityResponse>(
      `/Contracts/${tradeId}/verify-integrity`,
      {
        method: "POST",
        body: JSON.stringify({ clientSha256 }),
      }
    );
    if (res.data) return res.data;
    throw new Error(res.message || "Không thể kiểm tra tính toàn vẹn hợp đồng");
  },
};
