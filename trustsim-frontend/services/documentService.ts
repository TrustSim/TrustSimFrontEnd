import { apiFetch } from "./apiClient";

// --- DTOs (mirror backend DocumentsController) ---
export interface DocumentDto {
  id: string;
  documentName: string;
  linkUrl: string;
  createdDate: string;
}

export interface CreateDocumentPayload {
  documentName: string;
  linkUrl: string;
}

export interface UpdateDocumentPayload {
  id?: string;
  documentName: string;
  linkUrl: string;
}

// --- API Calls ---

/**
 * Lấy danh sách tài liệu / quy chế sàn / chính sách
 */
export async function getDocuments(activeOnly: boolean = false): Promise<DocumentDto[]> {
  const query = activeOnly ? "?activeOnly=true" : "?activeOnly=false";
  const res = await apiFetch<DocumentDto[]>(`/Documents${query}`);
  return res.data ?? [];
}

/**
 * Lấy chi tiết tài liệu theo ID
 */
export async function getDocumentById(id: string): Promise<DocumentDto> {
  const res = await apiFetch<DocumentDto>(`/Documents/${id}`);
  if (!res.data) {
    throw new Error(res.message || "Không tìm thấy thông tin tài liệu.");
  }
  return res.data;
}

/**
 * [Admin] Tạo văn bản điều khoản / chính sách mới
 */
export async function createDocument(payload: CreateDocumentPayload): Promise<DocumentDto> {
  const res = await apiFetch<DocumentDto>("/Documents", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (!res.data) {
    throw new Error(res.message || "Tạo văn bản điều khoản thất bại.");
  }
  return res.data;
}

/**
 * [Admin] Cập nhật văn bản điều khoản / chính sách
 */
export async function updateDocument(
  id: string,
  payload: UpdateDocumentPayload
): Promise<DocumentDto> {
  const res = await apiFetch<DocumentDto>(`/Documents/${id}`, {
    method: "PUT",
    body: JSON.stringify({ ...payload, id }),
  });
  if (!res.data) {
    throw new Error(res.message || "Cập nhật văn bản điều khoản thất bại.");
  }
  return res.data;
}

/**
 * [Admin] Xóa (xóa mềm) tài liệu / chính sách
 */
export async function deleteDocument(id: string): Promise<boolean> {
  const res = await apiFetch<boolean>(`/Documents/${id}`, {
    method: "DELETE",
  });
  return res.data ?? res.success ?? false;
}

// --- AI Documents (RAG Ingestion Pipeline) ---

export type DocumentTypeEnum =
  | "MARKET_RESEARCH"
  | "FENG_SHUI_RULE"
  | "PRICING_GUIDELINE"
  | "GENERAL";

export type DocumentStatusEnum =
  | "PENDING"
  | "CRAWLING"
  | "PROCESSING"
  | "INDEXED"
  | "FAILED";

export interface IngestDocumentResponseDto {
  documentId: string;
  documentName: string;
  linkUrl: string;
  documentType: DocumentTypeEnum | number | string;
  status: DocumentStatusEnum | number | string;
  totalChunks: number;
  totalTokens: number;
  crawledAt?: string | null;
  errorMessage?: string | null;
}

export interface IngestDocumentPayload {
  documentName: string;
  linkUrl: string;
  documentType: DocumentTypeEnum | string;
}

/**
 * [Admin] Nạp tài liệu từ URL để chạy RAG Ingestion Pipeline (cào dữ liệu + sinh vector nhúng)
 */
export async function ingestDocumentFromUrl(
  payload: IngestDocumentPayload
): Promise<IngestDocumentResponseDto> {
  const res = await apiFetch<IngestDocumentResponseDto>("/ai/documents/ingest", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (!res.data) {
    throw new Error(res.message || "Yêu cầu nạp tài liệu từ URL thất bại.");
  }
  return res.data;
}

/**
 * [Admin] Tải lên trực tiếp tệp tài liệu (PDF, TXT, MD, DOCX, CSV) để chạy RAG Ingestion Pipeline
 */
export async function uploadDocumentFile(
  formData: FormData
): Promise<IngestDocumentResponseDto> {
  const res = await apiFetch<IngestDocumentResponseDto>("/ai/documents/upload", {
    method: "POST",
    body: formData,
  });
  if (!res.data) {
    throw new Error(res.message || "Tải lên tệp tài liệu thất bại.");
  }
  return res.data;
}

/**
 * [Admin] Kiểm tra tiến độ xử lý và số lượng vector chunks đã tạo của tài liệu
 */
export async function getDocumentIngestStatus(
  id: string
): Promise<IngestDocumentResponseDto> {
  const res = await apiFetch<IngestDocumentResponseDto>(`/ai/documents/${id}/status`);
  if (!res.data) {
    throw new Error(res.message || "Không thể lấy trạng thái xử lý tài liệu.");
  }
  return res.data;
}
