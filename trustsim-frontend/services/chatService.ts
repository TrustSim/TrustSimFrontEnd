import { apiFetch } from "./apiClient";
import type { PagedResult } from "@/types/common";

export type ConversationType = "DIRECT" | "SUPPORT";
export type SupportStatus = "NONE" | "PENDING" | "CLAIMED" | "RESOLVED";

export interface ChatParticipant {
  userId: string;
  fullName: string;
  userName: string;
  avatarUrl?: string;
  isIdentityVerified: boolean;
}

export interface ChatConversation {
  id: string;
  type: ConversationType;
  supportStatus: SupportStatus;
  displayTitle: string;
  displayAvatarUrl?: string;
  initiator: ChatParticipant;
  participant?: ChatParticipant;
  assignedStaff?: ChatParticipant;
  lastMessagePreview?: string;
  lastMessageAt?: string;
  unreadCount: number;
  canClaim: boolean;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  messageType: "TEXT" | "IMAGE" | "PDF_DOCUMENT" | "SYSTEM";
  content: string;
  attachmentUrl?: string;
  attachmentFileName?: string;
  createdDate: string;
  isRead: boolean;
  isAttachmentExpired?: boolean;
}

async function requireData<T>(promise: Promise<{ data?: T; message?: string }>, fallback: string): Promise<T> {
  const response = await promise;
  if (response.data !== undefined) return response.data;
  throw new Error(response.message || fallback);
}

export const chatService = {
  list: (type?: ConversationType, supportStatus?: SupportStatus) => requireData(
    apiFetch<PagedResult<ChatConversation>>(`/Chat/conversations?pageIndex=1&pageSize=100${type ? `&type=${type}` : ""}${supportStatus ? `&supportStatus=${supportStatus}` : ""}`),
    "Không thể tải hội thoại"
  ),
  messages: (id: string, pageIndex = 1) => requireData(
    apiFetch<PagedResult<ChatMessage>>(`/Chat/conversations/${encodeURIComponent(id)}/messages?pageIndex=${pageIndex}&pageSize=50`),
    "Không thể tải tin nhắn"
  ),
  support: (initialMessage?: string) => requireData(
    apiFetch<ChatConversation>("/Chat/conversations/support", { method: "POST", body: JSON.stringify({ initialMessage }) }),
    "Không thể mở yêu cầu hỗ trợ"
  ),
  direct: (targetUserId: string) => requireData(
    apiFetch<ChatConversation>("/Chat/conversations/direct", { method: "POST", body: JSON.stringify({ targetUserId }) }),
    "Không thể mở hội thoại"
  ),
  claim: (id: string) => requireData(
    apiFetch<ChatConversation>(`/Chat/conversations/${encodeURIComponent(id)}/claim`, { method: "POST" }),
    "Không thể tiếp nhận hội thoại"
  ),
  resolve: (id: string) => requireData(
    apiFetch<ChatConversation>(`/Chat/conversations/${encodeURIComponent(id)}/resolve`, { method: "POST" }),
    "Không thể kết thúc hội thoại"
  ),
  read: (id: string) => apiFetch<number>(`/Chat/conversations/${encodeURIComponent(id)}/read`, { method: "POST" }),
  send: (id: string, content: string, attachment?: File) => {
    const body = new FormData();
    if (content.trim()) body.append("Content", content.trim());
    if (attachment) body.append("AttachmentFile", attachment);
    return requireData(apiFetch<ChatMessage>(`/Chat/conversations/${encodeURIComponent(id)}/messages`, { method: "POST", body }), "Không thể gửi tin nhắn");
  },
};
