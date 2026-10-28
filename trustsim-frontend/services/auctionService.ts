import { apiFetch } from "./apiClient";
import { withQuery } from "./queryParams";
import type { AuctionSortBy, BaseQueryFilter } from "@/types/common";
import type { AuctionBidQueryFilter, PendingSettlementQueryFilter } from "@/types/api-filters";

export interface PagedResult<T> {
  items: T[];
  pageIndex: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export enum AuctionTypeEnum {
  ENGLISH = 0,
  DUTCH = 1,
}

export enum AuctionStatusEnum {
  DRAFT = 0,
  SCHEDULE = 1,
  ACTIVE = 2,
  END = 3,
  CANCELLED = 4,
}

export interface AuctionDto {
  id: string;
  auctionCode: string;
  auctionType: "ENGLISH" | "DUTCH" | string;
  auctionStatus: "DRAFT" | "SCHEDULE" | "ACTIVE" | "END" | "CANCELLED" | string;
  startingPrice: number;
  currentPrice: number;
  reservePrice: number;
  startAt: string;
  endAt: string;
  registrationStartAt: string;
  registrationEndAt: string;
  authorId: string;
  authorName: string;
  simNumberId: string;
  simPhoneNumber: string;
  carrierName: string;
  totalParticipants: number;
  totalBids: number;
  minBidStep: number;
  maxStepMultiplier?: number;
  maxSnipeExtensionsPerParticipant?: number;
  paymentGracePeriodHours?: number;
  depositAmount: number;
  extensionDurationSeconds: number;
  dutchDecreaseAmount?: number;
  dutchDecreaseIntervalSeconds?: number;
  formatRhythmName?: string;
  categories?: string[];
  isUserRegistered?: boolean;
  result?: AuctionResultDto;
}

export interface AuctionResultDto {
  id?: string;
  auctionId: string;
  winnerId?: string | null;
  winnerUserName?: string | null;
  winnerFullName?: string | null;
  finalPrice: number;
  initialWinnerId?: string | null;
  initialWinnerUserName?: string | null;
  initialWinnerFullName?: string | null;
  initialWinningPrice?: number | null;
  runnerUpParticipantId?: string | null;
  runnerUpUserName?: string | null;
  runnerUpFullName?: string | null;
  runnerUpFinalPrice?: number | null;
  winType: number | string;
  priceGapRatio?: number | null;
  sellerCompensationAmount?: number | null;
  auctionResultStatus: number | string;
  paymentDeadline?: string | null;
  isRunnerUpOffered?: boolean;
  runnerUpPaymentDeadline?: string | null;
  settledAt?: string | null;
  determinedAt?: string | null;
  confirmedAt?: string | null;
  cancelledReason?: string | null;
}

export interface BidDto {
  id: string;
  auctionId: string;
  participantId: string;
  userAccountId: string;
  userNameMasked: string;
  bidAmount: number;
  placedAt: string;
  status: "WINNING" | "ACCEPTED" | "OUTBIB" | "REJECTED" | string;
}

export interface AuctionListItemDto {
  auctionId: string;
  auctionCode: string;
  auctionType: number | AuctionTypeEnum;
  auctionTypeName: string;
  auctionStatus: number | AuctionStatusEnum;
  auctionStatusName: string;
  simNumberId: string;
  phoneNumber: string;
  carrierName?: string;
  formatRhythmName?: string;
  startingPrice: number;
  currentPrice: number;
  reservePrice: number;
  startAt: string;
  endAt: string;
  registrationStartAt: string;
  registrationEndAt: string;
  authorId?: string;
  authorName?: string;
  authorEmail?: string;
}

export interface AuctionRuleDto {
  auctionId: string;
  stepPrice: number;
  bidExtensionSeconds: number;
  maximumExtensionCount: number;
  dutchDecreaseAmount: number;
  dutchDecreaseIntervalSeconds: number;
}

export interface AuctionDetailDto extends AuctionListItemDto {
  categories?: string[];
  rule?: AuctionRuleDto;
  createdDate?: string;
  updatedDate?: string;
}

export interface GetAdminAuctionsParams extends BaseQueryFilter<AuctionSortBy> {
  auctionType?: number;
  status?: number;
  authorId?: string;
  keyword?: string;
  /** @deprecated Dùng keyword. */
  search?: string;
  carrierId?: string;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
}

export interface PendingSettlementDto {
  auctionId: string;
  auctionCode: string;
  simPhoneNumber: string;
  carrierName: string;
  auctionType: number | string;
  auctionStatus: number | string;
  auctionResultStatus: number | string;
  role: "WINNER" | "RUNNER_UP" | "SELLER" | string;
  actionRequired: "PAY_SETTLEMENT" | "DECIDE_RUNNER_UP" | "RESPOND_RUNNER_UP_OFFER" | string;
  finalPrice: number;
  depositLocked: number;
  remainingPaymentRequired: number;
  availableBalance: number;
  deficitAmount: number;
  canDirectPay: boolean;
  deadline?: string;
  remainingSeconds?: number;
  runnerUpFinalPrice?: number;
  runnerUpParticipantId?: string;
}

export interface GetAuctionsParams extends BaseQueryFilter<AuctionSortBy> {
  status?: string | number;
  type?: string | number;
  authorId?: string;
  participantId?: string;
  carrierId?: string;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  role?: "author" | "participant";
  /** @deprecated Dùng role: "participant". */
  myParticipations?: boolean;
  /** @deprecated Dùng role: "author". */
  myAuctions?: boolean;
}

export interface CalculateSellerDepositResultDto {
  startingPrice: number;
  depositRate: number;
  rawDeposit: number;
  sellerDepositAmount: number;
  minDepositAmount: number;
  maxDepositAmount: number;
  isMinClamped: boolean;
  isMaxClamped: boolean;
  formulaText: string;
  breakdownText: string;
}

export interface CreateAuctionPayload {
  simNumberId: string;
  auctionType: number;
  startingPrice: number;
  reservePrice?: number;
  startAt: string;
  endAt: string;
  registrationStartAt?: string;
  registrationEndAt?: string;
  depositAmount?: number;
  // English Auction Rules
  minimumBidIncrement?: number;
  maxStepMultiplier?: number;
  extensionThresholdSeconds?: number;
  extensionDurationSeconds?: number;
  maximumExtensionCount?: number;
  maxSnipeExtensionsPerParticipant?: number;
  // Runner-Up & Anti-shill Rules
  marginPercentage?: number;
  maxPriceGapRatioForRunnerUp?: number;
  minimumUniqueBiddersForRunnerUp?: number;
  requireSellerApprovalForRunnerUp?: boolean;
  // Dutch Auction Rules
  dutchDecreaseAmount?: number;
  dutchDecreaseIntervalSeconds?: number;
  // Common Rules
  maximumBidCountPerParticipant?: number;
  maximumBidCountPerMinute?: number;
  minimumBidIntervalSeconds?: number;
  paymentGracePeriodHours?: number;
  paymentGracePeriodMinutes?: number;
  // Legacy aliases (backward compat)
  stepPrice?: number;
  bidExtensionSeconds?: number;
}

export const auctionService = {
  /**
   * Lấy danh sách các phiên đấu giá công khai từ Backend (hỗ trợ search mã phiên, số sim, lọc trạng thái, loại hình, phiên tôi tạo, phiên tôi tham gia)
   */
  async getAuctions(params: GetAuctionsParams = {}): Promise<PagedResult<AuctionDto>> {
    const role = params.role ?? (params.myParticipations ? "participant" : params.myAuctions ? "author" : undefined);
    const endpoint = withQuery("/Auctions", {
      keyword: params.keyword,
      status: params.status,
      type: params.type,
      authorId: params.authorId,
      participantId: params.participantId,
      carrierId: params.carrierId,
      categoryId: params.categoryId,
      minPrice: params.minPrice,
      maxPrice: params.maxPrice,
      role,
      fromDate: params.fromDate,
      toDate: params.toDate,
      sortBy: params.sortBy,
      sortOrder: params.sortOrder,
      pageIndex: params.pageIndex ?? 1,
      pageSize: params.pageSize ?? 10,
    });
    const res = await apiFetch<PagedResult<AuctionDto>>(endpoint);

    if (res.data) {
      return res.data;
    }

    return {
      items: [],
      pageIndex: params.pageIndex || 1,
      pageSize: params.pageSize || 20,
      totalCount: 0,
      totalPages: 0,
      hasPreviousPage: false,
      hasNextPage: false,
    };
  },

  /**
   * [ADMIN] Lấy danh sách phiên đấu giá có phân trang và bộ lọc từ Backend
   */
  async getAdminAuctions(params: GetAdminAuctionsParams = {}): Promise<PagedResult<AuctionListItemDto>> {
    const query = withQuery("", {
      pageIndex: params.pageIndex ?? 1,
      pageSize: params.pageSize ?? 10,
      type: params.auctionType,
      status: params.status,
      keyword: params.keyword ?? params.search,
      authorId: params.authorId,
      carrierId: params.carrierId,
      categoryId: params.categoryId,
      minPrice: params.minPrice,
      maxPrice: params.maxPrice,
      fromDate: params.fromDate,
      toDate: params.toDate,
      sortBy: params.sortBy,
      sortOrder: params.sortOrder,
    }).replace(/^\?/, "");

    try {
      const endpoint = `/admin/auctions${query ? `?${query}` : ""}`;
      const res = await apiFetch<PagedResult<AuctionListItemDto>>(endpoint);
      if (res.data) {
        return res.data;
      }
    } catch {
      // Backend chưa có route /admin/auctions riêng -> truy vấn endpoint /Auctions chính thức
      try {
        const res = await apiFetch<PagedResult<AuctionDto>>(`/Auctions${query ? `?${query}` : ""}`);
        if (res.data) {
          return {
            pageIndex: res.data.pageIndex,
            pageSize: res.data.pageSize,
            totalCount: res.data.totalCount,
            totalPages: res.data.totalPages,
            hasPreviousPage: res.data.hasPreviousPage,
            hasNextPage: res.data.hasNextPage,
            items: (res.data.items || []).map((item) => ({
              auctionId: item.id,
              auctionCode: item.auctionCode,
              auctionType:
                item.auctionType === "DUTCH" || String(item.auctionType) === "1"
                  ? AuctionTypeEnum.DUTCH
                  : AuctionTypeEnum.ENGLISH,
              auctionTypeName: item.auctionType,
              auctionStatus:
                item.auctionStatus === "SCHEDULE" || String(item.auctionStatus) === "1"
                  ? AuctionStatusEnum.SCHEDULE
                  : item.auctionStatus === "ACTIVE" || String(item.auctionStatus) === "2"
                  ? AuctionStatusEnum.ACTIVE
                  : item.auctionStatus === "END" || String(item.auctionStatus) === "3"
                  ? AuctionStatusEnum.END
                  : AuctionStatusEnum.DRAFT,
              auctionStatusName: item.auctionStatus,
              simNumberId: item.simNumberId,
              phoneNumber: item.simPhoneNumber,
              carrierName: item.carrierName,
              formatRhythmName: item.formatRhythmName,
              startingPrice: item.startingPrice,
              currentPrice: item.currentPrice,
              reservePrice: item.reservePrice,
              startAt: item.startAt,
              endAt: item.endAt,
              registrationStartAt: item.registrationStartAt,
              registrationEndAt: item.registrationEndAt,
              authorName: item.authorName,
              totalParticipants: item.totalParticipants,
              totalBids: item.totalBids,
            })),
          };
        }
      } catch (innerErr) {
        console.warn("[AuctionService] Lỗi khi truy vấn /Auctions fallback cho Admin:", innerErr);
      }
    }

    return {
      items: [],
      pageIndex: params.pageIndex || 1,
      pageSize: params.pageSize || 10,
      totalCount: 0,
      totalPages: 0,
      hasPreviousPage: false,
      hasNextPage: false,
    };
  },

  /**
   * [ADMIN] Xem chi tiết 1 phiên đấu giá
   */
  async getAdminAuctionDetail(id: string): Promise<AuctionDetailDto> {
    const res = await apiFetch<AuctionDetailDto>(`/admin/auctions/${id}`);
    if (!res.data) throw new Error(res.message || "Không thể tải chi tiết phiên đấu giá.");
    return res.data;
  },

  /**
   * [ADMIN] Kích hoạt thủ công phiên đấu giá (SCHEDULE -> ACTIVE)
   */
  async activateAuction(id: string): Promise<boolean> {
    const res = await apiFetch<object>(`/admin/auctions/${id}/activate`, {
      method: "POST",
    });
    return res.success;
  },

  /**
   * [ADMIN] Hủy phiên đấu giá kèm lý do bắt buộc
   */
  async cancelAuction(id: string, reason: string): Promise<boolean> {
    const res = await apiFetch<object>(`/admin/auctions/${id}/cancel`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    });
    return res.success;
  },

  /**
   * Tạo phiên đấu giá mới
   */
  async createAuction(payload: CreateAuctionPayload): Promise<any> {
    const res = await apiFetch<any>("/auctions", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (!res.data) throw new Error(res.message || "Tạo phiên đấu giá không thành công.");
    return res.data;
  },

  /**
   * Lấy chi tiết phiên đấu giá từ Backend (Public API)
   */
  async getAuctionById(id: string): Promise<AuctionDto> {
    const res = await apiFetch<AuctionDto>(`/Auctions/${id}`);
    if (!res.data) throw new Error(res.message || "Không thể tải thông tin phiên đấu giá.");
    return res.data;
  },

  /**
   * Lấy lịch sử trả giá (Bids) của phiên đấu giá từ Backend (Public API)
   */
  async getAuctionBids(id: string, filter: AuctionBidQueryFilter = {}): Promise<PagedResult<BidDto>> {
    const pageIndex = filter.pageIndex ?? 1;
    const pageSize = filter.pageSize ?? 20;
    const res = await apiFetch<PagedResult<BidDto>>(withQuery(`/Auctions/${id}/bids`, {
      ...filter,
      pageIndex,
      pageSize,
    }));
    return res.data || { items: [], pageIndex, pageSize, totalCount: 0, totalPages: 0, hasPreviousPage: false, hasNextPage: false };
  },

  /**
   * Trả giá (Đặt Bid) trong phiên đấu giá
   */
  async placeBid(id: string, amount: number): Promise<BidDto> {
    const res = await apiFetch<BidDto>(`/Auctions/${id}/bids`, {
      method: "POST",
      body: JSON.stringify({ bidAmount: amount }),
    });
    if (!res.data) throw new Error(res.message || "Đặt giá không thành công.");
    return res.data;
  },

  /**
   * Đăng ký tham gia phiên đấu giá
   */
  async registerParticipant(id: string): Promise<boolean> {
    const res = await apiFetch<boolean>(`/Auctions/${id}/register`, {
      method: "POST",
    });
    return res.success;
  },

  /**
   * Lấy danh sách các phiên đấu giá đang cần người dùng thanh toán hoặc xử lý quyết định
   */
  async getPendingSettlements(filter: PendingSettlementQueryFilter = {}): Promise<PagedResult<PendingSettlementDto>> {
    const pageIndex = filter.pageIndex ?? 1;
    const pageSize = filter.pageSize ?? 20;
    const res = await apiFetch<PagedResult<PendingSettlementDto>>(withQuery("/Auctions/my-pending-settlements", {
      ...filter,
      pageIndex,
      pageSize,
    }));
    return res.data || { items: [], pageIndex, pageSize, totalCount: 0, totalPages: 0, hasPreviousPage: false, hasNextPage: false };
  },

  /**
   * Người thắng hoàn tất thanh toán số tiền còn lại
   */
  async confirmWinnerPayment(auctionId: string): Promise<any> {
    const res = await apiFetch<any>(`/Auctions/${auctionId}/confirm-payment`, {
      method: "POST",
    });
    if (!res.success) throw new Error(res.message || "Thanh toán không thành công.");
    return res.data;
  },

  /**
   * Người thắng chủ động từ bỏ quyền mua SIM (chấp nhận phạt cọc)
   */
  async forfeitWinnerPurchase(auctionId: string, reason?: string): Promise<any> {
    const res = await apiFetch<any>(`/Auctions/${auctionId}/forfeit-purchase`, {
      method: "POST",
      body: JSON.stringify({ reason: reason || "Người dùng chủ động từ bỏ" }),
    });
    if (!res.success) throw new Error(res.message || "Từ bỏ quyền mua không thành công.");
    return res.data;
  },

  /**
   * Người về nhì chấp nhận mua SIM
   */
  async acceptRunnerUpOffer(auctionId: string): Promise<any> {
    const res = await apiFetch<any>(`/Auctions/${auctionId}/runner-up/accept`, {
      method: "POST",
    });
    if (!res.success) throw new Error(res.message || "Chấp nhận nhận mua không thành công.");
    return res.data;
  },

  /**
   * Người về nhì từ chối mua SIM
   */
  async rejectRunnerUpOffer(auctionId: string): Promise<any> {
    const res = await apiFetch<any>(`/Auctions/${auctionId}/runner-up/reject`, {
      method: "POST",
    });
    if (!res.success) throw new Error(res.message || "Từ chối không thành công.");
    return res.data;
  },

  /**
   * Người bán duyệt bán hoặc từ chối bán SIM cho Á quân
   */
  async sellerDecideRunnerUp(
    auctionId: string,
    isApproved: boolean,
    rejectionReason?: string
  ): Promise<any> {
    const res = await apiFetch<any>(`/Auctions/${auctionId}/runner-up/seller-decision`, {
      method: "POST",
      body: JSON.stringify({ isApproved, rejectionReason: rejectionReason || "" }),
    });
    if (!res.success) throw new Error(res.message || "Xử lý phê duyệt không thành công.");
    return res.data;
  },

  /**
   * Chấp nhận mua ngay trong phiên đấu giá kiểu Hà Lan (Dutch Auction)
   */
  async acceptDutchBuy(auctionId: string): Promise<any> {
    const res = await apiFetch<any>(`/Auctions/${auctionId}/dutch-buy`, {
      method: "POST",
    });
    if (!res.success) throw new Error(res.message || "Chấp nhận mua SIM không thành công.");
    return res.data;
  },

  /**
   * Tính toán tiền cọc Người Bán (Seller Deposit) từ server dựa trên Giá khởi điểm
   */
  async calculateSellerDeposit(startingPrice: number): Promise<CalculateSellerDepositResultDto> {
    const res = await apiFetch<CalculateSellerDepositResultDto>(
      `/Auctions/calculate-seller-deposit?startingPrice=${startingPrice}`
    );
    if (!res.data) throw new Error(res.message || "Không thể tính toán tiền cọc người bán.");
    return res.data;
  },
};
