import { apiFetch } from "./apiClient";
import { PagedResult } from "./simService";

export enum NotificationTypeEnum {
  SYSTEM_ALERT = 0,
  AUCTION_WON = 1,
  AUCTION_LOST = 2,
  AUCTION_SELLER_CONFIRMATION_REQUIRED = 3,
  AUCTION_RUNNER_UP_OFFERED = 4,
  AUCTION_DEPOSIT_REFUNDED = 5,
  AUCTION_DEPOSIT_FORFEITED = 6,
  AUCTION_FAILED = 7,
  WALLET_TOPUP_SUCCESS = 8,
  WALLET_WITHDRAWAL_COMPLETED = 9,
  TRADE_TRANSFERRING_SIM = 10,
  CONTRACT_SIGNING_REQUIRED = 11,
  CONTRACT_FULLY_SIGNED = 12,
  SELLER_SIGNING_TIMEOUT_AUTO_ENFORCED = 13,
}

export interface NotificationItemDto {
  id: string;
  userId: string;
  title: string;
  content: string;
  notificationType?: number | string;
  referenceType?: string | null;
  referenceId?: string | null;
  metadataJson?: string | null;
  actionUrl?: string | null;
  isRead: boolean;
  readAt?: string | null;
  createdDate: string;
}

export interface GetNotificationsParams {
  isRead?: boolean;
  pageIndex?: number;
  pageSize?: number;
}

export interface BroadcastNotificationPayload {
  title: string;
  content: string;
  actionUrl?: string;
  targetRole?: string;
}

/**
 * Lấy danh sách thông báo phân trang của người dùng hiện tại
 */
export async function getMyNotifications(
  params: GetNotificationsParams = {}
): Promise<PagedResult<NotificationItemDto>> {
  const query = new URLSearchParams();
  if (params.isRead !== undefined) query.set("isRead", String(params.isRead));
  query.set("pageIndex", String(params.pageIndex ?? 1));
  query.set("pageSize", String(params.pageSize ?? 20));

  const res = await apiFetch<PagedResult<NotificationItemDto>>(
    `/notifications?${query.toString()}`
  );
  if (!res.data) {
    return {
      items: [],
      totalCount: 0,
      pageIndex: 1,
      pageSize: params.pageSize ?? 20,
      totalPages: 0,
      hasPreviousPage: false,
      hasNextPage: false,
    };
  }
  return res.data;
}

/**
 * Lấy số lượng thông báo chưa đọc của người dùng hiện tại
 */
export async function getUnreadNotificationCount(): Promise<number> {
  const res = await apiFetch<number>("/notifications/unread-count");
  return res.data ?? 0;
}

/**
 * Đánh dấu một thông báo đã đọc
 */
export async function markNotificationAsRead(id: string): Promise<boolean> {
  const res = await apiFetch<boolean>(`/notifications/${id}/read`, {
    method: "PATCH",
  });
  return res.data ?? res.success ?? false;
}

/**
 * [Quản trị viên] Gửi thông báo phát sóng toàn sàn hoặc tới nhóm vai trò
 */
export async function broadcastNotification(
  payload: BroadcastNotificationPayload
): Promise<number> {
  const res = await apiFetch<number>("/notifications/broadcast", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return res.data ?? 0;
}

export interface NotificationVisualMeta {
  label: string;
  category: "auction" | "wallet" | "contract" | "system";
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  iconBg: string;
  iconText: string;
}

/**
 * Helper định danh thẩm mỹ và phân loại cho từng NotificationType
 */
export function getNotificationVisualMeta(
  type?: number | string
): NotificationVisualMeta {
  const t = typeof type === "string" ? parseInt(type, 10) : type;

  switch (t) {
    case NotificationTypeEnum.AUCTION_WON:
      return {
        label: "Trúng đấu giá",
        category: "auction",
        badgeBg: "bg-emerald-50",
        badgeText: "text-emerald-700",
        badgeBorder: "border-emerald-200",
        iconBg: "bg-emerald-50 text-emerald-600 border-emerald-200",
        iconText: "text-emerald-600",
      };
    case NotificationTypeEnum.AUCTION_LOST:
      return {
        label: "Hết lượt đấu",
        category: "auction",
        badgeBg: "bg-slate-50",
        badgeText: "text-slate-600",
        badgeBorder: "border-slate-200",
        iconBg: "bg-slate-100 text-slate-500 border-slate-200",
        iconText: "text-slate-500",
      };
    case NotificationTypeEnum.AUCTION_SELLER_CONFIRMATION_REQUIRED:
    case NotificationTypeEnum.AUCTION_RUNNER_UP_OFFERED:
      return {
        label: "Xác nhận Á quân",
        category: "auction",
        badgeBg: "bg-amber-50",
        badgeText: "text-amber-800",
        badgeBorder: "border-amber-200",
        iconBg: "bg-amber-50 text-amber-600 border-amber-200",
        iconText: "text-amber-600",
      };
    case NotificationTypeEnum.AUCTION_DEPOSIT_REFUNDED:
      return {
        label: "Hoàn tiền cọc",
        category: "wallet",
        badgeBg: "bg-blue-50",
        badgeText: "text-blue-700",
        badgeBorder: "border-blue-200",
        iconBg: "bg-blue-50 text-blue-600 border-blue-200",
        iconText: "text-blue-600",
      };
    case NotificationTypeEnum.AUCTION_DEPOSIT_FORFEITED:
      return {
        label: "Tịch thu cọc",
        category: "wallet",
        badgeBg: "bg-rose-50",
        badgeText: "text-rose-700",
        badgeBorder: "border-rose-200",
        iconBg: "bg-rose-50 text-rose-600 border-rose-200",
        iconText: "text-rose-600",
      };
    case NotificationTypeEnum.AUCTION_FAILED:
      return {
        label: "Phiên hủy",
        category: "auction",
        badgeBg: "bg-rose-50",
        badgeText: "text-rose-700",
        badgeBorder: "border-rose-200",
        iconBg: "bg-rose-50 text-rose-600 border-rose-200",
        iconText: "text-rose-600",
      };
    case NotificationTypeEnum.WALLET_TOPUP_SUCCESS:
      return {
        label: "Nạp tiền ví",
        category: "wallet",
        badgeBg: "bg-emerald-50",
        badgeText: "text-emerald-700",
        badgeBorder: "border-emerald-200",
        iconBg: "bg-emerald-50 text-emerald-600 border-emerald-200",
        iconText: "text-emerald-600",
      };
    case NotificationTypeEnum.WALLET_WITHDRAWAL_COMPLETED:
      return {
        label: "Rút tiền ví",
        category: "wallet",
        badgeBg: "bg-blue-50",
        badgeText: "text-blue-700",
        badgeBorder: "border-blue-200",
        iconBg: "bg-blue-50 text-blue-600 border-blue-200",
        iconText: "text-blue-600",
      };
    case NotificationTypeEnum.TRADE_TRANSFERRING_SIM:
      return {
        label: "Bàn giao SIM",
        category: "contract",
        badgeBg: "bg-indigo-50",
        badgeText: "text-indigo-700",
        badgeBorder: "border-indigo-200",
        iconBg: "bg-indigo-50 text-indigo-600 border-indigo-200",
        iconText: "text-indigo-600",
      };
    case NotificationTypeEnum.CONTRACT_SIGNING_REQUIRED:
    case NotificationTypeEnum.SELLER_SIGNING_TIMEOUT_AUTO_ENFORCED:
      return {
        label: "Yêu cầu ký số",
        category: "contract",
        badgeBg: "bg-amber-50",
        badgeText: "text-amber-800",
        badgeBorder: "border-amber-200",
        iconBg: "bg-amber-50 text-amber-600 border-amber-200",
        iconText: "text-amber-600",
      };
    case NotificationTypeEnum.CONTRACT_FULLY_SIGNED:
      return {
        label: "Hợp đồng hoàn tất",
        category: "contract",
        badgeBg: "bg-emerald-50",
        badgeText: "text-emerald-700",
        badgeBorder: "border-emerald-200",
        iconBg: "bg-emerald-50 text-emerald-600 border-emerald-200",
        iconText: "text-emerald-600",
      };
    default:
      return {
        label: "Thông báo hệ thống",
        category: "system",
        badgeBg: "bg-slate-100",
        badgeText: "text-slate-700",
        badgeBorder: "border-slate-200",
        iconBg: "bg-slate-100 text-slate-600 border-slate-200",
        iconText: "text-slate-600",
      };
  }
}
