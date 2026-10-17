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
  LedgerJournalDto,
  LedgerJournalFilter,
  LedgerIntegrityReportDto,
  PaymentIntentDto,
} from "@/types/wallet";
import type { PagedResult } from "@/types/common";

const DEMO_DEPOSIT_STORAGE_KEY = "trustsim_demo_deposit_total";

function getDemoDepositTotal(): number {
  if (typeof window === "undefined") return 0;
  const value = Number.parseInt(localStorage.getItem(DEMO_DEPOSIT_STORAGE_KEY) || "0", 10);
  return Number.isFinite(value) && value > 0 ? value : 0;
}

export function addDemoDeposit(amount: number): number {
  const nextTotal = getDemoDepositTotal() + amount;
  localStorage.setItem(DEMO_DEPOSIT_STORAGE_KEY, String(nextTotal));
  window.dispatchEvent(new CustomEvent("trustsim_demo_wallet_updated"));
  return nextTotal;
}

export const walletService = {
  // ─── User Wallet ──────────────────────────────────────────────────────────

  /** Lấy thông tin ví và số dư của tài khoản đang đăng nhập */
  async getMyWallet(): Promise<WalletDto> {
    const res = await apiFetch<WalletDto>("/Wallets/me");
    if (res.data) {
      // Demo-only overlay: không ghi dữ liệu giả lập vào backend.
      const demoAmount = getDemoDepositTotal();
      if (demoAmount > 0) {
        return {
          ...res.data,
          availableBalance: res.data.availableBalance + demoAmount,
          totalBalance: res.data.totalBalance + demoAmount,
        };
      }
      return res.data;
    }
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
   * @deprecated Dùng createDepositIntent thay thế để có Idempotency đảm bảo hơn
   */
  async createDeposit(data: CreateDepositRequest): Promise<DepositResponseDto> {
    const res = await apiFetch<DepositResponseDto>("/Wallets/deposit", {
      method: "POST",
      body: JSON.stringify(data),
    });
    if (res.data) return res.data;
    throw new Error(res.message || "Không thể tạo yêu cầu nạp tiền");
  },

  /**
   * [Idempotent] Tạo Payment Intent nạp tiền chuẩn Idempotent
   * → Endpoint: POST /api/Wallets/deposit-intent
   * → Dùng idempotencyKey để tránh tạo trùng lệnh nạp
   */
  async createDepositIntent(
    amount: number,
    idempotencyKey?: string
  ): Promise<PaymentIntentDto> {
    const key =
      idempotencyKey ||
      `DEP-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
    const res = await apiFetch<PaymentIntentDto>("/Wallets/deposit-intent", {
      method: "POST",
      body: JSON.stringify({ amount, idempotencyKey: key }),
    });
    if (res.data) return res.data;
    throw new Error(res.message || "Không thể tạo Payment Intent nạp tiền");
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

  // ─── Admin Ledger (Sổ cái kế toán ghi kép) ───────────────────────────────

  /** [Admin] Danh sách chứng từ kế toán ghi kép (phân trang & lọc theo loại, ngày) */
  async adminGetLedgerJournals(
    filter: LedgerJournalFilter = {}
  ): Promise<PagedResult<LedgerJournalDto>> {
    const params = new URLSearchParams();
    if (filter.transactionType) params.set("transactionType", filter.transactionType);
    if (filter.fromDate) params.set("fromDate", filter.fromDate);
    if (filter.toDate) params.set("toDate", filter.toDate);
    if (filter.pageIndex) params.set("pageIndex", String(filter.pageIndex));
    if (filter.pageSize) params.set("pageSize", String(filter.pageSize));

    const res = await apiFetch<PagedResult<LedgerJournalDto>>(
      `/Wallets/admin/ledger/journals?${params.toString()}`
    );
    if (res.data) return res.data;
    throw new Error(res.message || "Không thể tải danh sách chứng từ");
  },

  /** [Admin] Chi tiết một chứng từ kế toán (Nợ/Có, Hash, Chữ ký số) */
  async adminGetLedgerJournalDetail(id: string): Promise<LedgerJournalDto> {
    const res = await apiFetch<LedgerJournalDto>(
      `/Wallets/admin/ledger/journals/${id}`
    );
    if (res.data) return res.data;
    throw new Error(res.message || "Không tìm thấy chứng từ");
  },

  /** [Admin] Báo cáo đối soát tài chính: Sổ cái kép vs Materialized Balance */
  async adminGetLedgerAudit(): Promise<LedgerIntegrityReportDto> {
    const res = await apiFetch<LedgerIntegrityReportDto>(
      "/Wallets/admin/ledger/audit"
    );
    if (res.data) return res.data;
    throw new Error(res.message || "Không thể tải báo cáo đối soát");
  },

  /** [Admin] Kiểm tra tính toàn vẹn chuỗi Hash SHA-256 + Chữ ký ECDsa */
  async adminVerifyLedgerChain(
    fromSequence = 1,
    limit = 10000
  ): Promise<LedgerIntegrityReportDto> {
    const res = await apiFetch<LedgerIntegrityReportDto>(
      `/Wallets/admin/ledger/verify-chain?fromSequence=${fromSequence}&limit=${limit}`,
      { method: "POST" }
    );
    if (res.data) return res.data;
    throw new Error(res.message || "Không thể kiểm tra chuỗi giao dịch");
  },

  /** [Admin] Xuất lịch sử giao dịch toàn sàn ra file Excel (.xlsx) */
  async adminExportTransactions(type?: string, status?: string): Promise<Blob> {
    const params = new URLSearchParams();
    if (type) params.set("type", type);
    if (status) params.set("status", status);

    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("accessToken") ||
          localStorage.getItem("trustsim_token")
        : null;

    const baseUrl =
      process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, "") ||
      "http://localhost:5130";

    const response = await fetch(
      `${baseUrl}/api/Wallets/admin/transactions/export?${params.toString()}`,
      {
        headers: { Authorization: token ? `Bearer ${token}` : "" },
      }
    );
    if (!response.ok) throw new Error("Không thể xuất file Excel");
    return response.blob();
  },
};
