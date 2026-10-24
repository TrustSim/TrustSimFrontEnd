import { apiFetch } from "./apiClient";
import { ensureFreshAccessToken } from "./authSession";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== "undefined" && window.location.protocol === "https:"
    ? "https://localhost:7120/api"
    : "http://localhost:5130/api");

export interface ChatConsultationRequest {
  sessionId?: string;
  message: string;
  userBirthYear?: number;
  userCareer?: string;
  budgetMin?: number;
  budgetMax?: number;
  fengShuiElement?: string;
}

export interface ConsultationSimSuggestion {
  simNumberId?: string;
  phoneNumber: string;
  price: number;
  carrierName: string;
  highlightReason: string;
}

export interface ChatConsultationStreamEvent {
  eventType: "session" | "token" | "tool_start" | "tool_end" | "suggested_sims" | "done" | "error";
  delta?: string;
  toolName?: string;
  toolSummary?: string;
  sessionId?: string;
  messageId?: string;
  suggestedSims?: ConsultationSimSuggestion[];
  referencedDocuments?: string[];
  referencedChunkIds?: string[];
  engineSource?: string;
  errorMessage?: string;
}

export interface ConsultationSessionDto {
  id: string;
  sessionTitle: string;
  targetBudgetMin?: number;
  targetBudgetMax?: number;
  userBirthYear?: number;
  userCareer?: string;
  fengShuiElement?: string;
  createdDate: string;
  lastMessageDate?: string;
}

export interface ConsultationMessageDto {
  id: string;
  sessionId: string;
  senderRole: "USER" | "ASSISTANT";
  messageContent: string;
  suggestedSims?: ConsultationSimSuggestion[];
  referencedDocuments?: string[];
  createdDate: string;
}

/**
 * Gửi tin nhắn và nhận phản hồi dạng SSE Streaming theo thời gian thực (ChatGPT-style)
 */
export async function streamChatConsultation(
  request: ChatConsultationRequest,
  onEvent: (event: ChatConsultationStreamEvent) => void,
  signal?: AbortSignal
): Promise<void> {
  const url = `${API_BASE_URL}/ai/consultant/chat/stream`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  const token = await ensureFreshAccessToken(60);
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(request),
    signal,
    credentials: "include",
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(errText || `Lỗi kết nối máy chủ AI (${response.status})`);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error("Trình duyệt không hỗ trợ đọc luồng dữ liệu (ReadableStream).");
  }

  const decoder = new TextDecoder("utf-8");
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // SSE packets are separated by \n\n
      const messages = buffer.split("\n\n");
      buffer = messages.pop() || ""; // Giữ lại phần chưa trọn vẹn trong buffer

      for (const rawMessage of messages) {
        if (!rawMessage.trim()) continue;

        let eventType = "token";
        let dataStr = "";

        const lines = rawMessage.split("\n");
        for (const line of lines) {
          if (line.startsWith("event:")) {
            eventType = line.replace("event:", "").trim();
          } else if (line.startsWith("data:")) {
            dataStr = line.replace("data:", "").trim();
          }
        }

        if (dataStr) {
          try {
            const parsedData = JSON.parse(dataStr);
            onEvent({
              eventType: (parsedData.eventType || eventType) as any,
              ...parsedData,
            });
          } catch {
            // Trường hợp data là chuỗi thuần hoặc định dạng đặc biệt
            onEvent({
              eventType: eventType as any,
              delta: dataStr,
            });
          }
        }
      }
    }

    // Kết thúc luồng
    onEvent({ eventType: "done" });
  } finally {
    reader.releaseLock();
  }
}

/**
 * Gửi tin nhắn đồng bộ (Fallback khi không dùng streaming)
 */
export async function syncChatConsultation(request: ChatConsultationRequest) {
  const res = await apiFetch<any>("ai/consultant/chat", {
    method: "POST",
    body: JSON.stringify(request),
  });
  return res.data;
}

/**
 * Lấy danh sách các phiên tư vấn đã lưu của người dùng
 */
export async function getConsultationSessions(): Promise<ConsultationSessionDto[]> {
  const res = await apiFetch<ConsultationSessionDto[]>("ai/consultant/sessions", {
    method: "GET",
  });
  return res.data || [];
}

/**
 * Lấy toàn bộ tin nhắn trong một phiên tư vấn
 */
export async function getSessionMessages(sessionId: string): Promise<ConsultationMessageDto[]> {
  const res = await apiFetch<ConsultationMessageDto[]>(`ai/consultant/sessions/${sessionId}/messages`, {
    method: "GET",
  });
  return res.data || [];
}
