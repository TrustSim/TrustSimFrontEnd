import { apiFetch } from "./apiClient";
import { PagedResult } from "./simService";

export interface NotificationItemDto {
  id: string;
  userId: string;
  title: string;
  content: string;
  actionUrl?: string | null;
  isRead: boolean;
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
