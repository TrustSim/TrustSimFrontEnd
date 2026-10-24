// Kết quả phân trang chuẩn từ backend (PagedResult<T>)
export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  pageIndex: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

// Phản hồi chung từ API
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  errors?: string[];
}

export enum SortOrder {
  Desc = 0,
  Asc = 1,
}

export enum AuctionSortBy {
  CreatedDate = 1,
  CurrentPrice = 2,
  StartingPrice = 3,
  EndAt = 4,
  ReservePrice = 5,
  BidCount = 6,
  Status = 7,
}

export enum SimSortBy {
  CreatedDate = 1,
  Price = 2,
  PhoneNumber = 3,
  Status = 4,
}

export enum SimOwnershipSortBy {
  CreatedDate = 1,
  AssignedDate = 2,
  Status = 3,
}

export enum TradeTransactionSortBy {
  CreatedDate = 1,
  EscrowAmount = 2,
  Status = 3,
  TradeTransactionCode = 4,
}

export enum WalletTransactionSortBy {
  CreatedAt = 1,
  Amount = 2,
  Status = 3,
  TransactionType = 4,
  TransactionCode = 5,
}

export enum LedgerJournalSortBy {
  PostedAt = 1,
  CreatedDate = 2,
  JournalCode = 3,
  TransactionType = 4,
}

export enum UserAccountSortBy {
  CreatedDate = 1,
  UserName = 2,
  Email = 3,
  Role = 4,
  WalletBalance = 5,
  FullName = 6,
}

export enum KycSortBy {
  SubmittedAt = 1,
  FaceSimilarityScore = 2,
  Status = 3,
}

export enum DisputeTicketSortBy {
  CreatedDate = 1,
  Status = 2,
  TradeTransactionId = 3,
}

export enum NotificationSortBy {
  CreatedDate = 1,
  IsRead = 2,
}

export interface BaseQueryFilter<TSortBy = string | number> {
  pageIndex?: number;
  pageSize?: number;
  keyword?: string;
  sortBy?: TSortBy;
  sortOrder?: SortOrder | "Asc" | "Desc";
  fromDate?: string;
  toDate?: string;
}

// DTO gửi OTP
export interface SendOtpResponseDto {
  isSuccess: boolean;
  message: string;
  cooldownSeconds: number;
  expiryMinutes: number;
}

// DTO xác thực OTP
export interface VerifyOtpResponseDto {
  isValid: boolean;
  message: string;
  phoneNumber?: string;
  email?: string;
}
