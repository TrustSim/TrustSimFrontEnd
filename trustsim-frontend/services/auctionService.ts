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
};
