import { apiFetch } from "./apiClient";

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
  depositAmount: number;
  extensionDurationSeconds: number;
  dutchDecreaseAmount?: number;
  dutchDecreaseIntervalSeconds?: number;
  formatRhythmName?: string;
  categories?: string[];
  isUserRegistered?: boolean;
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

export interface GetAdminAuctionsParams {
  pageIndex?: number;
  pageSize?: number;
  auctionType?: number;
  status?: number;
  authorId?: string;
  search?: string;
  startFrom?: string;
  startTo?: string;
}

export interface GetAuctionsParams {
  keyword?: string;
  status?: string | number;
  type?: string | number;
  authorId?: string;
  pageIndex?: number;
  pageSize?: number;
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
  stepPrice?: number;
  bidExtensionSeconds?: number;
  maximumExtensionCount?: number;
  dutchDecreaseAmount?: number;
  dutchDecreaseIntervalSeconds?: number;
}

export const auctionService = {
  /**
   * Lấy danh sách các phiên đấu giá công khai từ Backend (hỗ trợ search mã phiên, số sim, lọc trạng thái, loại hình)
   */
  async getAuctions(params: GetAuctionsParams = {}): Promise<PagedResult<AuctionDto>> {
    const query = new URLSearchParams();
    if (params.keyword) query.append("keyword", params.keyword.trim());
    if (params.status !== undefined && params.status !== null && params.status !== "") {
      query.append("status", params.status.toString());
    }
    if (params.type !== undefined && params.type !== null && params.type !== "") {
      query.append("type", params.type.toString());
    }
    if (params.authorId) query.append("authorId", params.authorId);
    if (params.pageIndex) query.append("pageIndex", params.pageIndex.toString());
    if (params.pageSize) query.append("pageSize", params.pageSize.toString());

    const queryString = query.toString();
    const endpoint = `/Auctions${queryString ? `?${queryString}` : ""}`;
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
    const query = new URLSearchParams();
    if (params.pageIndex) query.append("pageIndex", params.pageIndex.toString());
    if (params.pageSize) query.append("pageSize", params.pageSize.toString());
    if (params.auctionType !== undefined && params.auctionType !== null) {
      query.append("auctionType", params.auctionType.toString());
    }
    if (params.status !== undefined && params.status !== null) {
      query.append("status", params.status.toString());
    }
    if (params.search) query.append("search", params.search);
    if (params.authorId) query.append("authorId", params.authorId);
    if (params.startFrom) query.append("startFrom", params.startFrom);
    if (params.startTo) query.append("startTo", params.startTo);

    const queryString = query.toString();
    const endpoint = `/admin/auctions${queryString ? `?${queryString}` : ""}`;
    const res = await apiFetch<PagedResult<AuctionListItemDto>>(endpoint);

    if (res.data) {
      return res.data;
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
  async getAuctionBids(id: string, top: number = 50): Promise<BidDto[]> {
    const res = await apiFetch<BidDto[]>(`/Auctions/${id}/bids?top=${top}`);
    return res.data || [];
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
};
