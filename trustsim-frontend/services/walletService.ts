import { apiFetch } from "./apiClient";
import type {
  WalletDto,
  WalletTransactionDto,
  DepositResponseDto,
  CreateDepositRequest,
  CreateWithdrawRequest,
  AdminWalletDetailDto,
  WalletTransactionFilter,
  AdminWalletFilter,
} from "@/types/wallet";
import type { PagedResult } from "@/types/common";

export const walletService = {
  // ─── User Wallet ──────────────────────────────────────────────────────────

  /** Lấy thông tin ví và số dư của tài khoản đang đăng nhập */
  async getMyWallet(): Promise<WalletDto> {
    const res = await apiFetch<WalletDto>("/Wallets/me");
    if (res.data) return res.data;
    throw new Error(res.message || "Không thể tải thông tin ví");
  },

  /** Lịch sử giao dịch ví cá nhân (có phân trang & lọc) */
  async getTransactions(
    filter: WalletTransactionFilter = {}
  ): Promise<PagedResult<WalletTransactionDto>> {
    const params = new URLSearchParams();
    if (filter.type) params.set("type", filter.type);
    if (filter.status) params.set("status", filter.status);
    if (filter.pageIndex) params.set("pageIndex", String(filter.pageIndex));
    if (filter.pageSize) params.set("pageSize", String(filter.pageSize));

    const res = await apiFetch<PagedResult<WalletTransactionDto>>(
      `/Wallets/transactions?${params.toString()}`
    );
    if (res.data) return res.data;
    throw new Error(res.message || "Không thể tải lịch sử giao dịch");
  },

  /** Chi tiết một giao dịch ví */
  async getTransactionById(id: string): Promise<WalletTransactionDto> {
    const res = await apiFetch<WalletTransactionDto>(
      `/Wallets/transactions/${id}`
    );
    if (res.data) return res.data;
    throw new Error(res.message || "Không tìm thấy giao dịch");
  },

  /**
   * Tạo yêu cầu nạp tiền → Trả về VietQR QR code + cú pháp chuyển khoản SePay
   */
  async createDeposit(data: CreateDepositRequest): Promise<DepositResponseDto> {
    const res = await apiFetch<DepositResponseDto>("/Wallets/deposit", {
      method: "POST",
      body: JSON.stringify(data),
    });
    if (res.data) return res.data;
    throw new Error(res.message || "Không thể tạo yêu cầu nạp tiền");
  },

  /** Rút tiền về tài khoản ngân hàng (instant, không cần duyệt) */
  async createWithdraw(
    data: CreateWithdrawRequest
  ): Promise<WalletTransactionDto> {
    const res = await apiFetch<WalletTransactionDto>("/Wallets/withdraw", {
      method: "POST",
      body: JSON.stringify(data),
    });
    if (res.data) return res.data;
    throw new Error(res.message || "Không thể thực hiện rút tiền");
  },

  // ─── Admin Wallet ─────────────────────────────────────────────────────────

  /** [Admin] Danh sách ví người dùng + số dư */
  async adminGetWallets(
    filter: AdminWalletFilter = {}
  ): Promise<PagedResult<AdminWalletDetailDto>> {
    const params = new URLSearchParams();
    if (filter.keyword) params.set("keyword", filter.keyword);
    if (filter.walletStatus) params.set("status", filter.walletStatus);
    if (filter.pageIndex) params.set("pageIndex", String(filter.pageIndex));
    if (filter.pageSize) params.set("pageSize", String(filter.pageSize));

    const res = await apiFetch<PagedResult<AdminWalletDetailDto>>(
      `/Wallets/admin?${params.toString()}`
    );
    if (res.data) return res.data;
    throw new Error(res.message || "Không thể tải danh sách ví");
  },

  /** [Admin] Toàn bộ lịch sử giao dịch toàn sàn */
  async adminGetAllTransactions(
    filter: AdminWalletFilter = {}
  ): Promise<PagedResult<WalletTransactionDto>> {
    const params = new URLSearchParams();
    if (filter.userId) params.set("userId", filter.userId);
    if (filter.type) params.set("type", filter.type);
    if (filter.status) params.set("status", filter.status);
    if (filter.pageIndex) params.set("pageIndex", String(filter.pageIndex));
    if (filter.pageSize) params.set("pageSize", String(filter.pageSize));

    const res = await apiFetch<PagedResult<WalletTransactionDto>>(
      `/Wallets/admin/transactions?${params.toString()}`
    );
    if (res.data) return res.data;
    throw new Error(res.message || "Không thể tải lịch sử giao dịch");
  },

  /** [Admin] Đóng băng hoặc mở đóng băng ví */
  async adminFreezeWallet(
    walletId: string,
    freeze: boolean
  ): Promise<boolean> {
    const res = await apiFetch<boolean>(
      `/Wallets/admin/${walletId}/freeze?freeze=${freeze}`,
      { method: "PATCH" }
    );
    return res.success;
  },

  /** [Admin] Điều chỉnh số dư ví thủ công */
  async adminAdjustBalance(
    walletId: string,
    amount: number,
    reason: string
  ): Promise<boolean> {
    const res = await apiFetch<boolean>(
      `/Wallets/admin/${walletId}/adjust-balance?amount=${amount}&reason=${encodeURIComponent(reason)}`,
      { method: "POST" }
    );
    return res.success;
  },
};
